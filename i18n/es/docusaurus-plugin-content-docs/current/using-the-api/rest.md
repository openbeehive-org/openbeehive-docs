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
API (`obhk_...`, creada en **Ajustes → Espacio → Claves API**) o un token de sesión,
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
respuesta es `{"apiary": {...}}`. `UpdateApiary` recibe `id` más los campos que hay que cambiar; consulta
[Actualizar un registro](#update-a-record). `DeleteApiary` falla con
`failed_precondition` mientras el colmenar aún tenga colmenas.

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

`ListHives` sin `apiaryId` lista todas las colmenas del espacio y está
paginado como las demás listas (`total` es el número real de colmenas
coincidentes). `CreateHive`
necesita `apiaryId` y `name`; la nueva colmena recibe el estado
`HIVE_STATUS_ACTIVE`, un intervalo de ubicación abierto y un evento `CREATED`.
`UpdateHive` recibe un mensaje `hive` con `id` y los campos que hay que cambiar (`name`, `type`,
`status`, `boxes`, `colonyOrigin`, `note`, `qrCode`); nunca cambia `apiaryId`
ni la foto. `RelocateHive` recibe `{"id": ..., "targetApiaryId": ..., "date": ...}`
(`date` opcional, por defecto el momento actual), cierra la ubicación actual,
abre una nueva y registra un evento `MOVED`. `DeleteApiary` y `DeleteHive`
escriben una lápida, así que la eliminación llega a los dispositivos mediante
la sincronización. `DeleteHive` elimina también las tareas abiertas de la colmena.

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
    "varroa": "2",
    "superAdded": true,
    "note": "strong, added second super"
  }'
```

`stores` es uno de `STORES_GOOD`, `STORES_MEDIUM`, `STORES_LOW`,
`STORES_NONE`; `temperament` uno de `TEMPERAMENT_VERY_GENTLE`,
`TEMPERAMENT_GENTLE`, `TEMPERAMENT_NORMAL`, `TEMPERAMENT_NERVOUS`,
`TEMPERAMENT_AGGRESSIVE`. El servidor almacena el colmenar y la reina
reinante en la `date` indicada y registra un evento `INSPECTION`.

Los números de una inspección (`frames`, `broodFrames`, `queenCells`,
`youngestLarva`, `framesAdded`, `framesRemoved`, `fedKg`, `honeyKg`,
`weightKg` y los cuatro campos de clima) son opcionales: un campo
que omites se almacena como "no registrado" y no aparece en las respuestas, mientras que
un `0` explícito se almacena y se devuelve como un cero observado. `honeyKg` se conserva
para los registros antiguos; registra la miel con `HarvestService`.

`source` indica quién hizo la entrada: `INSPECTION_SOURCE_MANUAL` (el valor por defecto
cuando no envías ninguno) para una visita hecha por una persona, `INSPECTION_SOURCE_SENSOR` para
una lectura automática. Las lecturas de sensor aparecen en los gráficos, pero no cuentan
como "última inspección" y quedan fuera de la lista de pendientes y de las inspecciones
recientes del panel; consulta [Rastreadores automáticos](./automated-trackers.md).

`CreateInspection` y `UpdateInspection` rechazan una `date` con más de un día
de adelanto (`invalid_argument`).

### Fotos \{#photos}

Las fotos se añaden después con `AddInspectionPhoto`:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/AddInspectionPhoto" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspectionId":"7f0e...","photo":"data:image/jpeg;base64,/9j/4AAQ..."}'
```

`photo` es una data URL en base64 de una imagen JPEG, PNG o WebP de como máximo
5 MiB una vez decodificada. El servidor guarda la imagen en el almacenamiento de
blobs, crea una miniatura de unos 200 px y devuelve la inspección con sus
`photos`; añadir la misma imagen dos veces no tiene más efecto. Cada entrada de
`photos` tiene `id`, `thumbnail`, `contentType`, `sizeBytes`, `createdAt` y
`path`. `RemoveInspectionPhoto` recibe `inspectionId` y, como `photo`, el `id`
de la foto (o la data URL con la que se añadió); la foto se elimina de forma
definitiva, en todos los dispositivos. `photoKeys` lista solo las fotos en línea
escritas por las aplicaciones 0.4.x.

