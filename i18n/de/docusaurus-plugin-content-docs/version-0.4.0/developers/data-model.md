---
sidebar_position: 3
title: "Datenmodell"
---

# Datenmodell

Die Tabellen unten stammen aus den Server-Migrationen
(`server/internal/storage/sql/migrations/`) und dem Spiegelschema des Clients
(`app/src/lib/local/schema.ts`). Die Spaltennamen sind auf beiden Seiten
identisch und sind die Schlüssel in den Sync-Payloads. Enum-Spalten speichern
die Proto-Nummer; das Anzeigelabel ist das, was die App zeigt
(`app/src/lib/i18n/locales/en.json`).

Jede synchronisierte Tabelle trägt drei Verwaltungsspalten, die unten nicht
wiederholt werden: `organization_id` (Mandant), `field_hlc` (JSON-Feld-Uhr,
siehe [Sync-Protokoll](/developers/sync-protocol)) und `deleted`
(Soft-Delete-Flag). Ids sind UUIDs, die auf dem Gerät erzeugt werden oder,
bei Zeilen, die über die [API](/using-the-api/overview) angelegt werden, vom
Server. Zeitstempel werden auf dem Client als ISO-8601-Strings und auf dem
Server als `TIMESTAMP` gespeichert.

## Hierarchie

```text
apiary
 └── hive ── queen (one active, older ones kept with replaced_at set)
       ├── inspection
       ├── task        (task.hive_id and task.apiary_id are both optional)
       ├── harvest
       ├── treatment
       ├── placement   (which apiary the hive lived in, and when)
       └── event       (append-only history with frozen apiary/hive/queen)
```

Freigabe und Sync-Partitionierung nutzen `scope_id`: die eigene Id eines
Standorts für den Standort und alles darunter. Nur `event` speichert
`scope_id` als Spalte; bei den anderen Tabellen wird sie in der
`Change`-Message mitgeführt.

## apiary

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `name` | text | Pflichtfeld |
| `address` | text | Freitext |
| `lat`, `lng` | real | `0`, wenn nicht gesetzt |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

## hive

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | auch im [QR-Etikett](/developers/qr-codes) kodiert |
| `apiary_id` | text | aktueller Standort |
| `name` | text | |
| `type` | int | `HiveType`, siehe unten |
| `status` | int | `HiveStatus`, siehe unten; neue Beuten starten mit `1` |
| `boxes` | int | Anzahl der Zargen |
| `colony_origin` | text | z. B. "Schwarm 2024" |
| `note` | text | |
| `qr_code` | text | reserviert; der gedruckte Code wird von `shortCode()` in `app/src/lib/qr.ts` aus `id` abgeleitet |
| `photo` | text | Data-URL oder Blob-Schlüssel |
| `created_at`, `updated_at` | timestamp | |

`HiveType`: 0 Unbestimmt, 1 Zander, 2 Dadant, 3 Deutsch Normal, 4 Langstroth,
5 Warré, 6 Top-Bar, 99 Sonstige.

`HiveStatus`: 0 Unbestimmt, 1 Aktiv, 2 Ableger, 3 Weisellos, 4 Verloren,
5 Aufgelöst.

## queen

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `hive_id` | text | |
| `year` | int | das Jahr der Königin; bestimmt die Standard-Markierungsfarbe |
| `marking` | int | `MarkingColor`: 1 weiß (Jahre auf 1/6), 2 gelb (2/7), 3 rot (3/8), 4 grün (4/9), 5 blau (5/0); Vorgabe aus `year` |
| `origin` | text | |
| `breeder_number` | text | |
| `introduced_at` | timestamp | Beginn der Regentschaft |
| `replaced_at` | timestamp | Ende der Regentschaft, null solange sie regiert |
| `active` | bool | true für die aktuelle Königin |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

Ein Königinnenwechsel setzt `active = 0` und `replaced_at` auf der alten Zeile
und fügt eine neue ein; alte Königinnen werden nie gelöscht.

## inspection

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Sehr sanft, 2 Sanft, 3 Normal, 4 Nervös, 5 Aggressiv |
| `calmness` | int | 1 Läuft ab, 2 Unruhig, 3 Ruhig, 4 Sehr ruhig |
| `frames` | int | besetzte Waben |
| `brood_frames` | int | |
| `stores` | int | 1 Gut, 2 Mittel, 3 Wenig, 4 Keines |
| `queen_cells` | int | gezählte Schwarmzellen |
| `youngest_larva` | int | Alter in Tagen der jüngsten gesehenen Larve |
| `covered_larva` | bool | verdeckelte Brut gesehen |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C, null wenn in der App nicht gemessen; `CreateInspection` speichert `0` für weggelassene Felder |
| `humidity_hive`, `humidity_outside` | real | %, gleiche Regel wie bei den Temperaturen |
| `note` | text | |
| `photo_keys` | text | OR-Set-JSON, die einzige Mengenspalte |
| `created_at` | timestamp | |

