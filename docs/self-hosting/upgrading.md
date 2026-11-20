---
sidebar_position: 10
title: "Upgrading"
---

# Upgrading

Upgrades are simple: replace the binary or pull a new image, restart, and the server brings the database schema up to date on its own.

:::caution Back up first, every time
Take a backup before upgrading. See [Backups](./backups.md).
:::

## Before you start

1. **Read the release notes.** Check the [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) and the [GitHub release](https://github.com/openbeehive-org/openbeehive-app/releases) for the version you are moving to. Note new required configuration or manual steps.
2. **Back up** the database and blob storage.
3. **Note your current version** (the tag you built or the image tag you run) so you know what to roll back to.
4. **Pick a quiet moment.** The restart is short; devices keep working locally and sync once the server is back.

## Release-specific steps

### Upgrading to 0.5.0 \{#upgrading-to-050}

0.5.0 tightens several defaults. Back up first, then go through this list; where a setting is missing the server stops at start and names it.

**Settings**

- **Session secret.** With any login method, `BEEHIVE_SESSION_SECRET` must be set and at least 32 bytes long, or the server does not start. Generate one with `openssl rand -base64 32`; a new secret signs everyone out.
- **`.env` is read by the binary.** The server now loads `.env` from its working directory. Check that an old `.env` lying there contains what you want; real environment variables still win.
- **CORS is same-origin by default.** If the app is served from another origin than the API, list it in `BEEHIVE_CORS_ALLOWED_ORIGINS`. `*` no longer allows credentials.
- **No login: only known host names.** A server without login answers only to `localhost`, IP addresses and the host of `BEEHIVE_PUBLIC_BASE_URL`. Put other names in `BEEHIVE_ALLOWED_HOSTS`.
- **Email verification needs a mail server.** `BEEHIVE_EMAIL_VERIFICATION=true` requires `BEEHIVE_SMTP_HOST`. Links are no longer written to the log; without SMTP, copy invite links from Settings.
- **OIDC.** A provider listed in `BEEHIVE_OIDC_PROVIDERS` without issuer and client id stops the start. A provider login is attached to an existing account only when both sides have verified the email address.
- **Reverse proxy.** Set `BEEHIVE_TRUST_PROXY_HEADERS=true` behind your proxy, otherwise sign-in throttling counts all users as one address.
- **`BEEHIVE_NODE_ID`** now defaults to a random id per start; remove it from your configuration unless you set it on purpose. The unused sync page-size settings are gone.
- **Change-log retention.** The server now removes change-log entries older than `BEEHIVE_CHANGELOG_RETENTION_DAYS` (default 180, `0` keeps everything). With the default, the first removal happens 180 days after the upgrade.
- **Old apps.** `BEEHIVE_SYNC_MIN_PROTOCOL` (default `0`) keeps accepting installed 0.4.x apps; set it to `1` once every device has updated.
- **`BEEHIVE_BLOB_PUBLIC_URL`** is ignored and the server warns about it at start; remove it.

**Compose files**

- `docker-compose.yml` is the development stack: it now requires `BEEHIVE_SESSION_SECRET` and `MINIO_ROOT_PASSWORD`, publishes PostgreSQL and MinIO on `127.0.0.1` only, and enables OIDC only when you ask for it.
- To run Openbeehive, use the new `docker-compose.selfhost.yml` (one container, SQLite) or `docker-compose.prod.yml` (PostgreSQL and MinIO). `docker-compose.demo.yml` is the hosted demo and publishes on `127.0.0.1` unless `BEEHIVE_BIND` is set. See [Docker & Compose](./docker.md).

**Data**

- **Turning login on moves single-user records.** If the instance ran without login and you enable email/password login, existing records move into the instance admin's workspace at the next start. This cannot be undone; see [Authentication](./authentication.md#single-user-to-login).
- **Database migrations.** The first start rebuilds the visits table and the change-log index, so it takes longer on a large database. On MariaDB it also converts the tables to a binary collation, and a migration that fails there cannot be rolled back: a backup is the only way back.
- **Photos move to blob storage.** The first start converts the photos stored inline in the database into photo records with their images in blob storage, before the server accepts requests; with many photos this takes a few minutes. From now on a backup is the database **plus** the blob directory or bucket. See [Storage](./storage.md#inline-photos).
- **Restoring a backup** means: stop the server, restore database and blobs together, start it. Updated apps then upload what the backup lost; 0.4.x apps cannot. See [Backups](./backups.md#restoring).
- **Email addresses differing only in case.** Two existing accounts whose addresses differ only in upper and lower case keep working, but email sign-in reaches only one of them. The log names each pair at every start; see [Authentication](./authentication.md#accounts).
- **Run exactly one server instance** per database. Compaction and the photo upkeep run inside the server process.

**Behaviour users and scripts will notice**

- **Invites** expire after 7 days and work only for the invited email address. Open invites older than that must be issued again.
- **Sign-in throttling.** After 10 failed sign-ins for an account or 30 from one address in 15 minutes the server answers `429` with `Retry-After`.
- **Limits.** One RPC message may be at most 16 MiB and a request may take at most 2 minutes (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`).
- **Device clocks.** Changes stamped more than 10 minutes ahead of the server's time are refused. Updated apps correct themselves; a 0.4.x app with a wrong clock loses such changes, so update the app on every device.
- **API.** Update calls change only the fields sent; `DeleteApiary` fails with `failed_precondition` while the apiary has hives; personal tasks are returned only to their owner; inspection numbers that were not recorded are omitted instead of returned as `0`. The plain-HTTP endpoints under `/auth/` and `/tenants/` accept only the documented method, need `Content-Type: application/json` when they take a body, and `/tenants/delete` needs `org_id`. See [REST](../using-the-api/rest.md).
- **Photos over HTTP.** `/files/` is gone. Full-size images are served at `/photos/<id>` to members of the workspace only, with a session or API key.
- **Browser links.** `/auth/verify`, `/auth/login` and `/auth/callback` redirect to the sign-in page with an error message instead of answering with JSON.
- **Scripts that call `SyncService`** must send the header `Openbeehive-Sync-Protocol: 1`; without it they get the data as a 0.4.1 app sees it, without photos or snapshots. See [Sync protocol](../developers/sync-protocol.md#versions).

Installed 0.4.x apps keep working with a 0.5.0 server, but they do not see photos added by updated devices. After the app updates itself, each device loads the current data from the server once more.

### 0.4.0: the container runs as an unprivileged user

Up to 0.3.1 the image ran as root, so a volume created by an older container is owned by root and the 0.4.0 server (uid `65532`) cannot open the database in it. Fix the ownership once, before you start the new image:

```bash
# named volume from the quick start
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

The symptom of a skipped chown is `unable to open database file` or `permission denied` in the server log right after start. Kubernetes deployments with `securityContext.fsGroup: 65532` need no manual step. Volumes created by 0.4.0 or later have the right owner from the start.

The cloud profile (Postgres and MinIO) is unaffected: the server container holds no data.

## How migrations work

Schema migrations run automatically when the server starts. On boot the server applies any pending migrations in order and only then begins serving requests. This works the same for PostgreSQL, MariaDB and SQLite.

:::note
The first launch of a new version may take a little longer while the schema is updated. Watch the logs to confirm it finishes before sending traffic to it.
:::

## Upgrading the single binary

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

To build the new release from source, check out its tag and rebuild:

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

This produces a fresh `./server/bin/openbeehive`. Prerequisites are in [Single binary](./single-binary.md) (Go 1.27+, Node 24+, buf).

## Upgrading with Docker

Which command you need depends on where the image comes from.

**Published image** (the single-container `docker run` from the [quick start](./quick-start.md), or a Compose file with an `image:` line such as `docker-compose.selfhost.yml` or `docker-compose.prod.yml`). The Compose files pin a release by tag and digest; change the `image:` line to the release you want (or take the file from that release), then:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f server
```

For a plain `docker run` container: `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, then `docker rm -f openbeehive` and run the same `docker run` command again. The named volume keeps your data.

**Built from source** (the repository's `docker-compose.yml` has a `build:` section, so `pull` does nothing for it):

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

Image tags are `latest`, `X.Y` (newest patch of a minor release) and `X.Y.Z`. For reproducible deployments pin a specific version rather than `latest`:

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versioning

Openbeehive follows [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

| Part | Means |
| --- | --- |
| MAJOR | Breaking changes; read the upgrade notes carefully |
| MINOR | New features, backward compatible |
| PATCH | Bug fixes and security patches, backward compatible |

:::caution 0.x is early software
While Openbeehive is in the `0.x` series, minor releases may include changes that need manual steps or are not fully backward compatible. Read the release notes for every upgrade, and keep your backups close.
:::

## Rolling back

A newer schema may not be readable by an older binary. Once migrations have run, downgrading the application alone is not guaranteed to work. Restore the application *and* the database from before the upgrade:

1. Stop the service.
2. Restore the database (and, if relevant, blob storage) from the backup you took before upgrading.
3. Reinstall the previous binary or image version.
4. Start the service and confirm it comes up cleanly.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
Do not restore an old database under a newer binary, or run a newer database under an older binary, except for the matched pair you backed up together. Always restore binary and database as a set.
:::

## After upgrading

- Check the logs for errors or migration warnings.
- Open the app and confirm your apiaries, hives and recent visits appear.
- Record something on a device and confirm it syncs.

If something looks wrong, see [Troubleshooting](../knowledge-base/troubleshooting.md) and roll back to your backup while you investigate.
