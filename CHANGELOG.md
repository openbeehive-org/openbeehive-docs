# Changelog

All notable changes to the Openbeehive documentation are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Documentation content is also versioned in-site via Docusaurus (see
`versions.json`).

## [0.3.0.1] - 2026-09-15

### Fixed

- The 0.3.0 snapshot carried a duplicated `current/` folder inside each
  translated version, which showed up as an extra category in the German,
  French, Spanish and Italian 0.3.0 docs. Removed.

## [0.3.0] - 2026-09-15

Documents app release 0.3.0 (integration API, API keys) and rebuilds every
page against the app: the API section describes the ten served services,
sharing is tenant membership, the self-hosting instructions match the
server and the compose files. Snapshot 0.3.0 in all five languages.

Corrections after an audit of the English docs against the app source.

### Removed

- **Developers → API:** folded into *Using the API* and the contributing
  page.

### Changed

- **Using the API:** rewritten against the served contract. The overview
  lists all ten services and their RPCs (`ApiaryService`, `HiveService`,
  `QueenService`, `InspectionService`, `TaskService`, `TreatmentService`,
  `HarvestService`, `EventService`, `StatsService`, `SyncService`) and
  explains that every
  write RPC goes through the same per-field merge and change log as the
  app's sync, so API writes reach devices on their next sync. Documents the
  session-token authentication (`Authorization: Bearer` or the
  `obh_session` cookie), the read-only demo allow-list, the non-RPC
  `/auth/*`, `/tenants/*`, `/files/` and `/healthz` endpoints.
- **Using the API:** `HarvestService` (`CreateHarvest`, `ListHarvests`,
  `DeleteHarvest`) in the services table, in the writes-go-through-sync
  flow (frozen apiary and queen, `HARVEST` event with `amountKg` that feeds
  `GetDashboard` / `GetHoneyStats`) and as a curl example on the REST page;
  `hiveId` / `queenId` on the `Harvest` message. The "not in the API yet"
  list now names what is still missing: a harvest update RPC and a
  placement RPC.
- **Using the API:** API keys are the documented credential for scripts.
  The authentication section covers creating a key under **Settings → API
  keys**, the `obhk_` token shown once with only its SHA-256 hash stored,
  the `Authorization: Bearer obhk_...` header, binding to the owner and the
  tenant active at creation, revocation and the membership check, the
  session-only `/auth/api-keys` management endpoints, and session sign-in as
  the fallback. Keys have a scope (`write`, the default, or `read`; a read
  key may call only `Get*`, `List*`, `Pull` and `Subscribe` and gets
  `permission_denied` elsewhere) and an optional expiry (`expires_in_days`
  from `0` to `3650`; an expired key gets `unauthenticated`); the
  management endpoints carry `scope`, `expires_in_days` and `expires_at`.
  Tenant admins manage members' keys: `GET /auth/api-keys?tenant=1` lists
  every key of the active tenant with `user_id`, `user_email` and a
  `mine` flag for the tenant owner and the instance admin (403 for
  others), and `POST /auth/api-keys/delete` lets them remove any key of
  that tenant while members can remove only their own; the Accounts &
  tenants page documents the **Keys of other members** list under
  **Settings → API keys** and the Roles table lists removing members'
  API keys under Admin.
  The automated-trackers bash and Python examples read a key from a file
  instead of signing in and recommend a write key for sensors and a
  read-only key for dashboards and exports; the gRPC page names
  `NewHarvestServiceClient` and accepts a key in the auth header.
- **Using the app → Accounts & tenants, Dashboard:** the **Settings → API
  keys** section with its labels (Create key, Copy, Created, Last used,
  Remove), the **Permissions** and **Expires after** selects and the
  **Read and write** / **Read-only** and **Expires** / **Expired** badges.
- **Developers → Data model:** the server-only `api_key` table with its
  `scope` and `expires_at` columns.
- **Using the API → REST:** curl examples for `CreateInspection`,
  `ListInspections` with `nextPageToken`, `CreateQueen`, `CreateTask` and
  `SetTaskDone`, `CreateTreatment`, `ListEvents` and `GetDashboard`; the
  pagination contract (`pageSize` default 50, max 500; `pageToken` as offset;
  `nextPageToken`); the photo rules (`data:image/` URL, 512 KiB); the error
  table per RPC.
- **Using the API → Automated trackers:** rewritten from the server's
  behaviour: a reading is an inspection row (`weightKg`, `tempHive`,
  `tempOutside`, `humidityHive`, `humidityOutside`), it counts as the hive's
  last visit for the due-inspections list, sign-in from a script with the
  session token and `BEEHIVE_SESSION_TTL`, posting cadence, hive lookup, and
  bash and Python examples.
- **Using the API → gRPC:** client constructors for every service and a Go
  `CreateInspection` example.
