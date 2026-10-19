---
sidebar_position: 1
title: "Visión general de la API"
---

# La API de Openbeehive

El servidor expone una API [Connect-RPC](https://connectrpc.com/) definida en
Protocol Buffers bajo
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1).
Cada RPC es accesible mediante HTTP/JSON plano, gRPC y gRPC-Web desde la misma
URL. La propia aplicación solo usa `SyncService`; los demás servicios existen
para scripts, sensores e integraciones.

## URL base y forma de la ruta

La API es servida por el mismo proceso que la aplicación, en el mismo origen:

```text
POST <origin>/openbeehive.v1.<Service>/<Method>
```

Por ejemplo `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`
en el servicio alojado, o tu propio origen si te autoalojas.

## Servicios servidos

Hay diez servicios registrados en el servidor (`server/cmd/server/main.go`):

| Servicio | RPC |
| --- | --- |
| `ApiaryService` | `CreateApiary`, `GetApiary`, `ListApiaries`, `UpdateApiary`, `DeleteApiary` |
| `HiveService` | `CreateHive`, `GetHive`, `ListHives`, `UpdateHive`, `DeleteHive`, `RelocateHive` |
| `QueenService` | `CreateQueen`, `ListQueens`, `UpdateQueen`, `DeleteQueen` |
| `InspectionService` | `CreateInspection`, `ListInspections`, `DeleteInspection`, `AddInspectionPhoto`, `RemoveInspectionPhoto` |
| `TaskService` | `CreateTask`, `ListTasks`, `SetTaskDone`, `DeleteTask` |
| `TreatmentService` | `CreateTreatment`, `ListTreatments`, `DeleteTreatment` |
| `HarvestService` | `CreateHarvest`, `ListHarvests`, `DeleteHarvest` |
| `EventService` | `ListEvents` |
| `StatsService` | `GetDashboard`, `GetHoneyStats` |
| `SyncService` | `Pull`, `Push`, `Subscribe` (stream desde el servidor) |

Cada RPC está acotado al espacio (tenant) activo del llamante. Los id de otro
espacio se comportan como id desconocidos (`not_found`).

### Las escrituras pasan por la sincronización \{#writes-go-through-sync}

Cada RPC de escritura (`Create*`, `Update*`, `Delete*`, `RelocateHive`,
`SetTaskDone`, `AddInspectionPhoto`, `RemoveInspectionPhoto`) se aplica
mediante la misma fusión por campo y se añade al mismo registro de cambios que
`SyncService.Push`. Una fila escrita a través de la API llega a todos los
dispositivos en su siguiente sincronización, y una edición posterior desde un
dispositivo se fusiona con ella campo a campo, exactamente igual que se
fusionan entre sí las ediciones de dos dispositivos. Las eliminaciones son
lógicas: la fila recibe una lápida (`deleted = 1`) y desaparece de las listas
y de la aplicación.

Las escrituras del lado del servidor reflejan los propios flujos de la
aplicación (`server/internal/service/writer.go` es una adaptación de
`app/src/lib/local/history.ts`), así que el historial que muestra un
dispositivo es el mismo tanto si un registro se introdujo en la aplicación
como a través de la API:

- `CreateHive` escribe la colmena, abre un intervalo de ubicación y registra
  un evento `CREATED`. Las colmenas nuevas empiezan como `HIVE_STATUS_ACTIVE`.
- `RelocateHive` cierra la ubicación abierta, abre una nueva en el colmenar de
  destino y registra un evento `MOVED`. `UpdateHive` nunca mueve una colmena.
- `CreateQueen` termina el reinado de la reina activa de la colmena
  (`active = false`, `replacedAt` establecido al `introducedAt` de la nueva
  reina), registra los eventos `QUEEN_REPLACED` y `QUEEN_INTRODUCED`, y
  deriva el color de marcado de `year` cuando no envías ninguno.
- `CreateInspection` y `CreateTreatment` congelan el colmenar y la reina
  reinante en la `date` del registro (un registro con fecha anterior se
  resuelve contra el historial de ubicaciones y de reinas) y registran un
  evento `INSPECTION` o `TREATMENT`.
- `CreateHarvest` congela el colmenar y la reina reinante en `date` de la
  misma manera, escribe la fila de cosecha y registra un evento `HARVEST`
  que lleva `amountKg` y el título `<kg> kg <variety>` (`Honey` cuando
  `variety` está vacío). `GetDashboard` y `GetHoneyStats` suman esos
  eventos, así que una cosecha publicada a través de la API cuenta al
  instante en las cifras de miel. `amountKg` debe ser mayor que `0`.
- Una tarea con `hiveId` o `apiaryId` se sincroniza bajo ese colmenar y se
  comparte con todos los que lo ven; una tarea sin ninguno de los dos vive en
  el ámbito personal del llamante y llega solo a los dispositivos de ese
  usuario.

