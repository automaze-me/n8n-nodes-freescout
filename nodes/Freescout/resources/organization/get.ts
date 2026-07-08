import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['organization'], operation: ['get'] };

export const organizationGetDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/organizations/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('organizations')] },
		},
	},
];
