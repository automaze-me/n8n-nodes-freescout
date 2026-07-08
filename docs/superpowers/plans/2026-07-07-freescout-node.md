# FreeScout n8n Node Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a comprehensive `n8n-nodes-freescout` community package: a declarative action node covering the full FreeScout API plus a webhook Trigger node with optional signature verification.

**Architecture:** One declarative action node (`Freescout`) using n8n `routing` for all CRUD across 7 resources, a shared `GenericFunctions.ts` for response-envelope unwrapping / pagination / pre-send body builders, one programmatic Trigger node (`FreescoutTrigger`) that registers/deletes FreeScout webhooks and optionally verifies the `X-FreeScout-Signature` HMAC, and a `FreescoutApi` credential holding a dynamic base URL + API key + optional app key.

**Tech Stack:** TypeScript, `n8n-workflow`, `@n8n/node-cli` (`n8n-node build`/`lint`/`dev`), **Vitest** for unit tests (the runner the official `@n8n/node-cli` standardizes on), Node's `crypto` for HMAC. Node built against `n8nNodesApiVersion: 1`, `strict: true`.

**Test runner:** Vitest, configured for Cloud-eligible strict mode. `n8n.strict` MUST stay `true` and `eslint.config.mjs` MUST remain the default (`export default config;`) — disabling strict forfeits n8n Cloud verification. n8n's lint bans importing `vitest` in any `.ts` file, so tests use **Vitest globals**: a root `vitest.config.mjs` (a `.mjs`, outside the `**/*.ts` lint glob) sets `test.globals: true`, and test files do NOT import from `'vitest'` (they use global `describe`/`it`/`expect`). Test files avoid `any` (use `as unknown as <Type>` with real `n8n-workflow` types). Build excludes test files (`tsconfig` `exclude`). `crypto`/`node:crypto` are allowlisted imports.

## Global Constraints

- Package name `n8n-nodes-freescout`; keep `n8n.strict: true`, `n8nNodesApiVersion: 1`.
- Credential machine name is exactly `freescoutApi`; action node name `freescout`; trigger node name `freescoutTrigger`.
- Auth header: `X-FreeScout-API-Key: {{$credentials.apiKey}}`. Base URL: `={{$credentials.baseUrl}}/api` (trailing slash on `baseUrl` stripped before use).
- Every list/`Get Many` response is unwrapped from `_embedded.<pluralKey>`; pagination envelope is `page: { size, totalElements, totalPages, number }` (1-based `number`).
- Webhook signature: `base64( HMAC-SHA1( rawBody, md5(appKey + 'webhook_key') ) )`, header `X-FreeScout-Signature`. Verification runs only when `appKey` is set.
- All new code must pass `npm run lint` and `npm run build` with zero errors/warnings.
- Update `package.json` `n8n.nodes` and `CHANGELOG.md` whenever nodes are added/changed.
- Use proper `n8n-workflow` types everywhere; no `any` unless unavoidable and commented.

## Authoritative API reference (confirmed from `~/freescout/Modules/ApiWebhooks`)

Routes (`Http/routes.php`), all prefixed `/api`:

```
POST   /conversations                      createConversation
GET    /conversations                      listConversations
GET    /conversations/{id}                 getConversation
PUT    /conversations/{id}                 updateConversation
DELETE /conversations/{id}                 deleteConversation
POST   /conversations/{id}/threads         createThread
PUT    /conversations/{id}/tags            updateTags
PUT    /conversations/{id}/custom_fields   updateCustomFields
GET    /conversations/{id}/timelogs        listTimelogs
POST   /customers                          createCustomer
GET    /customers                          listCustomers
GET    /customers/{id}                     getCustomer
PUT    /customers/{id}                     updateCustomer
PUT    /customers/{id}/customer_fields     updateCustomerFields
POST   /users                              createUser
GET    /users                              listUsers
GET    /users/{id}                         getUser
DELETE /users/{id}                         deleteUser
GET    /mailboxes                          listMailboxes
GET    /mailboxes/{id}/folders             mailboxFolders
GET    /mailboxes/{id}/custom_fields       mailboxCustomFields
GET    /tags                               listTags
GET    /webhooks                           listWebhooks
POST   /webhooks                           createWebhook
DELETE /webhooks/{id}                      deleteWebhook
```

There is **no** Organizations resource and **no** single Get-Mailbox route.

Field references are embedded in each resource task below (from the module's
`@bodyParam`/`@queryParam` apidoc annotations — the source of truth).

## File Structure

```
credentials/FreescoutApi.credentials.ts      credential: baseUrl + apiKey + appKey, auth, test
nodes/Freescout/Freescout.node.ts            action node: resource selector, requestDefaults, wires resources
nodes/Freescout/GenericFunctions.ts          shared: normalizeBaseUrl, embedded-unwrap postReceive, pagination, presend body builders
nodes/Freescout/resources/conversation/{index,create,get,getAll,update,delete,updateTags,updateCustomFields,timelogs}.ts
nodes/Freescout/resources/thread/{index,create}.ts
nodes/Freescout/resources/customer/{index,create,get,getAll,update,updateFields,getOrganization,setOrganization,removeOrganization}.ts
nodes/Freescout/resources/organization/{index,create,get,getAll,update,delete}.ts  (CRM module)
nodes/Freescout/resources/user/{index,create,get,getAll,delete}.ts
nodes/Freescout/resources/mailbox/{index,getAll,folders,customFields}.ts
nodes/Freescout/resources/tag/{index,getAll}.ts
nodes/Freescout/resources/webhook/{index,create,getAll,delete}.ts
nodes/FreescoutTrigger/FreescoutTrigger.node.ts   trigger: webhook lifecycle + signature verify
nodes/FreescoutTrigger/GenericFunctions.ts        computeSignature + verify helper
nodes/Freescout/__tests__/genericFunctions.test.ts
nodes/FreescoutTrigger/__tests__/signature.test.ts
package.json / CHANGELOG.md / README.md
```

The existing placeholder `resources/user/{get,create}.ts` and
`resources/company/*` are deleted and rebuilt per this structure.

---

### Task 1: Credential — dynamic base URL, API key, optional app key

**Files:**
- Modify: `credentials/FreescoutApi.credentials.ts`

**Interfaces:**
- Produces: credential `freescoutApi` with fields `baseUrl` (string), `apiKey` (string,password), `appKey` (string,password,optional). Consumed by both nodes.

- [ ] **Step 1: Rewrite the credential file**

```typescript
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
```

- [ ] **Step 2: Build to verify it compiles**

Run: `npm run build`
Expected: build succeeds, `dist/credentials/FreescoutApi.credentials.js` emitted.

- [ ] **Step 3: Commit**

```bash
git add credentials/FreescoutApi.credentials.ts
git commit -m "feat(credential): dynamic base URL, API key, optional app key"
```

---

### Task 2: GenericFunctions — URL normalization, embedded unwrap, pagination, body builders

**Files:**
- Create: `nodes/Freescout/GenericFunctions.ts`
- Create: `nodes/Freescout/__tests__/genericFunctions.test.ts`

**Interfaces:**
- Produces:
  - `normalizeBaseUrl(url: string): string` — strips trailing slashes.
  - `embeddedPostReceive(key: string)` — returns a declarative `postReceive` function that returns `responseData._embedded[key]` as items, or `[responseData]` for single objects, or `[]` when absent.
  - `buildCustomerObject(fields: IDataObject): IDataObject` — assembles a FreeScout customer object (firstName/lastName/email/phone/emails/phones/...).
  - `presendConversationBody` / `presendThreadBody` — `PreSendAction`s that assemble nested bodies from flat node parameters.
- Consumes: credential from Task 1.

- [ ] **Step 0: Set up Vitest**

Install the runner and wire the script + build exclusion:

```bash
npm install -D vitest
```

Add to `package.json` `scripts`: `"test": "vitest run"`.

Add an `exclude` array to `tsconfig.json` so tests never emit into `dist`:

```json
"exclude": ["**/*.test.ts", "**/__tests__/**", "dist", "node_modules"]
```

Verify: `npx vitest run` exits cleanly (reports "no test files" is fine at this point).

- [ ] **Step 1: Write failing tests**

