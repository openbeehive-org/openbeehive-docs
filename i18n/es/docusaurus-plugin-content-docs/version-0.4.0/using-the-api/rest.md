---
sidebar_position: 2
title: "REST / HTTP + JSON"
---

# REST / HTTP + JSON

Cada RPC acepta un `POST` plano con un cuerpo JSON, siguiendo el
[protocolo Connect](https://connectrpc.com/docs/protocol/). No hace falta
ninguna herramienta gRPC.

## Forma de la solicitud

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
Content-Type: application/json
Authorization: Bearer <token>      # only when login is configured
```

- El cuerpo es el mensaje de solicitud en JSON proto3: nombres de campo en
  `lowerCamelCase` (`apiaryId`, `pageSize`, `weightKg`). El servidor también
  acepta los nombres proto en `snake_case`, pero las respuestas usan siempre
  `lowerCamelCase`.
- Los campos de enumeración aceptan el nombre del valor (`"HIVE_TYPE_DADANT"`,
  `"STORES_GOOD"`) o su número. Las respuestas usan el nombre.
- Las marcas de tiempo son cadenas RFC 3339 en UTC (`"2026-06-19T09:14:02Z"`).
  Omite una marca de tiempo para obtener el valor por defecto del servidor
  (`date` e `introducedAt` toman por defecto el momento actual; `dueAt` y
  `withdrawalUntil` quedan sin definir).
- La respuesta es el mensaje de respuesta en JSON con HTTP `200`.
- Los campos con su valor por defecto (cadena vacía, `0`, `false`, lista
  vacía) se omiten en las respuestas.

Los ejemplos siguientes usan `$OB` para el origen y `$TOKEN` para una clave
API (`obhk_...`, creada en **Ajustes → Claves API**) o un token de sesión,
como se describe en la [visión general](./overview.md#authentication). Quita
la cabecera `Authorization` en una instancia sin inicio de sesión.

## Listar colmenares

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

## Crear un colmenar

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/CreateApiary" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Orchard Meadow","address":"Field road 3","lat":48.21,"lng":16.37}'
```

`name` no puede estar vacío (`invalid_argument` en caso contrario). La
respuesta es `{"apiary": {...}}`. `UpdateApiary` recibe `id` más los mismos
campos y los sobrescribe todos.

## Crear y listar colmenas

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

`ListHives` sin `apiaryId` lista todas las colmenas del espacio. `CreateHive`
necesita `apiaryId` y `name`; la nueva colmena recibe el estado
`HIVE_STATUS_ACTIVE`, un intervalo de ubicación abierto y un evento `CREATED`.
`UpdateHive` recibe el mensaje `hive` completo y sobrescribe `name`, `type`,
`status`, `boxes`, `colonyOrigin`, `note` y `qrCode`; deja intactos `apiaryId`
y la foto. `RelocateHive` recibe `{"id": ..., "targetApiaryId": ..., "date": ...}`
(`date` opcional, por defecto el momento actual), cierra la ubicación actual,
abre una nueva y registra un evento `MOVED`. `DeleteApiary` y `DeleteHive`
escriben una lápida, así que la eliminación llega a los dispositivos mediante
la sincronización.

## Registrar una inspección

Todos los campos excepto `hiveId` son opcionales. Una báscula de colmena
enviaría solo las mediciones:

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

Una visita completa usa la misma llamada con los campos de la ficha de
colmena:

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

`stores` es uno de `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` uno de `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. El servidor almacena el colmenar y la reina
reinante en la `date` indicada y registra un evento `INSPECTION`. Los campos
que omites se almacenan como `0`, `false` o `""`.

Las fotos se añaden después con `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` debe ser una data URL que empiece por `data:image/` y de como máximo
512 KiB incluido el prefijo. Se replica a todos los dispositivos, así que
envía una miniatura (la aplicación almacena unos 480 px).
`RemoveInspectionPhoto` recibe el mismo `inspectionId` y el valor `photo`
exacto almacenado; `inspection.photoKeys` en la respuesta lista lo que hay
almacenado.

## Listar inspecciones con paginación

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

Los resultados van de más reciente a más antiguo. Devuelve `nextPageToken`
como `pageToken` para la siguiente página:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/ListInspections" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","page":{"pageSize":2,"pageToken":"2"}}'
```

La última página no tiene `nextPageToken`. `ListInspections` sin `hiveId`
lista todas las inspecciones del espacio.

## Crear una reina

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

`hiveId` y `year` son obligatorios. `marking` toma por defecto el color
internacional del año (`MARKING_COLOR_WHITE` para años terminados en 1 o 6,
`YELLOW` 2/7, `RED` 3/8, `GREEN` 4/9, `BLUE` 5/0); `introducedAt` toma por
defecto el momento actual. Crear una reina termina siempre el reinado de la
reina activa actual de la colmena (`active: false`, `replacedAt` establecido)
y registra los eventos `QUEEN_REPLACED` y `QUEEN_INTRODUCED`. `ListQueens`
recibe `hiveId` y `onlyActive`; `UpdateQueen` recibe el mensaje `queen`
completo y actualiza `year`, `marking`, `origin`, `breederNumber`,
`introducedAt`, `replacedAt`, `active` y `note` (`hiveId` no puede cambiar).

## Tareas

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

`title` es obligatorio. Una tarea con `hiveId` hereda el `apiaryId` de la
colmena cuando no envías ninguno; `apiaryId` debe existir en tu espacio. Una
tarea sin ninguno de los dos es personal y se sincroniza solo con tus propios
dispositivos. Márcala como hecha con:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

La respuesta es `{"task": {...}}` con `"done": true`. `ListTasks` recibe
`onlyOpen` y `hiveId` y devuelve primero las tareas abiertas, ordenadas por
`dueAt`.

## Tratamientos

```bash
curl -s -X POST "$OB/openbeehive.v1.TreatmentService/CreateTreatment" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","product":"Oxuvar 5.7%","activeIngredient":"oxalic acid","dose":"50 ml","method":"trickling","batchNumber":"L2405","withdrawalUntil":"2026-12-01T00:00:00Z"}'
```

`hiveId` y `product` son obligatorios; `reason` toma por defecto `"varroa"`.
El `treatment` de la respuesta lleva los `apiaryId` y `queenId` congelados en
la `date` indicada. `ListTreatments` recibe `hiveId` y devuelve los más
recientes primero.

## Cosechas

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

`hiveId` es obligatorio y `amountKg` debe ser mayor que `0`
(`invalid_argument` en caso contrario); `date` toma por defecto el momento
actual. La respuesta lleva los `apiaryId` y `queenId` congelados en la `date`
indicada. El servidor también registra un evento `HARVEST` con `amountKg` y
el título `18.5 kg spring flow` (`Honey` cuando `variety` está vacío), que es
lo que suman `GetDashboard` y `GetHoneyStats`.

```bash
curl -s -X POST "$OB/openbeehive.v1.HarvestService/ListHarvests" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-...","page":{"pageSize":20}}'
```

`ListHarvests` filtra por `hiveId` o `apiaryId` (ambos opcionales) y devuelve
`{"harvests": [...], "page": {...}}`, de más reciente a más antiguo.
`DeleteHarvest` recibe `{"id": ...}` y escribe una lápida; no hay RPC de
actualización.

## Eventos

```bash
curl -s -X POST "$OB/openbeehive.v1.EventService/ListEvents" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"hiveId":"c41a...","limit":20}'
```

Los filtros son `apiaryId`, `hiveId` y `queenId`; `limit` es 100 por defecto
y tiene un tope de 1000. Los eventos llegan de más reciente a más antiguo y no
están paginados. Cada uno tiene `type` (`EVENT_TYPE_INSPECTION`,
`EVENT_TYPE_HARVEST`, ...), los `apiaryId` / `hiveId` / `queenId`
congelados, `refEntity` / `refId` apuntando a la fila de detalle, `amountKg`
para las cosechas, `detailJson` y `authorId`.

## Panel de resumen

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

`thresholdDays` (por defecto 21) define cuándo una colmena cuenta como
pendiente: las colmenas cuya última inspección tiene al menos esa cantidad de
días, más las colmenas nunca inspeccionadas (`daysSinceLast: -1`, listadas
primero). `nextTasks` contiene las siguientes cinco tareas abiertas,
`recentInspections` las últimas diez visitas. Las cifras de miel provienen de
los eventos `HARVEST`; `honeyKgSeason` es el año natural en curso.
`GetHoneyStats` recibe `year` (0 = todos los años) y devuelve las sumas
`perQueen`, `perApiary` y `perYear`.

## Descargar el feed de cambios

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

`payloadJson` es una cadena JSON cuyas claves son los nombres de columna de
la tabla en `snake_case`. Devuelve `nextCursor` como `cursor` para continuar.
El feed contiene todos los cambios, tanto si los envió un dispositivo como si
los escribió un RPC de servicio; las ubicaciones aparecen solo aquí, ya que
no tienen servicio propio. Consulta el
[protocolo de sincronización](/developers/sync-protocol) para saber cómo
escribir cambios con `Push`.

## Paginación

Cada RPC `List*` excepto `ListEvents` recibe `page: { pageSize, pageToken }`
y devuelve `page: { nextPageToken, total }`:

- `pageSize`: filas por página, por defecto 50, con un tope de 500.
- `pageToken`: el desplazamiento desde el que empezar, como cadena decimal.
  Envía el `nextPageToken` de la respuesta anterior; `""` o ausente empieza
  en la primera fila.
- `nextPageToken`: presente cuando la página estaba llena y existen más filas;
  ausente en la última página.
- `total`: número de filas coincidentes.

`ListEvents` recibe un `limit` simple. `Pull` usa sus propios campos
`cursor` / `nextCursor` / `hasMore`.

## Errores

Los errores vuelven como un cuerpo JSON con un código Connect:

```json
{ "code": "not_found", "message": "not found" }
```

| Código | HTTP | Cuándo |
| --- | --- | --- |
| `invalid_argument` | 400 | `name` vacío; falta `hiveId` (inspección, reina, tratamiento, cosecha), `year` (reina), `title` (tarea), `product` (tratamiento); `amountKg` no mayor que `0` (cosecha); un `apiaryId` que no existe en `CreateTask`; una foto que no es una URL `data:image/` o supera 512 KiB; falta `hive` / `queen` en las llamadas de actualización |
| `unauthenticated` | 401 | Token ausente, caducado o eliminado: una clave API desconocida o revocada, o un token de sesión que ha superado `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Sesión de demostración llamando a un RPC de escritura; `Push` a un ámbito en el que no puedes escribir |
| `not_found` | 404 | Id desconocido, o un id que pertenece a otro espacio, en cualquier `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, las llamadas de foto y cada `Create*` que referencia una colmena o un colmenar |
| `internal` | 500 | Errores de base de datos |

Consulta la [referencia de errores de Connect](https://connectrpc.com/docs/protocol/#error-codes)
para la lista completa de códigos.

## Notas

- Envía `{}` para una solicitud sin campos.
- `Content-Type: application/json` selecciona el protocolo JSON de Connect.
  `application/proto` envía protobuf binario por la misma URL.
- `SyncService.Subscribe` es un stream desde el servidor y necesita un cliente
  de streaming; consulta [gRPC](/using-the-api/grpc).
