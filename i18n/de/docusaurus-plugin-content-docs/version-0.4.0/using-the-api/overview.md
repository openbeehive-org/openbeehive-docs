---
sidebar_position: 1
title: "API-Überblick"
---

# Die Openbeehive-API

Der Server stellt eine [Connect-RPC](https://connectrpc.com/)-API bereit, die
in Protocol Buffers unter
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
definiert ist. Jeder RPC ist über einfaches HTTP/JSON, gRPC und gRPC-Web unter
derselben URL erreichbar. Die App selbst nutzt nur den `SyncService`; die
anderen Dienste gibt es für Skripte, Sensoren und Integrationen.

## Basis-URL und Pfadform

Die API wird vom selben Prozess wie die App bereitgestellt, auf demselben
Origin:

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
```

Zum Beispiel `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`
beim gehosteten Dienst oder dein eigener Origin, wenn du selbst hostest.

## Bereitgestellte Dienste

Auf dem Server sind zehn Dienste registriert (`server/cmd/server/main.go`):

| Dienst | RPCs |
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
| `SyncService` | `Pull`, `Push`, `Subscribe` (Server-Stream) |

Jeder RPC ist auf den aktiven Mandanten des Aufrufers beschränkt. Ids aus
einem anderen Mandanten verhalten sich wie unbekannte Ids (`not_found`).

### Schreibvorgänge laufen über Sync \{#writes-go-through-sync}

Jeder schreibende RPC (`Create*`, `Update*`, `Delete*`, `RelocateHive`,
`SetTaskDone`, `AddInspectionPhoto`, `RemoveInspectionPhoto`) wird über
denselben feldweisen Merge angewendet und an dasselbe Änderungsprotokoll
angehängt wie `SyncService.Push`. Eine über die API geschriebene Zeile
erreicht jedes Gerät bei dessen nächstem Sync, und eine spätere Bearbeitung
von einem Gerät wird Feld für Feld mit ihr zusammengeführt, genau so wie
Bearbeitungen von zwei Geräten miteinander zusammengeführt werden. Löschungen
sind soft: Die Zeile bekommt einen Tombstone (`deleted = 1`) und verschwindet
aus Listen und aus der App.

Serverseitige Schreibvorgänge spiegeln die Abläufe der App
(`server/internal/service/writer.go` ist eine Portierung von
`app/src/lib/local/history.ts`), sodass die Historie, die ein Gerät zeigt,
dieselbe ist, egal ob ein Datensatz in der App oder über die API erfasst
wurde:

- `CreateHive` schreibt die Beute, eröffnet ein Placement-Intervall und
  zeichnet ein `CREATED`-Ereignis auf. Neue Beuten starten als
  `HIVE_STATUS_ACTIVE`.
- `RelocateHive` schließt das offene Placement, eröffnet ein neues am
  Zielstandort und zeichnet ein `MOVED`-Ereignis auf. `UpdateHive` wandert
  eine Beute nie.
- `CreateQueen` beendet die Regentschaft der aktiven Königin der Beute
  (`active = false`, `replacedAt` auf das `introducedAt` der neuen Königin
  gesetzt), zeichnet die Ereignisse `QUEEN_REPLACED` und `QUEEN_INTRODUCED`
  auf und leitet die Markierungsfarbe aus `year` ab, wenn du keine sendest.
- `CreateInspection` und `CreateTreatment` frieren den Standort und die
  regierende Königin zum `date` des Datensatzes ein (ein rückdatierter
  Datensatz wird gegen die Placement- und Königinnenhistorie aufgelöst) und
  zeichnen ein `INSPECTION`- oder `TREATMENT`-Ereignis auf.
- `CreateHarvest` friert den Standort und die regierende Königin zum `date`
  auf dieselbe Weise ein, schreibt die Erntezeile und zeichnet ein
  `HARVEST`-Ereignis auf, das `amountKg` und den Titel `<kg> kg <variety>`
  trägt (`Honey`, wenn `variety` leer ist). `GetDashboard` und
  `GetHoneyStats` summieren diese Ereignisse, eine über die API gebuchte
  Ernte zählt also sofort in den Honigzahlen. `amountKg` muss größer als `0`
  sein.
- Eine Aufgabe mit `hiveId` oder `apiaryId` synchronisiert unter diesem
  Standort und wird mit allen geteilt, die ihn sehen; eine Aufgabe ohne beides
  lebt im persönlichen Scope des Aufrufers und erreicht nur die Geräte dieses
  Benutzers.

Lesezugriffe (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
fragen die Server-Tabellen direkt ab und zeigen API-Schreibvorgänge sofort,
Geräte-Schreibvorgänge sobald das Gerät sie gepusht hat.

### Noch nicht in der API

- **Kein RPC zum Bearbeiten von Ernten.** `HarvestService` hat nur
  `CreateHarvest`, `ListHarvests` und `DeleteHarvest`. Um eine Ernte zu
  korrigieren, lösche sie und lege sie neu an, oder bearbeite sie in der App.
- **Kein Placement-RPC.** Placements werden von `CreateHive` und
  `RelocateHive` geschrieben und tauchen nur im Sync-Feed auf.
- `EventService` ist schreibgeschützt. Ereignisse werden von den Abläufen
  oben und von der App geschrieben.

Das Format der Änderungen beschreibt das
[Sync-Protokoll](/developers/sync-protocol), die Spalten hinter jeder
Nachricht das [Datenmodell](/developers/data-model).

## Endpunkte außerhalb von RPC

Neben den RPC-Diensten gibt es ein paar einfache HTTP-Endpunkte:

| Pfad | Zweck |
| --- | --- |
| `GET /healthz` | Liefert `ok` |
| `GET /files/<key>` | Gespeicherte Dateien, nur mit dem Dateisystem-Blob-Backend (`BEEHIVE_BLOB_BACKEND=fs`) |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | E-Mail/Passwort-Konten (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` gesetzt) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `/auth/logout`, `/auth/me`, `/auth/instance`, `/auth/switch`, `/auth/accept-invite` | Sitzungs- und Mandanten-Helfer, vorhanden sobald irgendeine Anmeldemethode aktiviert ist |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Verwaltung der API-Schlüssel (auflisten, erstellen, entfernen), vorhanden sobald irgendeine Anmeldemethode aktiviert ist; nur per Sitzung, ein Schlüssel kann sie nicht aufrufen |
| `/tenants/create`, `/tenants/invite`, `/tenants/invites`, `/tenants/invite/revoke`, `/tenants/delete` | Mandantenverwaltung, vorhanden sobald irgendeine Anmeldemethode aktiviert ist |
| `POST /auth/demo-login` | Nur mit `BEEHIVE_DEMO=true` |

