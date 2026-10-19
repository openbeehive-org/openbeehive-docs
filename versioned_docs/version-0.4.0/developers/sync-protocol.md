---
sidebar_position: 4
title: "Sync protocol"
---

# Sync protocol

The app reads and writes a local SQLite-WASM database and reconciles it with
the server through `SyncService`. This page documents the wire contract from
`proto/openbeehive/v1/sync.proto` and the merge rules in
`server/internal/sync/merge.go` and `app/src/lib/local/merge.ts`.

## The service

```protobuf
service SyncService {
  rpc Pull(PullRequest) returns (PullResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

The client loop (`app/src/lib/local/sync.ts`, `syncOnce`): push the outbox,
then pull until `has_more` is false. It runs every 15 seconds, after every
local write, and on the browser's `online` event. Runs are serialised; a call
that arrives while one is in flight schedules one more pass. The client does
not call `Subscribe`.

## Change

Every row edit travels as one `Change`:

```protobuf
enum ChangeOp {
  CHANGE_OP_UNSPECIFIED = 0;
  CHANGE_OP_UPSERT = 1;
  CHANGE_OP_DELETE = 2;
}

message Change {
  string entity = 1;       // table name: apiary, hive, queen, inspection, task,
                           // placement, harvest, treatment, event
  string entity_id = 2;    // row id (UUID minted on the device)
  string scope_id = 3;     // apiary id, or "user:<id>"
  ChangeOp op = 4;
  string payload_json = 5; // JSON object of changed columns; ignored on delete
  string hlc = 6;          // Hybrid Logical Clock of the write
  string author_id = 7;    // user id of the device or API caller that wrote it
}
```

`payload_json` is a partial delta, not the whole row: the client's `patch()`
writes only the columns it changed. Keys are the `snake_case` column names
from the [data model](/developers/data-model). A row created on the device is
a delta containing every column. A delete is `op = CHANGE_OP_DELETE`; the
receiver sets `deleted = true` and ignores the payload.

Set columns (currently only `inspection.photo_keys`) use a different payload
shape:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` lists the add-tags the removing device had observed. Deltas
without it (older clients) remove every tag the receiver holds.

### HLC format

`"<ms:15>:<counter:5>:<node>"`, for example
`001781234567890:00003:a1b2c3d4`. Millisecond wall clock zero-padded to 15
digits, a 5-digit counter, then a node id (8 random characters stored in
`localStorage` on the device; `BEEHIVE_NODE_ID`, default `server`, on the
server). Plain string comparison orders HLCs. Both sides call `recv()` on
every incoming HLC so their clocks stay ahead of anything they have seen.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // last seen server sequence, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
}
```

The cursor is the decimal string of the server's receive sequence
(`change_log.seq`), not an HLC. The server returns rows with
`seq > cursor` whose `scope_id` is in the caller's scope set, ordered by
`seq`, and sets `next_cursor` to the last `seq` returned (or echoes the
request cursor when nothing matched). Persist `next_cursor` only after
applying the whole page. `has_more` means the page was cut at `limit`; pull
again immediately.

Rows in scopes you cannot read still consume sequence numbers, so the values
you see have gaps.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message Conflict {
  string entity = 1;
  string entity_id = 2;
  string winning_hlc = 3;
}
message PushResponse {
  string server_cursor = 1;      // global sequence after this push
  repeated Conflict conflicts = 2;
}
```

The server processes the batch in one transaction:

1. `hlc.Recv(change.hlc)`.
2. Unknown `entity` values are skipped.
3. `scope_id` must be in the caller's scope set, except that an `apiary`
   change whose `scope_id` equals its own `entity_id` opens a new scope. Any
   other unknown scope fails the whole push with `permission_denied`.
4. The payload's `organization_id`, if present and non-empty, must match the
   caller's active tenant; an existing row must belong to that tenant. New
   rows are stamped with the caller's tenant. A mismatch fails the push with
   `permission_denied`.
