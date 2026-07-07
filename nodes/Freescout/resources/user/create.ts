import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['user'], operation: ['create'] };

export const userCreateDescription: INodeProperties[] = [
	{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', required: true, displayOptions: { show }, routing: { request: { method: 'POST', url: '/users' }, send: { type: 'body', property: 'firstName' } } },
	{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', required: true, displayOptions: { show }, routing: { send: { type: 'body', property: 'lastName' } } },
	{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '', required: true, displayOptions: { show }, routing: { send: { type: 'body', property: 'email' } } },
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '', routing: { send: { type: 'body', property: 'password' } } },
			{ displayName: 'Alternate Emails', name: 'alternateEmails', type: 'string', default: '', description: 'Comma separated', routing: { send: { type: 'body', property: 'alternateEmails' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
			{ displayName: 'Timezone', name: 'timezone', type: 'string', default: '', placeholder: 'Europe/Paris', routing: { send: { type: 'body', property: 'timezone' } } },
			{ displayName: 'Photo URL', name: 'photoUrl', type: 'string', default: '', routing: { send: { type: 'body', property: 'photoUrl' } } },
		],
	},
];
