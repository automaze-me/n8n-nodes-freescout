import {
	NodeConnectionTypes,
	NodeApiError,
	type IHookFunctions,
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	type IHttpRequestMethods,
	type IDataObject,
	type JsonObject,
} from 'n8n-workflow';
import { verifySignature } from './GenericFunctions';
import { WEBHOOK_EVENTS } from '../Freescout/resources/webhook/create';

async function freescoutApiRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('freescoutApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
	const options = {
		method,
		body,
		url: `${baseUrl}/api${resource}`,
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		json: true,
	};
	if (method === 'GET' || Object.keys(body).length === 0) delete (options as IDataObject).body;
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'freescoutApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

export class FreescoutTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FreeScout Trigger',
		name: 'freescoutTrigger',
		icon: { light: 'file:freescout.svg', dark: 'file:freescout.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow on FreeScout webhook events',
		defaults: { name: 'FreeScout Trigger' },
		usableAsTool: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'freescoutApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: WEBHOOK_EVENTS,
				default: [],
				description: 'FreeScout events that trigger the workflow',
			},
			{
				displayName:
					'Signature verification runs only if the "App Key" is set on the credential. Without it, deliveries are accepted unverified.',
				name: 'signatureNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const response = await freescoutApiRequest.call(this, 'GET', '/webhooks');
				const embedded = (response._embedded as IDataObject) ?? {};
				const list = (embedded.webhooks as IDataObject[]) ?? [];
				for (const hook of list) {
					if (hook.url === webhookUrl) {
						webhookData.webhookId = hook.id;
						return true;
					}
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const webhookData = this.getWorkflowStaticData('node');
				const response = await freescoutApiRequest.call(this, 'POST', '/webhooks', {
					url: webhookUrl,
					events,
				});
				const id = response.id ?? (response._embedded as IDataObject)?.id;
				if (!id) return false;
				webhookData.webhookId = id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return true;
				try {
					await freescoutApiRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}`);
				} catch {
					return false;
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const credentials = await this.getCredentials('freescoutApi');
		const appKey = (credentials.appKey as string) ?? '';
		const signature = req.headers['x-freescout-signature'] as string | undefined;
		const rawBody = (req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}))).toString('utf8');

		if (!verifySignature(rawBody, signature, appKey)) {
			const res = this.getResponseObject();
			res.status(403).send('Invalid signature');
			return { noWebhookResponse: true };
		}

		return { workflowData: [this.helpers.returnJsonArray(this.getBodyData())] };
	}
}
