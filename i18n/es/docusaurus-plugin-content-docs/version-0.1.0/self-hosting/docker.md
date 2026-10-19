---
sidebar_position: 3
title: "Docker y Compose"
---

# Docker y Compose

Docker es la forma mas rapida de ejecutar Openbeehive en un servidor. Puedes
ejecutar el contenedor unico por si solo para una configuracion de alojamiento
propio ordenada, o levantar la pila cloud completa (Postgres y MinIO) con Docker
Compose.

La imagen oficial se publica en el GitHub Container Registry:

```text
ghcr.io/openbeehive-org/openbeehive-app:latest
```

La misma imagen sirve para ambos perfiles de despliegue. Cual obtienes se decide
enteramente por el entorno que le pases.

:::tip ¿Solo quieres que funcione rapido?
Si solo necesitas una instancia de un solo usuario en una maquina, el
[binario unico](/self-hosting/single-binary) es aun mas sencillo que Docker.
Recurre a Compose cuando quieras Postgres y almacenamiento estilo S3.
:::

## Ejecutar el contenedor unico

El despliegue mas sencillo es un contenedor usando el perfil `selfhost`, que
mantiene todos sus datos (una base de datos SQLite y los blobs subidos) en un
unico volumen montado. No se requiere nada mas.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com \
  -e BEEHIVE_DATABASE_DRIVER=sqlite \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -e BEEHIVE_SESSION_SECRET="$(openssl rand -base64 32)" \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Algunas notas sobre los indicadores:

- `-p 8080:8080` mapea el puerto de escucha del contenedor (establecido por `BEEHIVE_ADDR=:8080`) al
  host.
- `-v openbeehive-data:/data` es el importante. Mantiene tu base de datos y tus
  subidas en un volumen Docker con nombre, de modo que sobreviven a los reinicios
  y actualizaciones del contenedor. Apunta tanto `BEEHIVE_DATABASE_DSN` como `BEEHIVE_BLOB_DIR` dentro de este volumen.
- `BEEHIVE_PUBLIC_BASE_URL` debe ser la direccion que los usuarios alcanzan realmente, incluido el esquema.
  Se usa para construir los enlaces directos de los codigos QR y las URL de redireccion OIDC, asi que aciertala.
- `BEEHIVE_SESSION_SECRET` firma las cookies de sesion. Generalo una vez y mantenlo estable;
  cambiarlo cierra la sesion de todo el mundo.

:::caution Establece un secreto de sesion estable
El truco de `$(openssl rand -base64 32)` es practico para un primer arranque, pero produce
un valor nuevo cada vez que se ejecuta el comando. Genera el secreto una vez, guardalo
en un lugar seguro y pasa el mismo valor en cada reinicio.
:::

Con `BEEHIVE_OIDC_PROVIDERS` dejado vacio y `BEEHIVE_WEBAUTHN_ENABLED=false`, la instancia se ejecuta
en modo de un solo usuario sin inicio de sesion. Para anadir autenticacion, consulta
[Autenticacion](/self-hosting/authentication).

### Usar un archivo de entorno

Las listas largas de `-e` se vuelven incomodas. Pon tus ajustes en un archivo y pasalo con
`--env-file`:

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -v openbeehive-data:/data \
  --env-file openbeehive.env \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## El perfil cloud con Compose

El perfil `cloud` empareja el servidor con PostgreSQL para la base de datos y MinIO
para el almacenamiento de blobs compatible con S3. Esta es la configuracion recomendada para
el alojamiento multiusuario y la que refleja el servicio alojado.

