---
sidebar_position: 1
title: "Schnelleinstieg"
---

# Schnelleinstieg

Dies ist der schnellste Weg von null zu einer laufenden Openbeehive-Instanz, die du im Browser öffnen kannst. Wähle eine von zwei Routen:

- **Variante A — Einzelne Binärdatei.** Baue eine eigenständige Binärdatei, die SQLite und das lokale Dateisystem nutzt. Kein Docker, kein Datenbankserver, kein Objektspeicher. Ideal für einen Heimserver, einen Raspberry Pi oder einen kleinen VPS.
- **Variante B — Docker.** Lade unser veröffentlichtes Image herunter und starte es mit einem einzigen Befehl.

Beide Routen verwenden das Bereitstellungsprofil **selfhost**, das standardmäßig eine eingebettete SQLite-Datenbank und Blob-Speicher im Dateisystem nutzt. Du kannst später auf PostgreSQL und MinIO/S3 umstellen — siehe [Konfiguration](/self-hosting/configuration).

:::tip Einzelnutzer? Keine Anmeldung nötig
Wenn du die einzige Person bist, die deine Instanz nutzt, kannst du sie **ganz ohne Authentifizierung** betreiben. Lass einfach `BEEHIVE_OIDC_PROVIDERS` leer und behalte `BEEHIVE_WEBAUTHN_ENABLED=false` bei (beides sind die Standardwerte). Die App öffnet direkt deine Aufzeichnungen. Um später eine Anmeldung hinzuzufügen, siehe [Authentifizierung](/self-hosting/authentication).
:::

## Die kleinstmögliche funktionierende Konfiguration

Welche Route du auch wählst, für den Einstieg sind wirklich nur zwei Einstellungen wichtig:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` ist die Adresse, über die Personen (und QR-Code-Deeplinks) die App erreichen. Zum lokalen Testen ist `http://localhost:8080` in Ordnung. Für eine echte Bereitstellung setze sie auf deine öffentliche URL, zum Beispiel `https://bees.example.com`.

Alles andere hat sinnvolle Standardwerte für das Self-Hosting. Die vollständige Liste findest du unter [Konfiguration](/self-hosting/configuration).

## Variante A — Einzelne Binärdatei (kein Docker)

### Voraussetzungen

- Go 1.25 oder neuer
- Node 22 oder neuer
- [buf](https://buf.build/docs/installation)

### Bauen und ausführen

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: set BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Standardmäßig lauscht die Binärdatei auf `:8080` und liefert die Web-App selbst aus (`BEEHIVE_SERVE_WEB=true`), sodass die API und die PWA vom selben Ursprung kommen. Öffne die Adresse aus `BEEHIVE_PUBLIC_BASE_URL` und du bist drin.

:::note Wo deine Daten liegen
Im selfhost-Modus landen deine Aufzeichnungen in einer lokalen SQLite-Datei und hochgeladene Fotos in einem Blob-Verzeichnis (standardmäßig `./data/blobs`). Sichere diese und du hast alles gesichert — siehe [Backups](/self-hosting/backups).
:::

## Variante B — Docker

Wenn du Docker installiert hast, ist dies der schnellste Weg überhaupt. Das veröffentlichte Image ist `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Das Volume `-v openbeehive-data:/data` hält deine SQLite-Datenbank und Blobs außerhalb des Containers, sodass sie Upgrades und Neustarts überstehen. Sobald es läuft, öffne `http://localhost:8080`.

So stoppst oder entfernst du es:

```bash
docker stop openbeehive
docker rm openbeehive
```

:::tip Lieber Cloud-Stack?
Die obigen Befehle starten das schlanke selfhost-Profil. Wenn du das vollständige **cloud**-Profil (PostgreSQL + MinIO) möchtest, liefert das Repository eine Compose-Datei mit — führe `docker compose up -d` aus. Details findest du unter [Docker](/self-hosting/docker).
:::

## Erste Schritte nach der Installation

Du hast nun eine funktionierende Instanz. Von hier aus:

1. Öffne die App unter deiner `BEEHIVE_PUBLIC_BASE_URL` und lege deinen ersten Bienenstand an.
2. Füge einen Bienenstock hinzu, wähle seinen Typ und erfasse eine Durchsicht.
3. Drucke optional ein QR-Etikett für den Bienenstock, damit du im Feld direkt dorthin scannen kannst.

Für eine Tour durch die App selbst gehe zu [Die App verwenden](/category/using-the-app). Um deine Instanz produktionsreif zu machen — HTTPS, eine echte Domain, Authentifizierung und Backups — geht es weiter mit:

- [Konfiguration](/self-hosting/configuration) — jede Umgebungsvariable erklärt
- [Reverse Proxy](/self-hosting/reverse-proxy) — TLS und eine Domain davorschalten
- [Authentifizierung](/self-hosting/authentication) — OIDC-Anmeldung oder Passkeys hinzufügen
- [Backups](/self-hosting/backups) — deine Aufzeichnungen schützen

:::caution In der Produktion HTTPS verwenden
`http://localhost` eignet sich nur zum lokalen Testen. Die App ohne TLS im Internet bereitzustellen, gefährdet deine Daten und beeinträchtigt Funktionen, die einen sicheren Kontext erfordern. Setze `BEEHIVE_PUBLIC_BASE_URL` auf eine `https://`-Adresse und beende TLS an einem Reverse Proxy, bevor du live gehst.
:::
