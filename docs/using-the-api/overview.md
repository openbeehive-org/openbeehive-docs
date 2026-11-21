---
sidebar_position: 1
title: "API overview"
---

# The Openbeehive API

The server exposes a [Connect-RPC](https://connectrpc.com/) API defined in
Protocol Buffers under
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Every RPC is reachable over plain HTTP/JSON, gRPC and gRPC-Web from the same
URL. The app itself uses only `SyncService` and the plain HTTP endpoints for
photos, export and accounts; the other services exist for scripts, sensors
and integrations.

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
| `InspectionService` | `CreateInspection`, `ListInspections`, `UpdateInspection`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `UpdateTask`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `UpdateTreatment`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `UpdateHarvest`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Snapshot`, `Push`, `Subscribe` (server stream); scripts send the `Openbeehive-Sync-Protocol: 1` header, see [Sync protocol](../developers/sync-protocol.md#versions) |

Every RPC is scoped to the caller's active workspace (called `tenant` or
`organization` in paths and field names). Ids from another workspace behave
like unknown ids (`not_found`).

One RPC message may be at most 16 MiB, and a request other than the
`Subscribe` stream may take at most 2 minutes.

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
  personal scope: it reaches only that user's devices and `ListTasks`
  returns it only to its owner.
- `CreateInspection` with `source: INSPECTION_SOURCE_SENSOR` stores a sensor
  reading instead of a visit; see
  [Automated trackers](./automated-trackers.md).

Corrections and deletes keep the history consistent:

- `UpdateInspection`, `UpdateTreatment` and `UpdateHarvest` correct a saved
  record. Their timeline event follows the edit, and when `date` changes the
  apiary and queen are resolved again for the new date. Treatments and
  harvests get `amendedAt` set to the time of the edit.
- `DeleteInspection`, `DeleteTreatment`, `DeleteHarvest` and `DeleteQueen`
  also remove the record's timeline events, so a deleted harvest no longer
  counts in the honey figures.
- `DeleteHive` also deletes the hive's open tasks. `DeleteApiary` fails with
  `failed_precondition` while the apiary still has hives: move them with
  `RelocateHive` or delete them first.

### Updates change only what you send \{#partial-updates}

Every `Update*` RPC is a partial update with the same two modes:

- **Without `updateMask`:** every field you leave at its zero value (`""`,
  `0`, `false`, unset) keeps its stored value. Send only what changes.
- **With `updateMask`:** exactly the listed fields are written, including to
  their zero value. That is how you clear a note, remove a due date or reopen
  a task. In JSON the mask is a comma-separated string of field names:
  `"updateMask": "note,dueAt"`.

A request that would change nothing is rejected with `invalid_argument`.
Fields that identify the record (`id`, `hiveId`, the workspace) cannot be
changed; a hive changes its apiary through `RelocateHive` only.

Reads (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`) query
the server tables directly. They show API writes at once and device writes
as soon as the device has pushed them.

### Photos \{#photos}

