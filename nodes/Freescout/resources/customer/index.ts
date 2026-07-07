import type { INodeProperties } from 'n8n-workflow';
import { customerCreateDescription } from './create';
import { customerGetDescription } from './get';
import { customerGetAllDescription } from './getAll';
import { customerUpdateDescription } from './update';
import { customerUpdateFieldsDescription } from './updateFields';
import { customerGetOrganizationDescription } from './getOrganization';
import { customerSetOrganizationDescription } from './setOrganization';
import { customerRemoveOrganizationDescription } from './removeOrganization';

const show = { resource: ['customer'] };

export const customerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a customer' },
			{ name: 'Get', value: 'get', action: 'Get a customer' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many customers' },
			{ name: 'Update', value: 'update', action: 'Update a customer' },
			{ name: 'Update Customer Fields', value: 'updateCustomerFields', action: 'Update customer fields' },
			{ name: 'Get Organization', value: 'getOrganization', action: 'Get customer organization' },
			{ name: 'Set Organization', value: 'setOrganization', action: 'Set customer organization' },
			{ name: 'Remove Organization', value: 'removeOrganization', action: 'Remove customer organization' },
		],
		default: 'create',
	},
	...customerCreateDescription,
	...customerGetDescription,
	...customerGetAllDescription,
	...customerUpdateDescription,
	...customerUpdateFieldsDescription,
	...customerGetOrganizationDescription,
	...customerSetOrganizationDescription,
	...customerRemoveOrganizationDescription,
];
