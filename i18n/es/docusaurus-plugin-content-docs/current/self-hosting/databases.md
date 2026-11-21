---
sidebar_position: 5
title: "Bases de datos"
---

# Bases de datos

Openbeehive almacena todos sus datos del lado del servidor en una base de datos relacional. El backend es agnóstico respecto a la base de datos: se comunica con una capa de almacenamiento conectable e incluye drivers para **SQLite**, **PostgreSQL** y **MariaDB**. Eliges cuál usar con dos variables de entorno.

Los tres se prueban con cada cambio: SQLite, PostgreSQL 18 y MariaDB 13.0.2. El driver `mysql` significa MariaDB; Oracle MySQL 8 debería funcionar, pero no forma parte de las pruebas.

Esta página explica cómo elegir la base de datos adecuada para tu situación y cómo configurarla correctamente.

:::note[¿Dónde residen los datos sin conexión?]
La aplicación en tu teléfono o portátil mantiene su propia base de datos local SQLite-WASM y funciona totalmente sin conexión. La base de datos del servidor descrita aquí es la copia central con la que los dispositivos se sincronizan en segundo plano. Son almacenes separados; esta página trata únicamente del servidor.
:::

## Los dos ajustes

Toda base de datos se configura mediante el mismo par de variables:

| Variable | Propósito |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Qué motor usar: `sqlite`, `postgres` o `mysql` (MariaDB). |
| `BEEHIVE_DATABASE_DSN` | La cadena de conexión (Data Source Name) para ese motor. |

El perfil de despliegue `selfhost` usa por defecto SQLite, y el perfil `cloud` usa por defecto PostgreSQL. Puedes anular cualquiera de los dos estableciendo estas dos variables explícitamente. Consulta [Configuración](./configuration.md) para la lista completa de variables de entorno.

## ¿Qué base de datos debería elegir?

| Situación | Recomendado |
| --- | --- |
| Un solo apicultor, un servidor, la configuración más simple posible | **SQLite** |
| Unos pocos miembros del hogar compartiendo colmenares | SQLite o PostgreSQL |
| Muchos usuarios, sincronización concurrente intensa, o despliegue alojado/cloud | **PostgreSQL** |
| Ya ejecutas MariaDB y quieres una cosa menos que operar | **MariaDB** |

:::tip[En resumen]
En caso de duda, usa SQLite. No necesita un servicio separado, reside en un único archivo y es perfectamente capaz de gestionar un colmenar personal o familiar. Pásate a PostgreSQL cuando tengas concurrencia multiusuario genuina o quieras alojamiento cloud gestionado.
:::

## SQLite (por defecto para el alojamiento propio)

