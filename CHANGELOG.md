# Changelog

All notable changes to the Openbeehive documentation are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Documentation content is also versioned in-site via Docusaurus (see
`versions.json`).

## [Unreleased]

Documents the upcoming app release 0.5.0 in all five languages. Every page
of the app, API, self-hosting and developer sections was checked against the
app's code, including photo storage, account management, units, change-log
snapshots and the export/import changes.

### Added

- **Self-hosting -> Upgrading:** "Upgrading to 0.5.0", one or two sentences
  per breaking change: session secret, `.env` loading, same-origin CORS, the
  host check without login, mail for verification, OIDC, the Compose files,
  the move of single-user records, migrations, invites, throttling, limits,
  device clocks and the API.
- **Self-hosting -> Configuration:** `BEEHIVE_ALLOWED_HOSTS`,
  `BEEHIVE_TRUST_PROXY_HEADERS`, the map settings (`BEEHIVE_MAPS`,
  `BEEHIVE_MAP_TILE_URL`, `BEEHIVE_GEOCODER_URL`) with what is sent to the
  map services, and the 16 MiB message limit.
- **Self-hosting -> Authentication:** sign-in throttling, ending sessions
  (`POST /auth/logout-all`), how provider logins map to accounts, and what
  happens to single-user records when login is switched on.
- **Using the app:** the sync status chip and sync problems, device clocks,
  one tab at a time, the update prompt, the first-run checklist, the hives
  list with search and filters, "Start from last visit", empty versus zero,
  sensor readings, correcting and deleting visits, harvests, treatments and
  queens, the treatment register, typing a label code, Settings ->
  Appearance.
- **Using the API:** the update RPCs for inspections, tasks, treatments and
  harvests, partial updates with `updateMask`, `InspectionSource` and the
  `source` filter, optional inspection numbers, the rules and error codes of
  the plain-HTTP endpoints.
- **Developers -> Sync protocol:** per-change push results (`rejected` and
  its codes), `server_time_ms`, the stamp format and the 10-minute limit,
  payload normalisation, the `removed_tags` rule, limits of Push and
  Subscribe.
- The colour switch is labelled in German, French, Spanish and Italian.
- **Self-hosting -> Upgrading:** photos moving to blob storage, restoring a
  backup, change-log retention, `BEEHIVE_SYNC_MIN_PROTOCOL`, the ignored
  `BEEHIVE_BLOB_PUBLIC_URL`, accounts whose addresses differ only in case,
  `/photos/` replacing `/files/`, the redirecting browser links and the
  protocol header for scripts.
- **Self-hosting -> Configuration:** `BEEHIVE_CHANGELOG_RETENTION_DAYS` and
  `BEEHIVE_SYNC_MIN_PROTOCOL`; mail now also carries password resets.
- **Self-hosting -> Storage:** what a photo is (synced record with thumbnail,
  image in blob storage under a workspace prefix), the server's upkeep of
  blobs and the conversion of 0.4.x inline photos.
- **Self-hosting -> Authentication:** changing and resetting passwords with
  and without mail, account deletion, email addresses that differ only in
  case, browser links that redirect to the sign-in page.
- **Using the app:** password change and reset, signing out with unsent
  changes and removing data from a device, log out everywhere, members and
  roles, leaving a workspace, deleting an account, Settings -> Units and the
  language saved with the account, photos with preview, background upload
  and viewer, re-sync after a server restore, the "App out of date" chip,
  the server copy, the import preview with its options and undo; new FAQ
  entries on units, a forgotten password and account deletion.
- **Using the API:** `Inspection.photos`, `Hive.picture`, `/photos/<id>`,
  `GET /export`, the account, password and member endpoints, the current
  error codes of the plain-HTTP endpoints.
- **Developers:** protocol versions and headers, cursors with epoch and
  start marks, `Snapshot`, the pull status, compaction, account settings,
  photos in sync; the `photo` and `user_settings` tables and the new
  server-only tables.

### Changed

- **Self-hosting -> Quick start / Docker / Single binary:** rewritten around
  the published image with a volume, `docker-compose.selfhost.yml` and
  `docker-compose.prod.yml`, "no login out of the box" and how to turn login
  on. The binary reads `.env` itself; the boot log states the login mode.
- **Self-hosting -> Reverse proxy:** `BEEHIVE_TRUST_PROXY_HEADERS`, the
  headers and Content-Security-Policy the server sends, timeouts and body
  size.
- **Self-hosting -> Databases:** MariaDB is the tested target of the `mysql`
  driver, next to SQLite and PostgreSQL; requirements for the MariaDB user
  and database.
- **Wording:** "workspace" replaces "tenant" in prose in every language
  (German "Arbeitsbereich", French "espace", Spanish "espacio", Italian
  "spazio"); `tenant` stays where it is an API path, a field or an
  identifier.
- **Using the app -> Tasks:** tasks created in the app are personal, not
  shared with the workspace.
- **Self-hosting -> Backups:** a restore is stop, restore database and blobs
  together, start; what updated and 0.4.x apps do afterwards; back up the
  database before the blobs; app exports are not instance backups.
