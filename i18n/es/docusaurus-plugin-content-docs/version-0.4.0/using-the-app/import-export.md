---
sidebar_position: 12
title: "Importar y exportar"
---

# Importar y exportar

Tus registros son tuyos. Openbeehive te permite llevarte **todos tus datos** —
como copia de seguridad, para trasladarte a otra instancia, para analizarlos en una hoja de cálculo o para compartirlos
con otras herramientas. Todo se ejecuta localmente desde **Ajustes → Datos y copia de seguridad**; ningún
dato sale de tu dispositivo a menos que decidas compartir el archivo.

## Exportar

Abre **Ajustes**, busca **Datos y copia de seguridad** y elige un formato:

| Formato | Lo que obtienes | Ideal para |
| --- | --- | --- |
| **Copia de seguridad completa (JSON)** | Todos los registros — colmenares, colmenas, reinas, inspecciones, cosechas, tareas, ubicaciones y eventos — en un solo archivo | Resguardo y **traslado a otra instancia** (reversible) |
| **Hoja de cálculo (XLSX)** | Un libro de trabajo, una hoja por entidad | Análisis en Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` por entidad, agrupados en un `.zip` | Intercambio universal, scripts, otras aplicaciones |
| **BeeXML** | Un archivo XML estructurado (colmenar → colmena → reina / inspección) | Compartir con herramientas que usan el estilo de intercambio [BeeXML](https://beexml.org/) |
| **Informe (PDF)** | Un informe imprimible del colmenar — colmenas, reinas actuales y últimas lecturas | Imprimir, compartir, auditoría / mantenimiento de registros |

El **Informe (PDF)** abre un resumen limpio y con la identidad de marca en una pestaña nueva y activa
el diálogo de impresión de tu navegador — elige "Guardar como PDF" para conservar una copia.

La exportación refleja lo que hay en tu dispositivo en este momento. Las fotos no se incluyen en
las exportaciones CSV/XLSX/BeeXML (se almacenan como blobs) — la imagen completa reside en
tu cuenta sincronizada y su almacenamiento de blobs; consulta
[Autoalojamiento → Copias de seguridad](/self-hosting/backups) para copias de seguridad del lado del servidor.

## Importar y restaurar

En el mismo panel de **Datos y copia de seguridad**, elige un formato y selecciona un archivo:

- **Copia de seguridad de Openbeehive (JSON)** — restaura una exportación anterior. Los registros conservan sus
  identificadores, por lo que volver a importar la misma copia de seguridad es seguro (no creará duplicados).
- **BeeXML** — importa colmenares, colmenas, reinas e inspecciones desde un archivo
  de estilo BeeXML.
- **CSV de otra aplicación** — migra desde otra aplicación de apicultura o una hoja de cálculo
  (ver más abajo).
- **Detección automática** — elige el lector adecuado según el archivo.

Los registros importados pasan a formar parte de **tu** cuenta y se sincronizan como cualquier cosa que introduzcas
a mano.

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
| Notas | note, notes, comment, remarks, notiz |

Cada fila del CSV se convierte en una **inspección** de la colmena correspondiente, creando los colmenares y
las colmenas según sea necesario (las filas sin colmenar van a parar a un colmenar "Importado"). Las columnas que
no se reconocen se omiten — nada se rompe, simplemente conservas el resto.

:::tip Primero la ida y vuelta
Si te estás moviendo entre instancias de Openbeehive, prefiere la **copia de seguridad JSON** — es
completa y sin pérdidas. Usa CSV para venir **desde** otras aplicaciones.
:::

## Por qué esto importa

Openbeehive está diseñado para que tus datos no puedan quedar secuestrados. Hay una larga historia de
registros de apicultura que terminan encerrados en la nube de un único proveedor. Iniciativas abiertas como
[BeeXML](https://beexml.org/) (un estándar de intercambio de Apimondia) y el
proyecto [BEEP](https://beep.nl/) buscan corregir eso; Openbeehive sigue la misma línea —
formatos abiertos, una [API](/category/using-the-api) documentada y una copia de seguridad completa con un solo clic.
Llévate tus abejas y vete cuando quieras.

Para acceso programático y alimentación automatizada de datos, consulta [Usar la API](/category/using-the-api).
