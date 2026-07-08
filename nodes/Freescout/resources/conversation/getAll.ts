import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['conversation'], operation: ['getAll'] };

export const conversationGetAllDescription: INodeProperties[] = [
	...paginationFields('conversation', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Assigned To (User ID)', name: 'assignedTo', type: 'string', default: '', routing: { send: { type: 'query', property: 'assignedTo' } } },
			{ displayName: 'Created By Customer ID', name: 'createdByCustomerId', type: 'string', default: '', routing: { send: { type: 'query', property: 'createdByCustomerId' } } },
			{ displayName: 'Created By User ID', name: 'createdByUserId', type: 'string', default: '', routing: { send: { type: 'query', property: 'createdByUserId' } } },
			{ displayName: 'Created Since', name: 'createdSince', type: 'dateTime', default: '', routing: { send: { type: 'query', property: 'createdSince' } } },
			{ displayName: 'Customer Email', name: 'customerEmail', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerEmail' } } },
			{ displayName: 'Customer ID', name: 'customerId', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerId' } } },
			{ displayName: 'Customer Phone', name: 'customerPhone', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerPhone' } } },
			{ displayName: 'Embed', name: 'embed', type: 'string', default: '', description: 'Threads, timelogs, tags (comma-separated)', routing: { send: { type: 'query', property: 'embed' } } },
			{ displayName: 'Folder ID', name: 'folderId', type: 'string', default: '', routing: { send: { type: 'query', property: 'folderId' } } },
			{ displayName: 'Mailbox ID', name: 'mailboxId', type: 'string', default: '', routing: { send: { type: 'query', property: 'mailboxId' } } },
			{ displayName: 'Number', name: 'number', type: 'string', default: '', routing: { send: { type: 'query', property: 'number' } } },
			{ displayName: 'Sort Field', name: 'sortField', type: 'string', default: '', description: 'CreatedAt, mailboxId, number, subject, updatedAt, waitingSince', routing: { send: { type: 'query', property: 'sortField' } } },
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'options', options: [{ name: 'Desc', value: 'desc' }, { name: 'Asc', value: 'asc' }], default: 'desc', routing: { send: { type: 'query', property: 'sortOrder' } } },
			{ displayName: 'State', name: 'state', type: 'string', default: '', description: 'Draft, published, deleted', routing: { send: { type: 'query', property: 'state' } } },
			{ displayName: 'Status', name: 'status', type: 'string', default: '', description: 'Active, pending, closed, spam (comma-separated)', routing: { send: { type: 'query', property: 'status' } } },
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '', routing: { send: { type: 'query', property: 'subject' } } },
			{ displayName: 'Tag', name: 'tag', type: 'string', default: '', routing: { send: { type: 'query', property: 'tag' } } },
			{ displayName: 'Type', name: 'type', type: 'string', default: '', description: 'Email, phone, chat', routing: { send: { type: 'query', property: 'type' } } },
			{ displayName: 'Updated Since', name: 'updatedSince', type: 'dateTime', default: '', routing: { send: { type: 'query', property: 'updatedSince' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/conversations' },
			output: { postReceive: [embeddedPostReceive('conversations')] },
		},
	},
];
