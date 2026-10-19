---
sidebar_position: 1
title: "API overview"
---

# The Openbeehive API

The server exposes a [Connect-RPC](https://connectrpc.com/) API defined in
Protocol Buffers under
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Every RPC is reachable over plain HTTP/JSON, gRPC and gRPC-Web from the same
URL. The app itself uses only `SyncService`; the other services exist for
scripts, sensors and integrations.

## Base URL and path form

The API is served by the same process as the app, on the same origin:

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
```

For example `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`
on the hosted service, or your own origin when self-hosting.

## Served services

Ten services are registered on the server (`server/cmd/server/main.go`):

| Service | RPCs |
| --- | --- |
| `ApiaryService` | `CreateApiary`, `GetApiary`, `ListApiaries`, `UpdateApiary`, `DeleteApiary` |
| `HiveService` | `CreateHive`, `GetHive`, `ListHives`, `UpdateHive`, `DeleteHive`, `RelocateHive` |
| `QueenService` | `CreateQueen`, `ListQueens`, `UpdateQueen`, `DeleteQueen` |
| `InspectionService` | `CreateInspection`, `ListInspections`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Push`, `Subscribe` (server stream) |

Every RPC is scoped to the caller's active tenant. Ids from another tenant
behave like unknown ids (`not_found`).

### Writes go through sync

Every write RPC (`Create*`, `Update*`, `Delete*`, `RelocateHive`,
`SetTaskDone`, `AddInspectionPhoto`, `RemoveInspectionPhoto`) is applied
through the same per-field merge and appended to the same change log as
`SyncService.Push`. A row written through the API reaches every device on
its next sync, and a later edit from a device merges with it field by field,
exactly as edits from two devices merge with each other. Deletes are soft:
the row gets a tombstone (`deleted = 1`) and disappears from lists and from
the app.

Server-side writes mirror the app's own flows
(`server/internal/service/writer.go` is a port of
`app/src/lib/local/history.ts`), so the history a device shows is the same
whether a record was entered in the app or through the API:

- `CreateHive` writes the hive, opens a placement interval and records a
  `CREATED` event. New hives start as `HIVE_STATUS_ACTIVE`.
- `RelocateHive` closes the open placement, opens a new one at the target
  apiary and records a `MOVED` event. `UpdateHive` never moves a hive.
- `CreateQueen` ends the reign of the hive's active queen (`active = false`,
  `replacedAt` set to the new queen's `introducedAt`), records
  `QUEEN_REPLACED` and `QUEEN_INTRODUCED` events, and derives the marking
  colour from `year` when you send none.
- `CreateInspection` and `CreateTreatment` freeze the apiary and the reigning
  queen at the record's `date` (a back-dated record resolves against the
  placement and queen history) and record an `INSPECTION` or `TREATMENT`
  event.
- `CreateHarvest` freezes the apiary and the reigning queen at `date` the
  same way, writes the harvest row and records a `HARVEST` event that carries
  `amountKg` and the title `<kg> kg <variety>` (`Honey` when `variety` is
  empty). `GetDashboard` and `GetHoneyStats` sum those events, so a harvest
  posted through the API counts in the honey figures at once. `amountKg` must
  be greater than `0`.
- A task with a `hiveId` or `apiaryId` syncs under that apiary and is shared
  with everyone who sees it; a task with neither lives in the caller's
  personal scope and reaches only that user's devices.

Reads (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`) query
the server tables directly. They show API writes at once and device writes
as soon as the device has pushed them.

### Not in the API yet

- **No harvest edit RPC.** `HarvestService` has `CreateHarvest`,
  `ListHarvests` and `DeleteHarvest` only. To correct a harvest, delete it and
  create it again, or edit it in the app.
- **No placement RPC.** Placements are written by `CreateHive` and
  `RelocateHive` and appear only in the sync feed.
- `EventService` is read-only. Events are written by the flows above and by
  the app.

See the [sync protocol](/developers/sync-protocol) for the change format and
the [data model](/developers/data-model) for the columns behind each message.

## Non-RPC endpoints

A few plain HTTP endpoints sit next to the RPC services:

| Path | Purpose |
| --- | --- |
| `GET /healthz` | Returns `ok` |
| `GET /files/<key>` | Stored files, only with the filesystem blob backend (`BEEHIVE_BLOB_BACKEND=fs`) |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Email/password accounts (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` set) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `/auth/logout`, `/auth/me`, `/auth/instance`, `/auth/switch`, `/auth/accept-invite` | Session and tenant helpers, present whenever any login method is enabled |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | API key management (list, create, remove), present whenever any login method is enabled; session only, a key cannot call them |
| `/tenants/create`, `/tenants/invite`, `/tenants/invites`, `/tenants/invite/revoke`, `/tenants/delete` | Tenant administration, present whenever any login method is enabled |
| `POST /auth/demo-login` | Only with `BEEHIVE_DEMO=true` |

These are used by the app's login and settings screens. They are not part of
the proto contract.

## Authentication

