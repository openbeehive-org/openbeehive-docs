---
sidebar_position: 10
title: "Actualización"
---

# Actualización

Las actualizaciones son sencillas: reemplaza el binario o descarga una nueva imagen, reinicia, y el servidor pone al día el esquema de la base de datos por su cuenta.

:::caution Haz copia de seguridad primero, siempre
Haz una copia de seguridad antes de actualizar. Consulta [Copias de seguridad](./backups.md).
:::

## Antes de empezar

1. **Lee las notas de la versión.** Revisa el [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) y la [versión en GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) a la que vas a pasar. Anota la nueva configuración requerida o los pasos manuales.
2. **Haz copia de seguridad** de la base de datos y del almacenamiento de blobs.
3. **Anota tu versión actual** (la etiqueta que compilaste o la etiqueta de imagen que ejecutas) para saber a qué revertir.
4. **Elige un momento tranquilo.** El reinicio es breve; los dispositivos siguen funcionando localmente y se sincronizan una vez que el servidor vuelve.

## Pasos específicos de cada versión

### Actualizar a 0.5.0 \{#upgrading-to-050}

0.5.0 endurece varios valores predeterminados. Haz primero una copia de seguridad y luego repasa esta lista; cuando falta un ajuste, el servidor se detiene al arrancar e indica cuál es.

**Ajustes**

- **Secreto de sesión.** Con cualquier método de inicio de sesión, `BEEHIVE_SESSION_SECRET` debe estar definido y tener al menos 32 bytes, o el servidor no arranca. Genera uno con `openssl rand -base64 32`; un secreto nuevo cierra la sesión de todo el mundo.
- **El binario lee `.env`.** El servidor carga ahora `.env` de su directorio de trabajo. Comprueba que un `.env` antiguo que haya quedado allí contiene lo que quieres; las variables de entorno reales siguen prevaleciendo.
- **CORS es de mismo origen por defecto.** Si la aplicación se sirve desde un origen distinto al de la API, añádelo a `BEEHIVE_CORS_ALLOWED_ORIGINS`. `*` ya no permite credenciales.
- **Sin inicio de sesión: solo nombres de host conocidos.** Un servidor sin inicio de sesión solo responde a `localhost`, a direcciones IP y al host de `BEEHIVE_PUBLIC_BASE_URL`. Pon los demás nombres en `BEEHIVE_ALLOWED_HOSTS`.
- **La verificación de correo necesita un servidor de correo.** `BEEHIVE_EMAIL_VERIFICATION=true` requiere `BEEHIVE_SMTP_HOST`. Los enlaces ya no se escriben en el registro del servidor; sin SMTP, copia los enlaces de invitación desde Ajustes.
- **OIDC.** Un proveedor listado en `BEEHIVE_OIDC_PROVIDERS` sin emisor ni id de cliente impide el arranque. Un inicio de sesión con proveedor se asocia a una cuenta existente solo cuando ambas partes han verificado la dirección de correo.
- **Proxy inverso.** Establece `BEEHIVE_TRUST_PROXY_HEADERS=true` detrás de tu proxy; de lo contrario, la limitación de intentos de inicio de sesión cuenta a todos los usuarios como una sola dirección.
- **`BEEHIVE_NODE_ID`** tiene ahora como valor predeterminado un id aleatorio en cada arranque; elimínalo de tu configuración salvo que lo establezcas a propósito. Los ajustes de tamaño de página de la sincronización, que no se usaban, han desaparecido.

**Archivos Compose**

- `docker-compose.yml` es la pila de desarrollo: ahora requiere `BEEHIVE_SESSION_SECRET` y `MINIO_ROOT_PASSWORD`, publica PostgreSQL y MinIO solo en `127.0.0.1` y habilita OIDC solo cuando lo pides.
- Para ejecutar Openbeehive, usa el nuevo `docker-compose.selfhost.yml` (un contenedor, SQLite) o `docker-compose.prod.yml` (PostgreSQL y MinIO). `docker-compose.demo.yml` es la demo alojada y publica en `127.0.0.1` salvo que se defina `BEEHIVE_BIND`. Consulta [Docker y Compose](./docker.md).

**Datos**

