---
sidebar_position: 2
title: "Binario unico"
---

# Binario unico

La forma mas sencilla de ejecutar Openbeehive en tu propia maquina es el **binario unico**. En el perfil `selfhost`, Openbeehive sirve la aplicacion web y la API desde un unico proceso, almacena sus datos en un archivo SQLite local y guarda las fotos subidas en el sistema de archivos. Sin Docker, sin Postgres, sin almacen de objetos: solo un ejecutable.

Esta pagina te guia a traves de la compilacion de ese binario desde el codigo fuente y su ejecucion como un servicio de larga duracion.

:::tip ¿Tienes prisa?
Si prefieres descargar una imagen de contenedor precompilada, consulta [Docker](/self-hosting/docker). Para comparar primero ambos enfoques, empieza por la [vision general del alojamiento propio](/category/self-hosting).
:::

## Requisitos previos

Necesitaras unas pocas herramientas de compilacion instaladas en la maquina que compile el binario:

| Herramienta | Version | Proposito |
| --- | --- | --- |
| Go | 1.25+ | Compila el servidor |
| Node.js | 24+ | Construye la aplicacion web SvelteKit |
| buf | mas reciente | Genera el codigo Connect-RPC a partir de las definiciones protobuf |

Una vez compilado, el propio binario no tiene dependencias en tiempo de ejecucion: puedes copiarlo a un servidor que no tenga ninguna de las anteriores instaladas.

## Obtener el codigo

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app
```

## Configurar

Copia el archivo de entorno de ejemplo y elige el perfil de alojamiento propio:

```bash
cp .env.example .env
```

Para una instancia privada de un solo usuario, los valores por defecto estan casi listos. Abre `.env` y confirma estos valores:

```bash
BEEHIVE_DEPLOYMENT_PROFILE=selfhost
BEEHIVE_ADDR=:8080
BEEHIVE_PUBLIC_BASE_URL=http://localhost:8080
BEEHIVE_SERVE_WEB=true
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
BEEHIVE_SESSION_SECRET=
```

Genera un secreto de sesion: nunca lo dejes en blanco salvo en una prueba desechable:

```bash
openssl rand -base64 32
```

Pega el resultado en `BEEHIVE_SESSION_SECRET=`.

:::note Sin inicio de sesion por defecto
El perfil selfhost no habilita ningún método de inicio de sesión: `BEEHIVE_PASSWORD_AUTH` está desactivado, `BEEHIVE_OIDC_PROVIDERS` está vacío y `BEEHIVE_WEBAUTHN_ENABLED=false`. Déjalos así para ejecutar como un solo usuario sin paso de inicio de sesión. Cuando quieras cuentas, passkeys o un proveedor, consulta [Autenticación](/self-hosting/authentication).
:::

Si tienes la intencion de acceder a la instancia desde otro dispositivo de tu red, configura `BEEHIVE_PUBLIC_BASE_URL` con una direccion que ese dispositivo pueda resolver realmente (por ejemplo `http://192.168.1.20:8080` o tu dominio detras de un [proxy inverso](/self-hosting/reverse-proxy)). Las etiquetas QR codifican la dirección en la que abres la aplicación, así que usa siempre esa misma dirección.

## Compilar

Genera el codigo protobuf y luego compila:

```bash
make proto
make build
```

Esto produce un unico ejecutable:

```text
./server/bin/openbeehive
```

La aplicacion web esta integrada en el binario, por lo que no hay nada mas que desplegar junto a el.

## Ejecutar

Desde la raiz del repositorio (para que las rutas relativas de `.env` se resuelvan como se espera):

```bash
./server/bin/openbeehive
```

En el primer arranque, el servidor:

- crea el archivo de base de datos SQLite `openbeehive.db` y ejecuta sus migraciones,
- crea el directorio `./data/` (con `./data/blobs` para las fotos),
- sirve la aplicacion web y la API Connect-RPC en `:8080`.

Abre `http://localhost:8080` en tu navegador. La aplicacion se carga, construye su base de datos local en el navegador y ya estaras listo para anadir tu primer colmenar.

:::tip El directorio de trabajo importa
Las rutas relativas como `file:openbeehive.db` y `./data/blobs` se resuelven respecto al directorio desde el que se lanza el binario, no donde reside el binario. Elige el directorio de trabajo de forma deliberada: la unidad systemd de mas abajo lo establece explicitamente con `WorkingDirectory`.
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
EnvironmentFile=/opt/openbeehive/.env
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

Habilitalo e inicialo:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now openbeehive
```

Comprueba que esta sano y observa los registros:

```bash
systemctl status openbeehive
journalctl -u openbeehive -f
```

:::caution Enlazar al puerto 80 o 443
El ejemplo se enlaza a `:8080`, que un usuario sin privilegios puede usar. No ejecutes el servicio como root para acceder a los puertos 80/443; en su lugar, manten Openbeehive en `:8080` y pon un [proxy inverso](/self-hosting/reverse-proxy) (como Caddy o nginx) por delante para gestionar el TLS y el puerto publico.
:::

## Donde residen tus datos

En el perfil `selfhost`, todo se almacena bajo el directorio de trabajo que elegiste (arriba, `/opt/openbeehive`):

| Que | Ubicacion por defecto | Establecido por |
| --- | --- | --- |
| Base de datos de registros | `openbeehive.db` (mas los archivos `-wal` / `-shm`) | `BEEHIVE_DATABASE_DSN` |
| Fotos y adjuntos | `./data/blobs` | `BEEHIVE_BLOB_DIR` |

Los archivos `-wal` y `-shm` junto a la base de datos son el registro de escritura anticipada (write-ahead log) de SQLite; tratalos como parte de la base de datos.

## Mover o respaldar tus datos

Como todo el estado son archivos en un unico directorio, reubicar una instancia es en su mayoria una tarea de copiado:

1. Detén el servicio para que la base de datos quede en reposo: `sudo systemctl stop openbeehive`.
2. Copia el binario, `.env`, los archivos de base de datos y el directorio `data/` a la nueva maquina, conservando la disposicion.
3. Inicia el servicio en el nuevo host: `sudo systemctl start openbeehive`.

:::danger Detén siempre el servicio primero
Copiar `openbeehive.db` mientras el servidor esta en ejecucion puede capturar una instantanea rota e inconsistente. Detén el servicio (o usa un procedimiento de copia de seguridad adecuado) antes de copiar los archivos de base de datos.
:::

Para copias de seguridad programadas, retencion y tecnicas seguras de copia en caliente para SQLite, consulta [Copias de seguridad](/self-hosting/backups).

## Actualizar

Para pasar a una version mas reciente, descarga el codigo mas reciente, recompila y reemplaza el binario: tu base de datos y el directorio `data/` permanecen donde estan y las migraciones se ejecutan en el siguiente arranque. El procedimiento completo, incluyendo como revertir, se cubre en [Actualizacion](/self-hosting/upgrading).
