import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FreescoutApi implements ICredentialType {
	name = 'freescoutApi';

	displayName = 'FreeScout API';

	documentationUrl = 'https://github.com/joernbungartz/n8n-nodes-freescout#credentials';

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
			displayName: 'App Key',
			name: 'appKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			description:
				"Your FreeScout instance APP_KEY from its .env (include the 'base64:' prefix). Only used by the FreeScout Trigger node to verify webhook signatures. Leave blank to accept webhook deliveries without signature verification.",
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
