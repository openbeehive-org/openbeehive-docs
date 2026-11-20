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

El outbox se envía en lotes de como máximo 200 cambios y unos 4 MiB de
carga; un lote que el servidor rechaza en su totalidad se divide por la mitad y se envía de nuevo.

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
  string author_id = 7;    // set by the server from the signed-in caller
}
```

`payload_json` es un delta parcial, no la fila completa: el `patch()` del
cliente escribe solo las columnas que cambió. Las claves son los nombres de
columna en `snake_case` del [modelo de datos](./data-model.md). Una fila
creada en el dispositivo es un delta que contiene todas las columnas. Una
eliminación es `op = CHANGE_OP_DELETE`; el receptor establece `deleted = true`
e ignora la carga.

Los valores escalares son cadenas, números, booleanos o `null`. Los booleanos viajan como
`0`/`1`, las marcas de tiempo como cadenas ISO 8601 (`""` significa no establecida). El servidor
conserva solo las columnas que conoce, descarta en silencio las claves desconocidas y almacena la
carga en esta forma normalizada, que es también lo que devuelve `Pull`. Los receptores
deben ignorar las claves que no conocen. `author_id` lo establece siempre el servidor
a partir del llamante autenticado; lo que un cliente envíe ahí se ignora. Una
carga puede tener como máximo 4 MiB y un id de entidad como máximo 255 caracteres.

Las columnas de conjunto (actualmente solo `inspection.photo_keys`) usan una
forma de carga distinta:

```json
{ "photo_keys": { "add": ["k1"] } }
{ "photo_keys": { "remove": ["k2"], "removed_tags": { "k2": ["<hlc>", "<hlc>"] } } }
```

`removed_tags` lista, por cada elemento eliminado, las etiquetas de adición que el
dispositivo que elimina había observado; solo esas reciben una lápida, de modo que una adición
concurrente hecha en otro lugar sobrevive. La regla para su ausencia es estricta:

- `removed_tags` **ausente** (clientes antiguos): se eliminan todas las etiquetas que el
  receptor tiene para el elemento.
- `removed_tags` **presente pero vacío** para un elemento: no se elimina nada.

### Formato del HLC

`"<ms:15>:<counter:5>:<node>"`, por ejemplo
`001781234567890:00003:a1b2c3d4`. Reloj de pared en milisegundos rellenado con
ceros hasta exactamente 15 dígitos, un contador de exactamente 5 dígitos y luego un id de
nodo de 1 a 64 caracteres de entre `[A-Za-z0-9._-]` (un id aleatorio almacenado en
`localStorage` en el dispositivo; en el servidor `BEEHIVE_NODE_ID`, por defecto un id
aleatorio `srv-…` elegido en cada arranque). La comparación de cadenas simple ordena los HLC.
Por campo gana la marca más nueva; las marcas iguales no sobrescriben. Una marca que no se
ajusta a este formato hace que el cambio sea `invalid`.

**El límite de 10 minutos.** El servidor rechaza un cambio cuya marca va más de
10 minutos por delante de su propio reloj (`clock_ahead`), porque una marca así
ganaría todas las fusiones posteriores. Tanto `Pull` como `Push` devuelven `server_time_ms`; la
aplicación lo usa para compensar un reloj del dispositivo mal ajustado, y cuando los cambios vuelven como
`clock_ahead` da a las entradas afectadas del outbox (y a los relojes de campo y las
etiquetas de conjunto correspondientes de las filas locales) marcas nuevas en el orden antiguo y las
envía de nuevo. El propio reloj del servidor sigue solo las marcas que ha aceptado y
almacenado.

## Pull

```protobuf
message PullRequest {
  string cursor = 1; // next_cursor of the previous Pull, "" for a first sync
  int32 limit = 2;   // 0 = server default (200), max 500
}
message PullResponse {
  repeated Change changes = 1;
  string next_cursor = 2;
  bool has_more = 3;
  int64 server_time_ms = 4; // server wall clock, unix ms
}
```

El cursor es la cadena decimal de la secuencia de recepción del servidor
(`change_log.seq`), no un HLC. `Pull` se acota por espacio: el servidor
devuelve las filas con `seq > cursor` que pertenecen al espacio activo del
llamante, ordenadas por `seq`. La única excepción son las filas personales (ámbito
`user:<id>`), que se devuelven solo a su propietario, y solo dentro del
espacio en el que se escribieron. `next_cursor` es el último `seq` devuelto (o
el cursor de la solicitud cuando nada coincidió). Persiste `next_cursor` solo después de
aplicar la página completa. `has_more` significa que la página se cortó en `limit`; vuelve
a hacer pull de inmediato.

Las filas de otros espacios siguen consumiendo números de secuencia, así que los valores
que ves tienen huecos.

**El cursor solo avanza mediante `Pull`.** Un dispositivo no debe derivarlo
de ninguna otra cosa, en particular no de una respuesta de `Push`: los cambios de otros
dispositivos con números de secuencia más bajos se saltarían para siempre.

## Push

```protobuf
message PushRequest { repeated Change changes = 1; }
message RejectedChange {
  int32 index = 1;   // position in PushRequest.changes
  string code = 2;   // machine-readable cause, see below
  string reason = 3; // plain English, for logs
}
message PushResponse {
  string server_cursor = 1;             // always empty
  repeated Conflict conflicts = 2;      // unused, always empty
  repeated RejectedChange rejected = 3; // changes that were not applied
  int64 server_time_ms = 4;             // server wall clock, unix ms
}
```

Un push puede llevar como máximo 2000 cambios (`invalid_argument` por encima de eso). El
servidor aplica cada cambio por separado, dentro de una sola transacción con un
savepoint por cambio: un cambio que rechaza se revierte y se comunica en
`rejected`, y todos los demás cambios de la solicitud se aplican con normalidad. Un
cambio que no aparece en `rejected` fue aceptado. Aceptado no significa que
haya ganado: los campos más antiguos que lo que tiene el servidor pierden la fusión por campo.

Por cada cambio, el servidor:

1. Comprueba el cambio en sí: una `entity` conocida, un id de 1 a 255 caracteres,
   un `op` de upsert o delete, una marca bien formada que no vaya más de 10
   minutos por delante.
2. Comprueba el ámbito: `scope_id` debe ser el ámbito personal del llamante
   (`user:<id>`) o un colmenar del espacio activo del llamante. Un cambio de `apiary`
   cuyo `scope_id` sea igual a su propio `entity_id` abre un ámbito nuevo.
3. Comprueba el espacio: una fila existente debe pertenecer al espacio activo del
   llamante; las filas nuevas se marcan con él.
4. Normaliza la carga a las columnas conocidas, la fusiona campo a campo
   (ver abajo) y la añade a `change_log` con un `seq` nuevo.

Los códigos de `rejected`:

| Código | Significado |
| --- | --- |
| `wrong_tenant` | La fila pertenece a otro espacio. |
| `forbidden_scope` | El llamante no puede escribir en `scope_id`. |
| `unknown_entity` | `entity` no es una tabla sincronizada. |
| `invalid` | Marca, carga, valor o id mal formados. |
| `clock_ahead` | La marca va más de 10 minutos por delante del servidor; vuelve a marcar con un reloj corregido y reenvía. |

La solicitud entera falla solo por motivos que no tienen que ver con un cambio concreto:
`permission_denied` para identidades de solo lectura (la cuenta de demostración, las claves API
de solo lectura), `unauthenticated`, o un error del servidor, en cuyo caso no se aplica nada de la
solicitud.

`server_cursor` y `conflicts` siguen en el mensaje para que las aplicaciones antiguas puedan seguir
decodificando la respuesta; ambos están siempre vacíos.

Lo que la aplicación hace con la respuesta: los cambios aceptados salen del outbox.
Los rechazados pasan a una lista de cambios rechazados que el usuario ve como
**Problemas de sincronización**, con reintentar y descartar; las filas permanecen en las tablas locales.
`clock_ahead` se trata volviendo a marcar como se describe arriba. Un push rechazado
por ser de solo lectura saca el lote del outbox y conserva las filas localmente. Cualquier
otro error conserva el outbox para la siguiente ejecución.

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

Las dos implementaciones se mantienen idénticas mediante vectores de prueba compartidos:
`server/internal/sync/testdata/merge_vectors.json` lo ejecutan las pruebas de Go y
las pruebas de la aplicación.

## Ámbitos

El espacio es la única unidad de compartición. Cada cambio pertenece al espacio
del llamante que lo escribió, y dentro del espacio lleva un `scope_id`:

- el id del colmenar al que pertenece (los colmenares usan su propio id; las colmenas,
  reinas, inspecciones, ubicaciones, cosechas, tratamientos, eventos y tareas
  con colmenar llevan el id del colmenar), o
- `user:<user id>` para las filas personales, como una tarea sin colmenar.

Un llamante puede escribir en su propio ámbito personal y en los colmenares de su
espacio activo. Lee todos los cambios del espacio activo salvo las filas personales de
otros miembros. No hay compartición por colmenar.

## Subscribe

```protobuf
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Un stream desde el servidor, por espacio. Cada dos segundos el servidor busca el
cambio más reciente que el llamante puede descargar y envía `server_cursor` cuando ha
avanzado más allá del cursor de la solicitud y del último valor enviado. No lleva
cambios; el receptor llama a `Pull`. La actividad en otros espacios no despierta
el stream. Un usuario puede mantener como máximo 4 streams abiertos; uno más se
rechaza con `resource_exhausted`. La aplicación no lo usa.

