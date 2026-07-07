import type { INodeProperties } from 'n8n-workflow';
import { organizationCreateDescription } from './create';
import { organizationGetDescription } from './get';
import { organizationGetAllDescription } from './getAll';
import { organizationUpdateDescription } from './update';
import { organizationDeleteDescription } from './delete';

const show = { resource: ['organization'] };

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create an organization' },
			{ name: 'Get', value: 'get', action: 'Get an organization' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many organizations' },
			{ name: 'Update', value: 'update', action: 'Update an organization' },
			{ name: 'Delete', value: 'delete', action: 'Delete an organization' },
		],
		default: 'create',
	},
	...organizationCreateDescription,
	...organizationGetDescription,
	...organizationGetAllDescription,
	...organizationUpdateDescription,
	...organizationDeleteDescription,
];
