import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['update'] };

export const customerUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Company', name: 'company', type: 'string', default: '', routing: { send: { type: 'body', property: 'company' } } },
			{ displayName: 'Emails Add (JSON)', name: 'emails_add', type: 'json', default: '[]', description: 'Emails to add, e.g. ["a@x.io"]', routing: { send: { type: 'body', property: 'emails_add' } } },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'body', property: 'firstName' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'body', property: 'lastName' } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', routing: { send: { type: 'body', property: 'notes' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
		],
	},
];
