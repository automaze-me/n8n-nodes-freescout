import type { INodeProperties } from 'n8n-workflow';
import { conversationCreateDescription } from './create';
import { conversationGetDescription } from './get';
import { conversationGetAllDescription } from './getAll';
import { conversationUpdateDescription } from './update';
import { conversationDeleteDescription } from './delete';
import { conversationUpdateTagsDescription } from './updateTags';
import { conversationUpdateCustomFieldsDescription } from './updateCustomFields';
import { conversationTimelogsDescription } from './timelogs';

const show = { resource: ['conversation'] };

export const conversationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a conversation' },
			{ name: 'Delete', value: 'delete', action: 'Delete a conversation' },
			{ name: 'Get', value: 'get', action: 'Get a conversation' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many conversations' },
			{ name: 'Get Timelogs', value: 'getTimelogs', action: 'Get conversation timelogs' },
			{ name: 'Update', value: 'update', action: 'Update a conversation' },
			{ name: 'Update Custom Fields', value: 'updateCustomFields', action: 'Update conversation custom fields' },
			{ name: 'Update Tags', value: 'updateTags', action: 'Update conversation tags' },
		],
		default: 'create',
	},
	...conversationCreateDescription,
	...conversationGetDescription,
	...conversationGetAllDescription,
	...conversationUpdateDescription,
	...conversationDeleteDescription,
	...conversationUpdateTagsDescription,
	...conversationUpdateCustomFieldsDescription,
	...conversationTimelogsDescription,
];
