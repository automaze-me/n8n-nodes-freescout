import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['webhook'], operation: ['getAll'] };

export const webhookGetAllDescription: INodeProperties[] = [
	...paginationFields('webhook', 'getAll'),
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/webhooks' },
			output: { postReceive: [embeddedPostReceive('webhooks')] },
		},
	},
];