```typescript
import { describe, it, expect } from 'vitest';
import { normalizeBaseUrl, buildCustomerObject } from '../GenericFunctions';

describe('normalizeBaseUrl', () => {
	it('strips a single trailing slash', () => {
		expect(normalizeBaseUrl('https://x.io/')).toBe('https://x.io');
	});
	it('strips multiple trailing slashes', () => {
		expect(normalizeBaseUrl('https://x.io///')).toBe('https://x.io');
	});
	it('leaves a clean url unchanged', () => {
		expect(normalizeBaseUrl('https://x.io')).toBe('https://x.io');
	});
});

describe('buildCustomerObject', () => {
	it('maps email into an emails array entry and keeps names', () => {
		expect(buildCustomerObject({ firstName: 'Mark', email: 'm@x.io' })).toEqual({
			firstName: 'Mark',
			email: 'm@x.io',
		});
	});
	it('drops empty values', () => {
		expect(buildCustomerObject({ firstName: 'Mark', lastName: '' })).toEqual({
			firstName: 'Mark',
		});
	});
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run nodes/Freescout/__tests__/genericFunctions.test.ts`
Expected: FAIL — module/functions not found.

- [ ] **Step 3: Implement `GenericFunctions.ts`**

```typescript
import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	IN8nHttpFullResponse,
	INodeExecutionData,
} from 'n8n-workflow';

export function normalizeBaseUrl(url: string): string {
	return (url ?? '').replace(/\/+$/, '');
}

/** Remove empty-string/null/undefined values from a flat object. */
function pruneEmpty(obj: IDataObject): IDataObject {
	const out: IDataObject = {};
	for (const [k, v] of Object.entries(obj)) {
		if (v !== '' && v !== null && v !== undefined) out[k] = v;
	}
	return out;
}

export function buildCustomerObject(fields: IDataObject): IDataObject {
	return pruneEmpty(fields);
}

/**
 * Declarative postReceive: unwrap FreeScout's HAL envelope.
 * List responses look like { _embedded: { conversations: [...] }, page: {...} }.
 * Single-object responses are returned as-is.
 */
export function embeddedPostReceive(key: string) {
	return async function (
		this: IExecuteSingleFunctions,
		_items: INodeExecutionData[],
		response: IN8nHttpFullResponse,
	): Promise<INodeExecutionData[]> {
		const body = response.body as IDataObject;
		const embedded = (body?._embedded as IDataObject) ?? {};
		const list = embedded[key];
		if (Array.isArray(list)) {
			return (list as IDataObject[]).map((json) => ({ json }));
		}
		if (body && typeof body === 'object' && '_embedded' in body) {
			return [];
		}
		return [{ json: body ?? {} }];
	};
}

/** Assemble the create-conversation body from flat node parameters. */
export async function presendConversationBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const body = (requestOptions.body as IDataObject) ?? {};
	const customer = buildCustomerObject((body.customer as IDataObject) ?? {});
	if (Object.keys(customer).length) body.customer = customer;
	requestOptions.body = pruneEmpty(body);
	return requestOptions;
}

/** Assemble the create-thread body from flat node parameters. */
export async function presendThreadBody(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	requestOptions.body = pruneEmpty((requestOptions.body as IDataObject) ?? {});
	return requestOptions;
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run nodes/Freescout/__tests__/genericFunctions.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add nodes/Freescout/GenericFunctions.ts nodes/Freescout/__tests__/genericFunctions.test.ts
git commit -m "feat(node): shared generic functions with tests"
```

---

### Task 3: Action node skeleton + shared pagination/limit fields

**Files:**
- Modify: `nodes/Freescout/Freescout.node.ts`
- Create: `nodes/Freescout/resources/shared.ts`

**Interfaces:**
- Produces:
  - `Freescout` node with `resource` options: `conversation`, `thread`, `customer`, `user`, `mailbox`, `tag`, `webhook`.
  - `paginationFields(resource, operation)` and `paginationRouting` — reusable `Return All` + `Limit` properties (page/pageSize) and the generic pagination operation. Consumed by every `getAll` operation.
- Consumes: resource `*Description` exports from Tasks 4–10 (imported as they are built).

- [ ] **Step 1: Create `resources/shared.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

/**
 * FreeScout paginates with page/pageSize (1-based) and returns
 * page.totalPages. This drives declarative "Return All" pagination.
 */
export const paginationOperation = {
	pagination: {
		type: 'generic' as const,
		properties: {
			continue: '={{ $response.body.page.number < $response.body.page.totalPages }}',
			request: {
				qs: {
					page: '={{ ($response.body.page.number || 0) + 1 }}',
				},
			},
		},
	},
};

export function paginationFields(resource: string, operation: string): INodeProperties[] {
	const show = { resource: [resource], operation: [operation] };
	return [
		{
			displayName: 'Return All',
			name: 'returnAll',
			type: 'boolean',
			default: false,
			description: 'Whether to return all results or only up to a given limit',
			displayOptions: { show },
			routing: {
				operations: paginationOperation,
				send: { paginate: '={{ $value }}' },
			},
		},
		{
			displayName: 'Limit',
			name: 'limit',
			type: 'number',
			default: 50,
			typeOptions: { minValue: 1 },
			description: 'Max number of results to return',
			displayOptions: { show: { ...show, returnAll: [false] } },
			routing: {
				send: { type: 'query', property: 'pageSize' },
				output: { maxResults: '={{ $value }}' },
			},
		},
	];
}
```

- [ ] **Step 2: Rewrite `Freescout.node.ts`**

```typescript
import { NodeConnectionTypes, type INodeType, type INodeTypeDescription } from 'n8n-workflow';
import { conversationDescription } from './resources/conversation';
import { threadDescription } from './resources/thread';
import { customerDescription } from './resources/customer';
import { organizationDescription } from './resources/organization';
import { userDescription } from './resources/user';
import { mailboxDescription } from './resources/mailbox';
import { tagDescription } from './resources/tag';
import { webhookDescription } from './resources/webhook';

export class Freescout implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FreeScout',
		name: 'freescout',
		icon: { light: 'file:freescout.svg', dark: 'file:freescout.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with the FreeScout API',
		defaults: { name: 'FreeScout' },
		usableAsTool: true,
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'freescoutApi', required: true }],
		requestDefaults: {
			baseURL: '={{$credentials.baseUrl.replace(/\\/$/, "")}}/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Conversation', value: 'conversation' },
					{ name: 'Thread', value: 'thread' },
					{ name: 'Customer', value: 'customer' },
					{ name: 'Organization', value: 'organization' },
					{ name: 'User', value: 'user' },
					{ name: 'Mailbox', value: 'mailbox' },
					{ name: 'Tag', value: 'tag' },
					{ name: 'Webhook', value: 'webhook' },
				],
				default: 'conversation',
			},
			...conversationDescription,
			...threadDescription,
			...customerDescription,
			...organizationDescription,
			...userDescription,
			...mailboxDescription,
			...tagDescription,
			...webhookDescription,
		],
	};
}
```

- [ ] **Step 3: Delete old placeholder resources**

```bash
git rm -r nodes/Freescout/resources/company
rm -f nodes/Freescout/resources/user/get.ts nodes/Freescout/resources/user/create.ts
```

(The `user` and remaining resource files are recreated in Tasks 4–10. The node will not build until those exist — Step 4 is deferred to Task 10.)

- [ ] **Step 4: Commit**

```bash
git add nodes/Freescout/Freescout.node.ts nodes/Freescout/resources/shared.ts
git commit -m "feat(node): action node skeleton, resource selector, shared pagination"
```

---

### Task 4: Conversation resource

**Files:**
- Create: `nodes/Freescout/resources/conversation/index.ts`
- Create: `create.ts`, `get.ts`, `getAll.ts`, `update.ts`, `delete.ts`, `updateTags.ts`, `updateCustomFields.ts`, `timelogs.ts` (all under `resources/conversation/`)

**Interfaces:**
- Consumes: `paginationFields` (Task 3), `embeddedPostReceive`, `presendConversationBody` (Task 2).
- Produces: `conversationDescription: INodeProperties[]` (imported by node in Task 3).

