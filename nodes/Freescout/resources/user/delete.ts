import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['user'], operation: ['delete'] };

export const userDeleteDescription: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/users/{{$value}}' } },
	},
	{
		displayName: 'By User ID',
		name: 'byUserId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		description: 'ID of the user performing the deletion',
		routing: { send: { type: 'query', property: 'byUserId' } },
	},
];
