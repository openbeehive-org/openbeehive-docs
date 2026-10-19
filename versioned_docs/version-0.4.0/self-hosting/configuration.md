---
sidebar_position: 4
title: "Configuration"
---

# Configuration

Openbeehive is configured entirely through environment variables. This page is the complete reference.

You can set these variables in your shell, in a `.env` file alongside the binary, in your `docker compose` file, or through your hosting platform's secrets manager. The server reads them once at start-up, so changes take effect after a restart.

:::tip Start small
You only need a handful of these to get going. For a single-user home server, set `BEEHIVE_DEPLOYMENT_PROFILE=selfhost`, a `BEEHIVE_SESSION_SECRET`, and leave the rest at their defaults. See the [Quick start](/self-hosting/quick-start) to be running in minutes.
:::

## How the deployment profile works

The single most important setting is `BEEHIVE_DEPLOYMENT_PROFILE`. It chooses sensible defaults for everything else so you don't have to spell out a full stack by hand.

| Profile    | Database default | Blob storage default | Intended for                          |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (file)    | Local filesystem     | A single binary, no Docker, one host  |
| `cloud`    | PostgreSQL       | MinIO / S3           | The hosted, multi-tenant deployment   |

The profile only sets *defaults*. Any variable you set explicitly always wins. For example, you can run the `selfhost` profile but point it at PostgreSQL by setting `BEEHIVE_DATABASE_DRIVER` and `BEEHIVE_DATABASE_DSN` yourself.

:::note
The two profiles are documented in depth on their own pages: [Single binary](/self-hosting/single-binary) and [Docker](/self-hosting/docker). This page focuses on the variables themselves.
:::

## Deployment profile

| Variable             | Default    | Description                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `selfhost` | Selects the preset stack: `selfhost` or `cloud`. Sets defaults for database and blob storage. |

## HTTP server

| Variable          | Default                  | Description                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_ADDR`            | `:8080`                  | Address and port the server listens on. Use `127.0.0.1:8080` to bind only to localhost behind a reverse proxy. |
| `BEEHIVE_PUBLIC_BASE_URL` | `http://localhost:8080`  | The public URL where users reach the app. Used for OIDC redirects, invite and verification links, and passkey defaults. Set this to your real domain in production. |
| `BEEHIVE_HTTP_READ_HEADER_TIMEOUT` | `10s` | Time allowed to read a request's headers. |
| `BEEHIVE_HTTP_READ_TIMEOUT` | `0` | Whole-request read limit; `0` means none. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `0` | Response write limit; `0` means none. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | How long an idle keep-alive connection stays open. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Grace period for in-flight requests on shutdown. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` must match the address users actually visit. If it is wrong, login redirects and invite links point to the wrong place.
:::

## Embedded web app

The server can serve the SvelteKit PWA itself, so a single binary delivers both the API and the front end.

| Variable     | Default | Description                                                                                  |
| ------------ | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SERVE_WEB`  | `true`  | When `true`, the server serves the bundled web app. Set `false` if you host the front end separately. |
| `BEEHIVE_WEB_DIR`    | (empty) | Path to the built web assets. Leave empty to use the assets embedded in the binary.          |

## CORS

Cross-origin settings matter when the web app is served from a different origin than the API.

| Variable                 | Default | Description                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------------- |
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | `*`     | Comma-separated list of allowed origins. Restrict this to your domain in production. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Whether to allow credentialed cross-origin requests (cookies, auth headers). |

:::caution
A wildcard origin (`*`) combined with `BEEHIVE_CORS_ALLOW_CREDENTIALS=true` is permissive. If you serve the app from a single origin, set `BEEHIVE_CORS_ALLOWED_ORIGINS` to that exact origin.
:::

## Sync

| Variable  | Default  | Description                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | `server` | Identifier for this node in the sync protocol. Used by the Hybrid Logical Clock to label events. Keep it stable and unique per server. |

The conflict-free sync engine (HLC plus per-field last-writer-wins and add-wins OR-Sets) needs each participant to have a stable identity. Changing `BEEHIVE_NODE_ID` on a live server is not recommended.

## Database

| Variable          | Default            | Description                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | from profile       | Database engine: `postgres`, `mysql` or `sqlite`.                           |
| `BEEHIVE_DATABASE_DSN`    | from profile       | Connection string for the chosen driver (see below).                       |

Example DSNs by driver:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MySQL
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

For driver choice, tuning and migration notes, see [Databases](/self-hosting/databases).

## Blob storage

Photos and other attachments are stored as blobs, either on the local filesystem or in an S3-compatible object store.