SQLite es la opción sin dependencias. No hay servidor de base de datos que instalar o gestionar: tus datos residen en un archivo en disco, lo que hace que las [copias de seguridad](./backups.md) sean tan fáciles como copiar ese archivo.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)
```

Este es el valor por defecto del perfil `selfhost`. La parte `_pragma=journal_mode(WAL)` habilita el **registro de escritura anticipada** (Write-Ahead Logging). WAL permite que los lectores y un escritor trabajen al mismo tiempo sin bloquearse entre sí, lo que mejora notablemente el comportamiento cuando varios dispositivos se sincronizan a la vez. Recomendamos encarecidamente mantenerlo activado.

Los dos pragmas (separados con `&`):

- `journal_mode(WAL)` — lecturas concurrentes junto a un escritor.
- `busy_timeout(5000)` — espera hasta 5 segundos por un bloqueo en lugar de fallar de inmediato.

Puedes usar una ruta relativa (resuelta respecto al directorio de trabajo del servidor) o una ruta absoluta como `file:/var/lib/openbeehive/openbeehive.db?_pragma=busy_timeout(5000)&_pragma=journal_mode(WAL)`.

:::caution[WAL crea archivos adicionales]
En modo WAL, SQLite mantiene archivos complementarios junto a la base de datos principal (`openbeehive.db-wal` y `openbeehive.db-shm`). Al hacer copia de seguridad por copia de archivos, detén primero el servidor, o usa la propia herramienta de copia de seguridad de SQLite, para capturar una instantánea consistente. Consulta [Copias de seguridad](./backups.md).
:::

## PostgreSQL

PostgreSQL es la opción adecuada para configuraciones multiusuario, el servicio alojado y cualquier despliegue donde muchos dispositivos se sincronizan de forma concurrente. También es el valor por defecto del perfil `cloud`.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

Un ejemplo más realista que apunta a una base de datos llamada `openbeehive`:

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

El parámetro `sslmode` controla la seguridad del transporte:

| Valor | Significado |
| --- | --- |
| `disable` | Sin TLS. Está bien para una base de datos en el mismo host o una red privada de confianza. |
| `require` | Cifra la conexión (sin verificación del certificado). |
| `verify-full` | Cifra y verifica el certificado del servidor y el nombre de host. El más fuerte. |

:::caution[Seguridad en producción]
Usa `sslmode=require` o más fuerte siempre que la base de datos se comunique con el servidor a través de una red que no controles por completo. Reserva `sslmode=disable` para conexiones solo locales.
:::

Crea la base de datos y el usuario antes del primer arranque, por ejemplo:

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MariaDB

MariaDB es compatible para quienes ya operan uno. Selecciónalo con el driver `mysql`. El formato del DSN difiere del de PostgreSQL: usa la sintaxis del driver MySQL de Go.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive
```

El servidor activa `parseTime` por sí mismo, así que no hace falta que esté en el DSN.

Dale a Openbeehive una base de datos propia y un usuario que pueda modificar sus tablas:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

- **El usuario necesita `ALTER`** (incluido en `ALL PRIVILEGES`). Las migraciones modifican tablas, y en el primer arranque el servidor convierte sus tablas a una colación binaria `utf8mb4` para que el texto se compare byte a byte, igual que en SQLite y PostgreSQL.
- **Usa una base de datos dedicada.** No la compartas con otra aplicación.
- **Deja `max_allowed_packet` en 16 MiB o más** (el valor por defecto de MariaDB). El servidor acepta solicitudes de hasta 16 MiB.

## Las migraciones se ejecutan automáticamente

No ejecutas las migraciones a mano. En cada arranque, el servidor comprueba el esquema y aplica cualquier migración pendiente antes de empezar a atender solicitudes. Una base de datos nueva y vacía se configura automáticamente en el primer lanzamiento.

El SQL está escrito de forma portable para que el mismo esquema funcione en los tres motores; no hay configuración específica del motor más allá de crear la base de datos y el usuario mostrados arriba.

En SQLite y PostgreSQL cada migración se ejecuta en una transacción, así que una que falla se revierte. MariaDB confirma de inmediato cada cambio de esquema; sus migraciones están escritas de modo que cada sentencia pueda ejecutarse de nuevo, y una migración que se detuvo a mitad de camino continúa en el siguiente arranque. PostgreSQL y MariaDB modifican las tablas existentes en su sitio; SQLite reconstruye una tabla cuando no puede alterar una columna.

:::tip[Haz siempre copia de seguridad antes de actualizar]
Como una nueva versión puede incluir migraciones que cambian el esquema, haz una copia de seguridad antes de actualizar. Consulta [Actualización](./upgrading.md) y [Copias de seguridad](./backups.md).
:::

## Cambiar de base de datos más adelante

Los drivers no son intercambiables a nivel de datos: apuntar `BEEHIVE_DATABASE_DRIVER` a un motor distinto **no** mueve tus registros entre ellos. Para migrar de, por ejemplo, SQLite a PostgreSQL, necesitarías exportar y reimportar tus datos. Para la mayoría de quienes hacen alojamiento propio, el camino más simple es elegir la base de datos adecuada desde el principio.

Si solo necesitas un servidor central para ti mismo, SQLite te servirá bien durante mucho tiempo.

Para más sobre la configuración circundante, consulta [Alojamiento propio](/category/self-hosting) y [Almacenamiento](./storage.md).