## Tablas del lado del servidor

`change_log` es el feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, indexado por `(org_id, seq)` para
`Pull`. `seq_counter` contiene la única fila de contador (`name = 'change'`) que se
incrementa por cada cambio aceptado; cada escritor la bloquea primero, de modo que las fusiones
se serializan. En el cliente, `outbox` contiene los cambios aún no enviados con la misma forma y
`sync_meta` almacena el cursor bajo la clave `cursor`.

## Cambios originados en el servidor

Los servicios CRUD (`ApiaryService`, `HiveService`, `QueenService`,
`InspectionService`, `TaskService`, `TreatmentService`, `HarvestService`) no escriben
directamente en las tablas de entidades. Cada RPC de escritura construye un
`Change` y lo pasa por `applyChange` y `appendChangeLog` dentro de una sola
transacción (`server/internal/service/writer.go`), los mismos dos pasos que
`Push` realiza por cada cambio. Un cambio así tiene `author_id` establecido al
id de usuario del llamante de la API, un `hlc` tomado del propio reloj del
servidor (id de nodo `BEEHIVE_NODE_ID`, el reloj compartido con el handler de
`Push` para que se mantenga por delante de todo lo aceptado), y un `scope_id`
del colmenar al que pertenece la fila: el propio id del colmenar para los
colmenares, el colmenar de la colmena para colmenas, reinas, inspecciones,
tratamientos y cosechas, y `user:<id>` para una tarea sin colmenar. Su `payload_json` es
un delta parcial como el de un dispositivo, así que una edición posterior de
otra columna desde un dispositivo se fusiona con él, y la fila aparece en el
siguiente `Pull` de cada dispositivo que puede leer el ámbito. Las
eliminaciones a través de la API son lápidas `CHANGE_OP_DELETE`, y la eliminación de un
registro marca también con lápidas sus eventos de la línea de tiempo. Los flujos
de varias filas (colmena más ubicación más evento, reemplazo de reina,
contexto congelado para inspecciones, tratamientos y cosechas) añaden un cambio por
fila, reflejando `app/src/lib/local/history.ts`.
