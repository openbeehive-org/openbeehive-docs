---
sidebar_position: 1
title: "Inicio rapido"
---

# Inicio rapido

Este es el camino mas rapido desde cero hasta tener una instancia de Openbeehive en funcionamiento que puedas abrir en un navegador. Elige una de las dos rutas:

- **Opcion A — Binario unico.** Compila un unico binario autocontenido que usa SQLite y el sistema de archivos local. Sin Docker, sin servidor de base de datos, sin almacenamiento de objetos. Ideal para un servidor domestico, una Raspberry Pi o un pequeno VPS.
- **Opcion B — Docker.** Descarga nuestra imagen publicada y ejecutala con un solo comando.

Ambas rutas usan el perfil de despliegue **selfhost**, que utiliza por defecto una base de datos SQLite embebida y almacenamiento de blobs en el sistema de archivos. Mas adelante puedes cambiar a PostgreSQL y MinIO/S3 — consulta [Configuracion](/self-hosting/configuration).

:::tip ¿Un solo usuario? No hace falta inicio de sesion
Si eres la unica persona que usa tu instancia, puedes ejecutarla **sin autenticacion alguna**. Simplemente deja `BEEHIVE_OIDC_PROVIDERS` vacio y manten `BEEHIVE_WEBAUTHN_ENABLED=false` (ambos son los valores por defecto). La aplicacion se abre directamente en tus registros. Para anadir el inicio de sesion mas tarde, consulta [Autenticacion](/self-hosting/authentication).
:::

## La configuracion minima funcional

Sea cual sea la ruta que elijas, solo dos ajustes importan realmente para empezar:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
```

`BEEHIVE_PUBLIC_BASE_URL` es la direccion que la gente (y los enlaces directos de los codigos QR) usan para acceder a la aplicacion. Para pruebas locales, `http://localhost:8080` esta bien. Para un despliegue real, configuralo con tu URL publica, por ejemplo `https://bees.example.com`.

Todo lo demas tiene valores por defecto sensatos para el alojamiento propio. La lista completa esta en [Configuracion](/self-hosting/configuration).

## Opcion A — Binario unico (sin Docker)

### Requisitos previos

- Go 1.25 o mas reciente
- Node 22 o mas reciente
- [buf](https://buf.build/docs/installation)

### Compilar y ejecutar

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate the Connect-RPC code, then build the server
make proto
make build

# Configure
cp .env.example .env
# Edit .env: set BEEHIVE_DEPLOYMENT_PROFILE=selfhost and BEEHIVE_PUBLIC_BASE_URL

# Run
./server/bin/openbeehive
```

Por defecto, el binario escucha en `:8080` y sirve la propia aplicacion web (`BEEHIVE_SERVE_WEB=true`), de modo que la API y la PWA provienen del mismo origen. Abre la direccion indicada en `BEEHIVE_PUBLIC_BASE_URL` y ya estaras dentro.

:::note Donde residen tus datos
En modo selfhost, tus registros van a un archivo SQLite local y las fotos subidas a un directorio de blobs (`./data/blobs` por defecto). Haz copia de seguridad de estos y habras respaldado todo — consulta [Copias de seguridad](/self-hosting/backups).
:::

## Opcion B — Docker

Si tienes Docker instalado, esta es la ruta mas rapida de todas. La imagen publicada es `ghcr.io/openbeehive-org/openbeehive-app:latest`.

```bash
docker run -d \
  --name openbeehive \
  -p 8080:8080 \
  -e BEEHIVE_DEPLOYMENT_PROFILE=selfhost \
  -e BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080 \
  -v openbeehive-data:/data \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

El volumen `-v openbeehive-data:/data` mantiene tu base de datos SQLite y tus blobs fuera del contenedor, de modo que sobreviven a las actualizaciones y reinicios. Una vez en marcha, abre `http://localhost:8080`.

Para detenerlo o eliminarlo:

```bash
docker stop openbeehive
docker rm openbeehive
```

:::tip ¿Prefieres la pila cloud?
Los comandos anteriores ejecutan el perfil ligero selfhost. Si quieres el perfil completo **cloud** (PostgreSQL + MinIO), el repositorio incluye un archivo Compose — ejecuta `docker compose up -d`. Consulta [Docker](/self-hosting/docker) para los detalles.
:::

## Primeros pasos despues de la instalacion

Ya tienes una instancia en funcionamiento. A partir de aqui:

1. Abre la aplicacion en tu `BEEHIVE_PUBLIC_BASE_URL` y crea tu primer colmenar.
2. Anade una colmena, elige su tipo y registra una inspeccion.
3. Opcionalmente, imprime una etiqueta QR para la colmena para poder escanearla directamente sobre el terreno.

Para un recorrido por la propia aplicacion, dirigete a [Uso de la aplicacion](/category/using-the-app). Para preparar tu instancia para produccion — HTTPS, un dominio real, autenticacion y copias de seguridad — continua con:

- [Configuracion](/self-hosting/configuration) — cada variable de entorno explicada
- [Proxy inverso](/self-hosting/reverse-proxy) — pon TLS y un dominio por delante
- [Autenticacion](/self-hosting/authentication) — anade inicio de sesion OIDC o claves de acceso
- [Copias de seguridad](/self-hosting/backups) — protege tus registros

:::caution Usa HTTPS en produccion
`http://localhost` solo es adecuado para pruebas locales. Exponer la aplicacion en internet sin TLS pone en riesgo tus datos y rompe funciones que requieren un contexto seguro. Configura `BEEHIVE_PUBLIC_BASE_URL` con una direccion `https://` y termina el TLS en un proxy inverso antes de ponerla en produccion.
:::
