---
sidebar_position: 1
title: "Quick start"
---

# Quick start

This is the fastest path from nothing to a running Openbeehive instance you can open in a browser. Pick one of two routes:

- **Option A — Single binary.** Build one self-contained binary that uses SQLite and the local filesystem. No Docker, no database server, no object storage. Ideal for a home server, a Raspberry Pi, or a small VPS.
- **Option B — Docker.** Pull our published image and run it with a single command.

Both routes use the **selfhost** deployment profile, which defaults to an embedded SQLite database and filesystem blob storage. You can switch to PostgreSQL and MinIO/S3 later — see [Configuration](/self-hosting/configuration).

:::tip Single-user? No login needed
If you are the only person using your instance, you can run with **no authentication at all**. Just leave `BEEHIVE_OIDC_PROVIDERS` empty and keep `BEEHIVE_WEBAUTHN_ENABLED=false` (both are the defaults). The app opens straight to your records. To add sign-in later, see [Authentication](/self-hosting/authentication).
:::

## The smallest working config

Whichever route you choose, only two settings really matter to get started:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` is the address people (and QR-code deep links) use to reach the app. For local testing `http://localhost:8080` is fine. For a real deployment, set it to your public URL, for example `https://bees.example.com`.

Everything else has sensible defaults for self-hosting. The full list lives in [Configuration](/self-hosting/configuration).

## Option A — Single binary (no Docker)

### Prerequisites

- Go 1.25 or newer
- Node 22 or newer
- [buf](https://buf.build/docs/installation)

### Build and run

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: set BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

By default the binary listens on `:8080` and serves the web app itself (`BEEHIVE_SERVE_WEB=true`), so the API and the PWA come from the same origin. Open the address in `BEEHIVE_PUBLIC_BASE_URL` and you are in.

:::note Where your data lives
In selfhost mode your records go into a local SQLite file and uploaded photos into a blob directory (`./data/blobs` by default). Back these up and you have backed up everything — see [Backups](/self-hosting/backups).
:::

## Option B — Docker

If you have Docker installed, this is the quickest route of all. The published image is `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

The `-v openbeehive-data:/data` volume keeps your SQLite database and blobs outside the container so they survive upgrades and restarts. Once it is running, open `http://localhost:8080`.

To stop or remove it:

```bash
docker stop openbeehive
docker rm openbeehive
```

:::tip Cloud stack instead?
The commands above run the lightweight selfhost profile. If you want the full **cloud** profile (PostgreSQL + MinIO), the repository ships a Compose file — run `docker compose up -d`. See [Docker](/self-hosting/docker) for the details.
:::

## First steps after install

You now have a working instance. From here:

1. Open the app at your `BEEHIVE_PUBLIC_BASE_URL` and create your first apiary.
2. Add a hive, choose its type, and record an inspection.
3. Optionally print a QR label for the hive so you can scan straight to it in the field.

For a tour of the app itself, head to [Using the app](/category/using-the-app). To make your instance production-ready — HTTPS, a real domain, authentication, and backups — continue with:

- [Configuration](/self-hosting/configuration) — every environment variable explained
- [Reverse proxy](/self-hosting/reverse-proxy) — put TLS and a domain in front
- [Authentication](/self-hosting/authentication) — add OIDC sign-in or passkeys
- [Backups](/self-hosting/backups) — protect your records

:::caution Use HTTPS in production
`http://localhost` is only suitable for local testing. Exposing the app on the internet without TLS risks your data and breaks features that require a secure context. Set `BEEHIVE_PUBLIC_BASE_URL` to an `https://` address and terminate TLS at a reverse proxy before you go live.
:::
