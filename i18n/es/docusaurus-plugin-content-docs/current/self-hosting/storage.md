---
sidebar_position: 6
title: "Almacenamiento de blobs"
---

# Almacenamiento de blobs

Openbeehive almacena tus registros en una base de datos, pero las imágenes a tamaño completo de las fotos residen por separado en el **almacenamiento de blobs**. Esto mantiene la base de datos ligera y te permite escalar el almacenamiento de imágenes de forma independiente.

Una foto tiene dos partes. Su registro, con una miniatura pequeña de unos 200 píxeles, se guarda en la base de datos y se sincroniza con todos los dispositivos como cualquier otro registro. Su imagen a tamaño completo (como máximo 2048 píxeles en el lado más largo y 5 MiB) se guarda en el almacenamiento de blobs bajo un prefijo por espacio (`<workspace>/photos/...`). El servidor la sirve solo a los miembros de ese espacio con la sesión iniciada, a través de `/photos/<id>`; el almacén de blobs en sí nunca se expone. Eliminar una foto elimina su imagen, y eliminar un espacio elimina todo lo que hay bajo su prefijo.

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

El servidor no sirve este directorio por sí mismo, y nada más debería hacerlo: las imágenes llegan a la aplicación solo a través del endpoint autenticado `/photos/`. Hasta 0.4.x el servidor publicaba el directorio bajo `/files/` y leía `BEEHIVE_BLOB_PUBLIC_URL`; ambas cosas han desaparecido (el servidor avisa al arrancar si el ajuste sigue presente).

El servidor crea el directorio si no existe, pero asegúrate de que el proceso
sea su propietario y pueda escribir en él.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution[Hazle copia de seguridad]
El directorio de blobs **no** se almacena en tu base de datos. Una copia de seguridad de la base de datos por sí sola
no salvará tus fotos. Una copia de seguridad es la base de datos más `BEEHIVE_BLOB_DIR`, y ambas se restauran juntas. Consulta
[Copias de seguridad](./backups.md).
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

:::tip[Formato del endpoint]
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

:::caution[Mantén el bucket privado]
Los blobs pueden contener fotos identificables de tus colmenares. No hagas el bucket
de lectura pública. Openbeehive sirve las imágenes solo a los miembros del espacio con la
sesión iniciada, así que el almacén de objetos no necesita acceso público.
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

:::note[Regiones y direccionamiento]
Algunos proveedores son sensibles a los ajustes de región o requieren direccionamiento
de estilo de ruta frente al alojado virtualmente. Si las subidas fallan con un proveedor distinto de MinIO,
verifica el endpoint y que el bucket exista en la región esperada.
Consulta [Resolución de problemas](../knowledge-base/troubleshooting.md) si los problemas persisten.
:::

## Mantenimiento \{#upkeep}

El servidor ordena el almacenamiento de blobs por sí mismo; no hay nada que programar:

- La imagen de una foto eliminada se borra poco después de la eliminación.
- Las fotos de una visita o colmena eliminada hace más de una hora también se eliminan.
- Al arrancar y cada seis horas se borran las imágenes a las que no apunta ningún registro de foto y que tienen más de una hora (por ejemplo, una subida cuyo registro nunca llegó, o las imágenes de un espacio eliminado).

Esto supone una única instancia del servidor: ejecuta exactamente una por base de datos.

## Fotos de 0.4.x \{#inline-photos}

Hasta 0.4.x la aplicación guardaba las fotos en línea en la base de datos, como data URLs en las filas de visitas y colmenas. En el primer arranque de 0.5.0, el servidor convierte cada foto en línea visible en un registro de foto con su imagen en el almacenamiento de blobs, antes de aceptar solicitudes. En una base de datos con muchas fotos esto puede tardar unos minutos. Una conversión interrumpida continúa en el siguiente arranque.

Las aplicaciones 0.4.x instaladas siguen funcionando: el servidor sigue aceptando y sirviendo fotos en línea para ellas y convierte lo que suben. No ven las fotos añadidas desde dispositivos actualizados.

## Cambiar de backend más adelante

Si empiezas en el sistema de archivos y más tarde pasas al almacenamiento de objetos, las fotos
existentes no se migran automáticamente. Planea copiar el contenido de `BEEHIVE_BLOB_DIR` a tu
bucket (por ejemplo con `mc cp --recursive` o `aws s3 sync`) antes de cambiar
`BEEHIVE_BLOB_BACKEND`, para que las fotos de inspecciones antiguas sigan disponibles.
