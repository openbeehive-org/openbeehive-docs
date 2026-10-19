---
sidebar_position: 5
title: "Bases de datos"
---

# Bases de datos

Openbeehive almacena todos sus datos del lado del servidor en una base de datos relacional. El backend es agnostico respecto a la base de datos: se comunica con una capa de almacenamiento conectable e incluye drivers para **SQLite**, **PostgreSQL** y **MySQL**. Eliges cual usar con dos variables de entorno.

Esta pagina explica como elegir la base de datos adecuada para tu situacion y como configurarla correctamente.

:::note ¿Donde residen los datos sin conexion?
La aplicacion en tu telefono o portatil mantiene su propia base de datos local SQLite-WASM y funciona totalmente sin conexion. La base de datos del servidor descrita aqui es la copia central con la que los dispositivos se sincronizan en segundo plano. Son almacenes separados; esta pagina trata unicamente del servidor.
:::

## Los dos ajustes

Toda base de datos se configura mediante el mismo par de variables:

| Variable | Proposito |
| --- | --- |
| `BEEHIVE_DATABASE_DRIVER` | Que motor usar: `sqlite`, `postgres` o `mysql`. |
| `BEEHIVE_DATABASE_DSN` | La cadena de conexion (Data Source Name) para ese motor. |

El perfil de despliegue `selfhost` usa por defecto SQLite, y el perfil `cloud` usa por defecto PostgreSQL. Puedes anular cualquiera de los dos estableciendo estas dos variables explicitamente. Consulta [Configuracion](/self-hosting/configuration) para la lista completa de variables de entorno.

## ¿Que base de datos deberia elegir?

| Situacion | Recomendado |
| --- | --- |
| Un solo apicultor, un servidor, la configuracion mas simple posible | **SQLite** |
| Unos pocos miembros del hogar compartiendo colmenares | SQLite o PostgreSQL |
| Muchos usuarios, sincronizacion concurrente intensa, o despliegue alojado/cloud | **PostgreSQL** |
| Ya ejecutas MySQL/MariaDB y quieres una cosa menos que operar | **MySQL** |

:::tip En resumen
En caso de duda, usa SQLite. No necesita un servicio separado, reside en un unico archivo y es perfectamente capaz de gestionar un colmenar personal o familiar. Pasate a PostgreSQL cuando tengas concurrencia multiusuario genuina o quieras alojamiento cloud gestionado.
:::

## SQLite (por defecto para el alojamiento propio)

SQLite es la opcion sin dependencias. No hay servidor de base de datos que instalar o gestionar: tus datos residen en un archivo en disco, lo que hace que las [copias de seguridad](/self-hosting/backups) sean tan faciles como copiar ese archivo.

```bash
BEEHIVE_DATABASE_DRIVER=sqlite
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)
```

La parte `_pragma=journal_mode(WAL)` habilita el **registro de escritura anticipada** (Write-Ahead Logging). WAL permite que los lectores y un escritor trabajen al mismo tiempo sin bloquearse entre si, lo que mejora notablemente el comportamiento cuando varios dispositivos se sincronizan a la vez. Recomendamos encarecidamente mantenerlo activado.

Un par de pragmas utiles que puedes anadir (separalos con `&`):

```bash
BEEHIVE_DATABASE_DSN=file:openbeehive.db?_pragma=journal_mode(WAL)&_pragma=busy_timeout(5000)
```

- `journal_mode(WAL)` — lecturas concurrentes junto a un escritor.
- `busy_timeout(5000)` — espera hasta 5 segundos por un bloqueo en lugar de fallar de inmediato.

Puedes usar una ruta relativa (resuelta respecto al directorio de trabajo del servidor) o una ruta absoluta como `file:/var/lib/openbeehive/openbeehive.db?_pragma=journal_mode(WAL)`.

:::caution WAL crea archivos adicionales
En modo WAL, SQLite mantiene archivos complementarios junto a la base de datos principal (`openbeehive.db-wal` y `openbeehive.db-shm`). Al hacer copia de seguridad por copia de archivos, detén primero el servidor, o usa la propia herramienta de copia de seguridad de SQLite, para capturar una instantanea consistente. Consulta [Copias de seguridad](/self-hosting/backups).
:::

