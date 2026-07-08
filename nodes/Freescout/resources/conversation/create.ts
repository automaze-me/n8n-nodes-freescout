import type { INodeProperties } from 'n8n-workflow';
import { presendConversationBody } from '../../GenericFunctions';

const show = { resource: ['conversation'], operation: ['create'] };

export const conversationCreateDescription: INodeProperties[] = [
	{
		displayName: 'Mailbox ID',
		name: 'mailboxId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'mailboxId' } },
		description: 'ID of the mailbox to create the conversation in',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Email', value: 'email' },
			{ name: 'Phone', value: 'phone' },
			{ name: 'Chat', value: 'chat' },
		],
		default: 'email',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'subject' } },
	},
	{
		displayName: 'Customer Email',
		name: 'customerEmail',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'customer.email' } },
		description: 'Email of the customer; a customer is created if none matches',
	},
	{
		displayName: 'Threads',
		name: 'threads',
		type: 'json',
		default:
			'=[{ "text": "Message body", "type": "message", "user": 1 }]',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'threads' } },
		description:
			'Array of threads (newest first). Each: {text, type: customer|message|note, user or customer}.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Assign To (User ID)',
				name: 'assignTo',
				type: 'number',
				default: 0,
				routing: { send: { type: 'body', property: 'assignTo' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Closed', value: 'closed' },
				],
				default: 'active',
				routing: { send: { type: 'body', property: 'status' } },
			},
			{
				displayName: 'Imported',
				name: 'imported',
				type: 'boolean',
				default: false,
				description:
					'Whether to suppress outgoing emails, notifications, auto replies and workflows',
				routing: { send: { type: 'body', property: 'imported' } },
			},
			{
				displayName: 'Created At',
				name: 'createdAt',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'createdAt' } },
			},
		],
	},
	{
		displayName: 'Send',
		name: 'presendMarker',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '/conversations' },
			send: { preSend: [presendConversationBody] },
		},
	},
];
