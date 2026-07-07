import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['create'] };

export const customerCreateDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: { show },
		description: 'Primary email (a customer needs at least an email or a first name)',
		routing: {
			request: { method: 'POST', url: '/customers' },
			send: { type: 'body', property: 'email' },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'body', property: 'firstName' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'body', property: 'lastName' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
			{ displayName: 'Company', name: 'company', type: 'string', default: '', routing: { send: { type: 'body', property: 'company' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', routing: { send: { type: 'body', property: 'notes' } } },
			{ displayName: 'Photo URL', name: 'photoUrl', type: 'string', default: '', routing: { send: { type: 'body', property: 'photoUrl' } } },
			{ displayName: 'Emails (JSON)', name: 'emails', type: 'json', default: '[]', description: 'e.g. [{ "value": "a@x.io", "type": "home" }]', routing: { send: { type: 'body', property: 'emails' } } },
			{ displayName: 'Phones (JSON)', name: 'phones', type: 'json', default: '[]', description: 'e.g. [{ "value": "777", "type": "home" }]', routing: { send: { type: 'body', property: 'phones' } } },
			{ displayName: 'Address (JSON)', name: 'address', type: 'json', default: '{}', description: 'e.g. { "city": "LA", "country": "US" }', routing: { send: { type: 'body', property: 'address' } } },
		],
	},
];
