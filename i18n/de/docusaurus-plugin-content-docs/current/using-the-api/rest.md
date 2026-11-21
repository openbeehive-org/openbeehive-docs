---
sidebar_position: 2
title: "REST / HTTP + JSON"
---

# REST / HTTP + JSON

Jeder RPC nimmt einen einfachen `POST` mit JSON-Body entgegen, nach dem
[Connect-Protokoll](https://connectrpc.com/docs/protocol/). Es ist kein
gRPC-Werkzeug nötig.

## Aufbau der Anfrage

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
Content-Type: application/json
Authorization: Bearer <token>      # only when login is configured
```

- Der Body ist die Anfragenachricht als proto3-JSON: Feldnamen in
  `lowerCamelCase` (`apiaryId`, `pageSize`, `weightKg`). Der Server
  akzeptiert auch die `snake_case`-Proto-Namen, Antworten verwenden aber immer
  `lowerCamelCase`.
- Enum-Felder nehmen den Enum-Namen (`"HIVE_TYPE_DADANT"`, `"STORES_GOOD"`)
  oder seine Nummer. Antworten verwenden den Namen.
- Zeitstempel sind RFC-3339-Strings in UTC (`"2026-06-19T09:14:02Z"`). Lass
  einen Zeitstempel weg, um die Vorgabe des Servers zu bekommen (`date` und
  `introducedAt` sind standardmäßig jetzt; `dueAt` und `withdrawalUntil`
  bleiben ungesetzt).
- Die Antwort ist die Antwortnachricht als JSON mit HTTP `200`.
- Felder mit ihrem Standardwert (leerer String, `0`, `false`, leere Liste)
  werden in Antworten weggelassen.

Die Beispiele unten verwenden `$OB` für den Origin und `$TOKEN` für einen
API-Schlüssel (`obhk_...`, erstellt unter **Einstellungen → Arbeitsbereich → API-Schlüssel**)
oder ein Sitzungstoken, wie im [Überblick](./overview.md#authentication)
beschrieben. Auf einer Instanz ohne Login lässt du den
`Authorization`-Header weg.

## Standorte auflisten

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": [
    {
      "id": "2b1f6c0e-...",
      "organizationId": "9d3a...",
      "name": "Orchard Meadow",
      "lat": 48.21,
      "lng": 16.37,
      "hiveCount": 3,
      "createdAt": "2026-04-02T09:14:02Z",
      "updatedAt": "2026-04-02T09:14:02Z"
    }
  ],
  "page": { "total": 1 }
}
```

## Einen Standort anlegen

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/CreateApiary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchard Meadow","address":"Field road 3","lat":48.21,"lng":16.37}'
```

`name` darf nicht leer sein (sonst `invalid_argument`). Die Antwort ist
`{"apiary": {...}}`. `UpdateApiary` erwartet `id` plus die zu ändernden Felder;
siehe [Einen Datensatz aktualisieren](#update-a-record). `DeleteApiary`
schlägt mit `failed_precondition` fehl, solange der Standort noch Beuten hat.

## Beuten anlegen und auflisten

```bash
curl -s -X POST "$OB/openbeehive.v1.HiveService/CreateHive" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","name":"Hive 3","type":"HIVE_TYPE_ZANDER","boxes":2}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

`ListHives` ohne `apiaryId` listet jede Beute des Arbeitsbereichs und ist
wie die anderen Listen paginiert (`total` ist die tatsächliche Anzahl der
passenden Beuten). `CreateHive`
braucht `apiaryId` und `name`; die neue Beute bekommt den Status
`HIVE_STATUS_ACTIVE`, ein offenes Placement-Intervall und ein
`CREATED`-Ereignis. `UpdateHive` erwartet eine `hive`-Nachricht mit `id` und
den zu ändernden Feldern (`name`, `type`, `status`, `boxes`, `colonyOrigin`,
`note`, `qrCode`); `apiaryId` und das Foto ändert es nie. `RelocateHive`
erwartet `{"id": ..., "targetApiaryId": ..., "date": ...}` (`date` optional,
Vorgabe jetzt), schließt das aktuelle Placement, eröffnet ein neues und
zeichnet ein `MOVED`-Ereignis auf. `DeleteApiary` und `DeleteHive` schreiben
einen Tombstone, sodass die Löschung die Geräte über Sync erreicht.
`DeleteHive` löscht auch die offenen Aufgaben der Beute.

## Eine Durchsicht erfassen

Jedes Feld außer `hiveId` ist optional. Eine Stockwaage würde nur die
Messwerte senden:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","weightKg":42.5,"tempHive":34.2,"humidityHive":58,"note":"scale, 06:00"}'
```

```json
{
  "inspection": {
    "id": "7f0e...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "date": "2026-06-19T04:00:11.204Z",
    "note": "scale, 06:00",
    "createdAt": "2026-06-19T04:00:11.204Z",
    "weightKg": 42.5,
    "tempHive": 34.2,
    "humidityHive": 58
  }
}
```

Ein vollständiger Besuch nutzt denselben Aufruf mit den Feldern der
Stockkarte:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "hiveId": "c41a...",
    "date": "2026-06-19T09:00:00Z",
    "weather": "sunny, 22 C",
    "queenSeen": true,
    "eggsSeen": true,
    "coveredLarva": true,
    "frames": 8,
    "broodFrames": 5,
    "stores": "STORES_GOOD",
    "temperament": "TEMPERAMENT_GENTLE",
    "calmness": 3,
    "queenCells": 0,
    "varroa": "2",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` ist eines von `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` eines von `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. Der Server speichert den Standort und die
regierende Königin zum Zeitpunkt `date` und zeichnet ein
`INSPECTION`-Ereignis auf.

Die Zahlen einer Durchsicht (`frames`, `broodFrames`, `queenCells`,
`youngestLarva`, `framesAdded`, `framesRemoved`, `fedKg`, `honeyKg`,
`weightKg` und die vier Klimafelder) sind optional: Ein Feld, das
du weglässt, wird als „nicht erfasst“ gespeichert und fehlt in Antworten,
während eine ausdrückliche `0` als beobachtete Null gespeichert und
zurückgegeben wird. `honeyKg` bleibt für alte Datensätze erhalten; erfasse
Honig mit `HarvestService`.

`source` sagt, wer den Eintrag gemacht hat: `INSPECTION_SOURCE_MANUAL` (die
Vorgabe, wenn du nichts sendest) für eine Durchsicht durch eine Person,
`INSPECTION_SOURCE_SENSOR` für eine automatische Messung. Sensormessungen
erscheinen in den Diagrammen, zählen aber nicht als „Letzte Durchsicht“ und
fehlen in der Liste der fälligen Durchsichten und in den letzten Durchsichten
des Dashboards; siehe [Automatische Tracker](./automated-trackers.md).

`CreateInspection` und `UpdateInspection` lehnen ein `date`, das mehr als einen
Tag in der Zukunft liegt, ab (`invalid_argument`).

### Fotos \{#photos}

Fotos werden nachträglich mit `AddInspectionPhoto` hinzugefügt:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` ist eine base64-Data-URL eines JPEG-, PNG- oder WebP-Bilds von
dekodiert höchstens 5 MiB. Der Server legt das Bild im Blob-Speicher ab,
erzeugt ein Vorschaubild von etwa 200 px und liefert die Durchsicht mit ihren
`photos` zurück; dasselbe Bild zweimal hinzuzufügen hat keine weitere Wirkung.
Jeder Eintrag in `photos` hat `id`, `thumbnail`, `contentType`, `sizeBytes`,
`createdAt` und `path`. `RemoveInspectionPhoto` erwartet `inspectionId` und als
`photo` die `id` des Fotos (oder die Data-URL, mit der es hinzugefügt wurde);
das Foto wird endgültig gelöscht, auf jedem Gerät. `photoKeys` listet nur
eingebettete Fotos, die 0.4.x-Apps geschrieben haben.

Das Bild in voller Größe ist ein einfaches GET auf `path` mit denselben
Anmeldedaten:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/photos/3c9d..." -o photo.jpg
```

Es antwortet mit `404` und `not_uploaded`, solange das Gerät, das das Foto
aufgenommen hat, das Bild noch nicht hochgeladen hat, und mit `410`
(`deleted`) für ein gelöschtes Foto. Das Bild hinter einer Id ändert sich nie
und darf daher zwischengespeichert werden. Mit `POST /photos/<id>` und dem Bild
als Body lädt die App das Bild eines Foto-Eintrags hoch, den sie schon
synchronisiert hat; das wird pro Foto einmal angenommen. Schlüssel mit
Nur-Lese-Recht und das Demo-Konto können nicht hochladen.

## Durchsichten mit Paginierung auflisten

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2}}'
```

```json
{
  "inspections": [
    { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z", "weightKg": 42.5, "tempHive": 34.2, "humidityHive": 58, "note": "scale, 06:00", "createdAt": "2026-06-19T04:00:11.204Z", "organizationId": "9d3a..." },
    { "id": "5c22...", "hiveId": "c41a...", "date": "2026-06-18T04:00:09.871Z", "weightKg": 42.1, "tempHive": 34.4, "humidityHive": 57, "note": "scale, 06:00", "createdAt": "2026-06-18T04:00:09.871Z", "organizationId": "9d3a..." }
  ],
  "page": { "nextPageToken": "2", "total": 3 }
}
```

Die Ergebnisse kommen neueste zuerst. Gib `nextPageToken` als `pageToken`
zurück, um die nächste Seite zu holen:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2,"pageToken":"2"}}'
```

Die letzte Seite hat kein `nextPageToken`. `ListInspections` ohne `hiveId`
listet jede Durchsicht des Arbeitsbereichs. `source` filtert danach, wer den
Eintrag erfasst hat: Lass es weg für alles, `"INSPECTION_SOURCE_MANUAL"` nur
für Durchsichten durch eine Person, `"INSPECTION_SOURCE_SENSOR"` nur für
Messwerte.

## Einen Datensatz aktualisieren \{#update-a-record}

`UpdateApiary`, `UpdateHive`, `UpdateQueen`, `UpdateInspection`,
`UpdateTask`, `UpdateTreatment` und `UpdateHarvest` ändern nur die Felder,
die du sendest. So korrigierst du das Gewicht einer Durchsicht:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e...","weightKg":41.9}}'
```

