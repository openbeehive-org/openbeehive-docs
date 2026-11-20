---
sidebar_position: 2
title: "Einzelne Binärdatei"
---

# Einzelne Binärdatei

Der einfachste Weg, Openbeehive auf der eigenen Maschine zu betreiben, ist die **einzelne Binärdatei**. Im `selfhost`-Profil liefert Openbeehive die Web-App und die API aus einem Prozess aus, speichert seine Daten in einer lokalen SQLite-Datei und legt hochgeladene Fotos im Dateisystem ab. Kein Docker, kein Postgres, kein Objektspeicher - nur eine einzige ausführbare Datei.

Diese Seite führt dich durch das Bauen dieser Binärdatei aus dem Quellcode und das Ausführen als langlebigen Dienst.

:::tip[Wenig Zeit?]
Wenn du lieber ein vorgefertigtes Container-Image herunterladen möchtest, siehe [Docker](./docker.md). Um beide Ansätze zunächst zu vergleichen, beginne bei der [Self-Hosting-Übersicht](/category/self-hosting).
:::

## Voraussetzungen

Du benötigst einige Build-Werkzeuge auf der Maschine, die die Binärdatei kompiliert:

| Werkzeug | Version | Zweck |
| --- | --- | --- |
| Go | 1.27+ | Kompiliert den Server |
| Node.js | 24+ | Baut die SvelteKit-Web-App |
| buf | durch `make tools` festgelegt | Generiert den Connect-RPC-Code aus den Protobuf-Definitionen |

Einmal gebaut, hat die Binärdatei selbst keine Laufzeitabhängigkeiten - du kannst sie auf einen Server kopieren, auf dem keines der oben genannten Werkzeuge installiert ist.

## Den Code beziehen

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Konfigurieren

Der Server wird über Umgebungsvariablen konfiguriert und liest eine `.env`-Datei aus dem Verzeichnis, in dem er gestartet wird. Variablen, die bereits in der Umgebung gesetzt sind, haben Vorrang vor der Datei. Kopiere die Beispieldatei:

```bash
cp .env.example .env
```

Für eine private Einzelnutzer-Instanz sind die eingebauten Standardwerte einsatzbereit; auf diese kommt es an:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
# Defaults of the selfhost profile:
# BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
# BEEHIVE_BLOB_DIR=./data/blobs
```

:::note[Standardmäßig keine Anmeldung]
Das selfhost-Profil aktiviert keine Anmeldemethode: `BEEHIVE_PASSWORD_AUTH` ist aus, `BEEHIVE_OIDC_PROVIDERS` ist leer und `BEEHIVE_WEBAUTHN_ENABLED=false`. Jeder, der den Port erreichen kann, hat dann vollen Zugriff, und der Server antwortet nur auf `localhost`, IP-Adressen und den Host aus `BEEHIVE_PUBLIC_BASE_URL` (weitere Namen ergänzt du mit `BEEHIVE_ALLOWED_HOSTS`). Wenn du Konten, Passkeys oder einen Provider möchtest, siehe [Authentifizierung](./authentication.md); jede Anmeldemethode braucht ein `BEEHIVE_SESSION_SECRET` von mindestens 32 Bytes (`openssl rand -base64 32`).
:::

Wenn du die Instanz von einem anderen Gerät in deinem Netzwerk erreichen möchtest, setze `BEEHIVE_PUBLIC_BASE_URL` auf die Adresse, die dieses Gerät öffnet (zum Beispiel `http://192.168.1.20:8080` oder deine Domain hinter einem [Reverse Proxy](./reverse-proxy.md)), und schalte die Anmeldung ein. QR-Etiketten kodieren die Adresse, unter der du die App öffnest, also verwende durchgehend dieselbe Adresse.

## Bauen

Generiere den Protobuf-Code, dann kompiliere:

```bash
make proto
make build
```

Dies erzeugt eine einzige ausführbare Datei:

```text
./server/bin/openbeehive
```

Die Web-App ist in die Binärdatei eingebettet, sodass daneben nichts weiter bereitgestellt werden muss.

## Ausführen

Aus dem Wurzelverzeichnis des Repositorys, wo `.env` liegt:

```bash
./server/bin/openbeehive
```

Beim ersten Start tut der Server Folgendes:

- wendet `.env` an und protokolliert das Profil, die Datenbank und ob eine Anmeldung erforderlich ist,
- erstellt die SQLite-Datenbankdatei `openbeehive.db` und führt ihre Migrationen aus,
- erstellt das Verzeichnis `./data/` (mit `./data/blobs` für Fotos),
- liefert die Web-App und die Connect-RPC-API auf `:8080` aus.

