import type { INodeProperties } from 'n8n-workflow';
import { webhookCreateDescription } from './create';
import { webhookGetAllDescription } from './getAll';
import { webhookDeleteDescription } from './delete';

const show = { resource: ['webhook'] };

export const webhookDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a webhook' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many webhooks' },
			{ name: 'Delete', value: 'delete', action: 'Delete a webhook' },
		],
		default: 'create',
	},
	...webhookCreateDescription,
	...webhookGetAllDescription,
	...webhookDeleteDescription,
];