Alles andere am Datensatz bleibt, wie es ist. Um ein Feld auf seinen Nullwert
zu setzen oder eine optionale Zahl wieder auf „nicht erfasst“ zu leeren,
nenne es in `updateMask`:

```bash
# clear the note and remove the recorded weight
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e..."},"updateMask":"note,weightKg"}'
```

Mit einer Maske werden genau die aufgeführten Felder geschrieben und sonst
nichts. Masken-Pfade dürfen in `lowerCamelCase` oder `snake_case`
geschrieben sein; ein unbekannter Pfad antwortet mit `invalid_argument` und der
Liste der Felder, die der Aufruf ändern kann. Eine Anfrage, die nichts ändern würde, antwortet mit
`invalid_argument`. Die Regeln pro Aufruf:

| Aufruf | Anfrage | Hinweise |
| --- | --- | --- |
| `UpdateApiary` | `id` und die Felder auf oberster Ebene, plus `updateMask` | `name` darf nicht leer werden |
| `UpdateHive` | `hive`, `updateMask` | `apiaryId` wird ignoriert (nutze `RelocateHive`); `status` kann nicht auf „nicht angegeben“ gesetzt werden |
| `UpdateQueen` | `queen`, `updateMask` | Ohne Maske beendet das alleinige Senden von `replacedAt` die Regentschaft (`active` wird `false`), und das Senden von `active: true` leert `replacedAt` |
| `UpdateInspection` | `inspection`, `updateMask` | Fotos ändern sich über die Foto-Aufrufe; das `INSPECTION`-Ereignis folgt einem geänderten `date` |
| `UpdateTask` | `task`, `updateMask` | `hiveId` und `apiaryId` können sich nicht ändern; nutze eine Maske, um `dueAt` zu entfernen oder eine Aufgabe wieder zu öffnen |
| `UpdateTreatment` | `treatment`, `updateMask` | Setzt `amendedAt`; Standort und Königin werden neu aufgelöst, wenn sich `date` verschiebt |
| `UpdateHarvest` | `harvest`, `updateMask` | Setzt `amendedAt`; `amountKg` muss über `0` bleiben; die Honigzahlen folgen der Bearbeitung |