Las lecturas (`Get*`, `List*`, `ListEvents`, `GetDashboard`, `GetHoneyStats`)
consultan directamente las tablas del servidor. Muestran las escrituras de la
API al instante y las escrituras de los dispositivos en cuanto el dispositivo
las ha enviado.

### Todavía no en la API

- **No hay RPC para editar cosechas.** `HarvestService` solo tiene
  `CreateHarvest`, `ListHarvests` y `DeleteHarvest`. Para corregir una
  cosecha, elimínala y créala de nuevo, o edítala en la aplicación.
- **No hay RPC de ubicaciones.** Las ubicaciones las escriben `CreateHive` y
  `RelocateHive` y aparecen solo en el feed de sincronización.
- `EventService` es de solo lectura. Los eventos los escriben los flujos
  anteriores y la aplicación.

Consulta el [protocolo de sincronización](/developers/sync-protocol) para el
formato de los cambios y el [modelo de datos](/developers/data-model) para las
columnas detrás de cada mensaje.

## Endpoints que no son RPC

Junto a los servicios RPC hay unos cuantos endpoints HTTP planos:

| Ruta | Propósito |
| --- | --- |
| `GET /healthz` | Devuelve `ok` |
| `GET /files/<key>` | Archivos almacenados, solo con el backend de blobs de sistema de archivos (`BEEHIVE_BLOB_BACKEND=fs`) |
| `POST /auth/signin`, `POST /auth/signup`, `GET /auth/verify` | Cuentas de correo y contraseña (`BEEHIVE_PASSWORD_AUTH=true`) |
| `GET /auth/login`, `GET /auth/callback` | OIDC (`BEEHIVE_OIDC_PROVIDERS` definido) |
| `/auth/webauthn/login/*`, `/auth/webauthn/enroll/*`, `/auth/webauthn/credentials*` | Passkeys (`BEEHIVE_WEBAUTHN_ENABLED=true`) |
| `/auth/logout`, `/auth/me`, `/auth/instance`, `/auth/switch`, `/auth/accept-invite` | Auxiliares de sesión y de espacio (tenant), presentes siempre que haya algún método de inicio de sesión habilitado |
| `GET /auth/api-keys`, `POST /auth/api-keys`, `POST /auth/api-keys/delete` | Gestión de claves API (listar, crear, eliminar), presente siempre que haya algún método de inicio de sesión habilitado; solo con sesión, una clave no puede llamarlos |
| `/tenants/create`, `/tenants/invite`, `/tenants/invites`, `/tenants/invite/revoke`, `/tenants/delete` | Administración de espacios, presente siempre que haya algún método de inicio de sesión habilitado |
| `POST /auth/demo-login` | Solo con `BEEHIVE_DEMO=true` |

Los usan las pantallas de inicio de sesión y ajustes de la aplicación. No forman
parte del contrato proto.

## Autenticación \{#authentication}

Cómo se autentica una solicitud depende de si la instancia tiene un método de
inicio de sesión:

- **Sin inicio de sesión configurado** (autoalojado, `BEEHIVE_PASSWORD_AUTH=false`,
  `BEEHIVE_OIDC_PROVIDERS` vacío, `BEEHIVE_WEBAUTHN_ENABLED=false`): cada
  solicitud se ejecuta como el usuario local fijo. No envíes credenciales. En
  una instancia así no hay claves API; tampoco hacen falta.
- **Inicio de sesión configurado**: cada RPC necesita una clave API o un token
  de sesión en `Authorization: Bearer <token>` (la cookie `obh_session` se
  acepta para los tokens de sesión). Una solicitud sin un token válido recibe
  el código Connect `unauthenticated` (HTTP 401).

### Claves API