- **Using the API -> Automated trackers:** readings are posted with
  `source` set to sensor and no longer count as inspections.
- **Developers:** sharing is the workspace on the architecture, data model
  and sync protocol pages; the cursor only advances through Pull; events
  follow corrections and deletes of their record; the in-app scanner works
  in every browser.
- **Colours:** the dark theme uses the palette of the app and the website;
  the light theme uses a darker honey for text and links. Text reaches a
  contrast of 4.5:1 and the borders of controls 3:1 in both themes, code
  blocks included (own code themes replace "github" and "dracula"). The
  site follows the system colour scheme until a reader picks System, Light
  or Dark with the switch in the navbar.

- **Settings paths** follow the four groups of the app (Preferences,
  Workspace, Data & sync, Account) on every page; the dashboard page lists
  the groups and the short bottom-bar labels.
- **Using the app:** the sync status sheet, received changes that "could not
  be applied", per-account local data on shared devices, the invite page with
  its failure messages, renewed invites, the read-only demo with disabled
  Save, the workspace-wide treatment register with its Reason column, units
  that follow the app language, and the 10-day due interval.
- **Self-hosting:** blob upkeep keeps unknown images for at least 30 days and
  removes nothing at start; the SQLite database must not lie inside
  `BEEHIVE_BLOB_DIR`; the server listens only after the photo conversion;
  PostgreSQL and MariaDB migrations run in place and resume; the demo
  account is locked when the demo is off; the `X-Forwarded-For` warning and
  CDNs; repairing stored stamps from the future.
- **API and developers:** `GET /auth/invite`, `already_member` and renewed
  invites, camelCase mask paths, future inspection dates refused, the JSON
  415 for a missing `Content-Type`, `thresholdDays` defaulting to 10, the
  personal-scope and `photo_keys` rules, a 0.4.x Push refused as a whole for
  a fast clock, unchanged changes not logged, `inbox_failed`.

### Removed

- The demo Compose file as a production template, `demo.openbeehive.org`,
  per-apiary sharing and the `apiary_share` table, "Honey harvested" on the
  visit form, the statement that harvests cannot be edited through the API,
  `/files/` and `BEEHIVE_BLOB_PUBLIC_URL`.

### Fixed

- Links between pages of the unreleased docs opened the newest release
  instead of staying in the version being read; they are file links now.
- The import was described as restoring records by id; it only adds unless
  told to overwrite. The demo was described as keeping refused changes on
  the device; the app undoes them. A device updating to 0.5.0 loads the
  current data, not the whole history. The plain-HTTP error table named
  `account_exists` for sign-up, which is `email_taken`.
- Upgrading said that 0.4.x apps with a fast clock lose such changes; they
  keep them and stop uploading until the clock is fixed or the app updates.
  The demo was described as resetting hourly in its banner; it says it is
  read-only.
- The dashboard no longer says the due badge is highlighted from 21 days;
  every due hive is highlighted from 10. Also described: `thresholdDays` in
  calendar days, the JSON 415 for a wrong `Content-Type`, `/auth/me` without
  login, the Hives tab opening the full list, and refused 0.4.x photo
  uploads leaving no blobs.
- Small mistranslations on the German, French, Spanish and Italian "Diseases
  & pests" pages; missing accents on four Spanish self-hosting pages.
- Titled notes and warnings (such as "Back up first") showed as raw
  `:::caution` text, in every version; the build now fails on such a page.
- Links in running text are underlined, not set apart by colour alone.
- **Self-hosting:** the session secret example in Configuration was long
  enough to be accepted if copied; the demo page described changes as kept
  in the browser and the hosted demo as signing in automatically; the
  reverse proxy page missed the long-running `GET /export`; Quick start now
  says how `docker run` users publish the port once login is on.

## [0.4.0] - 2026-10-19

Documents app release 0.4.0 (unprivileged container, signed images, Go 1.27
and SvelteKit 3 toolchain). Snapshot 0.4.0 in all five languages.

### Added

- **Self-hosting -> Docker:** "Verifying a release image" with the `cosign
  verify` and `gh attestation verify` commands that match the release
  workflow, and a note that images before 0.4.0 are unsigned.
- **Self-hosting -> Upgrading:** "Release-specific steps" with the one-time
  `chown` to uid 65532 for volumes and bind mounts created by 0.3.x or
  earlier, the symptom of skipping it and the Kubernetes `fsGroup` hint.

### Changed

- **Self-hosting -> Docker / Storage:** the container runs as uid 65532 with
  `/data` as its working directory; named volumes inherit the ownership, bind
  mounts must be chowned. The old "the image has no working directory"
  explanation is gone.
- **Self-hosting -> Quick start / Upgrading, Developers -> Contributing:**
  prerequisites are Go 1.27+ and Node 24+ (the image builds with Node 26);
  the dev setup lists `make tools`, `prek install` and `make check` as the
  definition of green.

### Fixed

- The German, French, Spanish and Italian version dropdowns labelled the
  0.3.0 docs "Next"; the label is now the version number.

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