## Eine Königin anlegen

```bash
curl -s -X POST "$OB/openbeehive.v1.QueenService/CreateQueen" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","year":2026,"origin":"own rearing","breederNumber":"B-17"}'
```

```json
{
  "queen": {
    "id": "a9d1...",
    "organizationId": "9d3a...",
    "hiveId": "c41a...",
    "year": 2026,
    "marking": "MARKING_COLOR_WHITE",
    "origin": "own rearing",
    "breederNumber": "B-17",
    "introducedAt": "2026-06-19T09:20:41.003Z",
    "active": true,
    "createdAt": "2026-06-19T09:20:41.003Z",
    "updatedAt": "2026-06-19T09:20:41.003Z"
  }
}
```

`hiveId` und `year` sind Pflicht. `marking` hat als Vorgabe die
internationale Farbe für das Jahr (`MARKING_COLOR_WHITE` für Jahre auf 1
oder 6, `YELLOW` 2/7, `RED` 3/8, `GREEN` 4/9, `BLUE` 5/0); `introducedAt`
ist standardmäßig jetzt. Das Anlegen einer Königin beendet immer die
Regentschaft der aktuell aktiven Königin der Beute (`active: false`,
`replacedAt` gesetzt) und zeichnet die Ereignisse `QUEEN_REPLACED` und
`QUEEN_INTRODUCED` auf. `ListQueens` erwartet `hiveId` und `onlyActive`;
`UpdateQueen` korrigiert `year`, `marking`, `origin`, `breederNumber`,
`introducedAt`, `replacedAt`, `active` und `note` (`hiveId` kann sich nicht
ändern; siehe [Einen Datensatz aktualisieren](#update-a-record)).
`DeleteQueen` entfernt auch ihre Ereignisse `QUEEN_INTRODUCED` und
`QUEEN_REPLACED`.

## Aufgaben

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/CreateTask" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Varroa count","hiveId":"c41a...","dueAt":"2026-07-01T00:00:00Z","priority":"TASK_PRIORITY_HIGH"}'
```

```json
{
  "task": {
    "id": "e3b7...",
    "organizationId": "9d3a...",
    "title": "Varroa count",
    "hiveId": "c41a...",
    "apiaryId": "2b1f6c0e-...",
    "dueAt": "2026-07-01T00:00:00Z",
    "priority": "TASK_PRIORITY_HIGH",
    "createdAt": "2026-06-19T09:22:05.118Z"
  }
}
```

`title` ist Pflicht. Eine Aufgabe mit `hiveId` erbt die `apiaryId` der
Beute, wenn du keine sendest; `apiaryId` muss in deinem Arbeitsbereich
existieren. Eine Aufgabe ohne beides ist persönlich: Sie synchronisiert nur
auf deine eigenen Geräte, und `ListTasks` gibt sie nur an dich zurück.
Abhaken geht so:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

Die Antwort ist `{"task": {...}}` mit `"done": true`. `ListTasks` erwartet
`onlyOpen` und `hiveId` und liefert offene Aufgaben zuerst, sortiert nach
`dueAt`. `UpdateTask` ändert `title`, `dueAt`, `done`, `priority`, `note`,
`recurrence` und `assignedTo`.

## Behandlungen

```bash
curl -s -X POST "$OB/openbeehive.v1.TreatmentService/CreateTreatment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","product":"Oxuvar 5.7%","activeIngredient":"oxalic acid","dose":"50 ml","method":"trickling","batchNumber":"L2405","withdrawalUntil":"2026-12-01T00:00:00Z"}'
```

`hiveId` und `product` sind Pflicht; `reason` hat die Vorgabe `"varroa"`.
Das `treatment` in der Antwort trägt die zum Zeitpunkt `date` eingefrorenen
`apiaryId` und `queenId`. `ListTreatments` erwartet `hiveId` und liefert die
neuesten zuerst. `UpdateTreatment` korrigiert eine Behandlung und setzt
`amendedAt`, das die App als „Geändert am“ anzeigt und im Bestandsbuch
druckt; `DeleteTreatment` entfernt auch ihr `TREATMENT`-Ereignis.

## Ernten

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/CreateHarvest" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","amountKg":18.5,"variety":"spring flow","waterContent":17.2,"batchNumber":"2026-03","bestBefore":"2028-06-01T00:00:00Z","note":"two supers"}'
```

