---
sidebar_position: 3
title: "Docker y Compose"
---

# Docker y Compose

Ejecuta Openbeehive como un contenedor único para una configuración autoalojada, o levanta la pila cloud completa (Postgres y MinIO) con Docker Compose.

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
Para una instancia de un solo usuario en una máquina, el [binario único](/self-hosting/single-binary) es aún más sencillo que Docker. Recurre a Compose cuando quieras Postgres y almacenamiento estilo S3.
:::

## Ejecutar el contenedor único

Un contenedor con el perfil `selfhost` mantiene una base de datos SQLite y los blobs subidos en un único volumen montado. No se requiere nada más.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

- `-p 8080:8080` mapea el puerto de escucha del contenedor (`BEEHIVE_ADDR=:8080`) al host.
- `-v openbeehive-data:/data` mantiene tus datos en un volumen con nombre. Docker crea el volumen con la propiedad de `/data` en la imagen, así que el usuario sin privilegios del servidor puede escribir en él. Si en su lugar montas un directorio del host con bind mount (`-v /srv/openbeehive:/data`), debe pertenecer al uid `65532`: `sudo chown -R 65532:65532 /srv/openbeehive`.
- Las líneas `BEEHIVE_DATABASE_DSN` y `BEEHIVE_BLOB_DIR` apuntan explícitamente la base de datos y las fotos subidas al volumen. Los valores por defecto (`openbeehive.db`, `./data/blobs`) son relativos al directorio de trabajo, que desde 0.4.0 es `/data`, pero escribir las rutas completas mantiene el comando inequívoco y coincide con las instrucciones de copia de seguridad.
- `BEEHIVE_PUBLIC_BASE_URL` debe ser la dirección que alcanzan los usuarios, incluido el esquema. El servidor la usa para las URL de redirección OIDC y para los enlaces de invitación y verificación.

Sin ningún método de inicio de sesión habilitado (el valor predeterminado de selfhost), la instancia se ejecuta en modo de un solo usuario. Para añadir autenticación, define `BEEHIVE_SESSION_SECRET` (genéralo una vez con `openssl rand -base64 32` y mantenlo estable; cambiarlo cierra la sesión de todo el mundo) más las variables del método que quieras. El inicio de sesión con correo y contraseña también necesita `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD`, o el servidor se niega a arrancar. Consulta [Autenticación](/self-hosting/authentication).

### Usar un archivo de entorno

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## El perfil cloud con Compose

El perfil `cloud` empareja el servidor con PostgreSQL y MinIO. El `docker-compose.yml` del repositorio es una pila de desarrollo: compila el servidor desde el código fuente y publica los puertos de la base de datos y de MinIO en el host.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
cp .env.example .env   # then edit .env (see below)
docker compose up -d --build
```

### Los servicios

| Servicio | Imagen | Función |
| --- | --- | --- |
| `server` | compilado desde el `Dockerfile` del repositorio | Backend y aplicación web en `:8080` |
| `postgres` | `postgres:18-alpine` | Base de datos; `5432` publicado en el host |
| `minio` | `minio/minio:latest` | Almacenamiento de blobs compatible con S3; `9000` (API) y `9001` (consola) publicados en el host |

`server` depende de `postgres` y `minio`, así que Compose los inicia primero.

### Qué establece el archivo compose

Estos valores están fijados en `docker-compose.yml` y no se leen de `.env`; cámbialos editando el archivo (y cambia las credenciales de Postgres y MinIO en el mismo sitio):

| Ajuste | Valor en el archivo compose |
| --- | --- |
| `BEEHIVE_DEPLOYMENT_PROFILE` | `cloud` |
| `BEEHIVE_DATABASE_DSN` | `postgres://openbeehive:openbeehive@postgres:5432/openbeehive?sslmode=disable` |
| `BEEHIVE_MINIO_ENDPOINT` | `minio:9000` |
| `BEEHIVE_MINIO_ACCESS_KEY` / `BEEHIVE_MINIO_SECRET_KEY` | `minioadmin` / `minioadmin` |
| `BEEHIVE_OIDC_PROVIDERS` | `google` |

Estos vienen de tu shell o de `.env`:

```bash
# Required: the cloud profile enables password auth, which needs the instance admin.
# docker compose up fails immediately if either is missing.
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters

# Sessions; generate with: openssl rand -base64 32
BEEHIVE_SESSION_SECRET=

# Defaults to http://localhost:8080
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Google is enabled as an OIDC provider in the compose file, so these are
# required too; without a client ID the server exits with
# "OIDC provider google: issuer/client id missing". Remove the BEEHIVE_OIDC_*
# lines from docker-compose.yml if you do not want Google sign-in.
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Los nombres de servicio son nombres de host
Dentro de la red de Compose, los contenedores se alcanzan entre sí por el nombre del servicio; por eso el DSN apunta a `postgres` y el endpoint de MinIO a `minio`.
:::

### Un archivo con forma de producción

`docker-compose.demo.yml` en el repositorio es el archivo que hay detrás de la instancia alojada: usa la imagen publicada en lugar de compilar, no publica puertos de base de datos ni de MinIO, añade políticas de reinicio y comprobaciones de salud, toma todos los secretos de `.env`, cierra el registro (solo por invitación) y habilita el [espacio de demostración](/self-hosting/demo). Su comentario de cabecera lista las variables que necesita. Úsalo como punto de partida para tu propia pila de producción:

```bash
docker compose -f docker-compose.demo.yml up -d
```

Para la lista completa de variables, consulta [Configuración](/self-hosting/configuration).

## Persistir tus datos

- **Contenedor único (`selfhost`):** todo está bajo `/data` en el volumen `openbeehive-data`, siempre que el DSN y el directorio de blobs apunten allí.
- **Perfil cloud:** los registros residen en el volumen `pg` (Postgres) y los archivos subidos en el volumen `minio`. El contenedor del servidor no tiene estado y puede reemplazarse libremente.

:::danger Haz copia de seguridad antes de actualizar
Los volúmenes con nombre sobreviven a `docker compose up` y a las actualizaciones de imagen, pero no a `docker compose down -v` ni a un volumen eliminado. Haz una copia de seguridad antes de cualquier actualización o comando destructivo. Consulta [Copias de seguridad](/self-hosting/backups).
:::

## Operaciones comunes

```bash
# Follow the server logs
docker compose logs -f server

# Rebuild from updated source and recreate (docker-compose.yml builds the image)
git pull && docker compose up -d --build

# Pull a newer published image and recreate (docker-compose.demo.yml or your own file)
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d

# Stop everything (volumes are kept)
docker compose down
```
