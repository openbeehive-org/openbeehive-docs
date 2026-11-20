---
sidebar_position: 3
title: "Docker y Compose"
---

# Docker y Compose

Ejecuta Openbeehive como un contenedor único para una configuración autoalojada, o levanta PostgreSQL, MinIO y el servidor juntos con Docker Compose. El repositorio incluye un archivo Compose para cada caso:

| Archivo | Qué ejecuta | Para qué usarlo |
| --- | --- | --- |
| `docker-compose.selfhost.yml` | Un contenedor, SQLite y archivos en un volumen con nombre | Un apicultor o un hogar en una sola máquina |
| `docker-compose.prod.yml` | La imagen publicada con PostgreSQL y MinIO, inicio de sesión siempre activo | Una instancia con varios usuarios |
| `docker-compose.yml` | PostgreSQL, MinIO y un servidor compilado desde el checkout | Desarrollo. No es una plantilla de producción |
| `docker-compose.demo.yml` | Como el archivo de producción más la demo pública de solo lectura | La instancia alojada en `app.openbeehive.org`. No es una plantilla para tu propio servidor |

La imagen se publica en el GitHub Container Registry con cada etiqueta de versión:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest    # newest release
ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z     # a specific release
ghcr.io/openbeehive-org/openbeehive-app:X.Y       # newest patch of a minor release
```

La misma imagen sirve para ambos perfiles de despliegue; el entorno que le pases decide cuál obtienes. Desde 0.4.0 el contenedor se ejecuta como el usuario sin privilegios `65532` con `/data` como directorio de trabajo.

### Verificar una imagen de versión

Cada imagen de versión está firmada con [cosign](https://docs.sigstore.dev/cosign/verifying/verify/) (sin clave, vinculada a la identidad del flujo de trabajo de publicación), lleva una atestación de procedencia de compilación de GitHub e incluye un SBOM en la [versión en GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Para comprobar que la imagen que descargas es la que compiló el flujo de trabajo de publicación:

```bash
cosign verify ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z \
  --certificate-oidc-issuer https://token.actions.githubusercontent.com \
  --certificate-identity-regexp '^https://github.com/openbeehive-org/openbeehive-app/\.github/workflows/release\.yml@.*'

