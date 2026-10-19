---
sidebar_position: 4
title: "Protocolo de sincronización"
---

# Protocolo de sincronización

La aplicación lee y escribe una base de datos SQLite-WASM local y la reconcilia
con el servidor a través de `SyncService`. Esta página documenta el contrato de
red de `proto/openbeehive/v1/sync.proto` y las reglas de fusión de
`server/internal/sync/merge.go` y `app/src/lib/local/merge.ts`.

## El servicio

```protobuf
service SyncService {
  rpc Pull(PullRequest) returns (PullResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

El bucle del cliente (`app/src/lib/local/sync.ts`, `syncOnce`): envía el
outbox y luego hace pull hasta que `has_more` es false. Se ejecuta cada 15
segundos, tras cada escritura local y en el evento `online` del navegador. Las
ejecuciones se serializan; una llamada que llega mientras hay una en curso
programa una pasada más. El cliente no llama a `Subscribe`.

## Change

Cada edición de fila viaja como un único `Change`:

```protobuf
enum ChangeOp {
  CHANGE_OP_UNSPECIFIED = 0;
  CHANGE_OP_UPSERT = 1;
  CHANGE_OP_DELETE = 2;
}

message Change {
  string entity = 1;       // table name: apiary, hive, queen, inspection, task,
                           // placement, harvest, treatment, event
  string entity_id = 2;    // row id (UUID minted on the device)
  string scope_id = 3;     // apiary id, or "user:<id>"
  ChangeOp op = 4;
  string payload_json = 5; // JSON object of changed columns; ignored on delete
  string hlc = 6;          // Hybrid Logical Clock of the write
  string author_id = 7;    // user id of the device or API caller that wrote it
}
```

`payload_json` es un delta parcial, no la fila completa: el `patch()` del
cliente escribe solo las columnas que cambió. Las claves son los nombres de
columna en `snake_case` del [modelo de datos](/developers/data-model). Una fila
creada en el dispositivo es un delta que contiene todas las columnas. Una
eliminación es `op = CHANGE_OP_DELETE`; el receptor establece `deleted = true`
e ignora la carga.

Las columnas de conjunto (actualmente solo `inspection.photo_keys`) usan una
forma de carga distinta:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` lista las etiquetas de adición que el dispositivo que elimina
había observado. Los deltas sin ella (clientes antiguos) eliminan todas las
etiquetas que tiene el receptor.

### Formato del HLC

`"<ms:15>:<counter:5>:<node>"`, por ejemplo
`001781234567890:00003:a1b2c3d4`. Reloj de pared en milisegundos rellenado con
ceros hasta 15 dígitos, un contador de 5 dígitos y luego un id de nodo (8
caracteres aleatorios almacenados en `localStorage` en el dispositivo;
`BEEHIVE_NODE_ID`, por defecto `server`, en el servidor). La comparación de
cadenas simple ordena los HLC. Ambos lados llaman a `recv()` con cada HLC
entrante para que sus relojes se mantengan por delante de todo lo que han visto.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // last seen server sequence, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
}
```

El cursor es la cadena decimal de la secuencia de recepción del servidor
(`change_log.seq`), no un HLC. El servidor devuelve las filas con
`seq > cursor` cuyo `scope_id` está en el conjunto de ámbitos del llamante,
ordenadas por `seq`, y establece `next_cursor` al último `seq` devuelto (o
repite el cursor de la solicitud cuando nada coincidió). Persiste `next_cursor`
solo después de aplicar la página completa. `has_more` significa que la página
se cortó en `limit`; vuelve a hacer pull de inmediato.

Las filas en ámbitos que no puedes leer siguen consumiendo números de
secuencia, así que los valores que ves tienen huecos.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message Conflict {
  string entity = 1;
  string entity_id = 2;
  string winning_hlc = 3;
}
message PushResponse {
  string server_cursor = 1;      // global sequence after this push
  repeated Conflict conflicts = 2;
}
```

El servidor procesa el lote en una sola transacción:

1. `hlc.Recv(change.hlc)`.
2. Los valores de `entity` desconocidos se omiten.
3. `scope_id` debe estar en el conjunto de ámbitos del llamante, salvo que un
   cambio de `apiary` cuyo `scope_id` sea igual a su propio `entity_id` abre un
   ámbito nuevo. Cualquier otro ámbito desconocido hace fallar todo el push con
   `permission_denied`.
4. El `organization_id` de la carga, si está presente y no vacío, debe
   coincidir con el espacio (tenant) activo del llamante; una fila existente
   debe pertenecer a ese espacio. Las filas nuevas se marcan con el espacio del
   llamante. Una discrepancia hace fallar el push con `permission_denied`.
5. El cambio se fusiona campo a campo (ver abajo) y se añade a `change_log` con
   un `seq` nuevo.

