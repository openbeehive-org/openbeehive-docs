---
sidebar_position: 1
title: "Offline-first architecture"
---

# Offline-first architecture

Openbeehive is built so that beekeeping happens out at the apiary, often far from any signal. Every device carries a full copy of the data it needs, the interface reads and writes that local copy instantly, and a background engine quietly keeps everything in step with the server when a connection is available.

This page explains how the pieces fit together. For the exact rules that keep replicas consistent, see [the sync protocol](/developers/sync-protocol) and [history and events](/developers/history-and-events).

## Local-first by design

The central idea is simple: the device is the source of truth for the work you are doing right now.

- Each device keeps its own database. The web app (a SvelteKit PWA) runs an embedded SQLite database compiled to WebAssembly (SQLite-WASM), backed by the browser's Origin Private File System (OPFS) for durable, private storage.
- The user interface only ever reads from and writes to the local database. There is no network call on the critical path, so opening a hive, recording an inspection, or ticking off a task is immediate and works with no signal at all.
- A separate background engine handles the network. It pushes local changes up to the server and pulls remote changes down, reconciling the two without ever blocking the interface.

Because the local database is always available, the app behaves the same whether you are online, offline, or on a flaky mobile connection in the middle of an orchard.

## The data-flow

The diagram below shows how a change travels from a tap in the interface out to the server and back to other devices.

```text
        Device A                          Server                       Device B
   +----------------+               +----------------+            +----------------+
   |   SvelteKit UI |               |   Go backend   |            |   SvelteKit UI |
   |  (reads/writes |               | (Connect-RPC:  |            |  (reads/writes |
   |    locally)    |               |  gRPC + JSON)  |            |    locally)    |
   +-------+--------+               +-------+--------+            +--------+-------+
           | read/write                     |                              | read/write
           v                                |                              v
   +----------------+                       |                     +----------------+
   | SQLite-WASM    |                       |                     | SQLite-WASM    |
   |   on OPFS      |                       |                     |   on OPFS      |
   +-------+--------+                       |                     +--------+-------+
           |                                |                              |
           |  Sync engine                   |                  Sync engine |
           |  (Push / Pull)                 |                              |
           +-----> Push changes ----------->|                              |
           |                                | store + order by HLC          |
           |<----- Pull changes ------------|                              |
                                            |------> Push changes <---------+
                                            |------- Pull changes --------->|
   scope: only apiaries the user can see (partial replication)
```

The sync engine exchanges only the records that belong to the scopes a user can access, so a device never downloads the whole world: just the apiaries it is entitled to.

Scripts and sensors enter the same picture through the server's CRUD services ([Using the API](/using-the-api/overview)). Their writes do not bypass this flow: the server applies each one with the same per-field merge and appends it to the same change log as a pushed change, so a reading posted by a hive scale is just another change that devices pull on their next sync.

## Conflict resolution

Two devices can edit the same hive while both are offline. When they reconnect, Openbeehive merges their changes deterministically, with no manual conflict prompts. Three techniques make this conflict-free.

### Hybrid Logical Clocks (HLC)

Every change is stamped with a Hybrid Logical Clock value, combining wall-clock time with a logical counter and a node identifier. HLC gives every change across every device a total, causally consistent order, even when device clocks drift. This ordering is the foundation for the rules below.

### Per-field last-writer-wins for scalars

For simple scalar fields, such as a hive's name, type, or a queen's marking colour, the value with the highest HLC wins. Merging is per field, not per record, so two people editing different fields of the same hive both keep their changes.

### OR-Sets for list fields

List-like fields (currently only the photo keys on an inspection) use an observed-remove set (OR-Set) with add-wins semantics. Concurrent additions all survive, and a removal only takes effect against the specific entries it observed. This avoids the classic problem where one person's addition silently erases another's.

### Append-only events

The `event` table is append-only by convention: every history write inserts a new row with a fresh id and nothing edits or deletes one, so two devices adding events offline never touch the same row. See [history and events](/developers/history-and-events) for detail.

:::tip
Because merges are deterministic, any two devices that have seen the same set of changes will always compute exactly the same result, regardless of the order in which those changes arrived.
:::

## Sharing and partial replication

Sharing in Openbeehive happens at the apiary level through **scopes**. A scope grants a user access to a particular apiary and everything beneath it: its hives, queens, inspections, tasks, events, harvests, and treatments.

Sync is scoped to match. A device replicates only the data within the scopes its user can see, a model known as partial replication. This keeps local databases small and focused, limits what travels over the network, and means a member of one association's apiary never receives data from apiaries they have no part in.

When a new scope is granted, the next pull brings down that apiary's history; when access is removed, those records stop syncing.

## Mobile-first PWA

The app is a Progressive Web App, designed first for the phone in your pocket at the hive stand.

- A **service worker** caches the application shell and assets so the app loads instantly and runs fully offline after the first visit.
- **SQLite-WASM on OPFS** provides a real relational database in the browser, with durable, origin-private storage that survives reloads.
- The app is installable to the home screen and behaves like a native app, including the QR scanning flow that opens the app at a specific hive.

## How it fits together

| Layer | Technology | Responsibility |
| --- | --- | --- |
| Interface | SvelteKit PWA | Reads and writes the local database; never blocks on the network |
| Local store | SQLite-WASM on OPFS | Durable, on-device source of truth |
| Sync engine | Background Push / Pull | Reconciles local and remote changes via HLC, LWW, OR-Sets |
| Backend | Go, Connect-RPC | Stores and orders changes; enforces scopes; serves pulls |
| Storage | Pluggable database and blob backends | Persists data and media on the server |

This separation is what gives Openbeehive its core promise: the records are always with you, always fast, and always consistent once everyone is back in range.

To go deeper, read [the sync protocol](/developers/sync-protocol) and [history and events](/developers/history-and-events), or browse the rest of the [developer documentation](/category/developers).