Una clave API es la credencial recomendada para scripts, sensores e
integraciones. Las claves se gestionan en la aplicación en
**Ajustes → Claves API** (consulta
[Cuentas y espacios](../using-the-app/accounts-tenants.md#api-keys)):

1. Inicia sesión, cambia al espacio en el que el script debe escribir y abre
   **Ajustes → Claves API**.
2. Escribe un nombre (por ejemplo `hive scale`), elige los permisos
   (**Lectura y escritura** o **Solo lectura**) y una caducidad (**No
   caduca**, **30 días**, **90 días** o **1 año**), y después toca
   **Crear clave**. La clave empieza por `obhk_` y se muestra una sola vez;
   cópiala ahora. El servidor almacena solo su hash SHA-256 y los primeros
   12 caracteres para mostrarlos.
3. Envíala en cada RPC:

```text
Authorization: Bearer obhk_...
```

Qué puede y qué no puede hacer una clave:

- Actúa como su propietario, con el rol del propietario, dentro del espacio
  que estaba activo cuando se creó la clave. No puede cambiar de espacio;
  crea una clave por espacio si un script necesita varios.
- Funciona solo en los RPC. Los endpoints `/auth/*` y `/tenants/*`, incluida
  la propia gestión de claves, necesitan una sesión real: una clave no puede
  listar, crear ni eliminar claves.
- Tiene uno de dos ámbitos, fijado al crearla. Una clave `write` (la
  predeterminada) puede llamar a todos los RPC a los que puede llamar su
  propietario. Una clave `read` solo puede llamar a los RPC cuyo nombre
  empiece por `Get`, `List`, `Pull` o `Subscribe`; cualquier otro RPC
  devuelve el código Connect `permission_denied` (HTTP 403) con el mensaje
  `this API key is read-only`.
- Caduca solo si estableces una caducidad: `expires_in_days` de `0` (nunca,
  el valor predeterminado) a `3650`. Pasado `expires_at`, cada RPC devuelve
  `unauthenticated` (HTTP 401) con el mensaje `API key expired`. Las claves
  caducadas permanecen en la lista hasta que las eliminas.
- Deja de funcionar en el momento en que se elimina en Ajustes, y muere con
  la membresía: cuando el propietario abandona el espacio o es eliminado de
  él, la clave se rechaza.
- Cada uso marca `last_used_at`, que se muestra como **Último uso** en
  Ajustes.
- La cuenta de demostración no puede crear claves.

Los mismos endpoints que usa la aplicación están abiertos a un script
autenticado con sesión:

- `GET /auth/api-keys` devuelve `{"keys": [{id, name, prefix, scope,
  created_at, expires_at, last_used_at, mine}]}`, solo tus propias claves
  en el espacio activo. `scope` es `"write"` o `"read"`; `expires_at` y
  `last_used_at` son marcas de tiempo RFC 3339 o `null`; `mine` aquí es
  siempre `true`.
- `GET /auth/api-keys?tenant=1` devuelve todas las claves del espacio
  activo, y cada fila lleva además `user_id`, `user_email` y un indicador
  `mine` que es `true` en tus propias claves. Solo pueden llamarlo el
  propietario del espacio (el rol que la aplicación llama **Admin**) y el
  administrador de la instancia; cualquier otra persona recibe HTTP 403.
- `POST /auth/api-keys` con `{"name": "...", "scope": "write",
  "expires_in_days": 0}` devuelve `{id, name, prefix, scope, created_at,
  expires_at, token}`. `scope` toma por defecto `"write"` y
  `expires_in_days` `0` (nunca) cuando se omiten. Cualquier otro ámbito, o
  una duración inferior a `0` o superior a `3650`, responde HTTP 400.
- `POST /auth/api-keys/delete` con `{"id": "..."}` responde `204`. Un
  miembro solo puede eliminar sus propias claves; el id de otra persona
  responde 404. El propietario del espacio y el administrador de la
  instancia pueden eliminar cualquier clave del espacio activo. Esa
  excepción nunca cruza espacios: el propietario de otro espacio recibe 404
  para las claves que no son suyas.

### Inicio de sesión

La alternativa es el token de sesión de la aplicación, un valor firmado con
HMAC que el servidor emite al iniciar sesión. Se acepta en los RPC y en los
endpoints `/auth/*` y `/tenants/*`. Con la autenticación por contraseña
habilitada, un script obtiene uno con:

```bash
curl -s -X POST https://bees.example.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"..."}'
```

La respuesta JSON contiene `token`; el mismo valor se establece también como
cookie `obh_session`. El token expira tras `BEEHIVE_SESSION_TTL`.

El token lleva el espacio activo de la cuenta. `GET /auth/me` lista los
espacios a los que perteneces (`tenants`) y el activo (`active_org`);
`POST /auth/switch` con `{"org_id": "..."}` devuelve un nuevo `token` para
otro espacio.

Con `BEEHIVE_DEMO=true`, las sesiones de demostración son de solo lectura: la
cuenta de demostración solo puede llamar a los RPC cuyo nombre empiece por
`Get`, `List`, `Pull` o `Subscribe`. Cualquier otro RPC devuelve
`permission_denied`.

Consulta [Autenticación](/self-hosting/authentication) para saber cómo configurar
los métodos de inicio de sesión.

## Páginas de protocolo

- [REST / HTTP + JSON](/using-the-api/rest): ejemplos con curl, la forma del
  JSON y el contrato de paginación.
- [gRPC](/using-the-api/grpc): clientes generados y la llamada de streaming
  `Subscribe`.
- [Rastreadores automáticos](/using-the-api/automated-trackers): publicar
  lecturas de básculas de colmena y de clima desde un script o dispositivo.