How a request is authenticated depends on whether the instance has a login
method:

- **No login configured** (self-hosted, `BEEHIVE_PASSWORD_AUTH=false`,
  `BEEHIVE_OIDC_PROVIDERS` empty, `BEEHIVE_WEBAUTHN_ENABLED=false`): every
  request runs as the fixed local user. Send no credentials. There are no
  API keys on such an instance; none are needed.
- **Login configured**: every RPC needs an API key or a session token in
  `Authorization: Bearer <token>` (the `obh_session` cookie is accepted for
  session tokens). A request without a valid token gets Connect code
  `unauthenticated` (HTTP 401).

### API keys

An API key is the recommended credential for scripts, sensors and
integrations. Keys are managed in the app under **Settings → API keys**
(see [Accounts & tenants](../using-the-app/accounts-tenants.md#api-keys)):

1. Sign in, switch to the tenant the script should write to, and open
   **Settings → API keys**.
2. Type a name (for example `hive scale`), pick the permissions (**Read and
   write** or **Read-only**) and an expiry (**Never expires**, **30 days**,
   **90 days** or **1 year**), then tap **Create key**. The key starts with
   `obhk_` and is shown once; copy it now. The server stores only its
   SHA-256 hash and the first 12 characters for display.
3. Send it on every RPC:

```text
Authorization: Bearer obhk_...
```

What a key can and cannot do:

- It acts as its owner, with the owner's role, inside the tenant that was
  active when the key was created. It cannot switch tenants; create one key
  per tenant if a script needs several.
- It works on RPCs only. The `/auth/*` and `/tenants/*` endpoints, including
  key management itself, need a real session: a key cannot list, create or
  remove keys.
- It has one of two scopes, fixed at creation. A `write` key (the default)
  may call every RPC its owner may call. A `read` key may call only RPCs
  whose name starts with `Get`, `List`, `Pull` or `Subscribe`; every other
  RPC returns Connect code `permission_denied` (HTTP 403) with the message
  `this API key is read-only`.
- It expires only if you set an expiry: `expires_in_days` from `0` (never,
  the default) to `3650`. Past `expires_at` every RPC returns
  `unauthenticated` (HTTP 401) with the message `API key expired`. Expired
  keys stay in the list until you remove them.
- It stops working the moment it is removed in Settings, and it dies with
  the membership: when the owner leaves or is removed from the tenant, the
  key is refused.
- Every use stamps `last_used_at`, shown as **Last used** in Settings.
- The demo account cannot create keys.

The same endpoints the app uses are open to a session-authenticated script:

- `GET /auth/api-keys` returns `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, your own keys in the
  active tenant only. `scope` is `"write"` or `"read"`; `expires_at` and
  `last_used_at` are RFC 3339 timestamps or `null`; `mine` is always
  `true` here.
- `GET /auth/api-keys?tenant=1` returns every key of the active tenant,
  each row additionally carrying `user_id`, `user_email` and a `mine`
  flag that is `true` on your own keys. Only the tenant owner (the role
  the app calls **Admin**) and the instance admin may call it; everyone
  else gets HTTP 403.
- `POST /auth/api-keys` with `{"name": "...", "scope": "write",
  "expires_in_days": 0}` returns `{id, name, prefix, scope, created_at,
  expires_at, token}`. `scope` defaults to `"write"` and `expires_in_days`
  to `0` (never) when omitted. Any other scope, or a lifetime below `0` or
  above `3650`, answers HTTP 400.
- `POST /auth/api-keys/delete` with `{"id": "..."}` answers `204`. A
  member can remove only their own keys; someone else's id answers 404.
  The tenant owner and the instance admin can remove any key of the
  active tenant. The override never reaches across tenants: an owner of
  another tenant gets 404 for keys that are not theirs.

### Session sign-in

The alternative is the app session token, an HMAC-signed value the server
issues on login. It is accepted on RPCs and on the `/auth/*` and
`/tenants/*` endpoints. With password auth enabled a script gets one with:

```bash
curl -s -X POST https://bees.example.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

The JSON response contains `token`; the same value is also set as the
`obh_session` cookie. The token expires after `BEEHIVE_SESSION_TTL`.

The token carries the account's active tenant. `GET /auth/me` lists the
tenants you belong to (`tenants`) and the active one (`active_org`);
`POST /auth/switch` with `{"org_id": "..."}` returns a new `token` for
another tenant.

With `BEEHIVE_DEMO=true`, demo sessions are read-only: the demo account can
call only RPCs whose names start with `Get`, `List`, `Pull` or `Subscribe`.
Every other RPC returns `permission_denied`.

See [Authentication](/self-hosting/authentication) for how to configure the
login methods.

## Protocol pages

- [REST / HTTP + JSON](/using-the-api/rest): curl examples, the JSON shape
  and the pagination contract.
- [gRPC](/using-the-api/grpc): generated clients and the streaming
  `Subscribe` call.
- [Automated trackers](/using-the-api/automated-trackers): posting hive-scale
  and climate readings from a script or device.
