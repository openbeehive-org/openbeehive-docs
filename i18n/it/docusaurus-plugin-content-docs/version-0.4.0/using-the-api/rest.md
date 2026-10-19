---
sidebar_position: 2
title: "REST / HTTP + JSON"
---

# REST / HTTP + JSON

Ogni RPC accetta una semplice `POST` con un corpo JSON, secondo il
[protocollo Connect](https://connectrpc.com/docs/protocol/). Non è richiesto
alcuno strumento gRPC.

## Forma della richiesta

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
Content-Type: application/json
Authorization: Bearer <token>      # only when login is configured
```

- Il corpo è il messaggio di richiesta in JSON proto3: nomi dei campi in
  `lowerCamelCase` (`apiaryId`, `pageSize`, `weightKg`). Il server accetta
  anche i nomi proto in `snake_case`, ma le risposte usano sempre
  `lowerCamelCase`.
- I campi enum accettano il nome dell'enum (`"HIVE_TYPE_DADANT"`,
  `"STORES_GOOD"`) o il suo numero. Le risposte usano il nome.
- I timestamp sono stringhe RFC 3339 in UTC (`"2026-06-19T09:14:02Z"`).
  Ometti un timestamp per ottenere il valore predefinito del server (`date` e
  `introducedAt` hanno come predefinito l'istante attuale; `dueAt` e
  `withdrawalUntil` restano non impostati).
- La risposta è il messaggio di risposta in JSON con HTTP `200`.
- I campi al valore predefinito (stringa vuota, `0`, `false`, elenco vuoto)
  vengono omessi dalle risposte.

Gli esempi qui sotto usano `$OB` per l'origine e `$TOKEN` per una chiave API
(`obhk_...`, creata in **Impostazioni → Chiavi API**) o per un token di
sessione, come descritto nella [panoramica](./overview.md#authentication).
Ometti l'header `Authorization` su un'istanza senza login.

## Elencare gli apiari

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

## Creare un apiario

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/CreateApiary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchard Meadow","address":"Field road 3","lat":48.21,"lng":16.37}'
```

`name` non deve essere vuoto (altrimenti `invalid_argument`). La risposta è
`{"apiary": {...}}`. `UpdateApiary` accetta `id` più gli stessi campi e li
sovrascrive tutti.

## Creare ed elencare le arnie

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

`ListHives` senza `apiaryId` elenca tutte le arnie del tenant. `CreateHive`
richiede `apiaryId` e `name`; la nuova arnia riceve lo stato
`HIVE_STATUS_ACTIVE`, un intervallo di collocazione aperto e un evento
`CREATED`. `UpdateHive` accetta l'intero messaggio `hive` e sovrascrive
`name`, `type`, `status`, `boxes`, `colonyOrigin`, `note` e `qrCode`; lascia
intatti `apiaryId` e la foto. `RelocateHive` accetta
`{"id": ..., "targetApiaryId": ..., "date": ...}` (`date` facoltativa, con
l'istante attuale come predefinito), chiude la collocazione attuale, ne apre
una nuova e registra un evento `MOVED`. `DeleteApiary` e `DeleteHive`
scrivono una tombstone, quindi la cancellazione raggiunge i dispositivi
tramite la sincronizzazione.

## Registrare un'ispezione

Ogni campo tranne `hiveId` è facoltativo. Una bilancia per arnie invierebbe
solo le misurazioni:

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

Una visita completa usa la stessa chiamata con i campi della scheda
dell'arnia:

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

`stores` è uno tra `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` uno tra `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. Il server memorizza l'apiario e la regina regnante
alla `date` indicata e registra un evento `INSPECTION`. I campi che ometti
vengono memorizzati come `0`, `false` o `""`.

Le foto si aggiungono in seguito con `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` deve essere un data URL che inizia con `data:image/` e di al massimo
512 KiB, prefisso compreso. Viene replicata su ogni dispositivo, quindi invia
una miniatura (l'app memorizza circa 480 px). `RemoveInspectionPhoto` accetta
lo stesso `inspectionId` e il valore `photo` esatto memorizzato;
`inspection.photoKeys` nella risposta elenca ciò che è memorizzato.

## Elencare le ispezioni con paginazione

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

I risultati sono dal più recente. Restituisci `nextPageToken` come
`pageToken` per la pagina successiva:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2,"pageToken":"2"}}'
```

L'ultima pagina non ha `nextPageToken`. `ListInspections` senza `hiveId`
elenca tutte le ispezioni del tenant.

## Creare una regina

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

`hiveId` e `year` sono obbligatori. `marking` ha come predefinito il colore
internazionale dell'anno (`MARKING_COLOR_WHITE` per gli anni che finiscono in
1 o 6, `YELLOW` 2/7, `RED` 3/8, `GREEN` 4/9, `BLUE` 5/0); `introducedAt` ha
come predefinito l'istante attuale. Creare una regina termina sempre il regno
della regina attiva attuale dell'arnia (`active: false`, `replacedAt`
impostato) e registra gli eventi `QUEEN_REPLACED` e `QUEEN_INTRODUCED`.
`ListQueens` accetta `hiveId` e `onlyActive`; `UpdateQueen` accetta l'intero
messaggio `queen` e aggiorna `year`, `marking`, `origin`, `breederNumber`,
`introducedAt`, `replacedAt`, `active` e `note` (`hiveId` non può cambiare).

