import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FreescoutApi implements ICredentialType {
	name = 'freescoutApi';

	icon = { light: 'file:freescout.svg', dark: 'file:freescout.dark.svg' } as const;

	displayName = 'FreeScout API';

	documentationUrl = 'https://github.com/automaze-me/n8n-nodes-freescout#credentials';

	properties: INodeProperties[] = [
		{
			displayName: 'FreeScout URL',
			name: 'baseUrl',
			type: 'string',
			required: true,
			default: '',
			placeholder: 'https://support.example.com',
			description: 'Base URL of your FreeScout installation (without trailing slash or /api)',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			required: true,
			default: '',
			description: 'API key from FreeScout → Manage → API Keys',
		},
		{
			displayName: 'Webhook Secret Key',
			name: 'webhookSecret',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				'The Secret Key shown in FreeScout under Manage → API & Webhooks. Used only by the FreeScout Trigger node to verify webhook signatures. Leave blank to accept webhook deliveries without signature verification.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				'X-FreeScout-API-Key': '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}/api',
			url: '/mailboxes',
			method: 'GET',
		},
	};
}
