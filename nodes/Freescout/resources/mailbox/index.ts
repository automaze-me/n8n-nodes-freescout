import type { INodeProperties } from 'n8n-workflow';
import { mailboxGetAllDescription } from './getAll';
import { mailboxFoldersDescription } from './folders';
import { mailboxCustomFieldsDescription } from './customFields';

const show = { resource: ['mailbox'] };

export const mailboxDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Get Many', value: 'getAll', action: 'Get many mailboxes' },
			{ name: 'Get Folders', value: 'getFolders', action: 'Get mailbox folders' },
			{ name: 'Get Custom Fields', value: 'getCustomFields', action: 'Get mailbox custom fields' },
		],
		default: 'getAll',
	},
	...mailboxGetAllDescription,
	...mailboxFoldersDescription,
	...mailboxCustomFieldsDescription,
];
