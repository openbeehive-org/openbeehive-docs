---
sidebar_position: 10
title: "Aktualisieren"
---

# Aktualisieren

Upgrades sind einfach: Ersetze die Binärdatei oder ziehe ein neues Image, starte neu, und der Server bringt das Datenbankschema von selbst auf den neuesten Stand.

:::caution Sichere jedes Mal zuerst
Erstelle vor dem Upgrade ein Backup. Siehe [Backups](/self-hosting/backups).
:::

## Bevor du beginnst

1. **Lies die Release Notes.** Prüfe das [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) und das [GitHub-Release](https://github.com/openbeehive-org/openbeehive-app/releases) für die Version, auf die du umsteigst. Notiere neue erforderliche Konfiguration oder manuelle Schritte.
2. **Sichere** die Datenbank und den Blob-Speicher.
3. **Notiere deine aktuelle Version** (das Tag, das du gebaut hast, oder das Image-Tag, das du betreibst), damit du weißt, worauf du zurückrollen kannst.
4. **Wähle einen ruhigen Moment.** Der Neustart ist kurz; Geräte arbeiten lokal weiter und synchronisieren, sobald der Server wieder da ist.

## Release-spezifische Schritte

### 0.4.0: Der Container läuft als unprivilegierter Benutzer

Bis 0.3.1 lief das Image als root, daher gehört ein von einem älteren Container angelegtes Volume root, und der 0.4.0-Server (uid `65532`) kann die Datenbank darin nicht öffnen. Korrigiere die Besitzrechte einmalig, bevor du das neue Image startest:

```bash
# named volume from the quick start or docker-compose.demo.yml
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

Das Symptom eines ausgelassenen chown ist `unable to open database file` oder `permission denied` im Server-Log direkt nach dem Start. Kubernetes-Bereitstellungen mit `securityContext.fsGroup: 65532` brauchen keinen manuellen Schritt. Volumes, die von 0.4.0 oder neuer angelegt wurden, haben von Anfang an den richtigen Besitzer.

Das Cloud-Profil (Postgres und MinIO) ist nicht betroffen: Der Server-Container hält keine Daten.

## Wie Migrationen funktionieren

Schema-Migrationen laufen automatisch, wenn der Server startet. Beim Booten wendet der Server ausstehende Migrationen der Reihe nach an und beginnt erst dann, Anfragen zu bedienen. Das funktioniert für PostgreSQL, MySQL und SQLite gleich.

:::note
Der erste Start einer neuen Version kann etwas länger dauern, während das Schema aktualisiert wird. Beobachte die Logs, um zu bestätigen, dass er abschließt, bevor du Verkehr darauf sendest.
:::

## Die einzelne Binärdatei aktualisieren

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Um das neue Release aus dem Quellcode zu bauen, checke sein Tag aus und baue neu:

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

Das erzeugt eine frische `./server/bin/openbeehive`. Die Voraussetzungen stehen unter [Einzelne Binärdatei](/self-hosting/single-binary) (Go 1.27+, Node 24+, buf).

## Mit Docker aktualisieren

Welchen Befehl du brauchst, hängt davon ab, woher das Image kommt.

**Veröffentlichtes Image** (der Einzel-Container per `docker run` aus dem [Schnelleinstieg](/self-hosting/quick-start) oder eine Compose-Datei mit einer `image:`-Zeile wie `docker-compose.demo.yml`):

```bash
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml logs -f server
```

Für einen einfachen `docker run`-Container: `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, dann `docker rm -f openbeehive` und denselben `docker run`-Befehl erneut ausführen. Das benannte Volume behält deine Daten.

**Aus dem Quellcode gebaut** (die `docker-compose.yml` des Repositorys hat einen `build:`-Abschnitt, daher bewirkt `pull` dort nichts):

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

Image-Tags sind `latest`, `X.Y` (neuester Patch eines Minor-Releases) und `X.Y.Z`. Für reproduzierbare Bereitstellungen pinne eine bestimmte Version statt `latest`:

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versionierung

Openbeehive folgt der [semantischen Versionierung](https://semver.org): `MAJOR.MINOR.PATCH`.

| Teil | Bedeutet |
| --- | --- |
| MAJOR | Breaking Changes; lies die Upgrade-Hinweise sorgfältig |
| MINOR | Neue Funktionen, abwärtskompatibel |
| PATCH | Fehlerbehebungen und Sicherheitspatches, abwärtskompatibel |

:::caution 0.x ist frühe Software
Solange Openbeehive in der `0.x`-Serie ist, können Minor-Releases Änderungen enthalten, die manuelle Schritte brauchen oder nicht vollständig abwärtskompatibel sind. Lies die Release Notes für jedes Upgrade und halte deine Backups bereit.
:::

## Zurückrollen

Ein neueres Schema ist möglicherweise nicht von einer älteren Binärdatei lesbar. Sobald Migrationen gelaufen sind, ist ein Herabstufen der Anwendung allein nicht garantiert funktionsfähig. Stelle die Anwendung *und* die Datenbank aus dem Zustand vor dem Upgrade wieder her:

1. Stoppe den Dienst.
2. Stelle die Datenbank (und, falls relevant, den Blob-Speicher) aus dem Backup wieder her, das du vor dem Upgrade erstellt hast.
3. Installiere die vorherige Binär- oder Image-Version erneut.
4. Starte den Dienst und bestätige, dass er sauber hochkommt.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
Stelle keine alte Datenbank unter einer neueren Binärdatei wieder her und betreibe keine neuere Datenbank unter einer älteren Binärdatei, außer für das zusammengehörige Paar, das du gemeinsam gesichert hast. Stelle Binärdatei und Datenbank immer als Einheit wieder her.
:::

## Nach dem Upgrade

- Prüfe die Logs auf Fehler oder Migrationswarnungen.
- Öffne die App und bestätige, dass deine Standorte, Beuten und letzten Durchsichten erscheinen.
- Erfasse etwas auf einem Gerät und bestätige, dass es synchronisiert.

Wenn etwas falsch aussieht, siehe [Fehlerbehebung](/knowledge-base/troubleshooting) und rolle auf dein Backup zurück, während du die Ursache untersuchst.
