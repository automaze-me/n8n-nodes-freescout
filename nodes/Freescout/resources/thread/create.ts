import type { INodeProperties } from 'n8n-workflow';
import { presendThreadBody } from '../../GenericFunctions';

const show = { resource: ['thread'], operation: ['create'] };

export const threadCreateDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '=/conversations/{{$value}}/threads' },
			send: { preSend: [presendThreadBody] },
		},
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Message (User Reply)', value: 'message' },
			{ name: 'Note (User Note)', value: 'note' },
			{ name: 'Customer (Customer Reply)', value: 'customer' },
		],
		default: 'message',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'text' } },
	},
	{
		displayName: 'User ID',
		name: 'user',
		type: 'number',
		default: 0,
		displayOptions: { show: { ...show, type: ['message', 'note'] } },
		description: 'ID of the user adding the thread (required for message/note)',
		routing: { send: { type: 'body', property: 'user' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Status', name: 'status', type: 'options', options: [{ name: 'Active', value: 'active' }, { name: 'Pending', value: 'pending' }, { name: 'Closed', value: 'closed' }], default: 'active', routing: { send: { type: 'body', property: 'status' } } },
			{ displayName: 'State', name: 'state', type: 'options', options: [{ name: 'Published', value: 'published' }, { name: 'Draft', value: 'draft' }], default: 'published', routing: { send: { type: 'body', property: 'state' } } },
			{ displayName: 'CC', name: 'cc', type: 'string', typeOptions: { multipleValues: true }, default: [], routing: { send: { type: 'body', property: 'cc' } } },
			{ displayName: 'BCC', name: 'bcc', type: 'string', typeOptions: { multipleValues: true }, default: [], routing: { send: { type: 'body', property: 'bcc' } } },
			{ displayName: 'Imported', name: 'imported', type: 'boolean', default: false, routing: { send: { type: 'body', property: 'imported' } } },
			{ displayName: 'Attachments (JSON)', name: 'attachments', type: 'json', default: '[]', description: 'Array of { fileName, mimeType, data (base64) or fileUrl }', routing: { send: { type: 'body', property: 'attachments' } } },
		],
	},
];
