---
sidebar_position: 3
title: "Modelo de datos"
---

# Modelo de datos

Las tablas siguientes están tomadas de las migraciones del servidor
(`server/internal/storage/sql/migrations/`) y del esquema espejo del cliente
(`app/src/lib/local/schema.ts`). Los nombres de columna son idénticos en ambos
lados y son las claves usadas en las cargas de sincronización. Las columnas de
enumeración almacenan el número proto; la etiqueta visible es lo que muestra la
aplicación (`app/src/lib/i18n/locales/en.json`).

Cada tabla sincronizada lleva tres columnas de contabilidad que no se repiten
abajo: `organization_id` (el espacio, llamado tenant en el código), `field_hlc` (reloj de campos en
JSON, consulta el [protocolo de sincronización](./sync-protocol.md)) y
`deleted` (marca de borrado lógico). Los id son UUID, acuñados en el
dispositivo o por el servidor para las filas creadas a través de la
[API](../using-the-api/overview.md). Las marcas de tiempo se almacenan como cadenas
ISO 8601 en el cliente y como `TIMESTAMP` en el servidor.

## Jerarquía

```text
apiary
 └── hive ── queen (one active, older ones kept with replaced_at set)
       ├── inspection
       ├── task        (task.hive_id and task.apiary_id are both optional)
       ├── harvest
       ├── treatment
       ├── placement   (which apiary the hive lived in, and when)
       ├── photo       (the hive's picture, and the photos of its inspections)
       └── event       (append-only history with frozen apiary/hive/queen)

user_settings          (one row per account, in every workspace)
```

El espacio (`organization_id`) es la unidad de compartición: todos los miembros
de un espacio leen y escriben todas sus filas. Dentro de él, los cambios llevan un
`scope_id`: el propio id del colmenar para el colmenar y todo lo que hay debajo, o
`user:<id>` para las filas personales, como una tarea sin colmenar. Solo `event`
almacena `scope_id` como columna; para las demás tablas viaja en el mensaje
`Change`.

## apiary

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `name` | text | obligatorio |
| `address` | text | texto libre |
| `lat`, `lng` | real | `0` cuando no está definido |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

## hive

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | también codificado en la [etiqueta QR](./qr-codes.md) |
| `apiary_id` | text | colmenar actual |
| `name` | text | |
| `type` | int | `HiveType`, ver abajo |
| `status` | int | `HiveStatus`, ver abajo; las colmenas nuevas empiezan en `1` |
| `boxes` | int | número de cajas |
| `colony_origin` | text | p. ej. "swarm 2024" |
| `note` | text | |
| `qr_code` | text | reservado; el código impreso se deriva de `id` mediante `shortCode()` en `app/src/lib/qr.ts` |
| `photo` | text | imagen en línea escrita por las aplicaciones 0.4.x; las aplicaciones actualizadas guardan la imagen de la colmena como fila de `photo` |
| `created_at`, `updated_at` | timestamp | |

`HiveType`: 0 Sin especificar, 1 Zander, 2 Dadant, 3 Deutsch Normal,
4 Langstroth, 5 Warré, 6 Top-bar, 99 Otro.

`HiveStatus`: 0 Sin especificar, 1 Activa, 2 Núcleo, 3 Sin reina, 4 Perdida,
5 Disuelta.

## queen

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `hive_id` | text | |
| `year` | int | el año de la reina; determina el color de marcado por defecto |
| `marking` | int | `MarkingColor`: 1 blanco (años terminados en 1/6), 2 amarillo (2/7), 3 rojo (3/8), 4 verde (4/9), 5 azul (5/0); por defecto a partir de `year` |
| `origin` | text | |
| `breeder_number` | text | |
| `introduced_at` | timestamp | inicio del reinado |
| `replaced_at` | timestamp | fin del reinado, null mientras reina |
| `active` | bool | true para la reina actual |
| `note` | text | |
| `created_at`, `updated_at` | timestamp | |

Un cambio de reina establece `active = 0` y `replaced_at` en la fila antigua e
inserta una nueva; la reina anterior permanece en la tabla. Una fila de
reina solo se elimina cuando se registró por error.