Field reference (from module apidoc):
- Create (POST /conversations): required `type`(email|phone|chat), `mailboxId`, `subject`, `customer`(object: id or email/phone/firstName), `threads`(array; each `{text,type,user|customer}`); optional `imported`, `assignTo`, `status`(active|pending|closed), `customFields`, `createdAt`, `closedAt`.
- Get (GET /conversations/{id}): query `embed` (threads,timelogs,tags).
- Get Many (GET /conversations): queryParams `mailboxId, folderId, status, state, type, assignedTo, customerEmail, customerPhone, customerId, number, subject, tag, createdByUserId, createdByCustomerId, createdSince, updatedSince, sortField, sortOrder, embed, page, pageSize`.
- Update (PUT /conversations/{id}): `byUser` (required when changing status/assignTo/mailboxId), `status`, `assignTo`, `mailboxId`, `customerId`, `subject`.
- Delete (DELETE /conversations/{id}).
- Update Tags (PUT /conversations/{id}/tags): `tags` (array of names).
- Update Custom Fields (PUT /conversations/{id}/custom_fields): `customFields` array of `{id,value}`.
- Timelogs (GET /conversations/{id}/timelogs).

- [ ] **Step 1: Create `create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { presendConversationBody } from '../../GenericFunctions';

const show = { resource: ['conversation'], operation: ['create'] };

export const conversationCreateDescription: INodeProperties[] = [
	{
		displayName: 'Mailbox ID',
		name: 'mailboxId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'mailboxId' } },
		description: 'ID of the mailbox to create the conversation in',
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Email', value: 'email' },
			{ name: 'Phone', value: 'phone' },
			{ name: 'Chat', value: 'chat' },
		],
		default: 'email',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Subject',
		name: 'subject',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'subject' } },
	},
	{
		displayName: 'Customer Email',
		name: 'customerEmail',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'customer.email' } },
		description: 'Email of the customer; a customer is created if none matches',
	},
	{
		displayName: 'Threads',
		name: 'threads',
		type: 'json',
		default:
			'=[{ "text": "Message body", "type": "message", "user": 1 }]',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'threads' } },
		description:
			'Array of threads (newest first). Each: {text, type: customer|message|note, user or customer}.',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{
				displayName: 'Assign To (User ID)',
				name: 'assignTo',
				type: 'number',
				default: 0,
				routing: { send: { type: 'body', property: 'assignTo' } },
			},
			{
				displayName: 'Status',
				name: 'status',
				type: 'options',
				options: [
					{ name: 'Active', value: 'active' },
					{ name: 'Pending', value: 'pending' },
					{ name: 'Closed', value: 'closed' },
				],
				default: 'active',
				routing: { send: { type: 'body', property: 'status' } },
			},
			{
				displayName: 'Imported',
				name: 'imported',
				type: 'boolean',
				default: false,
				description:
					'Whether to suppress outgoing emails, notifications, auto replies and workflows',
				routing: { send: { type: 'body', property: 'imported' } },
			},
			{
				displayName: 'Created At',
				name: 'createdAt',
				type: 'dateTime',
				default: '',
				routing: { send: { type: 'body', property: 'createdAt' } },
			},
		],
	},
	{
		displayName: 'Send',
		name: 'presendMarker',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '/conversations' },
			send: { preSend: [presendConversationBody] },
		},
	},
];
```

This `presendMarker` field is shown only for the create operation, so its
`request` routing (`POST /conversations`) applies only to create — never to
the other conversation operations, which carry their own routing on their ID
fields.

Note: the `threads` json string and `customer.email` dotted property are
assembled into the final nested body by `presendConversationBody`; the hidden
`presendMarker` attaches that preSend. During implementation, verify n8n emits
`customer.email` as nested — if it emits a literal dotted key, move the mapping
into `presendConversationBody` (read `$parameter` and build `customer`).

- [ ] **Step 2: Create `get.ts`**

```typescript
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
```

- [ ] **Step 3: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['conversation'], operation: ['getAll'] };

export const conversationGetAllDescription: INodeProperties[] = [
	...paginationFields('conversation', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Mailbox ID', name: 'mailboxId', type: 'string', default: '', routing: { send: { type: 'query', property: 'mailboxId' } } },
			{ displayName: 'Folder ID', name: 'folderId', type: 'string', default: '', routing: { send: { type: 'query', property: 'folderId' } } },
			{ displayName: 'Status', name: 'status', type: 'string', default: '', description: 'active, pending, closed, spam (comma separated)', routing: { send: { type: 'query', property: 'status' } } },
			{ displayName: 'State', name: 'state', type: 'string', default: '', description: 'draft, published, deleted', routing: { send: { type: 'query', property: 'state' } } },
			{ displayName: 'Type', name: 'type', type: 'string', default: '', description: 'email, phone, chat', routing: { send: { type: 'query', property: 'type' } } },
			{ displayName: 'Assigned To (User ID)', name: 'assignedTo', type: 'string', default: '', routing: { send: { type: 'query', property: 'assignedTo' } } },
			{ displayName: 'Customer Email', name: 'customerEmail', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerEmail' } } },
			{ displayName: 'Customer Phone', name: 'customerPhone', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerPhone' } } },
			{ displayName: 'Customer ID', name: 'customerId', type: 'string', default: '', routing: { send: { type: 'query', property: 'customerId' } } },
			{ displayName: 'Number', name: 'number', type: 'string', default: '', routing: { send: { type: 'query', property: 'number' } } },
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '', routing: { send: { type: 'query', property: 'subject' } } },
			{ displayName: 'Tag', name: 'tag', type: 'string', default: '', routing: { send: { type: 'query', property: 'tag' } } },
			{ displayName: 'Created Since', name: 'createdSince', type: 'dateTime', default: '', routing: { send: { type: 'query', property: 'createdSince' } } },
			{ displayName: 'Updated Since', name: 'updatedSince', type: 'dateTime', default: '', routing: { send: { type: 'query', property: 'updatedSince' } } },
			{ displayName: 'Sort Field', name: 'sortField', type: 'string', default: '', description: 'createdAt, mailboxId, number, subject, updatedAt, waitingSince', routing: { send: { type: 'query', property: 'sortField' } } },
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'options', options: [{ name: 'Desc', value: 'desc' }, { name: 'Asc', value: 'asc' }], default: 'desc', routing: { send: { type: 'query', property: 'sortOrder' } } },
			{ displayName: 'Embed', name: 'embed', type: 'string', default: '', description: 'threads, timelogs, tags (comma separated)', routing: { send: { type: 'query', property: 'embed' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/conversations' },
			output: { postReceive: [embeddedPostReceive('conversations')] },
		},
	},
];
```

- [ ] **Step 4: Create `update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['update'] };

export const conversationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}' } },
	},
	{
		displayName: 'By User (User ID)',
		name: 'byUser',
		type: 'number',
		default: 0,
		displayOptions: { show },
		description: 'Required when changing status, assignee or mailbox',
		routing: { send: { type: 'body', property: 'byUser' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Status', name: 'status', type: 'options', options: [{ name: 'Active', value: 'active' }, { name: 'Pending', value: 'pending' }, { name: 'Closed', value: 'closed' }, { name: 'Spam', value: 'spam' }], default: 'active', routing: { send: { type: 'body', property: 'status' } } },
			{ displayName: 'Assign To (User ID)', name: 'assignTo', type: 'number', default: 0, routing: { send: { type: 'body', property: 'assignTo' } } },
			{ displayName: 'Mailbox ID', name: 'mailboxId', type: 'number', default: 0, routing: { send: { type: 'body', property: 'mailboxId' } } },
			{ displayName: 'Customer ID', name: 'customerId', type: 'number', default: 0, routing: { send: { type: 'body', property: 'customerId' } } },
			{ displayName: 'Subject', name: 'subject', type: 'string', default: '', routing: { send: { type: 'body', property: 'subject' } } },
		],
	},
];
```

- [ ] **Step 5: Create `delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['delete'] };

export const conversationDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/conversations/{{$value}}' } },
	},
];
```

- [ ] **Step 6: Create `updateTags.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['updateTags'] };