```json
{
  "harvest": {
    "id": "b6e2...",
    "organizationId": "9d3a...",
    "apiaryId": "2b1f6c0e-...",
    "date": "2026-06-19T09:31:17.442Z",
    "variety": "spring flow",
    "amountKg": 18.5,
    "waterContent": 17.2,
    "batchNumber": "2026-03",
    "bestBefore": "2028-06-01T00:00:00Z",
    "note": "two supers",
    "hiveId": "c41a...",
    "queenId": "a9d1..."
  }
}
```

`hiveId` ist Pflicht und `amountKg` muss größer als `0` sein (sonst
`invalid_argument`); `date` ist standardmäßig jetzt. Die Antwort trägt die
zum Zeitpunkt `date` eingefrorenen `apiaryId` und `queenId`. Der Server
zeichnet außerdem ein `HARVEST`-Ereignis mit `amountKg` und dem Titel
`18.5 kg spring flow` auf (`Honey`, wenn `variety` leer ist); das ist es, was
`GetDashboard` und `GetHoneyStats` summieren.

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/ListHarvests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","page":{"pageSize":20}}'
```

`ListHarvests` filtert nach `hiveId` oder `apiaryId` (beide optional) und
liefert `{"harvests": [...], "page": {...}}`, neueste zuerst. `UpdateHarvest`
korrigiert eine Ernte und setzt `amendedAt`; `DeleteHarvest` erwartet
`{"id": ...}`, schreibt einen Tombstone und entfernt das `HARVEST`-Ereignis,
sodass die Honigzahlen sie nicht mehr mitzählen.

## Ereignisse

```bash
curl -s -X POST "$OB/openbeehive.v1.EventService/ListEvents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","limit":20}'
```

Filter sind `apiaryId`, `hiveId` und `queenId`; `limit` hat die Vorgabe 100
und ist auf 1000 begrenzt. Ereignisse kommen neueste zuerst und sind nicht
paginiert. Jedes hat `type` (`EVENT_TYPE_INSPECTION`, `EVENT_TYPE_HARVEST`,
...), die eingefrorenen `apiaryId` / `hiveId` / `queenId`, `refEntity` /
`refId` als Verweis auf die Detailzeile, `amountKg` bei Ernten, `detailJson`
und `authorId`.

## Dashboard

```bash
curl -s -X POST "$OB/openbeehive.v1.StatsService/GetDashboard" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{}'
```

```json
{
  "apiaries": 2,
  "hives": 7,
  "activeQueens": 6,
  "openTasks": 3,
  "overdueTasks": 1,
  "honeyKgSeason": 41.5,
  "dueInspections": [
    { "hiveId": "0d4c...", "hiveName": "Hive 5", "apiaryName": "Orchard Meadow", "daysSinceLast": -1 },
    { "hiveId": "c41a...", "hiveName": "Hive 3", "apiaryName": "Orchard Meadow", "daysSinceLast": 27 }
  ],
  "nextTasks": [ { "id": "e3b7...", "title": "Varroa count", "dueAt": "2026-07-01T00:00:00Z" } ],
  "recentInspections": [ { "id": "7f0e...", "hiveId": "c41a...", "date": "2026-06-19T04:00:11.204Z" } ],
  "honeyHistory": [ { "year": 2026, "month": 6, "kg": 41.5 } ]
}
```

`thresholdDays` (Vorgabe 10, in Kalendertagen gezählt wie in der App) legt fest, wann eine Beute als fällig zählt:
Beuten, deren letzte Durchsicht mindestens so viele Tage zurückliegt, plus
nie durchgesehene Beuten (`daysSinceLast: -1`, zuerst gelistet).
Sensormessungen (`INSPECTION_SOURCE_SENSOR`) zählen hier nicht als
Durchsichten und werden in `recentInspections` nicht aufgeführt. `nextTasks`
enthält die nächsten fünf offenen Aufgaben, `recentInspections` die letzten
zehn Durchsichten. Honigzahlen stammen aus den `HARVEST`-Ereignissen;
`honeyKgSeason` ist das laufende Kalenderjahr. `GetHoneyStats` erwartet
`year` (0 = alle Jahre) und liefert die Summen `perQueen`, `perApiary` und
`perYear`.

## Einen Arbeitsbereich exportieren \{#export}

`GET /export` lädt den aktiven Arbeitsbereich im Format des vollständigen
Backups der App herunter, das die App wieder importieren kann;
`GET /export?photos=1` liefert ein ZIP, das zusätzlich die Bilder in voller
Größe enthält. Der Endpunkt akzeptiert eine Sitzung oder einen API-Schlüssel
mit Schreibrecht und enthält jeden aktiven Datensatz des Arbeitsbereichs mit
deinen eigenen persönlichen Aufgaben, aber nicht den persönlichen Aufgaben
anderer Mitglieder.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/export?photos=1" -o openbeehive.zip
```

