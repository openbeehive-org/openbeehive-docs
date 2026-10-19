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
`{"apiary": {...}}`. `UpdateApiary` takes `id` plus the same fields and
overwrites all of them.

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

`ListHives` without `apiaryId` lists every hive of the tenant. `CreateHive`
needs `apiaryId` and `name`; the new hive gets status `HIVE_STATUS_ACTIVE`,
an open placement interval and a `CREATED` event. `UpdateHive` takes the
whole `hive` message and overwrites `name`, `type`, `status`, `boxes`,
`colonyOrigin`, `note` and `qrCode`; it leaves `apiaryId` and the photo
untouched. `RelocateHive` takes `{"id": ..., "targetApiaryId": ..., "date": ...}`
(`date` optional, defaults to now), closes the current placement, opens a new
one and records a `MOVED` event. `DeleteApiary` and `DeleteHive` write a
tombstone, so the deletion reaches devices through sync.

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

A full visit uses the same call with the stock-card fields:

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
    "varroa": "2 mites/day",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` is one of `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` one of `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. The server stores the apiary and the reigning
queen as of `date` and records an `INSPECTION` event. Fields you leave out
are stored as `0`, `false` or `""`.

Photos are added afterwards with `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` must be a data URL starting with `data:image/` and at most 512 KiB
including the prefix. It is replicated to every device, so send a thumbnail
(the app stores about 480 px). `RemoveInspectionPhoto` takes the same
`inspectionId` and the exact stored `photo` value; the response's
`inspection.photoKeys` lists what is stored.

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
lists every inspection of the tenant.

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
`UpdateQueen` takes the whole `queen` message and updates `year`, `marking`,
`origin`, `breederNumber`, `introducedAt`, `replacedAt`, `active` and `note`
(`hiveId` cannot change).

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
when you send none; `apiaryId` must exist in your tenant. A task with
neither is personal and syncs only to your own devices. Tick it off with:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

The response is `{"task": {...}}` with `"done": true`. `ListTasks` takes
`onlyOpen` and `hiveId` and returns open tasks first, ordered by `dueAt`.

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
`{"harvests": [...], "page": {...}}`, newest first. `DeleteHarvest` takes
`{"id": ...}` and writes a tombstone; there is no update RPC.

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
(`daysSinceLast: -1`, listed first). `nextTasks` holds the next five open
tasks, `recentInspections` the last ten visits. Honey figures come from the
`HARVEST` events; `honeyKgSeason` is the current calendar year.
`GetHoneyStats` takes `year` (0 = all years) and returns `perQueen`,
`perApiary` and `perYear` sums.

## Pull the change feed

```bash
curl -s -X POST "$OB/openbeehive.v1.SyncService/Pull" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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
      "hlc": "001781234567890:00000:server",
      "authorId": "u-…"
    }
  ],
  "nextCursor": "48213",
  "hasMore": false
}
```

`payloadJson` is a JSON string whose keys are the table's `snake_case` column
names. Pass `nextCursor` back as `cursor` to continue. The feed contains
every change, whether a device pushed it or a service RPC wrote it;
placements appear only here, since they have no service of their own. See
the [sync protocol](/developers/sync-protocol) for how to write changes with
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
| `invalid_argument` | 400 | Empty `name`; missing `hiveId` (inspection, queen, treatment, harvest), `year` (queen), `title` (task), `product` (treatment); `amountKg` not above `0` (harvest); `apiaryId` that does not exist on `CreateTask`; a photo that is not a `data:image/` URL or exceeds 512 KiB; missing `hive` / `queen` on the update calls |
| `unauthenticated` | 401 | Missing, expired or removed token: an unknown or revoked API key, or a session token past `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Demo session calling a write RPC; `Push` into a scope you cannot write |
| `not_found` | 404 | Unknown id, or an id that belongs to another tenant, on any `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, the photo calls and every `Create*` that references a hive or apiary |
| `internal` | 500 | Database errors |

See the [Connect error reference](https://connectrpc.com/docs/protocol/#error-codes)
for the full code list.

## Notes

- Send `{}` for a request with no fields.
- `Content-Type: application/json` selects the Connect JSON protocol.
  `application/proto` sends binary protobuf over the same URL.
- `SyncService.Subscribe` is a server stream and needs a streaming client; see
  [gRPC](/using-the-api/grpc).
