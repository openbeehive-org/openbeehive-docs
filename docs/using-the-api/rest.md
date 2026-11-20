---
sidebar_position: 2
title: "REST / HTTP + JSON"
---

# REST / HTTP + JSON

Every RPC accepts a plain `POST` with a JSON body, following the
[Connect protocol](https://connectrpc.com/docs/protocol/). No gRPC tooling is
needed.

## Request shape

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
Content-Type: application/json
Authorization: Bearer <token>      # only when login is configured
```

- The body is the request message in proto3 JSON: field names in
  `lowerCamelCase` (`apiaryId`, `pageSize`, `weightKg`). The server also
  accepts the `snake_case` proto names, but responses always use
  `lowerCamelCase`.
- Enum fields take the enum name (`"HIVE_TYPE_DADANT"`, `"STORES_GOOD"`) or
  its number. Responses use the name.
- Timestamps are RFC 3339 strings in UTC (`"2026-06-19T09:14:02Z"`). Leave a
  timestamp out to get the server's default (`date` and `introducedAt`
  default to now; `dueAt` and `withdrawalUntil` stay unset).
- The response is the response message as JSON with HTTP `200`.
- Fields at their default value (empty string, `0`, `false`, empty list) are
  omitted from responses.

The examples below use `$OB` for the origin and `$TOKEN` for an API key
(`obhk_...`, created under **Settings → API keys**) or a session token, as
described in the [overview](./overview.md#authentication). Drop the
`Authorization` header on an instance without login.

## List apiaries

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": [
    {
      "id": "2b1f6c0e-...",
      "organizationId": "9d3a...",
      "name": "Orchard Meadow",
      "lat": 48.21,
      "lng": 16.37,
      "hiveCount": 3,
      "createdAt": "2026-04-02T09:14:02Z",
      "updatedAt": "2026-04-02T09:14:02Z"
    }
  ],
  "page": { "total": 1 }
}
```

## Create an apiary

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/CreateApiary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchard Meadow","address":"Field road 3","lat":48.21,"lng":16.37}'
```

`name` must not be empty (`invalid_argument` otherwise). The response is
`{"apiary": {...}}`. `UpdateApiary` takes `id` plus the fields to change; see
[Update a record](#update-a-record). `DeleteApiary` fails with
`failed_precondition` while the apiary still has hives.

## Create and list hives

```bash
curl -s -X POST "$OB/openbeehive.v1.HiveService/CreateHive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","name":"Hive 3","type":"HIVE_TYPE_ZANDER","boxes":2}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

`ListHives` without `apiaryId` lists every hive of the workspace and is
paginated like the other lists (`total` is the real number of matching
hives). `CreateHive`
needs `apiaryId` and `name`; the new hive gets status `HIVE_STATUS_ACTIVE`,
an open placement interval and a `CREATED` event. `UpdateHive` takes a
`hive` message with `id` and the fields to change (`name`, `type`, `status`,
`boxes`, `colonyOrigin`, `note`, `qrCode`); it never changes `apiaryId` or
the photo. `RelocateHive` takes `{"id": ..., "targetApiaryId": ..., "date": ...}`
(`date` optional, defaults to now), closes the current placement, opens a new
one and records a `MOVED` event. `DeleteApiary` and `DeleteHive` write a
tombstone, so the deletion reaches devices through sync. `DeleteHive` also
deletes the hive's open tasks.

## Record an inspection

