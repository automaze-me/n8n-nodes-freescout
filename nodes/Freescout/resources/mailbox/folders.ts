import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['mailbox'], operation: ['getFolders'] };

export const mailboxFoldersDescription: INodeProperties[] = [
	{
		displayName: 'Mailbox ID',
		name: 'mailboxId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/mailboxes/{{$value}}/folders' },
			output: { postReceive: [embeddedPostReceive('folders')] },
		},
	},
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		displayOptions: { show },
		description: 'Get folders belonging to the specified user',
		routing: { send: { type: 'query', property: 'userId' } },
	},
];
