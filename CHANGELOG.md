# Changelog

All notable, user-facing changes to this node are listed here. Entries are written
for the people using the node in n8n — what you can now do or what changed for you —
not for developers. Unreleased changes accumulate under **[Unreleased]** and become a
dated release when a version is cut.

## [Unreleased]

## 0.2.0 - 2026-07-08

### Added

- First release. You can now connect n8n to your FreeScout help desk.
- **FreeScout action node** to work with your help desk data:
  - **Conversations** – create, look up, list/search, update, delete, add or change tags, update custom fields, and read time-log entries.
  - **Threads** – add a reply, an internal note, or an agent message to a conversation.
  - **Customers** – create, look up, list/search, update, edit custom fields, and manage which organization a customer belongs to.
  - **Organizations** – create, look up, list, update, and delete (needs the FreeScout CRM module).
  - **Mailboxes** – list mailboxes, their folders, and their custom fields.
  - **Users** – create, look up, list, and delete support agents.
  - **Tags** – list the tags in your help desk.
  - **Webhooks** – create, list, and delete webhooks.
- **FreeScout Trigger node** to start a workflow automatically when something happens in FreeScout (new conversation, customer reply, note added, and more — 12 events in total). It registers and removes the webhook in FreeScout for you when you activate or deactivate the workflow.
- Optional **webhook signature checking**: paste the Secret Key from FreeScout's *API & Webhooks* settings into the credential and the Trigger will reject any webhook call that isn't genuinely from your FreeScout instance.
- **Credential** with your FreeScout URL, API Key, and optional Webhook Secret Key, plus a built-in "test connection" button.

### Requirements

- Requires the FreeScout **API & Webhooks** module (a paid FreeScout module) to be installed and active on your FreeScout server. A few operations also need the **Custom Fields**, **Tags**, or **CRM** modules — see the README.
