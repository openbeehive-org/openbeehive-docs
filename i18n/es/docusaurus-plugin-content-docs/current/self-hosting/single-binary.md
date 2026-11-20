---
sidebar_position: 2
title: "Binario único"
---

# Binario único

La forma más sencilla de ejecutar Openbeehive en tu propia máquina es el **binario único**. En el perfil `selfhost`, Openbeehive sirve la aplicación web y la API desde un único proceso, almacena sus datos en un archivo SQLite local y guarda las fotos subidas en el sistema de archivos. Sin Docker, sin Postgres, sin almacén de objetos: solo un ejecutable.

Esta página te guía a través de la compilación de ese binario desde el código fuente y su ejecución como un servicio de larga duración.

:::tip[¿Tienes prisa?]
Si prefieres descargar una imagen de contenedor precompilada, consulta [Docker](./docker.md). Para comparar primero ambos enfoques, empieza por la [visión general del alojamiento propio](/category/self-hosting).
:::

## Requisitos previos

Necesitarás unas pocas herramientas de compilación instaladas en la máquina que compile el binario:

| Herramienta | Versión | Propósito |
| --- | --- | --- |
| Go | 1.27+ | Compila el servidor |
| Node.js | 24+ | Construye la aplicación web SvelteKit |
| buf | fijada por `make tools` | Genera el código Connect-RPC a partir de las definiciones protobuf |

Una vez compilado, el propio binario no tiene dependencias en tiempo de ejecución: puedes copiarlo a un servidor que no tenga ninguna de las anteriores instaladas.

## Obtener el código

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Configurar

El servidor se configura mediante variables de entorno y lee un archivo `.env` del directorio en el que se inicia. Las variables que ya están definidas en el entorno prevalecen sobre el archivo. Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Para una instancia privada de un solo usuario, los valores por defecto integrados ya están listos; estos son los que importan:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
# Defaults of the selfhost profile:
# BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
# BEEHIVE_BLOB_DIR=./data/blobs
```

:::note[Sin inicio de sesión por defecto]
El perfil selfhost no habilita ningún método de inicio de sesión: `BEEHIVE_PASSWORD_AUTH` está desactivado, `BEEHIVE_OIDC_PROVIDERS` está vacío y `BEEHIVE_WEBAUTHN_ENABLED=false`. Cualquiera que pueda alcanzar el puerto tiene entonces acceso completo, y el servidor solo responde a `localhost`, a direcciones IP y al host de `BEEHIVE_PUBLIC_BASE_URL` (añade más nombres con `BEEHIVE_ALLOWED_HOSTS`). Cuando quieras cuentas, passkeys o un proveedor, consulta [Autenticación](./authentication.md); cualquier método de inicio de sesión necesita un `BEEHIVE_SESSION_SECRET` de al menos 32 bytes (`openssl rand -base64 32`).
:::

Si tienes la intención de acceder a la instancia desde otro dispositivo de tu red, configura `BEEHIVE_PUBLIC_BASE_URL` con la dirección que abre ese dispositivo (por ejemplo `http://192.168.1.20:8080` o tu dominio detrás de un [proxy inverso](./reverse-proxy.md)) y activa el inicio de sesión. Las etiquetas QR codifican la dirección en la que abres la aplicación, así que usa siempre esa misma dirección.

## Compilar

Genera el código protobuf y luego compila:

```bash
make proto
make build
```

Esto produce un único ejecutable:

```text
./server/bin/openbeehive
```

La aplicación web está integrada en el binario, por lo que no hay nada más que desplegar junto a él.

## Ejecutar

Desde la raíz del repositorio, donde está `.env`:

```bash
./server/bin/openbeehive
```

En el primer arranque, el servidor:

- aplica `.env` y anota en el registro el perfil, la base de datos y si se requiere inicio de sesión,
- crea el archivo de base de datos SQLite `openbeehive.db` y ejecuta sus migraciones,
- crea el directorio `./data/` (con `./data/blobs` para las fotos),
- sirve la aplicación web y la API Connect-RPC en `:8080`.

Abre `http://localhost:8080` en tu navegador. La aplicación se carga, construye su base de datos local en el navegador y ya estarás listo para añadir tu primer colmenar.

