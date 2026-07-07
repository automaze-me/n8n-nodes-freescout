import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['delete'] };

export const conversationDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/conversations/{{$value}}' } },
	},
];