| Variable          | Default        | Description                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | from profile   | Storage backend: `fs` (local filesystem) or `minio` (MinIO / S3).       |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Directory for blobs when `BEEHIVE_BLOB_BACKEND=fs`.                             |
| `BEEHIVE_BLOB_PUBLIC_URL` | `<BEEHIVE_PUBLIC_BASE_URL>/files` | Base URL under which stored files are served to browsers. Change it only if a proxy or CDN serves the blob directory from somewhere else. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host and port of the MinIO / S3 endpoint.                              |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin`   | Access key for the object store.                                        |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin`   | Secret key for the object store.                                        |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive`  | Bucket name where blobs are stored.                                     |
| `BEEHIVE_MINIO_USE_SSL`   | `false`        | Set `true` to connect to the endpoint over HTTPS.                       |

The `MINIO_*` variables are only used when `BEEHIVE_BLOB_BACKEND=minio`. For full guidance, see [Storage](/self-hosting/storage).

## Session and authentication

| Variable         | Default | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (empty) | Secret used to sign session cookies. Generate one with `openssl rand -base64 32`. Required in production. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | How long a session lasts before re-authentication is required (e.g. `720h` is 30 days).      |

:::danger
Always set a strong, unique `BEEHIVE_SESSION_SECRET` and keep it private. If it leaks or changes, all existing sessions are invalidated.
:::

## Email, password & onboarding

Built-in accounts for multi-user instances without an external identity provider.
The instance admin is a dedicated account you configure, not the first person
to sign up. See [Authentication](/self-hosting/authentication).

| Variable | Default | Description |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | on for `cloud`, off for `selfhost` | Enable email/password sign-up and sign-in. Also implied by `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (empty) | Email of the instance admin. **Required whenever password auth is enabled.** The account is ensured on every start: created if missing and its role forced to admin. Sign-up never grants the admin role. |
| `BEEHIVE_ADMIN_PASSWORD` | (empty) | Password of the instance admin, at least 8 characters. Authoritative on every start: the stored password is reset to this value, which doubles as password recovery. |
| `BEEHIVE_REGISTRATION` | `true` | Open self-registration. Set to `false` for an invite-only instance: apart from the configured admin, accounts can only be created via invite links, and the sign-in screen shows an invite-only notice. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Require email confirmation before a new account can sign in. |
| `BEEHIVE_SMTP_HOST` | (empty) | SMTP server for verification/invite emails. If empty, links are written to the log instead. |
| `BEEHIVE_SMTP_PORT` | `587` | SMTP port. |
| `BEEHIVE_SMTP_USER` | (empty) | SMTP username. |
| `BEEHIVE_SMTP_PASS` | (empty) | SMTP password. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | From address for outgoing mail. |

## Demo tenant

Installs a showcase demo account and tenant. Off by default — see
[Demo mode](/self-hosting/demo).

| Variable | Default | Description |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Install a demo account + tenant (15 hives across 4 apiaries, reset hourly). Implies `BEEHIVE_PASSWORD_AUTH=true`. |
| `BEEHIVE_DEMO_AUTOLOGIN` | `false` | Sign anonymous visitors straight into the demo instead of showing the login screen. For pure showcase hosts only; leave it off on an instance that also serves real users. |
| `BEEHIVE_DEMO_EMAIL` | `demo@app.openbeehive.org` | Demo account email. |
| `BEEHIVE_DEMO_PASSWORD` | `demo` | Demo account password. |

## WebAuthn / passkeys

Optional passwordless authentication using passkeys.

| Variable                  | Default | Description                                                            |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `BEEHIVE_WEBAUTHN_ENABLED`        | `false` | Enables WebAuthn / passkey login.                                     |
| `BEEHIVE_WEBAUTHN_RP_ID`          | host of `BEEHIVE_PUBLIC_BASE_URL` | Relying Party ID, normally your bare domain (e.g. `openbeehive.org`). |
| `BEEHIVE_WEBAUTHN_RP_ORIGINS`     | `BEEHIVE_PUBLIC_BASE_URL` | Comma-separated allowed origins for WebAuthn ceremonies.      |
| `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME`| `Openbeehive` | Human-readable name shown to users during registration.              |

## OIDC providers

Sign-in through external identity providers via OpenID Connect. Multiple providers can be enabled at once.

| Variable             | Default | Description                                                              |
| -------------------- | ------- | ----------------------------------------------------------------------- |
| `BEEHIVE_OIDC_PROVIDERS`     | (empty) | Comma-separated list of enabled providers, e.g. `google,keycloak`.      |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | The callback URL providers redirect to after login.                     |

Each provider then has its own variables, `BEEHIVE_OIDC_<NAME>_ISSUER`,
`BEEHIVE_OIDC_<NAME>_CLIENT_ID`, `BEEHIVE_OIDC_<NAME>_CLIENT_SECRET` and the
optional `BEEHIVE_OIDC_<NAME>_SCOPES` (default `openid,profile,email`), where
`<NAME>` is the provider name in upper case. For example:

```bash
# Google
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile

# Keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/beekeepers
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=...
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=...
```

:::tip Single-user, no login
For a personal self-hosted instance you can skip login entirely: leave `BEEHIVE_PASSWORD_AUTH` off (the selfhost default), `BEEHIVE_OIDC_PROVIDERS` empty and `BEEHIVE_WEBAUTHN_ENABLED=false`. The app then runs in single-user mode with no sign-in step.
:::

For provider set-up walkthroughs, redirect URLs and security advice, see [Authentication](/self-hosting/authentication).

## A minimal selfhost example

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth — single-user mode
```

If you enable password auth for a family or club instance, add the dedicated
admin as well:

```bash
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

That is all a single beekeeper needs. Add a reverse proxy in front for HTTPS and you are ready to keep records.
