import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['getOrganization'] };

export const customerGetOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "Get the customer's organization membership (requires the CRM module)",
		routing: { request: { method: 'GET', url: '=/customers/{{$value}}/organization' } },
	},
];
