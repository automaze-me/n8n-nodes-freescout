import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['setOrganization'] };

export const customerSetOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Assign/update the customer organization membership (requires the CRM module)',
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}/organization' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organizationId' } },
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		options: [
			{ name: 'Member', value: 'member' },
			{ name: 'Manager', value: 'manager' },
		],
		default: 'member',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'role' } },
	},
];
