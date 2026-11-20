---
sidebar_position: 6
title: "Almacenamiento de blobs"
---

# Almacenamiento de blobs

Openbeehive almacena tus registros en una base de datos, pero las fotos y otros
adjuntos binarios residen por separado en el **almacenamiento de blobs**. Esto mantiene la
base de datos ligera y te permite escalar el almacenamiento de imágenes de forma independiente.

Eliges un backend con la variable de entorno `BEEHIVE_BLOB_BACKEND`. Hay dos
opciones: el **sistema de archivos** local y un almacén de objetos
**compatible con S3** como **MinIO**.

## Elegir un backend

| Backend | `BEEHIVE_BLOB_BACKEND` | Mejor para | Notas |
| --- | --- | --- | --- |
| Sistema de archivos | `fs` | Alojamiento propio en un solo servidor | El más simple; sin servicios adicionales que ejecutar |
| MinIO / S3 | `minio` | Cloud, multiservidor, flotas más grandes | Escalable, duradero, se puede descargar a otro lugar |

Una buena regla general: si ejecutas el perfil **selfhost** en una máquina, usa el
sistema de archivos. Si ejecutas el perfil **cloud** o esperas crecer, usa
almacenamiento de objetos.

:::note
El backend de blobs es independiente de tu driver de base de datos. Puedes emparejar SQLite
con MinIO, o PostgreSQL con el sistema de archivos, en cualquier combinación que se ajuste
a tu configuración.
:::

## Almacenamiento en el sistema de archivos

Este es el valor por defecto para el alojamiento propio. Las fotos se escriben en un directorio en disco.

```bash
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
```

`BEEHIVE_BLOB_DIR` es donde se almacenan los archivos. La ruta es relativa al directorio de
trabajo del proceso del servidor, así que para resultados predecibles en un servidor, usa una
ruta absoluta como `/var/lib/openbeehive/blobs`.

Los navegadores obtienen los archivos almacenados desde `<BEEHIVE_PUBLIC_BASE_URL>/files`. Si
un proxy inverso o una CDN sirve ese directorio desde otra dirección, establece
`BEEHIVE_BLOB_PUBLIC_URL` con la URL base que expone; el servidor la usa cuando entrega los
enlaces de archivos a la aplicación.

El servidor crea el directorio si no existe, pero asegúrate de que el proceso
sea su propietario y pueda escribir en él.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution Hazle copia de seguridad
El directorio de blobs **no** se almacena en tu base de datos. Una copia de seguridad de la base de datos por sí sola
no salvará tus fotos. Incluye `BEEHIVE_BLOB_DIR` en tu rutina de copia de seguridad. Consulta
[Copias de seguridad](./backups.md) para una estrategia completa.
:::

### Nota sobre Docker

Si ejecutas la [imagen de Docker](./docker.md), monta un volumen para que los blobs
sobrevivan a los reinicios y actualizaciones del contenedor. El contenedor se ejecuta como el uid `65532`;
un directorio del host montado con bind mount debe pertenecer a ese usuario:

```bash
docker run -d \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-blobs:/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Almacenamiento MinIO / S3

El almacenamiento de objetos es la opción adecuada para el perfil cloud y para cualquiera que
quiera un almacenamiento de fotos duradero y escalable que pueda residir en una máquina separada o un
servicio gestionado.

```bash
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=play.min.io
BEEHIVE_MINIO_ACCESS_KEY=your-access-key
BEEHIVE_MINIO_SECRET_KEY=your-secret-key
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=true
```

| Variable | Propósito |
| --- | --- |
| `BEEHIVE_MINIO_ENDPOINT` | Host (y puerto opcional) del almacén de objetos, sin esquema |
| `BEEHIVE_MINIO_ACCESS_KEY` | Clave de acceso / ID de clave |
| `BEEHIVE_MINIO_SECRET_KEY` | Clave secreta |
| `BEEHIVE_MINIO_BUCKET` | Bucket donde se almacenan los blobs |
| `BEEHIVE_MINIO_USE_SSL` | `true` para conectar a través de HTTPS, `false` para HTTP plano |

:::tip Formato del endpoint
Indica `BEEHIVE_MINIO_ENDPOINT` como un host, opcionalmente con un puerto, por ejemplo
`minio.example.com` o `minio.example.com:9000`. No incluyas `https://`.
Controla el esquema con `BEEHIVE_MINIO_USE_SSL` en su lugar.
:::

### El bucket

Al arrancar, el servidor comprueba si existe el bucket nombrado en `BEEHIVE_MINIO_BUCKET` y lo crea si no, así que con credenciales que puedan crear buckets no hay nada que preparar. Si tus credenciales están restringidas a un bucket existente, créalo primero, por ejemplo con el cliente de MinIO:

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

:::caution Mantén el bucket privado
Los blobs pueden contener fotos identificables de tus colmenares. No hagas el bucket
de lectura pública. Openbeehive sirve las imágenes a través de la API, así que el almacén
de objetos no necesita acceso público.
:::

## Compatibilidad con S3

El backend de MinIO habla la API estándar de S3, por lo que funciona con cualquier
proveedor compatible con S3, no solo MinIO. Eso incluye:

- **MinIO** (almacenamiento de objetos autoalojado)
- **Amazon S3**
- Otros servicios compatibles con S3 (por ejemplo el endpoint S3 de Backblaze B2,
  Cloudflare R2, Wasabi o Ceph RADOS Gateway)

Para estos, apunta `BEEHIVE_MINIO_ENDPOINT` al endpoint S3 del proveedor, establece las claves de acceso
y secreta, elige tu bucket y establece `BEEHIVE_MINIO_USE_SSL=true`.

| Proveedor | Endpoint de ejemplo |
| --- | --- |
| Amazon S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2 | `s3.<region>.backblazeb2.com` |
| MinIO (alojamiento propio) | `minio.example.com:9000` |

:::note Regiones y direccionamiento
Algunos proveedores son sensibles a los ajustes de región o requieren direccionamiento
de estilo de ruta frente al alojado virtualmente. Si las subidas fallan con un proveedor distinto de MinIO,
verifica el endpoint y que el bucket exista en la región esperada.
Consulta [Resolución de problemas](../knowledge-base/troubleshooting.md) si los problemas persisten.
:::

## Cambiar de backend más adelante

Si empiezas en el sistema de archivos y más tarde pasas al almacenamiento de objetos, las fotos
existentes no se migran automáticamente. Planea copiar el contenido de `BEEHIVE_BLOB_DIR` a tu
bucket (por ejemplo con `mc cp --recursive` o `aws s3 sync`) antes de cambiar
`BEEHIVE_BLOB_BACKEND`, para que las fotos de inspecciones antiguas sigan disponibles.
