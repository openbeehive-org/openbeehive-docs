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
`organization_id` (tenant), `field_hlc` (JSON field clock, see the
[sync protocol](/developers/sync-protocol)) and `deleted` (soft-delete flag).
Ids are UUIDs, minted on the device or by the server for rows created
through the [API](/using-the-api/overview). Timestamps are stored as ISO
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
       └── event       (append-only history with frozen apiary/hive/queen)
```

Sharing and sync partitioning use `scope_id`: an apiary's own id for the
apiary and everything under it. Only `event` stores `scope_id` as a column;
for the other tables it is carried on the `Change` message.

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
| `id` | text | also encoded in the [QR label](/developers/qr-codes) |
| `apiary_id` | text | current apiary |
| `name` | text | |
| `type` | int | `HiveType`, see below |
| `status` | int | `HiveStatus`, see below; new hives start at `1` |
| `boxes` | int | number of boxes |
| `colony_origin` | text | e.g. "swarm 2024" |
| `note` | text | |
| `qr_code` | text | reserved; the printed code is derived from `id` by `shortCode()` in `app/src/lib/qr.ts` |
| `photo` | text | data URL or blob key |
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
a new one; old queens are never deleted.

## inspection

| Column | Type | Notes |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Very gentle, 2 Gentle, 3 Normal, 4 Nervous, 5 Aggressive |
| `calmness` | int | 1 Runs off comb, 2 Restless, 3 Calm, 4 Very calm |
| `frames` | int | occupied frames |
| `brood_frames` | int | |
| `stores` | int | 1 Good, 2 Medium, 3 Low, 4 None |
| `queen_cells` | int | swarm cells counted |
| `youngest_larva` | int | age in days of the youngest larva seen |
| `covered_larva` | bool | capped brood seen |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C, null when not measured in the app; `CreateInspection` stores `0` for fields left out |
| `humidity_hive`, `humidity_outside` | real | %, same rule as the temperatures |
| `note` | text | |
| `photo_keys` | text | OR-Set JSON, the only set column |
| `created_at` | timestamp | |

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
[History and events](/developers/history-and-events).

## Server-only tables

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`apiary_share`, `change_log` and `seq_counter` exist only on the server.
`member.role` is `owner` or `member`; `users.role` is `admin` or `user`.
`apiary_share` is read by the sync scope check but nothing in the app writes
it. The client adds `outbox` and `sync_meta` for the sync engine.

### api_key

Long-lived keys for scripts and integrations (migration `0014_api_keys.sql`,
`server/internal/auth/apikey.go`). Not synced.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | owner; indexed |
| `organization_id` | varchar(64) | the tenant the key acts in, fixed at creation |
| `name` | text | label shown in Settings |
| `key_prefix` | text | first 12 characters of the plaintext, for display |
| `key_hash` | varchar(64) | hex SHA-256 of the plaintext `obhk_...` token, unique; the plaintext is never stored |
| `scope` | text | `write` (default) or `read`; a `read` key may call only `Get*`, `List*`, `Pull` and `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null for keys that never expire; a key past this time is refused |
| `last_used_at` | timestamp | updated on every verified use, null until then |

A key is verified by hashing the bearer token and looking up `key_hash`; the
row is deleted on removal, and a key whose owner is no longer a `member` of
`organization_id`, or whose `expires_at` has passed, is refused without
being deleted.