- **Activar el inicio de sesión traslada los registros de un solo usuario.** Si la instancia funcionaba sin inicio de sesión y habilitas el inicio de sesión con correo y contraseña, los registros existentes pasan al espacio del administrador de la instancia en el siguiente arranque. Esto no se puede deshacer; consulta [Autenticación](./authentication.md#single-user-to-login).
- **Migraciones de la base de datos.** El primer arranque reconstruye la tabla de visitas y el índice del registro de cambios, así que tarda más en una base de datos grande. En MariaDB también convierte las tablas a una colación binaria, y una migración que falle allí no se puede revertir: una copia de seguridad es la única vuelta atrás.
- **Ejecuta exactamente una instancia del servidor** por base de datos.

**Comportamiento que notarán los usuarios y los scripts**

- **Las invitaciones** caducan a los 7 días y solo funcionan para la dirección de correo invitada. Las invitaciones pendientes más antiguas deben emitirse de nuevo.
- **Limitación de intentos de inicio de sesión.** Tras 10 inicios de sesión fallidos para una cuenta o 30 desde una misma dirección en 15 minutos, el servidor responde `429` con `Retry-After`.
- **Límites.** Un mensaje RPC puede tener como máximo 16 MiB y una solicitud puede durar como máximo 2 minutos (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`).
- **Relojes de los dispositivos.** Los cambios marcados con más de 10 minutos de adelanto respecto a la hora del servidor se rechazan. Las aplicaciones actualizadas se corrigen solas; una aplicación 0.4.x con el reloj mal ajustado pierde esos cambios, así que actualiza la aplicación en todos los dispositivos.
- **API.** Las llamadas de actualización cambian solo los campos enviados; `DeleteApiary` falla con `failed_precondition` mientras el colmenar tenga colmenas; las tareas personales se devuelven solo a su propietario; los valores numéricos de inspección que no se registraron se omiten en lugar de devolverse como `0`. Los endpoints HTTP simples bajo `/auth/` y `/tenants/` aceptan solo el método documentado, necesitan `Content-Type: application/json` cuando reciben un cuerpo, y `/tenants/delete` necesita `org_id`. Consulta [REST](../using-the-api/rest.md).

Las aplicaciones 0.4.x instaladas siguen funcionando con un servidor 0.5.0. Después de que la aplicación se actualice sola, cada dispositivo descarga sus datos una vez más.

### 0.4.0: el contenedor se ejecuta como un usuario sin privilegios

Hasta 0.3.1 la imagen se ejecutaba como root, así que un volumen creado por un contenedor más antiguo pertenece a root y el servidor de 0.4.0 (uid `65532`) no puede abrir la base de datos que contiene. Corrige la propiedad una sola vez, antes de iniciar la nueva imagen:

```bash
# named volume from the quick start
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

El síntoma de un chown omitido es `unable to open database file` o `permission denied` en el registro del servidor justo después del arranque. Los despliegues en Kubernetes con `securityContext.fsGroup: 65532` no necesitan ningún paso manual. Los volúmenes creados por 0.4.0 o posterior tienen el propietario correcto desde el principio.

El perfil cloud (Postgres y MinIO) no se ve afectado: el contenedor del servidor no contiene datos.

## Cómo funcionan las migraciones

Las migraciones del esquema se ejecutan automáticamente cuando el servidor arranca. Al arrancar, el servidor aplica cualquier migración pendiente en orden y solo entonces empieza a atender solicitudes. Esto funciona igual en PostgreSQL, MariaDB y SQLite.

:::note
El primer lanzamiento de una nueva versión puede tardar un poco más mientras se actualiza el esquema. Observa los registros para confirmar que termina antes de enviarle tráfico.
:::

## Actualizar el binario único

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Para compilar la nueva versión desde el código fuente, descarga su etiqueta y recompila:

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

Esto produce un nuevo `./server/bin/openbeehive`. Los requisitos previos están en [Binario único](./single-binary.md) (Go 1.27+, Node 24+, buf).

## Actualizar con Docker

El comando que necesitas depende de dónde proviene la imagen.

**Imagen publicada** (el `docker run` de un solo contenedor del [inicio rápido](./quick-start.md), o un archivo Compose con una línea `image:` como `docker-compose.selfhost.yml` o `docker-compose.prod.yml`). Los archivos Compose fijan una versión por etiqueta y digest; cambia la línea `image:` a la versión que quieras (o toma el archivo de esa versión) y después:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f server
```

Para un contenedor de `docker run` simple: `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, luego `docker rm -f openbeehive` y vuelve a ejecutar el mismo comando `docker run`. El volumen con nombre conserva tus datos.

**Compilado desde el código fuente** (el `docker-compose.yml` del repositorio tiene una sección `build:`, así que `pull` no hace nada para él):

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

Las etiquetas de imagen son `latest`, `X.Y` (el parche más reciente de una versión menor) y `X.Y.Z`. Para despliegues reproducibles, fija una versión concreta en lugar de `latest`:

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versionado

Openbeehive sigue el [versionado semántico](https://semver.org): `MAJOR.MINOR.PATCH`.

| Parte | Significa |
| --- | --- |
| MAJOR | Cambios incompatibles; lee las notas de actualización con atención |
| MINOR | Nuevas funciones, compatibles hacia atrás |
| PATCH | Correcciones de errores y parches de seguridad, compatibles hacia atrás |

:::caution 0.x es software temprano
Mientras Openbeehive esté en la serie `0.x`, las versiones menores pueden incluir cambios que necesiten pasos manuales o que no sean totalmente compatibles hacia atrás. Lee las notas de la versión en cada actualización y mantén tus copias de seguridad a mano.
:::

## Revertir

Un esquema más nuevo puede no ser legible por un binario más antiguo. Una vez que las migraciones se han ejecutado, degradar solo la aplicación no está garantizado que funcione. Restaura la aplicación *y* la base de datos desde antes de la actualización:

1. Detén el servicio.
2. Restaura la base de datos (y, si es relevante, el almacenamiento de blobs) desde la copia de seguridad que tomaste antes de actualizar.
3. Reinstala la versión anterior del binario o de la imagen.
4. Inicia el servicio y confirma que arranca limpiamente.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
No restaures una base de datos antigua bajo un binario más nuevo, ni ejecutes una base de datos más nueva bajo un binario más antiguo, salvo para el par coincidente del que hiciste copia de seguridad conjunta. Restaura siempre el binario y la base de datos como un conjunto.
:::

## Después de actualizar

- Revisa los registros en busca de errores o advertencias de migración.
- Abre la aplicación y confirma que aparecen tus colmenares, colmenas y visitas recientes.
- Registra algo en un dispositivo y confirma que se sincroniza.

Si algo parece estar mal, consulta [Resolución de problemas](../knowledge-base/troubleshooting.md) y revierte a tu copia de seguridad mientras investigas.
