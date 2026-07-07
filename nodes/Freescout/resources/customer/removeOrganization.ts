import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['removeOrganization'] };

export const customerRemoveOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Remove the customer from its organization (requires the CRM module)',
		routing: { request: { method: 'DELETE', url: '=/customers/{{$value}}/organization' } },
	},
];