El repositorio incluye un `docker-compose.yml` que conecta los tres servicios
entre si. Clona el repositorio, copia el entorno de ejemplo y levantalo:

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive
cp .env.example .env   # then edit .env (see below)
docker compose up -d
```

### Los servicios

| Servicio | Imagen | Funcion |
| --- | --- | --- |
| `server` | `ghcr.io/openbeehive-org/openbeehive-app:latest` | El backend de Openbeehive y la PWA, escuchando en `:8080`. |
| `postgres` | `postgres` | La base de datos relacional para todos los registros sincronizados. |
| `minio` | `minio/minio` | Almacenamiento de objetos compatible con S3 para fotos y otros blobs. |

El servicio `server` depende tanto de `postgres` como de `minio`, asi que Compose los inicia
primero. La aplicacion web la sirve el mismo contenedor cuando `BEEHIVE_SERVE_WEB=true`.

### Entorno requerido

Configura estos en tu `.env` antes de arrancar. El archivo compose los lee y los pasa
a los contenedores adecuados.

```bash
BEEHIVE_DEPLOYMENT_PROFILE=cloud
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.com

# Database — host "postgres" is the compose service name
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:changeme@postgres:5432/openbeehive?sslmode=disable

# Blob storage — endpoint "minio" is the compose service name
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=minio:9000
BEEHIVE_MINIO_ACCESS_KEY=minioadmin
BEEHIVE_MINIO_SECRET_KEY=changeme-too
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=false

# Sessions
BEEHIVE_SESSION_SECRET=replace-with-openssl-rand-base64-32
BEEHIVE_SESSION_TTL=720h

# Authentication (example: Google + Keycloak)
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://bees.example.com/auth/callback
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=...
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=...
```

:::note Los nombres de servicio son nombres de host
Dentro de la red de Compose, los contenedores se alcanzan entre si por el nombre del servicio. Por eso
`BEEHIVE_DATABASE_DSN` apunta a `postgres` y `BEEHIVE_MINIO_ENDPOINT` a `minio` en lugar de
a `localhost`. Cambia las credenciales para que coincidan con los valores que establezcas para los
contenedores de Postgres y MinIO.
:::

Para la lista completa de variables OIDC y WebAuthn, consulta
[Configuracion](/self-hosting/configuration) y
[Autenticacion](/self-hosting/authentication).

### Un ejemplo de compose recortado

Esta es una ilustracion reducida de como encajan los servicios. Usa el
`docker-compose.yml` del repositorio para el caso real; incluye
comprobaciones de salud y valores por defecto sensatos que este fragmento omite.

```docker
services:
  server:
    image: ghcr.io/openbeehive-org/openbeehive-app:latest
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      - postgres
      - minio
    restart: unless-stopped

  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: openbeehive
      POSTGRES_PASSWORD: changeme
      POSTGRES_DB: openbeehive
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: changeme-too
    volumes:
      - miniodata:/data
    restart: unless-stopped

volumes:
  pgdata:
  miniodata:
```

## Persistir tus datos

Los registros apicolas son valiosos, asi que asegurate de que residan en volumenes que duren
mas que los contenedores.

- **Contenedor unico (`selfhost`):** todo esta bajo `/data`. El volumen con
  nombre `openbeehive-data` contiene tanto la base de datos SQLite como el
  directorio de blobs.
- **Perfil cloud:** los registros residen en el volumen `pgdata` (Postgres) y los archivos
  subidos en el volumen `miniodata` (MinIO). El propio contenedor del servidor es
  sin estado y puede reemplazarse libremente.

:::danger Haz copia de seguridad antes de actualizar
Los volumenes con nombre sobreviven a `docker compose up` y a las actualizaciones de imagen, pero no
sobreviven a `docker compose down -v` ni a un volumen eliminado. Haz una copia de seguridad antes de cualquier
actualizacion o comando destructivo. Consulta [Copias de seguridad](/self-hosting/backups).
:::

## Operaciones comunes

```bash
# Follow the server logs
docker compose logs -f server

# Update to a newer image and recreate
docker compose pull
docker compose up -d

# Stop everything (volumes are kept)
docker compose down
```

## Siguientes pasos

- Pon un proxy con terminacion TLS por delante: [Proxy inverso](/self-hosting/reverse-proxy).
- Ajusta las opciones de base de datos y almacenamiento: [Bases de datos](/self-hosting/databases) y
  [Almacenamiento](/self-hosting/storage).
- Revisa cada ajuste en un solo lugar: [Configuracion](/self-hosting/configuration).
