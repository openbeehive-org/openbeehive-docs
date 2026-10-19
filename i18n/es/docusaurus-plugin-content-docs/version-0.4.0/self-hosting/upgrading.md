---
sidebar_position: 10
title: "Actualización"
---

# Actualización

Las actualizaciones son sencillas: reemplaza el binario o descarga una nueva imagen, reinicia, y el servidor pone al día el esquema de la base de datos por su cuenta.

:::caution Haz copia de seguridad primero, siempre
Haz una copia de seguridad antes de actualizar. Consulta [Copias de seguridad](/self-hosting/backups).
:::

## Antes de empezar

1. **Lee las notas de la versión.** Revisa el [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) y la [versión en GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) a la que vas a pasar. Anota la nueva configuración requerida o los pasos manuales.
2. **Haz copia de seguridad** de la base de datos y del almacenamiento de blobs.
3. **Anota tu versión actual** (la etiqueta que compilaste o la etiqueta de imagen que ejecutas) para saber a qué revertir.
4. **Elige un momento tranquilo.** El reinicio es breve; los dispositivos siguen funcionando localmente y se sincronizan una vez que el servidor vuelve.

## Pasos específicos de cada versión

### 0.4.0: el contenedor se ejecuta como un usuario sin privilegios

Hasta 0.3.1 la imagen se ejecutaba como root, así que un volumen creado por un contenedor más antiguo pertenece a root y el servidor de 0.4.0 (uid `65532`) no puede abrir la base de datos que contiene. Corrige la propiedad una sola vez, antes de iniciar la nueva imagen:

```bash
# named volume from the quick start or docker-compose.demo.yml
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

El síntoma de un chown omitido es `unable to open database file` o `permission denied` en el registro del servidor justo después del arranque. Los despliegues en Kubernetes con `securityContext.fsGroup: 65532` no necesitan ningún paso manual. Los volúmenes creados por 0.4.0 o posterior tienen el propietario correcto desde el principio.

El perfil cloud (Postgres y MinIO) no se ve afectado: el contenedor del servidor no contiene datos.

## Cómo funcionan las migraciones

Las migraciones del esquema se ejecutan automáticamente cuando el servidor arranca. Al arrancar, el servidor aplica cualquier migración pendiente en orden y solo entonces empieza a atender solicitudes. Esto funciona igual en PostgreSQL, MySQL y SQLite.

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

Esto produce un nuevo `./server/bin/openbeehive`. Los requisitos previos están en [Binario único](/self-hosting/single-binary) (Go 1.27+, Node 24+, buf).

## Actualizar con Docker

El comando que necesitas depende de dónde proviene la imagen.

**Imagen publicada** (el `docker run` de un solo contenedor del [inicio rápido](/self-hosting/quick-start), o un archivo Compose con una línea `image:` como `docker-compose.demo.yml`):

```bash
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml logs -f server
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

Si algo parece estar mal, consulta [Resolución de problemas](/knowledge-base/troubleshooting) y revierte a tu copia de seguridad mientras investigas.
