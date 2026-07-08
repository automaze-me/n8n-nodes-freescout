import type { INodeProperties } from 'n8n-workflow';
import { tagGetAllDescription } from './getAll';

const show = { resource: ['tag'] };

export const tagDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [{ name: 'Get Many', value: 'getAll', action: 'Get many tags' }],
		default: 'getAll',
	},
	...tagGetAllDescription,
];
