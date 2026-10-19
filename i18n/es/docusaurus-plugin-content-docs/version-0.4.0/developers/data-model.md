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
abajo: `organization_id` (espacio/tenant), `field_hlc` (reloj de campos en
JSON, consulta el [protocolo de sincronización](/developers/sync-protocol)) y
`deleted` (marca de borrado lógico). Los id son UUID, acuñados en el
dispositivo o por el servidor para las filas creadas a través de la
[API](/using-the-api/overview). Las marcas de tiempo se almacenan como cadenas
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
       └── event       (append-only history with frozen apiary/hive/queen)
```

La compartición y la partición de la sincronización usan `scope_id`: el propio
id del colmenar para el colmenar y todo lo que hay debajo. Solo `event`
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
| `id` | text | también codificado en la [etiqueta QR](/developers/qr-codes) |
| `apiary_id` | text | colmenar actual |
| `name` | text | |
| `type` | int | `HiveType`, ver abajo |
| `status` | int | `HiveStatus`, ver abajo; las colmenas nuevas empiezan en `1` |
| `boxes` | int | número de cajas |
| `colony_origin` | text | p. ej. "swarm 2024" |
| `note` | text | |
| `qr_code` | text | reservado; el código impreso se deriva de `id` mediante `shortCode()` en `app/src/lib/qr.ts` |
| `photo` | text | data URL o clave de blob |
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
inserta una nueva; las reinas antiguas nunca se eliminan.

## inspection

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id`, `hive_id` | text | |
| `date` | timestamp | |
| `weather` | text | |
| `queen_seen`, `eggs_seen` | bool | |
| `temperament` | int | 1 Muy mansa, 2 Mansa, 3 Normal, 4 Nerviosa, 5 Agresiva |
| `calmness` | int | 1 Abandona el cuadro, 2 Inquieta, 3 Tranquila, 4 Muy tranquila |
| `frames` | int | cuadros ocupados |
| `brood_frames` | int | |
| `stores` | int | 1 Buenas, 2 Medias, 3 Bajas, 4 Ninguna |
| `queen_cells` | int | celdas reales contadas |
| `youngest_larva` | int | edad en días de la larva más joven vista |
| `covered_larva` | bool | cría operculada vista |
| `varroa` | text | |
| `honey_kg`, `fed_kg`, `weight_kg` | real | |
| `frames_added`, `frames_removed` | int | |
| `drone_frame_cut`, `super_added` | bool | |
| `temp_hive`, `temp_outside` | real | °C, null cuando no se midió en la aplicación; `CreateInspection` almacena `0` para los campos omitidos |
| `humidity_hive`, `humidity_outside` | real | %, la misma regla que las temperaturas |
| `note` | text | |
| `photo_keys` | text | JSON de OR-Set, la única columna de conjunto |
| `created_at` | timestamp | |

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
[Historial y eventos](/developers/history-and-events).

## Tablas solo del servidor

`organization`, `users`, `member`, `invite`, `user_passkey`, `api_key`,
`apiary_share`, `change_log` y `seq_counter` existen solo en el servidor.
`member.role` es `owner` o `member`; `users.role` es `admin` o `user`.
`apiary_share` lo lee la comprobación de ámbitos de sincronización, pero nada
en la aplicación lo escribe. El cliente añade `outbox` y `sync_meta` para el
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
| `scope` | text | `write` (predeterminado) o `read`; una clave `read` solo puede llamar a `Get*`, `List*`, `Pull` y `Subscribe` |
| `created_at` | timestamp | |
| `expires_at` | timestamp | null para las claves que no caducan; una clave pasado ese momento se rechaza |
| `last_used_at` | timestamp | se actualiza en cada uso verificado, null hasta entonces |

Una clave se verifica calculando el hash del token bearer y buscando
`key_hash`; la fila se borra al eliminarla, y una clave cuyo propietario ya no
es `member` de `organization_id`, o cuyo `expires_at` ya ha pasado, se
rechaza sin borrarla.
