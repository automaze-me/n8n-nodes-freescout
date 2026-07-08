import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organization'], operation: ['delete'] };

export const organizationDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/organizations/{{$value}}' } },
	},
];
