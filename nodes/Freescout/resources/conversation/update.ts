import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['update'] };

export const conversationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}' } },
	},
	{
		displayName: 'By User (User ID)',
		name: 'byUser',
		type: 'number',
		default: 0,
		displayOptions: { show },
		description: 'Required when changing status, assignee or mailbox',
		routing: { send: { type: 'body', property: 'byUser' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Assign To (User ID)', name: 'assignTo', type: 'number', default: 0, routing: { send: { type: 'body', property: 'assignTo' } } },
			{ displayName: 'Customer ID', name: 'customerId', type: 'number', default: 0, routing: { send: { type: 'body', property: 'customerId' } } },
			{ displayName: 'Mailbox ID', name: 'mailboxId', type: 'number', default: 0, routing: { send: { type: 'body', property: 'mailboxId' } } },
			{ displayName: 'Status', name: 'status', type: 'options', options: [{ name: 'Active', value: 'active' }, { name: 'Pending', value: 'pending' }, { name: 'Closed', value: 'closed' }, { name: 'Spam', value: 'spam' }], default: 'active', routing: { send: { type: 'body', property: 'status' } } },
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '', routing: { send: { type: 'body', property: 'subject' } } },
		],
	},
];
