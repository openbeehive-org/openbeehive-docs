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
API-Schlüssel (`obhk_...`, erstellt unter **Einstellungen → API-Schlüssel**)
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
`{"apiary": {...}}`. `UpdateApiary` erwartet `id` plus dieselben Felder und
überschreibt sie alle.

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

`ListHives` ohne `apiaryId` listet jede Beute des Mandanten. `CreateHive`
braucht `apiaryId` und `name`; die neue Beute bekommt den Status
`HIVE_STATUS_ACTIVE`, ein offenes Placement-Intervall und ein
`CREATED`-Ereignis. `UpdateHive` erwartet die gesamte `hive`-Nachricht und
überschreibt `name`, `type`, `status`, `boxes`, `colonyOrigin`, `note` und
`qrCode`; `apiaryId` und das Foto lässt es unangetastet. `RelocateHive`
erwartet `{"id": ..., "targetApiaryId": ..., "date": ...}` (`date` optional,
Vorgabe jetzt), schließt das aktuelle Placement, eröffnet ein neues und
zeichnet ein `MOVED`-Ereignis auf. `DeleteApiary` und `DeleteHive` schreiben
einen Tombstone, sodass die Löschung die Geräte über Sync erreicht.

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
    "varroa": "2 mites/day",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` ist eines von `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` eines von `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. Der Server speichert den Standort und die
regierende Königin zum Zeitpunkt `date` und zeichnet ein
`INSPECTION`-Ereignis auf. Felder, die du weglässt, werden als `0`, `false`
oder `""` gespeichert.

Fotos werden nachträglich mit `AddInspectionPhoto` hinzugefügt:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` muss eine Data-URL sein, die mit `data:image/` beginnt, und darf
einschließlich Präfix höchstens 512 KiB groß sein. Das Bild wird auf jedes
Gerät repliziert, sende also ein Vorschaubild (die App speichert etwa
480 px). `RemoveInspectionPhoto` erwartet dieselbe `inspectionId` und den
exakt gespeicherten `photo`-Wert; `inspection.photoKeys` in der Antwort
listet, was gespeichert ist.

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
listet jede Durchsicht des Mandanten.

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
`UpdateQueen` erwartet die gesamte `queen`-Nachricht und aktualisiert `year`,
`marking`, `origin`, `breederNumber`, `introducedAt`, `replacedAt`, `active`
und `note` (`hiveId` kann sich nicht ändern).

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
Beute, wenn du keine sendest; `apiaryId` muss in deinem Mandanten
existieren. Eine Aufgabe ohne beides ist persönlich und synchronisiert nur
auf deine eigenen Geräte. Abhaken geht so:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

Die Antwort ist `{"task": {...}}` mit `"done": true`. `ListTasks` erwartet
`onlyOpen` und `hiveId` und liefert offene Aufgaben zuerst, sortiert nach
`dueAt`.

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
neuesten zuerst.

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
liefert `{"harvests": [...], "page": {...}}`, neueste zuerst. `DeleteHarvest`
erwartet `{"id": ...}` und schreibt einen Tombstone; einen Update-RPC gibt es
nicht.

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

`thresholdDays` (Vorgabe 21) legt fest, wann eine Beute als fällig zählt:
Beuten, deren letzte Durchsicht mindestens so viele Tage zurückliegt, plus
nie durchgesehene Beuten (`daysSinceLast: -1`, zuerst gelistet). `nextTasks`
enthält die nächsten fünf offenen Aufgaben, `recentInspections` die letzten
zehn Durchsichten. Honigzahlen stammen aus den `HARVEST`-Ereignissen;
`honeyKgSeason` ist das laufende Kalenderjahr. `GetHoneyStats` erwartet
`year` (0 = alle Jahre) und liefert die Summen `perQueen`, `perApiary` und
`perYear`.

## Den Änderungsfeed abrufen

```bash
curl -s -X POST "$OB/openbeehive.v1.SyncService/Pull" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
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
      "hlc": "001781234567890:00000:server",
      "authorId": "u-…"
    }
  ],
  "nextCursor": "48213",
  "hasMore": false
}
```

`payloadJson` ist ein JSON-String, dessen Schlüssel die `snake_case`-Spaltennamen
der Tabelle sind. Gib `nextCursor` als `cursor` zurück, um fortzufahren. Der
Feed enthält jede Änderung, egal ob ein Gerät sie gepusht oder ein Dienst-RPC
sie geschrieben hat; Placements tauchen nur hier auf, da sie keinen eigenen
Dienst haben. Wie du Änderungen mit `Push` schreibst, steht
im [Sync-Protokoll](/developers/sync-protocol).

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
| `invalid_argument` | 400 | Leerer `name`; fehlende `hiveId` (Durchsicht, Königin, Behandlung, Ernte), `year` (Königin), `title` (Aufgabe), `product` (Behandlung); `amountKg` nicht über `0` (Ernte); eine `apiaryId`, die es bei `CreateTask` nicht gibt; ein Foto, das keine `data:image/`-URL ist oder 512 KiB überschreitet; fehlendes `hive` / `queen` bei den Update-Aufrufen |
| `unauthenticated` | 401 | Fehlendes, abgelaufenes oder entferntes Token: ein unbekannter oder zurückgezogener API-Schlüssel oder ein Sitzungstoken, das älter ist als `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Demo-Sitzung ruft einen schreibenden RPC auf; `Push` in einen Scope, den du nicht schreiben darfst |
| `not_found` | 404 | Unbekannte Id oder eine Id aus einem anderen Mandanten bei jedem `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, den Foto-Aufrufen und jedem `Create*`, das auf eine Beute oder einen Standort verweist |
| `internal` | 500 | Datenbankfehler |

Die vollständige Liste der Codes findest du in der
[Connect-Fehlerreferenz](https://connectrpc.com/docs/protocol/#error-codes).

## Hinweise

- Sende `{}` für eine Anfrage ohne Felder.
- `Content-Type: application/json` wählt das Connect-JSON-Protokoll aus.
  `application/proto` sendet binäres Protobuf über dieselbe URL.
- `SyncService.Subscribe` ist ein Server-Stream und braucht einen
  Streaming-Client; siehe [gRPC](/using-the-api/grpc).
