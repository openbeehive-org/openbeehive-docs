---
sidebar_position: 3
title: "Data model"
---

# Data model

The tables below are taken from the server migrations
(`server/internal/storage/sql/migrations/`) and the client mirror schema
(`app/src/lib/local/schema.ts`). Column names are identical on both sides and
are the keys used in sync payloads. Enum columns store the proto number; the
display label is what the app shows (`app/src/lib/i18n/locales/en.json`).

Every synced table carries three bookkeeping columns not repeated below:
`organization_id` (the workspace, called tenant in the code), `field_hlc` (JSON field clock, see the
[sync protocol](./sync-protocol.md)) and `deleted` (soft-delete flag).
Ids are UUIDs, minted on the device or by the server for rows created
through the [API](../using-the-api/overview.md). Timestamps are stored as ISO
8601 strings on the client and as `TIMESTAMP` on the server.

## Hierarchy

```text
apiary
 └── hive ── queen (one active, older ones kept with replaced_at set)
       ├── inspection
       ├── task        (task.hive_id and task.apiary_id are both optional)
       ├── harvest
       ├── treatment
       ├── placement   (which apiary the hive lived in, and when)
       ├── photo       (the hive's picture, and the photos of its inspections)
       └── event       (append-only history with frozen apiary/hive/queen)

user_settings          (one row per account, in every workspace)
```

The workspace (`organization_id`) is the sharing unit: every member of a
workspace reads and writes all of its rows. Within it, changes carry a
`scope_id`: an apiary's own id for the apiary and everything under it, or
`user:<id>` for personal rows such as a task without an apiary. Only `event`
stores `scope_id` as a column; for the other tables it is carried on the
`Change` message.

## apiary

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `name` | text | required |
| `address` | text | free text |
| `lat`, `lng` | real | `0` when unset |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

## hive

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | also encoded in the [QR label](./qr-codes.md) |
| `apiary_id` | text | current apiary |
| `name` | text | |
| `type` | int | `HiveType`, see below |
| `status` | int | `HiveStatus`, see below; new hives start at `1` |
| `boxes` | int | number of boxes |
| `colony_origin` | text | e.g. "swarm 2024" |
| `note` | text | |
| `qr_code` | text | reserved; the printed code is derived from `id` by `shortCode()` in `app/src/lib/qr.ts` |
| `photo` | text | inline picture written by 0.4.x apps; updated apps keep the hive's picture as a `photo` row instead |
| `created_at`, `updated_at` | timestamp | |

`HiveType`: 0 Unspecified, 1 Zander, 2 Dadant, 3 Deutsch Normal, 4 Langstroth,
5 Warré, 6 Top-bar, 99 Other.

`HiveStatus`: 0 Unspecified, 1 Active, 2 Nucleus, 3 Queenless, 4 Lost,
5 Dissolved.

## queen

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `hive_id` | text | |
| `year` | int | the queen's year; drives the default marking colour |
| `marking` | int | `MarkingColor`: 1 white (years ending 1/6), 2 yellow (2/7), 3 red (3/8), 4 green (4/9), 5 blue (5/0); defaults from `year` |
| `origin` | text | |
| `breeder_number` | text | |
| `introduced_at` | timestamp | start of reign |
| `replaced_at` | timestamp | end of reign, null while reigning |
| `active` | bool | true for the current queen |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

A queen change sets `active = 0` and `replaced_at` on the old row and inserts
a new one; the old queen stays in the table. A queen row is deleted only
when she was recorded by mistake.

## inspection

| Column | Type | Notes |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Very gentle, 2 Gentle, 3 Normal, 4 Nervous, 5 Aggressive |
| `calmness` | int | 1 Runs off comb, 2 Restless, 3 Calm, 4 Very calm |
| `source` | int | `InspectionSource`: 0 unspecified (treated as manual), 1 manual (a visit by a person), 2 sensor (an automated reading). Not null, default 0 |
| `frames` | int | occupied frames |
| `brood_frames` | int | |
| `stores` | int | 1 Good, 2 Medium, 3 Low, 4 None |
| `queen_cells` | int | swarm cells counted |
| `youngest_larva` | int | age in days of the youngest larva seen |
| `covered_larva` | bool | capped brood seen |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | `honey_kg` is kept for old records; the visit form no longer writes it (see `harvest`) |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C |
| `humidity_hive`, `humidity_outside` | real | % |
| `note` | text | |
| `photo_keys` | text | OR-Set JSON, the only set column; inline photos written by 0.4.x apps (see `photo`) |
| `created_at` | timestamp | |

The counts, amounts and climate readings (`frames`, `brood_frames`,
`queen_cells`, `youngest_larva`, `frames_added`, `frames_removed`,
`honey_kg`, `fed_kg`, `weight_kg` and the four climate columns) are nullable
on the server and on the client: `NULL` means "not recorded", `0` means an
observed zero. The API mirrors this with optional fields.

## task

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `title` | text | |
| `hive_id`, `apiary_id` | text | optional |
| `due_at` | timestamp | |
| `done` | bool | |
| `priority` | int | `TaskPriority`: 1 Low, 2 Normal, 3 High; the server column defaults to 2, the app writes 0 |
| `note`, `recurrence`, `assigned_to` | text | present in the schema; the task form only fills `title` and `due_at` |
| `created_at` | timestamp | |

