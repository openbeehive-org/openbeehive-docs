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
(`obhk_...`, creata in **Impostazioni → Spazio → Chiavi API**) o per un token di
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
`{"apiary": {...}}`. `UpdateApiary` accetta `id` più i campi da modificare;
vedi [Aggiornare un record](#update-a-record). `DeleteApiary` fallisce con
`failed_precondition` finché l'apiario ha ancora arnie.

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

`ListHives` senza `apiaryId` elenca tutte le arnie dello spazio ed è paginato
come gli altri elenchi (`total` è il numero reale di arnie corrispondenti).
`CreateHive` richiede `apiaryId` e `name`; la nuova arnia riceve lo stato
`HIVE_STATUS_ACTIVE`, un intervallo di collocazione aperto e un evento
`CREATED`. `UpdateHive` accetta un messaggio `hive` con `id` e i campi da
modificare (`name`, `type`, `status`, `boxes`, `colonyOrigin`, `note`,
`qrCode`); non modifica mai `apiaryId` né la foto. `RelocateHive` accetta
`{"id": ..., "targetApiaryId": ..., "date": ...}` (`date` facoltativa, con
l'istante attuale come predefinito), chiude la collocazione attuale, ne apre
una nuova e registra un evento `MOVED`. `DeleteApiary` e `DeleteHive`
scrivono una tombstone, quindi la cancellazione raggiunge i dispositivi
tramite la sincronizzazione. `DeleteHive` elimina anche le attività aperte
dell'arnia.

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
    "varroa": "2",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` è uno tra `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` uno tra `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. Il server memorizza l'apiario e la regina regnante
alla `date` indicata e registra un evento `INSPECTION`.

I numeri di un'ispezione (`frames`, `broodFrames`, `queenCells`,
`youngestLarva`, `framesAdded`, `framesRemoved`, `fedKg`, `honeyKg`,
`weightKg` e i quattro campi climatici) sono facoltativi: un
campo che ometti viene memorizzato come "non registrato" ed è assente dalle
risposte, mentre uno `0` esplicito viene memorizzato e restituito come uno
zero osservato. `honeyKg` è mantenuto per i vecchi record; registra il miele
con `HarvestService`.

`source` indica chi ha creato la voce: `INSPECTION_SOURCE_MANUAL` (il valore
predefinito quando non ne invii nessuno) per una visita fatta da una persona,
`INSPECTION_SOURCE_SENSOR` per una lettura automatica. Le letture dei sensori
compaiono nei grafici ma non contano come "ultima visita" e sono escluse
dall'elenco delle visite in scadenza e dalle ispezioni recenti della
dashboard; vedi [Tracker automatici](./automated-trackers.md).

`CreateInspection` e `UpdateInspection` rifiutano una `date` più di un giorno
nel futuro (`invalid_argument`).

### Foto \{#photos}

Le foto si aggiungono in seguito con `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` è un data URL in base64 di un'immagine JPEG, PNG o WebP di al massimo
5 MiB una volta decodificata. Il server memorizza l'immagine nell'archiviazione
blob, crea una miniatura di circa 200 px e restituisce l'ispezione con le sue
`photos`; aggiungere due volte la stessa immagine non ha ulteriori effetti.
Ogni voce di `photos` ha `id`, `thumbnail`, `contentType`, `sizeBytes`,
`createdAt` e `path`. `RemoveInspectionPhoto` accetta `inspectionId` e, come
`photo`, l'`id` della foto (oppure il data URL con cui è stata aggiunta); la
foto viene eliminata definitivamente, su ogni dispositivo. `photoKeys` elenca
solo le foto incorporate scritte dalle app 0.4.x.

L'immagine a piena risoluzione si ottiene con un semplice GET di `path`, con le
stesse credenziali:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/photos/3c9d..." -o photo.jpg
```

Risponde `404` con `not_uploaded` finché il dispositivo che ha scattato la foto
non ha caricato l'immagine, e `410` (`deleted`) per una foto eliminata.
L'immagine dietro un id non cambia mai, quindi può essere messa in cache.
`POST /photos/<id>` con l'immagine come corpo è il modo in cui l'app carica
l'immagine di un record di foto che ha già sincronizzato; viene accettato una
sola volta per foto. Le chiavi in sola lettura e l'account demo non possono
caricare immagini.

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
elenca tutte le ispezioni dello spazio. `source` filtra in base a chi ha
registrato la voce: omettilo per avere tutto, `"INSPECTION_SOURCE_MANUAL"`
solo per le visite fatte da una persona, `"INSPECTION_SOURCE_SENSOR"` solo
per le letture.

## Aggiornare un record \{#update-a-record}

`UpdateApiary`, `UpdateHive`, `UpdateQueen`, `UpdateInspection`,
`UpdateTask`, `UpdateTreatment` e `UpdateHarvest` modificano solo i campi che
invii. Correggere il peso di un'ispezione:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e...","weightKg":41.9}}'
```

Tutto il resto del record rimane com'è. Per impostare un campo al suo valore
zero, o per riportare un numero facoltativo a "non registrato", indicalo in
`updateMask`:

```bash
# clear the note and remove the recorded weight
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e..."},"updateMask":"note,weightKg"}'
```

Con una maschera vengono scritti esattamente i campi elencati e nient'altro.
I percorsi della maschera possono essere scritti in `lowerCamelCase` o in
`snake_case`; un percorso sconosciuto risponde `invalid_argument` con l'elenco
dei campi che la chiamata può aggiornare.
Una richiesta che non cambierebbe nulla risponde `invalid_argument`. Le regole
per ciascuna chiamata:

| Chiamata | Richiesta | Note |
| --- | --- | --- |
| `UpdateApiary` | `id` e i campi al livello superiore, più `updateMask` | `name` non deve diventare vuoto |
| `UpdateHive` | `hive`, `updateMask` | `apiaryId` viene ignorato (usa `RelocateHive`); `status` non può essere impostato a non specificato |
| `UpdateQueen` | `queen`, `updateMask` | Senza maschera, inviare solo `replacedAt` termina il regno (`active` diventa `false`) e inviare `active: true` azzera `replacedAt` |
| `UpdateInspection` | `inspection`, `updateMask` | Le foto cambiano tramite le chiamate sulle foto; l'evento `INSPECTION` segue una `date` modificata |
| `UpdateTask` | `task`, `updateMask` | `hiveId` e `apiaryId` non possono cambiare; usa una maschera per rimuovere `dueAt` o riaprire un'attività |
| `UpdateTreatment` | `treatment`, `updateMask` | Imposta `amendedAt`; l'apiario e la regina vengono risolti di nuovo quando `date` cambia |
| `UpdateHarvest` | `harvest`, `updateMask` | Imposta `amendedAt`; `amountKg` deve restare superiore a `0`; le cifre sul miele seguono la modifica |

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
`ListQueens` accetta `hiveId` e `onlyActive`; `UpdateQueen` corregge `year`,
`marking`, `origin`, `breederNumber`, `introducedAt`, `replacedAt`, `active`
e `note` (`hiveId` non può cambiare; vedi
[Aggiornare un record](#update-a-record)). `DeleteQueen` rimuove anche i suoi
eventi `QUEEN_INTRODUCED` e `QUEEN_REPLACED`.

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
dell'arnia quando non ne invii uno; `apiaryId` deve esistere nel tuo spazio.
Un'attività senza nessuno dei due è personale: si sincronizza solo sui tuoi
dispositivi e `ListTasks` la restituisce solo a te. Spuntala con:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

La risposta è `{"task": {...}}` con `"done": true`. `ListTasks` accetta
`onlyOpen` e `hiveId` e restituisce prima le attività aperte, ordinate per
`dueAt`. `UpdateTask` modifica `title`, `dueAt`, `done`, `priority`, `note`,
`recurrence` e `assignedTo`.

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
i risultati dal più recente. `UpdateTreatment` corregge un trattamento e
imposta `amendedAt`, che l'app mostra come "Modificato il" e stampa nel
registro dei trattamenti; `DeleteTreatment` rimuove anche il suo evento
`TREATMENT`.

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
`UpdateHarvest` corregge un raccolto e imposta `amendedAt`; `DeleteHarvest`
accetta `{"id": ...}`, scrive una tombstone e rimuove l'evento `HARVEST`,
quindi le cifre sul miele non lo contano più.

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

`timeZone` stabilisce il calendario in cui si contano i giorni: un nome IANA
come `"Europe/Berlin"` o uno scostamento fisso come `"+02:00"`. Senza, il
server conta in UTC; un fuso sconosciuto risponde `invalid_argument`.

`thresholdDays` (predefinito 10, contati in giorni di calendario come nell'app) stabilisce quando un'arnia conta come in
scadenza: le arnie la cui ultima ispezione ha almeno quel numero di giorni,
più le arnie mai ispezionate (`daysSinceLast: -1`, elencate per prime).
Le letture dei sensori (`INSPECTION_SOURCE_SENSOR`) qui non contano come
ispezioni e non sono elencate in `recentInspections`. `nextTasks` contiene le prossime cinque attività aperte, `recentInspections`
le ultime dieci visite. Le cifre sul miele vengono dagli eventi `HARVEST`;
`honeyKgSeason` è l'anno solare corrente. `GetHoneyStats` accetta `year`
(0 = tutti gli anni) e restituisce le somme `perQueen`, `perApiary` e
`perYear`.

## Esportare uno spazio \{#export}

`GET /export` scarica lo spazio attivo nel formato del backup completo
dell'app, che l'app può importare di nuovo; `GET /export?photos=1` restituisce
uno ZIP che aggiunge le immagini a piena risoluzione. Accetta una sessione o
una chiave API di scrittura e contiene ogni record attivo dello spazio con le
tue attività personali, ma non quelle degli altri membri.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/export?photos=1" -o openbeehive.zip
```

La risposta è un allegato chiamato `openbeehive-server-<date>.json` o
`.zip`. Le chiavi in sola lettura e l'account demo ricevono `403`; oltre 5
esportazioni per utente all'ora ricevono `429` con `Retry-After`. Pesi e
temperature sono in kg e °C.

## Leggere il feed delle modifiche

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

`payloadJson` è una stringa JSON le cui chiavi sono i nomi delle colonne della
tabella in `snake_case`. Restituisci `nextCursor` come `cursor` per continuare;
è opaco. Senza l'intestazione `Openbeehive-Sync-Protocol` il server risponde
come faceva per le app 0.4.1: solo le colonne di quella release, nessun record
di foto e semplici numeri di sequenza come cursori. Uno `status` diverso da
unspecified significa che il cursore non può essere servito; carica invece uno
`Snapshot`. `limit` ha 200 come predefinito ed è limitato a 500. Il feed copre lo spazio
del chiamante; le righe personali (scope `user:<id>`) vengono restituite solo
al loro proprietario. Il feed contiene ogni modifica, sia che l'abbia inviata un dispositivo sia che
l'abbia scritta un RPC di servizio; le collocazioni compaiono solo qui,
perché non hanno un servizio proprio. Vedi il
[protocollo di sincronizzazione](../developers/sync-protocol.md) per come scrivere
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
| `invalid_argument` | 400 | `name` vuoto; `hiveId` mancante (ispezione, regina, trattamento, raccolto), `year` (regina), `title` (attività), `product` (trattamento); `amountKg` non superiore a `0` (raccolto); `apiaryId` inesistente su `CreateTask`; una foto che non è un data URL di un'immagine JPEG, PNG o WebP di al massimo 5 MiB; `hive` / `queen` mancante nelle chiamate di aggiornamento |
| `unauthenticated` | 401 | Token mancante, scaduto o rimosso: una chiave API sconosciuta o revocata, oppure un token di sessione oltre `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Sessione demo o chiave API in sola lettura che chiama un RPC di scrittura |
| `failed_precondition` | 400 | `DeleteApiary` finché l'apiario ha ancora arnie; una chiamata a `SyncService` al di sotto di `BEEHIVE_SYNC_MIN_PROTOCOL`, oppure `Snapshot` senza l'intestazione del protocollo (con un dettaglio `UpgradeRequired`) |
| `resource_exhausted` | 429 | Più di 4 stream `Subscribe` aperti per un utente |
| `not_found` | 404 | Id sconosciuto, o id che appartiene a un altro spazio, su qualsiasi `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, le chiamate sulle foto e ogni `Create*` che fa riferimento a un'arnia o a un apiario |
| `unavailable` | 503 | Una chiamata sulle foto mentre il server non ha un'archiviazione blob |
| `internal` | 500 | Errori lato server. Il messaggio è sempre `internal error`; i dettagli si trovano solo nel log del server |

Anche un aggiornamento che non cambierebbe nulla e un `Push` con più di 2000
modifiche rispondono `invalid_argument`. Vedi il
[riferimento agli errori di Connect](https://connectrpc.com/docs/protocol/#error-codes)
per l'elenco completo dei codici.

### Codici di errore degli endpoint HTTP semplici \{#http-error-codes}

Gli endpoint `/auth/*` e `/tenants/*` non sono RPC. I loro errori sono
`{"error": "<plain English>", "code": "<snake_case>"}` con uno stato HTTP
corrispondente. I client dovrebbero basarsi su `code`; il testo può cambiare.

| HTTP | Codici |
| --- | --- |
| 400 | `invalid_body`, `invalid_email`, `invalid_scope`, `invalid_expiry`, `invalid_role`, `invalid_password`, `password_too_long`, `id_required`, `name_required`, `org_id_required`, `cannot_remove_self`, `invite_invalid`, `invite_expired`, `reset_invalid`, `passkey_no_ceremony`, `passkey_failed` |
| 401 | `not_signed_in`, `invalid_credentials`, `passkey_failed` |
| 403 | `cross_site_request`, `demo_read_only`, `invite_only`, `invite_email_mismatch`, `not_a_member`, `owner_only`, `admin_only`, `account_protected`, `password_managed`, `wrong_password`, `reauth_required`, `login_required`, `passkey_failed`, `passkey_session_mismatch` |
| 404 | `not_found`, `invite_not_found`, `key_not_found`, `member_not_found`, `account_not_found`, `passkey_not_found` |
| 405 | `method_not_allowed` |
| 409 | `email_taken`, `already_member`, `last_owner`, `no_password`, `passkey_none`, `reset_needs_admin` |
| 413 | `body_too_large` |
| 415 | `unsupported_media_type` |
| 429 | `rate_limited` (con `Retry-After`) |
| 500 | `internal` |
| 503 | `demo_unavailable`, `unavailable` |

Le pagine che un browser apre direttamente (`/auth/verify`, `/auth/login`,
`/auth/callback`) non rispondono con JSON: reindirizzano a
`/login?error=<code>`, dove l'app mostra un messaggio tradotto. I loro codici
sono `verification_invalid`, `unknown_provider`, `oidc_state_missing`,
`oidc_state_invalid`, `oidc_failed`, `oidc_no_email`, `account_exists`,
`invite_only` e `internal`.

`/photos/` e `/export` usano la stessa forma JSON degli errori con
`not_signed_in` (401), `cross_site_request`, `demo_read_only`, `read_only`
(403), `not_found`, `unknown_photo`, `not_uploaded` (404), `deleted` (410),
`too_large` (413), `unsupported_type` (415), `rate_limited` (429) e
`unavailable` (503).

## Note

- Invia `{}` per una richiesta senza campi.
- `Content-Type: application/json` seleziona il protocollo Connect JSON.
  `application/proto` invia protobuf binario sullo stesso URL. Una richiesta
  senza `Content-Type`, o con un altro, risponde `415` con un errore JSON che lo segnala.
- `SyncService.Subscribe` è uno stream lato server e richiede un client di
  streaming; vedi [gRPC](./grpc.md).