La imagen a tamaño completo es un simple GET de `path` con las mismas
credenciales:

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/photos/3c9d..." -o photo.jpg
```

Responde `404` con `not_uploaded` mientras el dispositivo que tomó la foto aún
no ha subido la imagen, y `410` (`deleted`) para una foto eliminada. La imagen
detrás de un id nunca cambia, así que se puede almacenar en caché.
`POST /photos/<id>` con la imagen como cuerpo es como la aplicación sube la
imagen de un registro de foto que ya ha sincronizado; se acepta una sola vez por
foto. Las claves de solo lectura y la cuenta de demostración no pueden subir
imágenes.

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
lista todas las inspecciones del espacio. `source` filtra según quién registró
la entrada: omítelo para obtener todo, `"INSPECTION_SOURCE_MANUAL"` solo para
visitas hechas por una persona, `"INSPECTION_SOURCE_SENSOR"` solo para lecturas.

## Actualizar un registro \{#update-a-record}

`UpdateApiary`, `UpdateHive`, `UpdateQueen`, `UpdateInspection`,
`UpdateTask`, `UpdateTreatment` y `UpdateHarvest` cambian solo los campos
que envías. Corregir el peso de una inspección:

```bash
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e...","weightKg":41.9}}'
```

Todo lo demás del registro se queda como está. Para poner un campo en su valor
cero, o para devolver un número opcional a "no registrado", nómbralo en
`updateMask`:

```bash
# clear the note and remove the recorded weight
curl -s -X POST "$OB/openbeehive.v1.InspectionService/UpdateInspection" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"inspection":{"id":"7f0e..."},"updateMask":"note,weightKg"}'
```

Con una máscara se escriben exactamente los campos listados y nada más. Las rutas
de la máscara pueden escribirse en `lowerCamelCase` o en `snake_case`; una ruta desconocida
responde `invalid_argument` con la lista de campos que la llamada puede actualizar. Una
solicitud que no cambiaría nada responde `invalid_argument`. Las reglas por
llamada:

| Llamada | Solicitud | Notas |
| --- | --- | --- |
| `UpdateApiary` | `id` y los campos en el nivel superior, más `updateMask` | `name` no puede quedar vacío |
| `UpdateHive` | `hive`, `updateMask` | `apiaryId` se ignora (usa `RelocateHive`); `status` no se puede poner en sin especificar |
| `UpdateQueen` | `queen`, `updateMask` | Sin máscara, enviar solo `replacedAt` termina el reinado (`active` pasa a `false`) y enviar `active: true` vacía `replacedAt` |
| `UpdateInspection` | `inspection`, `updateMask` | Las fotos cambian mediante las llamadas de foto; el evento `INSPECTION` sigue a una `date` cambiada |
| `UpdateTask` | `task`, `updateMask` | `hiveId` y `apiaryId` no pueden cambiar; usa una máscara para quitar `dueAt` o reabrir una tarea |
| `UpdateTreatment` | `treatment`, `updateMask` | Establece `amendedAt`; el colmenar y la reina se resuelven de nuevo cuando `date` se mueve |
| `UpdateHarvest` | `harvest`, `updateMask` | Establece `amendedAt`; `amountKg` debe seguir por encima de `0`; las cifras de miel siguen a la edición |

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
recibe `hiveId` y `onlyActive`; `UpdateQueen` corrige `year`, `marking`, `origin`, `breederNumber`,
`introducedAt`, `replacedAt`, `active` y `note` (`hiveId` no puede cambiar;
consulta [Actualizar un registro](#update-a-record)). `DeleteQueen` elimina también sus
eventos `QUEEN_INTRODUCED` y `QUEEN_REPLACED`.

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
tarea sin ninguno de los dos es personal: se sincroniza solo con tus propios
dispositivos y `ListTasks` la devuelve solo a ti. Márcala como hecha con:

```bash
curl -s -X POST "$OB/openbeehive.v1.TaskService/SetTaskDone" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"id":"e3b7...","done":true}'
```

La respuesta es `{"task": {...}}` con `"done": true`. `ListTasks` recibe
`onlyOpen` y `hiveId` y devuelve primero las tareas abiertas, ordenadas por
`dueAt`. `UpdateTask` cambia `title`, `dueAt`, `done`, `priority`, `note`,
`recurrence` y `assignedTo`.

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
recientes primero. `UpdateTreatment` corrige un tratamiento y marca `amendedAt`, que la aplicación
muestra como "Modificado el" e imprime en el registro de tratamientos;
`DeleteTreatment` elimina también su evento `TREATMENT`.

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
`UpdateHarvest` corrige una cosecha y marca `amendedAt`; `DeleteHarvest` recibe `{"id": ...}`, escribe
una lápida y elimina el evento `HARVEST`, de modo que las cifras de miel ya no
la cuentan.

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

`thresholdDays` (por defecto 10, como en la aplicación) define cuándo una colmena cuenta como
pendiente: las colmenas cuya última inspección tiene al menos esa cantidad de
días, más las colmenas nunca inspeccionadas (`daysSinceLast: -1`, listadas
primero). Las lecturas de sensor (`INSPECTION_SOURCE_SENSOR`) no cuentan aquí como
inspecciones y no se listan en `recentInspections`. `nextTasks` contiene las siguientes cinco tareas abiertas,
`recentInspections` las últimas diez visitas. Las cifras de miel provienen de
los eventos `HARVEST`; `honeyKgSeason` es el año natural en curso.
`GetHoneyStats` recibe `year` (0 = todos los años) y devuelve las sumas
`perQueen`, `perApiary` y `perYear`.

## Exportar un espacio \{#export}

`GET /export` descarga el espacio activo en el formato de la copia completa de
la aplicación, que la aplicación puede volver a importar; `GET /export?photos=1`
devuelve un ZIP que añade las imágenes a tamaño completo. Acepta una sesión o
una clave API de escritura y contiene todos los registros vigentes del espacio
con tus propias tareas personales, pero no las tareas personales de otros
miembros.

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$OB/export?photos=1" -o openbeehive.zip
```