- **Developers → Sync protocol, Data model, Architecture, Contributing:**
  server-originated changes (author = the API caller, HLC from the server's
  clock, scope = apiary id or `user:<id>`); the claim that the CRUD services
  bypass the change log is gone.
- **Using the app → Inspections:** tip pointing sensor owners to the
  automated-trackers page.
- **Developers → Sync protocol:** message tables now match `sync.proto`
  (`Change`, string `cursor`, `Conflict`, `SubscribeEvent`) and the merge
  rules match `merge.go` / `merge.ts` (field clock, OR-Set `removed_tags`,
  dropped outbox batches on `permission_denied`).
- **Developers → Data model:** tables, columns and enums regenerated from the
  migrations.
- **Developers → History & events:** real table and column names
  (`queen.introduced_at` / `replaced_at`, `placement.start_at` / `end_at`)
  and the real `resolveContext` signature.
- **Developers → QR codes:** real routes (`/hives/[id]`, `/scan`); the App
  Links / Universal Links section replaced by a note that no native wrapper
  exists.
- **Developers → Contributing:** correct repository names, `cd
  openbeehive-app`, Node 24.
- Hard-coded `v0.1.0` references replaced with version-agnostic wording.

## [0.2.3.2] - 2026-09-12

Deployment only: the site is now published through the current central deploy
workflow. No content change.

## [0.2.3.1] - 2026-09-11

Site only, no content change: a version switch in the navbar (with an "All
versions" entry), the `/versions` overview page, and clearer banners on older
snapshots, all translated for the five languages. The newest release is the
default everywhere.

## [0.2.3] - 2026-09-11

Documents app release 0.2.3 (first-sync feedback, progressive pulls, reload
resilience) and brings the self-hosting reference back in line with the
server's actual configuration.

### Added

- **Self-hosting → Configuration:** the HTTP timeout variables
  (`BEEHIVE_HTTP_*`), `BEEHIVE_BLOB_PUBLIC_URL`, the dedicated instance
  administrator (`BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD`),
  `BEEHIVE_DEMO_AUTOLOGIN`, the per-provider `BEEHIVE_OIDC_<NAME>_*`
  variables, and the previously missing defaults for MinIO, WebAuthn and the
  OIDC redirect URL.
- **Self-hosting → Authentication:** how the administrator account is
  guaranteed on every start and why registration never grants the admin role.
- **Self-hosting → Demo:** the administrator requirement in demo mode and the
  "Showcase hosts" auto-login option.
- **Self-hosting → Storage:** serving stored files through a different public
  URL.
- **Using the app → Offline & sync:** "Your first sync on a new device"
  (skeletons, the syncing hint, progressive fills) and the volatile-storage
  warning.
- **Knowledge base → Troubleshooting:** entries for "Storage is unavailable"
  and for the syncing hint that will not go away.
- Versioned docs snapshot `0.2.3`, all five languages.

### Changed

- The first registered account is no longer described as the administrator;
  the admin comes from the environment.

## [0.2.2] - 2026-08-01

Documents app release 0.2.2 (offline-storage self-repair, sync resilience,
visible save/geocoding feedback). Docs versions now mirror the app release
they describe: this snapshot replaces the short-lived `0.2.0` docs tag,
which carried the same content under the wrong version number.

### Added

- **Using the app → Apiaries:** the map pin / address lookup and the four
  status states shown under the map (searching, location set, no match,
  search unavailable).
- **Using the app → Offline & sync:** new section "If something cannot be
  saved" — failed local writes are reported instead of failing silently, and
  demo-account changes stay on the device because the demo server is
  read-only.
- **Knowledge base → Troubleshooting:** entry for the
  `SQLITE_CANTOPEN: unable to open database file` error (storage-slot
  exhaustion) fixed by app 0.2.2's automatic pool repair.
- Versioned docs snapshot `0.2.2`, all five languages.

## [0.1.1] - 2026-07-19

### Added

- Link to the live demo at `demo.openbeehive.org` from the docs landing page
  (all five languages).

## [0.1.0] - 2026-07-17

First public release. 🐝

### Added

- Docusaurus site rebranded to the Openbeehive identity (honey/cream palette,
  hexagon logo, custom favicon and social card).
- Documentation structured into: **Using the app**, **Self-hosting**,
  **Beekeeping basics**, **Knowledge base**, and **Developers**.
- Multi-language documentation: English, German, French, Spanish, Italian
  (Docusaurus i18n, with a locale dropdown).
- Versioned docs snapshot `0.1.0`.

[0.3.0.1]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.3.0.1
[0.3.0]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.3.0
[0.2.3.2]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.2.3.2
[0.2.3.1]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.2.3.1
[0.2.3]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.2.3
[0.2.2]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.2.2
[0.1.1]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.1.1
[0.1.0]: https://github.com/openbeehive-org/openbeehive-docs/releases/tag/v0.1.0
