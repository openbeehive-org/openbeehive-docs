---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Docker ist der schnellste Weg, Openbeehive auf einem Server zu betreiben. Du kannst
den einzelnen Container für sich allein für ein aufgeräumtes Self-Host-Setup
betreiben oder den vollständigen Cloud-Stack (Postgres und MinIO) mit Docker
Compose hochfahren.

Das offizielle Image wird in der GitHub Container Registry veröffentlicht:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest
```

Dasselbe Image funktioniert für beide Bereitstellungsprofile. Welches du erhältst,
wird ausschließlich durch die Umgebung entschieden, die du übergibst.

:::tip Soll es einfach schnell laufen?
Wenn du nur eine Einzelnutzer-Instanz auf einer Maschine brauchst, ist die
[einzelne Binärdatei](/self-hosting/single-binary) sogar noch einfacher als Docker.
Greife zu Compose, wenn du Postgres und Speicher im S3-Stil möchtest.
:::

## Den einzelnen Container ausführen

Die einfachste Bereitstellung ist ein Container mit dem `selfhost`-Profil, das
alle seine Daten (eine SQLite-Datenbank und hochgeladene Blobs) auf einem einzigen
eingehängten Volume hält. Mehr ist nicht erforderlich.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e BEEHIVE_DATABASE_DRIVER=sqlite \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -e BEEHIVE_SESSION_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Ein paar Hinweise zu den Flags:

- `-p 8080:8080` bildet den Listen-Port des Containers (gesetzt durch `BEEHIVE_ADDR=:8080`)
  auf den Host ab.
- `-v openbeehive-data:/data` ist das Wichtige. Es hält deine Datenbank und
  Uploads auf einem benannten Docker-Volume, sodass sie Container-Neustarts und
  Upgrades überstehen. Lass sowohl `BEEHIVE_DATABASE_DSN` als auch `BEEHIVE_BLOB_DIR` in dieses
  Volume zeigen.
- `BEEHIVE_PUBLIC_BASE_URL` muss die Adresse sein, die Nutzer tatsächlich erreichen,
  einschließlich Schema. Sie wird verwendet, um QR-Code-Deeplinks und
  OIDC-Redirect-URLs zu bilden, also mach sie richtig.
- `BEEHIVE_SESSION_SECRET` signiert Session-Cookies. Generiere es einmal und halte es
  stabil; eine Änderung meldet alle ab.

:::caution Setze ein stabiles Session-Secret
Der Trick `$(openssl rand -base64 32)` ist praktisch für einen ersten Lauf, aber er
erzeugt jedes Mal, wenn der Befehl läuft, einen neuen Wert. Generiere das Secret
einmal, bewahre es an einem sicheren Ort auf und übergib denselben Wert bei jedem
Neustart.
:::

Mit leer gelassenem `BEEHIVE_OIDC_PROVIDERS` und `BEEHIVE_WEBAUTHN_ENABLED=false` läuft die Instanz
im Einzelnutzer-Modus ohne Anmeldung. Um Authentifizierung hinzuzufügen, siehe
[Authentifizierung](/self-hosting/authentication).

### Eine env-Datei verwenden

Lange `-e`-Listen werden unhandlich. Lege deine Einstellungen in einer Datei ab und
übergib sie mit `--env-file`:

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Das Cloud-Profil mit Compose

Das `cloud`-Profil koppelt den Server mit PostgreSQL für die Datenbank und MinIO
für S3-kompatiblen Blob-Speicher. Dies ist das empfohlene Setup für
Mehrbenutzer-Hosting und dasjenige, das den gehosteten Dienst widerspiegelt.

Das Repository liefert eine `docker-compose.yml`, die die drei Dienste
miteinander verdrahtet. Klone das Repo, kopiere die Beispiel-Umgebung und fahre es
hoch:

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
cp .env.example .env   # then edit .env (see below)
docker compose up -d
```

### Die Dienste

