import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhook'], operation: ['delete'] };

export const webhookDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/webhooks/{{$value}}' } },
	},
];