La respuesta es un adjunto llamado `openbeehive-server-<date>.json` o `.zip`.
Las claves de solo lectura y la cuenta de demostración reciben `403`; más de 5
exportaciones por usuario y hora reciben `429` con `Retry-After`. Los pesos y
las temperaturas están en kg y °C.

## Descargar el feed de cambios

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

`payloadJson` es una cadena JSON cuyas claves son los nombres de columna de
la tabla en `snake_case`. Devuelve `nextCursor` como `cursor` para continuar; es opaco. Sin la cabecera
`Openbeehive-Sync-Protocol`, el servidor responde como lo hacía para las
aplicaciones 0.4.1: solo las columnas de esa versión, sin registros de fotos y
con números de secuencia simples como cursores. Un `status` distinto de
unspecified significa que el cursor no se puede atender; carga entonces un
`Snapshot`. `limit` es por defecto
200 y tiene un tope de 500. El feed abarca el espacio del llamante; las filas
personales (ámbito `user:<id>`) se devuelven solo a su propietario. El feed contiene todos los cambios, tanto si los envió un dispositivo como si
los escribió un RPC de servicio; las ubicaciones aparecen solo aquí, ya que
no tienen servicio propio. Consulta el
[protocolo de sincronización](../developers/sync-protocol.md) para saber cómo
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
| `invalid_argument` | 400 | `name` vacío; falta `hiveId` (inspección, reina, tratamiento, cosecha), `year` (reina), `title` (tarea), `product` (tratamiento); `amountKg` no mayor que `0` (cosecha); un `apiaryId` que no existe en `CreateTask`; una foto que no es una data URL de una imagen JPEG, PNG o WebP de como máximo 5 MiB; falta `hive` / `queen` en las llamadas de actualización |
| `unauthenticated` | 401 | Token ausente, caducado o eliminado: una clave API desconocida o revocada, o un token de sesión que ha superado `BEEHIVE_SESSION_TTL` |
| `permission_denied` | 403 | Sesión de demostración o clave API de solo lectura llamando a un RPC de escritura |
| `failed_precondition` | 400 | `DeleteApiary` mientras el colmenar aún tiene colmenas; una llamada a `SyncService` por debajo de `BEEHIVE_SYNC_MIN_PROTOCOL`, o `Snapshot` sin la cabecera del protocolo (con un detalle `UpgradeRequired`) |
| `resource_exhausted` | 429 | Más de 4 streams `Subscribe` abiertos para un usuario |
| `not_found` | 404 | Id desconocido, o un id que pertenece a otro espacio, en cualquier `Get*`, `Update*`, `Delete*`, `RelocateHive`, `SetTaskDone`, las llamadas de foto y cada `Create*` que referencia una colmena o un colmenar |
| `unavailable` | 503 | Una llamada de foto mientras el servidor no tiene almacenamiento de blobs |
| `internal` | 500 | Fallos del lado del servidor. El mensaje es siempre `internal error`; los detalles están solo en el registro del servidor |

Una actualización que no cambiaría nada, y un `Push` con más de 2000
cambios, responden también `invalid_argument`. Consulta la
[referencia de errores de Connect](https://connectrpc.com/docs/protocol/#error-codes)
para la lista completa de códigos.

### Códigos de error de los endpoints HTTP planos \{#http-error-codes}

Los endpoints `/auth/*` y `/tenants/*` no son RPC. Sus errores son
`{"error": "<plain English>", "code": "<snake_case>"}` con un estado HTTP
acorde. Los clientes deben actuar según `code`; el texto puede cambiar.

| HTTP | Códigos |
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

Las páginas que un navegador abre directamente (`/auth/verify`, `/auth/login`,
`/auth/callback`) no responden con JSON: redirigen a `/login?error=<code>`,
donde la aplicación muestra un mensaje traducido. Sus códigos son
`verification_invalid`, `unknown_provider`, `oidc_state_missing`,
`oidc_state_invalid`, `oidc_failed`, `oidc_no_email`, `account_exists`,
`invite_only` e `internal`.

`/photos/` y `/export` usan la misma forma de error JSON con `not_signed_in`
(401), `cross_site_request`, `demo_read_only`, `read_only` (403),
`not_found`, `unknown_photo`, `not_uploaded` (404), `deleted` (410),
`too_large` (413), `unsupported_type` (415), `rate_limited` (429) y
`unavailable` (503).

## Notas

- Envía `{}` para una solicitud sin campos.
- `Content-Type: application/json` selecciona el protocolo JSON de Connect.
  `application/proto` envía protobuf binario por la misma URL. Una solicitud
  sin `Content-Type` responde `415` con un error JSON que lo indica.
- `SyncService.Subscribe` es un stream desde el servidor y necesita un cliente
  de streaming; consulta [gRPC](./grpc.md).