| Dienst | Image | Rolle |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app:latest` | Das Openbeehive-Backend und die PWA, lauschen auf `:8080`. |
| `postgres` | `postgres` | Die relationale Datenbank für alle synchronisierten Aufzeichnungen. |
| `minio` | `minio/minio` | S3-kompatibler Objektspeicher für Fotos und andere Blobs. |

Der `server` hängt sowohl von `postgres` als auch von `minio` ab, daher startet
Compose diese zuerst. Die Web-App wird vom selben Container ausgeliefert, wenn
`BEEHIVE_SERVE_WEB=true`.

### Erforderliche Umgebung

Setze diese in deiner `.env`, bevor du startest. Die Compose-Datei liest sie und
reicht sie an die richtigen Container weiter.

```bash
BEEHIVE_DEPLOYMENT_PROFILE=cloud
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Database — host "postgres" is the compose service name
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:changeme@postgres:5432/openbeehive?sslmode=disable

# Blob storage — endpoint "minio" is the compose service name
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=minio:9000
BEEHIVE_MINIO_ACCESS_KEY=minioadmin
BEEHIVE_MINIO_SECRET_KEY=changeme-too
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=false

# Sessions
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_SESSION_TTL=720h

# Authentication (example: Google + Keycloak)
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://bees.example.com/auth/callback
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Dienstnamen sind Hostnamen
Innerhalb des Compose-Netzwerks erreichen Container einander über den Dienstnamen.
Deshalb zeigt `BEEHIVE_DATABASE_DSN` auf `postgres` und `BEEHIVE_MINIO_ENDPOINT` auf `minio` statt
auf `localhost`. Ändere die Zugangsdaten so, dass sie zu den Werten passen, die du
für die Postgres- und MinIO-Container gesetzt hast.
:::

Die vollständige Liste der OIDC- und WebAuthn-Variablen findest du unter
[Konfiguration](/self-hosting/configuration) und
[Authentifizierung](/self-hosting/authentication).

### Ein gekürztes Compose-Beispiel

Dies ist eine abgespeckte Veranschaulichung, wie die Dienste zusammenpassen. Nutze
die `docker-compose.yml` aus dem Repository für die echte Sache; sie enthält
Healthchecks und sinnvolle Standardwerte, die dieses Snippet weglässt.

```docker
services:
  server:
    image: ghcr.io/openbeehive-org/openbeehive-app:latest
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: openbeehive
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: openbeehive
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: changeme-too
    volumes:
      - miniodata:/data
    restart: unless-stopped

volumes:
  pgdata:
  miniodata:
```

## Deine Daten persistieren

Imkereiaufzeichnungen sind kostbar, also stelle sicher, dass sie auf Volumes
liegen, die die Container überdauern.

- **Einzelner Container (`selfhost`):** alles liegt unter `/data`. Das benannte
  Volume `openbeehive-data` hält sowohl die SQLite-Datenbank als auch das
  Blob-Verzeichnis.
- **Cloud-Profil:** Aufzeichnungen liegen im `pgdata`-Volume (Postgres) und
  hochgeladene Dateien im `miniodata`-Volume (MinIO). Der Server-Container selbst
  ist zustandslos und kann frei ersetzt werden.

:::danger Vor dem Upgrade sichern
Benannte Volumes überstehen `docker compose up` und Image-Upgrades, aber sie
überstehen nicht `docker compose down -v` oder ein entferntes Volume. Erstelle ein
Backup vor jedem Upgrade oder destruktiven Befehl. Siehe [Backups](/self-hosting/backups).
:::

## Häufige Operationen

```bash
# Follow the server logs
docker compose logs -f server

# Update to a newer image and recreate
docker compose pull
docker compose up -d

# Stop everything (volumes are kept)
docker compose down
```

## Nächste Schritte

- Setze einen TLS-terminierenden Proxy davor: [Reverse Proxy](/self-hosting/reverse-proxy).
- Stimme Datenbank- und Speicheroptionen ab: [Datenbanken](/self-hosting/databases) und
  [Speicher](/self-hosting/storage).
- Sieh dir jede Einstellung an einem Ort an: [Konfiguration](/self-hosting/configuration).
