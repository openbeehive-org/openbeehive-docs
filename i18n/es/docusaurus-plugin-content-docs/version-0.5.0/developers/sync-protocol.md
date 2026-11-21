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
  rpc Snapshot(SnapshotRequest) returns (SnapshotResponse);
  rpc Push(PushRequest) returns (PushResponse);
  rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
}
```

El bucle del cliente (`app/src/lib/local/sync.ts`, `syncOnce`): envía el
outbox y luego hace pull hasta que `has_more` es false. Un dispositivo sin
cursor carga primero una [instantánea](#snapshot). Se ejecuta cada 15
segundos, tras cada escritura local y en el evento `online` del navegador. Las
ejecuciones se serializan; una llamada que llega mientras hay una en curso
programa una pasada más. El cliente no llama a `Subscribe`.

El outbox se envía en lotes de como máximo 200 cambios y unos 4 MiB de
carga; un lote que el servidor rechaza en su totalidad se divide por la mitad y se envía de nuevo.

## Versiones del protocolo \{#versions}

Un cliente indica qué versión del protocolo habla con dos cabeceras de
solicitud en cada llamada a `SyncService`:

```text
Openbeehive-Sync-Protocol: 1
Openbeehive-App-Version: 0.5.0
```

La versión actual es 1; la versión de la aplicación es texto libre para el
registro del servidor. Una solicitud sin `Openbeehive-Sync-Protocol` procede de una
aplicación 0.4.x instalada (versión 0). A un cliente así se le sirve como lo
hacía la versión 0.4.1: `Pull` devuelve solo las entidades y columnas que esa
versión conocía (`legacyCols` en `server/internal/service/sync_legacy.go`, una
lista que nunca crece), los cursores son números de secuencia simples, y no hay
instantáneas ni [señales de estado](#pull-status). Una aplicación 0.4.x escribe
cada clave de un cambio descargado en una columna con ese nombre y deja de
sincronizar con la primera clave que no conoce; por eso las columnas y tablas
nuevas solo llegan a los clientes que anuncian una versión. **Los scripts que
llaman a `SyncService` deben enviar la cabecera** para recibirlo todo.

`BEEHIVE_SYNC_MIN_PROTOCOL` (por defecto `0`) es la versión más baja que acepta
el servidor. Por debajo de ella, cada llamada falla con `failed_precondition` y
un detalle de error `UpgradeRequired` (`min_protocol`); la aplicación muestra
entonces "Aplicación desactualizada · actualízala para sincronizar" y deja de
reintentar.

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
                           // placement, harvest, treatment, event, photo,
                           // user_settings
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

Las columnas de conjunto (solo `inspection.photo_keys`, que contiene las fotos
en línea de las aplicaciones 0.4.x) usan una forma de carga distinta:

```json
{ "photo_keys": { "add": ["data:image/jpeg;base64,..."] } }
{ "photo_keys": { "remove": ["data:image/jpeg;base64,..."], "removed_tags": { "data:image/jpeg;base64,...": ["<hlc>", "<hlc>"] } } }
```

Los elementos deben ser data URLs; cualquier otro elemento hace que el cambio sea `invalid`,
igual que una etiqueta eliminada que vaya más de 10 minutos por delante del servidor.

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
almacenado, y nunca una que vaya más de 10 minutos por delante de su reloj real. Una
aplicación 0.4.x (sin cabecera de protocolo) ignora los rechazos por cambio, así que para
un cliente así un cambio `clock_ahead` hace fallar todo el `Push` con `failed_precondition`
("upgrade required") y no se aplica nada de él; la aplicación conserva el lote
y reintenta hasta que su reloj sea correcto o se haya actualizado.

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
  PullStatus status = 5;
}
```

El cursor es opaco: guarda `next_cursor` y devuélvelo sin cambios. Para el
protocolo 1 tiene la forma `<epoch>:<seq>:<mark>`. `epoch` es un número
aleatorio que identifica la base de datos (`sync_state`), `seq` es la secuencia
de recepción del servidor (`change_log.seq`, no un HLC) y `mark` es la etiqueta
del último arranque del servidor anterior a esa posición (`sync_boot`). Los
clientes 0.4.x conservan el número de secuencia simple. `Pull` se acota por espacio: el servidor
devuelve las filas con `seq > cursor` que pertenecen al espacio activo del
llamante, ordenadas por `seq`. La única excepción son las filas personales (ámbito
`user:<id>`), que se devuelven solo a su propietario, y solo dentro del
espacio en el que se escribieron. `next_cursor` es el último `seq` devuelto (o
el cursor de la solicitud cuando nada coincidió). Persiste `next_cursor` solo después de
aplicar la página completa. `has_more` significa que la página se cortó en `limit`; vuelve
a hacer pull de inmediato.

Las filas de otros espacios siguen consumiendo números de secuencia, así que los valores
que ves tienen huecos.

**El cursor solo avanza mediante `Pull` y `Snapshot`.** Un dispositivo no debe
derivarlo de ninguna otra cosa, en particular no de una respuesta de `Push`: los
cambios de otros dispositivos con números de secuencia más bajos se saltarían
para siempre.

