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

The outbox is pushed in batches of at most 200 changes and about 4 MiB of
payload; a batch the server refuses as a whole is halved and sent again.

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
  string author_id = 7;    // set by the server from the signed-in caller
}
```

`payload_json` is a partial delta, not the whole row: the client's `patch()`
writes only the columns it changed. Keys are the `snake_case` column names
from the [data model](./data-model.md). A row created on the device is
a delta containing every column. A delete is `op = CHANGE_OP_DELETE`; the
receiver sets `deleted = true` and ignores the payload.

Scalar values are strings, numbers, booleans or `null`. Booleans travel as
`0`/`1`, timestamps as ISO 8601 strings (`""` means not set). The server
keeps only the columns it knows, drops unknown keys silently and stores the
payload in this normalised form, which is also what `Pull` returns. Receivers
must ignore keys they do not know. `author_id` is always set by the server
from the authenticated caller; what a client sends there is ignored. One
payload may be at most 4 MiB and an entity id at most 255 characters.

Set columns (currently only `inspection.photo_keys`) use a different payload
shape:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` lists, per removed element, the add-tags the removing device
had observed; only those are tombstoned, so a concurrent add elsewhere
survives. The rule for its absence is strict:

- `removed_tags` **absent** (older clients): every tag the receiver holds for
  the element is removed.
- `removed_tags` **present but empty** for an element: nothing is removed.

### HLC format

`"<ms:15>:<counter:5>:<node>"`, for example
`001781234567890:00003:a1b2c3d4`. Millisecond wall clock zero-padded to
exactly 15 digits, a counter of exactly 5 digits, then a node id of 1 to 64
characters out of `[A-Za-z0-9._-]` (a random id stored in `localStorage` on
the device; on the server `BEEHIVE_NODE_ID`, by default a random `srv-…` id
chosen at every start). Plain string comparison orders HLCs. Per field the
newer stamp wins; equal stamps do not overwrite. A stamp that does not match
this format makes the change `invalid`.

**The 10-minute limit.** The server refuses a change whose stamp is more than
10 minutes ahead of its own clock (`clock_ahead`), because such a stamp would
win every later merge. Both `Pull` and `Push` return `server_time_ms`; the app
uses it to correct for a wrong device clock, and when changes come back as
`clock_ahead` it gives the affected outbox entries (and the matching field
clocks and set tags of the local rows) fresh stamps in the old order and sends
them again. The server's own clock follows only stamps it has accepted and
stored.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // next_cursor of the previous Pull, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
  int64 server_time_ms = 4; // server wall clock, unix ms
}
```

The cursor is the decimal string of the server's receive sequence
(`change_log.seq`), not an HLC. `Pull` is scoped by workspace: the server
returns the rows with `seq > cursor` that belong to the caller's active
workspace, ordered by `seq`. The one exception are personal rows (scope
`user:<id>`), which are returned only to their owner, and only inside the
workspace they were written in. `next_cursor` is the last `seq` returned (or
the request cursor when nothing matched). Persist `next_cursor` only after
applying the whole page. `has_more` means the page was cut at `limit`; pull
again immediately.

Rows of other workspaces still consume sequence numbers, so the values you
see have gaps.

**The cursor only ever advances through `Pull`.** A device must not derive it
from anything else, in particular not from a `Push` response: other devices'
changes with lower sequence numbers would be skipped for good.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message RejectedChange {
  int32 index = 1;   // position in PushRequest.changes
  string code = 2;   // machine-readable cause, see below
  string reason = 3; // plain English, for logs
}
message PushResponse {
  string server_cursor = 1;             // always empty
  repeated Conflict conflicts = 2;      // unused, always empty
  repeated RejectedChange rejected = 3; // changes that were not applied
  int64 server_time_ms = 4;             // server wall clock, unix ms
}
```

A push may carry at most 2000 changes (`invalid_argument` beyond that). The
server applies each change on its own, inside one transaction with a
savepoint per change: a change it refuses is rolled back and reported in
`rejected`, and every other change of the request is applied normally. A
change that is not listed in `rejected` was accepted. Accepted does not mean
it won: fields older than what the server holds lose the per-field merge.

Per change the server:

