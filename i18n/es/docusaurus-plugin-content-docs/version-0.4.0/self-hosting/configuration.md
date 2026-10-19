---
sidebar_position: 4
title: "Configuración"
---

# Configuración

Openbeehive se configura por completo a través de variables de entorno. Esta página es la referencia completa.

Puedes definir estas variables en tu shell, en un archivo `.env` junto al binario, en tu archivo `docker compose` o mediante el gestor de secretos de tu plataforma de alojamiento. El servidor las lee una sola vez al arrancar, por lo que los cambios surten efecto tras un reinicio.

:::tip Empieza poco a poco
Solo necesitas un puñado de estas para empezar. Para un servidor doméstico de un solo usuario, define `BEEHIVE_DEPLOYMENT_PROFILE=selfhost`, un `BEEHIVE_SESSION_SECRET` y deja el resto con sus valores predeterminados. Consulta la [Guía rápida](/self-hosting/quick-start) para ponerlo en marcha en minutos.
:::

## Cómo funciona el perfil de despliegue

El ajuste más importante de todos es `BEEHIVE_DEPLOYMENT_PROFILE`. Elige valores predeterminados sensatos para todo lo demás, de modo que no tengas que detallar a mano una pila completa.

| Perfil     | Base de datos predeterminada | Almacenamiento de blobs predeterminado | Pensado para                          |
| ---------- | ---------------------------- | -------------------------------------- | ------------------------------------- |
| `selfhost` | SQLite (archivo)             | Sistema de archivos local              | Un solo binario, sin Docker, un host  |
| `cloud`    | PostgreSQL                   | MinIO / S3                             | El despliegue alojado y multi-tenant |

El perfil solo establece *valores predeterminados*. Cualquier variable que definas explícitamente siempre prevalece. Por ejemplo, puedes ejecutar el perfil `selfhost` pero apuntarlo a PostgreSQL definiendo `BEEHIVE_DATABASE_DRIVER` y `BEEHIVE_DATABASE_DSN` por tu cuenta.

:::note
Los dos perfiles se documentan en profundidad en sus propias páginas: [Binario único](/self-hosting/single-binary) y [Docker](/self-hosting/docker). Esta página se centra en las variables en sí.
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
| `BEEHIVE_HTTP_READ_TIMEOUT` | `0` | Límite de lectura de la petición completa; `0` significa ninguno. |
| `BEEHIVE_HTTP_WRITE_TIMEOUT` | `0` | Límite de escritura de la respuesta; `0` significa ninguno. |
| `BEEHIVE_HTTP_IDLE_TIMEOUT` | `120s` | Cuánto tiempo permanece abierta una conexión keep-alive inactiva. |
| `BEEHIVE_HTTP_SHUTDOWN_TIMEOUT` | `15s` | Periodo de gracia para las peticiones en curso al apagar. |

:::caution
`BEEHIVE_PUBLIC_BASE_URL` debe coincidir con la dirección que los usuarios visitan realmente. Si es incorrecta, las redirecciones de inicio de sesión y los enlaces de invitación apuntan al lugar equivocado.
:::

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
| `BEEHIVE_CORS_ALLOWED_ORIGINS`   | `*`     | Lista separada por comas de orígenes permitidos. Restríngela a tu dominio en producción. |
| `BEEHIVE_CORS_ALLOW_CREDENTIALS` | `true`  | Si se permiten las solicitudes de origen cruzado con credenciales (cookies, cabeceras de autenticación). |

:::caution
Un origen comodín (`*`) combinado con `BEEHIVE_CORS_ALLOW_CREDENTIALS=true` es permisivo. Si sirves la aplicación desde un único origen, establece `BEEHIVE_CORS_ALLOWED_ORIGINS` con ese origen exacto.
:::

## Sincronización

| Variable  | Predeterminado | Descripción                                                                                          |
| --------- | -------- | -------------------------------------------------------------------------------------------------- |
| `BEEHIVE_NODE_ID` | `server` | Identificador de este nodo en el protocolo de sincronización. Lo usa el Reloj Lógico Híbrido para etiquetar eventos. Mantenlo estable y único por servidor. |

El motor de sincronización sin conflictos (HLC más «el último que escribe gana» por campo y OR-Sets con prioridad de adición) necesita que cada participante tenga una identidad estable. No se recomienda cambiar `BEEHIVE_NODE_ID` en un servidor en activo.

## Base de datos

| Variable          | Predeterminado     | Descripción                                                                 |
| ----------------- | ------------------ | --------------------------------------------------------------------------- |
| `BEEHIVE_DATABASE_DRIVER` | desde el perfil    | Motor de base de datos: `postgres`, `mysql` o `sqlite`.                     |
| `BEEHIVE_DATABASE_DSN`    | desde el perfil    | Cadena de conexión para el controlador elegido (ver más abajo).            |

DSN de ejemplo por controlador:

```bash
# SQLite (selfhost default) — a single file with write-ahead logging
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN="file:openbeehive.db?_pragma=journal_mode(WAL)"

# PostgreSQL (cloud default)
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN="postgres://user:pass@host:5432/db?sslmode=disable"

# MySQL
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN="user:pass@tcp(host:3306)/openbeehive?parseTime=true"
```

