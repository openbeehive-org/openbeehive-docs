---
sidebar_position: 4
title: "Configuración"
---

# Configuración

Openbeehive se configura por completo a través de variables de entorno. Esta página es la referencia completa.

Puedes definir estas variables en tu shell, en tu archivo `docker compose`, mediante el gestor de secretos de tu plataforma de alojamiento o en un archivo `.env`. El servidor lee `.env` de su directorio de trabajo al arrancar; las variables que ya están definidas en el entorno prevalecen sobre el archivo. Todo se lee una sola vez, por lo que los cambios surten efecto tras un reinicio.

:::tip Empieza poco a poco
Solo necesitas un puñado de estas para empezar. Un servidor doméstico de un solo usuario funciona con los valores predeterminados, sin más. En cuanto actives un método de inicio de sesión, añade `BEEHIVE_SESSION_SECRET` y, para el inicio de sesión con correo y contraseña, la cuenta de administrador. Consulta el [Inicio rápido](./quick-start.md) para ponerlo en marcha en minutos.
:::

## Cómo funciona el perfil de despliegue

El ajuste más importante de todos es `BEEHIVE_DEPLOYMENT_PROFILE`. Elige valores predeterminados sensatos para todo lo demás, de modo que no tengas que detallar a mano una pila completa.

| Perfil     | Base de datos predeterminada | Almacenamiento de blobs predeterminado | Pensado para                          |
| ---------- | ---------------------------- | -------------------------------------- | ------------------------------------- |
| `selfhost` | SQLite (archivo)             | Sistema de archivos local              | Un solo binario, sin Docker, un host  |
| `cloud`    | PostgreSQL                   | MinIO / S3                             | Una instancia con varios usuarios     |

El perfil solo establece *valores predeterminados*. Cualquier variable que definas explícitamente siempre prevalece. Por ejemplo, puedes ejecutar el perfil `selfhost` pero apuntarlo a PostgreSQL definiendo `BEEHIVE_DATABASE_DRIVER` y `BEEHIVE_DATABASE_DSN` por tu cuenta.

:::note
Los dos perfiles se documentan en profundidad en sus propias páginas: [Binario único](./single-binary.md) y [Docker](./docker.md). Esta página se centra en las variables en sí.
:::

## Perfil de despliegue

| Variable             | Predeterminado | Descripción                                                                 |
| -------------------- | ---------- | --------------------------------------------------------------------------- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `selfhost` | Selecciona la pila preconfigurada: `selfhost` o `cloud`. Establece los valores predeterminados de la base de datos y el almacenamiento de blobs. |

## Servidor HTTP

| Variable          | Predeterminado           | Descripción                                                                 |
| ----------------- | ------------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_ADDR`            | `:8080`                  | Dirección y puerto en los que escucha el servidor. Usa `127.0.0.1:8080` para enlazar solo a localhost detrás de un proxy inverso. |
| `BEEHIVE_PUBLIC_BASE_URL` | `http://localhost:8080`  | La URL pública donde los usuarios acceden a la aplicación. Se usa para las redirecciones de OIDC, los enlaces de invitación y verificación, y los valores predeterminados de las passkeys. Establécela con tu dominio real en producción. |
| `BEEHIVE_HTTP_READ_HEADER_TIMEOUT` | `10s` | Tiempo permitido para leer las cabeceras de una petición. |
| `BEEHIVE_HTTP_READ_TIMEOUT` | `2m` | Tiempo permitido para leer una petición; `0` significa sin límite. El flujo de sincronización en vivo queda exento. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `2m` | Tiempo permitido para escribir una respuesta; `0` significa sin límite. El flujo de sincronización en vivo queda exento. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Cuánto tiempo permanece abierta una conexión keep-alive inactiva. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Periodo de gracia para las peticiones en curso al apagar. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `false` | Toma la dirección del cliente para la limitación de intentos de inicio de sesión de la última entrada de `X-Forwarded-For`. Establécelo en `true` solo cuando haya por delante exactamente un proxy inverso que tú controlas y el puerto del servidor no sea accesible de ninguna otra forma. |
| `BEEHIVE_ALLOWED_HOSTS` | (vacío) | Solo sin inicio de sesión: nombres de host adicionales a los que responde el servidor, separados por comas. `*` desactiva la comprobación. Ver más abajo. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` debe coincidir con la dirección que los usuarios visitan realmente. Si es incorrecta, las redirecciones de inicio de sesión y los enlaces de invitación apuntan al lugar equivocado.
:::

Un mensaje RPC puede tener como máximo 16 MiB; la aplicación divide por sí misma las subidas más grandes. Este límite no es configurable.

### Nombres de host sin inicio de sesión \{#allowed-hosts}

Un servidor sin método de inicio de sesión trata cada petición como si viniera del único usuario local. Para evitar que una página web que simplemente visitas llegue hasta él bajo un nombre propio, un servidor así solo responde cuando el `Host` de la petición es `localhost`, una dirección IP, el host de `BEEHIVE_PUBLIC_BASE_URL` o un nombre incluido en `BEEHIVE_ALLOWED_HOSTS`. Los demás nombres reciben una respuesta `403` que indica el ajuste. Con un método de inicio de sesión habilitado, la comprobación está desactivada.

## Aplicación web integrada

El servidor puede servir él mismo la PWA de SvelteKit, de modo que un solo binario entrega tanto la API como el front-end.

| Variable     | Predeterminado | Descripción                                                                                  |
| ------------ | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SERVE_WEB`  | `true`  | Cuando es `true`, el servidor sirve la aplicación web incluida. Establécelo en `false` si alojas el front-end por separado. |
| `BEEHIVE_WEB_DIR`    | (vacío) | Ruta a los recursos web compilados. Déjalo vacío para usar los recursos integrados en el binario.          |

