---
sidebar_position: 2
title: "Colmenares"
---

# Colmenares

Un **colmenar** es un lugar donde mantienes abejas: tu jardín, un huerto comunitario, una azotea, un campo alquilado, un emplazamiento al borde de un bosque. En Openbeehive el colmenar se sitúa en lo más alto de tus registros; todo lo demás cuelga de él.

```text
Apiary  ->  Hive  ->  Queen
```

Cada colmenar contiene una o más colmenas, cada colmena tiene sus reinas actuales (y pasadas), y las visitas, cosechas y tratamientos se asocian a una colmena dentro de un colmenar.

## Por qué importan los colmenares

- **Contexto para tu trabajo.** Cuando llegas a un emplazamiento, abres ese colmenar y ves solo las colmenas que tienes delante.
- **Volver a encontrar el lugar.** Las coordenadas y una dirección te permiten localizar un emplazamiento remoto y planificar una ronda de visitas.
- **Impresión por lotes.** Las etiquetas QR se imprimen por colmenar, una etiqueta por colmena.

:::tip
Mantén un colmenar por cada ubicación física. Así las visitas, cosechas y tratamientos quedan agrupados allí donde realmente trabajas.
:::

## Crear un colmenar

Desde la lista de **Colmenares** (o **+ Nuevo → Nuevo colmenar** en el Resumen) elige **Nuevo colmenar**. Solo se requiere un nombre.

| Campo | Obligatorio | Para qué sirve |
| --- | --- | --- |
| **Nombre** | Sí | Una etiqueta corta, p. ej. "Jardín de casa" o "Emplazamiento del huerto". |
| **Dirección** | No | Texto libre que te ayude a encontrar el lugar. |
| **Nota** | No | Códigos de puertas, indicaciones de acceso, el nombre del propietario del terreno, aparcamiento. |
| **Latitud / Longitud** | No | Coordenadas en grados decimales. |

Funciona sin conexión; consulta [Sin conexión y sincronización](./offline-and-sync.md).

### Establecer coordenadas GPS

Escribe la latitud y la longitud a mano, o toca **Usar mi ubicación** para rellenarlas desde el GPS de tu dispositivo. Tu navegador pide permiso la primera vez.

Las coordenadas son grados decimales, por ejemplo latitud `52.5200` y longitud `13.4050`. Los valores negativos son válidos: al sur del ecuador para la latitud, al oeste de Greenwich para la longitud.

:::note
"Usar mi ubicación" captura dónde estás **tú**. Si configuras un emplazamiento remoto desde casa, escribe las coordenadas a mano o corrígelas en tu próxima visita.
:::

### El mapa y la búsqueda de direcciones

El formulario del colmenar incluye un mapa con un marcador arrastrable. Escribe una dirección y el marcador se mueve hasta ella; arrastra el marcador (o toca el mapa) y el campo de dirección se rellena a partir de la posición, usando las coordenadas sin más cuando no se conoce ninguna dirección para ese punto.

Una línea de estado bajo el mapa indica qué está haciendo la búsqueda:

- **Buscando la dirección…**: la búsqueda está en curso.
- **Ubicación establecida**: la posición se encontró y se escribió en el formulario.
- **Sin coincidencias para esta dirección**: coloca el marcador en el mapa.
- **La búsqueda de direcciones no está disponible**: no se puede contactar con el servicio (quizá estés sin conexión). El marcador y las coordenadas manuales siguen funcionando.

Las teselas del mapa y la búsqueda de direcciones provienen de servicios de OpenStreetMap, salvo que el operador de tu instancia haya configurado otros. Son los únicos servicios externos con los que contacta la aplicación: mostrar un mapa carga las teselas de la zona que miras, y escribir una dirección o mover el marcador envía esa dirección o posición al servicio de búsqueda. Un operador puede desactivar el mapa para toda la instancia; el formulario tiene entonces solo los campos de coordenadas. Consulta [Configuración](../self-hosting/configuration.md#maps).

## Añadir y ver colmenas

Abre un colmenar para ver sus colmenas con la fecha de la última inspección de cada una. Desde aquí puedes:

- **Añadir colmena**: escribe un nombre y añádela. Define su tipo y estado después, editando la colmena.
- **Abrir una colmena** para ver su reina, su registro de visitas, sus cosechas y sus tratamientos.

Consulta [Colmenas](./hives.md) y [Reinas](./queens.md).

## Imprimir etiquetas QR para el colmenar

El botón **Etiquetas QR** de la página del colmenar imprime una hoja A4 con una etiqueta por cada colmena del colmenar, directamente desde la página. Cada etiqueta codifica un enlace profundo a esa colmena; al escanearla se abre Openbeehive en la colmena. Consulta [Etiquetas QR](./qr-labels.md).

## Imprimir el registro de tratamientos

Cuando hay colmenas del colmenar con tratamientos registrados, el botón **Registro de tratamientos** imprime el registro de todas ellas en un solo documento. Consulta [Tratamientos](./treatments.md#treatment-register).

## Editar y reorganizar

Renombra un colmenar, o actualiza su dirección, nota y coordenadas, con **Editar colmenar**. Si dos personas editan el mismo colmenar, el cambio más reciente de cada campo prevalece.

Si una colmena se traslada a otra ubicación, usa **Mover** en la colmena para reasignarla al colmenar correspondiente. Los apicultores trashumantes pueden mantener un colmenar por emplazamiento y mover las colmenas conforme se desplazan.

## Eliminar un colmenar

**Eliminar colmenar** solo funciona con un colmenar sin colmenas. Mientras aún tenga colmenas, la aplicación indica cuántas hay y te pide que primero las muevas o las elimines.

## Compartir

Los colmenares no se comparten individualmente. Todo lo que hay en un espacio es visible para todos sus miembros, así que para trabajar en un colmenar con alguien, invítalo al espacio que lo contiene (Ajustes → Espacio → Invitar a un apicultor). Para mantener privadas las colonias de tu casa mientras colaboras en el colmenar de un club, crea un espacio aparte para el club. Consulta [Cuentas y espacios](./accounts-tenants.md).
