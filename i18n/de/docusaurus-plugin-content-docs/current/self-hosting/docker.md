---
sidebar_position: 3
title: "Docker & Compose"
---

# Docker & Compose

Betreibe Openbeehive als einzelnen Container für ein Self-Host-Setup oder fahre PostgreSQL, MinIO und den Server zusammen mit Docker Compose hoch. Das Repository liefert für jeden Fall eine Compose-Datei mit:

| Datei | Was sie betreibt | Wofür |
| --- | --- | --- |
| `docker-compose.selfhost.yml` | Ein Container, SQLite und Dateien auf einem benannten Volume | Ein Imker oder ein Haushalt auf einer Maschine |
| `docker-compose.prod.yml` | Das veröffentlichte Image mit PostgreSQL und MinIO, Anmeldung immer aktiv | Eine Instanz mit mehreren Nutzern |
| `docker-compose.yml` | PostgreSQL, MinIO und ein aus dem Checkout gebauter Server | Entwicklung. Keine Vorlage für die Produktion |
| `docker-compose.demo.yml` | Wie die Produktionsdatei plus die öffentliche, schreibgeschützte Demo | Die gehostete Instanz unter `app.openbeehive.org`. Keine Vorlage für deinen eigenen Server |

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
Für eine Einzelnutzer-Instanz auf einer Maschine ist die [einzelne Binärdatei](./single-binary.md) sogar noch einfacher als Docker. Greife zur Compose-Datei für die Produktion, wenn mehrere Personen die Instanz nutzen.
:::

## Den einzelnen Container ausführen

Ein Container mit dem `selfhost`-Profil hält eine SQLite-Datenbank und die hochgeladenen Dateien auf einem einzigen eingehängten Volume. Mehr ist nicht erforderlich.

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 127.0.0.1:8080:8080` veröffentlicht den Port nur auf dieser Maschine. Ohne Anmeldung hat jeder, der den Port erreichen kann, vollen Zugriff; veröffentliche ihn deshalb erst im Netzwerk (`-p 8080:8080`), nachdem du die [Anmeldung eingeschaltet](./quick-start.md#turn-login-on) hast.
- `-v openbeehive-data:/data` hält deine Daten auf einem benannten Volume. `/data` ist das Arbeitsverzeichnis, sodass die Standardwerte (`openbeehive.db`, `./data/blobs`) auf dem Volume landen. Docker legt das Volume mit den Besitzrechten von `/data` aus dem Image an, sodass der unprivilegierte Server-Benutzer darauf schreiben kann. Wenn du stattdessen ein Host-Verzeichnis per Bind-Mount einhängst (`-v /srv/openbeehive:/data`), muss es der uid `65532` gehören: `sudo chown -R 65532:65532 /srv/openbeehive`.
- Ein Server ohne Anmeldung antwortet nur auf `localhost`, IP-Adressen und den Host aus `BEEHIVE_PUBLIC_BASE_URL`. Wenn du ihn unter einem anderen Namen öffnest (zum Beispiel `http://nas.local:8080`), setze `BEEHIVE_PUBLIC_BASE_URL` auf diese Adresse oder trage den Namen in `BEEHIVE_ALLOWED_HOSTS` ein.

### Dasselbe als Compose-Datei

`docker-compose.selfhost.yml` ist der Befehl von oben mit einer Restart-Policy und einem Healthcheck. Sie bezieht ihre Einstellungen aus einer `.env`-Datei neben ihr:

```bash
# .env (all optional; without it the instance has no login and is published on 127.0.0.1)
BEEHIVE_BIND=0.0.0.0                              # publish on the network
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org  # the address people open
BEEHIVE_PASSWORD_AUTH=true                        # require sign-in
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please           # 8+ characters
BEEHIVE_SESSION_SECRET=...                        # openssl rand -base64 32
BEEHIVE_TRUST_PROXY_HEADERS=true                  # only behind a reverse proxy
```

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Mit einfachem `docker run` übergibst du dieselben Variablen mit `-e` oder `--env-file openbeehive.env`. Jede Anmeldemethode braucht `BEEHIVE_SESSION_SECRET` (32 Bytes oder mehr; einmal generieren und stabil halten, eine Änderung meldet alle ab). Siehe [Authentifizierung](./authentication.md).

