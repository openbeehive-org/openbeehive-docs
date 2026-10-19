---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Docker is the quickest way to run Openbeehive on a server. You can run the
single container on its own for a tidy self-host setup, or bring up the full
cloud stack (Postgres and MinIO) with Docker Compose.

The official image is published to the GitHub Container Registry:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest
```

The same image works for both deployment profiles. Which one you get is decided
entirely by the environment you pass in.

:::tip Just want it running fast?
If you only need a single-user instance on one machine, the
[single binary](/self-hosting/single-binary) is even simpler than Docker.
Reach for Compose when you want Postgres and S3-style storage.
:::

## Run the single container

The simplest deployment is one container using the `selfhost` profile, which
keeps all its data (a SQLite database and uploaded blobs) on a single mounted
volume. Nothing else is required.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e BEEHIVE_DATABASE_DRIVER=sqlite \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -e BEEHIVE_SESSION_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

A few notes on the flags:

- `-p 8080:8080` maps the container's listen port (set by `BEEHIVE_ADDR=:8080`) to the
  host.
- `-v openbeehive-data:/data` is the important one. It keeps your database and
  uploads on a named Docker volume so they survive container restarts and
  upgrades. Point both `BEEHIVE_DATABASE_DSN` and `BEEHIVE_BLOB_DIR` inside this volume.
- `BEEHIVE_PUBLIC_BASE_URL` must be the address users actually reach, including scheme.
  It is used to build QR-code deep links and OIDC redirect URLs, so get it right.
- `BEEHIVE_SESSION_SECRET` signs session cookies. Generate it once and keep it stable;
  changing it logs everyone out.

:::caution Set a stable session secret
The `$(openssl rand -base64 32)` trick is handy for a first run, but it produces
a new value every time the command runs. Generate the secret once, store it
somewhere safe, and pass the same value on every restart.
:::

With `BEEHIVE_OIDC_PROVIDERS` left empty and `BEEHIVE_WEBAUTHN_ENABLED=false`, the instance runs
in single-user mode with no login. To add authentication, see
[Authentication](/self-hosting/authentication).

### Using an env file

Long `-e` lists get unwieldy. Put your settings in a file and pass it with
`--env-file`:

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## The cloud profile with Compose

The `cloud` profile pairs the server with PostgreSQL for the database and MinIO
for S3-compatible blob storage. This is the recommended setup for multi-user
hosting and the one that mirrors the hosted service.

The repository ships a `docker-compose.yml` that wires the three services
together. Clone the repo, copy the example environment, and bring it up:

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
cp .env.example .env   # then edit .env (see below)
docker compose up -d
```

### The services

| Service | Image | Role |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app:latest` | The Openbeehive backend and PWA, listening on `:8080`. |
| `postgres` | `postgres` | The relational database for all synced records. |
| `minio` | `minio/minio` | S3-compatible object storage for photos and other blobs. |

The `server` depends on both `postgres` and `minio`, so Compose starts them
first. The web app is served by the same container when `BEEHIVE_SERVE_WEB=true`.

### Required environment

Set these in your `.env` before starting. The compose file reads them and passes
them through to the right containers.

```bash
BEEHIVE_DEPLOYMENT_PROFILE=cloud
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Database — host "postgres" is the compose service name
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:changeme@postgres:5432/openbeehive?sslmode=disable

# Blob storage — endpoint "minio" is the compose service name
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=minio:9000
BEEHIVE_MINIO_ACCESS_KEY=minioadmin
BEEHIVE_MINIO_SECRET_KEY=changeme-too
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=false

# Sessions
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_SESSION_TTL=720h

# Authentication (example: Google + Keycloak)
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://bees.example.com/auth/callback
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Service names are hostnames
Inside the Compose network, containers reach each other by service name. That is
why `BEEHIVE_DATABASE_DSN` points at `postgres` and `BEEHIVE_MINIO_ENDPOINT` at `minio` rather
than `localhost`. Change the credentials to match the values you set for the
Postgres and MinIO containers.
:::

For the full list of OIDC and WebAuthn variables, see
[Configuration](/self-hosting/configuration) and
[Authentication](/self-hosting/authentication).

### A trimmed compose example

This is a cut-down illustration of how the services fit together. Use the
`docker-compose.yml` from the repository for the real thing; it includes
healthchecks and sensible defaults this snippet omits.

```docker
services:
  server:
    image: ghcr.io/openbeehive-org/openbeehive-app:latest
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: openbeehive
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: openbeehive
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: changeme-too
    volumes:
      - miniodata:/data
    restart: unless-stopped

volumes:
  pgdata:
  miniodata:
```

## Persisting your data

Beekeeping records are precious, so make sure they live on volumes that outlast
the containers.

- **Single container (`selfhost`):** everything is under `/data`. The named
  volume `openbeehive-data` holds both the SQLite database and the blob
  directory.
- **Cloud profile:** records live in the `pgdata` volume (Postgres) and uploaded
  files in the `miniodata` volume (MinIO). The server container itself is
  stateless and can be replaced freely.

:::danger Back up before you upgrade
Named volumes survive `docker compose up` and image upgrades, but they do not
survive `docker compose down -v` or a removed volume. Take a backup before any
upgrade or destructive command. See [Backups](/self-hosting/backups).
:::

## Common operations

```bash
# Follow the server logs
docker compose logs -f server

# Update to a newer image and recreate
docker compose pull
docker compose up -d

# Stop everything (volumes are kept)
docker compose down
```

## Next steps

- Put a TLS-terminating proxy in front: [Reverse proxy](/self-hosting/reverse-proxy).
- Tune database and storage choices: [Databases](/self-hosting/databases) and
  [Storage](/self-hosting/storage).
- Review every setting in one place: [Configuration](/self-hosting/configuration).
