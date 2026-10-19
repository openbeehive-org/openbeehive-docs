---
sidebar_position: 10
title: "Upgrading"
---

# Upgrading

Upgrades are simple: replace the binary or pull a new image, restart, and the server brings the database schema up to date on its own.

:::caution Back up first, every time
Take a backup before upgrading. See [Backups](/self-hosting/backups).
:::

## Before you start

1. **Read the release notes.** Check the [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) and the [GitHub release](https://github.com/openbeehive-org/openbeehive-app/releases) for the version you are moving to. Note new required configuration or manual steps.
2. **Back up** the database and blob storage.
3. **Note your current version** (the tag you built or the image tag you run) so you know what to roll back to.
4. **Pick a quiet moment.** The restart is short; devices keep working locally and sync once the server is back.

## How migrations work

Schema migrations run automatically when the server starts. On boot the server applies any pending migrations in order and only then begins serving requests. This works the same for PostgreSQL, MySQL and SQLite.

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

This produces a fresh `./server/bin/openbeehive`. Prerequisites are in [Single binary](/self-hosting/single-binary) (Go 1.25+, Node 24+, buf).

## Upgrading with Docker

Which command you need depends on where the image comes from.

**Published image** (the single-container `docker run` from the [quick start](/self-hosting/quick-start), or a Compose file with an `image:` line such as `docker-compose.demo.yml`):

```bash
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml logs -f server
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

If something looks wrong, see [Troubleshooting](/knowledge-base/troubleshooting) and roll back to your backup while you investigate.
