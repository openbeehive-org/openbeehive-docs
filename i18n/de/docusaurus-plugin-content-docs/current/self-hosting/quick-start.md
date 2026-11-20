---
sidebar_position: 1
title: "Schnelleinstieg"
---

# Schnelleinstieg

Zwei Wege zu einer laufenden Openbeehive-Instanz, die du im Browser öffnen kannst:

- **Variante A, Docker.** Starte das veröffentlichte Image mit einem Befehl.
- **Variante B, einzelne Binärdatei.** Baue eine eigenständige ausführbare Datei. Kein Docker, kein Datenbankserver, kein Objektspeicher. Gut für einen Heimserver, einen Raspberry Pi oder einen kleinen VPS.

Beide verwenden das Bereitstellungsprofil **selfhost**: eine eingebettete SQLite-Datenbank und Dateien auf der lokalen Festplatte. Für mehrere Nutzer mit PostgreSQL und MinIO/S3 siehe [Docker & Compose](./docker.md#several-users).

:::caution[Von Haus aus keine Anmeldung]
Im selfhost-Profil ist standardmäßig keine Anmeldemethode aktiviert, die App öffnet also direkt deine Aufzeichnungen, und **wer den Port erreichen kann, hat vollen Zugriff**. Auf deinem eigenen Rechner ist das in Ordnung. Deshalb veröffentlichen die Beispiele den Port nur auf `127.0.0.1`, und ein Server ohne Anmeldung antwortet nur auf `localhost`, IP-Adressen und den Host aus `BEEHIVE_PUBLIC_BASE_URL`. Bevor du ihn für andere Geräte oder Personen öffnest, [schalte die Anmeldung ein](#turn-login-on).
:::

## Variante A: Docker

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Öffne `http://localhost:8080`. Das Arbeitsverzeichnis des Containers ist `/data`, sodass die Datenbank (`openbeehive.db`) und die hochgeladenen Dateien (`data/blobs`) auf dem Volume `openbeehive-data` landen und Neustarts und Upgrades überstehen.

Das Repository liefert dasselbe Setup als Compose-Datei mit, [`docker-compose.selfhost.yml`](https://github.com/openbeehive-org/openbeehive-app/blob/main/docker-compose.selfhost.yml), die ihre Einstellungen aus einer `.env`-Datei neben ihr liest:

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

So stoppst oder entfernst du den Container (das Volume bleibt):

```bash
docker stop openbeehive
docker rm openbeehive
```

## Variante B: einzelne Binärdatei (kein Docker)

### Voraussetzungen

- Go 1.27 oder neuer
- Node 24 oder neuer (das veröffentlichte Image baut mit Node 26)
- [buf](https://buf.build/docs/installation) (`make tools` installiert die festgelegte Version)

### Bauen und ausführen

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure (optional): the defaults already are the selfhost profile
cp .env.example .env

# Run
./server/bin/openbeehive
```

Die Binärdatei liest `.env` aus dem Verzeichnis, in dem sie gestartet wird; Variablen, die bereits in der Umgebung gesetzt sind, haben Vorrang. Standardmäßig lauscht sie auf `:8080` und liefert die Web-App selbst aus (`BEEHIVE_SERVE_WEB=true`), sodass die API und die PWA vom selben Ursprung kommen. Öffne `http://localhost:8080`.

Die ersten Zeilen des Logs sagen, wie der Server konfiguriert ist, auch wer ihn nutzen darf:

```text
config: applied .env from the working directory (existing environment variables win)
Openbeehive · profile=selfhost · DB=sqlite · Blob=fs
auth: NO LOGIN (single-user mode): every request has full access to all data
auth: accepting requests for hosts: localhost, IP addresses (add names with BEEHIVE_ALLOWED_HOSTS)
```

:::note[Wo deine Daten liegen]
Im selfhost-Modus landen deine Aufzeichnungen in einer SQLite-Datei (standardmäßig `openbeehive.db` im Arbeitsverzeichnis) und hochgeladene Dateien in einem Blob-Verzeichnis (standardmäßig `./data/blobs`). Sichere beides und du hast alles gesichert; siehe [Backups](./backups.md).
:::

## Anmeldung einschalten \{#turn-login-on}

Um die Instanz von anderen Geräten aus zu erreichen oder sie mit anderen zu teilen, verlange eine Anmeldung. Trage diese Einstellungen in `.env` ein (neben der Binärdatei oder neben `docker-compose.selfhost.yml`) oder übergib sie mit `-e` an `docker run`:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org   # the address people open
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please            # 8+ characters
BEEHIVE_SESSION_SECRET=...                         # openssl rand -base64 32
BEEHIVE_BIND=0.0.0.0                               # Compose file only: publish on the network
```

- `BEEHIVE_PUBLIC_BASE_URL` ist die Adresse, die der Server in die von ihm erzeugten Links einsetzt (OIDC-Redirects, Einladungs- und Verifizierungslinks).
- `BEEHIVE_SESSION_SECRET` muss mindestens 32 Bytes lang sein. Mit jeder Anmeldemethode startet der Server ohne es nicht.
- `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` legen den Instanz-Admin fest; mit der E-Mail-/Passwort-Anmeldung startet der Server ohne sie nicht.

Aufzeichnungen, die vor dem Einschalten der Anmeldung entstanden sind, wandern beim nächsten Start in den Arbeitsbereich des Admins; melde dich als Admin an, um sie zu sehen. Einzelheiten und die anderen Anmeldemethoden findest du unter [Authentifizierung](./authentication.md).

## Erste Schritte nach der Installation

1. Öffne die App und lege deinen ersten Bienenstand an.
2. Füge eine Beute hinzu, bearbeite sie, um ihren Typ zu setzen, und erfasse eine Durchsicht.
3. Drucke ein QR-Etikett für die Beute, damit du im Feld direkt dorthin scannen kannst.

Bevor du die Instanz im Internet erreichbar machst, setze einen TLS-terminierenden [Reverse Proxy](./reverse-proxy.md) davor, setze `BEEHIVE_PUBLIC_BASE_URL` auf die `https://`-Adresse und `BEEHIVE_TRUST_PROXY_HEADERS=true`. Richte dann [Backups](./backups.md) ein. Betreibe genau eine Server-Instanz pro Datenbank.