`Inspection.photos` lists the photos of an inspection and `Hive.picture` the
hive's picture, each as a `Photo` with `id`, `thumbnail` (a data URL of about
200 px), `contentType`, `sizeBytes`, `createdAt` and `path`. The full-size
image is a plain `GET` of `path` (`/photos/<id>`) on the same host, with the
same credentials as the RPCs; `path` is empty while the device that took the
photo has not uploaded the image yet. `AddInspectionPhoto` adds a JPEG, PNG
or WebP image of at most 5 MiB, `RemoveInspectionPhoto` deletes a photo for
good, on every device. `photoKeys` holds only the inline photos of 0.4.x
apps. See [REST](./rest.md#photos).

### Not in the API yet

- **No placement RPC.** Placements are written by `CreateHive` and
  `RelocateHive` and appear only in the sync feed.
- `EventService` is read-only. Events are written by the flows above and by
  the app.

See the [sync protocol](../developers/sync-protocol.md) for the change format and
the [data model](../developers/data-model.md) for the columns behind each message.

## Non-RPC endpoints

A few plain HTTP endpoints sit next to the RPC services:

| Path | Purpose |
| --- | --- |
| `GET /healthz` | Returns `ok` once the server listens (the first start of 0.5.0 converts inline photos before that) |
| `GET /photos/<id>`, `POST /photos/<id>` | Full-size photo images: read, or upload the image of a photo record that has already been synced; session or API key, members of the workspace only. See [REST](./rest.md#photos) |
| `GET /export`, `GET /export?photos=1` | The active workspace as JSON, or as a ZIP with photos; session or write API key. See [REST](./rest.md#export) |
| `GET /auth/instance` | What the instance offers (login methods, demo, registration, map settings); always present, no credentials needed |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Email/password accounts (`BEEHIVE_PASSWORD_AUTH=true`) |
| `POST /auth/password/change`, `POST /auth/password/reset-request`, `POST /auth/password/reset`, `POST /auth/admin/reset-link` | Change a password; ask for, and complete, a reset; a reset link created by the instance admin (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` set) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `POST /auth/logout`, `POST /auth/logout-all`, `GET /auth/me`, `POST /auth/switch`, `POST /auth/accept-invite`, `POST /auth/session/recover` | Session and workspace helpers, present whenever any login method is enabled; without login `GET /auth/me` answers `{"no_login": true}` |
| `GET /auth/invite?token=...` | The workspace name, the masked email address (`j…@e….org`) and the expiry of an invite, without credentials; unknown, used or revoked invites answer `400` `invite_invalid`, expired ones `invite_expired` |
| `GET /auth/account`, `POST /auth/account/delete` | What deleting the account would do, and deleting it |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | API key management (list, create, remove), present whenever any login method is enabled; session only, a key cannot call them |
| `POST /tenants/create`, `POST /tenants/invite`, `GET /tenants/invites`, `POST /tenants/invite/revoke`, `POST /tenants/delete` | Workspace administration, present whenever any login method is enabled |
| `GET /tenants/members`, `POST /tenants/members/remove`, `POST /tenants/members/role`, `POST /tenants/leave` | Members of a workspace: list, remove, change role, leave |
| `POST /auth/demo-login` | Only with `BEEHIVE_DEMO=true` |

These are used by the app's login and settings screens. They are not part of
the proto contract. The `/auth/*` and `/tenants/*` endpoints follow the same
rules:

- Each endpoint accepts only the method shown; anything else answers `405`
  with an `Allow` header.
- `POST` endpoints that take a body need `Content-Type: application/json`
  (`415` otherwise), and the body may be at most 64 KiB.
- `POST` requests from a browser page on another site are refused with `403`
  (`cross_site_request`). Scripts, which send no `Origin` header, are not
  affected.
- `/tenants/delete` and `/tenants/leave` need `{"org_id": "..."}`; there is
  no default.
- `POST /tenants/invite` answers `409` `already_member` for someone who is
  already in the workspace. Inviting an address with an open invite replaces
  that invite (the old link stops working) and the answer has
  `"renewed": true`.
- Pages a browser opens directly (`/auth/verify`, `/auth/login`,
  `/auth/callback`) answer an error with a redirect to `/login?error=<code>`
  instead of JSON.
- Errors are JSON, `{"error": "<plain English>", "code": "<snake_case>"}`.
  The codes are listed on the [REST page](./rest.md#http-error-codes).

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
integrations. Keys are managed in the app under **Settings → Workspace → API keys**
(see [Accounts & workspaces](../using-the-app/accounts-tenants.md#api-keys)):

1. Sign in, switch to the workspace the script should write to, and open
   **Settings → Workspace → API keys**.
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

- It acts as its owner, with the owner's role, inside the workspace that was
  active when the key was created. It cannot switch workspaces; create one key
  per workspace if a script needs several.
- It works on RPCs, `/photos/` and `/export`. The `/auth/*` and `/tenants/*`
  endpoints, including key management itself, need a real session: a key
  cannot list, create or remove keys.
- It has one of two scopes, fixed at creation. A `write` key (the default)
  may call every RPC its owner may call. A `read` key may call only RPCs
  whose name starts with `Get` or `List`, and `Pull`, `Snapshot` and
  `Subscribe`. Every other RPC returns Connect code `permission_denied`
  (HTTP 403) with the message `this API key is read-only`. A `read` key may
  fetch photos but not upload them, and it cannot use `/export`.
- It expires only if you set an expiry: `expires_in_days` from `0` (never,
  the default) to `3650`. Past `expires_at` every RPC returns
  `unauthenticated` (HTTP 401) with the message `API key expired`. Expired
  keys stay in the list until you remove them.
- It stops working the moment it is removed in Settings, and it dies with
  the membership: when the owner leaves or is removed from the workspace, the
  key is refused.
- Every use stamps `last_used_at`, shown as **Last used** in Settings.
- The demo account cannot create keys.

The same endpoints the app uses are open to a session-authenticated script:

- `GET /auth/api-keys` returns `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, your own keys in the
  active workspace only. `scope` is `"write"` or `"read"`; `expires_at` and
  `last_used_at` are RFC 3339 timestamps or `null`; `mine` is always
  `true` here.
- `GET /auth/api-keys?tenant=1` returns every key of the active workspace,
  each row additionally carrying `user_id`, `user_email` and a `mine`
  flag that is `true` on your own keys. Only the workspace owner (the role
  the app calls **Admin**) and the instance admin may call it; everyone
  else gets HTTP 403.
- `POST /auth/api-keys` with `{"name": "...", "scope": "write",
  "expires_in_days": 0}` returns `{id, name, prefix, scope, created_at,
  expires_at, token}`. `scope` defaults to `"write"` and `expires_in_days`
  to `0` (never) when omitted. Any other scope, or a lifetime below `0` or
  above `3650`, answers HTTP 400.
- `POST /auth/api-keys/delete` with `{"id": "..."}` answers `204`. A
  member can remove only their own keys; someone else's id answers 404.
  The workspace owner and the instance admin can remove any key of the
  active workspace. The override never reaches across workspaces: an owner of
  another workspace gets 404 for keys that are not theirs.

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
Failed sign-ins are throttled: after 10 failures for one account or 30 from
one address within 15 minutes the endpoint answers `429` (`rate_limited`)
with a `Retry-After` header.

The token carries the account's active workspace. `GET /auth/me` lists the
workspaces you belong to (`tenants`) and the active one (`active_org`);
`POST /auth/switch` with `{"org_id": "..."}` returns a new `token` for
another workspace.

`POST /auth/logout-all` ends every other session of the account and returns
a fresh `token` for the caller. The server also checks on every request that
the account is still a member of the workspace; a revoked session or a lost
membership is refused within about 10 seconds.

With `BEEHIVE_DEMO=true`, demo sessions are read-only: the demo account can
call only RPCs whose names start with `Get` or `List`, and `Pull`,
`Snapshot` and `Subscribe`.
Every other RPC returns `permission_denied`.

See [Authentication](../self-hosting/authentication.md) for how to configure the
login methods.

## Protocol pages

- [REST / HTTP + JSON](./rest.md): curl examples, the JSON shape
  and the pagination contract.
- [gRPC](./grpc.md): generated clients and the streaming
  `Subscribe` call.
- [Automated trackers](./automated-trackers.md): posting hive-scale
  and climate readings from a script or device.