### Estado del pull \{#pull-status}

`status` indica qué ha hecho el servidor con el cursor. Solo los clientes que
anuncian una versión del protocolo reciben un valor distinto de
`PULL_STATUS_UNSPECIFIED` (el cursor se aceptó). Con cualquiera de los otros
dos, `changes` está vacío:

| Estado | Cuándo | Qué hace el cliente |
| --- | --- | --- |
| `PULL_STATUS_SNAPSHOT_REQUIRED` | El cursor es anterior a la entrada más antigua que el servidor aún conserva (consulta [compactación](#compaction)), o es un número de secuencia simple de antes del protocolo 1. | Carga una [instantánea](#snapshot) y continúa desde su cursor. El outbox no se toca. |
| `PULL_STATUS_RESET_REQUIRED` | El cursor no pertenece al historial de esta base de datos: otro epoch, una posición más allá del final del registro, o una marca que no coincide. Así es como se ve una copia de seguridad restaurada. | Vuelve a poner en cola todas las filas locales para subirlas, carga una instantánea y continúa desde su cursor. |

Una base de datos restaurada tiene el mismo epoch, pero el arranque del
servidor sobre ella deja una marca nueva en la posición donde termina la copia,
de modo que todo cursor emitido antes de la restauración más allá de esa
posición lleva la marca equivocada. La comprobación depende de que el servidor
arranque sobre la base de datos restaurada antes de atender solicitudes; no
depende de las entradas del registro, así que ni la compactación ni un espacio
eliminado pueden ocultar una restauración.

Tras `RESET_REQUIRED`, la aplicación vuelve a poner en cola cada fila local como
cambios normales, agrupados por las marcas que ya llevan sus columnas; el cambio
más antiguo de una fila lleva todas sus columnas, de modo que puede recrear una
fila que el servidor ya no tiene. Donde el servidor aún tiene un cambio, la
fusión no hace nada. Después sube las imágenes de fotos que conserva, tras sus
registros. Las aplicaciones 0.4.x no reciben ninguno de los dos estados; una
cuyo cursor esté más allá del registro restaurado vuelve a leer el registro
desde el principio.

## Snapshot \{#snapshot}

```protobuf
message SnapshotRequest { string page_token = 1; }
message SnapshotRow {
  string entity = 1;
  string entity_id = 2;
  string payload_json = 3;   // every synced column of the row
  string field_hlc_json = 4; // column -> stamp of its last write
}
message SnapshotResponse {
  repeated SnapshotRow rows = 1;
  string next_page_token = 2; // "" on the last page
  string cursor = 3;          // where Pull continues; the same on every page
  int64 server_time_ms = 4;
}
```

`Snapshot` devuelve, página a página, las filas actuales del espacio del
llamante, incluidas las filas eliminadas (lápidas) y, de las filas personales,
solo las del propio llamante; una página se corta en unos 4 MiB. Requiere una
versión del protocolo: una llamada sin la cabecera falla con
`failed_precondition` y `UpgradeRequired`. Una columna de conjunto lleva todo su
estado OR-Set en lugar de un delta. El cliente fusiona cada fila columna a
columna como un cambio, así que las ediciones locales con marcas más nuevas
sobreviven y el outbox no se toca; una columna sin marca solo se adopta donde la
fila local tampoco tiene ninguna. El cursor se toma antes de leer la primera
fila, así que una fila que cambia mientras se descargan las páginas vuelve a
llegar a través de `Pull`. La aplicación guarda el cursor solo después de la
última página; una instantánea interrumpida empieza de nuevo.

Un dispositivo usa una instantánea cuando no tiene cursor (un dispositivo nuevo,
o tras actualizar desde 0.4.x), tras `SNAPSHOT_REQUIRED` y tras
`RESET_REQUIRED`. Los registros de fotos llegan con sus miniaturas, nunca con
las imágenes completas.

## Compactación \{#compaction}

Una vez al día el servidor elimina las entradas del registro de cambios que
recibió hace más de `BEEHIVE_CHANGELOG_RETENTION_DAYS` días (por defecto 180;
`0` lo conserva todo; `change_log.logged_at` es el momento de recepción) y
registra el número de secuencia hasta el que lo hizo (el horizonte, en
`sync_state`). Un cursor por debajo del horizonte recibe `SNAPSHOT_REQUIRED`;
una aplicación 0.4.x con un cursor así recibe el fallo `UpgradeRequired` y no
puede sincronizar hasta que se actualice. Las filas en sí se conservan. Nada más
lee entradas antiguas del registro: el propietario de una tarea personal, por
ejemplo, se guarda en la propia tarea (`task.owner_id`). El trabajo se ejecuta
en el proceso del servidor y supone que es el único: ejecuta exactamente una
instancia por base de datos.

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
   cuyo `scope_id` sea igual a su propio `entity_id` abre un ámbito nuevo. Ningún
   id de fila puede empezar por `user:` (`invalid`). El ámbito personal solo admite
   los ajustes de la cuenta, las tareas sin colmenar y los eventos que nombran el
   ámbito personal, y solo filas que ya son del propio llamante; cualquier otra
   cosa ahí es `forbidden_scope`.
3. Comprueba el espacio: una fila existente debe pertenecer al espacio activo del
   llamante; las filas nuevas se marcan con él.
4. Normaliza la carga a las columnas conocidas, la fusiona campo a campo
   (ver abajo) y la añade a `change_log` con un `seq` nuevo. Un cambio
   que no cambia nada (todos los campos obsoletos, todas las etiquetas de conjunto conocidas) se fusiona
   sin entrada en el registro.

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
de solo lectura), `unauthenticated`, un cambio `clock_ahead` de una aplicación 0.4.x (ver
arriba), o un error del servidor, en cuyo caso no se aplica nada de la solicitud.

`server_cursor` y `conflicts` siguen en el mensaje para que las aplicaciones antiguas puedan seguir
decodificando la respuesta; ambos están siempre vacíos.

Lo que la aplicación hace con la respuesta: los cambios aceptados salen del outbox.
Los rechazados pasan a una lista de cambios rechazados que el usuario ve como
**Problemas de sincronización**, con reintentar y descartar; las filas permanecen en las tablas locales.
`clock_ahead` se trata volviendo a marcar como se describe arriba. Un push rechazado
por ser de solo lectura (`permission_denied`, la cuenta de demostración) nunca
puede tener éxito: la aplicación descarta el lote, olvida las filas que tocaba y
borra su cursor, de modo que el pull de la misma ejecución vuelve a cargar las
filas del servidor desde una instantánea, y avisa al usuario de que el cambio no
se ha guardado. Una solicitud rechazada por demasiado grande o mal formada se
divide por la mitad hasta que el cambio defectuoso queda solo. Cualquier otro
error conserva el outbox para la siguiente ejecución.

En la otra dirección, un cambio o una fila de instantánea recibidos en el pull que la aplicación no puede
fusionar no detienen el pull: se guardan en la tabla local `inbox_failed`
y aparecen en **Problemas de sincronización** como "no se pudo aplicar", con una acción
de descartar. El mismo cambio recibido de nuevo sustituye su entrada.

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
- `user:<user id>` para las filas personales, como una tarea sin colmenar, y
  los ajustes de la cuenta.

Un llamante puede escribir en su propio ámbito personal y en los colmenares de su
espacio activo. Lee todos los cambios del espacio activo salvo las filas personales de
otros miembros. No hay compartición por colmenar.

### Ajustes de la cuenta \{#account-settings}

`user_settings` (unidades e idioma) es la única tabla sincronizada cuyas filas
pertenecen a una cuenta en lugar de a un espacio: una fila por cuenta, con el id
de la cuenta como id de fila, escrita solo en el ámbito personal de la cuenta.
Sus entradas del registro se archivan bajo la cuenta (`org_id` `user:<id>`), de
modo que `Pull`, `Subscribe` y `Snapshot` la sirven en todos los espacios de la
cuenta, y dos dispositivos que la crean sin conexión escriben la misma fila.
Abandonar un espacio la conserva; eliminar la cuenta la borra. Los valores solo
cambian lo que muestra la aplicación; los registros, las cargas, las
exportaciones y la API siguen en el sistema métrico. El tema de color no forma
parte de ella.

### Fotos \{#photos}

Una foto es una fila de `photo` (`owner_entity` `inspection` o `hive`,
`owner_id`, `thumb` como data URL de unos 200 px, `content_type`,
`size_bytes`) que se sincroniza como cualquier otra fila. La imagen a tamaño
completo nunca entra en el feed: el dispositivo que tomó la foto la sube con
`POST /photos/<id>` una vez enviado el registro, y los demás dispositivos la
obtienen con `GET /photos/<id>` la primera vez que se abre. Ambas llamadas
necesitan la sesión o una clave API y ser miembro del espacio de la foto. Una
subida se acepta una sola vez por foto, así que la imagen detrás de un id nunca
cambia. Eliminar una foto es definitivo: el servidor borra la miniatura de la
fila y del registro y elimina la imagen.

Las aplicaciones 0.4.x conservan sus fotos en línea (`inspection.photo_keys`,
`hive.photo`). El servidor acepta ese formato de ellas, se lo sirve y lo
convierte en registros de fotos. Los clientes que anuncian una versión del
protocolo reciben los registros de fotos y nunca las copias en línea; las
aplicaciones 0.4.x reciben las copias en línea y nunca filas de `photo`.

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
rechaza con `resource_exhausted`. La versión mínima del protocolo se le aplica
igual que a las demás llamadas. La aplicación no lo usa.

## Tablas del lado del servidor

`change_log` es el feed: `seq`, `scope_id`, `entity`, `entity_id`, `op`,
`payload`, `hlc`, `author_id`, `org_id`, `logged_at`, indexado por
`(org_id, seq)` para `Pull` y por `logged_at` para la compactación.
`sync_state` contiene el `epoch` de la base de datos y el `horizon` de
compactación; `sync_boot` contiene una marca por cada arranque del servidor.
`seq_counter` contiene la única fila de contador (`name = 'change'`) que se
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