1. Checks the change itself: a known `entity`, an id of 1 to 255 characters,
   an `op` of upsert or delete, a well-formed stamp that is not more than 10
   minutes ahead.
2. Checks the scope: `scope_id` must be the caller's personal scope
   (`user:<id>`) or an apiary of the caller's active workspace. An `apiary`
   change whose `scope_id` equals its own `entity_id` opens a new scope.
3. Checks the workspace: an existing row must belong to the caller's active
   workspace; new rows are stamped with it.
4. Normalises the payload to the known columns, merges it field by field
   (see below) and appends it to `change_log` with a fresh `seq`.

The codes in `rejected`:

| Code | Meaning |
| --- | --- |
| `wrong_tenant` | The row belongs to another workspace. |
| `forbidden_scope` | `scope_id` is not writable for the caller. |
| `unknown_entity` | `entity` is not a synced table. |
| `invalid` | Malformed stamp, payload, value or id. |
| `clock_ahead` | The stamp is more than 10 minutes ahead of the server; stamp again with a corrected clock and resend. |

The whole request fails only for reasons that are not about a single change:
`permission_denied` for read-only identities (the demo account, read-only API
keys), `unauthenticated`, or a server error, in which case nothing of the
request is applied.

`server_cursor` and `conflicts` remain in the message so that older apps keep
decoding the response; both are always empty.

What the app does with the answer: accepted changes leave the outbox.
Rejected ones are moved to a list of refused changes that the user sees as
**Sync problems**, with retry and discard; the rows stay in the local tables.
`clock_ahead` is handled by stamping again as described above. A push refused
as read-only drops the batch from the outbox and keeps the rows locally. Any
other error keeps the outbox for the next run.

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

The two implementations are kept identical by shared test vectors:
`server/internal/sync/testdata/merge_vectors.json` is run by the Go tests and
by the app's tests.

## Scopes

The workspace is the only sharing unit. Every change belongs to the workspace
of the caller that wrote it, and inside the workspace it carries a `scope_id`:

- the id of the apiary it belongs to (apiaries use their own id; hives,
  queens, inspections, placements, harvests, treatments, events and tasks
  with an apiary carry the apiary id), or
- `user:<user id>` for personal rows, such as a task without an apiary.

A caller may write to its own personal scope and to the apiaries of its
active workspace. It reads every change of the active workspace except other
members' personal rows. There is no per-apiary sharing.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

A server stream, per workspace. Every two seconds the server looks up the
newest change the caller can pull and sends `server_cursor` when it has
advanced past the request cursor and past the last value sent. It carries no
changes; a receiver calls `Pull`. Activity in other workspaces does not wake
the stream. One user may hold at most 4 open streams; a further one is
refused with `resource_exhausted`. The app does not use it.

## Server-side tables

`change_log` is the feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, indexed by `(org_id, seq)` for
`Pull`. `seq_counter` holds the single counter row (`name = 'change'`) that is
incremented per accepted change; every writer locks it first, so merges are
serialised. On the client, `outbox` holds not-yet-pushed changes in the same
shape and `sync_meta` stores the cursor under key `cursor`.

## Server-originated changes

The CRUD services (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`, `HarvestService`) do
not write the
entity tables directly. Every write RPC builds a `Change` and runs it through
`applyChange` and `appendChangeLog` inside one transaction
(`server/internal/service/writer.go`), the same two steps `Push` performs per
change. Such a change has `author_id` set to the user id of the API caller,
an `hlc` drawn from the server's own clock (node id `BEEHIVE_NODE_ID`, the
clock shared with the `Push` handler so it stays ahead of everything accepted),
and a `scope_id` of the apiary the row belongs to: an apiary's own id, the
hive's apiary for hives, queens, inspections, treatments and harvests, and `user:<id>`
for a task without an apiary. Its `payload_json` is a partial delta like a
device's, so a later device edit of another column merges with it, and the
row shows up in the next `Pull` of every device that can read the scope.
Deletes through the API are `CHANGE_OP_DELETE` tombstones, and a delete of a
record also tombstones its timeline events. The multi-row flows (hive plus
placement plus event, queen replacement, frozen context for inspections,
treatments and harvests) append one change per row, mirroring
`app/src/lib/local/history.ts`.