Öffne `http://localhost:8080` in deinem Browser. Die App lädt, baut ihre lokale Datenbank im Browser auf, und du bist bereit, deinen ersten Bienenstand anzulegen.

:::tip[Das Arbeitsverzeichnis ist entscheidend]
Relative Pfade wie `file:openbeehive.db` und `./data/blobs` werden relativ zu dem Verzeichnis aufgelöst, aus dem die Binärdatei gestartet wird, nicht zu dem Ort, an dem die Binärdatei liegt, und `.env` wird aus demselben Verzeichnis gelesen. Wähle ein Arbeitsverzeichnis bewusst - die systemd-Unit weiter unten setzt es explizit mit `WorkingDirectory`.
:::

## Als systemd-Dienst ausführen

Für eine dauerhaft laufende Instanz betreibe Openbeehive unter systemd, damit es beim Booten startet und bei Fehlern neu startet.

Platziere zunächst die Binärdatei und ein Arbeitsverzeichnis an einem sinnvollen Ort und erstelle einen dedizierten Benutzer:

```bash
sudo useradd --system --home /opt/openbeehive --shell /usr/sbin/nologin openbeehive
sudo mkdir -p /opt/openbeehive
sudo cp server/bin/openbeehive /opt/openbeehive/
sudo cp .env /opt/openbeehive/
sudo chown -R openbeehive:openbeehive /opt/openbeehive
```

Erstelle dann die Unit-Datei unter `/etc/systemd/system/openbeehive.service`:

```text
[Unit]
Description=Openbeehive beekeeping records
After=network.target

[Service]
Type=simple
User=openbeehive
Group=openbeehive
WorkingDirectory=/opt/openbeehive
ExecStart=/opt/openbeehive/openbeehive
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/openbeehive
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Die Unit braucht kein `EnvironmentFile`: Der Server liest `/opt/openbeehive/.env` selbst, weil das sein Arbeitsverzeichnis ist. Halte die Datei nur für den Benutzer `openbeehive` lesbar (`chmod 600`), denn sie enthält das Session-Secret und das Admin-Passwort.

Aktiviere und starte ihn:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Prüfe, dass er gesund ist, und beobachte die Logs:

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution[An Port 80 oder 443 binden]
Das Beispiel bindet an `:8080`, was ein nicht privilegierter Benutzer verwenden kann. Betreibe den Dienst nicht als root, um die Ports 80/443 zu erreichen - belasse Openbeehive stattdessen auf `:8080` und setze einen [Reverse Proxy](./reverse-proxy.md) (etwa Caddy oder nginx) davor, der TLS und den öffentlichen Port übernimmt.
:::

## Wo deine Daten liegen

Im `selfhost`-Profil wird alles unter dem von dir gewählten Arbeitsverzeichnis gespeichert (oben `/opt/openbeehive`):

| Was | Standardspeicherort | Festgelegt durch |
| --- | --- | --- |
| Aufzeichnungsdatenbank | `openbeehive.db` (plus `-wal` / `-shm` Dateien) | `BEEHIVE_DATABASE_DSN` |
| Fotos und Anhänge | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

Die Dateien `-wal` und `-shm` neben der Datenbank sind das Write-Ahead-Log von SQLite; behandle sie als Teil der Datenbank.

## Daten verschieben oder sichern

Da der gesamte Zustand aus Dateien in einem Verzeichnis besteht, ist das Umziehen einer Instanz größtenteils eine Kopieraufgabe:

1. Stoppe den Dienst, damit die Datenbank ruht: `sudo systemctl stop openbeehive`.
2. Kopiere die Binärdatei, `.env`, die Datenbankdateien und das Verzeichnis `data/` auf die neue Maschine und erhalte das Layout.
3. Starte den Dienst auf dem neuen Host: `sudo systemctl start openbeehive`.

:::danger[Stoppe immer zuerst den Dienst]
Das Kopieren von `openbeehive.db` während der Server läuft, kann einen zerrissenen, inkonsistenten Snapshot erfassen. Stoppe den Dienst (oder verwende ein ordentliches Backup-Verfahren), bevor du Datenbankdateien kopierst.
:::

Für geplante Backups, Aufbewahrung und sichere Live-Backup-Techniken für SQLite siehe [Backups](./backups.md).

## Aktualisieren

Um auf eine neuere Version umzusteigen, ziehe den aktuellen Code, baue neu und ersetze die Binärdatei - deine Datenbank und das Verzeichnis `data/` bleiben, wo sie sind, und die Migrationen laufen beim nächsten Start. Das vollständige Verfahren, einschließlich wie man zurückrollt, wird unter [Aktualisieren](./upgrading.md) behandelt.
