---
sidebar_position: 10
title: "Upgrading"
---

# Upgrading

Keeping your Openbeehive instance current means new features, fixes and security patches. Upgrades are deliberately simple: replace the binary or pull a new image, restart, and the server brings your database up to date on its own.

This page covers the safe upgrade routine, version numbering, and how to roll back if something goes wrong.

:::caution Back up first, every time
Always take a backup before upgrading. It only takes a moment and it is the one thing that turns a bad upgrade into a non-event. See [Backups](/self-hosting/backups) for how to snapshot your database and blob storage.
:::

## Before you start

A good upgrade takes five minutes and a little reading:

1. **Read the release notes.** Check the [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app) and the GitHub release for the version you are moving to. Note any breaking changes, new required configuration, or manual steps.
2. **Back up** your database and blob storage.
3. **Note your current version** so you know what to roll back to if needed.
4. **Pick a quiet moment.** Upgrades involve a short restart. Because the app is offline-first, anyone using it keeps working locally and syncs once the server is back.

## How migrations work

Database schema migrations run **automatically** when the server starts. There is no separate migrate command to remember.

On boot the server checks the schema version recorded in your database, applies any pending migrations in order, and only then begins serving requests. This works the same across all supported drivers (PostgreSQL, MySQL and SQLite).

:::note
Because migrations run at startup, the very first launch of a new version may take a little longer than usual while the schema is updated. Watch the logs to confirm it finishes cleanly before sending traffic to it.
:::

## Upgrading the single binary

If you run the single-file `selfhost` build, an upgrade is a file swap.

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp ./server/bin/openbeehive ./server/bin/openbeehive.bak
# (also back up your SQLite database + blob directory — see Backups)

# 3. Replace the binary with the new release, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Building from source instead? Pull the new tag and rebuild:

```bash
git fetch --tags
git checkout v0.1.0
make proto && make build
```

This produces a fresh `./server/bin/openbeehive`. See [Single binary](/self-hosting/single-binary) for the full build prerequisites (Go 1.25+, Node 22+, buf).

## Upgrading with Docker

For the `cloud` profile (or any Docker deployment), pull the new image and recreate the container.

```bash
# 1. Pull the new image
docker compose pull

# 2. Recreate containers with the new image
docker compose up -d

# 3. Follow the logs to confirm a clean start and migrations
docker compose logs -f openbeehive
```

The published image is `ghcr.io/openbeehive-org/openbeehive-app:latest`. For reproducible deployments, pin a specific version tag rather than `latest`, so you always know exactly what is running.

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:v0.1.0
```

See [Docker](/self-hosting/docker) for the full Compose setup.

## Versioning

Openbeehive follows [semantic versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

| Part | Example | Means |
| --- | --- | --- |
| MAJOR | `1.0.0` | Breaking changes; read the upgrade notes carefully |
| MINOR | `0.2.0` | New features, backward compatible |
| PATCH | `0.1.1` | Bug fixes and security patches, backward compatible |

The current release is **v0.1.0**, the first public release.

:::caution v0.1.x is early software
While Openbeehive is in the `0.x` series, minor releases may include changes that need manual steps or that are not fully backward compatible. Read the release notes for every upgrade, not just major ones, and keep your backups close.
:::

## Rolling back

If an upgrade misbehaves, roll back to the version you came from.

The important rule: **a newer schema may not be readable by an older binary.** Once migrations have run, simply downgrading the application is not guaranteed to work. The reliable way to roll back is to restore both the application *and* the database from before the upgrade.

1. Stop the service.
2. Restore the database (and, if relevant, blob storage) from the backup you took before upgrading. See [Backups](/self-hosting/backups).
3. Reinstall the previous binary or image version.
4. Start the service and confirm it comes up cleanly.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit your compose file to the previous tag, e.g. v0.1.0
docker compose up -d
```

:::danger
Do not restore an old database under a newer binary, or run a newer database under an older binary, except for the matched pair you backed up together. Mismatched schema and code can corrupt data. Always restore the binary and the database as a set.
:::

## After upgrading

- Check the logs for errors or migration warnings.
- Open the app and confirm your apiaries, hives and recent inspections appear as expected.
- Trigger a sync from a client device and confirm changes flow both ways.

If something looks wrong, see [Troubleshooting](/knowledge-base/troubleshooting), and don't hesitate to roll back to your backup while you investigate.
