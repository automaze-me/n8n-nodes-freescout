# Changelog

## 0.2.0 - 2026-07-07

### Added

- **FreeScout action node** covering eight resources with full API coverage:
  - **Conversation**: Create, Get, Get Many, Update, Delete, Update Tags, Update Custom Fields, Get Timelogs
  - **Thread**: Create (replies, notes, and agent messages)
  - **Customer**: Create, Get, Get Many, Update, Update Customer Fields, Get Organization, Set Organization, Remove Organization
  - **Organization** (requires CRM module): Create, Get, Get Many, Update, Delete
  - **Mailbox**: Get Many, Get Folders, Get Custom Fields
  - **User**: Create, Get, Get Many, Delete
  - **Tag**: Get Many
  - **Webhook**: Create, Get Many, Delete
- **FreeScout Trigger node** with automatic webhook registration and deletion on workflow activate/deactivate; supports all 12 FreeScout webhook events; optional `X-FreeScout-Signature` HMAC-SHA1 verification (enabled by setting the App Key in the credential).
- **FreescoutApi credential** with FreeScout URL, API Key, and optional App Key fields; includes a connection test.
