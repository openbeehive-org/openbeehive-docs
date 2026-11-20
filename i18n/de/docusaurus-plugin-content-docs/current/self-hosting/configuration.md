---
sidebar_position: 4
title: "Konfiguration"
---

# Konfiguration

Openbeehive wird vollständig über Umgebungsvariablen konfiguriert. Diese Seite ist die vollständige Referenz.

Du kannst diese Variablen in deiner Shell, in deiner `docker compose`-Datei, über den Secrets-Manager deiner Hosting-Plattform oder in einer `.env`-Datei setzen. Der Server liest `.env` beim Start aus seinem Arbeitsverzeichnis; Variablen, die bereits in der Umgebung gesetzt sind, haben Vorrang vor der Datei. Alles wird einmal gelesen, daher werden Änderungen erst nach einem Neustart wirksam.

:::tip[Klein anfangen]
Du brauchst nur eine Handvoll davon, um loszulegen. Ein Heimserver mit einem Benutzer läuft allein mit den Standardwerten. Sobald du eine Anmeldemethode einschaltest, ergänze `BEEHIVE_SESSION_SECRET` und, für die E-Mail-/Passwort-Anmeldung, das Admin-Konto. Siehe den [Schnellstart](./quick-start.md), um in wenigen Minuten loszulegen.
:::

## Wie das Deployment-Profil funktioniert

Die mit Abstand wichtigste Einstellung ist `BEEHIVE_DEPLOYMENT_PROFILE`. Sie wählt sinnvolle Standardwerte für alles andere, sodass du keinen vollständigen Stack von Hand ausbuchstabieren musst.

| Profil     | Datenbank-Standard | Blob-Speicher-Standard | Vorgesehen für                          |
| ---------- | ------------------ | ---------------------- | --------------------------------------- |
| `selfhost` | SQLite (Datei)     | Lokales Dateisystem    | Eine einzelne Binärdatei, kein Docker, ein Host |
| `cloud`    | PostgreSQL         | MinIO / S3             | Eine Instanz mit mehreren Benutzern     |

Das Profil setzt nur *Standardwerte*. Jede Variable, die du explizit setzt, gewinnt immer. Du kannst zum Beispiel das `selfhost`-Profil verwenden, es aber auf PostgreSQL zeigen lassen, indem du `BEEHIVE_DATABASE_DRIVER` und `BEEHIVE_DATABASE_DSN` selbst setzt.

:::note
Die beiden Profile werden ausführlich auf ihren eigenen Seiten dokumentiert: [Einzelne Binärdatei](./single-binary.md) und [Docker](./docker.md). Diese Seite konzentriert sich auf die Variablen selbst.
:::

## Deployment-Profil

| Variable             | Standard   | Beschreibung                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `selfhost` | Wählt den voreingestellten Stack: `selfhost` oder `cloud`. Setzt Standardwerte für Datenbank und Blob-Speicher. |

## HTTP-Server

