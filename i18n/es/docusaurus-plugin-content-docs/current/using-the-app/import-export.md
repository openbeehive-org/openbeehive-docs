---
sidebar_position: 12
title: "Importar y exportar"
---

# Importar y exportar

Tus registros son tuyos. Openbeehive te permite llevarte **todos tus datos**:
como copia de seguridad, para trasladarte a otra instancia, para analizarlos en una hoja de cálculo o para compartirlos
con otras herramientas. Todo está en **Ajustes → Datos y copia de seguridad**.

La exportación y la importación trabajan sobre el **espacio activo**. Ambas esperan a que el
dispositivo haya terminado su primera sincronización del espacio; hasta entonces, el panel lo indica.

## Copia de seguridad completa \{#full-backup}

**Descargar copia completa** guarda todos los colmenares, colmenas, reinas, visitas, tratamientos,
cosechas, tareas y entradas de la línea de tiempo del espacio tal como los tiene este dispositivo,
incluidas tus tareas personales y los cambios que aún no se han subido.
El panel te indica cuántos cambios de ese tipo hay, y cuántos rechazó el servidor
(consulta [Problemas de sincronización](./offline-and-sync.md#sync-problems)): están
en el archivo, pero no en el servidor.

- Sin fotos, la copia es un único archivo JSON.
- Con **Incluir fotos** es un ZIP que contiene además las imágenes a tamaño completo.
  Las imágenes que no están en este dispositivo se obtienen del servidor; si eso no
  es posible (sin conexión, o aún no subidas), la aplicación indica cuántas faltan,
  y se incluyen sus miniaturas.

Los pesos y las temperaturas se exportan siempre en kilogramos y grados
Celsius, sean cuales sean las unidades que hayas elegido en **Ajustes → Unidades**.

### Descargar desde el servidor \{#server-copy}

**Descargar copia del servidor** obtiene la copia completa del espacio que guarda el
servidor, en el mismo formato. Incluye tus propias tareas personales pero no las
de otros miembros, y le faltan los cambios que un dispositivo aún no ha subido. Se
permiten unas pocas descargas por hora. Los scripts pueden obtener el mismo archivo con una
clave API; consulta [REST](../using-the-api/rest.md#export). La cuenta de demostración no
puede descargarla.

## Otros formatos

| Formato | Lo que obtienes | Ideal para |
| --- | --- | --- |
| **Hoja de cálculo (XLSX)** | Un libro de trabajo, una hoja por tipo de registro | Análisis en Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` por tipo de registro, agrupados en un `.zip` | Intercambio universal, scripts, otras aplicaciones |
| **BeeXML** | Colmenares, colmenas, reinas y visitas en un archivo XML estructurado | Compartir con herramientas que usan el estilo de intercambio [BeeXML](https://beexml.org/) |
| **Informe (PDF)** | Un informe imprimible del colmenar: colmenas, reinas actuales y últimas lecturas | Imprimir, compartir, mantenimiento de registros |

Estos formatos sirven para leer los datos en otro lugar; para restaurar tus datos, usa la copia completa.
El **Informe (PDF)** abre un resumen en una pestaña nueva y activa el diálogo de
impresión de tu navegador; elige "Guardar como PDF" para conservar una copia. Para copias de seguridad
del lado del servidor de una instancia completa, consulta [Autoalojamiento → Copias de seguridad](../self-hosting/backups.md).

## Importar \{#importing}

**Importar → Elegir archivo…** lee un archivo en el espacio activo. Elige el
**Formato del archivo** o déjalo en **Detección automática**:

- **Copia de Openbeehive (JSON o ZIP)**: una copia completa de esta u otra
  instancia, con fotos si es un ZIP.
- **BeeXML**: colmenares, colmenas, reinas y visitas desde un archivo de estilo BeeXML.
- **CSV de otra app**: visitas de otra aplicación de apicultura o de una
  hoja de cálculo (ver más abajo).

No se escribe nada antes de que veas una **Vista previa**: por tipo de registro, cuántos
son **Nuevos**, **Sobrescritos**, **Restaurados** y **Omitidos (ya existen)**.
Después toca **Importar ahora**.

Por defecto, una importación solo añade. Los registros que ya existen en este
espacio, también los eliminados, se omiten y nunca se modifican, así que importar
la misma copia dos veces no cambia nada. Dos opciones cambian eso:

- **Sobrescribir los registros existentes** escribe los valores del archivo donde
  difieren. Solo se escriben los campos que contiene el archivo; los cambios hechos desde la
  exportación se pierden. Los registros eliminados siguen eliminados.
- **Restaurar también los registros eliminados** recupera los registros que se eliminaron
  aquí.

Un archivo de **otro espacio** recibe id nuevos, así que nunca toca los registros
existentes, y la vista previa lo indica. Los registros importados se sincronizan como cualquier cosa que
introduzcas a mano. Los números del archivo se leen como kilogramos y grados Celsius.

**Deshacer la última importación** elimina lo que creó la última importación, también sin conexión. Un
colmenar o una colmena que desde entonces tiene registros propios (una visita, una colmena trasladada
allí) se conserva, y la aplicación indica cuántos.

## Migrar desde otra aplicación

La mayoría de las aplicaciones de apicultura pueden exportar sus registros en **CSV** (por ejemplo
**Apiary Book**, **HiveBook**, **BeeKeeperPal** o tu propia hoja de cálculo).
Openbeehive lee esos archivos **emparejando los nombres de las columnas**, así que normalmente no
tienes que reformatear nada.

Columnas reconocidas (no importan mayúsculas, espacios ni puntuación; se entienden
varios idiomas):

| Campo de Openbeehive | Nombres de columna reconocidos |
| --- | --- |
| Colmenar | apiary, yard, location, standort, rucher, colmenar, apiario |
| Colmena | hive, colony, beute, volk, ruche, colmena, arnia |
| Fecha | date, inspection date, visit date, datum, fecha, data |
| Clima | weather, wetter, meteo, tiempo |
| Varroa | varroa, mites, mite count |
| Temperatura de la colmena | hive temp, brood temp |
| Temperatura exterior | temperature, temp, outside temp, ambient temp |
| Humedad de la colmena | hive humidity |
| Humedad exterior | humidity, outside humidity |
| Peso de la colmena | weight, hive weight, gewicht |
| Miel | honey, harvest, yield, honig, ernte |
| Notas | note, notes, comment, comments, remarks, notiz, bemerkung |

Cada fila del CSV se convierte en una **visita** de la colmena correspondiente. Se usan los colmenares y las colmenas
que ya existen con el mismo nombre (sin distinguir mayúsculas y minúsculas); los demás se crean
(las filas sin colmenar van a parar a un colmenar "Importado").
Una visita que ya está registrada para esa colmena ese día con los mismos
valores se omite, así que importar el mismo archivo dos veces no cambia nada, y una
importación que sobrescribe deja esas visitas como están. Las columnas que no se
reconocen se omiten. Los pesos y las temperaturas se leen como kilogramos y
grados Celsius.

:::tip[Primero la ida y vuelta]
Si te estás moviendo entre instancias de Openbeehive, prefiere la **copia de seguridad completa**
(como ZIP con fotos): es completa y sin pérdidas. Usa CSV para venir **desde** otras aplicaciones.
:::

## Por qué esto importa

Openbeehive está diseñado para que tus datos no puedan quedar secuestrados. Hay una larga historia de
registros de apicultura que terminan encerrados en la nube de un único proveedor. Iniciativas abiertas como
[BeeXML](https://beexml.org/) (un estándar de intercambio de Apimondia) y el
proyecto [BEEP](https://beep.nl/) buscan corregir eso; Openbeehive sigue la misma línea —
formatos abiertos, una [API](/category/using-the-api) documentada y una copia de seguridad completa con un solo clic.
Llévate tus abejas y vete cuando quieras.

Para acceso programático y alimentación automatizada de datos, consulta [Usar la API](/category/using-the-api).
