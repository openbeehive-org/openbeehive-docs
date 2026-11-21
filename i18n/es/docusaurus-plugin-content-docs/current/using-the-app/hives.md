---
sidebar_position: 3
title: "Colmenas"
---

# Colmenas

Una colmena en Openbeehive es una sola colonia en una caja física. Casi todo lo que anotas en el día a día (visitas, cosechas, tratamientos) cuelga de una colmena. Cada colmena pertenece a un colmenar a la vez y puede tener una reina. Funciona sin conexión; consulta [Sin conexión y sincronización](./offline-and-sync.md).

## Crear una colmena

Abre un colmenar, escribe un nombre en **Añadir colmena** y añádela. La lista **Colmenas** tiene el mismo formulario con un selector de colmenar tras su botón **+ Nuevo**, y **+ Nuevo → Nueva colmena** en el Resumen lleva hasta allí. Una colmena nueva empieza con el estado **Activa** y sin tipo. Abre la colmena y elige **Más → Editar colmena** para definir:

| Campo | Qué es |
| --- | --- |
| **Nombre** | Un número, un color, un apodo. |
| **Tipo** | El estándar de cuadro y caja; ver más abajo. |
| **Estado** | El estado de la colonia; ver más abajo. |

Una **foto** se añade desde la página de la colmena tocando el marcador de imagen junto al nombre. Si después tocas la imagen, se abre en el visor, con **Sustituir la foto** y **Eliminar la foto**. Igual que con las fotos de una visita, una vista previa pequeña se sincroniza de inmediato con todos los dispositivos y la imagen a tamaño completo se sube en segundo plano; consulta [Sin conexión y sincronización](./offline-and-sync.md#photos).

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

Para una descripción más completa de cada estándar, consulta [Tipos de colmena](../knowledge-base/hive-types.md).

### Estado

| Estado | Significado |
| --- | --- |
| **Activa** | Una colonia con reina en uso normal. |
| **Núcleo** | Una colonia inicial pequeña (un "núcleo"), a menudo una división o una unidad de fecundación. |
| **Sin reina** | La colonia ha perdido su reina y necesita atención. |
| **Perdida** | La colonia ha muerto o se ha fugado. |
| **Disuelta** | Has unido o deshecho la colonia. |

El estado es una etiqueta que defines editando la colmena; nada lo cambia automáticamente. Poner una colmena como **Perdida** o **Disuelta** conserva todo su registro.

## La lista de colmenas

**Colmenas** lista todas las colmenas del espacio con su colmenar y el tiempo transcurrido desde su última visita. Encima de la lista:

- **Buscar** encuentra colmenas por nombre, por nombre del colmenar o por los primeros caracteres del código de la etiqueta impreso en la [etiqueta QR](./qr-labels.md).
- **Estado** y **Colmenar** filtran la lista; **Borrar filtros** los restablece.
- **Ordenar por** ordena por **Nombre**, **Colmenar** o **Más tiempo sin inspección**.

Los nombres se ordenan tal como los lees: "Colmena 2" va antes que "Colmena 10". Una línea bajo las herramientas indica cuántas colmenas se muestran.

## Mover una colmena entre colmenares

Para reubicar una colmena, ábrela, toca **Mover** en la cabecera y elige el colmenar de destino. La colmena conserva su nombre, reina, foto y registro completo; solo cambia su colmenar.

### Historial de ubicaciones

Cada traslado se registra como una entrada fechada en **Historial de ubicaciones**, al final de la página de la colmena, de modo que sabes dónde estaba una colonia en cualquier momento. Es útil para rastrear la exposición a enfermedades y para los registros de trashumancia.

:::caution
En muchas regiones, mover colmenas entre ubicaciones está sujeto a normas de sanidad y movimiento apícola, especialmente dentro de zonas de control de enfermedades. Consulta los requisitos nacionales o locales antes de reubicar colonias. Consulta [Enfermedades y plagas](../knowledge-base/diseases-and-pests.md).
:::

## La página de la colmena

Abrir una colmena te da una única pantalla con todo lo relacionado con esa colonia.

### Cabecera y acciones

La cabecera muestra la foto, el nombre, y el estado y el tipo. Junto a ella están las dos cosas que más haces en el campo, **Registrar visita** y **Mover**, y un menú **Más** con:

- **Ficha de colmena**: una tabla imprimible de todas las visitas (con un botón **Imprimir**).
- **Evolución**: gráficos de las lecturas registradas en las visitas (cuadros ocupados, cuadros de cría, reservas de alimento, celdas de enjambrazón, mansedumbre, comportamiento en el cuadro, varroa, peso de la colmena, alimentación, larva más joven, temperatura y humedad) más las cosechas de miel a lo largo del tiempo. Las valoraciones como las reservas de alimento y la mansedumbre se dibujan como niveles con nombre, con el mejor arriba; las temperaturas bajo cero se representan, y la varroa solo se grafica cuando la entrada es un número solo.
- **Editar colmena**, **Código QR** (muestra la etiqueta de la colmena con botones **Imprimir** y **SVG**; consulta [Etiquetas QR](./qr-labels.md)) y **Eliminar colmena**.

### Últimas lecturas

Bajo la cabecera, unas píldoras muestran los valores registrados en la visita más reciente: cuadros ocupados, cuadros de cría, celdas de enjambrazón, peso de la colmena y varroa. Tocar una píldora abre el gráfico correspondiente en **Evolución**.

### Reina

La tarjeta **Reina** muestra su año, número, color de marcado, origen y comentario, con **Reemplazar reina** (o **Definir reina** si no hay ninguna registrada) y acciones para editar o eliminar su registro. **Historial de reinas** lista las reinas anteriores con sus fechas de introducción y reemplazo. Consulta [Reinas](./queens.md).

### Registro de visitas

**Registrar visita** abre el formulario de visita. Se listan las cinco visitas más recientes, la más nueva primero, cada una con la fecha, el clima, unas etiquetas que resumen lo que registraste (reina vista, cuadros, reservas, celdas de enjambrazón, mansedumbre, alimentación, peso, miel, temperatura, humedad, varroa), la nota y las fotos que haya (toca una para abrir el visor). Los pesos y las temperaturas aparecen en las unidades elegidas en **Ajustes → Preferencias → Unidades**. Cada visita tiene acciones para editarla y eliminarla. **Ver las N visitas** abre el registro completo. Consulta [Inspecciones](./inspections.md).

### Miel y Tratamientos

**Miel** muestra el total de cosecha de la colmena en su encabezado y lista cada cosecha (**Registrar cosecha**). **Tratamientos** lista cada tratamiento (**Registrar tratamiento**) e imprime el registro de tratamientos (**Imprimir registro**). Las cosechas y los tratamientos se pueden editar y eliminar igual que las visitas. Consulta [Cosechas](./harvests.md) y [Tratamientos](./treatments.md).

## Eliminar frente a retirar una colmena

Cambia el **estado** de una colmena en lugar de eliminarla. Poner una colonia como **Perdida** o **Disuelta** conserva su historial para las comparaciones año tras año y la trazabilidad. Elimina una colmena solo cuando se haya creado por error; la aplicación pide confirmación, y la colmena desaparece con todos sus registros.
