---
sidebar_position: 1
title: "Inicio rápido"
---

# Inicio rápido

Dos rutas para tener una instancia de Openbeehive en funcionamiento que puedas abrir en un navegador:

- **Opción A, Docker.** Ejecuta la imagen publicada con un solo comando.
- **Opción B, binario único.** Compila un único ejecutable autocontenido. Sin Docker, sin servidor de base de datos, sin almacenamiento de objetos. Adecuado para un servidor doméstico, una Raspberry Pi o un pequeño VPS.

Ambas usan el perfil de despliegue **selfhost**: una base de datos SQLite embebida y archivos en el disco local. Para varios usuarios con PostgreSQL y MinIO/S3, consulta [Docker y Compose](./docker.md#several-users).

:::caution Sin inicio de sesión de fábrica
En el perfil selfhost no hay ningún método de inicio de sesión habilitado por defecto, así que la aplicación se abre directamente en tus registros y **quien pueda alcanzar el puerto tiene acceso completo**. En tu propio ordenador eso no supone un problema. Por ese motivo los ejemplos publican el puerto solo en `127.0.0.1`, y un servidor sin inicio de sesión solo responde a `localhost`, a direcciones IP y al host de `BEEHIVE_PUBLIC_BASE_URL`. Antes de abrirlo a otros dispositivos o personas, [activa el inicio de sesión](#turn-login-on).
:::

## Opción A: Docker

```bash
docker run -d --name openbeehive \
  -p 127.0.0.1:8080:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Abre `http://localhost:8080`. El directorio de trabajo del contenedor es `/data`, así que la base de datos (`openbeehive.db`) y los archivos subidos (`data/blobs`) van a parar al volumen `openbeehive-data` y sobreviven a reinicios y actualizaciones.

El repositorio incluye la misma configuración como archivo Compose, [`docker-compose.selfhost.yml`](https://github.com/openbeehive-org/openbeehive-app/blob/main/docker-compose.selfhost.yml), que lee sus ajustes de un archivo `.env` situado junto a él:

```bash
docker compose -f docker-compose.selfhost.yml up -d
```

Para detener o eliminar el contenedor (el volumen se conserva):

```bash
docker stop openbeehive
docker rm openbeehive
```

## Opción B: binario único (sin Docker)

### Requisitos previos

- Go 1.27 o más reciente
- Node 24 o más reciente (la imagen publicada se compila con Node 26)
- [buf](https://buf.build/docs/installation) (`make tools` instala la versión fijada)

### Compilar y ejecutar

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure (optional): the defaults already are the selfhost profile
cp .env.example .env

# Run
./server/bin/openbeehive
```

El binario lee `.env` del directorio en el que se inicia; las variables que ya están definidas en el entorno prevalecen. Por defecto escucha en `:8080` y sirve la propia aplicación web (`BEEHIVE_SERVE_WEB=true`), de modo que la API y la PWA provienen del mismo origen. Abre `http://localhost:8080`.

Las primeras líneas del registro del servidor indican cómo está configurado, incluido quién puede usarlo:

```text
config: applied .env from the working directory (existing environment variables win)
Openbeehive · profile=selfhost · DB=sqlite · Blob=fs
auth: NO LOGIN (single-user mode): every request has full access to all data
auth: accepting requests for hosts: localhost, IP addresses (add names with BEEHIVE_ALLOWED_HOSTS)
```

:::note Dónde residen tus datos
En modo selfhost, tus registros van a un archivo SQLite (`openbeehive.db` en el directorio de trabajo por defecto) y los archivos subidos a un directorio de blobs (`./data/blobs` por defecto). Haz copia de seguridad de ambos y habrás respaldado todo; consulta [Copias de seguridad](./backups.md).
:::

## Activar el inicio de sesión \{#turn-login-on}

Para acceder a la instancia desde otros dispositivos o compartirla con otras personas, exige el inicio de sesión. Pon estos ajustes en `.env` (junto al binario o junto a `docker-compose.selfhost.yml`), o pásalos con `-e` a `docker run`:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://bees.example.org   # the address people open
BEEHIVE_PASSWORD_AUTH=true
BEEHIVE_ADMIN_EMAIL=you@example.org
BEEHIVE_ADMIN_PASSWORD=change-me-please            # 8+ characters
BEEHIVE_SESSION_SECRET=...                         # openssl rand -base64 32
BEEHIVE_BIND=0.0.0.0                               # Compose file only: publish on the network
```

- `BEEHIVE_PUBLIC_BASE_URL` es la dirección que el servidor pone en los enlaces que genera (redirecciones OIDC, enlaces de invitación y verificación).
- `BEEHIVE_SESSION_SECRET` debe tener al menos 32 bytes. Con cualquier método de inicio de sesión, el servidor se niega a arrancar sin él.
- `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD` definen el administrador de la instancia; con el inicio de sesión con correo y contraseña, el servidor se niega a arrancar sin ellos.

Los registros creados antes de activar el inicio de sesión pasan al espacio del administrador en el siguiente arranque; inicia sesión como administrador para verlos. Los detalles y los demás métodos de inicio de sesión están en [Autenticación](./authentication.md).

## Primeros pasos después de la instalación

1. Abre la aplicación y crea tu primer colmenar.
2. Añade una colmena, edítala para definir su tipo y registra una visita.
3. Imprime una etiqueta QR para la colmena para poder escanearla directamente sobre el terreno.

Antes de exponer la instancia a internet, pon delante un [proxy inverso](./reverse-proxy.md) que termine el TLS, configura `BEEHIVE_PUBLIC_BASE_URL` con la dirección `https://` y establece `BEEHIVE_TRUST_PROXY_HEADERS=true`. Después configura las [copias de seguridad](./backups.md). Ejecuta exactamente una instancia del servidor por base de datos.