export const conversationUpdateTagsDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}/tags' } },
	},
	{
		displayName: 'Tags',
		name: 'tags',
		type: 'string',
		typeOptions: { multipleValues: true },
		default: [],
		displayOptions: { show },
		description: 'List of tag names to apply (replaces existing tags)',
		routing: { send: { type: 'body', property: 'tags' } },
	},
];
```

- [ ] **Step 7: Create `updateCustomFields.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['conversation'], operation: ['updateCustomFields'] };

export const conversationUpdateCustomFieldsDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/conversations/{{$value}}/custom_fields' } },
	},
	{
		displayName: 'Custom Fields',
		name: 'customFields',
		type: 'json',
		default: '=[{ "id": 1, "value": "Some text" }]',
		displayOptions: { show },
		description: 'Array of { id, value }. Requires the CustomFields FreeScout module.',
		routing: { send: { type: 'body', property: 'customFields' } },
	},
];
```

- [ ] **Step 8: Create `timelogs.ts`**

```typescript
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
```

- [ ] **Step 9: Create `index.ts` (operation selector + assembly)**

```typescript
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
			{ name: 'Get', value: 'get', action: 'Get a conversation' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many conversations' },
			{ name: 'Update', value: 'update', action: 'Update a conversation' },
			{ name: 'Delete', value: 'delete', action: 'Delete a conversation' },
			{ name: 'Update Tags', value: 'updateTags', action: 'Update conversation tags' },
			{ name: 'Update Custom Fields', value: 'updateCustomFields', action: 'Update conversation custom fields' },
			{ name: 'Get Timelogs', value: 'getTimelogs', action: 'Get conversation timelogs' },
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
```

**Routing convention (applies to every resource):** never put `request`
routing on the `operation` property itself — it would apply to all operations.
Each operation sets its method+URL via `routing.request` on a property that is
shown only for that operation (the create route rides the create-only
`presendMarker`; `get`/`getAll`/`update`/`delete`/tags/customFields/timelogs
each carry it on their ID field or hidden "Operation Routing" marker). This
keeps exactly one `request` active per selected operation.

- [ ] **Step 10: Build**

Run: `npm run build`
Expected: compiles once sibling resources exist; if building before Task 10, expect only "cannot find module ./resources/thread" etc. — resolved by Task 10.

- [ ] **Step 11: Commit**

```bash
git add nodes/Freescout/resources/conversation
git commit -m "feat(node): conversation resource (all 8 operations)"
```

---

### Task 5: Thread resource

**Files:**
- Create: `nodes/Freescout/resources/thread/index.ts`, `create.ts`

**Interfaces:**
- Consumes: `presendThreadBody` (Task 2).
- Produces: `threadDescription: INodeProperties[]`.

Field reference (POST /conversations/{id}/threads): required `type`(customer|message|note), `text`; `user` required for message/note; `customer` required for customer type; optional `status`, `state`(draft|published), `to`,`cc`,`bcc` arrays, `imported`, `createdAt`, `attachments`.

- [ ] **Step 1: Create `create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { presendThreadBody } from '../../GenericFunctions';

const show = { resource: ['thread'], operation: ['create'] };

export const threadCreateDescription: INodeProperties[] = [
	{
		displayName: 'Conversation ID',
		name: 'conversationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '=/conversations/{{$value}}/threads' },
			send: { preSend: [presendThreadBody] },
		},
	},
	{
		displayName: 'Type',
		name: 'type',
		type: 'options',
		options: [
			{ name: 'Message (User Reply)', value: 'message' },
			{ name: 'Note (User Note)', value: 'note' },
			{ name: 'Customer (Customer Reply)', value: 'customer' },
		],
		default: 'message',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'type' } },
	},
	{
		displayName: 'Text',
		name: 'text',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'text' } },
	},
	{
		displayName: 'User ID',
		name: 'user',
		type: 'number',
		default: 0,
		displayOptions: { show: { ...show, type: ['message', 'note'] } },
		description: 'ID of the user adding the thread (required for message/note)',
		routing: { send: { type: 'body', property: 'user' } },
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Status', name: 'status', type: 'options', options: [{ name: 'Active', value: 'active' }, { name: 'Pending', value: 'pending' }, { name: 'Closed', value: 'closed' }], default: 'active', routing: { send: { type: 'body', property: 'status' } } },
			{ displayName: 'State', name: 'state', type: 'options', options: [{ name: 'Published', value: 'published' }, { name: 'Draft', value: 'draft' }], default: 'published', routing: { send: { type: 'body', property: 'state' } } },
			{ displayName: 'CC', name: 'cc', type: 'string', typeOptions: { multipleValues: true }, default: [], routing: { send: { type: 'body', property: 'cc' } } },
			{ displayName: 'BCC', name: 'bcc', type: 'string', typeOptions: { multipleValues: true }, default: [], routing: { send: { type: 'body', property: 'bcc' } } },
			{ displayName: 'Imported', name: 'imported', type: 'boolean', default: false, routing: { send: { type: 'body', property: 'imported' } } },
			{ displayName: 'Attachments (JSON)', name: 'attachments', type: 'json', default: '[]', description: 'Array of { fileName, mimeType, data (base64) or fileUrl }', routing: { send: { type: 'body', property: 'attachments' } } },
		],
	},
];
```

- [ ] **Step 2: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { threadCreateDescription } from './create';

const show = { resource: ['thread'] };

export const threadDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [{ name: 'Create', value: 'create', action: 'Create a thread' }],
		default: 'create',
	},
	...threadCreateDescription,
];
```

- [ ] **Step 3: Commit**

```bash
git add nodes/Freescout/resources/thread
git commit -m "feat(node): thread resource"
```

---

### Task 6: Customer resource

**Files:**
- Create: `nodes/Freescout/resources/customer/{index,create,get,getAll,update,updateFields,getOrganization,setOrganization,removeOrganization}.ts`

**Interfaces:**
- Consumes: `embeddedPostReceive`, `buildCustomerObject`, `paginationFields`.
- Produces: `customerDescription: INodeProperties[]`.
- Note: `getOrganization`/`setOrganization`/`removeOrganization` require the CRM module.

Field reference:
- Create/Update (POST/PUT /customers[/{id}]): `firstName, lastName, phone, photoUrl, jobTitle, photoType, address(object), notes, company, emails(array), phones(array), socialProfiles(array), websites(array)`; plus convenience `email` (create). Update also `emails_add`.
- Get Many (GET /customers): query `firstName, lastName, phone, email, updatedSince, sortField(createdAt|firstName|lastName|updatedAt), sortOrder, page, pageSize`.
- Update Customer Fields (PUT /customers/{id}/customer_fields): `customerFields` array of `{id,value}`.

- [ ] **Step 1: Create `create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['create'] };

export const customerCreateDescription: INodeProperties[] = [
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		placeholder: 'name@email.com',
		default: '',
		displayOptions: { show },
		description: 'Primary email (a customer needs at least an email or a first name)',
		routing: {
			request: { method: 'POST', url: '/customers' },
			send: { type: 'body', property: 'email' },
		},
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'body', property: 'firstName' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'body', property: 'lastName' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
			{ displayName: 'Company', name: 'company', type: 'string', default: '', routing: { send: { type: 'body', property: 'company' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', routing: { send: { type: 'body', property: 'notes' } } },
			{ displayName: 'Photo URL', name: 'photoUrl', type: 'string', default: '', routing: { send: { type: 'body', property: 'photoUrl' } } },
			{ displayName: 'Emails (JSON)', name: 'emails', type: 'json', default: '[]', description: 'e.g. [{ "value": "a@x.io", "type": "home" }]', routing: { send: { type: 'body', property: 'emails' } } },
			{ displayName: 'Phones (JSON)', name: 'phones', type: 'json', default: '[]', description: 'e.g. [{ "value": "777", "type": "home" }]', routing: { send: { type: 'body', property: 'phones' } } },
			{ displayName: 'Address (JSON)', name: 'address', type: 'json', default: '{}', description: 'e.g. { "city": "LA", "country": "US" }', routing: { send: { type: 'body', property: 'address' } } },
		],
	},
];
```

- [ ] **Step 2: Create `get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['customer'], operation: ['get'] };

export const customerGetDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/customers/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('customers')] },
		},
	},
];
```

- [ ] **Step 3: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['customer'], operation: ['getAll'] };