Die Antwort ist ein Anhang namens `openbeehive-server-<date>.json` bzw.
`.zip`. Schlüssel mit Nur-Lese-Recht und das Demo-Konto bekommen `403`; mehr
als 5 Exporte pro Nutzer und Stunde bekommen `429` mit `Retry-After`. Gewichte
und Temperaturen sind in kg und °C.

## Den Änderungsfeed abrufen

```bash
curl -s -X POST "$OB/openbeehive.v1.SyncService/Pull" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Openbeehive-Sync-Protocol: 1" \
  -d '{"cursor":"","limit":100}'
```

```json
{
  "changes": [
    {
      "entity": "inspection",
      "entityId": "7f0e...",
      "scopeId": "2b1f6c0e-...",
      "op": "CHANGE_OP_UPSERT",
      "payloadJson": "{\"hive_id\":\"c41a...\",\"date\":\"2026-06-19T04:00:11.204Z\",\"weight_kg\":42.5}",
      "hlc": "001781234567890:00000:srv-3fa91c0b77d2",
      "authorId": "u-…"
    }
  ],
  "nextCursor": "731942061385:48213:5512",
  "hasMore": false,
  "serverTimeMs": "1781234569120"
}
```

`payloadJson` ist ein JSON-String, dessen Schlüssel die `snake_case`-Spaltennamen
der Tabelle sind. Gib `nextCursor` als `cursor` zurück, um fortzufahren; der Wert ist
opak. Ohne den Header `Openbeehive-Sync-Protocol` antwortet der Server so wie
für 0.4.1-Apps: nur die Spalten dieser Version, keine Foto-Einträge und reine
Sequenznummern als Cursor. Ein `status` ungleich unspecified bedeutet, dass
der Cursor nicht bedient werden kann; lade stattdessen einen `Snapshot`.
`limit` hat die Vorgabe 200 und ist auf 500 begrenzt. Der Feed umfasst den
Arbeitsbereich des Aufrufers; persönliche Zeilen (Scope `user:<id>`) werden
nur an ihren Besitzer zurückgegeben. Der
Feed enthält jede Änderung, egal ob ein Gerät sie gepusht oder ein Dienst-RPC
sie geschrieben hat; Placements tauchen nur hier auf, da sie keinen eigenen
Dienst haben. Wie du Änderungen mit `Push` schreibst, steht
im [Sync-Protokoll](../developers/sync-protocol.md).

