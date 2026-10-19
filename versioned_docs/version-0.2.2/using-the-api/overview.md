---
sidebar_position: 1
title: "API overview"
---

# The Openbeehive API

Openbeehive is **API-first and open**. There is no hidden backend: everything
the app does — creating apiaries, recording inspections, syncing devices,
reading statistics — goes through a single, public **Connect-RPC** API. The same
contract that powers the app is available to you.

That openness is deliberate. Your records are yours, so you should be able to
read them, script them, feed them from your own sensors, and move them elsewhere
without asking anyone's permission.

## One contract, two protocols

The API is defined once as a [Protocol Buffers](https://protobuf.dev/) contract
and served with [Connect-RPC](https://connectrpc.com/). That means **every
endpoint is reachable two ways**, from the same URL:

| Style | Best for | Page |
| --- | --- | --- |
| **HTTP + JSON** (REST-like) | curl, scripts, webhooks, microcontrollers, quick integrations | [REST / HTTP + JSON](/using-the-api/rest) |
| **gRPC / gRPC-Web / Connect** | typed clients, streaming, high-volume sync | [gRPC](/using-the-api/grpc) |

You don't choose a protocol on the server — you choose it per request, by the
headers you send. Pick whichever is easier for your tool.

## Base URL

The API is served by the same process that serves the app:

- Hosted service: `https://app.openbeehive.org`
- Self-hosted: your own origin, e.g. `https://bees.example.com` (see
  [Self-hosting](/category/self-hosting))

Every method lives at a predictable path:

```
POST <base-url>/openbeehive.v1.<Service>/<Method>
```

For example: `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`.

## Services

The contract is grouped into services. Each maps to a part of the domain you
already know from the app:

| Service | What it covers |
| --- | --- |
| `ApiaryService` | Create, read, update, delete and list apiaries |
| `HiveService` | Hives, including relocating a hive between apiaries |
| `QueenService` | Queens and their reign history |
| `InspectionService` | Inspections / visits (incl. temperature & humidity), photo upload URLs |
| `TreatmentService` | Treatments / the Bestandsbuch (product, batch, dose, withdrawal period) |
| `TaskService` | Tasks and reminders |
| `EventService` | The append-only event / history feed |
| `StatsService` | Dashboard totals and honey statistics |
| `SyncService` | `Pull`, `Push` and a streaming `Subscribe` — the offline-first sync engine |

:::note Implementation status (v0.1.0)
`ApiaryService` and `SyncService` are fully wired server-side today. The other
services are defined in the contract and follow the same shape; they are being
filled in. Check the [contract](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
for the current source of truth, and the
[release notes](https://github.com/openbeehive-org/openbeehive-app/releases) for what's
live.
:::

## Authentication

- **Self-hosted, single user:** when no login is configured, the API is open to
  the instance (you are the only user). This is the simplest setup for home
  servers and scripts. See [Authentication](/self-hosting/authentication).
- **With login enabled / the hosted service:** requests carry a session
  established via OIDC or a passkey. Send it as a bearer token:
  `Authorization: Bearer <token>`. Programmatic API tokens for unattended
  clients (scripts, sensors) are on the roadmap — until then, self-hosting in
  single-user mode is the friction-free path for automation.

## How the app itself uses it

The app is **offline-first**: it writes to a local database first and the
sync engine reconciles with the server through `SyncService.Push` / `Pull`.
The CRUD services (`ApiaryService`, `InspectionService`, …) are the
server-authoritative entry points used for direct integrations, export and
automation. Both views sit on the same data — see
[Offline & sync](/using-the-app/offline-and-sync) and the
[developer architecture](/developers/architecture).

## What you can build

- Pull your data into a spreadsheet, notebook or BI dashboard.
- Script bulk edits or migrations from another beekeeping tool.
- Feed readings from **automated trackers** — hive scales, temperature and
  humidity sensors — straight into inspections. See
  [Automated trackers](/using-the-api/automated-trackers).
- Build your own client, bot or mobile widget against a stable, typed contract.

Ready for the details? Start with [REST / HTTP + JSON](/using-the-api/rest).
