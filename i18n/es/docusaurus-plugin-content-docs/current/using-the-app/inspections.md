---
sidebar_position: 5
title: "Inspecciones (visitas)"
---

# Inspecciones (visitas)

Una inspección es el registro de una sola visita a una colmena: lo que viste, lo que hiciste y todo lo que merezca la pena recordar. A lo largo de una temporada, las visitas conforman una imagen de cómo se desarrolla cada colonia. Funciona sin conexión; consulta [Sin conexión y sincronización](./offline-and-sync.md).

:::tip
Para saber qué buscar durante una visita y con qué frecuencia inspeccionar, lee [Inspeccionar una colonia](../beekeeping/inspecting.md). Esta página trata sobre cómo registrarlo.
:::

## Iniciar una visita

Abre una colmena (o escanea su [etiqueta QR](./qr-labels.md)) y toca **Registrar visita** en la cabecera. El formulario se abre con la fecha de hoy, y **Guardar** queda siempre a mano en la parte inferior de la pantalla mientras te desplazas.

Todos los campos son opcionales. Un rápido "todo bien" sin nada más rellenado es una entrada válida.

### Vacío no es cero

Los campos numéricos empiezan vacíos. Deja un campo vacío cuando no hayas mirado; introduce `0` cuando hayas mirado y no hayas encontrado nada. "Celdas de enjambrazón: 0" es una observación; un campo vacío no lo es. Los recuentos tienen botones **−** y **+**, para que puedas introducirlos con los guantes puestos.

### Partir de la última visita

Si la colmena tiene una visita anterior, **Partir de la última visita** (con la fecha de esa visita) rellena lo que suele cambiar poco: cuadros ocupados, cuadros de cría, reservas de alimento, mansedumbre y comportamiento en el cuadro. Ajusta lo que hoy sea distinto. Los campos que la última visita dejó vacíos siguen vacíos.

## Fecha y clima

| Campo | Notas |
| --- | --- |
| Fecha | Por defecto es hoy; cámbiala para registrar una visita pasada. No se aceptan fechas futuras. |
| Clima | Texto libre, p. ej. "soleado, 22°C". |

## Pesos y temperaturas \{#units}

Los pesos y las temperaturas se muestran e introducen en las unidades elegidas en **Ajustes → Unidades**: kilogramos o libras, grados Celsius o Fahrenheit. La elección se guarda con tu cuenta y se aplica en todos tus dispositivos. Puedes escribir los decimales con coma o con punto. La aplicación guarda cada valor en kilogramos y grados Celsius, así que cambiar las unidades nunca modifica tus registros, y las exportaciones y la API siguen en el sistema métrico.

## Colonia y comportamiento

| Campo | Qué registra |
| --- | --- |
| Reina vista | Si avistaste a la reina. |
| Huevos vistos | La señal más rápida de una reina que ha puesto recientemente. |
| Cría operculada vista | Si hay cría de obrera sellada. |
| Larva más joven | Edad en días del estadio de cría más joven que encontraste. |
| Cuadros ocupados | Cuántos cuadros cubren las abejas. |
| Cuadros de cría | Cuántos cuadros contienen cría. |
| Reservas de alimento | Buenas, Medias, Bajas o Ninguna. |
| Celdas de enjambrazón | Cuántas realeras encontraste. |
| Mansedumbre | Muy mansa, Mansa, Normal, Nerviosa o Agresiva. |
| Comportamiento en el cuadro | Abandona el cuadro, Inquieta, Tranquila o Muy tranquila. |
| Varroa | Varroas por día. Introduce un número solo, como `3`, si quieres que aparezca en los gráficos; cualquier otro texto se conserva, pero no se grafica. |
| Peso de la colmena | En kg o lb, si pesas la colmena. |

:::note
El trío "huevos vistos / larva más joven / cría operculada" suele confirmar una reina sana en puesta sin necesidad de encontrarla cada vez.
:::

## Actividades en esta visita

Esta sección empieza plegada; toca su encabezado para abrirla.

| Actividad | Registra |
| --- | --- |
| Alimentada | Cantidad de alimento dada, en kg o lb. |
| Cuadros añadidos / retirados | Cuadros que pusiste o quitaste. |
| Cuadro de zánganos cortado | Si recortaste un cuadro de cría de zánganos (una medida de control de varroa). |
| Alza añadida | Si añadiste un alza. |

La miel ya no se registra en el formulario de visita. Regístrala como una [cosecha](./harvests.md), con variedad, contenido de agua y número de lote. Las cantidades de "Miel cosechada" introducidas en las visitas por versiones anteriores se siguen mostrando.