export const customerGetAllDescription: INodeProperties[] = [
	...paginationFields('customer', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', default: '', routing: { send: { type: 'query', property: 'email' } } },
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'query', property: 'firstName' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'query', property: 'lastName' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'query', property: 'phone' } } },
			{ displayName: 'Updated Since', name: 'updatedSince', type: 'dateTime', default: '', routing: { send: { type: 'query', property: 'updatedSince' } } },
			{ displayName: 'Sort Field', name: 'sortField', type: 'string', default: '', description: 'createdAt, firstName, lastName, updatedAt', routing: { send: { type: 'query', property: 'sortField' } } },
			{ displayName: 'Sort Order', name: 'sortOrder', type: 'options', options: [{ name: 'Desc', value: 'desc' }, { name: 'Asc', value: 'asc' }], default: 'desc', routing: { send: { type: 'query', property: 'sortOrder' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/customers' },
			output: { postReceive: [embeddedPostReceive('customers')] },
		},
	},
];
```

- [ ] **Step 4: Create `update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['update'] };

export const customerUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}' } },
	},
	{
		displayName: 'Update Fields',
		name: 'updateFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', routing: { send: { type: 'body', property: 'firstName' } } },
			{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', routing: { send: { type: 'body', property: 'lastName' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
			{ displayName: 'Company', name: 'company', type: 'string', default: '', routing: { send: { type: 'body', property: 'company' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Notes', name: 'notes', type: 'string', default: '', routing: { send: { type: 'body', property: 'notes' } } },
			{ displayName: 'Emails Add (JSON)', name: 'emails_add', type: 'json', default: '[]', description: 'Emails to add, e.g. ["a@x.io"]', routing: { send: { type: 'body', property: 'emails_add' } } },
		],
	},
];
```

- [ ] **Step 5: Create `updateFields.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['updateCustomerFields'] };

export const customerUpdateFieldsDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}/customer_fields' } },
	},
	{
		displayName: 'Customer Fields',
		name: 'customerFields',
		type: 'json',
		default: '=[{ "id": 1, "value": "Test value" }]',
		displayOptions: { show },
		description: 'Array of { id, value }. Requires the CustomFields FreeScout module.',
		routing: { send: { type: 'body', property: 'customerFields' } },
	},
];
```

- [ ] **Step 6: Create `getOrganization.ts` (CRM module)**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['getOrganization'] };

export const customerGetOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: "Get the customer's organization membership (requires the CRM module)",
		routing: { request: { method: 'GET', url: '=/customers/{{$value}}/organization' } },
	},
];
```

- [ ] **Step 7: Create `setOrganization.ts` (CRM module)**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['setOrganization'] };

export const customerSetOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Assign/update the customer organization membership (requires the CRM module)',
		routing: { request: { method: 'PUT', url: '=/customers/{{$value}}/organization' } },
	},
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'organizationId' } },
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		options: [
			{ name: 'Member', value: 'member' },
			{ name: 'Manager', value: 'manager' },
		],
		default: 'member',
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'role' } },
	},
];
```

- [ ] **Step 8: Create `removeOrganization.ts` (CRM module)**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['customer'], operation: ['removeOrganization'] };

export const customerRemoveOrganizationDescription: INodeProperties[] = [
	{
		displayName: 'Customer ID',
		name: 'customerId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'Remove the customer from its organization (requires the CRM module)',
		routing: { request: { method: 'DELETE', url: '=/customers/{{$value}}/organization' } },
	},
];
```

- [ ] **Step 9: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { customerCreateDescription } from './create';
import { customerGetDescription } from './get';
import { customerGetAllDescription } from './getAll';
import { customerUpdateDescription } from './update';
import { customerUpdateFieldsDescription } from './updateFields';
import { customerGetOrganizationDescription } from './getOrganization';
import { customerSetOrganizationDescription } from './setOrganization';
import { customerRemoveOrganizationDescription } from './removeOrganization';

const show = { resource: ['customer'] };

export const customerDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a customer' },
			{ name: 'Get', value: 'get', action: 'Get a customer' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many customers' },
			{ name: 'Update', value: 'update', action: 'Update a customer' },
			{ name: 'Update Customer Fields', value: 'updateCustomerFields', action: 'Update customer fields' },
			{ name: 'Get Organization', value: 'getOrganization', action: 'Get customer organization' },
			{ name: 'Set Organization', value: 'setOrganization', action: 'Set customer organization' },
			{ name: 'Remove Organization', value: 'removeOrganization', action: 'Remove customer organization' },
		],
		default: 'create',
	},
	...customerCreateDescription,
	...customerGetDescription,
	...customerGetAllDescription,
	...customerUpdateDescription,
	...customerUpdateFieldsDescription,
	...customerGetOrganizationDescription,
	...customerSetOrganizationDescription,
	...customerRemoveOrganizationDescription,
];
```

The last three operations require the CRM (Customers Management) module; when
it is absent the API returns an error surfaced by n8n.

- [ ] **Step 10: Commit**

```bash
git add nodes/Freescout/resources/customer
git commit -m "feat(node): customer resource incl. organization membership (CRM)"
```

---

### Task 7: User resource

**Files:**
- Create: `nodes/Freescout/resources/user/{index,create,get,getAll,delete}.ts` (recreating the folder deleted in Task 3)

**Interfaces:**
- Consumes: `embeddedPostReceive`, `paginationFields`.
- Produces: `userDescription: INodeProperties[]`.

Field reference:
- Create (POST /users): required `firstName, lastName, email`; optional `password, alternateEmails, jobTitle, phone, timezone, photoUrl`.
- Get Many (GET /users): query `email, page, pageSize`.
- Delete (DELETE /users/{id}): query `byUserId` (required), `assignTo[MAILBOX_ID]=USER_ID` (optional).

- [ ] **Step 1: Create `create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['user'], operation: ['create'] };

export const userCreateDescription: INodeProperties[] = [
	{ displayName: 'First Name', name: 'firstName', type: 'string', default: '', required: true, displayOptions: { show }, routing: { request: { method: 'POST', url: '/users' }, send: { type: 'body', property: 'firstName' } } },
	{ displayName: 'Last Name', name: 'lastName', type: 'string', default: '', required: true, displayOptions: { show }, routing: { send: { type: 'body', property: 'lastName' } } },
	{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '', required: true, displayOptions: { show }, routing: { send: { type: 'body', property: 'email' } } },
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Password', name: 'password', type: 'string', typeOptions: { password: true }, default: '', routing: { send: { type: 'body', property: 'password' } } },
			{ displayName: 'Alternate Emails', name: 'alternateEmails', type: 'string', default: '', description: 'Comma separated', routing: { send: { type: 'body', property: 'alternateEmails' } } },
			{ displayName: 'Job Title', name: 'jobTitle', type: 'string', default: '', routing: { send: { type: 'body', property: 'jobTitle' } } },
			{ displayName: 'Phone', name: 'phone', type: 'string', default: '', routing: { send: { type: 'body', property: 'phone' } } },
			{ displayName: 'Timezone', name: 'timezone', type: 'string', default: '', placeholder: 'Europe/Paris', routing: { send: { type: 'body', property: 'timezone' } } },
			{ displayName: 'Photo URL', name: 'photoUrl', type: 'string', default: '', routing: { send: { type: 'body', property: 'photoUrl' } } },
		],
	},
];
```

- [ ] **Step 2: Create `get.ts`**

```typescript
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
```

- [ ] **Step 3: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['user'], operation: ['getAll'] };

export const userGetAllDescription: INodeProperties[] = [
	...paginationFields('user', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'Email', name: 'email', type: 'string', default: '', routing: { send: { type: 'query', property: 'email' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/users' },
			output: { postReceive: [embeddedPostReceive('users')] },
		},
	},
];
```

- [ ] **Step 4: Create `delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['user'], operation: ['delete'] };

export const userDeleteDescription: INodeProperties[] = [
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/users/{{$value}}' } },
	},
	{
		displayName: 'By User ID',
		name: 'byUserId',
		type: 'number',
		default: 0,
		required: true,
		displayOptions: { show },
		description: 'ID of the user performing the deletion',
		routing: { send: { type: 'query', property: 'byUserId' } },
	},
];
```

