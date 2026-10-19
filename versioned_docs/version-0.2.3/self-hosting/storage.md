---
sidebar_position: 6
title: "Blob storage"
---

# Blob storage

Openbeehive stores your records in a database, but photos and other binary
attachments live separately in **blob storage**. This keeps the database lean
and lets you scale image storage independently.

You choose a backend with the `BEEHIVE_BLOB_BACKEND` environment variable. There are two
options: the local **filesystem** and an **S3-compatible** object store such as
**MinIO**.

## Choosing a backend

| Backend | `BEEHIVE_BLOB_BACKEND` | Best for | Notes |
| --- | --- | --- | --- |
| Filesystem | `fs` | Single-server self-hosting | Simplest; no extra services to run |
| MinIO / S3 | `minio` | Cloud, multi-server, larger fleets | Scalable, durable, can be offloaded |

A good rule of thumb: if you run the **selfhost** profile on one machine, use the
filesystem. If you run the **cloud** profile or expect to grow, use object
storage.

:::note
The blob backend is independent of your database driver. You can pair SQLite
with MinIO, or PostgreSQL with the filesystem, in any combination that suits
your setup.
:::

## Filesystem storage

This is the default for self-hosting. Photos are written to a directory on disk.

```bash
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
```

`BEEHIVE_BLOB_DIR` is where files are stored. The path is relative to the working
directory of the server process, so for predictable results on a server, use an
absolute path such as `/var/lib/openbeehive/blobs`.

Browsers fetch stored files from `<BEEHIVE_PUBLIC_BASE_URL>/files`. If a reverse
proxy or CDN serves that directory from another address, set
`BEEHIVE_BLOB_PUBLIC_URL` to the base URL it exposes; the server uses it when it
hands file links to the app.

The server creates the directory if it does not exist, but make sure the process
owns it and can write to it.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution Back it up
The blob directory is **not** stored in your database. A database backup alone
will not save your photos. Include `BEEHIVE_BLOB_DIR` in your backup routine. See
[Backups](/self-hosting/backups) for a full strategy.
:::

### Docker note

If you run the [Docker image](/self-hosting/docker), mount a volume so blobs
survive container restarts and upgrades:

```bash
docker run -d \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-blobs:/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## MinIO / S3 storage

Object storage is the right choice for the cloud profile and for anyone who
wants durable, scalable photo storage that can live on a separate machine or a
managed service.

```bash
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=play.min.io
BEEHIVE_MINIO_ACCESS_KEY=your-access-key
BEEHIVE_MINIO_SECRET_KEY=your-secret-key
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=true
```

| Variable | Purpose |
| --- | --- |
| `BEEHIVE_MINIO_ENDPOINT` | Host (and optional port) of the object store, without a scheme |
| `BEEHIVE_MINIO_ACCESS_KEY` | Access key / key ID |
| `BEEHIVE_MINIO_SECRET_KEY` | Secret key |
| `BEEHIVE_MINIO_BUCKET` | Bucket where blobs are stored |
| `BEEHIVE_MINIO_USE_SSL` | `true` to connect over HTTPS, `false` for plain HTTP |

:::tip Endpoint format
Give `BEEHIVE_MINIO_ENDPOINT` as a host, optionally with a port, for example
`minio.example.com` or `minio.example.com:9000`. Do not include `https://`.
Control the scheme with `BEEHIVE_MINIO_USE_SSL` instead.
:::

### Creating the bucket

The server expects the bucket named in `BEEHIVE_MINIO_BUCKET` to exist. Create it once
before starting Openbeehive.

Using the MinIO client `mc`:

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

Or using the AWS CLI against any S3-compatible endpoint:

```bash
aws --endpoint-url https://minio.example.com:9000 \
  s3 mb s3://openbeehive
```

On Amazon S3 itself you can create the bucket from the AWS Console or with the
command above (omitting `--endpoint-url`).

:::caution Keep the bucket private
Blobs may contain identifying photos of your apiaries. Do not make the bucket
publicly readable. Openbeehive serves images through the API, so the object
store does not need public access.
:::

## S3 compatibility

The MinIO backend speaks the standard S3 API, so it works with any
S3-compatible provider, not just MinIO. That includes:

- **MinIO** (self-hosted object storage)
- **Amazon S3**
- Other S3-compatible services (for example Backblaze B2's S3 endpoint,
  Cloudflare R2, Wasabi, or Ceph RADOS Gateway)

For these, point `BEEHIVE_MINIO_ENDPOINT` at the provider's S3 endpoint, set the access
and secret keys, choose your bucket, and set `BEEHIVE_MINIO_USE_SSL=true`.

| Provider | Example endpoint |
| --- | --- |
| Amazon S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2 | `s3.<region>.backblazeb2.com` |
| MinIO (self-host) | `minio.example.com:9000` |

:::note Regions and addressing
Some providers are sensitive to region settings or require path-style versus
virtual-hosted addressing. If uploads fail with a provider other than MinIO,
double-check the endpoint and that the bucket exists in the expected region.
See [Troubleshooting](/knowledge-base/troubleshooting) if problems persist.
:::

## Switching backends later

If you start on the filesystem and later move to object storage, existing photos
are not migrated automatically. Plan to copy the contents of `BEEHIVE_BLOB_DIR` into your
bucket (for example with `mc cp --recursive` or `aws s3 sync`) before switching
`BEEHIVE_BLOB_BACKEND`, so older inspection photos remain available.

## Related

- [Configuration](/self-hosting/configuration) — full list of environment variables
- [Databases](/self-hosting/databases) — choosing and configuring the database
- [Backups](/self-hosting/backups) — protecting both records and blobs
