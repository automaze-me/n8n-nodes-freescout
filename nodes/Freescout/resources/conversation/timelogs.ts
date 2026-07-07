import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['conversation'], operation: ['getTimelogs'] };

export const conversationTimelogsDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/conversations/{{$value}}/timelogs' },
			output: { postReceive: [embeddedPostReceive('timelogs')] },
		},
	},
	...paginationFields('conversation', 'getTimelogs'),
];
