---
sidebar_position: 10
title: "Actualizacion"
---

# Actualizacion

Mantener tu instancia de Openbeehive al dia significa nuevas funciones, correcciones y parches de seguridad. Las actualizaciones son deliberadamente sencillas: reemplaza el binario o descarga una nueva imagen, reinicia, y el servidor pone tu base de datos al dia por su cuenta.

Esta pagina cubre la rutina de actualizacion segura, la numeracion de versiones y como revertir si algo sale mal.

:::caution Haz copia de seguridad primero, siempre
Haz siempre una copia de seguridad antes de actualizar. Solo lleva un momento y es lo unico que convierte una mala actualizacion en un no-evento. Consulta [Copias de seguridad](/self-hosting/backups) para saber como tomar una instantanea de tu base de datos y de tu almacenamiento de blobs.
:::

## Antes de empezar

Una buena actualizacion lleva cinco minutos y un poco de lectura:

1. **Lee las notas de la version.** Revisa el [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app) y la version de GitHub a la que vas a pasar. Anota cualquier cambio incompatible, nueva configuracion requerida o paso manual.
2. **Haz copia de seguridad** de tu base de datos y tu almacenamiento de blobs.
3. **Anota tu version actual** para saber a que revertir si fuera necesario.
4. **Elige un momento tranquilo.** Las actualizaciones implican un breve reinicio. Como la aplicacion es offline-first, cualquiera que la este usando sigue trabajando localmente y se sincroniza una vez que el servidor vuelve.

## Como funcionan las migraciones

Las migraciones del esquema de la base de datos se ejecutan **automaticamente** cuando el servidor arranca. No hay un comando de migracion separado que recordar.

Al arrancar, el servidor comprueba la version del esquema registrada en tu base de datos, aplica cualquier migracion pendiente en orden y solo entonces empieza a atender solicitudes. Esto funciona igual en todos los drivers compatibles (PostgreSQL, MySQL y SQLite).

:::note
Como las migraciones se ejecutan al arrancar, el primer lanzamiento de una nueva version puede tardar un poco mas de lo habitual mientras se actualiza el esquema. Observa los registros para confirmar que termina limpiamente antes de enviarle trafico.
:::

## Actualizar el binario unico

Si ejecutas la compilacion `selfhost` de un solo archivo, una actualizacion es un intercambio de archivos.

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp ./server/bin/openbeehive ./server/bin/openbeehive.bak
# (also back up your SQLite database + blob directory — see Backups)

# 3. Replace the binary with the new release, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

¿Compilas desde el codigo fuente en su lugar? Descarga la nueva etiqueta y recompila:

```bash
git fetch --tags
git checkout v0.1.0
make proto && make build
```

Esto produce un nuevo `./server/bin/openbeehive`. Consulta [Binario unico](/self-hosting/single-binary) para los requisitos previos completos de compilacion (Go 1.25+, Node 22+, buf).

## Actualizar con Docker

Para el perfil `cloud` (o cualquier despliegue Docker), descarga la nueva imagen y recrea el contenedor.

```bash
# 1. Pull the new image
docker compose pull

# 2. Recreate containers with the new image
docker compose up -d

# 3. Follow the logs to confirm a clean start and migrations
docker compose logs -f openbeehive
```

La imagen publicada es `ghcr.io/openbeehive-org/openbeehive-app:latest`. Para despliegues reproducibles, fija una etiqueta de version especifica en lugar de `latest`, para que siempre sepas exactamente que se esta ejecutando.

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:v0.1.0
```

Consulta [Docker](/self-hosting/docker) para la configuracion completa de Compose.

## Versionado

Openbeehive sigue el [versionado semantico](https://semver.org): `MAJOR.MINOR.PATCH`.

| Parte | Ejemplo | Significa |
| --- | --- | --- |
| MAJOR | `1.0.0` | Cambios incompatibles; lee las notas de actualizacion con atencion |
| MINOR | `0.2.0` | Nuevas funciones, compatibles hacia atras |
| PATCH | `0.1.1` | Correcciones de errores y parches de seguridad, compatibles hacia atras |

La version actual es **v0.1.0**, la primera version publica.

:::caution v0.1.x es software temprano
Mientras Openbeehive este en la serie `0.x`, las versiones menores pueden incluir cambios que necesiten pasos manuales o que no sean totalmente compatibles hacia atras. Lee las notas de la version en cada actualizacion, no solo en las mayores, y manten tus copias de seguridad a mano.
:::

## Revertir

Si una actualizacion se comporta mal, revierte a la version de la que venias.

La regla importante: **un esquema mas nuevo puede no ser legible por un binario mas antiguo.** Una vez que las migraciones se han ejecutado, simplemente degradar la aplicacion no esta garantizado que funcione. La forma fiable de revertir es restaurar tanto la aplicacion *como* la base de datos desde antes de la actualizacion.

1. Detén el servicio.
2. Restaura la base de datos (y, si es relevante, el almacenamiento de blobs) desde la copia de seguridad que tomaste antes de actualizar. Consulta [Copias de seguridad](/self-hosting/backups).
3. Reinstala la version anterior del binario o la imagen.
4. Inicia el servicio y confirma que arranca limpiamente.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit your compose file to the previous tag, e.g. v0.1.0
docker compose up -d
```

:::danger
No restaures una base de datos antigua bajo un binario mas nuevo, ni ejecutes una base de datos mas nueva bajo un binario mas antiguo, salvo para el par coincidente del que hiciste copia de seguridad conjunta. Un esquema y un codigo no coincidentes pueden corromper los datos. Restaura siempre el binario y la base de datos como un conjunto.
:::

## Despues de actualizar

- Revisa los registros en busca de errores o advertencias de migracion.
- Abre la aplicacion y confirma que tus colmenares, colmenas e inspecciones recientes aparecen como se espera.
- Activa una sincronizacion desde un dispositivo cliente y confirma que los cambios fluyen en ambos sentidos.

Si algo parece estar mal, consulta [Resolucion de problemas](/knowledge-base/troubleshooting), y no dudes en revertir a tu copia de seguridad mientras investigas.
