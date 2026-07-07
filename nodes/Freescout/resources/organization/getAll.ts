import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['organization'], operation: ['getAll'] };

export const organizationGetAllDescription: INodeProperties[] = [
	...paginationFields('organization', 'getAll'),
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/organizations' },
			output: { postReceive: [embeddedPostReceive('organizations')] },
		},
	},
];