| Variable          | Standard                 | Beschreibung                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_ADDR`            | `:8080`                  | Adresse und Port, auf dem der Server lauscht. Verwende `127.0.0.1:8080`, um hinter einem Reverse Proxy nur an localhost zu binden. |
| `BEEHIVE_PUBLIC_BASE_URL` | `http://localhost:8080`  | Die öffentliche URL, unter der Benutzer die App erreichen. Wird für OIDC-Weiterleitungen, Einladungs- und Bestätigungslinks sowie Passkey-Standardwerte verwendet. Setze dies in der Produktion auf deine echte Domain. |
| `BEEHIVE_HTTP_READ_HEADER_TIMEOUT` | `10s` | Zeit zum Lesen der Header einer Anfrage. |
| `BEEHIVE_HTTP_READ_TIMEOUT` | `2m` | Zeit zum Lesen einer Anfrage; `0` bedeutet kein Limit. Der Live-Sync-Stream ist ausgenommen. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `2m` | Zeit zum Schreiben einer Antwort; `0` bedeutet kein Limit. Der Live-Sync-Stream ist ausgenommen. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Wie lange eine ungenutzte Keep-Alive-Verbindung offen bleibt. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Gnadenfrist für laufende Anfragen beim Herunterfahren. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `false` | Die Client-Adresse für die Drosselung der Anmeldung dem letzten `X-Forwarded-For`-Eintrag entnehmen. Setze dies nur dann auf `true`, wenn genau ein Reverse Proxy unter deiner Kontrolle davorsteht und der Server-Port auf keinem anderen Weg erreichbar ist. |
| `BEEHIVE_ALLOWED_HOSTS` | (leer) | Nur ohne Anmeldung: weitere Hostnamen, auf die der Server antwortet, kommagetrennt. `*` schaltet die Prüfung ab. Siehe unten. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` muss mit der Adresse übereinstimmen, die Benutzer tatsächlich aufrufen. Ist sie falsch, zeigen Login-Weiterleitungen und Einladungslinks an den falschen Ort.
:::

Eine RPC-Nachricht darf höchstens 16 MiB groß sein; größere Uploads teilt die App von sich aus auf. Dieses Limit ist nicht konfigurierbar.

### Hostnamen ohne Anmeldung \{#allowed-hosts}

Ein Server ohne Anmeldemethode behandelt jede Anfrage als die des einen lokalen Benutzers. Damit eine Webseite, die du lediglich besuchst, ihn nicht unter einem eigenen Namen erreichen kann, antwortet ein solcher Server nur, wenn der `Host` der Anfrage `localhost`, eine IP-Adresse, der Host aus `BEEHIVE_PUBLIC_BASE_URL` oder ein in `BEEHIVE_ALLOWED_HOSTS` aufgeführter Name ist. Andere Namen erhalten eine `403`-Antwort, die die Einstellung nennt. Mit aktivierter Anmeldemethode ist die Prüfung abgeschaltet.

## Eingebettete Web-App

Der Server kann die SvelteKit-PWA selbst ausliefern, sodass eine einzelne Binärdatei sowohl die API als auch das Frontend bereitstellt.

| Variable     | Standard | Beschreibung                                                                                  |
| ------------ | -------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SERVE_WEB`  | `true`   | Wenn `true`, liefert der Server die gebündelte Web-App aus. Setze `false`, wenn du das Frontend separat hostest. |
| `BEEHIVE_WEB_DIR`    | (leer)   | Pfad zu den gebauten Web-Assets. Leer lassen, um die in der Binärdatei eingebetteten Assets zu verwenden. |

## CORS

Cross-Origin-Einstellungen sind wichtig, wenn die Web-App von einem anderen Origin als die API ausgeliefert wird.

| Variable                 | Standard | Beschreibung                                                                 |
| ------------------------ | -------- | --------------------------------------------------------------------------- |
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | (leer)   | Kommagetrennte Liste anderer Origins, die die API aus einem Browser aufrufen dürfen, z. B. `https://app.example.com`. Leer bedeutet nur Same-Origin. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`   | Ob die aufgeführten Origins Anmeldedaten (Cookies, Auth-Header) senden dürfen. |

:::caution
Lass dies leer, wenn der Server die Web-App selbst ausliefert (der Standard). `*` erlaubt jeden Origin, aber nie mit Anmeldedaten: Der Server schaltet Anmeldedaten dann ab, sodass eine angemeldete Browser-App auf einem anderen Origin nicht mehr funktioniert. Führe die Origins stattdessen ausdrücklich auf. Mit `make dev-app` setze `http://localhost:5173`.
:::

## Karten \{#maps}

Kartenkacheln und die Adresssuche sind die einzigen externen Dienste, die die App kontaktiert. Beide sind konfigurierbar und lassen sich für die gesamte Instanz abschalten.

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `BEEHIVE_MAPS` | `on` | `off` entfernt die Karte und die Adresssuche aus der App. |
| `BEEHIVE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Vorlage für die Kachel-URL (Leaflet-Syntax). `{s}` darf nur im ersten Label des Hostnamens vorkommen. |
| `BEEHIVE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | Basis-URL einer Nominatim-kompatiblen Adresssuche. |