## PostgreSQL

PostgreSQL es la opcion adecuada para configuraciones multiusuario, el servicio alojado y cualquier despliegue donde muchos dispositivos se sincronizan de forma concurrente. Tambien es el valor por defecto del perfil `cloud`.

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://user:pass@host:5432/db?sslmode=disable
```

Un ejemplo mas realista que apunta a una base de datos llamada `openbeehive`:

```bash
BEEHIVE_DATABASE_DRIVER=postgres
BEEHIVE_DATABASE_DSN=postgres://openbeehive:secret@db.example.com:5432/openbeehive?sslmode=require
```

El parametro `sslmode` controla la seguridad del transporte:

| Valor | Significado |
| --- | --- |
| `disable` | Sin TLS. Esta bien para una base de datos en el mismo host o una red privada de confianza. |
| `require` | Cifra la conexion (sin verificacion del certificado). |
| `verify-full` | Cifra y verifica el certificado del servidor y el nombre de host. El mas fuerte. |

:::caution Seguridad en produccion
Usa `sslmode=require` o mas fuerte siempre que la base de datos se comunique con el servidor a traves de una red que no controles por completo. Reserva `sslmode=disable` para conexiones solo locales.
:::

Crea la base de datos y el usuario antes del primer arranque, por ejemplo:

```sql
CREATE DATABASE openbeehive;
CREATE USER openbeehive WITH PASSWORD 'secret';
GRANT ALL PRIVILEGES ON DATABASE openbeehive TO openbeehive;
```

## MySQL

MySQL (y MariaDB) son compatibles para quienes ya operan uno. El formato del DSN difiere del de PostgreSQL: usa la sintaxis del driver MySQL de Go.

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=user:pass@tcp(host:3306)/openbeehive?parseTime=true
```

El parametro `parseTime=true` es **obligatorio**. Le indica al driver que devuelva las columnas `DATE` y `DATETIME` como valores de tiempo adecuados en lugar de bytes en bruto, en lo que Openbeehive se basa para las marcas de tiempo y el manejo del reloj logico hibrido (Hybrid Logical Clock). Omitirlo provocara errores.

Un ejemplo mas completo con UTF-8 y una ubicacion por defecto sensata:

```bash
BEEHIVE_DATABASE_DRIVER=mysql
BEEHIVE_DATABASE_DSN=openbeehive:secret@tcp(db.example.com:3306)/openbeehive?parseTime=true&charset=utf8mb4&loc=UTC
```

Crea primero la base de datos y el usuario:

```sql
CREATE DATABASE openbeehive CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'openbeehive'@'%' IDENTIFIED BY 'secret';
GRANT ALL PRIVILEGES ON openbeehive.* TO 'openbeehive'@'%';
FLUSH PRIVILEGES;
```

## Las migraciones se ejecutan automaticamente

No ejecutas las migraciones a mano. En cada arranque, el servidor comprueba el esquema y aplica cualquier migracion pendiente antes de empezar a atender solicitudes. Una base de datos nueva y vacia se configura automaticamente en el primer lanzamiento.

El SQL esta escrito de forma portable para que el mismo esquema funcione en los tres motores; no hay configuracion especifica del motor mas alla de crear la base de datos y el usuario mostrados arriba.

:::tip Haz siempre copia de seguridad antes de actualizar
Como una nueva version puede incluir migraciones que cambian el esquema, haz una copia de seguridad antes de actualizar. Consulta [Actualizacion](/self-hosting/upgrading) y [Copias de seguridad](/self-hosting/backups).
:::

## Cambiar de base de datos mas adelante

Los drivers no son intercambiables a nivel de datos: apuntar `BEEHIVE_DATABASE_DRIVER` a un motor distinto **no** mueve tus registros entre ellos. Para migrar de, por ejemplo, SQLite a PostgreSQL, necesitarias exportar y reimportar tus datos. Para la mayoria de quienes hacen alojamiento propio, el camino mas simple es elegir la base de datos adecuada desde el principio.

Si solo necesitas un servidor central para ti mismo, SQLite te servira bien durante mucho tiempo.

Para mas sobre la configuracion circundante, consulta [Alojamiento propio](/category/self-hosting) y [Almacenamiento](/self-hosting/storage).
