---
sidebar_position: 5
title: "Databases"
---

# Databases

Openbeehive stores all of its server-side data in a relational database. The backend is database-agnostic: it speaks to a pluggable storage layer and ships drivers for **SQLite**, **PostgreSQL** and **MariaDB**. You choose which one to use with two environment variables.

All three are tested on every change: SQLite, PostgreSQL 18 and MariaDB 13.0.2. The `mysql` driver means MariaDB; Oracle MySQL 8 should work but is not part of the tests.

This page explains how to pick the right database for your situation and how to configure it correctly.

:::note[Where does the offline data live?]
The app on your phone or laptop keeps its own local SQLite-WASM database and works fully offline. The server database described here is the central copy that devices sync to in the background. They are separate stores; this page is only about the server.
:::

## The two settings

Every database is configured through the same pair of variables:

| Variable | Purpose |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Which engine to use: `sqlite`, `postgres` or `mysql` (MariaDB). |
| `BEEHIVE_DATABASE_DSN` | The connection string (Data Source Name) for that engine. |

The `selfhost` deployment profile defaults to SQLite, and the `cloud` profile defaults to PostgreSQL. You can override either by setting these two variables explicitly. See [Configuration](./configuration.md) for the full list of environment variables.

## Which database should I choose?

| Situation | Recommended |
| --- | --- |
| Single beekeeper, one server, simplest possible setup | **SQLite** |
| A few household members sharing apiaries | SQLite or PostgreSQL |
| Many users, heavy concurrent sync, or hosted/cloud deployment | **PostgreSQL** |
| You already run MariaDB and want one fewer thing to operate | **MariaDB** |

:::tip[In short]
If in doubt, use SQLite. It needs no separate service, lives in a single file, and is perfectly capable of running a personal or family beehive. Move to PostgreSQL when you have genuine multi-user concurrency or want managed cloud hosting.
:::

## SQLite (default for self-host)

SQLite is the zero-dependency choice. There is no database server to install or manage: your data lives in one file on disk, which makes [backups](./backups.md) as easy as copying that file.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

This is the default of the `selfhost` profile. The `_pragma=journal_mode(WAL)` part enables **Write-Ahead Logging**. WAL lets readers and a writer work at the same time without blocking each other, which noticeably improves behaviour when several devices sync at once. We strongly recommend keeping it on.

The two pragmas (separated with `&`):

- `journal_mode(WAL)` — concurrent reads alongside a writer.
- `busy_timeout(5000)` — wait up to 5 seconds for a lock instead of failing immediately.

You can use a relative path (resolved against the server's working directory) or an absolute path such as `file:/var/lib/openbeehive/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)`.

:::caution[WAL creates extra files]
In WAL mode SQLite keeps companion files alongside the main database (`openbeehive.db-wal` and `openbeehive.db-shm`). When backing up by file copy, stop the server first, or use SQLite's own backup tooling, so you capture a consistent snapshot. See [Backups](./backups.md).
:::

## PostgreSQL

PostgreSQL is the right choice for multi-user setups, the hosted service, and any deployment where many devices sync concurrently. It is also the default for the `cloud` profile.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

A more realistic example pointing at a database named `openbeehive`:

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

The `sslmode` parameter controls transport security:

| Value | Meaning |
| --- | --- |
| `disable` | No TLS. Fine for a database on the same host or a trusted private network. |
| `require` | Encrypt the connection (no certificate verification). |
| `verify-full` | Encrypt and verify the server certificate and hostname. Strongest. |

:::caution[Production security]
Use `sslmode=require` or stronger whenever the database talks to the server over a network you do not fully control. Reserve `sslmode=disable` for local-only connections.
:::

Create the database and user before first start, for example:

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MariaDB

MariaDB is supported for those who already operate one. Select it with the `mysql` driver. The DSN format differs from PostgreSQL: it uses the Go MySQL driver syntax.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive
```

The server switches `parseTime` on by itself, so it does not have to be in the DSN.

Give Openbeehive a database of its own and a user that may change its tables:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

- **The user needs `ALTER`** (included in `ALL PRIVILEGES`). Migrations change tables, and on first start the server converts its tables to a binary `utf8mb4` collation so that text compares byte for byte, as it does on SQLite and PostgreSQL.
- **Use a dedicated database.** Do not share it with another application.
- **Leave `max_allowed_packet` at 16 MiB or more** (the MariaDB default). The server accepts requests of up to 16 MiB.

## Migrations run automatically

You do not run migrations by hand. On every start, the server checks the schema and applies any pending migrations before it begins serving requests. A fresh, empty database is set up automatically on first launch.

The SQL is written portably so the same schema works across all three engines; there is no engine-specific setup beyond creating the database and user shown above.

On SQLite and PostgreSQL each migration runs in a transaction, so one that fails is rolled back. MariaDB commits every schema change immediately; its migrations are written so that every statement can run again, and a migration that stopped halfway continues at the next start. PostgreSQL and MariaDB change existing tables in place; SQLite rebuilds a table where it cannot alter a column.

:::tip[Always back up before upgrading]
Because a new release may include migrations that change the schema, take a backup before you upgrade. See [Upgrading](./upgrading.md) and [Backups](./backups.md).
:::

## Switching databases later

The drivers are not interchangeable at the data level: pointing `BEEHIVE_DATABASE_DRIVER` at a different engine does **not** move your records across. To migrate from, say, SQLite to PostgreSQL you would need to export and re-import your data. For most self-hosters the simplest path is to choose the right database up front.

If you only need a central server for yourself, SQLite will serve you well for a long time.

For more on the surrounding setup, see [Self-hosting](/category/self-hosting) and [Storage](./storage.md).
