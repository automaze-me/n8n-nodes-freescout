import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['tag'], operation: ['getAll'] };

export const tagGetAllDescription: INodeProperties[] = [
	...paginationFields('tag', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Conversation ID', name: 'conversationId', type: 'string', default: '', description: 'Only tags on this conversation', routing: { send: { type: 'query', property: 'conversationId' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/tags' },
			output: { postReceive: [embeddedPostReceive('tags')] },
		},
	},
];