## Paginierung

Jeder `List*`-RPC außer `ListEvents` erwartet `page: { pageSize, pageToken }`
und liefert `page: { nextPageToken, total }`:

- `pageSize`: Zeilen pro Seite, Vorgabe 50, begrenzt auf 500.
- `pageToken`: der Offset, bei dem begonnen wird, als Dezimal-String. Sende
  das `nextPageToken` der vorherigen Antwort; `""` oder weggelassen beginnt
  bei der ersten Zeile.
- `nextPageToken`: gesetzt, wenn die Seite voll war und weitere Zeilen
  existieren; auf der letzten Seite nicht vorhanden.
- `total`: Anzahl der passenden Zeilen.

`ListEvents` erwartet ein einfaches `limit`. `Pull` verwendet seine eigenen
Felder `cursor` / `nextCursor` / `hasMore`.

## Fehler

Fehler kommen als JSON-Body mit einem Connect-Code zurück:

```json
{ "code": "not_found", "message": "not found" }
```

| Code | HTTP | Wann |
| --- | --- | --- |
| `invalid_argument` | 400 | Leerer `name`; fehlende `hiveId` (Durchsicht, Königin, Behandlung, Ernte), `year` (Königin), `title` (Aufgabe), `product` (Behandlung); `amountKg` nicht über `0` (Ernte); eine `apiaryId`, die es bei `CreateTask` nicht gibt; ein Foto, das keine Data-URL eines JPEG-, PNG- oder WebP-Bilds von höchstens 5 MiB ist; fehlendes `hive` / `queen` bei den Update-Aufrufen |
| `unauthenticated` | 401 | Fehlendes, abgelaufenes oder entferntes Token: ein unbekannter oder zurückgezogener API-Schlüssel oder ein Sitzungstoken, das älter ist als `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Demo-Sitzung oder API-Schlüssel mit Nur-Lese-Recht ruft einen schreibenden RPC auf |
| `failed_precondition` | 400 | `DeleteApiary`, solange der Standort noch Beuten hat; ein `SyncService`-Aufruf unter `BEEHIVE_SYNC_MIN_PROTOCOL` oder `Snapshot` ohne den Protokoll-Header (mit einem `UpgradeRequired`-Detail) |
| `resource_exhausted` | 429 | Mehr als 4 offene `Subscribe`-Streams für einen Nutzer |
| `not_found` | 404 | Unbekannte Id oder eine Id aus einem anderen Arbeitsbereich bei jedem `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, den Foto-Aufrufen und jedem `Create*`, das auf eine Beute oder einen Standort verweist |
| `unavailable` | 503 | Ein Foto-Aufruf, während der Server keinen Blob-Speicher hat |
| `internal` | 500 | Serverseitige Fehler. Die Meldung ist immer `internal error`; Einzelheiten stehen nur im Server-Log |