- [ ] **Step 5: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { userCreateDescription } from './create';
import { userGetDescription } from './get';
import { userGetAllDescription } from './getAll';
import { userDeleteDescription } from './delete';

const show = { resource: ['user'] };

export const userDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a user' },
			{ name: 'Get', value: 'get', action: 'Get a user' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many users' },
			{ name: 'Delete', value: 'delete', action: 'Delete a user' },
		],
		default: 'create',
	},
	...userCreateDescription,
	...userGetDescription,
	...userGetAllDescription,
	...userDeleteDescription,
];
```

- [ ] **Step 6: Commit**

```bash
git add nodes/Freescout/resources/user
git commit -m "feat(node): user resource"
```

---

### Task 8: Mailbox resource

**Files:**
- Create: `nodes/Freescout/resources/mailbox/{index,getAll,folders,customFields}.ts`

**Interfaces:**
- Consumes: `embeddedPostReceive`, `paginationFields`.
- Produces: `mailboxDescription: INodeProperties[]`.

Field reference:
- Get Many (GET /mailboxes): query `userId, page, pageSize`.
- Folders (GET /mailboxes/{id}/folders): query `userId, folderId, pageSize`.
- Custom Fields (GET /mailboxes/{id}/custom_fields): CustomFields module.

- [ ] **Step 1: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['mailbox'], operation: ['getAll'] };

export const mailboxGetAllDescription: INodeProperties[] = [
	...paginationFields('mailbox', 'getAll'),
	{
		displayName: 'Filters',
		name: 'filters',
		type: 'collection',
		placeholder: 'Add Filter',
		default: {},
		displayOptions: { show },
		options: [
			{ displayName: 'User ID', name: 'userId', type: 'string', default: '', description: 'Only mailboxes the user can access', routing: { send: { type: 'query', property: 'userId' } } },
		],
	},
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/mailboxes' },
			output: { postReceive: [embeddedPostReceive('mailboxes')] },
		},
	},
];
```

- [ ] **Step 2: Create `folders.ts`**

```typescript
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
```

- [ ] **Step 3: Create `customFields.ts`**

```typescript
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
```

- [ ] **Step 4: Create `index.ts`**

```typescript
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
```

Note: verify the `_embedded` key for custom fields against a live response
(`customFields` vs `custom_fields`); adjust `embeddedPostReceive` argument if
the API uses snake_case here.

- [ ] **Step 5: Commit**

```bash
git add nodes/Freescout/resources/mailbox
git commit -m "feat(node): mailbox resource"
```

---

### Task 9: Tag resource

**Files:**
- Create: `nodes/Freescout/resources/tag/{index,getAll}.ts`

**Interfaces:**
- Consumes: `embeddedPostReceive`, `paginationFields`.
- Produces: `tagDescription: INodeProperties[]`.

Field reference (GET /tags): query `conversationId, page, pageSize`.

- [ ] **Step 1: Create `getAll.ts`**

```typescript
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
```

- [ ] **Step 2: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { tagGetAllDescription } from './getAll';

const show = { resource: ['tag'] };

export const tagDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [{ name: 'Get Many', value: 'getAll', action: 'Get many tags' }],
		default: 'getAll',
	},
	...tagGetAllDescription,
];
```

- [ ] **Step 3: Commit**

```bash
git add nodes/Freescout/resources/tag
git commit -m "feat(node): tag resource"
```

---

### Task 9A: Organization resource (CRM module)

**Files:**
- Create: `nodes/Freescout/resources/organization/{index,create,get,getAll,update,delete}.ts`

**Interfaces:**
- Consumes: `embeddedPostReceive`, `paginationFields`.
- Produces: `organizationDescription: INodeProperties[]` (imported by node in Task 3).

Field reference: the CRM (Customers Management) module is closed source and not
available locally. Only `name` (create/update) is documented. All other fields
are exposed through a raw **Additional Fields (JSON)** passthrough merged into
the request body by a local preSend — no field names are fabricated. The
`_embedded` list key is assumed to be `organizations` (verify against a live
CRM install; see Open Items).

- [ ] **Step 1: Create `create.ts`**

```typescript
import type {
	IDataObject,
	IExecuteSingleFunctions,
	IHttpRequestOptions,
	INodeProperties,
} from 'n8n-workflow';

const show = { resource: ['organization'], operation: ['create'] };

/** Merge the raw "Additional Fields (JSON)" parameter into the request body. */
export async function presendOrganizationJson(
	this: IExecuteSingleFunctions,
	requestOptions: IHttpRequestOptions,
): Promise<IHttpRequestOptions> {
	const raw = this.getNodeParameter('additionalFieldsJson', '{}') as string;
	const body = (requestOptions.body as IDataObject) ?? {};
	if (raw && raw.trim() && raw.trim() !== '{}') {
		const parsed = JSON.parse(raw) as IDataObject;
		requestOptions.body = { ...body, ...parsed };
	}
	return requestOptions;
}

export const organizationCreateDescription: INodeProperties[] = [
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'POST', url: '/organizations' },
			send: { type: 'body', property: 'name', preSend: [presendOrganizationJson] },
		},
	},
	{
		displayName: 'Additional Fields (JSON)',
		name: 'additionalFieldsJson',
		type: 'json',
		default: '{}',
		displayOptions: { show },
		description:
			'Optional extra organization fields as a JSON object, merged into the request body (CRM module specific)',
	},
];
```

- [ ] **Step 2: Create `get.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';

const show = { resource: ['organization'], operation: ['get'] };

export const organizationGetDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '=/organizations/{{$value}}' },
			output: { postReceive: [embeddedPostReceive('organizations')] },
		},
	},
];
```

- [ ] **Step 3: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['organization'], operation: ['getAll'] };

export const organizationGetAllDescription: INodeProperties[] = [
	...paginationFields('organization', 'getAll'),
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/organizations' },
			output: { postReceive: [embeddedPostReceive('organizations')] },
		},
	},
];
```

- [ ] **Step 4: Create `update.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { presendOrganizationJson } from './create';

const show = { resource: ['organization'], operation: ['update'] };

export const organizationUpdateDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: {
			request: { method: 'PUT', url: '=/organizations/{{$value}}' },
			send: { preSend: [presendOrganizationJson] },
		},
	},
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		default: '',
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'name' } },
	},
	{
		displayName: 'Additional Fields (JSON)',
		name: 'additionalFieldsJson',
		type: 'json',
		default: '{}',
		displayOptions: { show },
		description: 'Optional extra organization fields as a JSON object, merged into the request body',
	},
];
```

- [ ] **Step 5: Create `delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['organization'], operation: ['delete'] };

export const organizationDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Organization ID',
		name: 'organizationId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/organizations/{{$value}}' } },
	},
];
```

- [ ] **Step 6: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { organizationCreateDescription } from './create';
import { organizationGetDescription } from './get';
import { organizationGetAllDescription } from './getAll';
import { organizationUpdateDescription } from './update';
import { organizationDeleteDescription } from './delete';

const show = { resource: ['organization'] };

export const organizationDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create an organization' },
			{ name: 'Get', value: 'get', action: 'Get an organization' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many organizations' },
			{ name: 'Update', value: 'update', action: 'Update an organization' },
			{ name: 'Delete', value: 'delete', action: 'Delete an organization' },
		],
		default: 'create',
	},
	...organizationCreateDescription,
	...organizationGetDescription,
	...organizationGetAllDescription,
	...organizationUpdateDescription,
	...organizationDeleteDescription,
];
```

The whole resource requires the CRM (Customers Management) module; without it
the API returns an error surfaced by n8n.

- [ ] **Step 7: Commit**

```bash
git add nodes/Freescout/resources/organization
git commit -m "feat(node): organization resource (CRM module)"
```

---

### Task 10: Webhook resource + full node build

**Files:**
- Create: `nodes/Freescout/resources/webhook/{index,create,getAll,delete}.ts`

**Interfaces:**
- Consumes: `embeddedPostReceive`, `paginationFields`.
- Produces: `webhookDescription: INodeProperties[]`. After this task the node builds fully.

Field reference:
- Create (POST /webhooks): `url` (required), `events` (required array).
- Get Many (GET /webhooks): query `page, pageSize`.
- Delete (DELETE /webhooks/{id}).

The events option list (reused by the Trigger, Task 12) is defined once here as a constant.

- [ ] **Step 1: Create `create.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhook'], operation: ['create'] };

