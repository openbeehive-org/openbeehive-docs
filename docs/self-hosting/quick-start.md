---
sidebar_position: 1
title: "Quick start"
---

# Quick start

Two routes to a running Openbeehive instance you can open in a browser:

- **Option A, single binary.** Build one self-contained executable that uses SQLite and the local filesystem. No Docker, no database server, no object storage. Good for a home server, a Raspberry Pi or a small VPS.
- **Option B, Docker.** Run the published image with one command.

Both use the **selfhost** deployment profile, which defaults to an embedded SQLite database and filesystem blob storage. You can switch to PostgreSQL and MinIO/S3 later; see [Configuration](/self-hosting/configuration).

:::tip Single user? No login needed
In the selfhost profile no login method is enabled by default: `BEEHIVE_PASSWORD_AUTH` is off, `BEEHIVE_OIDC_PROVIDERS` is empty and `BEEHIVE_WEBAUTHN_ENABLED=false`. The app opens straight to your records. To add sign-in later, see [Authentication](/self-hosting/authentication).
:::

## The smallest working config

Whichever route you choose, two settings matter to get started:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` is the address the server puts into the links it generates (OIDC redirects, invite and verification links). For local testing `http://localhost:8080` is fine. For a real deployment, set it to your public URL, for example `https://bees.example.com`.

Everything else has defaults for self-hosting. The full list is in [Configuration](/self-hosting/configuration).

## Option A: single binary (no Docker)

### Prerequisites

- Go 1.27 or newer
- Node 24 or newer (the published image builds with Node 26)
- [buf](https://buf.build/docs/installation)

### Build and run

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

By default the binary listens on `:8080` and serves the web app itself (`BEEHIVE_SERVE_WEB=true`), so the API and the PWA come from the same origin. Open the address in `BEEHIVE_PUBLIC_BASE_URL`.

:::note Where your data lives
In selfhost mode your records go into a SQLite file (`openbeehive.db` in the working directory by default) and uploaded photos into a blob directory (`./data/blobs` by default). Back up both and you have backed up everything; see [Backups](/self-hosting/backups).
:::

## Option B: Docker

The published image is `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

The `BEEHIVE_DATABASE_DSN` and `BEEHIVE_BLOB_DIR` lines are what put your data on the volume. Without them the container uses its defaults, `openbeehive.db` and `./data/blobs` relative to the container's root directory, which sit outside the volume and are gone after `docker rm`. With them, the `openbeehive-data` volume holds the database and the blobs, and they survive restarts and upgrades. Once it is running, open `http://localhost:8080`.

To stop or remove the container (the volume stays):

```bash
docker stop openbeehive
docker rm openbeehive
```

If you turn on email/password login (`BEEHIVE_PASSWORD_AUTH=true`), the server refuses to start until `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` are set as well. See [Authentication](/self-hosting/authentication).

:::tip Cloud stack instead?
The command above runs the lightweight selfhost profile. For the **cloud** profile (PostgreSQL + MinIO) the repository ships Compose files; see [Docker](/self-hosting/docker).
:::

## First steps after install

1. Open the app at your `BEEHIVE_PUBLIC_BASE_URL` and create your first apiary.
2. Add a hive, edit it to set its type, and record a visit.
3. Print a QR label for the hive so you can scan straight to it in the field.

Before you expose the instance to the internet, put a TLS-terminating [reverse proxy](/self-hosting/reverse-proxy) in front of it and set `BEEHIVE_PUBLIC_BASE_URL` to the `https://` address. Then set up [backups](/self-hosting/backups).
