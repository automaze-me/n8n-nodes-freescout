import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['updateCustomFields'] };

export const conversationUpdateCustomFieldsDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}/custom_fields' } },
	},
	{
		displayName: 'Custom Fields',
		name: 'customFields',
		type: 'json',
		default: '=[{ "id": 1, "value": "Some text" }]',
		displayOptions: { show },
		description: 'Array of { id, value }. Requires the CustomFields FreeScout module.',
		routing: { send: { type: 'body', property: 'customFields' } },
	},
];