## Mehrere Nutzer: PostgreSQL und MinIO \{#several-users}

`docker-compose.prod.yml` betreibt das veröffentlichte Image im `cloud`-Profil mit PostgreSQL und MinIO. Die Anmeldung ist immer aktiv (E-Mail und Passwort), die Registrierung ist geschlossen, solange du sie nicht öffnest, und nur der App-Port wird veröffentlicht, auf `127.0.0.1`, für deinen [Reverse Proxy](./reverse-proxy.md). PostgreSQL und MinIO werden überhaupt nicht veröffentlicht.

Die Datei startet erst, wenn jedes Secret gesetzt ist. Trage sie in eine `.env`-Datei neben ihr ein:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org
BEEHIVE_SESSION_SECRET=...      # openssl rand -base64 32
POSTGRES_PASSWORD=...           # openssl rand -hex 24
MINIO_ROOT_PASSWORD=...         # openssl rand -hex 24
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=...      # 8+ characters; applied again on every start
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

Optionale Einstellungen, die die Datei durchreicht: `BEEHIVE_REGISTRATION` (Standard `false`, nur auf Einladung), die `BEEHIVE_SMTP_*`-Variablen für Einladungs- und Verifizierungs-E-Mails sowie `BEEHIVE_BIND` (setze es nur dann auf `0.0.0.0`, wenn der Reverse Proxy auf einer anderen Maschine läuft, und stelle sicher, dass sonst nichts den Port erreichen kann).

Die Datei setzt `BEEHIVE_TRUST_PROXY_HEADERS=true`, weil sie genau einen Reverse Proxy davor erwartet. Betreibe genau eine Server-Instanz pro Datenbank.

### Die Dienste

| Dienst | Image | Rolle |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app` (festgelegtes Release) | Backend und Web-App auf `:8080` |
| `postgres` | `postgres:18-alpine` | Datenbank |
| `minio` | `minio/minio` | S3-kompatibler Blob-Speicher |

`server` wartet, bis `postgres` und `minio` sich als gesund melden.

:::note Dienstnamen sind Hostnamen
Innerhalb des Compose-Netzwerks erreichen Container einander über den Dienstnamen. Deshalb zeigt der DSN auf `postgres` und der MinIO-Endpunkt auf `minio`.
:::

### Der Entwicklungs-Stack

`docker-compose.yml` baut den Server aus dem Checkout und veröffentlicht PostgreSQL (`5432`) und MinIO (`9000`, `9001`) auf `127.0.0.1` für lokale Werkzeuge. Sie braucht `BEEHIVE_SESSION_SECRET`, `MINIO_ROOT_PASSWORD`, `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` in `.env`. OIDC ist optional: Setze `BEEHIVE_OIDC_PROVIDERS` zusammen mit dem Issuer und der Client-ID des Providers. Sie ist dafür gedacht, an Openbeehive zu arbeiten, nicht dafür, es zu betreiben.

```bash
cp .env.example .env   # then add the four values above
docker compose up -d --build
```

Die vollständige Liste der Variablen findest du unter [Konfiguration](./configuration.md).

## Deine Daten persistieren

- **Einzelner Container (`selfhost`):** Alles liegt unter `/data` auf dem Volume `openbeehive-data`.
- **PostgreSQL und MinIO:** Aufzeichnungen liegen im Volume `pg` und hochgeladene Dateien im Volume `minio`. Der Server-Container ist zustandslos und kann frei ersetzt werden.

:::danger Vor dem Upgrade sichern
Benannte Volumes überstehen `docker compose up` und Image-Upgrades, aber nicht `docker compose down -v` oder ein entferntes Volume. Erstelle vor jedem Upgrade oder destruktiven Befehl ein Backup. Siehe [Backups](./backups.md).
:::

## Häufige Operationen

```bash
# Follow the server logs
docker compose -f docker-compose.prod.yml logs -f server

# Pull the image named in the Compose file and recreate
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rebuild the development stack from updated source
git pull && docker compose up -d --build

# Stop everything (volumes are kept)
docker compose -f docker-compose.prod.yml down
```

Die Compose-Dateien legen ein Release per Tag und Digest fest. Um auf ein neueres Release zu wechseln, aktualisiere die Datei aus dem Repository (oder ändere den Tag) und folge [Aktualisieren](./upgrading.md).
