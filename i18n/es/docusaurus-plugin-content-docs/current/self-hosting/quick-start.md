---
sidebar_position: 1
title: "Inicio rápido"
---

# Inicio rápido

Dos rutas para tener una instancia de Openbeehive en funcionamiento que puedas abrir en un navegador:

- **Opción A, binario único.** Compila un único ejecutable autocontenido que usa SQLite y el sistema de archivos local. Sin Docker, sin servidor de base de datos, sin almacenamiento de objetos. Adecuado para un servidor doméstico, una Raspberry Pi o un pequeño VPS.
- **Opción B, Docker.** Ejecuta la imagen publicada con un solo comando.

Ambas usan el perfil de despliegue **selfhost**, que utiliza por defecto una base de datos SQLite embebida y almacenamiento de blobs en el sistema de archivos. Más adelante puedes cambiar a PostgreSQL y MinIO/S3; consulta [Configuración](/self-hosting/configuration).

:::tip ¿Un solo usuario? No hace falta inicio de sesión
En el perfil selfhost no hay ningún método de inicio de sesión habilitado por defecto: `BEEHIVE_PASSWORD_AUTH` está desactivado, `BEEHIVE_OIDC_PROVIDERS` está vacío y `BEEHIVE_WEBAUTHN_ENABLED=false`. La aplicación se abre directamente en tus registros. Para añadir el inicio de sesión más tarde, consulta [Autenticación](/self-hosting/authentication).
:::

## La configuración mínima funcional

Sea cual sea la ruta que elijas, dos ajustes importan para empezar:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` es la dirección que el servidor pone en los enlaces que genera (redirecciones OIDC, enlaces de invitación y verificación). Para pruebas locales, `http://localhost:8080` está bien. Para un despliegue real, configúrala con tu URL pública, por ejemplo `https://bees.example.com`.

Todo lo demás tiene valores por defecto para el autoalojamiento. La lista completa está en [Configuración](/self-hosting/configuration).

## Opción A: binario único (sin Docker)

### Requisitos previos

- Go 1.25 o más reciente
- Node 24 o más reciente
- [buf](https://buf.build/docs/installation)

### Compilar y ejecutar

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Por defecto, el binario escucha en `:8080` y sirve la propia aplicación web (`BEEHIVE_SERVE_WEB=true`), de modo que la API y la PWA provienen del mismo origen. Abre la dirección indicada en `BEEHIVE_PUBLIC_BASE_URL`.

:::note Dónde residen tus datos
En modo selfhost, tus registros van a un archivo SQLite (`openbeehive.db` en el directorio de trabajo por defecto) y las fotos subidas a un directorio de blobs (`./data/blobs` por defecto). Haz copia de seguridad de ambos y habrás respaldado todo; consulta [Copias de seguridad](/self-hosting/backups).
:::

## Opción B: Docker

La imagen publicada es `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -e 'BEEHIVE_DATABASE_DSN=file:/data/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)' \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

Las líneas `BEEHIVE_DATABASE_DSN` y `BEEHIVE_BLOB_DIR` son las que ponen tus datos en el volumen. Sin ellas, el contenedor usa sus valores por defecto, `openbeehive.db` y `./data/blobs` relativos al directorio raíz del contenedor, que quedan fuera del volumen y desaparecen tras `docker rm`. Con ellas, el volumen `openbeehive-data` contiene la base de datos y los blobs, y sobreviven a reinicios y actualizaciones. Una vez en marcha, abre `http://localhost:8080`.

Para detener o eliminar el contenedor (el volumen se conserva):

```bash
docker stop openbeehive
docker rm openbeehive
```

Si activas el inicio de sesión con correo y contraseña (`BEEHIVE_PASSWORD_AUTH=true`), el servidor se niega a arrancar hasta que también estén definidos `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD`. Consulta [Autenticación](/self-hosting/authentication).

:::tip ¿Prefieres la pila cloud?
El comando anterior ejecuta el perfil ligero selfhost. Para el perfil **cloud** (PostgreSQL + MinIO) el repositorio incluye archivos Compose; consulta [Docker](/self-hosting/docker).
:::

## Primeros pasos después de la instalación

1. Abre la aplicación en tu `BEEHIVE_PUBLIC_BASE_URL` y crea tu primer colmenar.
2. Añade una colmena, edítala para definir su tipo y registra una visita.
3. Imprime una etiqueta QR para la colmena para poder escanearla directamente sobre el terreno.

Antes de exponer la instancia a internet, pon delante un [proxy inverso](/self-hosting/reverse-proxy) que termine el TLS y configura `BEEHIVE_PUBLIC_BASE_URL` con la dirección `https://`. Después configura las [copias de seguridad](/self-hosting/backups).
