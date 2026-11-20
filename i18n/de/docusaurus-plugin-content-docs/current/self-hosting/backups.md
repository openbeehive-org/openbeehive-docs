---
sidebar_position: 9
title: "Backups & Wiederherstellung"
---

# Backups & Wiederherstellung

Ein paar Minuten, die du jetzt in die Einrichtung von Backups investierst, ersparen dir später viel Sorge. Diese Seite behandelt, was zu sichern ist, wie man es sicher macht und wie man bei Bedarf wiederherstellt.

:::tip Der Server ist die Quelle der Wahrheit
Jedes Gerät, das deine Instanz nutzt, hält eine lokale Kopie seiner Daten im Browser. Diese Kopie ist eine Bequemlichkeit, kein Backup: Sie kann durch das Löschen von Website-Daten, eine Neuinstallation oder den Verlust des Geräts gelöscht werden.

Für alles, was über Personen oder Geräte hinweg geteilt wird, ist der **Server** die maßgebliche Kopie. Sichere den Server und du schützt die Aufzeichnungen aller auf einmal.
:::

## Was zu sichern ist

Es gibt zwei Dinge auf dem Server, die es wert sind, geschützt zu werden:

| Element | Wo es liegt | Backup-Ziel |
| --- | --- | --- |
| Die Datenbank | SQLite-Datei oder PostgreSQL/MariaDB | Eine konsistente Kopie oder ein Dump |
| Blobs (Fotos in voller Größe) | Lokales Dateisystem oder MinIO/S3 | Das Blob-Verzeichnis oder der Bucket |

Welche Datenbank und welchen Blob-Speicher du hast, hängt von deinem Bereitstellungsprofil ab:

- **`selfhost`** verwendet eine einzelne SQLite-Datei und ein lokales Blob-Verzeichnis (`BEEHIVE_BLOB_DIR`, Standard `./data/blobs`).
- **`cloud`** verwendet Postgres und einen MinIO-/S3-Bucket.

Sichere **sowohl** die Datenbank als auch die Blobs. Die Datenbank enthält deine Bienenstände, Bienenstöcke, Königinnen, Durchsichten, Ereignisse und die Foto-Einträge mit ihren Vorschaubildern; der Blob-Speicher enthält die Bilder in voller Größe. Nach einem Datenbank-Backup ohne seine Blobs zeigen Fotos nur noch ihr Vorschaubild.

