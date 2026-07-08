# FreeScout n8n Community Node — Design Spec

**Date:** 2026-07-07
**Status:** Approved (pending spec review)
**Package:** `n8n-nodes-freescout`

## Goal

A generic, community-grade n8n node package for the FreeScout helpdesk API
(<https://api-docs.freescout.net/>), covering the **full documented API
surface** — not just any single user's usage. FreeScout is self-hosted, so the
API base URL is user-configured, never a fixed preset.

Reference material:
- Official API docs: <https://api-docs.freescout.net/> (thin in parts).
- **Local module source** (`~/freescout/Modules`) — authoritative where the
  docs are thin. Includes `ApiWebhooks` (API + webhooks: routes, events,
  signature), plus `CustomFields`, `Tags`, `Workflows`, etc. Purchased modules
  the user runs.
- Existing private workflows (`~/n8n/n8n-workflows-privat`) as a reference for
  **real payload/response shapes and auth quirks only** — not for scoping.

## Architecture

Three artifacts:

1. **`FreescoutApi` credential** — dynamic base URL + API key.
2. **`Freescout` action node** — declarative (routing-based), resource/operation
   model, `usableAsTool: true`.
3. **`FreescoutTrigger` node** — programmatic webhook node that auto-registers /
   deletes a FreeScout webhook and fires workflows on events.

Triggers cannot be declarative (they require `webhookMethods`), so the trigger
node is programmatic. The action node remains fully declarative.

### Scaffolding cleanup

The current placeholder scaffolding is replaced:
- Delete `nodes/Freescout/resources/user` and `resources/company` placeholders
  (`company` is not a FreeScout concept; the equivalent is `organizations`).
- Rebuild resources from the map below.
- Update `package.json` `n8n.nodes` to add the trigger; fill placeholder
  `documentationUrl` / `repository` / `homepage` fields.
- Update `CHANGELOG.md`.

## Credential: `FreescoutApi`

Properties:
- **FreeScout URL** (`baseUrl`, string, required) — e.g.
  `https://support.example.com`. Trailing slash normalized before use.
- **API Key** (`apiKey`, string, `password: true`, required).
- **Webhook Secret Key** (`webhookSecret`, string, `password: true`, optional) —
  the **Secret Key** displayed in FreeScout under **Manage → API & Webhooks**.
  Used **only** by the Trigger node: providing it **enables** webhook signature
  verification; leaving it blank means the Trigger accepts deliveries unverified.
  The action node ignores it. This value is used **directly** as the HMAC key —
  the node does not re-hash it. (FreeScout computes this Secret Key internally as
  `md5(APP_KEY . 'webhook_key')` and shows the result in the UI, so the raw
  `APP_KEY` is **not** what the user enters; see Trigger section.)

Auth (declarative generic):
- Header `X-FreeScout-API-Key = {{$credentials.apiKey}}` (docs-recommended
  method; also supports basic-auth and `api_key` query param, but header is
  cleanest).

Credential test:
- `GET {{baseUrl}}/api/mailboxes` — cheap, always present, requires valid key.

Node `requestDefaults`:
- `baseURL = ={{$credentials.baseUrl}}/api`
- Headers `Accept: application/json`, `Content-Type: application/json`.

## Action node — resource / operation map (full coverage)

The Conversation…Webhook routes below are confirmed verbatim from the
**ApiWebhooks** module (`Http/routes.php`). The **Organization** routes and the
customer↔organization membership routes come from the separate **CRM**
(Customers Management) module; they are documented on the public api-docs site
but the module source is not available locally, so their request-body fields
are only partially documented (see note below). Organizations are included
because this package serves any FreeScout install, not only ones without CRM.
There is no single "Get Mailbox" route — only list + folders + custom fields.

| Resource | Operations |
|---|---|
| **Conversation** | Create · Get · Get Many (search) · Update · Delete · Update Tags · Update Custom Fields · List Timelogs |
| **Thread** | Create (type: `customer` / `message` / `note`; supports `state: draft`, `to`/`cc`/`bcc`, attachments, `imported`) |
| **Customer** | Create · Get · Get Many (email/phone/name search) · Update · Update Customer Fields · Get Organization · Set Organization · Remove Organization |
| **Organization** | Create · Get · Get Many · Update · Delete *(CRM module)* |
| **Mailbox** | Get Many · List Folders · List Custom Fields |
| **User** | Create · Get · Get Many · Delete |
| **Tag** | Get Many |
| **Webhook** | Create · Get Many · Delete |

**Organization field uncertainty (CRM module).** Confirmed from docs:
create/update take `name`; `PUT /customers/{id}/organization` takes
`{ organizationId, role }` where `role` ∈ `member`/`manager`. Other
organization fields are not documented and the module is not available to read.
So the Organization create/update UI exposes the confirmed `name` field plus a
**raw "Additional Fields (JSON)" passthrough** for any module-specific fields,
rather than fabricating field names. Documented as CRM-module-dependent.

### Conversation search filters (Get Many)
`mailboxId`, `folderId`, `status`, `assignedTo`, `customerId`, `customerEmail`,
`number`, `subject`, `tags`, `sortField`, `sortOrder`, plus pagination — all
mapped as query params. Exposed via a collection of optional filters.

### Nested / array payloads
- Conversation Create takes nested `customer.{firstName,lastName,email}` and a
  `threads[]` array (confirmed from real workflows). Handled via dotted
  `send.property` paths and a small `preSend` builder that assembles the
  `threads` array and nested `customer` object from flat UI fields.
- Thread Create body: `type`, `text`, `user` (agent id), optional `state`,
  `attachments`, `imported`.

### Module-dependent behavior
- Custom-field endpoints (`updateCustomFields`, `updateCustomerFields`, mailbox
  custom fields) require the **CustomFields** module.
- The `tag` conversation filter requires the **Tags** module.
- The **Organization** resource and customer↔organization membership operations
  require the **CRM** (Customers Management) module.

All are included but documented in the README as needing the relevant module;
when a module is absent the API returns an error, which is surfaced clearly
rather than hidden.

## Trigger node: `FreescoutTrigger`

Events (multi-select `options`) — authoritative list from module source
(`Modules/ApiWebhooks/Entities/Webhook.php`, `$events`):
`convo.assigned`, `convo.created`, `convo.deleted`, `convo.deleted_forever`,
`convo.restored`, `convo.moved`, `convo.status`,
`convo.customer.reply.created`, `convo.agent.reply.created`,
`convo.note.created`, `customer.created`, `customer.updated`.

Webhook lifecycle (`webhookMethods`), routes confirmed from module
`Http/routes.php`:
- `checkExists` → `GET /api/webhooks`, match by target URL.
- `create` → `POST /api/webhooks` with `{ url, events }` (the n8n-provided
  webhook URL + selected events). No per-webhook secret exists in the API.
- `delete` → `DELETE /api/webhooks/{id}` on deactivation.

### Signature verification (OPTIONAL — enabled by configuring the Webhook Secret Key)

Scheme pinned from module source (`Entities/Webhook.php::sign`/`getSecretKey`
and the settings view `settings.blade.php` which prints `\Webhook::getSecretKey()`
as the UI "Secret Key"):

- Header: `X-FreeScout-Signature` (event name also sent in `X-FreeScout-Event`).
- Value: `base64_encode( hash_hmac('sha1', body, secret, true) )`.
- `body` = the **raw request body bytes** as received (FreeScout signs
  `json_encode($params)`, i.e. the exact JSON it POSTs — so verifying against
  the raw incoming body avoids any re-encoding mismatch).
- `secret` = the FreeScout **Secret Key** from Manage → API & Webhooks. FreeScout
  computes it as `md5( config('app.key') . 'webhook_key' )` and **displays the
  result** in that UI page. It is a **global instance secret** (not per-webhook,
  not the API key, and not the raw `APP_KEY`). The node stores this UI value in
  the `webhookSecret` credential field and uses it **directly** as the HMAC key —
  it does **not** re-derive/re-hash it. (Earlier design had the node take the raw
  `APP_KEY` and compute the `md5(...)`, but the UI never exposes `APP_KEY`; it
  exposes the already-derived Secret Key, so the node consumes that directly.)

Behavior (optional check):
- **Secret Key configured** → the trigger reads the raw body, computes the
  expected value, and does a constant-time compare against the header. On
  mismatch or missing header → respond `403` and emit nothing.
- **Secret Key not configured** → verification is skipped; deliveries are accepted
  unverified. The node documents this trade-off so users understand that
  omitting the Secret Key means unauthenticated webhook calls are trusted.

Testing: a unit test uses a fixture (known body + secret → expected header value,
computed with `base64(HMAC-SHA1(body, secret))`) to lock the scheme and catch
regressions. A second case asserts that with no Secret Key the delivery is
accepted without verification.

## Cross-cutting behavior

- **Pagination**: `page` / `pageSize` query params. `Return All` (boolean)
  loops all pages; otherwise `Limit` caps results. Implemented via declarative
  pagination on list operations.
- **HAL `_embedded` unwrap**: list responses wrap items in
  `_embedded.<resource>`. A shared `postReceive` handler unwraps this so users
  get a clean item array; single-get responses pass through.
- **`embed` param**: Conversation Get / Get Many expose an "Embed" option
  (e.g. `threads`) surfaced as an `embed` query param.
- **Error mapping**: FreeScout 400 validation shape (`{message, errors:{...}}`)
  is mapped to readable `NodeApiError` messages; 404 on module endpoints
  surfaces a hint about missing modules.

## Versioning, docs, testing

- Action node `version: 1`; declarative light-versioning conventions
  (see `.agents/versioning.md`).
- README: credential setup, dynamic base URL, module-dependent resources, and
  trigger setup/signature notes.
- Tests: unit test for the signature verification (fixture-based), and for the
  `_embedded` unwrap + threads/customer payload builder.
- Lint/typecheck clean via `n8n-node lint` / build.

## Explicitly out of scope (v1)

- Attachment binary upload helpers beyond passing through the documented
  `attachments` field.
- Any endpoint not present in the official docs or confirmable from source.
- Full node versioning (declarative supports light versioning only).