## inspection

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Muy mansa, 2 Mansa, 3 Normal, 4 Nerviosa, 5 Agresiva |
| `calmness` | int | 1 Abandona el cuadro, 2 Inquieta, 3 Tranquila, 4 Muy tranquila |
| `source` | int | `InspectionSource`: 0 sin especificar (se trata como manual), 1 manual (una visita hecha por una persona), 2 sensor (una lectura automática). No nulo, por defecto 0 |
| `frames` | int | cuadros ocupados |
| `brood_frames` | int | |
| `stores` | int | 1 Buenas, 2 Medias, 3 Bajas, 4 Ninguna |
| `queen_cells` | int | celdas reales contadas |
| `youngest_larva` | int | edad en días de la larva más joven vista |
| `covered_larva` | bool | cría operculada vista |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | `honey_kg` se conserva para los registros antiguos; el formulario de visita ya no lo escribe (ver `harvest`) |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C |
| `humidity_hive`, `humidity_outside` | real | % |
| `note` | text | |
| `photo_keys` | text | JSON de OR-Set, la única columna de conjunto; fotos en línea escritas por las aplicaciones 0.4.x (ver `photo`) |
| `created_at` | timestamp | |

Los recuentos, las cantidades y las lecturas de clima (`frames`, `brood_frames`,
`queen_cells`, `youngest_larva`, `frames_added`, `frames_removed`,
`honey_kg`, `fed_kg`, `weight_kg` y las cuatro columnas de clima) admiten nulos
en el servidor y en el cliente: `NULL` significa "no registrado", `0` significa un
cero observado. La API lo refleja con campos opcionales.

## task

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `title` | text | |
| `hive_id`, `apiary_id` | text | opcionales |
| `due_at` | timestamp | |
| `done` | bool | |
| `priority` | int | `TaskPriority`: 1 Baja, 2 Normal, 3 Alta; la columna del servidor tiene 2 por defecto, la aplicación escribe 0 |
| `note`, `recurrence`, `assigned_to` | text | presentes en el esquema; el formulario de tarea solo rellena `title` y `due_at` |
| `created_at` | timestamp | |

En el servidor, `task.owner_id` registra la cuenta en cuyo ámbito personal se
escribió una tarea sin colmenar. No se sincroniza; el servidor lo usa para
servir la tarea solo a su propietario y para eliminarla cuando el propietario
abandona el espacio.

