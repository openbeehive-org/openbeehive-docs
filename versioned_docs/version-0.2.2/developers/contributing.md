---
sidebar_position: 7
title: "Contributing & dev setup"
---

# Contributing & dev setup

Openbeehive is free, open-source software, and we welcome contributions of all
sizes - from fixing a typo to building a new feature. This page gets you from a
fresh clone to a running development environment, then explains the conventions
that keep the codebase healthy.

The project is licensed under **AGPL-3.0**. By contributing, you agree that your
work is released under the same licence.

:::tip Where to start
Browse the open issues on GitHub, and read the `CONTRIBUTING.md` in the main
repository before you open a pull request. Small, focused PRs are much easier to
review and merge.
:::

## The repositories

Openbeehive is split across a few repositories under
[github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app):

| Repository | What it contains |
| --- | --- |
| `openbeehive` | The application: Go backend and SvelteKit PWA frontend |
| `openbeehive-site` | The marketing site at openbeehive.org |
| `openbeehive-docs` | This documentation site (Docusaurus) |

Most code contributions land in the main `openbeehive` repository. Documentation
changes belong in `openbeehive-docs`.

## Prerequisites

You will need:

- **Go 1.25+** - for the backend
- **Node 22+** - for the SvelteKit frontend
- **buf** - for generating code from the Protocol Buffer definitions

A working `make` is assumed (any recent GNU Make). On Windows we recommend WSL2.

## Getting set up

Clone the repository and generate the protobuf code first, then start the server
and the app in two separate terminals.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate Go + TypeScript code from the .proto files
make proto

# Terminal 1 - run the Go backend
make run-server

# Terminal 2 - run the SvelteKit app in dev mode
make dev-app
```

`make run-server` reads its configuration from your environment (or a `.env`
file). For local development the defaults work out of the box: a SQLite database
and the local filesystem for blobs. See
[Configuration](/self-hosting/configuration) for the full list of variables.

For a single-developer setup you can leave `BEEHIVE_OIDC_PROVIDERS` empty and
`BEEHIVE_WEBAUTHN_ENABLED=false` to skip login entirely.

:::note Building from source
To produce a release binary rather than a dev server, run `make proto && make
build`, which writes `./server/bin/openbeehive`. See
[Single binary](/self-hosting/single-binary) for deployment details.
:::

## Architecture in one minute

If you are new to the codebase, skim [Architecture](/developers/architecture)
and the [Data model](/developers/data-model) first. The short version:

- The frontend is **offline-first**. It owns a local SQLite-WASM database
  (stored in OPFS) and is fully usable with no network connection.
- Changes sync to the server in the background using
  [Hybrid Logical Clocks and CRDTs](/developers/sync-protocol), so concurrent
  edits merge without conflicts.
- The API is defined with **Connect-RPC** (gRPC and HTTP/JSON), generated from
  `.proto` files.

## Key conventions

These conventions matter for correctness, not just style. Please follow them.

### 1. The `.proto` files are the source of truth

The API surface, message shapes and enums are all defined in Protocol Buffers.
Never hand-edit generated code. Change the `.proto`, run `make proto`, and let
the generated Go and TypeScript follow.

### 2. Writes go through the local repository, not CRUD

The client does **not** call the server to create or update records directly.
Instead, all writes go through the local repository layer, which records the
change locally and lets the sync engine propagate it. This is what makes the app
instant and offline-capable.

:::caution
If you add a write path that talks to the server directly, you break offline
support and bypass the merge logic. Route every write through the local repo.
:::

### 3. Keep `merge.go` and `merge.ts` in sync

The merge rules - per-field last-writer-wins for scalars, add-wins OR-Sets for
list fields, append-only events - are implemented **twice**: once on the server
(`merge.go`) and once on the client (`merge.ts`). They must behave identically.

Any change to merge semantics has to be made in both files, with matching tests.
A divergence here causes data to merge differently on client and server, which
is a serious bug. See [Sync protocol](/developers/sync-protocol) for the rules.

### 4. Write portable SQL

The backend supports **PostgreSQL, MySQL and SQLite** as pluggable databases.
Keep SQL portable across all three - avoid engine-specific syntax, and test
schema changes against more than one driver where you can. See
[Databases](/self-hosting/databases).

### 5. English in code, translations for users

Write all code, comments, identifiers and commit messages in **English**.

Anything a user sees, however, must be translatable. When you add or change a
user-facing string, provide translations for all supported locales:

| Locale | Language |
| --- | --- |
| `en` | English |
| `de` | German |
| `fr` | French |
| `es` | Spanish |
| `it` | Italian |

If you are not confident in a language, add the English text and flag it in your
PR so a native speaker can help.

## Opening a pull request

1. Fork the repository and create a branch for your change.
2. Make sure `make proto` has been run if you touched any `.proto`.
3. Run the test suite and linters locally.
4. Keep the PR focused and describe what it changes and why.
5. For merge-logic, sync or schema changes, call this out explicitly so
   reviewers know to look closely.

Read the full guidelines in
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md).

Thank you for helping make beekeeping records better for everyone. If you get
stuck, open a discussion or an issue on GitHub - we are happy to help.
