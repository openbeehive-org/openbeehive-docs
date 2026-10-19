---
sidebar_position: 7
title: "Contributing & dev setup"
---

# Contributing & dev setup

Openbeehive is licensed under **AGPL-3.0**. By contributing you agree that
your work is released under the same licence. Read
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md)
in the app repository before opening a pull request.

## The repositories

| Repository | Contents |
| --- | --- |
| [`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) | The application: proto contract, Go backend, SvelteKit PWA |
| [`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site) | The marketing site at openbeehive.org |
| [`openbeehive-docs`](https://github.com/openbeehive-org/openbeehive-docs) | This documentation site (Docusaurus) |

## Prerequisites

- **Go 1.25+** for the backend
- **Node 24+** for the SvelteKit app (the Dockerfile builds with `node:24-alpine`)
- **buf** for generating code from the `.proto` files
- GNU Make; on Windows use WSL2

## Getting set up

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

make proto        # generate Go + TypeScript stubs from proto/
make run-server   # terminal 1: Go backend on :8080 (loads .env if present)
make dev-app      # terminal 2: Vite dev server on :5173
```

`make run-server` reads its configuration from the environment or a `.env`
file in the repo root (copy `.env.example`). The defaults give you SQLite
and filesystem blobs; leave `BEEHIVE_PASSWORD_AUTH` off,
`BEEHIVE_OIDC_PROVIDERS` empty and `BEEHIVE_WEBAUTHN_ENABLED=false` to run
without a login. See [Configuration](/self-hosting/configuration).

To build a release binary: `make proto && make build` writes
`server/bin/openbeehive` with the SPA embedded. See
[Single binary](/self-hosting/single-binary).

## Generated code

`make proto` runs `buf generate` with the repo's `buf.gen.yaml`:

| Output | Plugins |
| --- | --- |
| `server/internal/gen/` | `protocolbuffers/go`, `connectrpc/go` |
| `app/src/lib/proto/` | `bufbuild/es` v2 (messages and service descriptors) |

Both directories are gitignored. Run `make proto` after cloning and after
every `.proto` change; never edit the output by hand. The Docker build runs
`buf generate` itself in its first stage. Every service in the protos is
registered on the server; see [Using the API](/using-the-api/overview) for
the list.

## Conventions

1. **The `.proto` files are the source of truth.** Change the contract,
   regenerate, then implement.
2. **Writes go through the local repository.** The app writes to its local
   SQLite database through `app/src/lib/local/repo.ts` and lets the sync
   engine push the change. Do not add UI code that calls the CRUD services
   (`ApiaryService`, `InspectionService`, ...) directly; they exist for
   scripts and integrations, and a UI call would skip the local database and
   the outbox, so the change would not be visible offline.
3. **Keep `merge.go` and `merge.ts` identical.** Per-field last-writer-wins
   and the add-wins OR-Set are implemented in `server/internal/sync/merge.go`
   and `app/src/lib/local/merge.ts`. Change both, with tests. See the
   [sync protocol](/developers/sync-protocol).
4. **Write portable SQL.** The server runs on PostgreSQL, MySQL and SQLite.
   Migrations use the portable subset described at the top of
   `0001_init.sql`; the store translates the remaining dialect differences.
   See [Databases](/self-hosting/databases).
5. **English in code, translations for users.** Code, comments, identifiers
   and commit messages are English. Every user-facing string goes through
   `svelte-i18n` with entries in `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`.
   If you cannot translate, add the English text and say so in the PR.

## Opening a pull request

1. Fork and branch.
2. Run `make proto` if you touched a `.proto`.
3. Run the Go tests (`cd server && go test ./...`) and the app checks.
4. Keep the PR focused and describe what changes and why.
5. Call out merge-logic, sync or schema changes explicitly.
