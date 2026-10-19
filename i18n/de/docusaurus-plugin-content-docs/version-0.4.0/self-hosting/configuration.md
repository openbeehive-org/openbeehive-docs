---
sidebar_position: 4
title: "Konfiguration"
---

# Konfiguration

Openbeehive wird vollständig über Umgebungsvariablen konfiguriert. Diese Seite ist die vollständige Referenz.

Du kannst diese Variablen in deiner Shell, in einer `.env`-Datei neben der Binärdatei, in deiner `docker compose`-Datei oder über den Secrets-Manager deiner Hosting-Plattform setzen. Der Server liest sie einmal beim Start, daher werden Änderungen erst nach einem Neustart wirksam.

:::tip Klein anfangen
Du brauchst nur eine Handvoll davon, um loszulegen. Für einen Heimserver mit einem Benutzer setzt du `BEEHIVE_DEPLOYMENT_PROFILE=selfhost`, ein `BEEHIVE_SESSION_SECRET` und lässt den Rest auf den Standardwerten. Siehe den [Schnellstart](/self-hosting/quick-start), um in wenigen Minuten loszulegen.
:::

## Wie das Deployment-Profil funktioniert

Die mit Abstand wichtigste Einstellung ist `BEEHIVE_DEPLOYMENT_PROFILE`. Sie wählt sinnvolle Standardwerte für alles andere, sodass du keinen vollständigen Stack von Hand ausbuchstabieren musst.

| Profil     | Datenbank-Standard | Blob-Speicher-Standard | Vorgesehen für                          |
| ---------- | ------------------ | ---------------------- | --------------------------------------- |
| `selfhost` | SQLite (Datei)     | Lokales Dateisystem    | Eine einzelne Binärdatei, kein Docker, ein Host |
| `cloud`    | PostgreSQL         | MinIO / S3             | Das gehostete, mandantenfähige Deployment |

Das Profil setzt nur *Standardwerte*. Jede Variable, die du explizit setzt, gewinnt immer. Du kannst zum Beispiel das `selfhost`-Profil verwenden, es aber auf PostgreSQL zeigen lassen, indem du `BEEHIVE_DATABASE_DRIVER` und `BEEHIVE_DATABASE_DSN` selbst setzt.

:::note
Die beiden Profile werden ausführlich auf ihren eigenen Seiten dokumentiert: [Einzelne Binärdatei](/self-hosting/single-binary) und [Docker](/self-hosting/docker). Diese Seite konzentriert sich auf die Variablen selbst.
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
| `BEEHIVE_HTTP_READ_TIMEOUT` | `0` | Lesezeitlimit für die gesamte Anfrage; `0` bedeutet keines. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `0` | Schreibzeitlimit für Antworten; `0` bedeutet keines. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Wie lange eine ungenutzte Keep-Alive-Verbindung offen bleibt. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Gnadenfrist für laufende Anfragen beim Herunterfahren. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` muss mit der Adresse übereinstimmen, die Benutzer tatsächlich aufrufen. Ist sie falsch, zeigen Login-Weiterleitungen und Einladungslinks an den falschen Ort.
:::

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
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | `*`      | Kommagetrennte Liste erlaubter Origins. Beschränke dies in der Produktion auf deine Domain. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`   | Ob Cross-Origin-Anfragen mit Anmeldedaten (Cookies, Auth-Header) erlaubt sind. |

:::caution
Ein Platzhalter-Origin (`*`) in Kombination mit `BEEHIVE_CORS_ALLOW_CREDENTIALS=true` ist freizügig. Wenn du die App von einem einzelnen Origin auslieferst, setze `BEEHIVE_CORS_ALLOWED_ORIGINS` auf genau diesen Origin.
:::

## Synchronisierung

| Variable  | Standard | Beschreibung                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | `server` | Kennung für diesen Knoten im Sync-Protokoll. Wird von der Hybrid Logical Clock zur Kennzeichnung von Ereignissen verwendet. Halte sie stabil und pro Server eindeutig. |

Die konfliktfreie Sync-Engine (HLC plus Last-Writer-Wins pro Feld und Add-Wins-OR-Sets) benötigt für jeden Teilnehmer eine stabile Identität. Das Ändern von `BEEHIVE_NODE_ID` auf einem laufenden Server wird nicht empfohlen.

## Datenbank

| Variable          | Standard           | Beschreibung                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | aus Profil         | Datenbank-Engine: `postgres`, `mysql` oder `sqlite`.                        |
| `BEEHIVE_DATABASE_DSN`    | aus Profil         | Verbindungszeichenfolge für den gewählten Treiber (siehe unten).            |

Beispiel-DSNs nach Treiber:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MySQL
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Für Treiberauswahl, Tuning und Migrationshinweise siehe [Datenbanken](/self-hosting/databases).

## Blob-Speicher

Fotos und andere Anhänge werden als Blobs gespeichert, entweder auf dem lokalen Dateisystem oder in einem S3-kompatiblen Objektspeicher.