## CORS

Los ajustes de origen cruzado importan cuando la aplicación web se sirve desde un origen distinto al de la API.

| Variable                 | Predeterminado | Descripción                                                                 |
| ------------------------ | ------- | --------------------------------------------------------------------------- |
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | (vacío) | Lista separada por comas de otros orígenes que pueden llamar a la API desde un navegador, p. ej. `https://app.example.com`. Vacío significa solo el mismo origen. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Si los orígenes listados pueden enviar credenciales (cookies, cabeceras de autenticación). |

:::caution
Déjalo vacío cuando el servidor sirve él mismo la aplicación web (lo predeterminado). `*` permite cualquier origen, pero nunca con credenciales: el servidor desactiva entonces las credenciales, de modo que una aplicación de navegador con sesión iniciada en otro origen deja de funcionar. En su lugar, enumera los orígenes explícitamente. Con `make dev-app`, establece `http://localhost:5173`.
:::

## Mapas \{#maps}

Las teselas del mapa y la búsqueda de direcciones son los únicos servicios remotos con los que contacta la aplicación. Ambos son configurables y pueden desactivarse para toda la instancia.

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `BEEHIVE_MAPS` | `on` | `off` elimina el mapa y la búsqueda de direcciones de la aplicación. |
| `BEEHIVE_MAP_TILE_URL` | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | Plantilla de URL de teselas (sintaxis de Leaflet). `{s}` solo puede aparecer en la primera etiqueta del nombre de host. |
| `BEEHIVE_GEOCODER_URL` | `https://nominatim.openstreetmap.org` | URL base de una búsqueda de direcciones compatible con Nominatim. |

Con los valores predeterminados, un navegador que abre un mapa solicita teselas a OpenStreetMap, y escribir una dirección o mover el marcador de un colmenar envía esa dirección o posición a Nominatim. Ambos ven la dirección IP del dispositivo. El servidor añade los dos orígenes a su Content-Security-Policy, de modo que la aplicación puede acceder a ellos y a nada más.

## Sincronización

| Variable  | Predeterminado | Descripción                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | aleatorio en cada arranque | Id de reloj con el que se marcan los cambios que el propio servidor escribe (llamadas a la API). Normalmente no hay motivo para establecerlo. |

Ejecuta exactamente una instancia del servidor por base de datos. No se admite ejecutar varias réplicas contra una misma base de datos.

## Base de datos

| Variable          | Predeterminado     | Descripción                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | desde el perfil    | Motor de base de datos: `postgres`, `mysql` (MariaDB) o `sqlite`.           |
| `BEEHIVE_DATABASE_DSN`    | desde el perfil    | Cadena de conexión para el controlador elegido (ver más abajo).            |

DSN de ejemplo por controlador:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MariaDB (driver name: mysql)
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Para la elección de controlador, el ajuste fino y las notas de migración, consulta [Bases de datos](./databases.md).

## Almacenamiento de blobs