Every field except `hiveId` is optional. A hive scale would send only the
measurements:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","weightKg":42.5,"tempHive":34.2,"humidityHive":58,"note":"scale, 06:00"}'
```

```json
{
  "inspection": {
    "id": "7f0e...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "date": "2026-06-19T04:00:11.204Z",
    "note": "scale, 06:00",
    "createdAt": "2026-06-19T04:00:11.204Z",
    "weightKg": 42.5,
    "tempHive": 34.2,
    "humidityHive": 58
  }
}
```

A full visit uses the same call with the fields of the hive record card:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hiveId": "c41a...",
    "date": "2026-06-19T09:00:00Z",
    "weather": "sunny, 22 C",
    "queenSeen": true,
    "eggsSeen": true,
    "coveredLarva": true,
    "frames": 8,
    "broodFrames": 5,
    "stores": "STORES_GOOD",
    "temperament": "TEMPERAMENT_GENTLE",
    "calmness": 3,
    "queenCells": 0,
    "varroa": "2",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` is one of `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` one of `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. The server stores the apiary and the reigning
queen as of `date` and records an `INSPECTION` event.

The numbers of an inspection (`frames`, `broodFrames`, `queenCells`,
`youngestLarva`, `framesAdded`, `framesRemoved`, `fedKg`, `honeyKg`,
`weightKg` and the four climate fields) are optional: a field
you leave out is stored as "not recorded" and is absent from responses, while
an explicit `0` is stored and returned as an observed zero. `honeyKg` is kept
for old records; record honey with `HarvestService`.

`source` says who made the entry: `INSPECTION_SOURCE_MANUAL` (the default
when you send none) for a visit by a person, `INSPECTION_SOURCE_SENSOR` for
an automated reading. Sensor readings appear in the charts but do not count
as "last inspected" and are left out of the due list and of the dashboard's
recent inspections; see [Automated trackers](./automated-trackers.md).

### Photos \{#photos}

Photos are added afterwards with `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` is a base64 data URL of a JPEG, PNG or WebP image of at most 5 MiB
decoded. The server stores the image in blob storage, makes a thumbnail of
about 200 px and returns the inspection with its `photos`; adding the same
image twice has no further effect. Each entry of `photos` has `id`,
`thumbnail`, `contentType`, `sizeBytes`, `createdAt` and `path`.
`RemoveInspectionPhoto` takes `inspectionId` and, as `photo`, the photo's
`id` (or the data URL it was added with); the photo is deleted for good, on
every device. `photoKeys` lists only inline photos written by 0.4.x apps.

The full-size image is a plain GET of `path` with the same credentials:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/photos/3c9d..." -o photo.jpg
```

It answers `404` with `not_uploaded` while the device that took the photo has
not uploaded the image yet, and `410` (`deleted`) for a deleted photo. The
image behind an id never changes, so it may be cached. `POST /photos/<id>`
with the image as body is how the app uploads the image of a photo record
it has already synced; it is accepted once per photo. Read-only keys and the
demo account cannot upload.

