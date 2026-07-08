import type { INodeProperties } from 'n8n-workflow';
import { presendOrganizationJson } from './create';

const show = { resource: ['organization'], operation: ['update'] };

export const organizationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'PUT', url: '=/organizations/{{$value}}' },
			send: { preSend: [presendOrganizationJson] },
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Additional Fields (JSON)',
		name: 'additionalFieldsJson',
		type: 'json',
		default: '{}',
		displayOptions: { show },
		description: 'Optional extra organization fields as a JSON object, merged into the request body',
	},
];
