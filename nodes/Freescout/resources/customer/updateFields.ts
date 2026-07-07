import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['updateCustomerFields'] };

export const customerUpdateFieldsDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}/customer_fields' } },
	},
	{
		displayName: 'Customer Fields',
		name: 'customerFields',
		type: 'json',
		default: '=[{ "id": 1, "value": "Test value" }]',
		displayOptions: { show },
		description: 'Array of { id, value }. Requires the CustomFields FreeScout module.',
		routing: { send: { type: 'body', property: 'customerFields' } },
	},
];