On the server, `task.owner_id` records the account in whose personal scope a
task without an apiary was written. It is not synced; the server uses it to
serve the task only to its owner and to delete it when the owner leaves the
workspace.

## placement

| Column | Type | Notes |
| --- | --- | --- |
| `id`, `hive_id`, `apiary_id` | text | |
| `start_at` | timestamp | |
| `end_at` | timestamp | null for the current placement |

Creating a hive opens a placement; moving it closes the open row at the
move time and opens a new one.

A task without `apiary_id` syncs under the personal scope
`user:<user id>` instead of an apiary id.

## harvest

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | frozen at harvest time |
| `date` | timestamp | |
| `variety` | text | |
| `amount_kg` | real | |
| `water_content` | real | % |
| `batch_number` | text | |
| `best_before` | timestamp | |
| `note` | text | |
| `amended_at` | timestamp | null until the harvest is edited after creation, then the time of the last edit |

## treatment

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | frozen at treatment time |
| `date` | timestamp | |
| `product`, `active_ingredient` | text | |
| `dose`, `method` | text | |
| `batch_number` | text | |
| `withdrawal_until` | timestamp | |
| `reason` | text | defaults to `varroa` |
| `note` | text | |
| `amended_at` | timestamp | null until the treatment is edited after creation, then the time of the last edit; shown as "Amended on" and printed in the treatment register |

## photo

A photo of an inspection, or the picture of a hive. The row syncs with a
small thumbnail; the full-size image is kept in blob storage and moved over
`/photos/<id>` (see the [sync protocol](./sync-protocol.md#photos)).

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `owner_entity` | text | `inspection` or `hive` |
| `owner_id` | text | id of that inspection or hive |
| `thumb` | text | thumbnail as a data URL, about 200 px on the longer edge |
| `content_type` | text | of the full-size image: `image/jpeg`, `image/png` or `image/webp` |
| `size_bytes` | int | of the full-size image, at most 5 MiB |
| `created_at` | timestamp | |

A deleted photo keeps its row as a tombstone, but its thumbnail and image are
erased. On the server the row also names its blob (`blob_key`, `blob_type`,
`blob_size`) and, for photos converted from 0.4.x, the inline value they came
from (`legacy_key`); these columns are not synced.

## user_settings

The account's display preferences. One row per account, its id is the
account id; it is written in the personal scope and served in every
workspace of the account (see the
[sync protocol](./sync-protocol.md#account-settings)). It does not carry
`organization_id`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | the account id |
| `weight_unit` | text | `kg` or `lb`; empty means not chosen, the device then uses the default of the browser's region |
| `temp_unit` | text | `c` or `f`; empty as above |
| `language` | text | `en`, `de`, `fr`, `es` or `it` |

Records are stored in kilograms and degrees Celsius whatever is chosen here.

## event

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `scope_id` | text | apiary id |
| `type` | int | `EventType`, see below |
| `date` | timestamp | |
| `apiary_id`, `hive_id`, `queen_id` | text | frozen at event time |
| `ref_entity`, `ref_id` | text | the detail row, e.g. `harvest` / its id |
| `title` | text | |
| `amount_kg` | real | copied from the harvest so yield queries need no join |
| `detail` | text | JSON |
| `author_id` | text | |

`EventType`: 1 Created, 2 Queen introduced, 3 Queen replaced, 4 Moved,
5 Inspection, 6 Treatment, 7 Harvest, 8 Status, 9 Dissolved. The app writes
types 1 to 7 (`app/src/lib/local/history.ts`). See
[History and events](./history-and-events.md).

## Server-only tables

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`password_reset`, `change_log`, `seq_counter`, `sync_state`, `sync_boot` and
`photo_migration` exist only on the server.
`member.role` is `owner` or `member`; `users.role` is `admin` or `user`.
`users.sessions_valid_after` is the mark that ends all earlier sessions of an
account; `users.email_key` is the email address in lower case and unique,
so two accounts cannot share an address that differs only in case;
`invite.expires_at` is when an invite stops working (7 days after creation).
`password_reset` holds the hash of each reset link's token, valid for one
hour and deleted when used. `sync_state` holds the database's random `epoch`
and the change-log compaction `horizon`; `sync_boot` holds one mark per
server start (see the [sync protocol](./sync-protocol.md#pull-status));
`change_log.logged_at` is the time the server received an entry.
`photo_migration` records that the one-time conversion of 0.4.x inline
photos has finished. The former `apiary_share` table is gone: there is no per-apiary
sharing. The client adds `outbox` and `sync_meta` for the sync engine.

### api_key

Long-lived keys for scripts and integrations (migration `0014_api_keys.sql`,
`server/internal/auth/apikey.go`). Not synced.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | owner; indexed |
| `organization_id` | varchar(64) | the workspace the key acts in, fixed at creation |
| `name` | text | label shown in Settings |
| `key_prefix` | text | first 12 characters of the plaintext, for display |
| `key_hash` | varchar(64) | hex SHA-256 of the plaintext `obhk_...` token, unique; the plaintext is never stored |
| `scope` | text | `write` (default) or `read`; a `read` key may call only `Get*`, `List*`, `Pull`, `Snapshot` and `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null for keys that never expire; a key past this time is refused |
| `last_used_at` | timestamp | updated on every verified use, null until then |

A key is verified by hashing the bearer token and looking up `key_hash`; the
row is deleted on removal, and a key whose owner is no longer a `member` of
`organization_id`, or whose `expires_at` has passed, is refused without
being deleted.
