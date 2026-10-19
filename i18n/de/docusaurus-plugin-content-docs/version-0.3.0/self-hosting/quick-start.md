---
sidebar_position: 1
title: "Schnelleinstieg"
---

# Schnelleinstieg

Zwei Wege zu einer laufenden Openbeehive-Instanz, die du im Browser öffnen kannst:

- **Variante A, einzelne Binärdatei.** Baue eine eigenständige ausführbare Datei, die SQLite und das lokale Dateisystem nutzt. Kein Docker, kein Datenbankserver, kein Objektspeicher. Gut für einen Heimserver, einen Raspberry Pi oder einen kleinen VPS.
- **Variante B, Docker.** Starte das veröffentlichte Image mit einem Befehl.

Beide verwenden das Bereitstellungsprofil **selfhost**, das standardmäßig eine eingebettete SQLite-Datenbank und Blob-Speicher im Dateisystem nutzt. Du kannst später auf PostgreSQL und MinIO/S3 umstellen; siehe [Konfiguration](/self-hosting/configuration).

:::tip Einzelnutzer? Keine Anmeldung nötig
Im selfhost-Profil ist standardmäßig keine Anmeldemethode aktiviert: `BEEHIVE_PASSWORD_AUTH` ist aus, `BEEHIVE_OIDC_PROVIDERS` ist leer und `BEEHIVE_WEBAUTHN_ENABLED=false`. Die App öffnet direkt deine Aufzeichnungen. Um später eine Anmeldung hinzuzufügen, siehe [Authentifizierung](/self-hosting/authentication).
:::

## Die kleinstmögliche funktionierende Konfiguration

Welche Route du auch wählst, für den Einstieg sind zwei Einstellungen wichtig:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` ist die Adresse, die der Server in die von ihm erzeugten Links einsetzt (OIDC-Redirects, Einladungs- und Verifizierungslinks). Zum lokalen Testen ist `http://localhost:8080` in Ordnung. Für eine echte Bereitstellung setze sie auf deine öffentliche URL, zum Beispiel `https://bees.example.com`.

Alles andere hat Standardwerte für das Self-Hosting. Die vollständige Liste findest du unter [Konfiguration](/self-hosting/configuration).

## Variante A: einzelne Binärdatei (kein Docker)

### Voraussetzungen

- Go 1.25 oder neuer
- Node 24 oder neuer
- [buf](https://buf.build/docs/installation)

### Bauen und ausführen

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Standardmäßig lauscht die Binärdatei auf `:8080` und liefert die Web-App selbst aus (`BEEHIVE_SERVE_WEB=true`), sodass die API und die PWA vom selben Ursprung kommen. Öffne die Adresse aus `BEEHIVE_PUBLIC_BASE_URL`.

:::note Wo deine Daten liegen
Im selfhost-Modus landen deine Aufzeichnungen in einer SQLite-Datei (standardmäßig `openbeehive.db` im Arbeitsverzeichnis) und hochgeladene Fotos in einem Blob-Verzeichnis (standardmäßig `./data/blobs`). Sichere beides und du hast alles gesichert; siehe [Backups](/self-hosting/backups).
:::

## Variante B: Docker

Das veröffentlichte Image ist `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Die Zeilen `BEEHIVE_DATABASE_DSN` und `BEEHIVE_BLOB_DIR` sind es, die deine Daten auf das Volume legen. Ohne sie verwendet der Container seine Standardwerte, `openbeehive.db` und `./data/blobs` relativ zum Wurzelverzeichnis des Containers, die außerhalb des Volumes liegen und nach `docker rm` weg sind. Mit ihnen hält das Volume `openbeehive-data` die Datenbank und die Blobs, und sie überstehen Neustarts und Upgrades. Sobald es läuft, öffne `http://localhost:8080`.

So stoppst oder entfernst du den Container (das Volume bleibt):

```bash
docker stop openbeehive
docker rm openbeehive
```

Wenn du die E-Mail-/Passwort-Anmeldung einschaltest (`BEEHIVE_PASSWORD_AUTH=true`), startet der Server erst, wenn auch `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` gesetzt sind. Siehe [Authentifizierung](/self-hosting/authentication).

:::tip Lieber Cloud-Stack?
Der obige Befehl startet das schlanke selfhost-Profil. Für das **cloud**-Profil (PostgreSQL + MinIO) liefert das Repository Compose-Dateien mit; siehe [Docker](/self-hosting/docker).
:::

## Erste Schritte nach der Installation

1. Öffne die App unter deiner `BEEHIVE_PUBLIC_BASE_URL` und lege deinen ersten Standort an.
2. Füge eine Beute hinzu, bearbeite sie, um ihren Typ zu setzen, und erfasse eine Durchsicht.
3. Drucke ein QR-Etikett für die Beute, damit du im Feld direkt dorthin scannen kannst.

Bevor du die Instanz im Internet erreichbar machst, setze einen TLS-terminierenden [Reverse Proxy](/self-hosting/reverse-proxy) davor und setze `BEEHIVE_PUBLIC_BASE_URL` auf die `https://`-Adresse. Richte dann [Backups](/self-hosting/backups) ein.
