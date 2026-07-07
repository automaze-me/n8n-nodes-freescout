import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['user'], operation: ['get'] };

export const userGetDescription: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/users/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('users')] },
		},
	},
];
