---
sidebar_position: 4
title: "Configuration"
---

# Configuration

Openbeehive is configured entirely through environment variables. This page is the complete reference.

You can set these variables in your shell, in your `docker compose` file, through your hosting platform's secrets manager, or in a `.env` file. The server reads `.env` from its working directory at start-up; variables that are already set in the environment win over the file. Everything is read once, so changes take effect after a restart.

:::tip[Start small]
You only need a handful of these to get going. A single-user home server runs on the defaults alone. Once you turn a login method on, add `BEEHIVE_SESSION_SECRET` and, for email/password login, the admin account. See the [Quick start](./quick-start.md) to be running in minutes.
:::

## How the deployment profile works

The single most important setting is `BEEHIVE_DEPLOYMENT_PROFILE`. It chooses sensible defaults for everything else so you don't have to spell out a full stack by hand.

| Profile    | Database default | Blob storage default | Intended for                          |
| ---------- | ---------------- | -------------------- | ------------------------------------- |
| `selfhost` | SQLite (file)    | Local filesystem     | A single binary, no Docker, one host  |
| `cloud`    | PostgreSQL       | MinIO / S3           | An instance with several users        |

The profile only sets *defaults*. Any variable you set explicitly always wins. For example, you can run the `selfhost` profile but point it at PostgreSQL by setting `BEEHIVE_DATABASE_DRIVER` and `BEEHIVE_DATABASE_DSN` yourself.

:::note
The two profiles are documented in depth on their own pages: [Single binary](./single-binary.md) and [Docker](./docker.md). This page focuses on the variables themselves.
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
| `BEEHIVE_HTTP_READ_TIMEOUT` | `2m` | Time allowed to read one request; `0` means no limit. The live sync stream is exempt. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `2m` | Time allowed to write one response; `0` means no limit. The live sync stream is exempt. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | How long an idle keep-alive connection stays open. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Grace period for in-flight requests on shutdown. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `false` | Take the client address for sign-in throttling from the last `X-Forwarded-For` entry. Set it to `true` only when exactly one reverse proxy you control sits in front and the server port is not reachable any other way. |
| `BEEHIVE_ALLOWED_HOSTS` | (empty) | Only without login: further host names the server answers to, comma-separated. `*` turns the check off. See below. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` must match the address users actually visit. If it is wrong, login redirects and invite links point to the wrong place.
:::

One RPC message may be at most 16 MiB; the app splits larger uploads by itself. This limit is not configurable.

### Host names without login \{#allowed-hosts}

A server without a login method treats every request as the one local user. To keep a web page you merely visit from reaching it under a name of its own, such a server answers only when the `Host` of the request is `localhost`, an IP address, the host of `BEEHIVE_PUBLIC_BASE_URL` or a name listed in `BEEHIVE_ALLOWED_HOSTS`. Other names get a `403` response that names the setting. With a login method enabled the check is off.

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
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | (empty) | Comma-separated list of other origins that may call the API from a browser, e.g. `https://app.example.com`. Empty means same-origin only. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Whether the listed origins may send credentials (cookies, auth headers). |

:::caution
Leave this empty when the server serves the web app itself (the default). `*` allows any origin but never with credentials: the server then switches credentials off, so a signed-in browser app on another origin stops working. List the origins explicitly instead. With `make dev-app`, set `http://localhost:5173`.
:::

## Maps \{#maps}

Map tiles and the address search are the only remote services the app contacts. Both are configurable and can be switched off for the whole instance.

| Variable | Default | Description |
| --- | --- | --- |
| `BEEHIVE_MAPS` | `on` | `off` removes the map and the address search from the app. |
| `BEEHIVE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Tile URL template (Leaflet syntax). `{s}` may only appear in the first label of the host name. |
| `BEEHIVE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | Base URL of a Nominatim-compatible address search. |

With the defaults, a browser that opens a map requests tiles from OpenStreetMap, and typing an address or moving the pin on an apiary sends that address or position to Nominatim. Both see the IP address of the device. The server adds the two origins to its Content-Security-Policy, so the app can reach them and nothing else.

## Sync

| Variable  | Default  | Description                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | random at every start | Clock id stamped on changes the server writes itself (API calls). There is normally no reason to set it. |
| `BEEHIVE_CHANGELOG_RETENTION_DAYS` | `180` | Days the change log is kept. Once a day older entries are removed; a device that was away longer loads the current data instead of the changes it missed. `0` keeps the log forever. |
| `BEEHIVE_SYNC_MIN_PROTOCOL` | `0` | Lowest sync protocol version the server accepts from apps. `0` also accepts installed 0.4.x apps; `1` refuses them, and they cannot sync until they have updated. |

Run exactly one server instance per database. Running several replicas against one database is not supported: the daily change-log compaction and the photo upkeep run inside the server process.