`conflicts` siempre está vacío en el servidor actual: los campos obsoletos se
descartan en silencio durante la fusión y el valor más nuevo llega en el
siguiente `Pull`. `server_cursor` es la secuencia global tras el push; el
cliente lo almacena como su cursor, lo que evita volver a descargar sus propios
cambios.

El cliente descarta todo el lote del outbox cuando `Push` devuelve
`permission_denied` (sesión de demostración de solo lectura o un ámbito en el
que no se puede escribir). Las filas permanecen en las tablas locales; solo se
abandona la subida. Cualquier otro error conserva el outbox para la siguiente
ejecución.

## Reglas de fusión

Ambos lados aplican el mismo algoritmo (`applyChange` en
`server/internal/service/sync.go`, `applyRemote` en
`app/src/lib/local/sync.ts`).

Cada tabla sincronizada tiene una columna `field_hlc` que contiene un mapa JSON
`{ "<column>": "<hlc>" }`, el reloj de campos.

**Fila nueva.** Inserta cada columna de la carga y marca cada una con el HLC
del cambio.

**Fila existente, columna escalar.** Aplica el valor solo si el HLC del cambio
es mayor que la entrada de la columna en `field_hlc`, y luego actualiza esa
entrada. Dos dispositivos que editan columnas distintas de la misma fila ganan
ambos; dos dispositivos que editan la misma columna se resuelven al HLC mayor.

**Fila existente, columna de conjunto.** El valor almacenado es un OR-Set:
`{ "<element>": { "a": ["<tag>", ...], "r": ["<tag>", ...] } }`. Los elementos
de `add` reciben el HLC del cambio como nueva etiqueta en `a`. Los elementos de
`remove` mueven las etiquetas listadas en `removed_tags` (o todas las etiquetas
`a` actuales) a `r`. Un elemento es visible mientras tenga una etiqueta en `a`
que no esté en `r`, así que una adición que quien elimina nunca vio sobrevive
(add-wins). Las columnas de conjunto nunca se sobrescriben por LWW.

**Eliminación.** `deleted` es una columna escalar normal y sigue LWW con el HLC
de la eliminación. Las filas nunca se quitan; los lectores filtran `deleted = 0`.

Si nada en el cambio supera el reloj de campos, la fila se deja intacta.

## Ámbitos

El servidor calcula el conjunto de ámbitos de un llamante como:

```text
{ "user:<user id>" }
  ∪ { id of every apiary in the caller's active tenant }
  ∪ { apiary_id from apiary_share rows for the caller }
```

El mismo conjunto controla `Pull` y `Push`. Los colmenares usan su propio id
como `scope_id`; todo lo que hay bajo un colmenar (colmenas, reinas,
inspecciones, tareas, ubicaciones, cosechas, tratamientos, eventos) lleva el id
del colmenar. Nada en la aplicación actual escribe `apiary_share`, así que en la
práctica el conjunto de ámbitos son los colmenares del espacio.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Un stream desde el servidor. Cada dos segundos el servidor lee el contador de
secuencia global y envía `server_cursor` cuando ha avanzado más allá del cursor
de la solicitud y del último valor enviado. No lleva cambios; el receptor llama
a `Pull`. El contador es global, no por ámbito, así que un evento puede llevar a
un pull vacío. La aplicación no lo usa.

## Tablas del lado del servidor

`change_log` es el feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`. `seq_counter` contiene la única fila
de contador (`name = 'change'`) que se incrementa por cada cambio aceptado. En
el cliente, `outbox` contiene los cambios aún no enviados con la misma forma y
`sync_meta` almacena el cursor bajo la clave `cursor`.

## Cambios originados en el servidor

Los servicios CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`) no escriben
directamente en las tablas de entidades. Cada RPC de escritura construye un
`Change` y lo pasa por `applyChange` y `appendChangeLog` dentro de una sola
transacción (`server/internal/service/writer.go`), los mismos dos pasos que
`Push` realiza por cada cambio. Un cambio así tiene `author_id` establecido al
id de usuario del llamante de la API, un `hlc` tomado del propio reloj del
servidor (id de nodo `BEEHIVE_NODE_ID`, el reloj compartido con el handler de
`Push` para que se mantenga por delante de todo lo recibido), y un `scope_id`
del colmenar al que pertenece la fila: el propio id del colmenar para los
colmenares, el colmenar de la colmena para colmenas, reinas, inspecciones y
tratamientos, y `user:<id>` para una tarea sin colmenar. Su `payload_json` es
un delta parcial como el de un dispositivo, así que una edición posterior de
otra columna desde un dispositivo se fusiona con él, y la fila aparece en el
siguiente `Pull` de cada dispositivo que puede leer el ámbito. Las
eliminaciones a través de la API son lápidas `CHANGE_OP_DELETE`. Los flujos
de varias filas (colmena más ubicación más evento, reemplazo de reina,
contexto congelado para inspecciones y tratamientos) añaden un cambio por
fila, reflejando `app/src/lib/local/history.ts`.