:::tip Erst die Datenbank, dann die Blobs
Wenn du sicherst, während der Server läuft, kopiere zuerst die Datenbank und gleich danach die Blobs. Bilder werden einmal geschrieben und nie verändert, daher enthält eine später erstellte Blob-Kopie jedes Bild, das die Datenbank-Kopie kennt. Zusätzliche Bilder, die die wiederhergestellte Datenbank nicht kennt, entfernt die [Pflege](./storage.md#upkeep) des Servers.
:::

## SQLite sichern (selfhost)

SQLite speichert deine Daten in einer Datei (zum Beispiel `openbeehive.db`) plus zwei Begleitdateien, wenn Write-Ahead Logging eingeschaltet ist:

- `openbeehive.db-wal` — kürzliche Änderungen, die noch nicht in die Hauptdatei eingearbeitet sind
- `openbeehive.db-shm` — Shared-Memory-Index für das WAL

:::caution Kopiere die `.db`-Datei nicht allein, während der Server läuft
Mit aktiviertem WAL (die empfohlene Einstellung) können die neuesten Daten noch in der `-wal`-Datei liegen. Ein einfaches `cp openbeehive.db backup.db` einer laufenden Datenbank kann eine inkonsistente oder veraltete Kopie erzeugen.
:::

Du hast zwei sichere Optionen.

### Option A — den Dienst stoppen, dann kopieren

Die einfachste zuverlässige Methode. Stoppe Openbeehive, sodass nichts schreibt, kopiere alle drei Dateien zusammen und starte es dann wieder.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

Die `-wal`- und `-shm`-Dateien existieren möglicherweise nicht, wenn die Datenbank gerade einen Checkpoint durchlaufen hat — das ist in Ordnung, daher das `|| true`.

### Option B — WAL-sicheres Online-Backup (keine Ausfallzeit)

Das SQLite-Kommandozeilen-Tool kann einen konsistenten Snapshot erstellen, während der Server weiterläuft, unter Verwendung der eingebauten Backup-API:

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

Dies schreibt eine einzige, eigenständige `.db`-Datei, die bereits alles aus dem WAL enthält, sodass du die `-wal`- oder `-shm`-Dateien **nicht** daneben kopieren musst. Dies ist der empfohlene Ansatz für unbeaufsichtigte Backups.

## Postgres sichern (cloud)

Verwende `pg_dump`, um einen logischen Dump zu erzeugen. Er ist konsistent, ohne den Dienst zu stoppen.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

Das Custom-Format komprimiert gut und stellt mit `pg_restore` wieder her. Für MariaDB ist das Äquivalent `mariadb-dump --single-transaction`.

## Blobs sichern

### Lokales Dateisystem

Kopiere das Blob-Verzeichnis. Dateien hier werden einmal geschrieben und nicht an Ort und Stelle verändert, sodass eine rekursive Kopie auch während des Serverbetriebs sicher ist (gelöschte Fotos verschwinden daraus, daher `--delete`):

```bash
rsync -a --delete ./data/blobs/ /backups/blobs/
```

### MinIO / S3

Spiegele den Bucket mit dem MinIO-Client oder der AWS CLI:

```bash
mc mirror --overwrite myminio/openbeehive /backups/blobs/
# or
aws s3 sync s3://openbeehive /backups/blobs/
```

Wenn du einen verwalteten S3-kompatiblen Speicher verwendest, kannst du dich auch auf dessen eigene Versionierungs- oder Lebenszyklus-Richtlinien als zweite Verteidigungslinie verlassen.

## Wiederherstellen \{#restoring}

Eine Wiederherstellung folgt immer denselben drei Schritten: den Server **stoppen**, **Datenbank und Blobs zusammen** aus demselben Backup wiederherstellen, den Server **starten**. Lass den Server zwischendurch keine Anfragen beantworten: Er muss auf der wiederhergestellten Datenbank starten, bevor irgendein Gerät synchronisiert, denn an diesem Start erkennt er die Wiederherstellung (siehe [nach einer Wiederherstellung](#after-a-restore)).

### SQLite

```bash
systemctl stop openbeehive

cp /backups/openbeehive.db ./openbeehive.db
rm -f ./openbeehive.db-wal ./openbeehive.db-shm   # let SQLite rebuild these
rsync -a --delete /backups/blobs/ ./data/blobs/

systemctl start openbeehive
```

Entferne alle veralteten `-wal`-/`-shm`-Dateien vor dem Start, damit SQLite sauber aus der wiederhergestellten Datei öffnet.

### Postgres

```bash
systemctl stop openbeehive

pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
mc mirror --overwrite --remove /backups/blobs/ myminio/openbeehive   # blob directory: rsync as above

systemctl start openbeehive
```

Mit Docker Compose treten `docker compose stop server` und `docker compose start server` an die Stelle von `systemctl`.

### Was Geräte nach einer Wiederherstellung tun \{#after-a-restore}

Eine wiederhergestellte Datenbank ist älter als das, was manche Geräte schon gesehen haben. Der Server bemerkt das bei der nächsten Synchronisierung jedes Geräts, und die App behebt es selbst:

- **Aktualisierte Apps (ab 0.5.0), die über den Stand des Backups hinaus synchronisiert hatten,** laden jede Aufzeichnung, die sie haben, erneut hoch, zusammen mit den Fotos, die sie noch vorhalten, und laden dann den aktuellen Stand vom Server. Änderungen, die das Backup verloren hat, kommen so zurück; wo der Server eine Änderung noch hat, passiert nichts. Die App zeigt "Die Daten des Servers wurden zurückgesetzt oder wiederhergestellt. Dieses Gerät hat seine Einträge erneut gesendet und den aktuellen Stand geladen."
- **Geräte, die nicht über den Stand des Backups hinaus synchronisiert hatten,** machen ganz normal weiter.
- **Installierte 0.4.x-Apps** bekommen kein solches Signal und laden nichts erneut hoch. Eine, deren Position hinter der wiederhergestellten Datenbank liegt, liest die Daten noch einmal von vorn. Was nur ein solches Gerät hatte, wird nicht wiederhergestellt; aktualisiere also die App auf jedem Gerät, bevor du dich darauf verlässt.

Änderungen, die auf einem Gerät gemacht wurden, während der Server nicht lief, werden wie gewohnt hochgeladen, sobald er wieder da ist.

## Ein einfacher Cron-Zeitplan

Ein nächtlicher Job, der die Datenbank snapshot und die Blobs spiegelt, reicht für die meisten Self-Hoster aus. Füge dies mit `crontab -e` zu deiner Crontab hinzu:

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

Die `%`-Zeichen müssen innerhalb der Crontab als `\%` maskiert werden. Für Postgres tausche den `sqlite3`-Aufruf gegen den oben gezeigten `pg_dump`-Befehl. Die Datenbank wird zuerst kopiert und die Blobs gleich danach, wie oben empfohlen.

## Exporte sind keine Server-Backups

**Einstellungen → Daten & Backup** in der App lädt einen Arbeitsbereich als JSON herunter oder als ZIP mit Fotos; die Kopie des Servers gibt es auch unter `GET /export` (siehe [Import & Export](../using-the-app/import-export.md)). Ein solcher Export eignet sich, um einen Arbeitsbereich umzuziehen oder eine eigene Kopie zu behalten, enthält aber nur einen Arbeitsbereich, ohne Konten, Mitglieder oder API-Schlüssel. Für eine ganze Instanz sichere die Datenbank und die Blobs wie oben beschrieben.

:::tip Teste deine Wiederherstellungen
Ein Backup, das du nie wiederhergestellt hast, ist nur eine Hoffnung. Stelle hin und wieder in ein Wegwerf-Verzeichnis oder eine Test-Instanz wieder her und bestätige, dass du die App öffnen und deine Bienenstöcke sehen kannst. Behalte mindestens ein paar Tage datierter Kopien und bewahre eine außer Haus auf (eine externe Festplatte oder ein entfernter Bucket).
:::
