---
sidebar_position: 6
title: "Blob storage"
---

# Blob storage

Openbeehive stores your records in a database, but the full-size images of photos live separately in **blob storage**. This keeps the database lean and lets you scale image storage independently.

A photo has two parts. Its record, with a small thumbnail of about 200 pixels, is stored in the database and syncs to every device like any other record. Its full-size image (at most 2048 pixels on the longer edge and 5 MiB) is stored in blob storage under a prefix per workspace (`<workspace>/photos/...`). The server serves it only to signed-in members of that workspace, through `/photos/<id>`; the blob store itself is never exposed. Deleting a photo removes its image, and deleting a workspace removes everything under its prefix.

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

Give the blobs a directory of their own. The server's upkeep lists and deletes files below it, so with SQLite the server refuses to start when `BEEHIVE_BLOB_DIR` contains the database file, and names a directory to use instead.

The server does not serve this directory itself, and nothing else should either: images reach the app only through the authenticated `/photos/` endpoint. Up to 0.4.x the server published the directory under `/files/` and read `BEEHIVE_BLOB_PUBLIC_URL`; both are gone (the server warns at start when the setting is still there).

The server creates the directory if it does not exist, but make sure the process
owns it and can write to it.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution[Back it up]
The blob directory is **not** stored in your database. A database backup alone
will not save your photos. A backup is the database plus `BEEHIVE_BLOB_DIR`, and the two are restored together. See
[Backups](./backups.md).
:::

### Docker note

If you run the [Docker image](./docker.md), mount a volume so blobs
survive container restarts and upgrades. The container runs as uid `65532`;
a bind-mounted host directory must be owned by that user:

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

:::tip[Endpoint format]
Give `BEEHIVE_MINIO_ENDPOINT` as a host, optionally with a port, for example
`minio.example.com` or `minio.example.com:9000`. Do not include `https://`.
Control the scheme with `BEEHIVE_MINIO_USE_SSL` instead.
:::

### The bucket

On start the server checks whether the bucket named in `BEEHIVE_MINIO_BUCKET` exists and creates it if not, so with credentials that may create buckets there is nothing to prepare. If your credentials are restricted to an existing bucket, create it first, for example with the MinIO client:

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

:::caution[Keep the bucket private]
Blobs may contain identifying photos of your apiaries. Do not make the bucket
publicly readable. Openbeehive serves images only to signed-in members of the
workspace, so the object store needs no public access.
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

:::note[Regions and addressing]
Some providers are sensitive to region settings or require path-style versus
virtual-hosted addressing. If uploads fail with a provider other than MinIO,
double-check the endpoint and that the bucket exists in the expected region.
See [Troubleshooting](../knowledge-base/troubleshooting.md) if problems persist.
:::

## Upkeep \{#upkeep}

The server tidies blob storage by itself; there is nothing to schedule:

- The image of a deleted photo is removed shortly after the delete; one that is missed is removed by the next sweep once it is an hour old.
- Photos of a visit or hive that was deleted more than an hour ago are deleted too.
- Every six hours a sweep removes images that no photo record knows (for example an upload whose record never arrived, or the images of a deleted workspace) once they are older than 30 days or `BEEHIVE_CHANGELOG_RETENTION_DAYS`, whichever is longer. After a database restore, devices send the records of newer photos again when they next sync, which may be weeks later, and their images must still be there.
- The sweep at start removes nothing: it only gives images back to photo records that lost them, as after a restore.
- Only keys of the form the server builds for photos are touched; other files in the bucket or directory are left alone.

This assumes a single server instance: run exactly one per database.

## Photos from 0.4.x \{#inline-photos}

Up to 0.4.x the app stored photos inline in the database, as data URLs in the visit and hive rows. At the first start of 0.5.0 the server converts each visible inline photo into a photo record with its image in blob storage, before it accepts requests. On a database with many photos this can take a few minutes. The log says when it starts, and the server listens, `/healthz` included, only when it is done, so give health checks enough time: the Compose files allow ten minutes (`start_period: 10m`). An interrupted conversion continues at the next start.

Installed 0.4.x apps keep working: the server still accepts and serves inline photos for them and converts what they upload. They do not see photos added by updated devices.

## Switching backends later

If you start on the filesystem and later move to object storage, existing photos
are not migrated automatically. Plan to copy the contents of `BEEHIVE_BLOB_DIR` into your
bucket (for example with `mc cp --recursive` or `aws s3 sync`) before switching
`BEEHIVE_BLOB_BACKEND`, so older inspection photos remain available.