Entries that exist when you upgrade to 0.5.0 count as received on the day of the upgrade, so with the default retention the first entries are removed 180 days after the upgrade at the earliest. A 0.4.x app whose last sync is older than what the log still holds cannot sync until it is updated.

## Database

| Variable          | Default            | Description                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | from profile       | Database engine: `postgres`, `mysql` (MariaDB) or `sqlite`.                 |
| `BEEHIVE_DATABASE_DSN`    | from profile       | Connection string for the chosen driver (see below).                       |

Example DSNs by driver:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MariaDB (driver name: mysql)
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

For driver choice, tuning and migration notes, see [Databases](./databases.md).

## Blob storage

The full-size images of photos are stored as blobs, either on the local filesystem or in an S3-compatible object store. A backup is the database plus this directory or bucket.

| Variable          | Default        | Description                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | from profile   | Storage backend: `fs` (local filesystem) or `minio` (MinIO / S3).       |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Directory for blobs when `BEEHIVE_BLOB_BACKEND=fs`.                             |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host and port of the MinIO / S3 endpoint.                              |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin`   | Access key for the object store.                                        |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin`   | Secret key for the object store.                                        |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive`  | Bucket name where blobs are stored.                                     |
| `BEEHIVE_MINIO_USE_SSL`   | `false`        | Set `true` to connect to the endpoint over HTTPS.                       |

The `MINIO_*` variables are only used when `BEEHIVE_BLOB_BACKEND=minio`. `BEEHIVE_BLOB_PUBLIC_URL` is no longer used: images are served only to signed-in members under `/photos/`, and the server warns at start when the setting is present. For full guidance, see [Storage](./storage.md).

## Session and authentication

| Variable         | Default | Description                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (empty) | Secret that signs the session tokens, at least 32 bytes. Generate one with `openssl rand -base64 32`. **Required as soon as any login method is enabled**: the server refuses to start without it. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | How long a session lasts before re-authentication is required (e.g. `720h` is 30 days).      |

:::danger
Keep `BEEHIVE_SESSION_SECRET` private and stable. Whoever knows it can forge sessions; changing it signs everyone out.
:::

## Email, password & onboarding

Built-in accounts for multi-user instances without an external identity provider.
The instance admin is a dedicated account you configure, not the first person
to sign up. See [Authentication](./authentication.md).

| Variable | Default | Description |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | on for `cloud`, off for `selfhost` | Enable email/password sign-up and sign-in. Also implied by `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (empty) | Email of the instance admin. **Required whenever password auth is enabled.** The account is ensured on every start: created if missing and its role forced to admin. Sign-up never grants the admin role. |
| `BEEHIVE_ADMIN_PASSWORD` | (empty) | Password of the instance admin, at least 8 characters. Authoritative on every start: the stored password is reset to this value, which doubles as password recovery. |
| `BEEHIVE_REGISTRATION` | `true` | Open self-registration. Set to `false` for an invite-only instance: apart from the configured admin, accounts can only be created via invite links, and the sign-in screen shows an invite-only notice. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Require email confirmation before a new account can sign in. Needs `BEEHIVE_SMTP_HOST`; the server refuses to start with verification on and no mail server. |
| `BEEHIVE_SMTP_HOST` | (empty) | SMTP server for verification, invite and password-reset emails. If empty, no mail is sent: the admin copies invite links from Settings, and only the instance admin can create password-reset links there. Links are never written to the log. |
| `BEEHIVE_SMTP_PORT` | `587` | SMTP port. |
| `BEEHIVE_SMTP_USER` | (empty) | SMTP username. |
| `BEEHIVE_SMTP_PASS` | (empty) | SMTP password. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | From address for outgoing mail. |

## Demo workspace

Installs a showcase demo account and workspace. Off by default — see
[Demo mode](./demo.md).

| Variable | Default | Description |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Install a demo account and workspace (15 hives across 4 apiaries, reset hourly). Implies `BEEHIVE_PASSWORD_AUTH=true`. |
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
| `BEEHIVE_OIDC_PROVIDERS`     | (empty) | Comma-separated list of enabled providers, e.g. `google,keycloak`. Every listed provider needs its issuer and client id, or the server refuses to start. |
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

:::tip[Single-user, no login]
For a personal self-hosted instance you can skip login entirely: leave `BEEHIVE_PASSWORD_AUTH` off (the selfhost default), `BEEHIVE_OIDC_PROVIDERS` empty and `BEEHIVE_WEBAUTHN_ENABLED=false`. The app then runs in single-user mode with no sign-in step.
:::

For provider set-up walkthroughs, redirect URLs and security advice, see [Authentication](./authentication.md).

## A minimal selfhost example

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://192.168.1.20:8080
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth: single-user mode, no session secret needed
```

If you enable password auth for a family or club instance, add the session
secret and the dedicated admin:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
# Paste the output of: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Add a reverse proxy in front for HTTPS, set `BEEHIVE_TRUST_PROXY_HEADERS=true` behind it, and you are ready to keep records.
