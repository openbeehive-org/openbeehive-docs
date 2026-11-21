---
sidebar_position: 9
title: "Backups & restore"
---

# Backups & restore

A few minutes spent setting up backups now will save you a great deal of worry later. This page covers what to back up, how to do it safely, and how to restore when you need to.

:::tip[The server is the source of truth]
Every device that uses your instance keeps a local copy of its data in the browser. That copy is a convenience, not a backup: it can be wiped by clearing site data, reinstalling, or losing the device.

For anything shared across people or devices, the **server** is the authoritative copy. Back up the server, and you protect everyone's records at once.
:::

## What to back up

There are two things on the server worth protecting:

| Item | Where it lives | Backup target |
| --- | --- | --- |
| The database | SQLite file, or PostgreSQL/MariaDB | A consistent copy or dump |
| Blobs (full-size photo images) | Local filesystem, or MinIO/S3 | The blob directory or bucket |

Which database and blob store you have depends on your deployment profile:

- **`selfhost`** uses a single SQLite file and a local blob directory (`BEEHIVE_BLOB_DIR`, default `./data/blobs`).
- **`cloud`** uses Postgres and a MinIO/S3 bucket.

Back up **both** the database and the blobs. The database holds your apiaries, hives, queens, inspections, events and the photo records with their thumbnails; the blob store holds the full-size images. A database backup without its blobs leaves photos that show only their thumbnail.

:::tip[Database first, then blobs]
When you back up while the server runs, copy the database first and the blobs right after. Images are written once and never changed, so a blob copy taken later contains every image the database copy knows. Extra images that the restored database does not know are kept for at least 30 days, in case a device sends their records again, and then removed by the server's [upkeep](./storage.md#upkeep).
:::

## Backing up SQLite (selfhost)

SQLite stores your data in one file (for example `openbeehive.db`) plus two companion files when write-ahead logging is on:

- `openbeehive.db-wal` — recent changes not yet folded into the main file
- `openbeehive.db-shm` — shared-memory index for the WAL

:::caution[Do not copy the `.db` file on its own while the server is running]
With WAL enabled (the recommended setting), the newest data may still be in the `-wal` file. A plain `cp openbeehive.db backup.db` of a running database can produce an inconsistent or stale copy.
:::

You have two safe options.

### Option A — stop the service, then copy

The simplest reliable method. Stop Openbeehive so nothing is writing, copy all three files together, then start it again.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

The `-wal` and `-shm` files may not exist if the database has just been checkpointed — that is fine, hence the `|| true`.

### Option B — WAL-safe online backup (no downtime)

The SQLite command-line tool can take a consistent snapshot while the server keeps running, using the built-in backup API:

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

This writes a single, self-contained `.db` file that already includes everything from the WAL, so you do **not** need to copy the `-wal` or `-shm` files alongside it. This is the recommended approach for unattended backups.

## Backing up Postgres (cloud)

Use `pg_dump` to produce a logical dump. It is consistent without stopping the service.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

The custom format compresses well and restores with `pg_restore`. For MariaDB, the equivalent is `mariadb-dump --single-transaction`.

## Backing up blobs

### Local filesystem

Copy the blob directory. Files here are written once and not modified in place, so a recursive copy is safe even while the server runs (deleted photos disappear from it, hence `--delete`):

```bash
rsync -a --delete ./data/blobs/ /backups/blobs/
```

### MinIO / S3

Mirror the bucket with the MinIO client or the AWS CLI:

```bash
mc mirror --overwrite myminio/openbeehive /backups/blobs/
# or
aws s3 sync s3://openbeehive /backups/blobs/
```

If you use a managed S3-compatible store, you can also rely on its own versioning or lifecycle policies as a second line of defence.

## Restoring \{#restoring}

A restore always follows the same three steps: **stop** the server, restore the **database and the blobs together** from the same backup, **start** the server. Do not let the server answer requests in between: it has to start on the restored database before any device syncs, because that start is how it recognises the restore (see [after a restore](#after-a-restore)).

### SQLite

```bash
systemctl stop openbeehive

cp /backups/openbeehive.db ./openbeehive.db
rm -f ./openbeehive.db-wal ./openbeehive.db-shm   # let SQLite rebuild these
rsync -a --delete /backups/blobs/ ./data/blobs/

systemctl start openbeehive
```

Remove any stale `-wal`/`-shm` files before starting, so SQLite opens cleanly from the restored file.

### Postgres

```bash
systemctl stop openbeehive

pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
mc mirror --overwrite --remove /backups/blobs/ myminio/openbeehive   # blob directory: rsync as above

systemctl start openbeehive
```

With Docker Compose, `docker compose stop server` and `docker compose start server` take the place of `systemctl`.

### What devices do after a restore \{#after-a-restore}

A restored database is older than what some devices have already seen. The server notices this at the next sync of each device and the app repairs it by itself:

- **Updated apps (0.5.0 and later) that had synced past the backup** upload every record they hold again, together with the photo images they still keep, and then load the current data from the server. Changes that the backup lost come back this way; where the server still has a change, nothing happens. The app shows "The server's data was reset or restored. This device has sent its records again and loaded the current data."
- **Devices that had not synced past the backup** continue as usual.
- **Installed 0.4.x apps** get no such signal and upload nothing again. One whose position lies beyond the restored database reads the data again from the start. What only such a device had is not restored, so update the app on every device before you rely on this.

Changes made on a device while the server was down are uploaded as usual once it is back.

## A simple cron schedule

A nightly job that snapshots the database and mirrors the blobs is enough for most self-hosters. Add this to your crontab with `crontab -e`:

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

The `%` characters must be escaped as `\%` inside crontab. For Postgres, swap the `sqlite3` call for the `pg_dump` command shown above. The database is copied first and the blobs right after, as recommended above.

## Exports are not server backups

**Settings → Data & sync** in the app downloads a workspace as JSON, or as a ZIP with photos; the server copy is also available at `GET /export` (see [Import & export](../using-the-app/import-export.md)). Such an export is useful for moving one workspace or keeping your own copy, but it holds one workspace only, without accounts, members or API keys. For a whole instance, back up the database and the blobs as described above.

:::tip[Test your restores]
A backup you have never restored is only a hope. Every so often, restore into a throwaway directory or test instance and confirm you can open the app and see your hives. Keep at least a few days of dated copies, and store one off-site (an external drive or remote bucket).
:::
