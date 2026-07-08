# n8n-nodes-freescout

This is an n8n community node. It lets you use [FreeScout](https://freescout.net/) in your n8n workflows.

FreeScout is a free, self-hosted, open-source help desk and shared mailbox platform — a lightweight alternative to Help Scout, Zendesk, and Freshdesk.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation)
[Credentials](#credentials)
[Operations](#operations)
[Module Requirements](#module-requirements)
[FreeScout Trigger](#freescout-trigger)
[Compatibility](#compatibility)
[Resources](#resources)
[Version History](#version-history)

---

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

In n8n, go to **Settings → Community Nodes → Install** and enter:

```
n8n-nodes-freescout
```

---

## Credentials

Create a **FreeScout API** credential in n8n with three fields:

| Field | Required | Description |
|---|---|---|
| **FreeScout URL** | Yes | Base URL of your FreeScout instance, e.g. `https://helpdesk.example.com` |
| **API Key** | Yes | Your personal API key. In FreeScout go to **Manage → API Keys** and create or copy a key. |
| **App Key** | No | The `APP_KEY` value from your FreeScout server's `.env` file (include the `base64:` prefix if present). Used only by the Trigger node for webhook signature verification. Leave blank to accept webhook deliveries without verification. |

---

## Operations

### Action node: FreeScout

#### Conversation

| Operation | Description |
|---|---|
| Create | Create a new conversation |
| Get | Retrieve a conversation by ID |
| Get Many | List conversations (with optional filters) |
| Update | Update a conversation's status, assignee, subject, etc. |
| Delete | Delete a conversation |
| Update Tags | Set the tags on a conversation |
| Update Custom Fields | Set custom field values on a conversation |
| Get Timelogs | Retrieve time log entries for a conversation |

#### Thread

| Operation | Description |
|---|---|
| Create | Add a reply, note, or message to a conversation |

#### Customer

| Operation | Description |
|---|---|
| Create | Create a new customer |
| Get | Retrieve a customer by ID |
| Get Many | List customers |
| Update | Update a customer's details |
| Update Customer Fields | Set custom field values on a customer |
| Get Organization | Get the organization a customer belongs to |
| Set Organization | Assign a customer to an organization |
| Remove Organization | Remove a customer's organization membership |

#### Organization

| Operation | Description |
|---|---|
| Create | Create a new organization |
| Get | Retrieve an organization by ID |
| Get Many | List organizations |
| Update | Update an organization |
| Delete | Delete an organization |

#### Mailbox

| Operation | Description |
|---|---|
| Get Many | List mailboxes |
| Get Folders | List folders in a mailbox |
| Get Custom Fields | List custom field definitions for a mailbox |

#### User

| Operation | Description |
|---|---|
| Create | Create a new user |
| Get | Retrieve a user by ID |
| Get Many | List users |
| Delete | Delete a user |

#### Tag

| Operation | Description |
|---|---|
| Get Many | List all tags |

#### Webhook

| Operation | Description |
|---|---|
| Create | Register a webhook |
| Get Many | List registered webhooks |
| Delete | Delete a webhook |

---

## Module Requirements

Some operations require optional FreeScout modules to be installed on your FreeScout instance. If a required module is not installed, the FreeScout API will return an error.

| Feature | Required Module |
|---|---|
| Conversation → Update Custom Fields | [CustomFields](https://freescout.net/module/custom-fields/) |
| Customer → Update Customer Fields | [CustomFields](https://freescout.net/module/custom-fields/) |
| Mailbox → Get Custom Fields | [CustomFields](https://freescout.net/module/custom-fields/) |
| Conversation → Get Many (tag filter) | [Tags](https://freescout.net/module/tags/) |
| Organization resource (all operations) | [CRM (Customers Management)](https://freescout.net/module/crm/) |
| Customer → Get/Set/Remove Organization | [CRM (Customers Management)](https://freescout.net/module/crm/) |

---

## FreeScout Trigger

The **FreeScout Trigger** node starts a workflow whenever a FreeScout event occurs.

### Automatic webhook management

When you activate a workflow containing the FreeScout Trigger node, it automatically registers a webhook in your FreeScout instance. When you deactivate the workflow, the webhook is automatically removed.

### Events

Select one or more of the following events to listen for:

| Event | Description |
|---|---|
| `convo.assigned` | Conversation assigned to an agent |
| `convo.created` | New conversation created |
| `convo.deleted` | Conversation moved to trash |
| `convo.deleted_forever` | Conversation permanently deleted |
| `convo.restored` | Conversation restored from trash |
| `convo.moved` | Conversation moved to another mailbox |
| `convo.status` | Conversation status changed |
| `convo.customer.reply.created` | Customer sent a reply |
| `convo.agent.reply.created` | Agent sent a reply |
| `convo.note.created` | Note added to a conversation |
| `customer.created` | New customer created |
| `customer.updated` | Customer details updated |

### Signature verification

FreeScout signs webhook deliveries with an `X-FreeScout-Signature` header using an HMAC-SHA1 hash of the request body keyed with your instance's `APP_KEY`.

- If you set the **App Key** field in your credential, the Trigger node verifies every incoming delivery and rejects requests with an invalid or missing signature.
- If you leave **App Key** blank, signature verification is skipped and all deliveries are accepted. Use this only in trusted network environments.

---

## Compatibility

This node package has been built and tested against n8n version 1.x. No minimum version has been formally verified.

---

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [FreeScout documentation](https://github.com/freescout-help-desk/freescout/wiki)
- [FreeScout API reference](https://api-docs.freescout.net/)
- [Source code](https://github.com/joernbungartz/n8n-nodes-freescout)

---

## Version History

See [CHANGELOG.md](CHANGELOG.md).
