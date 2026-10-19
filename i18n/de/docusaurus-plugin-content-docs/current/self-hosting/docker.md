---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Betreibe Openbeehive als einzelnen Container für ein Self-Host-Setup oder fahre den vollständigen Cloud-Stack (Postgres und MinIO) mit Docker Compose hoch.

Das Image wird bei jedem Release-Tag in der GitHub Container Registry veröffentlicht:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

Dasselbe Image bedient beide Bereitstellungsprofile; die Umgebung, die du übergibst, entscheidet, welches du erhältst. Seit 0.4.0 läuft der Container als unprivilegierter Benutzer `65532` mit `/data` als Arbeitsverzeichnis.

### Ein Release-Image verifizieren

Jedes Release-Image ist mit [cosign](https://docs.sigstore.dev/cosign/verifying/verify/) signiert (keyless, gebunden an die Identität des Release-Workflows), trägt eine GitHub-Build-Provenance-Attestierung und liefert eine SBOM im [GitHub-Release](https://github.com/openbeehive-org/openbeehive-app/releases) mit. So prüfst du, dass das Image, das du ziehst, dasjenige ist, das der Release-Workflow gebaut hat:

```bash
cosign verify ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/openbeehive-org/openbeehive-app/\.github/workflows/release\.yml@.*'

gh attestation verify oci://ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z --owner openbeehive-org
```

Beide Befehle geben die Signatur-Identität und den Commit aus, aus dem das Image gebaut wurde. Images, die vor 0.4.0 veröffentlicht wurden, sind nicht signiert.

:::tip
Für eine Einzelnutzer-Instanz auf einer Maschine ist die [einzelne Binärdatei](/self-hosting/single-binary) sogar noch einfacher als Docker. Greife zu Compose, wenn du Postgres und Speicher im S3-Stil möchtest.
:::

## Den einzelnen Container ausführen

Ein Container mit dem `selfhost`-Profil hält eine SQLite-Datenbank und die hochgeladenen Blobs auf einem einzigen eingehängten Volume. Mehr ist nicht erforderlich.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 8080:8080` bildet den Listen-Port des Containers (`BEEHIVE_ADDR=:8080`) auf den Host ab.
- `-v openbeehive-data:/data` hält deine Daten auf einem benannten Volume. Docker legt das Volume mit den Besitzrechten von `/data` aus dem Image an, sodass der unprivilegierte Server-Benutzer darauf schreiben kann. Wenn du stattdessen ein Host-Verzeichnis per Bind-Mount einhängst (`-v /srv/openbeehive:/data`), muss es der uid `65532` gehören: `sudo chown -R 65532:65532 /srv/openbeehive`.
- Die Zeilen `BEEHIVE_DATABASE_DSN` und `BEEHIVE_BLOB_DIR` zeigen die Datenbank und die hochgeladenen Fotos explizit auf das Volume. Die Standardwerte (`openbeehive.db`, `./data/blobs`) sind relativ zum Arbeitsverzeichnis, das seit 0.4.0 `/data` ist; die Pfade auszuschreiben hält den Befehl aber eindeutig und passt zur Backup-Anleitung.
- `BEEHIVE_PUBLIC_BASE_URL` muss die Adresse sein, die Nutzer erreichen, einschließlich Schema. Der Server verwendet sie für OIDC-Redirect-URLs sowie für Einladungs- und Verifizierungslinks.

Ohne aktivierte Anmeldemethode (der selfhost-Standard) läuft die Instanz im Einzelnutzer-Modus. Um Authentifizierung hinzuzufügen, setze `BEEHIVE_SESSION_SECRET` (einmal mit `openssl rand -base64 32` generieren und stabil halten; eine Änderung meldet alle ab) plus die Variablen für die gewünschte Methode. Die E-Mail-/Passwort-Anmeldung braucht außerdem `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD`, sonst startet der Server nicht. Siehe [Authentifizierung](/self-hosting/authentication).

### Eine env-Datei verwenden

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Das Cloud-Profil mit Compose

Das `cloud`-Profil koppelt den Server mit PostgreSQL und MinIO. Die `docker-compose.yml` des Repositorys ist ein Entwicklungs-Stack: Sie baut den Server aus dem Quellcode und veröffentlicht die Datenbank- und MinIO-Ports auf dem Host.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
cp .env.example .env   # then edit .env (see below)
docker compose up -d --build
```

### Die Dienste

| Dienst | Image | Rolle |
| --- | --- | --- |
| `server` | gebaut aus dem `Dockerfile` des Repositorys | Backend und Web-App auf `:8080` |
| `postgres` | `postgres:18-alpine` | Datenbank; `5432` auf dem Host veröffentlicht |
| `minio` | `minio/minio:latest` | S3-kompatibler Blob-Speicher; `9000` (API) und `9001` (Konsole) auf dem Host veröffentlicht |

`server` hängt von `postgres` und `minio` ab, daher startet Compose diese zuerst.

### Was die Compose-Datei setzt

Diese Werte sind in `docker-compose.yml` fest eingetragen und werden nicht aus `.env` gelesen; ändere sie, indem du die Datei bearbeitest (und ändere die Postgres- und MinIO-Zugangsdaten an derselben Stelle):

| Einstellung | Wert in der Compose-Datei |
| --- | --- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `cloud` |
| `BEEHIVE_DATABASE_DSN` | `postgres://openbeehive:openbeehive@postgres:5432/openbeehive?sslmode=disable` |
| `BEEHIVE_MINIO_ENDPOINT` | `minio:9000` |
| `BEEHIVE_MINIO_ACCESS_KEY` / `BEEHIVE_MINIO_SECRET_KEY` | `minioadmin` / `minioadmin` |
| `BEEHIVE_OIDC_PROVIDERS` | `google` |

Diese kommen aus deiner Shell oder `.env`:

```bash
# Required: the cloud profile enables password auth, which needs the instance admin.
# docker compose up fails immediately if either is missing.
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters

# Sessions; generate with: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=

# Defaults to http://localhost:8080
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Google is enabled as an OIDC provider in the compose file, so these are
# required too; without a client ID the server exits with
# "OIDC provider google: issuer/client id missing". Remove the BEEHIVE_OIDC_*
# lines from docker-compose.yml if you do not want Google sign-in.
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Dienstnamen sind Hostnamen
Innerhalb des Compose-Netzwerks erreichen Container einander über den Dienstnamen. Deshalb zeigt der DSN auf `postgres` und der MinIO-Endpunkt auf `minio`.
:::

### Eine produktionsnahe Datei

`docker-compose.demo.yml` im Repository ist die Datei hinter der gehosteten Instanz: Sie verwendet das veröffentlichte Image statt zu bauen, veröffentlicht keine Datenbank- oder MinIO-Ports, ergänzt Restart-Policies und Healthchecks, bezieht jedes Secret aus `.env`, schließt die Registrierung (nur auf Einladung) und aktiviert den [Demo-Mandanten](/self-hosting/demo). Ihr Kopfkommentar listet die benötigten Variablen auf. Nutze sie als Ausgangspunkt für deinen eigenen Produktions-Stack:

```bash
docker compose -f docker-compose.demo.yml up -d
```

Die vollständige Liste der Variablen findest du unter [Konfiguration](/self-hosting/configuration).

## Deine Daten persistieren

- **Einzelner Container (`selfhost`):** Alles liegt unter `/data` auf dem Volume `openbeehive-data`, solange DSN und Blob-Verzeichnis dorthin zeigen.
- **Cloud-Profil:** Aufzeichnungen liegen im Volume `pg` (Postgres) und hochgeladene Dateien im Volume `minio`. Der Server-Container ist zustandslos und kann frei ersetzt werden.

:::danger Vor dem Upgrade sichern
Benannte Volumes überstehen `docker compose up` und Image-Upgrades, aber nicht `docker compose down -v` oder ein entferntes Volume. Erstelle vor jedem Upgrade oder destruktiven Befehl ein Backup. Siehe [Backups](/self-hosting/backups).
:::

## Häufige Operationen

```bash
# Follow the server logs
docker compose logs -f server

# Rebuild from updated source and recreate (docker-compose.yml builds the image)
git pull && docker compose up -d --build

# Pull a newer published image and recreate (docker-compose.demo.yml or your own file)
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d

# Stop everything (volumes are kept)
docker compose down
```
