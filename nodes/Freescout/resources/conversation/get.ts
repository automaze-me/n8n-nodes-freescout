import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['conversation'], operation: ['get'] };

export const conversationGetDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/conversations/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('conversations')] },
		},
	},
	{
		displayName: 'Embed',
		name: 'embed',
		type: 'multiOptions',
		options: [
			{ name: 'Threads', value: 'threads' },
			{ name: 'Timelogs', value: 'timelogs' },
			{ name: 'Tags', value: 'tags' },
		],
		default: [],
		displayOptions: { show },
		routing: { send: { type: 'query', property: 'embed', value: '={{ $value.join(",") }}' } },
	},
];
