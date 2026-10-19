---
sidebar_position: 5
title: "Datenbanken"
---

# Datenbanken

Openbeehive speichert all seine serverseitigen Daten in einer relationalen Datenbank. Das Backend ist datenbankagnostisch: Es spricht mit einer austauschbaren Speicherschicht und liefert Treiber für **SQLite**, **PostgreSQL** und **MySQL** mit. Du wählst mit zwei Umgebungsvariablen, welche verwendet wird.

Diese Seite erklärt, wie du die richtige Datenbank für deine Situation auswählst und sie korrekt konfigurierst.

:::note Wo liegen die Offline-Daten?
Die App auf deinem Telefon oder Laptop hält ihre eigene lokale SQLite-WASM-Datenbank und funktioniert vollständig offline. Die hier beschriebene Server-Datenbank ist die zentrale Kopie, mit der Geräte im Hintergrund synchronisieren. Es sind getrennte Speicher; diese Seite befasst sich nur mit dem Server.
:::

## Die zwei Einstellungen

Jede Datenbank wird über dasselbe Variablenpaar konfiguriert:

| Variable | Zweck |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Welche Engine verwendet werden soll: `sqlite`, `postgres` oder `mysql`. |
| `BEEHIVE_DATABASE_DSN` | Die Verbindungszeichenfolge (Data Source Name) für diese Engine. |

Das `selfhost`-Bereitstellungsprofil nutzt standardmäßig SQLite, und das `cloud`-Profil nutzt standardmäßig PostgreSQL. Du kannst beide überschreiben, indem du diese zwei Variablen explizit setzt. Siehe [Konfiguration](/self-hosting/configuration) für die vollständige Liste der Umgebungsvariablen.

## Welche Datenbank soll ich wählen?

| Situation | Empfohlen |
| --- | --- |
| Einzelner Imker, ein Server, einfachstmögliches Setup | **SQLite** |
| Einige Haushaltsmitglieder, die Bienenstände teilen | SQLite oder PostgreSQL |
| Viele Nutzer, hohe gleichzeitige Synchronisation oder gehostete/Cloud-Bereitstellung | **PostgreSQL** |
| Du betreibst bereits MySQL/MariaDB und möchtest eine Sache weniger zu betreiben haben | **MySQL** |

:::tip Kurz gesagt
Im Zweifel nutze SQLite. Es braucht keinen separaten Dienst, lebt in einer einzigen Datei und ist vollkommen in der Lage, eine persönliche oder Familien-Imkerei zu betreiben. Wechsle zu PostgreSQL, wenn du echte Mehrbenutzer-Gleichzeitigkeit hast oder verwaltetes Cloud-Hosting möchtest.
:::

## SQLite (Standard für Self-Host)

