import type { INodeProperties } from 'n8n-workflow';
import { threadCreateDescription } from './create';

const show = { resource: ['thread'] };

export const threadDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [{ name: 'Create', value: 'create', action: 'Create a thread' }],
		default: 'create',
	},
	...threadCreateDescription,
];
