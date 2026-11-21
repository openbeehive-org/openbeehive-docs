---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Run Openbeehive as a single container for a self-host setup, or bring up PostgreSQL, MinIO and the server together with Docker Compose. The repository ships a Compose file for each case:

| File | What it runs | Use it for |
| --- | --- | --- |
| `docker-compose.selfhost.yml` | One container, SQLite and files on a named volume | One beekeeper or a household on one machine |
| `docker-compose.prod.yml` | The released image with PostgreSQL and MinIO, login always on | An instance with several users |
| `docker-compose.yml` | PostgreSQL, MinIO and a server built from the checkout | Development. Not a production template |
| `docker-compose.demo.yml` | Like the production file plus the public read-only demo | The hosted instance at `app.openbeehive.org`. Not a template for your own server |

The image is published to the GitHub Container Registry on every release tag:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

The same image serves both deployment profiles; the environment you pass in decides which one you get. Since 0.4.0 the container runs as the unprivileged user `65532` with `/data` as its working directory.

### Verifying a release image

Every release image is signed with [cosign](https://docs.sigstore.dev/cosign/verifying/verify/) (keyless, bound to the release workflow's identity), carries a GitHub build-provenance attestation and ships an SBOM on the [GitHub release](https://github.com/openbeehive-org/openbeehive-app/releases). To check that the image you pull is the one the release workflow built:

```bash
cosign verify ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/openbeehive-org/openbeehive-app/\.github/workflows/release\.yml@.*'

gh attestation verify oci://ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z --owner openbeehive-org
```

Both commands print the signing identity and the commit the image was built from. Images published before 0.4.0 are not signed.

:::tip
For a single-user instance on one machine the [single binary](./single-binary.md) is even simpler than Docker. Reach for the production Compose file when several people use the instance.
:::

## Run the single container

One container with the `selfhost` profile keeps a SQLite database and the uploaded files on one mounted volume. Nothing else is required.

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 127.0.0.1:8080:8080` publishes the port on this machine only. Without login everyone who can reach the port has full access, so publish it on the network (`-p 8080:8080`) only after you have [turned login on](./quick-start.md#turn-login-on).
- `-v openbeehive-data:/data` keeps your data on a named volume. `/data` is the working directory, so the defaults (`openbeehive.db`, `./data/blobs`) land on the volume. Docker creates the volume with the ownership of `/data` in the image, so the unprivileged server user can write to it. If you bind-mount a host directory instead (`-v /srv/openbeehive:/data`), it must be owned by uid `65532`: `sudo chown -R 65532:65532 /srv/openbeehive`.
- A server without login answers only to `localhost`, IP addresses and the host of `BEEHIVE_PUBLIC_BASE_URL`. If you open it under another name (for example `http://nas.local:8080`), set `BEEHIVE_PUBLIC_BASE_URL` to that address or list the name in `BEEHIVE_ALLOWED_HOSTS`.

### The same as a Compose file

`docker-compose.selfhost.yml` is the command above with a restart policy and a health check. It takes its settings from an `.env` file next to it:

```bash
# .env (all optional; without it the instance has no login and is published on 127.0.0.1)
BEEHIVE_BIND=0.0.0.0                              # publish on the network
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org  # the address people open
BEEHIVE_PASSWORD_AUTH=true                        # require sign-in
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please           # 8+ characters
BEEHIVE_SESSION_SECRET=...                        # openssl rand -base64 32
BEEHIVE_TRUST_PROXY_HEADERS=true                  # only behind a reverse proxy
```

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

With plain `docker run`, pass the same variables with `-e` or `--env-file openbeehive.env`. Any login method needs `BEEHIVE_SESSION_SECRET` (32 bytes or more; generate it once and keep it stable, changing it signs everyone out). See [Authentication](./authentication.md).

## Several users: PostgreSQL and MinIO \{#several-users}

`docker-compose.prod.yml` runs the released image in the `cloud` profile with PostgreSQL and MinIO. Login is always on (email and password), registration is closed unless you open it, and only the app port is published, on `127.0.0.1`, for your [reverse proxy](./reverse-proxy.md). PostgreSQL and MinIO are not published at all.

The file refuses to start until every secret is set. Put them in an `.env` file next to it:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org
BEEHIVE_SESSION_SECRET=...      # openssl rand -base64 32
POSTGRES_PASSWORD=...           # openssl rand -hex 24
MINIO_ROOT_PASSWORD=...         # openssl rand -hex 24
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=...      # 8+ characters; applied again on every start
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

Optional settings the file passes through: `BEEHIVE_REGISTRATION` (default `false`, invite-only), the `BEEHIVE_SMTP_*` variables for invite and verification mail, and `BEEHIVE_BIND` (set it to `0.0.0.0` only when the reverse proxy runs on another machine, and make sure nothing else can reach the port).

The file sets `BEEHIVE_TRUST_PROXY_HEADERS=true`, because it expects exactly one reverse proxy in front. Run exactly one server instance per database.

### The services

| Service | Image | Role |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app` (pinned release) | Backend and web app on `:8080` |
| `postgres` | `postgres:18-alpine` | Database |
| `minio` | `minio/minio` | S3-compatible blob storage |

`server` waits until `postgres` and `minio` report healthy.

:::note[Service names are hostnames]
Inside the Compose network, containers reach each other by service name, which is why the DSN points at `postgres` and the MinIO endpoint at `minio`.
:::

### The development stack

`docker-compose.yml` builds the server from the checkout and publishes PostgreSQL (`5432`) and MinIO (`9000`, `9001`) on `127.0.0.1` for local tools. It needs `BEEHIVE_SESSION_SECRET`, `MINIO_ROOT_PASSWORD`, `BEEHIVE_ADMIN_EMAIL` and `BEEHIVE_ADMIN_PASSWORD` in `.env`. OIDC is opt-in: set `BEEHIVE_OIDC_PROVIDERS` together with the provider's issuer and client id. It is meant for working on Openbeehive, not for running it.

```bash
cp .env.example .env   # then add the four values above
docker compose up -d --build
```

For the full list of variables see [Configuration](./configuration.md).

## Persisting your data

- **Single container (`selfhost`):** everything is under `/data` on the `openbeehive-data` volume.
- **PostgreSQL and MinIO:** records live in the `pg` volume and uploaded files in the `minio` volume. The server container is stateless and can be replaced freely.

:::danger[Back up before you upgrade]
Named volumes survive `docker compose up` and image upgrades, but not `docker compose down -v` or a removed volume. Take a backup before any upgrade or destructive command. See [Backups](./backups.md).
:::

## Common operations

```bash
# Follow the server logs
docker compose -f docker-compose.prod.yml logs -f server

# Pull the image named in the Compose file and recreate
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rebuild the development stack from updated source
git pull && docker compose up -d --build

# Stop everything (volumes are kept)
docker compose -f docker-compose.prod.yml down
```

The Compose files pin a release by tag and digest. To move to a newer release, update the file from the repository (or change the tag) and follow [Upgrading](./upgrading.md).