SQLite ist die Wahl ohne Abhängigkeiten. Es gibt keinen Datenbankserver zu installieren oder zu verwalten: Deine Daten liegen in einer Datei auf der Festplatte, was [Backups](/self-hosting/backups) so einfach macht wie das Kopieren dieser Datei.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
```

Der Teil `_pragma=journal_mode(WAL)` aktiviert **Write-Ahead Logging**. WAL lässt Leser und einen Schreiber gleichzeitig arbeiten, ohne sich gegenseitig zu blockieren, was das Verhalten merklich verbessert, wenn mehrere Geräte gleichzeitig synchronisieren. Wir empfehlen dringend, es eingeschaltet zu lassen.

Ein paar nützliche Pragmas, die du hinzufügen kannst (trenne sie mit `&`):

```bash
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)
```

- `journal_mode(WAL)` — gleichzeitige Lesevorgänge neben einem Schreiber.
- `busy_timeout(5000)` — warte bis zu 5 Sekunden auf eine Sperre, statt sofort fehlzuschlagen.

Du kannst einen relativen Pfad (aufgelöst relativ zum Arbeitsverzeichnis des Servers) oder einen absoluten Pfad wie `file:/var/lib/openbeehive/openbeehive.db?_pragma=journal_mode(WAL)` verwenden.

:::caution WAL erzeugt zusätzliche Dateien
Im WAL-Modus hält SQLite Begleitdateien neben der Hauptdatenbank (`openbeehive.db-wal` und `openbeehive.db-shm`). Wenn du per Dateikopie sicherst, stoppe zuerst den Server oder verwende SQLites eigenes Backup-Werkzeug, damit du einen konsistenten Snapshot erfasst. Siehe [Backups](/self-hosting/backups).
:::

## PostgreSQL

PostgreSQL ist die richtige Wahl für Mehrbenutzer-Setups, den gehosteten Dienst und jede Bereitstellung, bei der viele Geräte gleichzeitig synchronisieren. Es ist auch der Standard für das `cloud`-Profil.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

Ein realistischeres Beispiel, das auf eine Datenbank namens `openbeehive` zeigt:

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

Der Parameter `sslmode` steuert die Transportsicherheit:

| Wert | Bedeutung |
| --- | --- |
| `disable` | Kein TLS. In Ordnung für eine Datenbank auf demselben Host oder in einem vertrauenswürdigen privaten Netzwerk. |
| `require` | Verschlüssele die Verbindung (keine Zertifikatsprüfung). |
| `verify-full` | Verschlüssele und überprüfe das Serverzertifikat und den Hostnamen. Am stärksten. |

:::caution Produktionssicherheit
Verwende `sslmode=require` oder stärker, wann immer die Datenbank über ein Netzwerk mit dem Server spricht, das du nicht vollständig kontrollierst. Reserviere `sslmode=disable` für rein lokale Verbindungen.
:::

Erstelle die Datenbank und den Benutzer vor dem ersten Start, zum Beispiel:

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MySQL

MySQL (und MariaDB) werden für diejenigen unterstützt, die bereits eines betreiben. Das DSN-Format unterscheidet sich von PostgreSQL: Es verwendet die Syntax des Go-MySQL-Treibers.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=user:pass@tcp(host:3306)/openbeehive?parseTime=true
```

Der Parameter `parseTime=true` ist **erforderlich**. Er weist den Treiber an, `DATE`- und `DATETIME`-Spalten als ordentliche Zeitwerte statt als rohe Bytes zurückzugeben, worauf sich Openbeehive für Zeitstempel und die Behandlung der Hybrid Logical Clock stützt. Lässt du ihn weg, kommt es zu Fehlern.

Ein vollständigeres Beispiel mit UTF-8 und einem sinnvollen Standardstandort:

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive?parseTime=true&charset=utf8mb4&loc=UTC
```

Erstelle zuerst die Datenbank und den Benutzer:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

## Migrationen laufen automatisch

Du führst Migrationen nicht von Hand aus. Bei jedem Start prüft der Server das Schema und wendet ausstehende Migrationen an, bevor er beginnt, Anfragen zu bedienen. Eine frische, leere Datenbank wird beim ersten Start automatisch eingerichtet.

Das SQL ist portabel geschrieben, sodass dasselbe Schema über alle drei Engines hinweg funktioniert; es gibt kein engine-spezifisches Setup über das oben gezeigte Erstellen von Datenbank und Benutzer hinaus.

:::tip Vor dem Upgrade immer sichern
Da eine neue Version Migrationen enthalten kann, die das Schema ändern, erstelle ein Backup, bevor du aktualisierst. Siehe [Aktualisieren](/self-hosting/upgrading) und [Backups](/self-hosting/backups).
:::

## Später die Datenbank wechseln

Die Treiber sind auf Datenebene nicht austauschbar: `BEEHIVE_DATABASE_DRIVER` auf eine andere Engine zeigen zu lassen, verschiebt deine Aufzeichnungen **nicht** dorthin. Um etwa von SQLite zu PostgreSQL zu migrieren, müsstest du deine Daten exportieren und neu importieren. Für die meisten Self-Hoster ist der einfachste Weg, die richtige Datenbank von vornherein zu wählen.

Wenn du nur einen zentralen Server für dich selbst brauchst, wird SQLite dir lange gute Dienste leisten.

Für mehr zum umliegenden Setup siehe [Self-Hosting](/category/self-hosting) und [Speicher](/self-hosting/storage).
