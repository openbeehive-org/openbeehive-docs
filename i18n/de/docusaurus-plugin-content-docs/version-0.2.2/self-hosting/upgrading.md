---
sidebar_position: 10
title: "Aktualisieren"
---

# Aktualisieren

Deine Openbeehive-Instanz aktuell zu halten, bedeutet neue Funktionen, Fehlerbehebungen und Sicherheitspatches. Upgrades sind bewusst einfach: Ersetze die Binärdatei oder ziehe ein neues Image, starte neu, und der Server bringt deine Datenbank von selbst auf den neuesten Stand.

Diese Seite behandelt die sichere Upgrade-Routine, die Versionsnummerierung und wie man zurückrollt, falls etwas schiefgeht.

:::caution Sichere jedes Mal zuerst
Erstelle vor jedem Upgrade immer ein Backup. Es dauert nur einen Moment und ist das Eine, das aus einem schlechten Upgrade einen Nicht-Vorfall macht. Siehe [Backups](/self-hosting/backups) dafür, wie du deine Datenbank und deinen Blob-Speicher snapshot.
:::

## Bevor du beginnst

Ein gutes Upgrade dauert fünf Minuten und etwas Lesen:

1. **Lies die Release Notes.** Prüfe das [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app) und das GitHub-Release für die Version, auf die du umsteigst. Notiere alle Breaking Changes, neue erforderliche Konfiguration oder manuelle Schritte.
2. **Sichere** deine Datenbank und deinen Blob-Speicher.
3. **Notiere deine aktuelle Version**, damit du weißt, worauf du bei Bedarf zurückrollen kannst.
4. **Wähle einen ruhigen Moment.** Upgrades beinhalten einen kurzen Neustart. Da die App offline-first ist, arbeitet jeder, der sie nutzt, lokal weiter und synchronisiert, sobald der Server wieder da ist.

## Wie Migrationen funktionieren

Datenbank-Schema-Migrationen laufen **automatisch**, wenn der Server startet. Es gibt keinen separaten Migrate-Befehl zu merken.

Beim Booten prüft der Server die in deiner Datenbank festgehaltene Schemaversion, wendet ausstehende Migrationen der Reihe nach an und beginnt erst dann, Anfragen zu bedienen. Dies funktioniert über alle unterstützten Treiber hinweg gleich (PostgreSQL, MySQL und SQLite).

:::note
Da Migrationen beim Start laufen, kann der allererste Start einer neuen Version etwas länger als gewöhnlich dauern, während das Schema aktualisiert wird. Beobachte die Logs, um zu bestätigen, dass er sauber abschließt, bevor du Verkehr darauf sendest.
:::

## Die einzelne Binärdatei aktualisieren

Wenn du den einzelnen `selfhost`-Build betreibst, ist ein Upgrade ein Dateitausch.

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp ./server/bin/openbeehive ./server/bin/openbeehive.bak
# (also back up your SQLite database + blob directory — see Backups)

# 3. Replace the binary with the new release, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Stattdessen aus dem Quellcode bauen? Ziehe das neue Tag und baue neu:

```bash
git fetch --tags
git checkout v0.1.0
make proto && make build
```

Dies erzeugt eine frische `./server/bin/openbeehive`. Siehe [Einzelne Binärdatei](/self-hosting/single-binary) für die vollständigen Build-Voraussetzungen (Go 1.25+, Node 22+, buf).

## Mit Docker aktualisieren

Für das `cloud`-Profil (oder jede Docker-Bereitstellung) ziehe das neue Image und erstelle den Container neu.

```bash
# 1. Pull the new image
docker compose pull

# 2. Recreate containers with the new image
docker compose up -d

# 3. Follow the logs to confirm a clean start and migrations
docker compose logs -f openbeehive
```

Das veröffentlichte Image ist `ghcr.io/openbeehive-org/openbeehive-app:latest`. Für reproduzierbare Bereitstellungen pinne ein bestimmtes Versions-Tag statt `latest`, damit du immer genau weißt, was läuft.

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:v0.1.0
```

Siehe [Docker](/self-hosting/docker) für das vollständige Compose-Setup.

## Versionierung

Openbeehive folgt der [semantischen Versionierung](https://semver.org): `MAJOR.MINOR.PATCH`.

| Teil | Beispiel | Bedeutet |
| --- | --- | --- |
| MAJOR | `1.0.0` | Breaking Changes; lies die Upgrade-Hinweise sorgfältig |
| MINOR | `0.2.0` | Neue Funktionen, abwärtskompatibel |
| PATCH | `0.1.1` | Fehlerbehebungen und Sicherheitspatches, abwärtskompatibel |

Das aktuelle Release ist **v0.1.0**, das erste öffentliche Release.

:::caution v0.1.x ist frühe Software
Solange Openbeehive in der `0.x`-Serie ist, können Minor-Releases Änderungen enthalten, die manuelle Schritte benötigen oder die nicht vollständig abwärtskompatibel sind. Lies die Release Notes für jedes Upgrade, nicht nur für Major-Releases, und halte deine Backups bereit.
:::

## Zurückrollen

Wenn ein Upgrade Probleme macht, rolle auf die Version zurück, von der du kamst.

Die wichtige Regel: **Ein neueres Schema ist möglicherweise nicht von einer älteren Binärdatei lesbar.** Sobald Migrationen gelaufen sind, ist ein einfaches Herabstufen der Anwendung nicht garantiert funktionsfähig. Der zuverlässige Weg zurückzurollen ist, sowohl die Anwendung *als auch* die Datenbank aus dem Zustand vor dem Upgrade wiederherzustellen.

1. Stoppe den Dienst.
2. Stelle die Datenbank (und, falls relevant, den Blob-Speicher) aus dem Backup wieder her, das du vor dem Upgrade erstellt hast. Siehe [Backups](/self-hosting/backups).
3. Installiere die vorherige Binär- oder Image-Version erneut.
4. Starte den Dienst und bestätige, dass er sauber hochkommt.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit your compose file to the previous tag, e.g. v0.1.0
docker compose up -d
```

:::danger
Stelle keine alte Datenbank unter einer neueren Binärdatei wieder her und betreibe keine neuere Datenbank unter einer älteren Binärdatei, außer für das zusammengehörige Paar, das du gemeinsam gesichert hast. Nicht zusammenpassendes Schema und Code können Daten beschädigen. Stelle immer die Binärdatei und die Datenbank als Einheit wieder her.
:::

## Nach dem Upgrade

- Prüfe die Logs auf Fehler oder Migrationswarnungen.
- Öffne die App und bestätige, dass deine Bienenstände, Bienenstöcke und letzten Durchsichten wie erwartet erscheinen.
- Löse von einem Client-Gerät eine Synchronisation aus und bestätige, dass Änderungen in beide Richtungen fließen.

Wenn etwas falsch aussieht, siehe [Fehlerbehebung](/knowledge-base/troubleshooting), und zögere nicht, auf dein Backup zurückzurollen, während du untersuchst.
