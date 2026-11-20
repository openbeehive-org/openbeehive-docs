---
sidebar_position: 9
title: "Copias de seguridad y restauración"
---

# Copias de seguridad y restauración

Unos pocos minutos dedicados ahora a configurar las copias de seguridad te ahorrarán muchas preocupaciones más adelante. Esta página cubre qué respaldar, cómo hacerlo de forma segura y cómo restaurar cuando lo necesites.

:::tip[El servidor es la fuente de verdad]
Cada dispositivo que usa tu instancia mantiene una copia local de sus datos en el navegador. Esa copia es una comodidad, no una copia de seguridad: puede borrarse al limpiar los datos del sitio, reinstalar o perder el dispositivo.

Para todo lo que se comparte entre personas o dispositivos, el **servidor** es la copia autorizada. Haz copia de seguridad del servidor y protegerás los registros de todos a la vez.
:::

## Qué respaldar

Hay dos cosas en el servidor que vale la pena proteger:

| Elemento | Dónde reside | Objetivo de la copia de seguridad |
| --- | --- | --- |
| La base de datos | Archivo SQLite, o PostgreSQL/MariaDB | Una copia consistente o un volcado |
| Blobs (imágenes de fotos a tamaño completo) | Sistema de archivos local, o MinIO/S3 | El directorio de blobs o el bucket |

Qué base de datos y almacén de blobs tengas depende de tu perfil de despliegue:

- **`selfhost`** usa un único archivo SQLite y un directorio de blobs local (`BEEHIVE_BLOB_DIR`, por defecto `./data/blobs`).
- **`cloud`** usa Postgres y un bucket MinIO/S3.

Haz copia de seguridad de **ambos**, la base de datos y los blobs. La base de datos contiene tus colmenares, colmenas, reinas, inspecciones, eventos y los registros de fotos con sus miniaturas; el almacén de blobs contiene las imágenes a tamaño completo. Una copia de seguridad de la base de datos sin sus blobs deja fotos que solo muestran su miniatura.