Para la elección de controlador, el ajuste fino y las notas de migración, consulta [Bases de datos](/self-hosting/databases).

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

Las variables `MINIO_*` solo se usan cuando `BEEHIVE_BLOB_BACKEND=minio`. Para una guía completa, consulta [Almacenamiento](/self-hosting/storage).

## Sesión y autenticación

| Variable         | Predeterminado | Descripción                                                                                  |
| ---------------- | ------- | -------------------------------------------------------------------------------------------- |
| `BEEHIVE_SESSION_SECRET` | (vacío) | Secreto usado para firmar las cookies de sesión. Genera uno con `openssl rand -base64 32`. Obligatorio en producción. |
| `BEEHIVE_SESSION_TTL`    | `720h`  | Cuánto dura una sesión antes de que se requiera una nueva autenticación (p. ej. `720h` son 30 días). |

:::danger
Establece siempre un `BEEHIVE_SESSION_SECRET` fuerte y único, y mantenlo en privado. Si se filtra o cambia, todas las sesiones existentes quedan invalidadas.
:::

## Correo electrónico, contraseña e incorporación

Cuentas integradas para instancias multiusuario sin un proveedor de identidad externo.
El administrador de la instancia es una cuenta dedicada que tú configuras, no la primera
persona que se registra. Consulta [Autenticación](/self-hosting/authentication).

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `BEEHIVE_PASSWORD_AUTH` | activado en `cloud`, desactivado en `selfhost` | Habilita el registro y el inicio de sesión con correo electrónico y contraseña. También lo implica `BEEHIVE_DEMO=true`. |
| `BEEHIVE_ADMIN_EMAIL` | (vacío) | Correo del administrador de la instancia. **Obligatorio siempre que la autenticación por contraseña esté activada.** La cuenta se garantiza en cada arranque: se crea si falta y su rol se fuerza a administrador. El registro nunca concede el rol de administrador. |
| `BEEHIVE_ADMIN_PASSWORD` | (vacío) | Contraseña del administrador de la instancia, de al menos 8 caracteres. Es la que manda en cada arranque: la contraseña almacenada se restablece a este valor, lo que sirve también como recuperación de contraseña. |
| `BEEHIVE_REGISTRATION` | `true` | Registro abierto. Establécelo en `false` para una instancia solo por invitación: aparte del administrador configurado, las cuentas solo pueden crearse mediante enlaces de invitación, y la pantalla de inicio de sesión muestra un aviso de que la instancia es solo por invitación. |
| `BEEHIVE_EMAIL_VERIFICATION` | `false` | Exige la confirmación del correo electrónico antes de que una cuenta nueva pueda iniciar sesión. |
| `BEEHIVE_SMTP_HOST` | (vacío) | Servidor SMTP para los correos de verificación e invitación. Si está vacío, los enlaces se escriben en el registro en su lugar. |
| `BEEHIVE_SMTP_PORT` | `587` | Puerto SMTP. |
| `BEEHIVE_SMTP_USER` | (vacío) | Nombre de usuario de SMTP. |
| `BEEHIVE_SMTP_PASS` | (vacío) | Contraseña de SMTP. |
| `BEEHIVE_SMTP_FROM` | `Openbeehive <no-reply@openbeehive.org>` | Dirección de remitente del correo saliente. |

## Espacio de demostración

Instala una cuenta y un espacio (tenant) de demostración a modo de muestra. Desactivado de forma predeterminada; consulta
[Modo demostración](/self-hosting/demo).

| Variable | Predeterminado | Descripción |
| --- | --- | --- |
| `BEEHIVE_DEMO` | `false` | Instala una cuenta + espacio de demostración (15 colmenas en 4 colmenares, reiniciado cada hora). Implica `BEEHIVE_PASSWORD_AUTH=true`. |
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
| `BEEHIVE_OIDC_PROVIDERS`     | (vacío) | Lista separada por comas de los proveedores habilitados, p. ej. `google,keycloak`. |
| `BEEHIVE_OIDC_REDIRECT_URL`  | `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback` | La URL de devolución de llamada a la que los proveedores redirigen tras el inicio de sesión. |

A continuación, cada proveedor tiene sus propias variables: `BEEHIVE_OIDC_<NOMBRE>_ISSUER`,
`BEEHIVE_OIDC_<NOMBRE>_CLIENT_ID`, `BEEHIVE_OIDC_<NOMBRE>_CLIENT_SECRET` y, opcionalmente,
`BEEHIVE_OIDC_<NOMBRE>_SCOPES` (por defecto `openid,profile,email`), donde `<NOMBRE>` es el
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

Para los tutoriales de configuración de proveedores, las URL de redirección y los consejos de seguridad, consulta [Autenticación](/self-hosting/authentication).

## Un ejemplo mínimo de selfhost

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=https://hive.example.com
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
# Database and blob storage use selfhost defaults (SQLite + local files)
# No OIDC, no WebAuthn, no password auth — single-user mode
```

Si activas la autenticación por contraseña para una instancia familiar o de una asociación,
añade también el administrador dedicado:

```bash
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=tu@example.com
BEEHIVE_ADMIN_PASSWORD=una-contraseña-larga-que-puedas-recuperar
```

Eso es todo lo que un apicultor individual necesita. Añade un proxy inverso por delante para HTTPS y estarás listo para llevar tus registros.
