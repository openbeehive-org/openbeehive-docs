---
sidebar_position: 2
title: "Historie & Ereignisse"
---

# Historie & Ereignisse

Eine Beute wandert zwischen Standorten, eine Königin regiert und wird ersetzt,
Honig wird an einem bestimmten Tag geerntet. Damit diese Historie korrekt
bleibt, nachdem sich die Welt verändert hat, friert jeder Historien-Schreibvorgang
den Kontext ein, der zu diesem Zeitpunkt galt. Der Code liegt in
`app/src/lib/local/history.ts`.

## Ereignisse frieren ihren Kontext ein

Die Tabelle `event` ist append-only. Jede Zeile speichert als einfache Spalten
die `apiary_id`, `hive_id` und `queen_id`, die am `date` des Ereignisses
galten. Wanderst du die Beute nächsten Monat, gehört die Durchsicht von letzter
Woche weiterhin zum alten Standort; weiselst du um, bleibt eine alte Ernte der
Königin zugeschrieben, die sie erbracht hat.

Dieselben Zeilen dienen als Faktentabelle für Statistiken: `amount_kg` wird
auf Ernte-Ereignisse kopiert, sodass Honig pro Standort, pro Königin oder pro
Jahr ein einziges `GROUP BY` über `event` ohne Joins ist.

## Intervall-Historien

Zwei Tabellen halten halboffene Intervalle `[start, end)`:

| Tabelle | Intervall | Bedeutung |
| --- | --- | --- |
| `queen` | `[introduced_at, replaced_at)` | Die Königin führt das Volk vom Einweiseln bis sie ersetzt wird. `replaced_at` ist null, solange sie regiert; `active` ist ebenfalls gesetzt. |
| `placement` | `[start_at, end_at)` | Die Beute steht in `apiary_id` von `start_at` bis sie gewandert wird. `end_at` ist null für das aktuelle Placement. |

Halboffene Intervalle fügen sich ohne Überlappung aneinander: An einem
Wechseltag passt genau eine Zeile.

## resolveContext

Einträge werden oft rückdatiert (der Besuch vom Samstag wird am Montag
eingetragen), daher wird der Kontext für das eigene Datum des Eintrags
ermittelt, nicht für jetzt:

```ts
resolveContext(hiveId: string, date: string) -> { apiaryId, queenId }
```

Die Funktion führt zwei Abfragen gegen die lokale Datenbank aus und fällt auf
die aktuellen Werte zurück, wenn kein Intervall das Datum abdeckt:

```sql
-- Where the hive lived on the date (falls back to hive.apiary_id).
SELECT apiary_id FROM placement
WHERE hive_id = ? AND deleted = 0 AND start_at <= ?
  AND (end_at IS NULL OR end_at > ?)
ORDER BY start_at DESC LIMIT 1;

-- Who reigned on the date (falls back to the queen with active = 1).
SELECT id FROM queen
WHERE hive_id = ? AND deleted = 0 AND introduced_at <= ?
  AND (replaced_at IS NULL OR replaced_at > ?)
ORDER BY introduced_at DESC LIMIT 1;
```

## Funktionen, die Historie schreiben

| Funktion | Schreibt |
| --- | --- |
| `createHive` | `hive`-Zeile, ein offenes `placement`, Ereignis `CREATED` |
| `setQueen` | schließt die aktive Königin (`active = 0`, `replaced_at`), fügt die neue ein, Ereignisse `QUEEN_REPLACED` und `QUEEN_INTRODUCED` |
| `moveHive` | schließt das offene `placement`, öffnet ein neues, aktualisiert `hive.apiary_id`, Ereignis `MOVED` mit `detail = {from, to}` |
| `recordHarvest` | `harvest`-Zeile mit eingefrorener `apiary_id` / `queen_id`, Ereignis `HARVEST` mit `amount_kg` und `ref_id` |
| `recordTreatment` | `treatment`-Zeile mit eingefrorenem Kontext, Ereignis `TREATMENT` |
| `recordInspection` | `inspection`-Zeile, Ereignis `INSPECTION` |

`recordHarvest`, `recordTreatment` und `recordInspection` rufen zuerst
`resolveContext` auf. Alle Schreibvorgänge gehen durch `patch()` in
`app/src/lib/local/repo.ts` und landen so wie jede andere Änderung in der
lokalen Tabelle und der Sync-Outbox. Die Detailzeilen (`harvest`, `treatment`,
`inspection`) sind normale synchronisierte Zeilen; nur `event` wird per
Konvention als append-only behandelt. Nichts in der App bearbeitet oder löscht
ein Ereignis.

Die Nummern der Ereignistypen stehen im [Datenmodell](/developers/data-model#event).

## Historie lesen

```ts
historyForHive(hiveId)     // SELECT * FROM event WHERE deleted = 0 AND hive_id = ?   ORDER BY date DESC
historyForApiary(apiaryId) // ... WHERE apiary_id = ?
historyForQueen(queenId)   // ... WHERE queen_id = ?
```

Statistiken:

```sql
-- honeyByApiary
SELECT apiary_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY apiary_id ORDER BY kg DESC;

-- honeyByQueen
SELECT queen_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY queen_id ORDER BY kg DESC;

-- honeyByYear
SELECT substr(date, 1, 4) AS year, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY year ORDER BY year;
```

`type = 7` ist `HARVEST`. Da die Dimensionen auf der Zeile eingefroren sind,
ist kein Join auf den aktuellen Zustand nötig.

## Sync

`event`-Zeilen tragen `scope_id` (die Standort-Id) als Spalte und
synchronisieren wie jede andere Tabelle, mit feldweisem Last-Writer-Wins. Da
jedes Ereignis eine frische UUID hat und nie bearbeitet wird, berühren zwei
Geräte, die offline Ereignisse hinzufügen, nie dieselbe Zeile, und beide Mengen
bleiben erhalten. Siehe [Sync-Protokoll](/developers/sync-protocol).