gh attestation verify oci://ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z --owner openbeehive-org
```

Ambos comandos muestran la identidad firmante y el commit a partir del cual se compiló la imagen. Las imágenes publicadas antes de 0.4.0 no están firmadas.

:::tip
Para una instancia de un solo usuario en una máquina, el [binario único](./single-binary.md) es aún más sencillo que Docker. Recurre al archivo Compose de producción cuando varias personas usen la instancia.
:::

## Ejecutar el contenedor único

Un contenedor con el perfil `selfhost` mantiene una base de datos SQLite y los archivos subidos en un único volumen montado. No se requiere nada más.

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 127.0.0.1:8080:8080` publica el puerto solo en esta máquina. Sin inicio de sesión, cualquiera que pueda alcanzar el puerto tiene acceso completo, así que publícalo en la red (`-p 8080:8080`) solo después de haber [activado el inicio de sesión](./quick-start.md#turn-login-on).
- `-v openbeehive-data:/data` mantiene tus datos en un volumen con nombre. `/data` es el directorio de trabajo, así que los valores por defecto (`openbeehive.db`, `./data/blobs`) van a parar al volumen. Docker crea el volumen con la propiedad de `/data` en la imagen, así que el usuario sin privilegios del servidor puede escribir en él. Si en su lugar montas un directorio del host con bind mount (`-v /srv/openbeehive:/data`), debe pertenecer al uid `65532`: `sudo chown -R 65532:65532 /srv/openbeehive`.
- Un servidor sin inicio de sesión solo responde a `localhost`, a direcciones IP y al host de `BEEHIVE_PUBLIC_BASE_URL`. Si lo abres con otro nombre (por ejemplo `http://nas.local:8080`), establece `BEEHIVE_PUBLIC_BASE_URL` con esa dirección o añade el nombre a `BEEHIVE_ALLOWED_HOSTS`.

### Lo mismo como archivo Compose

`docker-compose.selfhost.yml` es el comando anterior con una política de reinicio y una comprobación de salud. Toma sus ajustes de un archivo `.env` situado junto a él:

```bash
# .env (all optional; without it the instance has no login and is published on 127.0.0.1)
BEEHIVE_BIND=0.0.0.0                              # publish on the network
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org  # the address people open
BEEHIVE_PASSWORD_AUTH=true                        # require sign-in
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please           # 8+ characters
BEEHIVE_SESSION_SECRET=...                        # openssl rand -base64 32
BEEHIVE_TRUST_PROXY_HEADERS=true                  # only behind a reverse proxy
```

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Con un `docker run` simple, pasa las mismas variables con `-e` o `--env-file openbeehive.env`. Cualquier método de inicio de sesión necesita `BEEHIVE_SESSION_SECRET` (32 bytes o más; genéralo una vez y mantenlo estable, cambiarlo cierra la sesión de todo el mundo). Consulta [Autenticación](./authentication.md).

## Varios usuarios: PostgreSQL y MinIO \{#several-users}

`docker-compose.prod.yml` ejecuta la imagen publicada en el perfil `cloud` con PostgreSQL y MinIO. El inicio de sesión está siempre activo (correo y contraseña), el registro está cerrado salvo que lo abras, y solo se publica el puerto de la aplicación, en `127.0.0.1`, para tu [proxy inverso](./reverse-proxy.md). PostgreSQL y MinIO no se publican en absoluto.

El archivo se niega a arrancar hasta que todos los secretos estén definidos. Ponlos en un archivo `.env` situado junto a él:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org
BEEHIVE_SESSION_SECRET=...      # openssl rand -base64 32
POSTGRES_PASSWORD=...           # openssl rand -hex 24
MINIO_ROOT_PASSWORD=...         # openssl rand -hex 24
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=...      # 8+ characters; applied again on every start
```

```bash
docker compose -f docker-compose.prod.yml up -d
```

Ajustes opcionales que el archivo deja pasar: `BEEHIVE_REGISTRATION` (por defecto `false`, solo por invitación), las variables `BEEHIVE_SMTP_*` para los correos de invitación y verificación, y `BEEHIVE_BIND` (establécelo en `0.0.0.0` solo cuando el proxy inverso se ejecute en otra máquina, y asegúrate de que nada más pueda alcanzar el puerto).

El archivo establece `BEEHIVE_TRUST_PROXY_HEADERS=true`, porque espera exactamente un proxy inverso por delante. Ejecuta exactamente una instancia del servidor por base de datos.

### Los servicios

| Servicio | Imagen | Función |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app` (versión fijada) | Backend y aplicación web en `:8080` |
| `postgres` | `postgres:18-alpine` | Base de datos |
| `minio` | `minio/minio` | Almacenamiento de blobs compatible con S3 |

`server` espera hasta que `postgres` y `minio` informan de que están en buen estado.

:::note Los nombres de servicio son nombres de host
Dentro de la red de Compose, los contenedores se alcanzan entre sí por el nombre del servicio; por eso el DSN apunta a `postgres` y el endpoint de MinIO a `minio`.
:::

### La pila de desarrollo

`docker-compose.yml` compila el servidor desde el checkout y publica PostgreSQL (`5432`) y MinIO (`9000`, `9001`) en `127.0.0.1` para las herramientas locales. Necesita `BEEHIVE_SESSION_SECRET`, `MINIO_ROOT_PASSWORD`, `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD` en `.env`. OIDC es opcional: establece `BEEHIVE_OIDC_PROVIDERS` junto con el emisor y el id de cliente del proveedor. Está pensado para trabajar en Openbeehive, no para ejecutarlo.

```bash
cp .env.example .env   # then add the four values above
docker compose up -d --build
```

Para la lista completa de variables, consulta [Configuración](./configuration.md).

## Persistir tus datos

- **Contenedor único (`selfhost`):** todo está bajo `/data` en el volumen `openbeehive-data`.
- **PostgreSQL y MinIO:** los registros residen en el volumen `pg` y los archivos subidos en el volumen `minio`. El contenedor del servidor no tiene estado y puede reemplazarse libremente.

:::danger Haz copia de seguridad antes de actualizar
Los volúmenes con nombre sobreviven a `docker compose up` y a las actualizaciones de imagen, pero no a `docker compose down -v` ni a un volumen eliminado. Haz una copia de seguridad antes de cualquier actualización o comando destructivo. Consulta [Copias de seguridad](./backups.md).
:::

## Operaciones comunes

```bash
# Follow the server logs
docker compose -f docker-compose.prod.yml logs -f server

# Pull the image named in the Compose file and recreate
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rebuild the development stack from updated source
git pull && docker compose up -d --build

# Stop everything (volumes are kept)
docker compose -f docker-compose.prod.yml down
```

Los archivos Compose fijan una versión por etiqueta y digest. Para pasar a una versión más reciente, actualiza el archivo desde el repositorio (o cambia la etiqueta) y sigue [Actualización](./upgrading.md).
