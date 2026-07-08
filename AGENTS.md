# n8n community node

## Overview
This is a project containing code for an n8n community node. n8n is a workflow
automation platform where users build workflows with nodes, which are the
building block of a workflow. Nodes can perform a range of actions, such as
starting a workflow (called a "trigger node"), fetching and sending data, or
processing and manipulating it. Besides that there are credentials - entities
that store sensitive information on how to connect to external services and
APIs. A node can require some credentials to be used. Community nodes are a way
for anyone to create such nodes and add them to be used in n8n. All community
nodes are named in a format: `n8n-nodes-<n>` or `@org/n8n-nodes-<n>`.
Community nodes can also be submitted for approval to be used on n8n Cloud
version. In that case there are rules that the node needs to follow in order to
be approved

## Important notes
- Follow the **rules and guidelines in this document and the linked docs
  below** over any code examples.
- All code blocks in these docs are **illustrative and incomplete**.
  They **MUST NOT** be copied verbatim or assumed to be the final desired code.
- Replace example names like `Example`, `Wordpress`, `wordpressApi`, etc.
  with names that match the **actual service / node** you are building.
- When in doubt, **generalize from the patterns**, don't replicate the exact
  structure, fields, or values from the examples.
- Produce the **full implementation** needed for the current project
  (nodes, credentials, tests, etc.), not just fragments similar to examples.
- If an example omits parts (e.g. types, operations, properties), **infer and
  implement the missing parts** based on the real requirements / API docs.
- Never output `Wordpress`-specific code unless the project is actually about
  WordPress.

## Project structure
There are two main folders in this project:
- `nodes` contains all of the nodes in a package (there can be more than 1).
  The code for each node usually lives in its own folder
- `credentials` contains all of the credentials in a package. Usually it's just
  a single file for every credential
So it looks something like this:
.
├── nodes/
│   └── Example/
│       ├── Example.node.ts
│       └── ...
├── credentials/
│   └── Example.credentials.ts
├── package.json
└── ...
It's important to note that `package.json` has a special field `n8n` that have
information about nodes and credentials in a package:
```json
{
  "name": "n8n-nodes-example",
  "version": "1.0.0",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "strict": true,
    "credentials": [
        "dist/credentials/Example.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Example/Example.node.js"
    ]
  }
}
```
`nodes` and `credentials` keys contain paths to transpiled JS files in a `dist`
folder for the nodes and credentials respectively. If you add/remove/rename
nodes and/or credentials, you need to make sure to update `n8n.nodes` and
`n8n.credentials` keys in `package.json` accordingly. Initial files in the
project _may_ contain example nodes and/or credentials that need to be
**removed or renamed** once you start making an actual node.

## Key guidelines
- Use the `n8n-node` CLI tool **whenever possible** for building, dev mode,
  linting, etc.
- **Always** address any lint/typecheck errors/warnings, unless there is a
  **very specific reason** to ignore/disable it
- Make sure to use **proper types whenever possible**
- If you are updating the npm package version, make sure to **update
  CHANGELOG.md** in the root of the repository
- Read `.agents/workflow.md` for more info

## Context-specific docs
Load these before working on the relevant area:

| Working on...                        | Read first                                                          |
|--------------------------------------|---------------------------------------------------------------------|
| Any node file in `nodes/`            | `.agents/nodes.md` and `.agents/properties.md`                      |
| A declarative-style node             | above + `.agents/nodes-declarative.md`                              |
| A programmatic-style node            | above + `.agents/nodes-programmatic.md`                             |
| Files in `credentials/`              | `.agents/credentials.md`                                            |
| Adding a new version to a node       | `.agents/versioning.md`                                             |
| Starting a new task or planning      | `.agents/workflow.md`                                               |

## Releasing

The package is published to npm as **`n8n-nodes-freescout`** (unscoped, public).
Note: it must NOT be published under a scope containing a dot (e.g.
`@automaze.me/...`) — n8n splits node type identifiers on `.`, so a dotted scope
makes n8n mis-parse the package and fail with "Unrecognized node type". Releases
are cut and published entirely from GitHub Actions via **OIDC trusted
publishing** — no npm tokens. The only exception is the one-time first publish
(see below).

### 1. Keep the changelog user-facing
Every user-visible change must be added to `CHANGELOG.md` under the
`## [Unreleased]` heading, written **for the people using the node**, not for
developers. Describe *what the user can now do or what changed for them* in
plain language (no commit hashes, internal function names, or jargon). Group
entries under `### Added`, `### Changed`, `### Fixed`, or `### Requirements`.
The release notes shown on GitHub and npm are taken verbatim from this section,
so if it is empty or too technical, the release will be too.

### 2. Cut the release
Trigger the **Release** workflow (`.github/workflows/release.yml`), either from
GitHub → Actions → Release → "Run workflow", or with:

```
gh workflow run release.yml -f bump=patch    # or minor / major / none
```

Use `bump=none` only to release the current `package.json` version as-is;
otherwise pick `patch`/`minor`/`major`. (The very first version is published
locally instead — see the npm authentication section below.)

The workflow then, in one run: lints + builds + tests, bumps the version,
promotes `[Unreleased]` to a dated `## X.Y.Z` heading, **publishes to npm with
provenance**, commits + tags + pushes, and creates the GitHub Release using the
promoted changelog section as its body. It refuses to run if the version's tag
already exists or if `[Unreleased]` is empty.

npm publish happens **before** anything is pushed, so if npm auth is missing the
run aborts with the remote untouched — nothing to undo. Do **not** re-run a
partially-failed release job (it would double-bump); fix the cause and trigger a
fresh run.

### npm authentication: OIDC trusted publishing (no tokens)
The Release workflow authenticates to npm via OIDC — there is **no `NPM_TOKEN`
secret**. Each run mints a short-lived, workflow-scoped credential and npm
attaches a provenance attestation automatically.

Trusted publishing can only be configured on a package that already exists on
npm, so the flow is:

1. **First publish (one-time, local, with 2FA).** Because the package does not
   exist yet, publish the first version from a maintainer machine:
   `npm publish` — npm prompts for the account's 2FA one-time code. This respects
   2FA and stores no token. (A locally published version has no provenance
   attestation; every later release published by the workflow does.)
2. **Configure the trusted publisher** on npmjs.com → the package's
   Settings → Trusted Publisher → GitHub Actions:
   - Organization/user: `automaze-me` (the **GitHub** org — note the hyphen; the
     npm org is `automaze.me` with a dot, they are different namespaces)
   - Repository: `n8n-nodes-freescout`
   - Workflow filename: `release.yml`
   - Environment: (leave blank)
3. **All later releases** go through the Release workflow (OIDC). Never publish
   locally again.

Requirements the workflow already handles: `id-token: write` permission,
Node ≥ 22.14, and npm ≥ 11.5.1 (upgraded in-workflow).

## Additional resources
If you need any extra information, here are links to n8n's official docs
regarding building community nodes:
- https://docs.n8n.io/integrations/community-nodes/build-community-nodes/
- https://docs.n8n.io/integrations/creating-nodes/overview/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/
- https://docs.n8n.io/integrations/creating-nodes/build/reference/ux-guidelines/
