import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhook'], operation: ['create'] };

export const WEBHOOK_EVENTS: Array<{ name: string; value: string }> = [
	{ name: 'Conversation Assigned', value: 'convo.assigned' },
	{ name: 'Conversation Created', value: 'convo.created' },
	{ name: 'Conversation Deleted', value: 'convo.deleted' },
	{ name: 'Conversation Deleted Forever', value: 'convo.deleted_forever' },
	{ name: 'Conversation Restored', value: 'convo.restored' },
	{ name: 'Conversation Moved', value: 'convo.moved' },
	{ name: 'Conversation Status Changed', value: 'convo.status' },
	{ name: 'Customer Reply Created', value: 'convo.customer.reply.created' },
	{ name: 'Agent Reply Created', value: 'convo.agent.reply.created' },
	{ name: 'Note Created', value: 'convo.note.created' },
	{ name: 'Customer Created', value: 'customer.created' },
	{ name: 'Customer Updated', value: 'customer.updated' },
];

export const webhookCreateDescription: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'URL that will be called when any of the events occur',
		routing: {
			request: { method: 'POST', url: '/webhooks' },
			send: { type: 'body', property: 'url' },
		},
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: WEBHOOK_EVENTS,
		default: [],
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'events' } },
	},
];