## placement

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id`, `hive_id`, `apiary_id` | text | |
| `start_at` | timestamp | |
| `end_at` | timestamp | null para la ubicación actual |

Crear una colmena abre una ubicación; moverla cierra la fila abierta en el
momento del traslado y abre una nueva.

Una tarea sin `apiary_id` se sincroniza bajo el ámbito personal
`user:<user id>` en lugar de un id de colmenar.

## harvest

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | congelados en el momento de la cosecha |
| `date` | timestamp | |
| `variety` | text | |
| `amount_kg` | real | |
| `water_content` | real | % |
| `batch_number` | text | |
| `best_before` | timestamp | |
| `note` | text | |
| `amended_at` | timestamp | null hasta que la cosecha se edita después de su creación; a partir de entonces, la hora de la última edición |

## treatment

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `apiary_id`, `hive_id`, `queen_id` | text | congelados en el momento del tratamiento |
| `date` | timestamp | |
| `product`, `active_ingredient` | text | |
| `dose`, `method` | text | |
| `batch_number` | text | |
| `withdrawal_until` | timestamp | |
| `reason` | text | por defecto `varroa` |
| `note` | text | |
| `amended_at` | timestamp | null hasta que el tratamiento se edita después de su creación; a partir de entonces, la hora de la última edición; se muestra como "Modificado el" y se imprime en el registro de tratamientos |

## photo

Una foto de una inspección, o la imagen de una colmena. La fila se sincroniza
con una miniatura pequeña; la imagen a tamaño completo se guarda en el
almacenamiento de blobs y se transfiere a través de `/photos/<id>` (consulta el
[protocolo de sincronización](./sync-protocol.md#photos)).

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `owner_entity` | text | `inspection` o `hive` |
| `owner_id` | text | id de esa inspección o colmena |
| `thumb` | text | miniatura como data URL, de unos 200 px en el lado más largo |
| `content_type` | text | de la imagen a tamaño completo: `image/jpeg`, `image/png` o `image/webp` |
| `size_bytes` | int | de la imagen a tamaño completo, como máximo 5 MiB |
| `created_at` | timestamp | |

Una foto eliminada conserva su fila como lápida, pero su miniatura y su imagen
se borran. En el servidor la fila también indica su blob (`blob_key`,
`blob_type`, `blob_size`) y, para las fotos convertidas desde 0.4.x, el valor en
línea del que proceden (`legacy_key`); estas columnas no se sincronizan.

## user_settings

Las preferencias de visualización de la cuenta. Una fila por cuenta, cuyo id es
el id de la cuenta; se escribe en el ámbito personal y se sirve en todos los
espacios de la cuenta (consulta el
[protocolo de sincronización](./sync-protocol.md#account-settings)). No lleva
`organization_id`.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | el id de la cuenta |
| `weight_unit` | text | `kg` o `lb`; vacío significa que no se ha elegido, y el dispositivo usa entonces el valor por defecto de la región del navegador |
| `temp_unit` | text | `c` o `f`; vacío, como arriba |
| `language` | text | `en`, `de`, `fr`, `es` o `it` |

Los registros se almacenan en kilogramos y grados Celsius, se elija lo que se
elija aquí.

## event

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `scope_id` | text | id del colmenar |
| `type` | int | `EventType`, ver abajo |
| `date` | timestamp | |
| `apiary_id`, `hive_id`, `queen_id` | text | congelados en el momento del evento |
| `ref_entity`, `ref_id` | text | la fila de detalle, p. ej. `harvest` / su id |
| `title` | text | |
| `amount_kg` | real | copiado de la cosecha para que las consultas de rendimiento no necesiten join |
| `detail` | text | JSON |
| `author_id` | text | |

`EventType`: 1 Creada, 2 Reina introducida, 3 Reina reemplazada, 4 Movida,
5 Inspección, 6 Tratamiento, 7 Cosecha, 8 Estado, 9 Disuelta. La aplicación
escribe los tipos 1 a 7 (`app/src/lib/local/history.ts`). Consulta
[Historial y eventos](./history-and-events.md).

## Tablas solo del servidor

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`password_reset`, `change_log`, `seq_counter`, `sync_state`, `sync_boot` y
`photo_migration` existen solo en el servidor.
`member.role` es `owner` o `member`; `users.role` es `admin` o `user`.
`users.sessions_valid_after` es la marca que termina todas las sesiones anteriores de una
cuenta; `users.email_key` es la dirección de correo en minúsculas y es única,
de modo que dos cuentas no pueden compartir una dirección que solo se diferencie
en mayúsculas y minúsculas; `invite.expires_at` es el momento en que una
invitación deja de funcionar (7 días después de su creación).
`password_reset` guarda el hash del token de cada enlace de restablecimiento,
válido durante una hora y eliminado al usarse. `sync_state` guarda el `epoch`
aleatorio de la base de datos y el `horizon` de compactación del registro de
cambios; `sync_boot` guarda una marca por cada arranque del servidor (consulta
el [protocolo de sincronización](./sync-protocol.md#pull-status));
`change_log.logged_at` es el momento en que el servidor recibió una entrada.
`photo_migration` registra que la conversión única de las fotos en línea de
0.4.x ha terminado. La antigua tabla `apiary_share` ha desaparecido: no hay compartición
por colmenar. El cliente añade `outbox` y `sync_meta` para el
motor de sincronización.

### api_key

Claves de larga duración para scripts e integraciones (migración
`0014_api_keys.sql`, `server/internal/auth/apikey.go`). No se sincroniza.

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | text | |
| `user_id` | varchar(64) | propietario; indexado |
| `organization_id` | varchar(64) | el espacio en el que actúa la clave, fijado al crearla |
| `name` | text | etiqueta que se muestra en Ajustes |
| `key_prefix` | text | los primeros 12 caracteres del texto en claro, para mostrarlos |
| `key_hash` | varchar(64) | SHA-256 en hexadecimal del token `obhk_...` en claro, único; el texto en claro nunca se almacena |
| `scope` | text | `write` (predeterminado) o `read`; una clave `read` solo puede llamar a `Get*`, `List*`, `Pull`, `Snapshot` y `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null para las claves que no caducan; una clave pasado ese momento se rechaza |
| `last_used_at` | timestamp | se actualiza en cada uso verificado, null hasta entonces |

Una clave se verifica calculando el hash del token bearer y buscando
`key_hash`; la fila se borra al eliminarla, y una clave cuyo propietario ya no
es `member` de `organization_id`, o cuyo `expires_at` ya ha pasado, se
rechaza sin borrarla.
