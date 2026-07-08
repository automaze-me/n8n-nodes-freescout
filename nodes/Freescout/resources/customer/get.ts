import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['customer'], operation: ['get'] };

export const customerGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/customers/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('customers')] },
		},
	},
];