5. The change is merged field by field (see below) and appended to
   `change_log` with a fresh `seq`.

`conflicts` is always empty in the current server: stale fields are dropped
silently during the merge and the newer value arrives on the next `Pull`.
`server_cursor` is the global sequence after the push; the client stores it
as its cursor, which skips pulling its own changes back.

The client drops the whole outbox batch when `Push` returns
`permission_denied` (read-only demo session or an unwritable scope). The
rows stay in the local tables; only the upload is abandoned. Any other error
keeps the outbox for the next run.

## Merge rules

Both sides apply the same algorithm (`applyChange` in
`server/internal/service/sync.go`, `applyRemote` in
`app/src/lib/local/sync.ts`).

Every synced table has a `field_hlc` column holding a JSON map
`{ "<column>": "<hlc>" }`, the field clock.

**New row.** Insert every column in the payload and stamp each with the
change's HLC.

**Existing row, scalar column.** Apply the value only if the change's HLC is
greater than the column's entry in `field_hlc`, then update that entry. Two
devices editing different columns of the same row both win; two devices
editing the same column resolve to the higher HLC.

**Existing row, set column.** The stored value is an OR-Set:
`{ "<element>": { "a": ["<tag>", ...], "r": ["<tag>", ...] } }`. `add`
elements get the change's HLC as a new tag in `a`. `remove` elements move
the tags listed in `removed_tags` (or all current `a` tags) into `r`. An
element is visible while it has a tag in `a` that is not in `r`, so an add
that a remover never saw survives (add-wins). Set columns are never
overwritten by LWW.

**Delete.** `deleted` is a normal scalar column and follows LWW with the
delete's HLC. Rows are never removed; readers filter `deleted = 0`.

If nothing in the change beats the field clock, the row is left untouched.

## Scopes

The server computes a caller's scope set as:

```text
{ "user:<user id>" }
  ∪ { id of every apiary in the caller's active tenant }
  ∪ { apiary_id from apiary_share rows for the caller }
```

The same set gates `Pull` and `Push`. Apiaries use their own id as
`scope_id`; everything under an apiary (hives, queens, inspections, tasks,
placements, harvests, treatments, events) carries the apiary id. Nothing in
the current app writes `apiary_share`, so in practice the scope set is the
tenant's apiaries.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

A server stream. Every two seconds the server reads the global sequence
counter and sends `server_cursor` when it has advanced past the request
cursor and past the last value sent. It carries no changes; a receiver
calls `Pull`. The counter is global, not per scope, so an event may lead to
an empty pull. The app does not use it.

## Server-side tables

`change_log` is the feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`. `seq_counter` holds the single
counter row (`name = 'change'`) that is incremented per accepted change. On
the client, `outbox` holds not-yet-pushed changes in the same shape and
`sync_meta` stores the cursor under key `cursor`.

## Server-originated changes

The CRUD services (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`) do not write the
entity tables directly. Every write RPC builds a `Change` and runs it through
`applyChange` and `appendChangeLog` inside one transaction
(`server/internal/service/writer.go`), the same two steps `Push` performs per
change. Such a change has `author_id` set to the user id of the API caller,
an `hlc` drawn from the server's own clock (node id `BEEHIVE_NODE_ID`, the
clock shared with the `Push` handler so it stays ahead of everything received),
and a `scope_id` of the apiary the row belongs to: an apiary's own id, the
hive's apiary for hives, queens, inspections and treatments, and `user:<id>`
for a task without an apiary. Its `payload_json` is a partial delta like a
device's, so a later device edit of another column merges with it, and the
row shows up in the next `Pull` of every device that can read the scope.
Deletes through the API are `CHANGE_OP_DELETE` tombstones. The multi-row
flows (hive plus placement plus event, queen replacement, frozen context for
inspections and treatments) append one change per row, mirroring
`app/src/lib/local/history.ts`.
