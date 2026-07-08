import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

const show = { resource: ['organization'], operation: ['create'] };

/** Merge the raw "Additional Fields (JSON)" parameter into the request body. */
export async function presendOrganizationJson(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const raw = this.getNodeParameter('additionalFieldsJson', '{}') as string;
	const body = (requestOptions.body as IDataObject) ?? {};
	if (raw && raw.trim() && raw.trim() !== '{}') {
		let parsed: IDataObject;
		try {
			parsed = JSON.parse(raw) as IDataObject;
		} catch (err) {
			throw new NodeOperationError(
				this.getNode(),
				`Invalid JSON in "Additional Fields (JSON)": ${(err as Error).message}`,
			);
		}
		requestOptions.body = { ...body, ...parsed };
	}
	return requestOptions;
}

export const organizationCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '/organizations' },
			send: { type: 'body', property: 'name', preSend: [presendOrganizationJson] },
		},
	},
	{
		displayName: 'Additional Fields (JSON)',
		name: 'additionalFieldsJson',
		type: 'json',
		default: '{}',
		displayOptions: { show },
		description:
			'Optional extra organization fields as a JSON object, merged into the request body (CRM module specific)',
	},
];