export const WEBHOOK_EVENTS: Array<{ name: string; value: string }> = [
	{ name: 'Conversation Assigned', value: 'convo.assigned' },
	{ name: 'Conversation Created', value: 'convo.created' },
	{ name: 'Conversation Deleted', value: 'convo.deleted' },
	{ name: 'Conversation Deleted Forever', value: 'convo.deleted_forever' },
	{ name: 'Conversation Restored', value: 'convo.restored' },
	{ name: 'Conversation Moved', value: 'convo.moved' },
	{ name: 'Conversation Status Changed', value: 'convo.status' },
	{ name: 'Customer Reply Created', value: 'convo.customer.reply.created' },
	{ name: 'Agent Reply Created', value: 'convo.agent.reply.created' },
	{ name: 'Note Created', value: 'convo.note.created' },
	{ name: 'Customer Created', value: 'customer.created' },
	{ name: 'Customer Updated', value: 'customer.updated' },
];

export const webhookCreateDescription: INodeProperties[] = [
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		description: 'URL that will be called when any of the events occur',
		routing: {
			request: { method: 'POST', url: '/webhooks' },
			send: { type: 'body', property: 'url' },
		},
	},
	{
		displayName: 'Events',
		name: 'events',
		type: 'multiOptions',
		options: WEBHOOK_EVENTS,
		default: [],
		required: true,
		displayOptions: { show },
		routing: { send: { type: 'body', property: 'events' } },
	},
];
```

- [ ] **Step 2: Create `getAll.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { embeddedPostReceive } from '../../GenericFunctions';
import { paginationFields } from '../shared';

const show = { resource: ['webhook'], operation: ['getAll'] };

export const webhookGetAllDescription: INodeProperties[] = [
	...paginationFields('webhook', 'getAll'),
	{
		displayName: 'Operation Routing',
		name: 'getAllRouting',
		type: 'hidden',
		default: '',
		displayOptions: { show },
		routing: {
			request: { method: 'GET', url: '/webhooks' },
			output: { postReceive: [embeddedPostReceive('webhooks')] },
		},
	},
];
```

- [ ] **Step 3: Create `delete.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';

const show = { resource: ['webhook'], operation: ['delete'] };

export const webhookDeleteDescription: INodeProperties[] = [
	{
		displayName: 'Webhook ID',
		name: 'webhookId',
		type: 'string',
		default: '',
		required: true,
		displayOptions: { show },
		routing: { request: { method: 'DELETE', url: '=/webhooks/{{$value}}' } },
	},
];
```

- [ ] **Step 4: Create `index.ts`**

```typescript
import type { INodeProperties } from 'n8n-workflow';
import { webhookCreateDescription } from './create';
import { webhookGetAllDescription } from './getAll';
import { webhookDeleteDescription } from './delete';

const show = { resource: ['webhook'] };

export const webhookDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show },
		options: [
			{ name: 'Create', value: 'create', action: 'Create a webhook' },
			{ name: 'Get Many', value: 'getAll', action: 'Get many webhooks' },
			{ name: 'Delete', value: 'delete', action: 'Delete a webhook' },
		],
		default: 'create',
	},
	...webhookCreateDescription,
	...webhookGetAllDescription,
	...webhookDeleteDescription,
];
```

- [ ] **Step 5: Build and lint the whole action node**

Run: `npm run build && npm run lint`
Expected: PASS with zero errors/warnings. Fix any type errors before committing.

- [ ] **Step 6: Manual smoke test in n8n dev mode**

Run: `npm run dev`
Expected: n8n starts; add credentials (real FreeScout URL + API key), run
Conversation → Get Many with a Limit of 5, confirm items come back unwrapped
(no `_embedded` wrapper) and `Return All` pages through. Try Customer → Get Many
filtered by email.

- [ ] **Step 7: Commit**

```bash
git add nodes/Freescout/resources/webhook
git commit -m "feat(node): webhook resource; full action node builds"
```

---

### Task 11: Register nodes in package.json + metadata

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `n8n.nodes` including both nodes; correct repo/homepage metadata.

- [ ] **Step 1: Update the `n8n` block and metadata**

Set `n8n.nodes` to:

```json
"nodes": [
  "dist/nodes/Freescout/Freescout.node.js",
  "dist/nodes/FreescoutTrigger/FreescoutTrigger.node.js"
]
```

Fill `description`, `homepage`, and `repository.url` with the real repo
(`https://github.com/joernbungartz/n8n-nodes-freescout`), and set `keywords` to
include `n8n-community-node-package`, `freescout`, `helpdesk`.

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: PASS (the trigger dist path won't exist until Task 13; if n8n-node
validates existence, do this step's build after Task 13 — otherwise it only
edits JSON and is safe now).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "chore: register both nodes and fix package metadata"
```

---

### Task 12: Trigger signature helper (TDD)

**Files:**
- Create: `nodes/FreescoutTrigger/GenericFunctions.ts`
- Create: `nodes/FreescoutTrigger/__tests__/signature.test.ts`

**Interfaces:**
- Produces:
  - `webhookSecret(appKey: string): string` = `md5(appKey + 'webhook_key')`.
  - `computeSignature(rawBody: string, appKey: string): string` = `base64(HMAC-SHA1(rawBody, webhookSecret(appKey)))`.
  - `verifySignature(rawBody: string, header: string | undefined, appKey: string): boolean` — constant-time compare; returns `true` when `appKey` is empty (verification disabled).
- Consumes: Node `crypto`.

- [ ] **Step 1: Write failing tests (fixture generated from the pinned formula)**

```typescript
// No `vitest` import — globals are enabled via vitest.config.mjs (strict mode bans the import).
import { webhookSecret, computeSignature, verifySignature } from '../GenericFunctions';
import { createHash, createHmac } from 'crypto';

const APP_KEY = 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
const BODY = '{"id":123,"type":"email"}';

// Reference values computed with the exact FreeScout formula.
const expectedSecret = createHash('md5').update(APP_KEY + 'webhook_key').digest('hex');
const expectedSig = createHmac('sha1', expectedSecret).update(BODY).digest('base64');

describe('webhook signature', () => {
	it('derives the secret as md5(appKey + "webhook_key")', () => {
		expect(webhookSecret(APP_KEY)).toBe(expectedSecret);
	});
	it('computes base64 HMAC-SHA1 over the raw body', () => {
		expect(computeSignature(BODY, APP_KEY)).toBe(expectedSig);
	});
	it('verifies a correct signature', () => {
		expect(verifySignature(BODY, expectedSig, APP_KEY)).toBe(true);
	});
	it('rejects a wrong signature', () => {
		expect(verifySignature(BODY, 'wrong', APP_KEY)).toBe(false);
	});
	it('rejects a missing signature when appKey is set', () => {
		expect(verifySignature(BODY, undefined, APP_KEY)).toBe(false);
	});
	it('accepts (skips verification) when appKey is empty', () => {
		expect(verifySignature(BODY, undefined, '')).toBe(true);
	});
});
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `npx vitest run nodes/FreescoutTrigger/__tests__/signature.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `GenericFunctions.ts`**

```typescript
import { createHash, createHmac, timingSafeEqual } from 'crypto';

export function webhookSecret(appKey: string): string {
	return createHash('md5').update(appKey + 'webhook_key').digest('hex');
}

export function computeSignature(rawBody: string, appKey: string): string {
	return createHmac('sha1', webhookSecret(appKey)).update(rawBody, 'utf8').digest('base64');
}

