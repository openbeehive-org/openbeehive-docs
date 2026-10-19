---
sidebar_position: 2
title: "History & events"
---

# History & events

A hive moves between apiaries, a queen reigns and is replaced, honey is taken
off on a given day. To keep that history correct after the world changes,
every history write freezes the context that was true at the time. The code
is in `app/src/lib/local/history.ts`.

## Events freeze their context

The `event` table is append-only. Each row stores, as plain columns, the
`apiary_id`, `hive_id` and `queen_id` that applied on the event's `date`.
Move the hive next month and last week's inspection still belongs to the old
apiary; requeen and an old harvest stays attributed to the queen who produced
it.

The same rows serve as the fact table for statistics: `amount_kg` is copied
onto harvest events, so honey per apiary, per queen or per year is one
`GROUP BY` over `event` with no joins.

## Interval histories

Two tables hold half-open intervals `[start, end)`:

| Table | Interval | Meaning |
| --- | --- | --- |
| `queen` | `[introduced_at, replaced_at)` | The queen heads the colony from introduction until she is replaced. `replaced_at` is null while she reigns; `active` is also set. |
| `placement` | `[start_at, end_at)` | The hive sits in `apiary_id` from `start_at` until it is moved. `end_at` is null for the current placement. |

Half-open intervals tile without overlap: on a changeover day exactly one row
matches.

## resolveContext

Entries are often back-dated (Saturday's visit entered on Monday), so the
context is resolved for the entry's own date, not for now:

```ts
resolveContext(hiveId: string, date: string) -> { apiaryId, queenId }
```

It runs two queries against the local database and falls back to the current
values when no interval covers the date:

```sql
-- Where the hive lived on the date (falls back to hive.apiary_id).
SELECT apiary_id FROM placement
WHERE hive_id = ? AND deleted = 0 AND start_at <= ?
  AND (end_at IS NULL OR end_at > ?)
ORDER BY start_at DESC LIMIT 1;

-- Who reigned on the date (falls back to the queen with active = 1).
SELECT id FROM queen
WHERE hive_id = ? AND deleted = 0 AND introduced_at <= ?
  AND (replaced_at IS NULL OR replaced_at > ?)
ORDER BY introduced_at DESC LIMIT 1;
```

## Functions that write history

| Function | Writes |
| --- | --- |
| `createHive` | `hive` row, an open `placement`, event `CREATED` |
| `setQueen` | closes the active queen (`active = 0`, `replaced_at`), inserts the new one, events `QUEEN_REPLACED` and `QUEEN_INTRODUCED` |
| `moveHive` | closes the open `placement`, opens a new one, updates `hive.apiary_id`, event `MOVED` with `detail = {from, to}` |
| `recordHarvest` | `harvest` row with frozen `apiary_id` / `queen_id`, event `HARVEST` with `amount_kg` and `ref_id` |
| `recordTreatment` | `treatment` row with frozen context, event `TREATMENT` |
| `recordInspection` | `inspection` row, event `INSPECTION` |

`recordHarvest`, `recordTreatment` and `recordInspection` call
`resolveContext` first. All writes go through `patch()` in
`app/src/lib/local/repo.ts`, so they land in the local table and the sync
outbox like any other change. The detail rows (`harvest`, `treatment`,
`inspection`) are normal synced rows; only `event` is treated as append-only
by convention. Nothing in the app edits or deletes an event.

Event type numbers are listed in the [data model](/developers/data-model#event).

## Reading history

```ts
historyForHive(hiveId)     // SELECT * FROM event WHERE deleted = 0 AND hive_id = ?   ORDER BY date DESC
historyForApiary(apiaryId) // ... WHERE apiary_id = ?
historyForQueen(queenId)   // ... WHERE queen_id = ?
```

Statistics:

```sql
-- honeyByApiary
SELECT apiary_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY apiary_id ORDER BY kg DESC;

-- honeyByQueen
SELECT queen_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY queen_id ORDER BY kg DESC;

-- honeyByYear
SELECT substr(date, 1, 4) AS year, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY year ORDER BY year;
```

`type = 7` is `HARVEST`. Because the dimensions are frozen on the row, no join
to current state is needed.

## Sync

`event` rows carry `scope_id` (the apiary id) as a column and sync like every
other table, with per-field last-writer-wins. Since each event has a fresh
UUID and is never edited, two devices adding events offline never touch the
same row and both sets survive. See the [sync protocol](/developers/sync-protocol).