Las fotos y otros archivos adjuntos se guardan como blobs, ya sea en el sistema de archivos local o en un almacén de objetos compatible con S3.

| Variable          | Predeterminado | Descripción                                                              |
| ----------------- | -------------- | ----------------------------------------------------------------------- |
| `BEEHIVE_BLOB_BACKEND`    | desde el perfil | Backend de almacenamiento: `fs` (sistema de archivos local) o `minio` (MinIO / S3). |
| `BEEHIVE_BLOB_DIR`        | `./data/blobs` | Directorio para los blobs cuando `BEEHIVE_BLOB_BACKEND=fs`.                     |
| `BEEHIVE_BLOB_PUBLIC_URL` | `<BEEHIVE_PUBLIC_BASE_URL>/files` | URL base bajo la que se sirven a los navegadores los archivos almacenados. Cámbiala solo si un proxy o CDN sirve el directorio de blobs desde otra dirección. |
| `BEEHIVE_MINIO_ENDPOINT`  | `localhost:9000` | Host y puerto del endpoint de MinIO / S3.                              |
| `BEEHIVE_MINIO_ACCESS_KEY`| `minioadmin` | Clave de acceso del almacén de objetos.                                 |
| `BEEHIVE_MINIO_SECRET_KEY`| `minioadmin` | Clave secreta del almacén de objetos.                                   |
| `BEEHIVE_MINIO_BUCKET`    | `openbeehive` | Nombre del bucket donde se guardan los blobs.                           |
| `BEEHIVE_MINIO_USE_SSL`   | `false` | Establécelo en `true` para conectarte al endpoint mediante HTTPS.       |

Las variables `MINIO_*` solo se usan cuando `BEEHIVE_BLOB_BACKEND=minio`. Para una guía completa, consulta [Almacenamiento](./storage.md).

## Sesión y autenticación

| Variable         | Predeterminado | Descripción                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vacío) | Secreto que firma los tokens de sesión, de al menos 32 bytes. Genera uno con `openssl rand -base64 32`. **Obligatorio en cuanto se habilita cualquier método de inicio de sesión**: el servidor se niega a arrancar sin él. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Cuánto dura una sesión antes de que se requiera una nueva autenticación (p. ej. `720h` son 30 días). |

:::danger
Mantén `BEEHIVE_SESSION_SECRET` en privado y estable. Quien lo conozca puede falsificar sesiones; cambiarlo cierra la sesión de todo el mundo.
:::

## Correo electrónico, contraseña e incorporación