:::tip[El directorio de trabajo importa]
Las rutas relativas como `file:openbeehive.db` y `./data/blobs` se resuelven respecto al directorio desde el que se lanza el binario, no donde reside el binario, y `.env` se lee de ese mismo directorio. Elige el directorio de trabajo de forma deliberada: la unidad systemd de más abajo lo establece explícitamente con `WorkingDirectory`.
:::

## Ejecutar como servicio systemd

Para una instancia siempre activa, ejecuta Openbeehive bajo systemd para que arranque al iniciar el sistema y se reinicie en caso de fallo.

Primero, coloca el binario y un directorio de trabajo en un lugar adecuado y crea un usuario dedicado:

```bash
sudo useradd --system --home /opt/openbeehive --shell /usr/sbin/nologin openbeehive
sudo mkdir -p /opt/openbeehive
sudo cp server/bin/openbeehive /opt/openbeehive/
sudo cp .env /opt/openbeehive/
sudo chown -R openbeehive:openbeehive /opt/openbeehive
```

Luego crea el archivo de unidad en `/etc/systemd/system/openbeehive.service`:

```text
[Unit]
Description=Openbeehive beekeeping records
After=network.target

[Service]
Type=simple
User=openbeehive
Group=openbeehive
WorkingDirectory=/opt/openbeehive
ExecStart=/opt/openbeehive/openbeehive
Restart=on-failure
RestartSec=5

# Hardening
NoNewPrivileges=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/openbeehive
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

La unidad no necesita `EnvironmentFile`: el propio servidor lee `/opt/openbeehive/.env` porque ese es su directorio de trabajo. Haz que el archivo solo pueda leerlo el usuario `openbeehive` (`chmod 600`), ya que contiene el secreto de sesión y la contraseña del administrador.

Habilítalo e inícialo:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Comprueba que está sano y observa los registros:

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution[Enlazar al puerto 80 o 443]
El ejemplo se enlaza a `:8080`, que un usuario sin privilegios puede usar. No ejecutes el servicio como root para acceder a los puertos 80/443; en su lugar, mantén Openbeehive en `:8080` y pon un [proxy inverso](./reverse-proxy.md) (como Caddy o nginx) por delante para gestionar el TLS y el puerto público.
:::

## Dónde residen tus datos

En el perfil `selfhost`, todo se almacena bajo el directorio de trabajo que elegiste (arriba, `/opt/openbeehive`):

| Qué | Ubicación por defecto | Establecido por |
| --- | --- | --- |
| Base de datos de registros | `openbeehive.db` (más los archivos `-wal` / `-shm`) | `BEEHIVE_DATABASE_DSN` |
| Fotos y adjuntos | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

Los archivos `-wal` y `-shm` junto a la base de datos son el registro de escritura anticipada (write-ahead log) de SQLite; trátalos como parte de la base de datos.

## Mover o respaldar tus datos

Como todo el estado son archivos en un único directorio, reubicar una instancia es en su mayoría una tarea de copiado:

1. Detén el servicio para que la base de datos quede en reposo: `sudo systemctl stop openbeehive`.
2. Copia el binario, `.env`, los archivos de base de datos y el directorio `data/` a la nueva máquina, conservando la disposición.
3. Inicia el servicio en el nuevo host: `sudo systemctl start openbeehive`.

:::danger[Detén siempre el servicio primero]
Copiar `openbeehive.db` mientras el servidor está en ejecución puede capturar una instantánea rota e inconsistente. Detén el servicio (o usa un procedimiento de copia de seguridad adecuado) antes de copiar los archivos de base de datos.
:::

Para copias de seguridad programadas, retención y técnicas seguras de copia en caliente para SQLite, consulta [Copias de seguridad](./backups.md).

## Actualizar

Para pasar a una versión más reciente, descarga el código más reciente, recompila y reemplaza el binario: tu base de datos y el directorio `data/` permanecen donde están y las migraciones se ejecutan en el siguiente arranque. El procedimiento completo, incluyendo cómo revertir, se cubre en [Actualización](./upgrading.md).