## List inspections with pagination

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2}}'
```

```json
{
  "inspections": [
    { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z", "weightKg": 42.5, "tempHive": 34.2, "humidityHive": 58, "note": "scale, 06:00", "createdAt": "2026-06-19T04:00:11.204Z", "organizationId": "9d3a..." },
    { "id": "5c22...", "hiveId": "c41a...", "date": "2026-06-18T04:00:09.871Z", "weightKg": 42.1, "tempHive": 34.4, "humidityHive": 57, "note": "scale, 06:00", "createdAt": "2026-06-18T04:00:09.871Z", "organizationId": "9d3a..." }
  ],
  "page": { "nextPageToken": "2", "total": 3 }
}
```

Results are newest first. Pass `nextPageToken` back as `pageToken` for the
next page:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2,"pageToken":"2"}}'
```

The last page has no `nextPageToken`. `ListInspections` without `hiveId`
lists every inspection of the workspace. `source` filters by who recorded
the entry: leave it out for everything, `"INSPECTION_SOURCE_MANUAL"` for
visits by a person only, `"INSPECTION_SOURCE_SENSOR"` for readings only.

## Update a record \{#update-a-record}

`UpdateApiary`, `UpdateHive`, `UpdateQueen`, `UpdateInspection`,
`UpdateTask`, `UpdateTreatment` and `UpdateHarvest` change only the fields
you send. Correct the weight of one inspection:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e...","weightKg":41.9}}'
```

Everything else on the record stays as it is. To set a field to its zero
value, or to clear an optional number back to "not recorded", name it in
`updateMask`:

```bash
# clear the note and remove the recorded weight
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e..."},"updateMask":"note,weightKg"}'
```

With a mask, exactly the listed fields are written and nothing else. A
request that would change nothing answers `invalid_argument`. The rules per
call:

| Call | Request | Notes |
| --- | --- | --- |
| `UpdateApiary` | `id` and the fields at the top level, plus `updateMask` | `name` must not become empty |
| `UpdateHive` | `hive`, `updateMask` | `apiaryId` is ignored (use `RelocateHive`); `status` cannot be set to unspecified |
| `UpdateQueen` | `queen`, `updateMask` | Without a mask, sending `replacedAt` alone ends the reign (`active` becomes `false`) and sending `active: true` clears `replacedAt` |
| `UpdateInspection` | `inspection`, `updateMask` | Photos change through the photo calls; the `INSPECTION` event follows a changed `date` |
| `UpdateTask` | `task`, `updateMask` | `hiveId` and `apiaryId` cannot change; use a mask to remove `dueAt` or reopen a task |
| `UpdateTreatment` | `treatment`, `updateMask` | Sets `amendedAt`; the apiary and queen are resolved again when `date` moves |
| `UpdateHarvest` | `harvest`, `updateMask` | Sets `amendedAt`; `amountKg` must stay above `0`; the honey figures follow the edit |

## Create a queen

```bash
curl -s -X POST "$OB/openbeehive.v1.QueenService/CreateQueen" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","year":2026,"origin":"own rearing","breederNumber":"B-17"}'
```

```json
{
  "queen": {
    "id": "a9d1...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "year": 2026,
    "marking": "MARKING_COLOR_WHITE",
    "origin": "own rearing",
    "breederNumber": "B-17",
    "introducedAt": "2026-06-19T09:20:41.003Z",
    "active": true,
    "createdAt": "2026-06-19T09:20:41.003Z",
    "updatedAt": "2026-06-19T09:20:41.003Z"
  }
}
```

`hiveId` and `year` are required. `marking` defaults to the international
colour for the year (`MARKING_COLOR_WHITE` for years ending in 1 or 6,
`YELLOW` 2/7, `RED` 3/8, `GREEN` 4/9, `BLUE` 5/0); `introducedAt` defaults to
now. Creating a queen always ends the reign of the hive's current active
queen (`active: false`, `replacedAt` set) and records `QUEEN_REPLACED` and
`QUEEN_INTRODUCED` events. `ListQueens` takes `hiveId` and `onlyActive`;
`UpdateQueen` corrects `year`, `marking`, `origin`, `breederNumber`,
`introducedAt`, `replacedAt`, `active` and `note` (`hiveId` cannot change;
see [Update a record](#update-a-record)). `DeleteQueen` also removes her
`QUEEN_INTRODUCED` and `QUEEN_REPLACED` events.

## Tasks

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/CreateTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Varroa count","hiveId":"c41a...","dueAt":"2026-07-01T00:00:00Z","priority":"TASK_PRIORITY_HIGH"}'
```

```json
{
  "task": {
    "id": "e3b7...",
    "organizationId": "9d3a...",
    "title": "Varroa count",
    "hiveId": "c41a...",
    "apiaryId": "2b1f6c0e-...",
    "dueAt": "2026-07-01T00:00:00Z",
    "priority": "TASK_PRIORITY_HIGH",
    "createdAt": "2026-06-19T09:22:05.118Z"
  }
}
```

`title` is required. A task with `hiveId` inherits the hive's `apiaryId`
when you send none; `apiaryId` must exist in your workspace. A task with
neither is personal: it syncs only to your own devices and `ListTasks`
returns it only to you. Tick it off with:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

The response is `{"task": {...}}` with `"done": true`. `ListTasks` takes
`onlyOpen` and `hiveId` and returns open tasks first, ordered by `dueAt`.
`UpdateTask` changes `title`, `dueAt`, `done`, `priority`, `note`,
`recurrence` and `assignedTo`.

## Treatments

```bash
curl -s -X POST "$OB/openbeehive.v1.TreatmentService/CreateTreatment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","product":"Oxuvar 5.7%","activeIngredient":"oxalic acid","dose":"50 ml","method":"trickling","batchNumber":"L2405","withdrawalUntil":"2026-12-01T00:00:00Z"}'
```

`hiveId` and `product` are required; `reason` defaults to `"varroa"`. The
response `treatment` carries the frozen `apiaryId` and `queenId` as of
`date`. `ListTreatments` takes `hiveId` and returns newest first.
`UpdateTreatment` corrects a treatment and stamps `amendedAt`, which the app
shows as "Amended on" and prints in the treatment register;
`DeleteTreatment` also removes its `TREATMENT` event.

## Harvests

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/CreateHarvest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","amountKg":18.5,"variety":"spring flow","waterContent":17.2,"batchNumber":"2026-03","bestBefore":"2028-06-01T00:00:00Z","note":"two supers"}'
```

```json
{
  "harvest": {
    "id": "b6e2...",
    "organizationId": "9d3a...",
    "apiaryId": "2b1f6c0e-...",
    "date": "2026-06-19T09:31:17.442Z",
    "variety": "spring flow",
    "amountKg": 18.5,
    "waterContent": 17.2,
    "batchNumber": "2026-03",
    "bestBefore": "2028-06-01T00:00:00Z",
    "note": "two supers",
    "hiveId": "c41a...",
    "queenId": "a9d1..."
  }
}
```

`hiveId` is required and `amountKg` must be greater than `0`
(`invalid_argument` otherwise); `date` defaults to now. The response carries
the frozen `apiaryId` and `queenId` as of `date`. The server also records a
`HARVEST` event with `amountKg` and the title `18.5 kg spring flow`
(`Honey` when `variety` is empty), which is what `GetDashboard` and
`GetHoneyStats` sum.

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/ListHarvests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","page":{"pageSize":20}}'
```

`ListHarvests` filters by `hiveId` or `apiaryId` (both optional) and returns
`{"harvests": [...], "page": {...}}`, newest first. `UpdateHarvest` corrects
a harvest and stamps `amendedAt`; `DeleteHarvest` takes `{"id": ...}`, writes
a tombstone and removes the `HARVEST` event, so the honey figures no longer
count it.

## Events

```bash
curl -s -X POST "$OB/openbeehive.v1.EventService/ListEvents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","limit":20}'
```

Filters are `apiaryId`, `hiveId` and `queenId`; `limit` defaults to 100 and
is capped at 1000. Events come newest first and are not paginated. Each has
`type` (`EVENT_TYPE_INSPECTION`, `EVENT_TYPE_HARVEST`, ...), the frozen
`apiaryId` / `hiveId` / `queenId`, `refEntity` / `refId` pointing at the
detail row, `amountKg` for harvests, `detailJson` and `authorId`.

## Dashboard

```bash
curl -s -X POST "$OB/openbeehive.v1.StatsService/GetDashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": 2,
  "hives": 7,
  "activeQueens": 6,
  "openTasks": 3,
  "overdueTasks": 1,
  "honeyKgSeason": 41.5,
  "dueInspections": [
    { "hiveId": "0d4c...", "hiveName": "Hive 5", "apiaryName": "Orchard Meadow", "daysSinceLast": -1 },
    { "hiveId": "c41a...", "hiveName": "Hive 3", "apiaryName": "Orchard Meadow", "daysSinceLast": 27 }
  ],
  "nextTasks": [ { "id": "e3b7...", "title": "Varroa count", "dueAt": "2026-07-01T00:00:00Z" } ],
  "recentInspections": [ { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z" } ],
  "honeyHistory": [ { "year": 2026, "month": 6, "kg": 41.5 } ]
}
```

`thresholdDays` (default 21) sets when a hive counts as due: hives whose last
inspection is at least that many days old, plus hives never inspected
(`daysSinceLast: -1`, listed first). Sensor readings
(`INSPECTION_SOURCE_SENSOR`) do not count as inspections here and are not
listed in `recentInspections`. `nextTasks` holds the next five open
tasks, `recentInspections` the last ten visits. Honey figures come from the
`HARVEST` events; `honeyKgSeason` is the current calendar year.
`GetHoneyStats` takes `year` (0 = all years) and returns `perQueen`,
`perApiary` and `perYear` sums.

## Export a workspace \{#export}

`GET /export` downloads the active workspace in the format of the app's full
backup, which the app can import again; `GET /export?photos=1` returns a ZIP
that adds the full-size images. It accepts a session or a write API key and
holds every live record of the workspace with your own personal tasks, but
not other members' personal tasks.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/export?photos=1" -o openbeehive.zip
```

The answer is an attachment named `openbeehive-server-<date>.json` or
`.zip`. Read-only keys and the demo account get `403`; more than 5 exports
per user and hour get `429` with `Retry-After`. Weights and temperatures are
in kg and °C.

## Pull the change feed

```bash
curl -s -X POST "$OB/openbeehive.v1.SyncService/Pull" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Openbeehive-Sync-Protocol: 1" \
  -d '{"cursor":"","limit":100}'
```

```json
{
  "changes": [
    {
      "entity": "inspection",
      "entityId": "7f0e...",
      "scopeId": "2b1f6c0e-...",
      "op": "CHANGE_OP_UPSERT",
      "payloadJson": "{\"hive_id\":\"c41a...\",\"date\":\"2026-06-19T04:00:11.204Z\",\"weight_kg\":42.5}",
      "hlc": "001781234567890:00000:srv-3fa91c0b77d2",
      "authorId": "u-…"
    }
  ],
  "nextCursor": "731942061385:48213:5512",
  "hasMore": false,
  "serverTimeMs": "1781234569120"
}
```

`payloadJson` is a JSON string whose keys are the table's `snake_case` column
names. Pass `nextCursor` back as `cursor` to continue; it is opaque. Without
the `Openbeehive-Sync-Protocol` header the server answers as it did for
0.4.1 apps: only the columns of that release, no photo records and bare
sequence numbers as cursors. `status` other than unspecified means the
cursor cannot be served; load a `Snapshot` instead. `limit` defaults to
200 and is capped at 500. The feed covers the caller's workspace; personal
rows (scope `user:<id>`) are returned only to their owner. The feed contains
every change, whether a device pushed it or a service RPC wrote it;
placements appear only here, since they have no service of their own. See
the [sync protocol](../developers/sync-protocol.md) for how to write changes with
`Push`.

## Pagination

Every `List*` RPC except `ListEvents` takes `page: { pageSize, pageToken }`
and returns `page: { nextPageToken, total }`:

- `pageSize`: rows per page, default 50, capped at 500.
- `pageToken`: the offset to start at, as a decimal string. Send the
  `nextPageToken` of the previous response; `""` or absent starts at the
  first row.
- `nextPageToken`: set when the page was full and more rows exist; absent on
  the last page.
- `total`: number of matching rows.

`ListEvents` takes a plain `limit`. `Pull` uses its own
`cursor` / `nextCursor` / `hasMore` fields.

## Errors

Errors come back as a JSON body with a Connect code:

```json
{ "code": "not_found", "message": "not found" }
```

| Code | HTTP | When |
| --- | --- | --- |
| `invalid_argument` | 400 | Empty `name`; missing `hiveId` (inspection, queen, treatment, harvest), `year` (queen), `title` (task), `product` (treatment); `amountKg` not above `0` (harvest); `apiaryId` that does not exist on `CreateTask`; a photo that is not a data URL of a JPEG, PNG or WebP image of at most 5 MiB; missing `hive` / `queen` on the update calls |
| `unauthenticated` | 401 | Missing, expired or removed token: an unknown or revoked API key, or a session token past `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Demo session or read-only API key calling a write RPC |
| `failed_precondition` | 400 | `DeleteApiary` while the apiary still has hives; a `SyncService` call below `BEEHIVE_SYNC_MIN_PROTOCOL`, or `Snapshot` without the protocol header (with an `UpgradeRequired` detail) |
| `resource_exhausted` | 429 | More than 4 open `Subscribe` streams for one user |
| `not_found` | 404 | Unknown id, or an id that belongs to another workspace, on any `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, the photo calls and every `Create*` that references a hive or apiary |
| `unavailable` | 503 | A photo call while the server has no blob storage |
| `internal` | 500 | Server-side failures. The message is always `internal error`; details are in the server log only |

An update that would change nothing, and a `Push` with more than 2000
changes, also answer `invalid_argument`. See the
[Connect error reference](https://connectrpc.com/docs/protocol/#error-codes)
for the full code list.

### Error codes of the plain-HTTP endpoints \{#http-error-codes}

The `/auth/*` and `/tenants/*` endpoints are not RPCs. Their errors are
`{"error": "<plain English>", "code": "<snake_case>"}` with a matching HTTP
status. Clients should act on `code`; the text may change.

| HTTP | Codes |
| --- | --- |
| 400 | `invalid_body`, `invalid_email`, `invalid_scope`, `invalid_expiry`, `invalid_role`, `invalid_password`, `password_too_long`, `id_required`, `name_required`, `org_id_required`, `cannot_remove_self`, `invite_invalid`, `invite_expired`, `reset_invalid`, `passkey_no_ceremony`, `passkey_failed` |
| 401 | `not_signed_in`, `invalid_credentials`, `passkey_failed` |
| 403 | `cross_site_request`, `demo_read_only`, `invite_only`, `invite_email_mismatch`, `not_a_member`, `owner_only`, `admin_only`, `account_protected`, `password_managed`, `wrong_password`, `reauth_required`, `login_required`, `passkey_failed`, `passkey_session_mismatch` |
| 404 | `not_found`, `invite_not_found`, `key_not_found`, `member_not_found`, `account_not_found`, `passkey_not_found` |
| 405 | `method_not_allowed` |
| 409 | `email_taken`, `last_owner`, `no_password`, `passkey_none`, `reset_needs_admin` |
| 413 | `body_too_large` |
| 415 | `unsupported_media_type` |
| 429 | `rate_limited` (with `Retry-After`) |
| 500 | `internal` |
| 503 | `demo_unavailable`, `unavailable` |

Pages a browser opens directly (`/auth/verify`, `/auth/login`,
`/auth/callback`) do not answer with JSON: they redirect to
`/login?error=<code>`, where the app shows a translated message. Their codes
are `verification_invalid`, `unknown_provider`, `oidc_state_missing`,
`oidc_state_invalid`, `oidc_failed`, `oidc_no_email`, `account_exists`,
`invite_only` and `internal`.

`/photos/` and `/export` use the same JSON error shape with `not_signed_in`
(401), `cross_site_request`, `demo_read_only`, `read_only` (403),
`not_found`, `unknown_photo`, `not_uploaded` (404), `deleted` (410),
`too_large` (413), `unsupported_type` (415), `rate_limited` (429) and
`unavailable` (503).

## Notes

- Send `{}` for a request with no fields.
- `Content-Type: application/json` selects the Connect JSON protocol.
  `application/proto` sends binary protobuf over the same URL.
- `SyncService.Subscribe` is a server stream and needs a streaming client; see
  [gRPC](./grpc.md).