Mit den Standardwerten fordert ein Browser, der eine Karte öffnet, Kacheln von OpenStreetMap an, und wer bei einem Bienenstand eine Adresse eingibt oder den Pin verschiebt, sendet diese Adresse oder Position an Nominatim. Beide sehen die IP-Adresse des Geräts. Der Server nimmt die beiden Origins in seine Content-Security-Policy auf, sodass die App sie erreichen kann und sonst nichts.

## Synchronisierung

| Variable  | Standard | Beschreibung                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | bei jedem Start zufällig | Uhr-ID, mit der Änderungen gestempelt werden, die der Server selbst schreibt (API-Aufrufe). Normalerweise gibt es keinen Grund, sie zu setzen. |
| `BEEHIVE_CHANGELOG_RETENTION_DAYS` | `180` | Tage, die das Änderungsprotokoll aufbewahrt wird. Einmal am Tag werden ältere Einträge entfernt; ein Gerät, das länger weg war, lädt den aktuellen Stand statt der verpassten Änderungen. `0` behält das Protokoll für immer. |
| `BEEHIVE_SYNC_MIN_PROTOCOL` | `0` | Niedrigste Sync-Protokollversion, die der Server von Apps annimmt. `0` nimmt auch installierte 0.4.x-Apps an; `1` lehnt sie ab, und sie können erst synchronisieren, wenn sie aktualisiert sind. |

Betreibe genau eine Server-Instanz pro Datenbank. Mehrere Replikate gegen eine Datenbank zu betreiben, wird nicht unterstützt: Das tägliche Verdichten des Änderungsprotokolls und die Foto-Pflege laufen im Serverprozess.

Einträge, die beim Upgrade auf 0.5.0 schon vorhanden sind, gelten als am Tag des Upgrades empfangen; mit der Standard-Aufbewahrung werden die ersten Einträge also frühestens 180 Tage nach dem Upgrade entfernt. Eine 0.4.x-App, deren letzte Synchronisierung älter ist als das, was das Protokoll noch enthält, kann erst synchronisieren, wenn sie aktualisiert ist.

## Datenbank

| Variable          | Standard           | Beschreibung                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | aus Profil         | Datenbank-Engine: `postgres`, `mysql` (MariaDB) oder `sqlite`.              |
| `BEEHIVE_DATABASE_DSN`    | aus Profil         | Verbindungszeichenfolge für den gewählten Treiber (siehe unten).            |

Beispiel-DSNs nach Treiber:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MariaDB (driver name: mysql)
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Für Treiberauswahl, Tuning und Migrationshinweise siehe [Datenbanken](./databases.md).

## Blob-Speicher

Die Bilder von Fotos in voller Größe werden als Blobs gespeichert, entweder auf dem lokalen Dateisystem oder in einem S3-kompatiblen Objektspeicher. Ein Backup besteht aus der Datenbank plus diesem Verzeichnis oder Bucket.

| Variable          | Standard       | Beschreibung                                                            |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | aus Profil     | Speicher-Backend: `fs` (lokales Dateisystem) oder `minio` (MinIO / S3). |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Verzeichnis für Blobs, wenn `BEEHIVE_BLOB_BACKEND=fs`.                          |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host und Port des MinIO- / S3-Endpunkts.                               |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Zugriffsschlüssel für den Objektspeicher.                              |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Geheimer Schlüssel für den Objektspeicher.                             |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Bucket-Name, in dem Blobs gespeichert werden.                          |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Setze `true`, um über HTTPS mit dem Endpunkt zu verbinden.             |

Die `MINIO_*`-Variablen werden nur verwendet, wenn `BEEHIVE_BLOB_BACKEND=minio`. `BEEHIVE_BLOB_PUBLIC_URL` wird nicht mehr verwendet: Bilder werden nur angemeldeten Mitgliedern unter `/photos/` ausgeliefert, und der Server warnt beim Start, wenn die Einstellung gesetzt ist. Für vollständige Hinweise siehe [Speicher](./storage.md).