export function verifySignature(
	rawBody: string,
	header: string | undefined,
	appKey: string,
): boolean {
	// Verification disabled when no app key is configured.
	if (!appKey) return true;
	if (!header) return false;
	const expected = computeSignature(rawBody, appKey);
	const a = Buffer.from(expected);
	const b = Buffer.from(header);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `npx vitest run nodes/FreescoutTrigger/__tests__/signature.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 5: Commit**

```bash
git add nodes/FreescoutTrigger/GenericFunctions.ts nodes/FreescoutTrigger/__tests__/signature.test.ts
git commit -m "feat(trigger): webhook signature helpers with tests"
```

---

### Task 13: Trigger node — webhook lifecycle + delivery handling

**Files:**
- Create: `nodes/FreescoutTrigger/FreescoutTrigger.node.ts`
- Copy: `nodes/FreescoutTrigger/freescout.svg` and `freescout.dark.svg` (from `nodes/Freescout/`)

**Interfaces:**
- Consumes: `verifySignature` (Task 12), `WEBHOOK_EVENTS` (Task 10), credential `freescoutApi`.
- Produces: `FreescoutTrigger` node registered in Task 11.

- [ ] **Step 1: Copy icons**

```bash
cp nodes/Freescout/freescout.svg nodes/Freescout/freescout.dark.svg nodes/FreescoutTrigger/
```

- [ ] **Step 2: Implement the trigger node**

```typescript
import {
	NodeConnectionTypes,
	NodeApiError,
	type IHookFunctions,
	type IWebhookFunctions,
	type INodeType,
	type INodeTypeDescription,
	type IWebhookResponseData,
	type IHttpRequestMethods,
	type IDataObject,
} from 'n8n-workflow';
import { verifySignature } from './GenericFunctions';
import { WEBHOOK_EVENTS } from '../Freescout/resources/webhook/create';

async function freescoutApiRequest(
	this: IHookFunctions,
	method: IHttpRequestMethods,
	resource: string,
	body: IDataObject = {},
): Promise<IDataObject> {
	const credentials = await this.getCredentials('freescoutApi');
	const baseUrl = (credentials.baseUrl as string).replace(/\/+$/, '');
	const options = {
		method,
		body,
		url: `${baseUrl}/api${resource}`,
		headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
		json: true,
	};
	if (method === 'GET' || Object.keys(body).length === 0) delete (options as IDataObject).body;
	try {
		return (await this.helpers.httpRequestWithAuthentication.call(
			this,
			'freescoutApi',
			options,
		)) as IDataObject;
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as IDataObject);
	}
}

export class FreescoutTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FreeScout Trigger',
		name: 'freescoutTrigger',
		icon: { light: 'file:freescout.svg', dark: 'file:freescout.dark.svg' },
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow on FreeScout webhook events',
		defaults: { name: 'FreeScout Trigger' },
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'freescoutApi', required: true }],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Events',
				name: 'events',
				type: 'multiOptions',
				required: true,
				options: WEBHOOK_EVENTS,
				default: [],
				description: 'FreeScout events that trigger the workflow',
			},
			{
				displayName:
					'Signature verification runs only if the "App Key" is set on the credential. Without it, deliveries are accepted unverified.',
				name: 'signatureNotice',
				type: 'notice',
				default: '',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const webhookData = this.getWorkflowStaticData('node');
				const response = await freescoutApiRequest.call(this, 'GET', '/webhooks');
				const embedded = (response._embedded as IDataObject) ?? {};
				const list = (embedded.webhooks as IDataObject[]) ?? [];
				for (const hook of list) {
					if (hook.url === webhookUrl) {
						webhookData.webhookId = hook.id;
						return true;
					}
				}
				return false;
			},

			async create(this: IHookFunctions): Promise<boolean> {
				const webhookUrl = this.getNodeWebhookUrl('default');
				const events = this.getNodeParameter('events') as string[];
				const webhookData = this.getWorkflowStaticData('node');
				const response = await freescoutApiRequest.call(this, 'POST', '/webhooks', {
					url: webhookUrl,
					events,
				});
				const id = response.id ?? (response._embedded as IDataObject)?.id;
				if (!id) return false;
				webhookData.webhookId = id;
				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean> {
				const webhookData = this.getWorkflowStaticData('node');
				if (!webhookData.webhookId) return true;
				try {
					await freescoutApiRequest.call(this, 'DELETE', `/webhooks/${webhookData.webhookId}`);
				} catch {
					return false;
				}
				delete webhookData.webhookId;
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const req = this.getRequestObject();
		const credentials = await this.getCredentials('freescoutApi');
		const appKey = (credentials.appKey as string) ?? '';
		const signature = req.headers['x-freescout-signature'] as string | undefined;
		const rawBody = (req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}))).toString('utf8');

		if (!verifySignature(rawBody, signature, appKey)) {
			const res = this.getResponseObject();
			res.status(403).send('Invalid signature');
			return { noWebhookResponse: true };
		}

		return { workflowData: [this.helpers.returnJsonArray(this.getBodyData())] };
	}
}
```

Note: `req.rawBody` requires n8n to expose the raw body. If `rawBody` is
undefined at runtime, enable it via the webhook option `rawBody: true` in the
`webhooks` array and re-read; confirm during Step 4 that verification passes
against a real delivery.

- [ ] **Step 3: Build and lint**

Run: `npm run build && npm run lint`
Expected: PASS. `dist/nodes/FreescoutTrigger/FreescoutTrigger.node.js` emitted.

- [ ] **Step 4: Manual end-to-end test in n8n dev mode**

Run: `npm run dev`
Steps: create a FreeScout Trigger, select `Conversation Created`, activate the
workflow (this registers the webhook — verify via Webhook → Get Many on the
action node). Trigger an event in FreeScout. Confirm:
- With App Key set correctly → event arrives, workflow runs.
- With a wrong App Key → delivery is rejected (403), no execution.
- With App Key blank → event arrives unverified.
Deactivate → confirm the webhook is deleted in FreeScout.

- [ ] **Step 5: Commit**

```bash
git add nodes/FreescoutTrigger
git commit -m "feat(trigger): webhook lifecycle and delivery with optional signature check"
```

---

### Task 14: Docs — README + CHANGELOG

**Files:**
- Create/Modify: `README.md`, `CHANGELOG.md`

**Interfaces:** none (documentation).

- [ ] **Step 1: Write `README.md`**

Include: install instructions, credential setup (FreeScout URL, API key from
Manage → API Keys, and the optional App Key with the `.env` `APP_KEY` note for
trigger signature verification), the full resource/operation table, a
module-requirements note (custom-field operations require the CustomFields
module; the `tag` conversation filter requires the Tags module; the
Organization resource and customer organization-membership operations require
the CRM / Customers Management module), and a Trigger section explaining events,
auto webhook registration, and the signature behavior (verified only when App
Key set).

- [ ] **Step 2: Update `CHANGELOG.md`**

```markdown
# Changelog

## 0.2.0 - 2026-07-07

### Added
- FreeScout action node covering Conversations, Threads, Customers,
  Organizations (CRM module), Users, Mailboxes, Tags and Webhooks (full API
  coverage).
- FreeScout Trigger node with automatic webhook registration and optional
  `X-FreeScout-Signature` verification (enabled by setting the credential App Key).
- Dynamic base URL and API key credential with connection test.
```

- [ ] **Step 3: Bump version**

Set `package.json` `version` to `0.2.0`.

- [ ] **Step 4: Final full verification**

Run: `npm run build && npm run lint && npm test`
Expected: build + lint clean; all unit tests pass.

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md package.json
git commit -m "docs: README and CHANGELOG; bump to 0.2.0"
```

---

## Open items to confirm during implementation (not blockers)

1. **Declarative pagination expression** (`shared.ts`): verify the `generic`
   pagination `continue`/`qs.page` expressions page correctly against a live
   instance; adjust if n8n's `$response`/`$pageCount` variables differ in the
   installed CLI version.
2. **Nested body emission**: confirm `send.property: 'customer.email'` produces
   a nested `{customer:{email}}`. If not, build the object inside
   `presendConversationBody` from `$parameter`.
3. **`_embedded` key casing** for mailbox custom fields (`customFields` vs
   `custom_fields`).
4. **`req.rawBody` availability** for signature verification (see Task 13 note).
5. **Organization/CRM specifics** (Task 9A, Customer membership in Task 6):
   confirm against a live CRM install — the `_embedded` list key
   (`organizations` assumed), whether create/update accept fields beyond `name`
   (covered by the JSON passthrough regardless), the membership `role` enum
   values (`member`/`manager` assumed), and the exact membership request/response
   shape. These are unverifiable locally because the CRM module is closed source
   and not installed.

Items 1–4 are verified in their task's manual test step; item 5 needs a
FreeScout install with the CRM module. None changes the plan's structure.
