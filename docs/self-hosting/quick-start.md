---
sidebar_position: 1
title: "Quick start"
---

# Quick start

Two routes to a running Openbeehive instance you can open in a browser:

- **Option A, Docker.** Run the published image with one command.
- **Option B, single binary.** Build one self-contained executable. No Docker, no database server, no object storage. Good for a home server, a Raspberry Pi or a small VPS.

Both use the **selfhost** deployment profile: an embedded SQLite database and files on the local disk. For several users on PostgreSQL and MinIO/S3, see [Docker & Compose](./docker.md#several-users).

:::caution No login out of the box
In the selfhost profile no login method is enabled by default, so the app opens straight to your records and **whoever can reach the port has full access**. That is fine on your own computer. For that reason the examples publish the port on `127.0.0.1` only, and a server without login answers only to `localhost`, IP addresses and the host of `BEEHIVE_PUBLIC_BASE_URL`. Before you open it to other devices or people, [turn login on](#turn-login-on).
:::

## Option A: Docker

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Open `http://localhost:8080`. The container's working directory is `/data`, so the database (`openbeehive.db`) and the uploaded files (`data/blobs`) land on the `openbeehive-data` volume and survive restarts and upgrades.

The repository ships the same setup as a Compose file, [`docker-compose.selfhost.yml`](https://github.com/openbeehive-org/openbeehive-app/blob/main/docker-compose.selfhost.yml), which reads its settings from an `.env` file next to it:

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

To stop or remove the container (the volume stays):

```bash
docker stop openbeehive
docker rm openbeehive
```

## Option B: single binary (no Docker)

### Prerequisites

- Go 1.27 or newer
- Node 24 or newer (the published image builds with Node 26)
- [buf](https://buf.build/docs/installation) (`make tools` installs the pinned version)

### Build and run

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure (optional): the defaults already are the selfhost profile
cp .env.example .env

# Run
./server/bin/openbeehive
```

The binary reads `.env` from the directory it is started in; variables that are already set in the environment win. By default it listens on `:8080` and serves the web app itself (`BEEHIVE_SERVE_WEB=true`), so the API and the PWA come from the same origin. Open `http://localhost:8080`.

The first lines of the log say how the server is configured, including who may use it:

```text
config: applied .env from the working directory (existing environment variables win)
Openbeehive · profile=selfhost · DB=sqlite · Blob=fs
auth: NO LOGIN (single-user mode): every request has full access to all data
auth: accepting requests for hosts: localhost, IP addresses (add names with BEEHIVE_ALLOWED_HOSTS)
```

:::note Where your data lives
In selfhost mode your records go into a SQLite file (`openbeehive.db` in the working directory by default) and uploaded files into a blob directory (`./data/blobs` by default). Back up both and you have backed up everything; see [Backups](./backups.md).
:::

## Turn login on \{#turn-login-on}

To reach the instance from other devices or share it with others, require sign-in. Put these settings in `.env` (next to the binary, or next to `docker-compose.selfhost.yml`), or pass them with `-e` to `docker run`:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org   # the address people open
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please            # 8+ characters
BEEHIVE_SESSION_SECRET=...                         # openssl rand -base64 32
BEEHIVE_BIND=0.0.0.0                               # Compose file only: publish on the network
```

- `BEEHIVE_PUBLIC_BASE_URL` is the address the server puts into the links it generates (OIDC redirects, invite and verification links).
- `BEEHIVE_SESSION_SECRET` must be at least 32 bytes. With any login method the server refuses to start without it.
- `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` define the instance admin; with email/password login the server refuses to start without them.

Records made before login was switched on move into the admin's workspace at the next start; sign in as the admin to see them. Details and the other login methods are in [Authentication](./authentication.md).

## First steps after install

1. Open the app and create your first apiary.
2. Add a hive, edit it to set its type, and record a visit.
3. Print a QR label for the hive so you can scan straight to it in the field.

Before you expose the instance to the internet, put a TLS-terminating [reverse proxy](./reverse-proxy.md) in front of it, set `BEEHIVE_PUBLIC_BASE_URL` to the `https://` address and `BEEHIVE_TRUST_PROXY_HEADERS=true`. Then set up [backups](./backups.md). Run exactly one server instance per database.