Para una visión más amplia sobre el manejo de ácaros y la cosecha, consulta [Varroa](../beekeeping/varroa.md) y [Cosecha de miel](../beekeeping/honey-harvest.md).

## Clima

Esta sección también empieza plegada.

| Campo | Unidad |
| --- | --- |
| Temperatura de la colmena | °C o °F |
| Temperatura exterior | °C o °F |
| Humedad de la colmena | % |
| Humedad exterior | % |

Los cuatro son opcionales. Con el tiempo aparecen en los gráficos de **Evolución** de la colmena junto al peso y la fuerza de la colonia.

:::tip
Una báscula de colmena o un sensor de clima pueden publicar estos campos a través de la API. Esas lecturas se marcan como lecturas de sensor; consulta [Lecturas de sensor](#sensor-readings) más abajo y [Rastreadores automáticos](../using-the-api/automated-trackers.md).
:::

## Nota y fotos

Añade una **nota** de texto libre para todo lo que los campos estructurados no cubran: una realera de reemplazo marcada, un carácter que conviene vigilar, un recordatorio para cambiar la reina.

**Añadir foto** adjunta una o más imágenes (patrón de cría, sospecha de enfermedad, realeras). La aplicación reduce cada una a como máximo 2048 píxeles y elimina lo que la cámara guardó además de la imagen, como la ubicación. Una vista previa pequeña se sincroniza con la visita en todos los dispositivos de inmediato; la imagen a tamaño completo se sube en segundo plano cuando hay conexión, y hasta entonces la foto muestra **Pendiente de subir**.

Toca una foto para abrirla en el visor, que carga la imagen a tamaño completo la primera vez y la conserva en el dispositivo. **Eliminar la foto** en el visor, o el botón de quitar de una foto mientras editas la visita, la elimina de forma definitiva, en todos los dispositivos. Si algo necesita seguimiento, añade una [tarea](./tasks.md) con fecha de vencimiento.

## El registro de visitas

La página de la colmena muestra las cinco visitas más recientes, la más nueva primero, cada una resumida en etiquetas; **Ver las N visitas** abre el registro completo, y **Más → Ficha de colmena** imprime todas las visitas como una tabla.

El registro te permite detectar tendencias: la cría aumentando en primavera, las reservas agotándose antes del invierno, un recuento de varroa creciente.

## Corregir o eliminar una visita \{#correcting}

Cada visita del registro tiene una acción de edición y otra de eliminación.

- **Editar visita** abre el formulario con los valores guardados. Cambia lo que estaba mal, incluida la fecha, y guarda. Solo se guardan los campos que cambiaste, así que una corrección no sobrescribe lo que otra persona haya cambiado mientras tanto. Si dos dispositivos corrigen el mismo campo, gana el cambio más reciente.
- **Eliminar** pide una confirmación que nombra la fecha de la visita. Después, una barra ofrece **Deshacer** durante unos segundos. Eliminar una visita también la quita del historial y de los gráficos de la colmena.

## Lecturas de sensor \{#sensor-readings}

Las lecturas que una báscula o un sensor publican a través de la API se guardan como visitas marcadas como **Lectura de sensor**. Ahogarían las visitas que hiciste tú, así que:

- la página de la colmena lista solo las visitas registradas por una persona, y lo mismo hace el registro completo hasta que marcas allí **Mostrar lecturas de sensor** (la etiqueta indica cuántas hay),
- la "última inspección", la lista de colmenas y la lista de pendientes del Resumen las ignoran,
- los gráficos de **Evolución** las incluyen.

## Consejos para una entrada rápida en el campo

- **Escanea la etiqueta QR** para abrir la colmena correcta sin desplazarte por listas.
- **Registra sobre la marcha.** Toca los campos entre cuadros en lugar de reconstruirlo todo después.
- **Apóyate en el trío rápido.** Huevos vistos, larva más joven y cría operculada confirman una reina en puesta más rápido que buscarla.
- **Notas breves.** Deja una nota corta ahora; amplíala en casa.
- **Deja huecos.** Registra solo lo que comprobaste.
- **Fotografía lo dudoso.** Una foto de un patrón de cría extraño vale más que una descripción escrita.

:::caution
Si sospechas de una enfermedad de declaración obligatoria como la loque americana o europea, fotografíala, cierra la colmena y sigue las normas de notificación locales. Consulta [Enfermedades y plagas](../knowledge-base/diseases-and-pests.md).
:::