Ein Update, das nichts ändern würde, und ein `Push` mit mehr als 2000
Änderungen antworten ebenfalls mit `invalid_argument`. Die vollständige Liste
der Codes findest du in der
[Connect-Fehlerreferenz](https://connectrpc.com/docs/protocol/#error-codes).

### Fehlercodes der einfachen HTTP-Endpunkte \{#http-error-codes}

Die Endpunkte unter `/auth/*` und `/tenants/*` sind keine RPCs. Ihre Fehler
sind `{"error": "<plain English>", "code": "<snake_case>"}` mit passendem
HTTP-Status. Clients sollten sich nach `code` richten; der Text kann sich
ändern.

| HTTP | Codes |
| --- | --- |
| 400 | `invalid_body`, `invalid_email`, `invalid_scope`, `invalid_expiry`, `invalid_role`, `invalid_password`, `password_too_long`, `id_required`, `name_required`, `org_id_required`, `cannot_remove_self`, `invite_invalid`, `invite_expired`, `reset_invalid`, `passkey_no_ceremony`, `passkey_failed` |
| 401 | `not_signed_in`, `invalid_credentials`, `passkey_failed` |
| 403 | `cross_site_request`, `demo_read_only`, `invite_only`, `invite_email_mismatch`, `not_a_member`, `owner_only`, `admin_only`, `account_protected`, `password_managed`, `wrong_password`, `reauth_required`, `login_required`, `passkey_failed`, `passkey_session_mismatch` |
| 404 | `not_found`, `invite_not_found`, `key_not_found`, `member_not_found`, `account_not_found`, `passkey_not_found` |
| 405 | `method_not_allowed` |
| 409 | `email_taken`, `already_member`, `last_owner`, `no_password`, `passkey_none`, `reset_needs_admin` |
| 413 | `body_too_large` |
| 415 | `unsupported_media_type` |
| 429 | `rate_limited` (mit `Retry-After`) |
| 500 | `internal` |
| 503 | `demo_unavailable`, `unavailable` |

Seiten, die ein Browser direkt öffnet (`/auth/verify`, `/auth/login`,
`/auth/callback`), antworten nicht mit JSON: Sie leiten auf
`/login?error=<code>` weiter, wo die App eine übersetzte Meldung zeigt. Ihre
Codes sind `verification_invalid`, `unknown_provider`, `oidc_state_missing`,
`oidc_state_invalid`, `oidc_failed`, `oidc_no_email`, `account_exists`,
`invite_only` und `internal`.

`/photos/` und `/export` verwenden dieselbe JSON-Fehlerform mit
`not_signed_in` (401), `cross_site_request`, `demo_read_only`, `read_only`
(403), `not_found`, `unknown_photo`, `not_uploaded` (404), `deleted` (410),
`too_large` (413), `unsupported_type` (415), `rate_limited` (429) und
`unavailable` (503).

## Hinweise

- Sende `{}` für eine Anfrage ohne Felder.
- `Content-Type: application/json` wählt das Connect-JSON-Protokoll aus.
  `application/proto` sendet binäres Protobuf über dieselbe URL. Eine Anfrage
  ohne oder mit einem anderen `Content-Type` antwortet mit `415` und einem JSON-Fehler, der das sagt.
- `SyncService.Subscribe` ist ein Server-Stream und braucht einen
  Streaming-Client; siehe [gRPC](./grpc.md).