:::tip[Primero la base de datos, después los blobs]
Si haces la copia mientras el servidor está en ejecución, copia primero la base de datos y justo después los blobs. Las imágenes se escriben una vez y nunca cambian, así que una copia de los blobs hecha después contiene todas las imágenes que conoce la copia de la base de datos. Las imágenes sobrantes que la base de datos restaurada no conoce las elimina el [mantenimiento](./storage.md#upkeep) del servidor.
:::

## Respaldar SQLite (selfhost)

SQLite almacena tus datos en un archivo (por ejemplo `openbeehive.db`) más dos archivos complementarios cuando el registro de escritura anticipada está activado:

- `openbeehive.db-wal` — cambios recientes aún no incorporados al archivo principal
- `openbeehive.db-shm` — índice de memoria compartida para el WAL

:::caution[No copies el archivo `.db` por sí solo mientras el servidor está en ejecución]
Con WAL habilitado (el ajuste recomendado), los datos más nuevos pueden estar todavía en el archivo `-wal`. Un simple `cp openbeehive.db backup.db` de una base de datos en ejecución puede producir una copia inconsistente o desactualizada.
:::

Tienes dos opciones seguras.

### Opción A — detener el servicio, luego copiar

El método fiable más simple. Detén Openbeehive para que nada esté escribiendo, copia los tres archivos juntos y luego vuelve a iniciarlo.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

Los archivos `-wal` y `-shm` pueden no existir si la base de datos acaba de pasar por un checkpoint — eso está bien, de ahí el `|| true`.

### Opción B — copia de seguridad en línea segura para WAL (sin tiempo de inactividad)

La herramienta de línea de comandos de SQLite puede tomar una instantánea consistente mientras el servidor sigue en ejecución, usando la API de copia de seguridad integrada:

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

Esto escribe un único archivo `.db` autocontenido que ya incluye todo lo del WAL, así que **no** necesitas copiar los archivos `-wal` o `-shm` junto a él. Este es el enfoque recomendado para las copias de seguridad desatendidas.

## Respaldar Postgres (cloud)

Usa `pg_dump` para producir un volcado lógico. Es consistente sin detener el servicio.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

El formato custom comprime bien y se restaura con `pg_restore`. Para MariaDB, el equivalente es `mariadb-dump --single-transaction`.

## Respaldar los blobs

### Sistema de archivos local

Copia el directorio de blobs. Los archivos aquí se escriben una vez y no se modifican in situ, así que una copia recursiva es segura incluso mientras el servidor está en ejecución (las fotos eliminadas desaparecen de él, de ahí el `--delete`):

```bash
rsync -a --delete ./data/blobs/ /backups/blobs/
```

### MinIO / S3

Refleja el bucket con el cliente de MinIO o la AWS CLI:

```bash
mc mirror --overwrite myminio/openbeehive /backups/blobs/
# or
aws s3 sync s3://openbeehive /backups/blobs/
```

Si usas un almacén compatible con S3 gestionado, también puedes confiar en sus propias políticas de versionado o de ciclo de vida como una segunda línea de defensa.

## Restaurar \{#restoring}

Una restauración sigue siempre los mismos tres pasos: **detén** el servidor, restaura **la base de datos y los blobs juntos** desde la misma copia, **inicia** el servidor. No dejes que el servidor responda solicitudes entre medias: tiene que arrancar sobre la base de datos restaurada antes de que se sincronice ningún dispositivo, porque ese arranque es lo que le permite reconocer la restauración (consulta [después de una restauración](#after-a-restore)).

### SQLite

```bash
systemctl stop openbeehive

cp /backups/openbeehive.db ./openbeehive.db
rm -f ./openbeehive.db-wal ./openbeehive.db-shm   # let SQLite rebuild these
rsync -a --delete /backups/blobs/ ./data/blobs/

systemctl start openbeehive
```

Elimina cualquier archivo `-wal`/`-shm` obsoleto antes de iniciar, para que SQLite abra limpiamente desde el archivo restaurado.

### Postgres

```bash
systemctl stop openbeehive

pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
mc mirror --overwrite --remove /backups/blobs/ myminio/openbeehive   # blob directory: rsync as above

systemctl start openbeehive
```

Con Docker Compose, `docker compose stop server` y `docker compose start server` sustituyen a `systemctl`.

### Qué hacen los dispositivos después de una restauración \{#after-a-restore}

Una base de datos restaurada es más antigua que lo que algunos dispositivos ya han visto. El servidor lo detecta en la siguiente sincronización de cada dispositivo y la aplicación lo repara por sí sola:

- **Las aplicaciones actualizadas (0.5.0 y posteriores) que habían sincronizado más allá de la copia** vuelven a subir todos los registros que tienen, junto con las imágenes de fotos que aún conservan, y después cargan los datos actuales del servidor. Los cambios que la copia perdió vuelven así; donde el servidor aún tiene un cambio, no ocurre nada. La aplicación muestra "Los datos del servidor se restablecieron o se restauraron. Este dispositivo ha vuelto a enviar sus registros y ha cargado los datos actuales."
- **Los dispositivos que no habían sincronizado más allá de la copia** continúan como siempre.
- **Las aplicaciones 0.4.x instaladas** no reciben esa señal y no vuelven a subir nada. Una cuya posición quede más allá de la base de datos restaurada vuelve a leer los datos desde el principio. Lo que solo tenía un dispositivo así no se restaura, así que actualiza la aplicación en todos los dispositivos antes de contar con esto.

Los cambios hechos en un dispositivo mientras el servidor estaba caído se suben como siempre en cuanto vuelve.

## Una sencilla programación con cron

Un trabajo nocturno que tome una instantánea de la base de datos y refleje los blobs es suficiente para la mayoría de quienes hacen alojamiento propio. Añade esto a tu crontab con `crontab -e`:

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

Los caracteres `%` deben escaparse como `\%` dentro de crontab. Para Postgres, sustituye la llamada a `sqlite3` por el comando `pg_dump` mostrado arriba. La base de datos se copia primero y los blobs justo después, como se recomienda arriba.

## Las exportaciones no son copias de seguridad del servidor

**Ajustes → Datos y copia de seguridad** en la aplicación descarga un espacio como JSON, o como ZIP con fotos; la copia del servidor también está disponible en `GET /export` (consulta [Importar y exportar](../using-the-app/import-export.md)). Una exportación así sirve para trasladar un espacio o guardar tu propia copia, pero contiene un solo espacio, sin cuentas, miembros ni claves API. Para una instancia completa, haz copia de seguridad de la base de datos y de los blobs como se describe arriba.

:::tip[Prueba tus restauraciones]
Una copia de seguridad que nunca has restaurado es solo una esperanza. De vez en cuando, restaura en un directorio desechable o una instancia de prueba y confirma que puedes abrir la aplicación y ver tus colmenas. Conserva al menos unos días de copias fechadas y guarda una fuera del sitio (un disco externo o un bucket remoto).
:::