| Variable          | Standard       | Beschreibung                                                            |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | aus Profil     | Speicher-Backend: `fs` (lokales Dateisystem) oder `minio` (MinIO / S3). |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Verzeichnis für Blobs, wenn `BEEHIVE_BLOB_BACKEND=fs`.                          |
| `BEEHIVE_BLOB_PUBLIC_URL` | `<BEEHIVE_PUBLIC_BASE_URL>/files` | Basis-URL, unter der gespeicherte Dateien an Browser ausgeliefert werden. Nur ändern, wenn ein Proxy oder CDN das Blob-Verzeichnis von woanders ausliefert. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host und Port des MinIO- / S3-Endpunkts.                               |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Zugriffsschlüssel für den Objektspeicher.                              |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Geheimer Schlüssel für den Objektspeicher.                             |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Bucket-Name, in dem Blobs gespeichert werden.                          |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Setze `true`, um über HTTPS mit dem Endpunkt zu verbinden.             |

Die `MINIO_*`-Variablen werden nur verwendet, wenn `BEEHIVE_BLOB_BACKEND=minio`. Für vollständige Hinweise siehe [Speicher](/self-hosting/storage).

## Sitzung und Authentifizierung

| Variable         | Standard | Beschreibung                                                                                  |
| ---------------- | -------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (leer)   | Geheimnis zum Signieren von Sitzungs-Cookies. Erzeuge eines mit `openssl rand -base64 32`. In der Produktion erforderlich. |
| `BEEHIVE_SESSION_TTL`    | `720h`   | Wie lange eine Sitzung dauert, bevor eine erneute Authentifizierung erforderlich ist (z. B. sind `720h` 30 Tage). |

:::danger
Setze immer ein starkes, eindeutiges `BEEHIVE_SESSION_SECRET` und halte es geheim. Wenn es durchsickert oder sich ändert, werden alle bestehenden Sitzungen ungültig.
:::

## E-Mail, Passwort & Onboarding

Eingebaute Konten für Mehrbenutzer-Instanzen ohne externen Identitätsanbieter.
Der Instanz-Admin ist ein eigenes Konto, das du konfigurierst – nicht die erste Person,
die sich registriert. Siehe [Authentifizierung](/self-hosting/authentication).

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | an für `cloud`, aus für `selfhost` | E-Mail-/Passwort-Registrierung und -Anmeldung aktivieren. Wird auch durch `BEEHIVE_DEMO=true` impliziert. |
| `BEEHIVE_ADMIN_EMAIL` | (leer) | E-Mail des Instanz-Admins. **Erforderlich, sobald die Passwort-Anmeldung aktiv ist.** Das Konto wird bei jedem Start sichergestellt: angelegt, falls es fehlt, und seine Rolle auf Admin gesetzt. Eine Registrierung vergibt nie die Admin-Rolle. |
| `BEEHIVE_ADMIN_PASSWORD` | (leer) | Passwort des Instanz-Admins, mindestens 8 Zeichen. Bei jedem Start maßgeblich: Das gespeicherte Passwort wird auf diesen Wert zurückgesetzt – das dient zugleich als Passwort-Wiederherstellung. |
| `BEEHIVE_REGISTRATION` | `true` | Offene Selbstregistrierung. Auf `false` setzen für eine Instanz nur auf Einladung: Abgesehen vom konfigurierten Admin können Konten nur über Einladungslinks erstellt werden, und der Anmeldebildschirm zeigt einen entsprechenden Hinweis. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | E-Mail-Bestätigung verlangen, bevor sich ein neues Konto anmelden kann. |
| `BEEHIVE_SMTP_HOST` | (leer) | SMTP-Server für Bestätigungs-/Einladungs-E-Mails. Wenn leer, werden Links stattdessen ins Log geschrieben. |
| `BEEHIVE_SMTP_PORT` | `587` | SMTP-Port. |
| `BEEHIVE_SMTP_USER` | (leer) | SMTP-Benutzername. |
| `BEEHIVE_SMTP_PASS` | (leer) | SMTP-Passwort. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Absenderadresse für ausgehende E-Mails. |

## Demo-Mandant

Installiert ein Demo-Schaukonto und einen Demo-Mandanten. Standardmäßig deaktiviert — siehe
[Demo-Modus](/self-hosting/demo).

| Variable | Standard | Beschreibung |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Ein Demo-Konto + Mandant installieren (15 Bienenvölker auf 4 Bienenständen, stündlich zurückgesetzt). Impliziert `BEEHIVE_PASSWORD_AUTH=true`. |
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
| `BEEHIVE_OIDC_PROVIDERS`     | (leer)   | Kommagetrennte Liste aktivierter Anbieter, z. B. `google,keycloak`.     |
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

:::tip Einzelbenutzer, keine Anmeldung
Für eine persönliche selbst gehostete Instanz kannst du die Anmeldung komplett überspringen: Lass `BEEHIVE_PASSWORD_AUTH` aus (der selfhost-Standard), `BEEHIVE_OIDC_PROVIDERS` leer und `BEEHIVE_WEBAUTHN_ENABLED=false`. Die App läuft dann im Einzelbenutzermodus ohne Anmeldeschritt.
:::

Für Anleitungen zur Anbietereinrichtung, Weiterleitungs-URLs und Sicherheitshinweise siehe [Authentifizierung](/self-hosting/authentication).

## Ein minimales selfhost-Beispiel

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth — single-user mode
```

Wenn du für eine Familien- oder Vereinsinstanz die Passwort-Anmeldung aktivierst, ergänze
auch den eigenen Admin:

```bash
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=du@example.com
BEEHIVE_ADMIN_PASSWORD=ein-langes-passwort-das-du-wiederherstellen-kannst
```

Das ist alles, was ein einzelner Imker braucht. Stelle einen Reverse Proxy für HTTPS davor, und du bist bereit, Aufzeichnungen zu führen.