Diese Endpunkte nutzen die Anmelde- und Einstellungsseiten der App; sie sind
nicht Teil des Proto-Vertrags.

## Authentifizierung \{#authentication}

Wie eine Anfrage authentifiziert wird, hängt davon ab, ob die Instanz eine
Anmeldemethode hat:

- **Kein Login konfiguriert** (selbst gehostet, `BEEHIVE_PASSWORD_AUTH=false`,
  `BEEHIVE_OIDC_PROVIDERS` leer, `BEEHIVE_WEBAUTHN_ENABLED=false`): Jede
  Anfrage läuft als der feste lokale Benutzer. Sende keine Anmeldedaten. Auf
  einer solchen Instanz gibt es keine API-Schlüssel; es braucht auch keine.
- **Login konfiguriert**: Jeder RPC braucht einen API-Schlüssel oder ein
  Sitzungstoken in `Authorization: Bearer <token>` (für Sitzungstokens wird
  auch das Cookie `obh_session` akzeptiert). Eine Anfrage ohne gültiges Token
  bekommt den Connect-Code `unauthenticated` (HTTP 401).

### API-Schlüssel

Ein API-Schlüssel ist die empfohlene Anmeldung für Skripte, Sensoren und
Integrationen. Schlüssel verwaltest du in der App unter
**Einstellungen → API-Schlüssel** (siehe
[Konten & Mandanten](../using-the-app/accounts-tenants.md#api-keys)):

1. Melde dich an, wechsle in den Mandanten, in den das Skript schreiben soll,
   und öffne **Einstellungen → API-Schlüssel**.
2. Gib einen Namen ein (zum Beispiel `hive scale`), wähle die
   Berechtigungen (**Lesen und Schreiben** oder **Nur Lesen**) und ein
   Ablaufdatum (**Läuft nie ab**, **30 Tagen**, **90 Tagen** oder
   **1 Jahr**) und tippe auf **Schlüssel erstellen**. Der Schlüssel beginnt
   mit `obhk_` und wird nur einmal angezeigt; kopiere ihn jetzt. Der Server
   speichert nur seinen SHA-256-Hash und die ersten 12 Zeichen für die
   Anzeige.
3. Sende ihn bei jedem RPC:

```text
Authorization: Bearer obhk_...
```

Was ein Schlüssel kann und was nicht:

- Er handelt als sein Besitzer, mit dessen Rolle, innerhalb des Mandanten,
  der beim Erstellen des Schlüssels aktiv war. Er kann den Mandanten nicht
  wechseln; lege pro Mandant einen Schlüssel an, wenn ein Skript mehrere
  braucht.
- Er funktioniert nur bei RPCs. Die Endpunkte unter `/auth/*` und
  `/tenants/*`, einschließlich der Schlüsselverwaltung selbst, brauchen eine
  echte Sitzung: Ein Schlüssel kann keine Schlüssel auflisten, erstellen
  oder entfernen.
- Er hat einen von zwei Scopes, beim Erstellen festgelegt. Ein
  `write`-Schlüssel (die Vorgabe) darf jeden RPC aufrufen, den sein Besitzer
  aufrufen darf. Ein `read`-Schlüssel darf nur RPCs aufrufen, deren Name mit
  `Get`, `List`, `Pull` oder `Subscribe` beginnt; jeder andere RPC liefert
  den Connect-Code `permission_denied` (HTTP 403) mit der Meldung
  `this API key is read-only`.
- Er läuft nur ab, wenn du ein Ablaufdatum setzt: `expires_in_days` von `0`
  (nie, die Vorgabe) bis `3650`. Nach `expires_at` liefert jeder RPC
  `unauthenticated` (HTTP 401) mit der Meldung `API key expired`.
  Abgelaufene Schlüssel bleiben in der Liste, bis du sie entfernst.
- Er funktioniert in dem Moment nicht mehr, in dem er in den Einstellungen
  entfernt wird, und er stirbt mit der Mitgliedschaft: Wenn der Besitzer den
  Mandanten verlässt oder daraus entfernt wird, wird der Schlüssel
  abgelehnt.
- Jede Verwendung setzt `last_used_at`, in den Einstellungen als
  **Zuletzt verwendet** angezeigt.
- Das Demo-Konto kann keine Schlüssel erstellen.

Dieselben Endpunkte, die die App nutzt, stehen einem per Sitzung
authentifizierten Skript offen:

- `GET /auth/api-keys` liefert `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, nur deine eigenen
  Schlüssel im aktiven Mandanten. `scope` ist `"write"` oder `"read"`;
  `expires_at` und `last_used_at` sind RFC-3339-Zeitstempel oder `null`;
  `mine` ist hier immer `true`.
- `GET /auth/api-keys?tenant=1` liefert jeden Schlüssel des aktiven
  Mandanten, jede Zeile zusätzlich mit `user_id`, `user_email` und einem
  Flag `mine`, das bei deinen eigenen Schlüsseln `true` ist. Nur der
  Eigentümer des Mandanten (die Rolle, die die App **Admin** nennt) und der
  Instanz-Administrator dürfen ihn aufrufen; alle anderen bekommen HTTP 403.
- `POST /auth/api-keys` mit `{"name": "...", "scope": "write",
  "expires_in_days": 0}` liefert `{id, name, prefix, scope, created_at,
  expires_at, token}`. Lässt du sie weg, fällt `scope` auf `"write"` und
  `expires_in_days` auf `0` (nie) zurück. Jeder andere Scope oder eine
  Laufzeit unter `0` oder über `3650` antwortet mit HTTP 400.
- `POST /auth/api-keys/delete` mit `{"id": "..."}` antwortet mit `204`. Ein
  Mitglied kann nur seine eigenen Schlüssel entfernen; die Id von jemand
  anderem antwortet mit 404. Der Eigentümer des Mandanten und der
  Instanz-Administrator können jeden Schlüssel des aktiven Mandanten
  entfernen. Diese Ausnahme reicht nie über Mandanten hinweg: Der Eigentümer
  eines anderen Mandanten bekommt für fremde Schlüssel 404.

### Anmeldung per Sitzung

Die Alternative ist das Sitzungstoken der App, ein HMAC-signierter Wert, den
der Server beim Anmelden ausstellt. Es wird bei RPCs und bei den Endpunkten
unter `/auth/*` und `/tenants/*` akzeptiert. Mit aktivierter
Passwort-Anmeldung holt sich ein Skript eines so:

```bash
curl -s -X POST https://bees.example.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

Die JSON-Antwort enthält `token`; derselbe Wert wird auch als Cookie
`obh_session` gesetzt. Das Token läuft nach `BEEHIVE_SESSION_TTL` ab.

Das Token trägt den aktiven Mandanten des Kontos. `GET /auth/me` listet die
Mandanten, zu denen du gehörst (`tenants`), und den aktiven (`active_org`);
`POST /auth/switch` mit `{"org_id": "..."}` liefert ein neues `token` für
einen anderen Mandanten.

Mit `BEEHIVE_DEMO=true` sind Demo-Sitzungen schreibgeschützt: Das Demo-Konto
kann nur RPCs aufrufen, deren Namen mit `Get`, `List`, `Pull` oder `Subscribe`
beginnen. Jeder andere RPC liefert `permission_denied`.

Wie du die Anmeldemethoden konfigurierst, steht unter
[Authentifizierung](/self-hosting/authentication).

## Protokollseiten

- [REST / HTTP + JSON](/using-the-api/rest): curl-Beispiele, die JSON-Form
  und der Paginierungsvertrag.
- [gRPC](/using-the-api/grpc): generierte Clients und der streamende
  `Subscribe`-Aufruf.
- [Automatische Tracker](/using-the-api/automated-trackers): Stockwaagen- und
  Klimawerte aus einem Skript oder Gerät senden.
