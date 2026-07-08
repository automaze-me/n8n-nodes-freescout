import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['mailbox'], operation: ['getAll'] };

export const mailboxGetAllDescription: INodeProperties[] = [
	...paginationFields('mailbox', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'User ID', name: 'userId', type: 'string', default: '', description: 'Only mailboxes the user can access', routing: { send: { type: 'query', property: 'userId' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/mailboxes' },
			output: { postReceive: [embeddedPostReceive('mailboxes')] },
		},
	},
];
