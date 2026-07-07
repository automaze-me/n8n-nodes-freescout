import type { INodeProperties } from 'n8n-workflow';
import { userCreateDescription } from './create';
import { userGetDescription } from './get';
import { userGetAllDescription } from './getAll';
import { userDeleteDescription } from './delete';

const show = { resource: ['user'] };

export const userDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a user' },
			{ name: 'Get', value: 'get', action: 'Get a user' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many users' },
			{ name: 'Delete', value: 'delete', action: 'Delete a user' },
		],
		default: 'create',
	},
	...userCreateDescription,
	...userGetDescription,
	...userGetAllDescription,
	...userDeleteDescription,
];
