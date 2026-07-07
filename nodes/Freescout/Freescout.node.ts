import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { conversationDescription } from './resources/conversation';
import { threadDescription } from './resources/thread';
import { customerDescription } from './resources/customer';
import { organizationDescription } from './resources/organization';
import { userDescription } from './resources/user';
import { mailboxDescription } from './resources/mailbox';
import { tagDescription } from './resources/tag';
import { webhookDescription } from './resources/webhook';

export class Freescout implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FreeScout',
		name: 'freescout',
		icon: { light: 'file:freescout.svg', dark: 'file:freescout.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the FreeScout API',
		defaults: { name: 'FreeScout' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'freescoutApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Thread', value: 'thread' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'User', value: 'user' },
					{ name: 'Mailbox', value: 'mailbox' },
					{ name: 'Tag', value: 'tag' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'conversation',
			},
			...conversationDescription,
			...threadDescription,
			...customerDescription,
			...organizationDescription,
			...userDescription,
			...mailboxDescription,
			...tagDescription,
			...webhookDescription,
		],
	};
}