## task

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `title` | text | |
| `hive_id`, `apiary_id` | text | optional |
| `due_at` | timestamp | |
| `done` | bool | |
| `priority` | int | `TaskPriority`: 1 Niedrig, 2 Normal, 3 Hoch; die Server-Spalte hat Vorgabe 2, die App schreibt 0 |
| `note`, `recurrence`, `assigned_to` | text | im Schema vorhanden; das Aufgabenformular füllt nur `title` und `due_at` |
| `created_at` | timestamp | |

## placement

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id`, `hive_id`, `apiary_id` | text | |
| `start_at` | timestamp | |
| `end_at` | timestamp | null für das aktuelle Placement |

Das Anlegen einer Beute eröffnet ein Placement; das Wandern schließt die offene
Zeile zum Wanderzeitpunkt und eröffnet eine neue.

Eine Aufgabe ohne `apiary_id` synchronisiert unter dem persönlichen Scope
`user:<user id>` statt unter einer Standort-Id.

## harvest

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | zum Erntezeitpunkt eingefroren |
| `date` | timestamp | |
| `variety` | text | |
| `amount_kg` | real | |
| `water_content` | real | % |
| `batch_number` | text | |
| `best_before` | timestamp | |
| `note` | text | |

## treatment

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | zum Behandlungszeitpunkt eingefroren |
| `date` | timestamp | |
| `product`, `active_ingredient` | text | |
| `dose`, `method` | text | |
| `batch_number` | text | |
| `withdrawal_until` | timestamp | |
| `reason` | text | Vorgabe `varroa` |
| `note` | text | |

## event

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `scope_id` | text | Standort-Id |
| `type` | int | `EventType`, siehe unten |
| `date` | timestamp | |
| `apiary_id`, `hive_id`, `queen_id` | text | zum Event-Zeitpunkt eingefroren |
| `ref_entity`, `ref_id` | text | die Detailzeile, z. B. `harvest` / ihre Id |
| `title` | text | |
| `amount_kg` | real | aus der Ernte kopiert, damit Ertragsabfragen keinen Join brauchen |
| `detail` | text | JSON |
| `author_id` | text | |

`EventType`: 1 Angelegt, 2 Königin eingesetzt, 3 Königin ersetzt, 4 Gewandert,
5 Durchsicht, 6 Behandlung, 7 Ernte, 8 Status, 9 Aufgelöst. Die App schreibt
die Typen 1 bis 7 (`app/src/lib/local/history.ts`). Siehe
[Historie und Events](/developers/history-and-events).

## Tabellen nur auf dem Server

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`apiary_share`, `change_log` und `seq_counter` existieren nur auf dem Server.
`member.role` ist `owner` oder `member`; `users.role` ist `admin` oder `user`.
`apiary_share` wird von der Sync-Scope-Prüfung gelesen, aber nichts in der App
schreibt sie. Der Client ergänzt `outbox` und `sync_meta` für die Sync-Engine.

### api_key

Langlebige Schlüssel für Skripte und Integrationen (Migration
`0014_api_keys.sql`, `server/internal/auth/apikey.go`). Nicht synchronisiert.

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | Besitzer; indiziert |
| `organization_id` | varchar(64) | der Mandant, in dem der Schlüssel handelt, beim Erstellen festgelegt |
| `name` | text | Bezeichnung, die in den Einstellungen angezeigt wird |
| `key_prefix` | text | die ersten 12 Zeichen des Klartexts, für die Anzeige |
| `key_hash` | varchar(64) | hex-SHA-256 des Klartext-Tokens `obhk_...`, eindeutig; der Klartext wird nie gespeichert |
| `scope` | text | `write` (Vorgabe) oder `read`; ein `read`-Schlüssel darf nur `Get*`, `List*`, `Pull` und `Subscribe` aufrufen |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null für Schlüssel, die nie ablaufen; ein Schlüssel nach diesem Zeitpunkt wird abgelehnt |
| `last_used_at` | timestamp | bei jeder erfolgreich geprüften Verwendung aktualisiert, bis dahin null |

Ein Schlüssel wird geprüft, indem das Bearer-Token gehasht und `key_hash`
nachgeschlagen wird; beim Entfernen wird die Zeile gelöscht, und ein
Schlüssel, dessen Besitzer kein `member` von `organization_id` mehr ist oder
dessen `expires_at` verstrichen ist, wird abgelehnt, ohne gelöscht zu
werden.
