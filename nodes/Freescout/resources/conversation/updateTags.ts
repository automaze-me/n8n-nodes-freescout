import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['updateTags'] };

export const conversationUpdateTagsDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}/tags' } },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		typeOptions: { multipleValues: true },
		default: [],
		displayOptions: { show },
		description: 'List of tag names to apply (replaces existing tags)',
		routing: { send: { type: 'body', property: 'tags' } },
	},
];
