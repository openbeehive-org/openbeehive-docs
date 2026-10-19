---
sidebar_position: 9
title: "Copias de seguridad y restauracion"
---

# Copias de seguridad y restauracion

Unos pocos minutos dedicados ahora a configurar las copias de seguridad te ahorraran muchas preocupaciones mas adelante. Esta pagina cubre que respaldar, como hacerlo de forma segura y como restaurar cuando lo necesites.

:::tip El servidor es la fuente de verdad
Cada dispositivo que usa tu instancia mantiene una copia local de sus datos en el navegador. Esa copia es una comodidad, no una copia de seguridad: puede borrarse al limpiar los datos del sitio, reinstalar o perder el dispositivo.

Para todo lo que se comparte entre personas o dispositivos, el **servidor** es la copia autorizada. Haz copia de seguridad del servidor y protegeras los registros de todos a la vez.
:::

## Que respaldar

Hay dos cosas en el servidor que vale la pena proteger:

| Elemento | Donde reside | Objetivo de la copia de seguridad |
| --- | --- | --- |
| La base de datos | Archivo SQLite, o Postgres/MySQL | Una copia consistente o un volcado |
| Blobs (fotos, adjuntos) | Sistema de archivos local, o MinIO/S3 | El directorio de blobs o el bucket |

Que base de datos y almacen de blobs tengas depende de tu perfil de despliegue:

- **`selfhost`** usa un unico archivo SQLite y un directorio de blobs local (`BEEHIVE_BLOB_DIR`, por defecto `./data/blobs`).
- **`cloud`** usa Postgres y un bucket MinIO/S3.

Haz copia de seguridad de **ambos**, la base de datos y los blobs. La base de datos contiene tus colmenares, colmenas, reinas, inspecciones y eventos; el almacen de blobs contiene los archivos a los que apuntan esos registros. Una copia de seguridad de la base de datos sin sus blobs te deja con enlaces de imagen rotos.

## Respaldar SQLite (selfhost)

SQLite almacena tus datos en un archivo (por ejemplo `openbeehive.db`) mas dos archivos complementarios cuando el registro de escritura anticipada esta activado:

- `openbeehive.db-wal` — cambios recientes aun no incorporados al archivo principal
- `openbeehive.db-shm` — indice de memoria compartida para el WAL

:::caution No copies el archivo `.db` por si solo mientras el servidor esta en ejecucion
Con WAL habilitado (el ajuste recomendado), los datos mas nuevos pueden estar todavia en el archivo `-wal`. Un simple `cp openbeehive.db backup.db` de una base de datos en ejecucion puede producir una copia inconsistente o desactualizada.
:::

Tienes dos opciones seguras.

### Opcion A — detener el servicio, luego copiar

El metodo fiable mas simple. Detén Openbeehive para que nada este escribiendo, copia los tres archivos juntos y luego vuelve a iniciarlo.

```bash
systemctl stop openbeehive

cp openbeehive.db     /backups/openbeehive.db
cp openbeehive.db-wal /backups/openbeehive.db-wal 2>/dev/null || true
cp openbeehive.db-shm /backups/openbeehive.db-shm 2>/dev/null || true

systemctl start openbeehive
```

Los archivos `-wal` y `-shm` pueden no existir si la base de datos acaba de pasar por un checkpoint — eso esta bien, de ahi el `|| true`.

### Opcion B — copia de seguridad en linea segura para WAL (sin tiempo de inactividad)

La herramienta de linea de comandos de SQLite puede tomar una instantanea consistente mientras el servidor sigue en ejecucion, usando la API de copia de seguridad integrada:

```bash
sqlite3 openbeehive.db ".backup '/backups/openbeehive.db'"
```

Esto escribe un unico archivo `.db` autocontenido que ya incluye todo lo del WAL, asi que **no** necesitas copiar los archivos `-wal` o `-shm` junto a el. Este es el enfoque recomendado para las copias de seguridad desatendidas.

## Respaldar Postgres (cloud)

Usa `pg_dump` para producir un volcado logico. Es consistente sin detener el servicio.

```bash
pg_dump "postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  --format=custom \
  --file=/backups/openbeehive-$(date +%F).dump
```

El formato custom comprime bien y se restaura con `pg_restore`. Para MySQL, el equivalente es `mysqldump --single-transaction`.

## Respaldar los blobs

### Sistema de archivos local

Copia el directorio de blobs. Los archivos aqui se escriben una vez y no se modifican in situ, asi que una copia recursiva es segura incluso mientras el servidor esta en ejecucion:

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

Si usas un almacen compatible con S3 gestionado, tambien puedes confiar en sus propias politicas de versionado o de ciclo de vida como una segunda linea de defensa.

## Restaurar

Restaura la base de datos y los blobs juntos, luego reinicia el servicio.

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
pg_restore --clean --if-exists \
  --dbname="postgres://user:pass@host:5432/openbeehive?sslmode=disable" \
  /backups/openbeehive-2026-06-19.dump
```

Luego restaura el bucket o el directorio de blobs como arriba y reinicia el servicio.

:::note Los dispositivos se vuelven a sincronizar automaticamente
Despues de una restauracion, los dispositivos conectados se reconcilian con el servidor en segundo plano. Gracias a los relojes logicos hibridos (Hybrid Logical Clocks) y a la fusion sin conflictos, los dispositivos que tengan cambios mas nuevos los sincronizaran de vuelta en lugar de perderlos, y los eventos de solo anadido nunca entran en conflicto. No hay nada que hacer a mano en cada dispositivo.
:::

## Una sencilla programacion con cron

Un trabajo nocturno que tome una instantanea de la base de datos y refleje los blobs es suficiente para la mayoria de quienes hacen alojamiento propio. Anade esto a tu crontab con `crontab -e`:

```bash
# Nightly Openbeehive backup at 02:30
30 2 * * * sqlite3 /srv/openbeehive/openbeehive.db ".backup '/backups/openbeehive-$(date +\%F).db'" && rsync -a --delete /srv/openbeehive/data/blobs/ /backups/blobs/
```

Los caracteres `%` deben escaparse como `\%` dentro de crontab. Para Postgres, sustituye la llamada a `sqlite3` por el comando `pg_dump` mostrado arriba.

:::tip Prueba tus restauraciones
Una copia de seguridad que nunca has restaurado es solo una esperanza. De vez en cuando, restaura en un directorio desechable o una instancia de prueba y confirma que puedes abrir la aplicacion y ver tus colmenas. Conserva al menos unos dias de copias fechadas y guarda una fuera del sitio (un disco externo o un bucket remoto).
:::
