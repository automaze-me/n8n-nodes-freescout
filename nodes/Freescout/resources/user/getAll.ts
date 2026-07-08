import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['user'], operation: ['getAll'] };

export const userGetAllDescription: INodeProperties[] = [
	...paginationFields('user', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string',
																																										placeholder: 'name@email.com', default: '', routing: { send: { type: 'query', property: 'email' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/users' },
			output: { postReceive: [embeddedPostReceive('users')] },
		},
	},
];
