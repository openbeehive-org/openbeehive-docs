---
sidebar_position: 3
title: "Colmenas"
---

# Colmenas

Una colmena en Openbeehive es una sola colonia en una caja física. Casi todo lo que anotas en el día a día (visitas, cosechas, tratamientos) cuelga de una colmena. Cada colmena pertenece a un colmenar a la vez y puede tener una reina. Funciona sin conexión; consulta [Sin conexión y sincronización](/using-the-app/offline-and-sync).

## Crear una colmena

Abre un colmenar, escribe un nombre en **Añadir colmena** y añádela (la lista **Colmenas** tiene el mismo formulario con un selector de colmenar). Una colmena nueva empieza con el estado **Activa** y sin tipo. Abre la colmena y toca la acción **Editar** (lápiz) para definir:

| Campo | Qué es |
| --- | --- |
| **Nombre** | Un número, un color, un apodo. |
| **Tipo** | El estándar de cuadro y caja; ver más abajo. |
| **Estado** | El estado de la colonia; ver más abajo. |

Una **foto** se añade desde la página de la colmena tocando el marcador de imagen junto al nombre (**Eliminar foto** la quita de nuevo).

:::tip
Mantén los nombres cortos y coherentes dentro de un colmenar, por ejemplo "1", "2", "3". Los nombres cortos se imprimen con claridad en las etiquetas QR y son rápidos de leer sobre el terreno.
:::

### Tipos de colmena

| Tipo | Uso habitual |
| --- | --- |
| Zander | Muy extendido en partes de Alemania y Europa central. |
| Dadant | Popular para la producción de miel, cámara de cría grande. |
| Deutsch Normal | Un estándar tradicional alemán. |
| Langstroth | El estándar más común en todo el mundo. |
| Warré | Un diseño vertical y de baja intervención. |
| Top-bar | Barras horizontales, sin cuadros. |
| Otro | Cualquier cosa no listada arriba. |

Para una descripción más completa de cada estándar, consulta [Tipos de colmena](/knowledge-base/hive-types).

### Estado

| Estado | Significado |
| --- | --- |
| **Activa** | Una colonia con reina en uso normal. |
| **Núcleo** | Una colonia inicial pequeña (un "núcleo"), a menudo una división o una unidad de fecundación. |
| **Sin reina** | La colonia ha perdido su reina y necesita atención. |
| **Perdida** | La colonia ha muerto o se ha fugado. |
| **Disuelta** | Has unido o deshecho la colonia. |

El estado es una etiqueta que defines editando la colmena; nada lo cambia automáticamente. Poner una colmena como **Perdida** o **Disuelta** conserva todo su registro.

## Mover una colmena entre colmenares

Para reubicar una colmena, ábrela, toca la acción **Mover** y elige el colmenar de destino. La colmena conserva su nombre, reina, foto y registro completo; solo cambia su colmenar.

### Historial de ubicaciones

Cada traslado se registra como una entrada fechada en **Historial de ubicaciones**, al final de la página de la colmena, de modo que sabes dónde estaba una colonia en cualquier momento. Es útil para rastrear la exposición a enfermedades y para los registros de trashumancia.

:::caution
En muchas regiones, mover colmenas entre ubicaciones está sujeto a normas de sanidad y movimiento apícola, especialmente dentro de zonas de control de enfermedades. Consulta los requisitos nacionales o locales antes de reubicar colonias. Consulta [Enfermedades y plagas](/knowledge-base/diseases-and-pests).
:::

## La página de la colmena

Abrir una colmena te da una única pantalla con todo lo relacionado con esa colonia.

### Cabecera y acciones

La cabecera muestra la foto, el nombre, y el estado y el tipo. Los iconos de acción junto a ella:

- **Ficha de colmena**: una tabla imprimible de todas las visitas (con un botón **Imprimir**).
- **Evolución**: gráficos de las lecturas registradas en las visitas (cuadros ocupados, cuadros de cría, reservas de alimento, celdas reales, mansedumbre, comportamiento en el cuadro, varroa, peso de la colmena, alimentación, larva más joven, temperatura y humedad) más las cosechas de miel a lo largo del tiempo.
- **Editar colmena**, **Mover**, **QR** (muestra la etiqueta de la colmena con botones **Imprimir** y **SVG**; consulta [Etiquetas QR](/using-the-app/qr-labels)) y **Eliminar**.

### Últimas lecturas

Bajo la cabecera, unas píldoras muestran los valores distintos de cero de la visita más reciente: cuadros ocupados, cuadros de cría, celdas reales, peso de la colmena y varroa. Tocar una píldora abre el gráfico correspondiente en **Evolución**.

### Reina

La tarjeta **Reina actual** muestra su año, número, color de marcado, origen y comentario, con **Reemplazar reina** (o **Definir reina** si no hay ninguna registrada). **Historial de reinas** lista las reinas anteriores con sus fechas de introducción y reemplazo. Consulta [Reinas](/using-the-app/queens).

### Registro de visitas

**Registrar visita** abre el formulario de visita. Debajo se listan las cinco visitas más recientes, la más nueva primero, cada una con la fecha, el clima, unas etiquetas que resumen lo que registraste (reina vista, cuadros, reservas, celdas reales, mansedumbre, alimentación, peso, miel, temperatura, humedad, varroa), la nota y las fotos que haya. **Ver las N visitas** abre el registro completo. Consulta [Inspecciones](/using-the-app/inspections).

### Miel y Tratamientos

**Miel** muestra el total de cosecha de la colmena en su encabezado y lista cada cosecha (**Registrar cosecha**). **Tratamientos** lista cada tratamiento (**Registrar tratamiento**). Consulta [Cosechas](/using-the-app/harvests) y [Tratamientos](/using-the-app/treatments).

## Eliminar frente a retirar una colmena

Cambia el **estado** de una colmena en lugar de eliminarla. Poner una colonia como **Perdida** o **Disuelta** conserva su historial para las comparaciones año tras año y la trazabilidad. Elimina una colmena solo cuando se haya creado por error; la aplicación pide confirmación.
