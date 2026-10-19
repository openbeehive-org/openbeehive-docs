---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Run Openbeehive as a single container for a self-host setup, or bring up the full cloud stack (Postgres and MinIO) with Docker Compose.

The image is published to the GitHub Container Registry on every release tag:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

The same image serves both deployment profiles; the environment you pass in decides which one you get.

:::tip
For a single-user instance on one machine the [single binary](/self-hosting/single-binary) is even simpler than Docker. Reach for Compose when you want Postgres and S3-style storage.
:::

## Run the single container

One container with the `selfhost` profile keeps a SQLite database and the uploaded blobs on one mounted volume. Nothing else is required.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 8080:8080` maps the container's listen port (`BEEHIVE_ADDR=:8080`) to the host.
- `-v openbeehive-data:/data` keeps your data on a named volume. It only does its job together with the `BEEHIVE_DATABASE_DSN` and `BEEHIVE_BLOB_DIR` lines: the image has no working directory, so the defaults (`openbeehive.db`, `./data/blobs`) resolve to the container's root and are lost when the container is removed.
- `BEEHIVE_PUBLIC_BASE_URL` must be the address users reach, including scheme. The server uses it for OIDC redirect URLs and for invite and verification links.

With no login method enabled (the selfhost default) the instance runs in single-user mode. To add authentication, set `BEEHIVE_SESSION_SECRET` (generate it once with `openssl rand -base64 32` and keep it stable; changing it signs everyone out) plus the variables for the method you want. Email/password login also needs `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD`, or the server refuses to start. See [Authentication](/self-hosting/authentication).

### Using an env file

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## The cloud profile with Compose

The `cloud` profile pairs the server with PostgreSQL and MinIO. The repository's `docker-compose.yml` is a development stack: it builds the server from source and publishes the database and MinIO ports on the host.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
cp .env.example .env   # then edit .env (see below)
docker compose up -d --build
```

### The services

| Service | Image | Role |
| --- | --- | --- |
| `server` | built from the repository `Dockerfile` | Backend and web app on `:8080` |
| `postgres` | `postgres:18-alpine` | Database; `5432` published on the host |
| `minio` | `minio/minio:latest` | S3-compatible blob storage; `9000` (API) and `9001` (console) published on the host |

`server` depends on `postgres` and `minio`, so Compose starts them first.

### What the compose file sets

These values are hard-coded in `docker-compose.yml` and are not read from `.env`; change them by editing the file (and change the Postgres and MinIO credentials in the same place):

| Setting | Value in the compose file |
| --- | --- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `cloud` |
| `BEEHIVE_DATABASE_DSN` | `postgres://openbeehive:openbeehive@postgres:5432/openbeehive?sslmode=disable` |
| `BEEHIVE_MINIO_ENDPOINT` | `minio:9000` |
| `BEEHIVE_MINIO_ACCESS_KEY` / `BEEHIVE_MINIO_SECRET_KEY` | `minioadmin` / `minioadmin` |
| `BEEHIVE_OIDC_PROVIDERS` | `google` |

These come from your shell or `.env`:

```bash
# Required: the cloud profile enables password auth, which needs the instance admin.
# docker compose up fails immediately if either is missing.
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters

# Sessions; generate with: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=

# Defaults to http://localhost:8080
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Google is enabled as an OIDC provider in the compose file, so these are
# required too; without a client ID the server exits with
# "OIDC provider google: issuer/client id missing". Remove the BEEHIVE_OIDC_*
# lines from docker-compose.yml if you do not want Google sign-in.
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Service names are hostnames
Inside the Compose network, containers reach each other by service name, which is why the DSN points at `postgres` and the MinIO endpoint at `minio`.
:::

### A production-shaped file

`docker-compose.demo.yml` in the repository is the file behind the hosted instance: it uses the published image instead of building, publishes no database or MinIO ports, adds restart policies and healthchecks, takes every secret from `.env`, closes registration (invite-only) and enables the [demo tenant](/self-hosting/demo). Its header comment lists the variables it needs. Use it as the starting point for your own production stack:

```bash
docker compose -f docker-compose.demo.yml up -d
```

For the full list of variables see [Configuration](/self-hosting/configuration).

## Persisting your data

- **Single container (`selfhost`):** everything is under `/data` on the `openbeehive-data` volume, as long as the DSN and blob directory point there.
- **Cloud profile:** records live in the `pg` volume (Postgres) and uploaded files in the `minio` volume. The server container is stateless and can be replaced freely.

:::danger Back up before you upgrade
Named volumes survive `docker compose up` and image upgrades, but not `docker compose down -v` or a removed volume. Take a backup before any upgrade or destructive command. See [Backups](/self-hosting/backups).
:::

## Common operations

```bash
# Follow the server logs
docker compose logs -f server

# Rebuild from updated source and recreate (docker-compose.yml builds the image)
git pull && docker compose up -d --build

# Pull a newer published image and recreate (docker-compose.demo.yml or your own file)
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d

# Stop everything (volumes are kept)
docker compose down
```
