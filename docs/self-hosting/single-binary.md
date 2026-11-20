---
sidebar_position: 2
title: "Single binary"
---

# Single binary

The simplest way to run Openbeehive on your own machine is the **single binary**. In the `selfhost` profile, Openbeehive serves the web app and the API from one process, stores its data in a local SQLite file, and keeps uploaded photos on the filesystem. No Docker, no Postgres, no object store - just one executable.

This page walks you through building that binary from source and running it as a long-lived service.

:::tip In a hurry?
If you would rather pull a prebuilt container image, see [Docker](./docker.md). To compare both approaches first, start at the [self-hosting overview](/category/self-hosting).
:::

## Prerequisites

You will need a few build tools installed on the machine that compiles the binary:

| Tool | Version | Purpose |
| --- | --- | --- |
| Go | 1.27+ | Compiles the server |
| Node.js | 24+ | Builds the SvelteKit web app |
| buf | pinned by `make tools` | Generates the Connect-RPC code from the protobuf definitions |

Once built, the binary itself has no runtime dependencies - you can copy it to a server that has none of the above installed.

## Get the code

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Configure

The server is configured through environment variables, and it reads a `.env` file from the directory it is started in. Variables that are already set in the environment win over the file. Copy the example file:

```bash
cp .env.example .env
```

For a private, single-user instance the built-in defaults are ready to go; these are the ones that matter:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
# Defaults of the selfhost profile:
# BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
# BEEHIVE_BLOB_DIR=./data/blobs
```

:::note No login by default
The selfhost profile enables no login method: `BEEHIVE_PASSWORD_AUTH` is off, `BEEHIVE_OIDC_PROVIDERS` is empty and `BEEHIVE_WEBAUTHN_ENABLED=false`. Everyone who can reach the port then has full access, and the server answers only to `localhost`, IP addresses and the host of `BEEHIVE_PUBLIC_BASE_URL` (add further names with `BEEHIVE_ALLOWED_HOSTS`). When you want accounts, passkeys or a provider, see [Authentication](./authentication.md); any login method needs a `BEEHIVE_SESSION_SECRET` of at least 32 bytes (`openssl rand -base64 32`).
:::

If you intend to reach the instance from another device on your network, set `BEEHIVE_PUBLIC_BASE_URL` to the address that device opens (for example `http://192.168.1.20:8080` or your domain behind a [reverse proxy](./reverse-proxy.md)) and turn login on. QR labels encode the address you open the app at, so use that same address consistently.

## Build

Generate the protobuf code, then compile:

```bash
make proto
make build
```

This produces a single executable:

```text
./server/bin/openbeehive
```

The web app is bundled into the binary, so there is nothing else to deploy alongside it.

## Run

From the repository root, where `.env` is:

```bash
./server/bin/openbeehive
```

On first start the server:

- applies `.env` and logs the profile, the database and whether login is required,
- creates the SQLite database file `openbeehive.db` and runs its migrations,
- creates the `./data/` directory (with `./data/blobs` for photos),
- serves the web app and the Connect-RPC API on `:8080`.

Open `http://localhost:8080` in your browser. The app loads, builds its local database in the browser, and you are ready to add your first apiary.

:::tip Working directory matters
Relative paths like `file:openbeehive.db` and `./data/blobs` are resolved against the directory the binary is launched from, not where the binary lives, and `.env` is read from that same directory. Pick a working directory deliberately - the systemd unit below sets it explicitly with `WorkingDirectory`.
:::

## Run as a systemd service

For an always-on instance, run Openbeehive under systemd so it starts at boot and restarts on failure.

First, place the binary and a working directory somewhere sensible and create a dedicated user:

```bash
sudo useradd --system --home /opt/openbeehive --shell /usr/sbin/nologin openbeehive
sudo mkdir -p /opt/openbeehive
sudo cp server/bin/openbeehive /opt/openbeehive/
sudo cp .env /opt/openbeehive/
sudo chown -R openbeehive:openbeehive /opt/openbeehive
```

Then create the unit file at `/etc/systemd/system/openbeehive.service`:

```text
[Unit]
Description=Openbeehive beekeeping records
After=network.target

[Service]
Type=simple
User=openbeehive
Group=openbeehive
WorkingDirectory=/opt/openbeehive
ExecStart=/opt/openbeehive/openbeehive
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/openbeehive
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

The unit needs no `EnvironmentFile`: the server reads `/opt/openbeehive/.env` itself because that is its working directory. Keep the file readable by the `openbeehive` user only (`chmod 600`), since it holds the session secret and the admin password.

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Check that it is healthy and watch the logs:

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution Binding to port 80 or 443
The example binds to `:8080`, which an unprivileged user can use. Do not run the service as root to reach ports 80/443 - instead keep Openbeehive on `:8080` and put a [reverse proxy](./reverse-proxy.md) (such as Caddy or nginx) in front of it to handle TLS and the public port.
:::

## Where your data lives

In the `selfhost` profile everything is stored under the working directory you chose (above, `/opt/openbeehive`):

| What | Default location | Set by |
| --- | --- | --- |
| Records database | `openbeehive.db` (plus `-wal` / `-shm` files) | `BEEHIVE_DATABASE_DSN` |
| Photos and attachments | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

The `-wal` and `-shm` files alongside the database are SQLite's write-ahead log; treat them as part of the database.

## Moving or backing up your data

Because all state is files in one directory, relocating an instance is mostly a copy job:

1. Stop the service so the database is at rest: `sudo systemctl stop openbeehive`.
2. Copy the binary, `.env`, the database files, and the `data/` directory to the new machine, preserving the layout.
3. Start the service on the new host: `sudo systemctl start openbeehive`.

:::danger Always stop the service first
Copying `openbeehive.db` while the server is running can capture a torn, inconsistent snapshot. Stop the service (or use a proper backup procedure) before copying database files.
:::

For scheduled backups, retention, and safe live-backup techniques for SQLite, see [Backups](./backups.md).

## Upgrading

To move to a newer release, pull the latest code, rebuild, and replace the binary - your database and `data/` directory stay where they are and migrations run on the next start. The full procedure, including how to roll back, is covered in [Upgrading](./upgrading.md).