## Attività

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

`title` è obbligatorio. Un'attività con `hiveId` eredita l'`apiaryId`
dell'arnia quando non ne invii uno; `apiaryId` deve esistere nel tuo tenant.
Un'attività senza nessuno dei due è personale e si sincronizza solo sui tuoi
dispositivi. Spuntala con:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

La risposta è `{"task": {...}}` con `"done": true`. `ListTasks` accetta
`onlyOpen` e `hiveId` e restituisce prima le attività aperte, ordinate per
`dueAt`.

## Trattamenti

```bash
curl -s -X POST "$OB/openbeehive.v1.TreatmentService/CreateTreatment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","product":"Oxuvar 5.7%","activeIngredient":"oxalic acid","dose":"50 ml","method":"trickling","batchNumber":"L2405","withdrawalUntil":"2026-12-01T00:00:00Z"}'
```

`hiveId` e `product` sono obbligatori; `reason` ha `"varroa"` come
predefinito. Il `treatment` nella risposta porta l'`apiaryId` e il `queenId`
fissati alla `date` indicata. `ListTreatments` accetta `hiveId` e restituisce
i risultati dal più recente.

## Raccolti

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

`hiveId` è obbligatorio e `amountKg` deve essere maggiore di `0` (altrimenti
`invalid_argument`); `date` ha come predefinito l'istante attuale. La risposta
porta l'`apiaryId` e il `queenId` fissati alla `date` indicata. Il server
registra anche un evento `HARVEST` con `amountKg` e il titolo
`18.5 kg spring flow` (`Honey` quando `variety` è vuoto), che è ciò che
`GetDashboard` e `GetHoneyStats` sommano.

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/ListHarvests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","page":{"pageSize":20}}'
```

`ListHarvests` filtra per `hiveId` o `apiaryId` (entrambi facoltativi) e
restituisce `{"harvests": [...], "page": {...}}`, dal più recente.
`DeleteHarvest` accetta `{"id": ...}` e scrive una tombstone; non esiste un
RPC di aggiornamento.

## Eventi

```bash
curl -s -X POST "$OB/openbeehive.v1.EventService/ListEvents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","limit":20}'
```

I filtri sono `apiaryId`, `hiveId` e `queenId`; `limit` ha 100 come
predefinito ed è limitato a 1000. Gli eventi arrivano dal più recente e non
sono paginati. Ognuno ha `type` (`EVENT_TYPE_INSPECTION`,
`EVENT_TYPE_HARVEST`, ...), gli `apiaryId` / `hiveId` / `queenId` fissati,
`refEntity` / `refId` che puntano alla riga di dettaglio, `amountKg` per i
raccolti, `detailJson` e `authorId`.

## Panoramica

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

`thresholdDays` (predefinito 21) stabilisce quando un'arnia conta come in
scadenza: le arnie la cui ultima ispezione ha almeno quel numero di giorni,
più le arnie mai ispezionate (`daysSinceLast: -1`, elencate per prime).
`nextTasks` contiene le prossime cinque attività aperte, `recentInspections`
le ultime dieci visite. Le cifre sul miele vengono dagli eventi `HARVEST`;
`honeyKgSeason` è l'anno solare corrente. `GetHoneyStats` accetta `year`
(0 = tutti gli anni) e restituisce le somme `perQueen`, `perApiary` e
`perYear`.

## Leggere il feed delle modifiche

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

`payloadJson` è una stringa JSON le cui chiavi sono i nomi delle colonne della
tabella in `snake_case`. Restituisci `nextCursor` come `cursor` per continuare.
Il feed contiene ogni modifica, sia che l'abbia inviata un dispositivo sia che
l'abbia scritta un RPC di servizio; le collocazioni compaiono solo qui,
perché non hanno un servizio proprio. Vedi il
[protocollo di sincronizzazione](/developers/sync-protocol) per come scrivere
modifiche con `Push`.

## Paginazione

Ogni RPC `List*` tranne `ListEvents` accetta `page: { pageSize, pageToken }`
e restituisce `page: { nextPageToken, total }`:

- `pageSize`: righe per pagina, predefinito 50, limitato a 500.
- `pageToken`: l'offset da cui partire, come stringa decimale. Invia il
  `nextPageToken` della risposta precedente; `""` o assente parte dalla prima
  riga.
- `nextPageToken`: impostato quando la pagina era piena ed esistono altre
  righe; assente sull'ultima pagina.
- `total`: numero di righe corrispondenti.

`ListEvents` accetta un semplice `limit`. `Pull` usa i propri campi
`cursor` / `nextCursor` / `hasMore`.

## Errori

Gli errori tornano come corpo JSON con un codice Connect:

```json
{ "code": "not_found", "message": "not found" }
```

| Codice | HTTP | Quando |
| --- | --- | --- |
| `invalid_argument` | 400 | `name` vuoto; `hiveId` mancante (ispezione, regina, trattamento, raccolto), `year` (regina), `title` (attività), `product` (trattamento); `amountKg` non superiore a `0` (raccolto); `apiaryId` inesistente su `CreateTask`; una foto che non è un URL `data:image/` o supera 512 KiB; `hive` / `queen` mancante nelle chiamate di aggiornamento |
| `unauthenticated` | 401 | Token mancante, scaduto o rimosso: una chiave API sconosciuta o revocata, oppure un token di sessione oltre `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Sessione demo che chiama un RPC di scrittura; `Push` in uno scope in cui non puoi scrivere |
| `not_found` | 404 | Id sconosciuto, o id che appartiene a un altro tenant, su qualsiasi `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, le chiamate sulle foto e ogni `Create*` che fa riferimento a un'arnia o a un apiario |
| `internal` | 500 | Errori del database |

Vedi il [riferimento agli errori di Connect](https://connectrpc.com/docs/protocol/#error-codes)
per l'elenco completo dei codici.

## Note

- Invia `{}` per una richiesta senza campi.
- `Content-Type: application/json` seleziona il protocollo Connect JSON.
  `application/proto` invia protobuf binario sullo stesso URL.
- `SyncService.Subscribe` è uno stream lato server e richiede un client di
  streaming; vedi [gRPC](/using-the-api/grpc).