## Sitzung und Authentifizierung

| Variable         | Standard | Beschreibung                                                                                  |
| ---------------- | -------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (leer)   | Geheimnis, das die Sitzungs-Tokens signiert, mindestens 32 Bytes. Erzeuge eines mit `openssl rand -base64 32`. **Erforderlich, sobald eine Anmeldemethode aktiviert ist**: Ohne es startet der Server nicht. |
| `BEEHIVE_SESSION_TTL`    | `720h`   | Wie lange eine Sitzung dauert, bevor eine erneute Authentifizierung erforderlich ist (z. B. sind `720h` 30 Tage). |

:::danger
Halte `BEEHIVE_SESSION_SECRET` geheim und stabil. Wer es kennt, kann Sitzungen fälschen; wird es geändert, werden alle abgemeldet.
:::

## E-Mail, Passwort & Onboarding

Eingebaute Konten für Mehrbenutzer-Instanzen ohne externen Identitätsanbieter.
Der Instanz-Admin ist ein eigenes Konto, das du konfigurierst – nicht die erste Person,
die sich registriert. Siehe [Authentifizierung](./authentication.md).

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | an für `cloud`, aus für `selfhost` | E-Mail-/Passwort-Registrierung und -Anmeldung aktivieren. Wird auch durch `BEEHIVE_DEMO=true` impliziert. |
| `BEEHIVE_ADMIN_EMAIL` | (leer) | E-Mail des Instanz-Admins. **Erforderlich, sobald die Passwort-Anmeldung aktiv ist.** Das Konto wird bei jedem Start sichergestellt: angelegt, falls es fehlt, und seine Rolle auf Admin gesetzt. Eine Registrierung vergibt nie die Admin-Rolle. |
| `BEEHIVE_ADMIN_PASSWORD` | (leer) | Passwort des Instanz-Admins, mindestens 8 Zeichen. Bei jedem Start maßgeblich: Das gespeicherte Passwort wird auf diesen Wert zurückgesetzt – das dient zugleich als Passwort-Wiederherstellung. |
| `BEEHIVE_REGISTRATION` | `true` | Offene Selbstregistrierung. Auf `false` setzen für eine Instanz nur auf Einladung: Abgesehen vom konfigurierten Admin können Konten nur über Einladungslinks erstellt werden, und der Anmeldebildschirm zeigt einen entsprechenden Hinweis. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | E-Mail-Bestätigung verlangen, bevor sich ein neues Konto anmelden kann. Braucht `BEEHIVE_SMTP_HOST`; mit aktivierter Bestätigung und ohne Mailserver startet der Server nicht. |
| `BEEHIVE_SMTP_HOST` | (leer) | SMTP-Server für Bestätigungs-, Einladungs- und Passwort-Reset-E-Mails. Wenn leer, wird keine E-Mail versendet: Der Admin kopiert Einladungslinks aus den Einstellungen, und nur der Instanz-Admin kann dort Links zum Zurücksetzen von Passwörtern erstellen. Links werden nie ins Log geschrieben. |
| `BEEHIVE_SMTP_PORT` | `587` | SMTP-Port. |
| `BEEHIVE_SMTP_USER` | (leer) | SMTP-Benutzername. |
| `BEEHIVE_SMTP_PASS` | (leer) | SMTP-Passwort. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Absenderadresse für ausgehende E-Mails. |

## Demo-Arbeitsbereich

