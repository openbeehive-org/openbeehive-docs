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
wiederholt werden: `organization_id` (der Arbeitsbereich, im Code tenant genannt), `field_hlc` (JSON-Feld-Uhr,
siehe [Sync-Protokoll](./sync-protocol.md)) und `deleted`
(Soft-Delete-Flag). Ids sind UUIDs, die auf dem Gerät erzeugt werden oder,
bei Zeilen, die über die [API](../using-the-api/overview.md) angelegt werden, vom
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
       ├── photo       (the hive's picture, and the photos of its inspections)
       └── event       (append-only history with frozen apiary/hive/queen)

user_settings          (one row per account, in every workspace)
```

Der Arbeitsbereich (`organization_id`) ist die Einheit des Teilens: Jedes
Mitglied eines Arbeitsbereichs liest und schreibt alle seine Zeilen. Innerhalb
davon tragen Änderungen eine `scope_id`: die eigene Id eines Standorts für den
Standort und alles darunter, oder `user:<id>` für persönliche Zeilen wie eine
Aufgabe ohne Standort. Nur `event` speichert `scope_id` als Spalte; bei den
anderen Tabellen wird sie in der `Change`-Message mitgeführt.

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
| `id` | text | auch im [QR-Etikett](./qr-codes.md) kodiert |
| `apiary_id` | text | aktueller Standort |
| `name` | text | |
| `type` | int | `HiveType`, siehe unten |
| `status` | int | `HiveStatus`, siehe unten; neue Beuten starten mit `1` |
| `boxes` | int | Anzahl der Zargen |
| `colony_origin` | text | z. B. "Schwarm 2024" |
| `note` | text | |
| `qr_code` | text | reserviert; der gedruckte Code wird von `shortCode()` in `app/src/lib/qr.ts` aus `id` abgeleitet |
| `photo` | text | eingebettetes Bild, geschrieben von 0.4.x-Apps; aktualisierte Apps halten das Bild der Beute stattdessen als `photo`-Zeile |
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
und fügt eine neue ein; die alte Königin bleibt in der Tabelle. Eine
Königinnen-Zeile wird nur gelöscht, wenn sie irrtümlich erfasst wurde.

## inspection

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Sehr sanft, 2 Sanft, 3 Normal, 4 Nervös, 5 Aggressiv |
| `calmness` | int | 1 Läuft ab, 2 Unruhig, 3 Ruhig, 4 Sehr ruhig |
| `source` | int | `InspectionSource`: 0 nicht angegeben (wird als manuell behandelt), 1 manuell (eine Durchsicht durch eine Person), 2 Sensor (eine automatische Messung). Nicht null, Vorgabe 0 |
| `frames` | int | besetzte Waben |
| `brood_frames` | int | |
| `stores` | int | 1 Gut, 2 Mittel, 3 Wenig, 4 Keines |
| `queen_cells` | int | gezählte Schwarmzellen |
| `youngest_larva` | int | Alter in Tagen der jüngsten gesehenen Larve |
| `covered_larva` | bool | verdeckelte Brut gesehen |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | `honey_kg` bleibt für alte Datensätze erhalten; das Durchsichtsformular schreibt es nicht mehr (siehe `harvest`) |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C |
| `humidity_hive`, `humidity_outside` | real | % |
| `note` | text | |
| `photo_keys` | text | OR-Set-JSON, die einzige Mengenspalte; eingebettete Fotos, geschrieben von 0.4.x-Apps (siehe `photo`) |
| `created_at` | timestamp | |

Die Zählwerte, Mengen und Klimawerte (`frames`, `brood_frames`,
`queen_cells`, `youngest_larva`, `frames_added`, `frames_removed`,
`honey_kg`, `fed_kg`, `weight_kg` und die vier Klimaspalten) sind auf dem
Server und auf dem Client nullable: `NULL` bedeutet „nicht erfasst“, `0`
bedeutet eine beobachtete Null. Die API bildet das mit optionalen Feldern ab.

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

Auf dem Server hält `task.owner_id` das Konto fest, in dessen persönlichem
Scope eine Aufgabe ohne Standort geschrieben wurde. Die Spalte wird nicht
synchronisiert; der Server nutzt sie, um die Aufgabe nur ihrem Besitzer
auszuliefern und sie zu löschen, wenn der Besitzer den Arbeitsbereich
verlässt.

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
| `amended_at` | timestamp | null, bis die Ernte nach dem Anlegen bearbeitet wird, danach der Zeitpunkt der letzten Bearbeitung |

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
| `amended_at` | timestamp | null, bis die Behandlung nach dem Anlegen bearbeitet wird, danach der Zeitpunkt der letzten Bearbeitung; wird als „Geändert am“ angezeigt und im Bestandsbuch gedruckt |

## photo

Ein Foto einer Durchsicht oder das Bild einer Beute. Die Zeile synchronisiert
mit einem kleinen Vorschaubild; das Bild in voller Größe liegt im
Blob-Speicher und wird über `/photos/<id>` übertragen (siehe das
[Sync-Protokoll](./sync-protocol.md#photos)).

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `owner_entity` | text | `inspection` oder `hive` |
| `owner_id` | text | Id dieser Durchsicht oder Beute |
| `thumb` | text | Vorschaubild als Data-URL, etwa 200 px an der längeren Kante |
| `content_type` | text | des Bilds in voller Größe: `image/jpeg`, `image/png` oder `image/webp` |
| `size_bytes` | int | des Bilds in voller Größe, höchstens 5 MiB |
| `created_at` | timestamp | |

Ein gelöschtes Foto behält seine Zeile als Tombstone, aber Vorschaubild und
Bild werden gelöscht. Auf dem Server nennt die Zeile außerdem ihren Blob
(`blob_key`, `blob_type`, `blob_size`) und, bei aus 0.4.x umgewandelten Fotos,
den eingebetteten Wert, aus dem sie stammen (`legacy_key`); diese Spalten
werden nicht synchronisiert.

## user_settings

Die Anzeigeeinstellungen des Kontos. Eine Zeile pro Konto, ihre Id ist die
Konto-Id; sie wird im persönlichen Scope geschrieben und in jedem
Arbeitsbereich des Kontos ausgeliefert (siehe das
[Sync-Protokoll](./sync-protocol.md#account-settings)). Sie trägt kein
`organization_id`.

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | die Konto-Id |
| `weight_unit` | text | `kg` oder `lb`; leer heißt nicht gewählt, das Gerät nutzt dann die Vorgabe der Browser-Region |
| `temp_unit` | text | `c` oder `f`; leer wie oben |
| `language` | text | `en`, `de`, `fr`, `es` oder `it` |

Aufzeichnungen werden in Kilogramm und Grad Celsius gespeichert, egal was hier
gewählt ist.

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
[Historie und Events](./history-and-events.md).

## Tabellen nur auf dem Server

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`password_reset`, `change_log`, `seq_counter`, `sync_state`, `sync_boot` und
`photo_migration` existieren nur auf dem Server.
`member.role` ist `owner` oder `member`; `users.role` ist `admin` oder `user`.
`users.sessions_valid_after` ist die Marke, die alle früheren Sitzungen eines
Kontos beendet; `users.email_key` ist die E-Mail-Adresse in Kleinbuchstaben und
eindeutig, sodass sich zwei Konten keine Adresse teilen können, die sich nur
in der Groß- und Kleinschreibung unterscheidet; `invite.expires_at` ist der
Zeitpunkt, ab dem eine Einladung nicht mehr funktioniert (7 Tage nach dem
Erstellen). `password_reset` hält den Hash des Tokens jedes Reset-Links, gültig
für eine Stunde und gelöscht, sobald er benutzt wurde. `sync_state` hält die
zufällige `epoch` der Datenbank und den `horizon` der
Änderungsprotokoll-Verdichtung; `sync_boot` hält eine Marke pro Serverstart
(siehe das [Sync-Protokoll](./sync-protocol.md#pull-status));
`change_log.logged_at` ist der Zeitpunkt, zu dem der Server einen Eintrag
empfangen hat. `photo_migration` hält fest, dass die einmalige Umwandlung der
eingebetteten Fotos aus 0.4.x abgeschlossen ist. Die frühere Tabelle
`apiary_share` gibt es nicht mehr: Ein Teilen einzelner Standorte gibt es nicht.
Der Client ergänzt `outbox`, `sync_meta`, `outbox_failed` (Änderungen, die der Server abgelehnt hat) und `inbox_failed` (empfangene Änderungen, die er nicht übernehmen konnte) für die Sync-Engine.

### api_key

Langlebige Schlüssel für Skripte und Integrationen (Migration
`0014_api_keys.sql`, `server/internal/auth/apikey.go`). Nicht synchronisiert.

| Spalte | Typ | Hinweise |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | Besitzer; indiziert |
| `organization_id` | varchar(64) | der Arbeitsbereich, in dem der Schlüssel handelt, beim Erstellen festgelegt |
| `name` | text | Bezeichnung, die in den Einstellungen angezeigt wird |
| `key_prefix` | text | die ersten 12 Zeichen des Klartexts, für die Anzeige |
| `key_hash` | varchar(64) | hex-SHA-256 des Klartext-Tokens `obhk_...`, eindeutig; der Klartext wird nie gespeichert |
| `scope` | text | `write` (Vorgabe) oder `read`; ein `read`-Schlüssel darf nur `Get*`, `List*`, `Pull`, `Snapshot` und `Subscribe` aufrufen |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null für Schlüssel, die nie ablaufen; ein Schlüssel nach diesem Zeitpunkt wird abgelehnt |
| `last_used_at` | timestamp | bei jeder erfolgreich geprüften Verwendung aktualisiert, bis dahin null |

Ein Schlüssel wird geprüft, indem das Bearer-Token gehasht und `key_hash`
nachgeschlagen wird; beim Entfernen wird die Zeile gelöscht, und ein
Schlüssel, dessen Besitzer kein `member` von `organization_id` mehr ist oder
dessen `expires_at` verstrichen ist, wird abgelehnt, ohne gelöscht zu
werden.
