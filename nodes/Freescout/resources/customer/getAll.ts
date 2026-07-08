import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['customer'], operation: ['getAll'] };

export const customerGetAllDescription: INodeProperties[] = [
	...paginationFields('customer', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '', routing: { send: { type: 'query', property: 'email' } } },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'query', property: 'firstName' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'query', property: 'lastName' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'query', property: 'phone' } } },
			{ displayName: 'Sort Field', name: 'sortField', type: 'string', default: '', description: 'CreatedAt, firstName, lastName, updatedAt', routing: { send: { type: 'query', property: 'sortField' } } },
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'options', options: [{ name: 'Desc', value: 'desc' }, { name: 'Asc', value: 'asc' }], default: 'desc', routing: { send: { type: 'query', property: 'sortOrder' } } },
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
			request: { method: 'GET', url: '/customers' },
			output: { postReceive: [embeddedPostReceive('customers')] },
		},
	},
];