Installiert ein Demo-Schaukonto und einen Demo-Arbeitsbereich. Standardmäßig deaktiviert — siehe
[Demo-Modus](./demo.md).

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Ein Demo-Konto und einen Demo-Arbeitsbereich installieren (15 Bienenvölker auf 4 Bienenständen, stündlich zurückgesetzt). Impliziert `BEEHIVE_PASSWORD_AUTH=true`. |
| `BEEHIVE_DEMO_AUTOLOGIN` | `false` | Anonyme Besucher direkt in die Demo anmelden, statt den Anmeldebildschirm zu zeigen. Nur für reine Schaufenster-Hosts; auf einer Instanz mit echten Nutzern aus lassen. |
| `BEEHIVE_DEMO_EMAIL` | `demo@app.openbeehive.org` | E-Mail des Demo-Kontos. |
| `BEEHIVE_DEMO_PASSWORD` | `demo` | Passwort des Demo-Kontos. |

## WebAuthn / Passkeys

Optionale passwortlose Authentifizierung mit Passkeys.

| Variable                  | Standard | Beschreibung                                                          |
| ------------------------- | -------- | -------------------------------------------------------------------- |
| `BEEHIVE_WEBAUTHN_ENABLED`        | `false`  | Aktiviert die Anmeldung per WebAuthn / Passkey.                      |
| `BEEHIVE_WEBAUTHN_RP_ID`          | Host von `BEEHIVE_PUBLIC_BASE_URL` | Relying-Party-ID, normalerweise deine reine Domain (z. B. `openbeehive.org`). |
| `BEEHIVE_WEBAUTHN_RP_ORIGINS`     | `BEEHIVE_PUBLIC_BASE_URL` | Kommagetrennte erlaubte Origins für WebAuthn-Zeremonien. |
| `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME`| `Openbeehive` | Menschenlesbarer Name, der Benutzern während der Registrierung angezeigt wird. |

## OIDC-Anbieter

Anmeldung über externe Identitätsanbieter via OpenID Connect. Mehrere Anbieter können gleichzeitig aktiviert werden.

| Variable             | Standard | Beschreibung                                                            |
| -------------------- | -------- | ----------------------------------------------------------------------- |
| `BEEHIVE_OIDC_PROVIDERS`     | (leer)   | Kommagetrennte Liste aktivierter Anbieter, z. B. `google,keycloak`. Jeder aufgeführte Anbieter braucht seinen Issuer und seine Client-ID, sonst startet der Server nicht. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | Die Callback-URL, zu der Anbieter nach der Anmeldung weiterleiten.      |

Jeder Anbieter hat dann seine eigenen Variablen: `BEEHIVE_OIDC_<NAME>_ISSUER`,
`BEEHIVE_OIDC_<NAME>_CLIENT_ID`, `BEEHIVE_OIDC_<NAME>_CLIENT_SECRET` und optional
`BEEHIVE_OIDC_<NAME>_SCOPES` (Standard `openid,profile,email`), wobei `<NAME>` der
Anbietername in Großbuchstaben ist. Zum Beispiel:

```bash
# Google
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile

# Keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/beekeepers
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=...
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=...
```

:::tip[Einzelbenutzer, keine Anmeldung]
Für eine persönliche selbst gehostete Instanz kannst du die Anmeldung komplett überspringen: Lass `BEEHIVE_PASSWORD_AUTH` aus (der selfhost-Standard), `BEEHIVE_OIDC_PROVIDERS` leer und `BEEHIVE_WEBAUTHN_ENABLED=false`. Die App läuft dann im Einzelbenutzermodus ohne Anmeldeschritt.
:::

Für Anleitungen zur Anbietereinrichtung, Weiterleitungs-URLs und Sicherheitshinweise siehe [Authentifizierung](./authentication.md).

## Ein minimales selfhost-Beispiel

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://192.168.1.20:8080
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth: single-user mode, no session secret needed
```

Wenn du für eine Familien- oder Vereinsinstanz die Passwort-Anmeldung aktivierst, ergänze
das Sitzungsgeheimnis und den eigenen Admin:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
# Paste the output of: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Stelle einen Reverse Proxy für HTTPS davor, setze dahinter `BEEHIVE_TRUST_PROXY_HEADERS=true`, und du bist bereit, Aufzeichnungen zu führen.