Cuentas integradas para instancias multiusuario sin un proveedor de identidad externo.
El administrador de la instancia es una cuenta dedicada que tú configuras, no la primera
persona que se registra. Consulta [Autenticación](./authentication.md).

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | activado en `cloud`, desactivado en `selfhost` | Habilita el registro y el inicio de sesión con correo electrónico y contraseña. También lo implica `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vacío) | Correo del administrador de la instancia. **Obligatorio siempre que la autenticación por contraseña esté activada.** La cuenta se garantiza en cada arranque: se crea si falta y su rol se fuerza a administrador. El registro nunca concede el rol de administrador. |
| `BEEHIVE_ADMIN_PASSWORD` | (vacío) | Contraseña del administrador de la instancia, de al menos 8 caracteres. Es la que manda en cada arranque: la contraseña almacenada se restablece a este valor, lo que sirve también como recuperación de contraseña. |
| `BEEHIVE_REGISTRATION` | `true` | Registro abierto. Establécelo en `false` para una instancia solo por invitación: aparte del administrador configurado, las cuentas solo pueden crearse mediante enlaces de invitación, y la pantalla de inicio de sesión muestra un aviso de que la instancia es solo por invitación. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Exige la confirmación del correo electrónico antes de que una cuenta nueva pueda iniciar sesión. Necesita `BEEHIVE_SMTP_HOST`; el servidor se niega a arrancar con la verificación activada y sin servidor de correo. |
| `BEEHIVE_SMTP_HOST` | (vacío) | Servidor SMTP para los correos de verificación e invitación. Si está vacío, no se envía ningún correo y el administrador copia los enlaces de invitación desde Ajustes. Los enlaces nunca se escriben en el registro del servidor. |
| `BEEHIVE_SMTP_PORT` | `587` | Puerto SMTP. |
| `BEEHIVE_SMTP_USER` | (vacío) | Nombre de usuario de SMTP. |
| `BEEHIVE_SMTP_PASS` | (vacío) | Contraseña de SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Dirección de remitente del correo saliente. |

## Espacio de demostración

Instala una cuenta y un espacio de demostración a modo de muestra. Desactivado de forma predeterminada; consulta
[Modo demo](./demo.md).

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Instala una cuenta y un espacio de demostración (15 colmenas en 4 colmenares, reiniciado cada hora). Implica `BEEHIVE_PASSWORD_AUTH=true`. |
| `BEEHIVE_DEMO_AUTOLOGIN` | `false` | Inicia sesión automáticamente en la demo a los visitantes anónimos en lugar de mostrar la pantalla de inicio de sesión. Solo para hosts de pura demostración; déjalo desactivado en una instancia que también sirva a usuarios reales. |
| `BEEHIVE_DEMO_EMAIL` | `demo@app.openbeehive.org` | Correo electrónico de la cuenta de demostración. |
| `BEEHIVE_DEMO_PASSWORD` | `demo` | Contraseña de la cuenta de demostración. |

## WebAuthn / claves de acceso

Autenticación sin contraseña opcional mediante claves de acceso.

| Variable                  | Predeterminado | Descripción                                                            |
| ------------------------- | ------- | --------------------------------------------------------------------- |
| `BEEHIVE_WEBAUTHN_ENABLED`        | `false` | Habilita el inicio de sesión con WebAuthn / claves de acceso.        |
| `BEEHIVE_WEBAUTHN_RP_ID`          | host de `BEEHIVE_PUBLIC_BASE_URL` | ID de la parte que confía (Relying Party), normalmente tu dominio simple (p. ej. `openbeehive.org`). |
| `BEEHIVE_WEBAUTHN_RP_ORIGINS`     | `BEEHIVE_PUBLIC_BASE_URL` | Orígenes permitidos para las ceremonias de WebAuthn, separados por comas. |
| `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME`| `Openbeehive` | Nombre legible que se muestra a los usuarios durante el registro.    |

## Proveedores OIDC

Inicio de sesión a través de proveedores de identidad externos mediante OpenID Connect. Se pueden habilitar varios proveedores a la vez.

| Variable             | Predeterminado | Descripción                                                              |
| -------------------- | ------- | ----------------------------------------------------------------------- |
| `BEEHIVE_OIDC_PROVIDERS`     | (vacío) | Lista separada por comas de los proveedores habilitados, p. ej. `google,keycloak`. Cada proveedor listado necesita su emisor y su id de cliente, o el servidor se niega a arrancar. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | La URL de devolución de llamada a la que los proveedores redirigen tras el inicio de sesión. |

A continuación, cada proveedor tiene sus propias variables: `BEEHIVE_OIDC_<NAME>_ISSUER`,
`BEEHIVE_OIDC_<NAME>_CLIENT_ID`, `BEEHIVE_OIDC_<NAME>_CLIENT_SECRET` y, opcionalmente,
`BEEHIVE_OIDC_<NAME>_SCOPES` (por defecto `openid,profile,email`), donde `<NAME>` es el
nombre del proveedor en mayúsculas. Por ejemplo:

```bash
# Google
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile

# Keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/beekeepers
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=...
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=...
```

:::tip Un solo usuario, sin inicio de sesión
Para una instancia personal autoalojada puedes omitir el inicio de sesión por completo: deja `BEEHIVE_PASSWORD_AUTH` desactivado (el valor predeterminado de selfhost), `BEEHIVE_OIDC_PROVIDERS` vacío y `BEEHIVE_WEBAUTHN_ENABLED=false`. La aplicación se ejecuta entonces en modo de un solo usuario, sin paso de inicio de sesión.
:::

Para los tutoriales de configuración de proveedores, las URL de redirección y los consejos de seguridad, consulta [Autenticación](./authentication.md).

## Un ejemplo mínimo de selfhost

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://192.168.1.20:8080
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth: single-user mode, no session secret needed
```

Si activas la autenticación por contraseña para una instancia familiar o de una asociación,
añade el secreto de sesión y el administrador dedicado:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=a-long-password-you-can-recover-with
```

Añade un proxy inverso por delante para HTTPS, establece `BEEHIVE_TRUST_PROXY_HEADERS=true` detrás de él y estarás listo para llevar tus registros.
