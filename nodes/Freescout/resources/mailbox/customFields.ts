import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['mailbox'], operation: ['getCustomFields'] };

export const mailboxCustomFieldsDescription: INodeProperties[] = [
	{
		displayName: 'Mailbox ID',
		name: 'mailboxId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Requires the CustomFields FreeScout module',
		routing: {
			request: { method: 'GET', url: '=/mailboxes/{{$value}}/custom_fields' },
			output: { postReceive: [embeddedPostReceive('customFields')] },
		},
	},
];
