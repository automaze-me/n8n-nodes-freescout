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
		displayName: 'Thread Input',
		name: 'threadInputMode',
		type: 'options',
		noDataExpression: true,
		options: [
			{ name: 'Fields', value: 'fields', description: 'Define threads with the fields below' },
			{ name: 'JSON', value: 'json', description: 'Provide a raw threads array as JSON' },
		],
		default: 'fields',
		displayOptions: { show },
		description: "How to define the conversation's initial thread(s)",
	},
	{
		displayName: 'Threads',
		name: 'threadsUi',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true, sortable: true },
		placeholder: 'Add Thread',
		default: {},
		displayOptions: { show: { ...show, threadInputMode: ['fields'] } },
		description: 'At least one thread is required. The newest thread goes first.',
		options: [
			{
				name: 'thread',
				displayName: 'Thread',
				// Fields are kept alphabetical by displayName to satisfy the n8n
				// lint rule (node-param-fixed-collection-type-unsorted-items).
				// NOTE: do not run `n8n-node lint --fix` on this file — its
				// fixed-collection sort fixer is destructive (it strips
				// displayOptions/typeOptions from these entries).
				values: [
					{
						displayName: 'BCC',
						name: 'bcc',
						type: 'string',
						typeOptions: { multipleValues: true },
						default: [],
						description: 'BCC email addresses',
					},
					{
						displayName: 'CC',
						name: 'cc',
						type: 'string',
						typeOptions: { multipleValues: true },
						default: [],
						description: 'CC email addresses',
					},
					{
						displayName: 'Customer Email',
						name: 'customerEmail',
						type: 'string',
						placeholder: 'name@email.com',
						default: '',
						displayOptions: { show: { type: ['customer'] } },
						description:
							'Customer sending the reply; defaults to the conversation customer if left blank',
					},
					{
						displayName: 'Imported',
						name: 'imported',
						type: 'boolean',
						default: false,
						description: 'Whether to suppress outgoing emails and notifications for this thread',
					},
					{
						displayName: 'State',
						name: 'state',
						type: 'options',
						options: [
							{ name: 'Published', value: 'published' },
							{ name: 'Draft', value: 'draft' },
						],
						default: 'published',
					},
					{
						displayName: 'Text',
						name: 'text',
						type: 'string',
						typeOptions: { rows: 3 },
						default: '',
						description: 'The thread body',
					},
					{
						displayName: 'Type',
						name: 'type',
						type: 'options',
						options: [
							{ name: 'Message (User Reply)', value: 'message' },
							{ name: 'Note (Internal Note)', value: 'note' },
							{ name: 'Customer (Customer Reply)', value: 'customer' },
						],
						default: 'message',
					},
					{
						displayName: 'User ID',
						name: 'user',
						type: 'number',
						default: 0,
						displayOptions: { show: { type: ['message', 'note'] } },
						description: 'ID of the agent adding the thread (required for message/note)',
					},
				],
			},
		],
	},
	{
		displayName: 'Threads (JSON)',
		name: 'threadsJson',
		type: 'json',
		default: '=[{ "text": "Message body", "type": "message", "user": 1 }]',
		displayOptions: { show: { ...show, threadInputMode: ['json'] } },
		description:
			'Raw threads array (newest first). Each: {text, type: customer|message|note, user or customer}.',
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
