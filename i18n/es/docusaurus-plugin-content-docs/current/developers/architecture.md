---
sidebar_position: 1
title: "Arquitectura offline-first"
---

# Arquitectura offline-first

Openbeehive está construido para que la apicultura se desarrolle en el colmenar, a menudo lejos de cualquier cobertura. Cada dispositivo lleva una copia completa de los datos que necesita, la interfaz lee y escribe esa copia local al instante, y un motor en segundo plano mantiene todo sincronizado discretamente con el servidor cuando hay conexión disponible.

Esta página explica cómo encajan las piezas. Para conocer las reglas exactas que mantienen consistentes las réplicas, consulta [el protocolo de sincronización](./sync-protocol.md) e [historial y eventos](./history-and-events.md).

## Local-first por diseño

La idea central es sencilla: el dispositivo es la fuente de verdad para el trabajo que estás haciendo en este momento.

- Cada dispositivo guarda su propia base de datos. La aplicación web (una PWA de SvelteKit) ejecuta una base de datos SQLite embebida compilada a WebAssembly (SQLite-WASM), respaldada por el Origin Private File System (OPFS) del navegador para un almacenamiento duradero y privado.
- La interfaz de usuario únicamente lee y escribe en la base de datos local. No hay ninguna llamada de red en la ruta crítica, así que abrir una colmena, registrar una inspección o marcar una tarea como completada es inmediato y funciona sin ninguna cobertura.
- Un motor en segundo plano separado se encarga de la red. Envía los cambios locales al servidor y descarga los cambios remotos, reconciliando ambos sin bloquear nunca la interfaz.

Como la base de datos local siempre está disponible, la aplicación se comporta igual tanto si estás en línea, sin conexión o con una conexión móvil inestable en medio de un huerto.

## El flujo de datos

El diagrama siguiente muestra cómo un cambio viaja desde una pulsación en la interfaz hasta el servidor y de vuelta a otros dispositivos.

```text
        Device A                          Server                       Device B
   +----------------+               +----------------+            +----------------+
   |   SvelteKit UI |               |   Go backend   |            |   SvelteKit UI |
   |  (reads/writes |               | (Connect-RPC:  |            |  (reads/writes |
   |    locally)    |               |  gRPC + JSON)  |            |    locally)    |
   +-------+--------+               +-------+--------+            +--------+-------+
           | read/write                     |                              | read/write
           v                                |                              v
   +----------------+                       |                     +----------------+
   | SQLite-WASM    |                       |                     | SQLite-WASM    |
   |   on OPFS      |                       |                     |   on OPFS      |
   +-------+--------+                       |                     +--------+-------+
           |                                |                              |
           |  Sync engine                   |                  Sync engine |
           |  (Push / Pull)                 |                              |
           +-----> Push changes ----------->|                              |
           |                                | store + order by HLC          |
           |<----- Pull changes ------------|                              |
                                            |------> Push changes <---------+
                                            |------- Pull changes --------->|
   scope: the workspace the user is signed in to (partial replication)
```

El motor de sincronización intercambia únicamente los registros del espacio en el que el usuario ha iniciado sesión, de modo que un dispositivo nunca descarga todo el mundo.

Los scripts y los sensores entran en este mismo esquema a través de los servicios CRUD del servidor ([Uso de la API](../using-the-api/overview.md)). Sus escrituras no se saltan este flujo: el servidor aplica cada una con la misma fusión por campo y la añade al mismo registro de cambios que un cambio enviado por push, así que una lectura publicada por una báscula de colmena es simplemente otro cambio que los dispositivos descargan en su siguiente sincronización.

## Resolución de conflictos

Dos dispositivos pueden editar la misma colmena mientras ambos están sin conexión. Cuando se reconectan, Openbeehive fusiona sus cambios de forma determinista, sin avisos manuales de conflicto. Tres técnicas hacen que esto esté libre de conflictos.

### Relojes Lógicos Híbridos (HLC)

Cada cambio se marca con un valor de Reloj Lógico Híbrido (Hybrid Logical Clock), que combina la hora del reloj de pared con un contador lógico y un identificador de nodo. El HLC da a cada cambio, en cada dispositivo, un orden total y causalmente consistente, incluso cuando los relojes de los dispositivos se desvían. Este ordenamiento es la base de las reglas siguientes.

### Last-writer-wins por campo para escalares

Para campos escalares simples, como el nombre de una colmena, su tipo o el color de marcaje de una reina, gana el valor con el HLC más alto. La fusión es por campo, no por registro, así que dos personas que editan campos distintos de la misma colmena conservan ambas sus cambios.

### OR-Sets para campos de lista

Los campos de tipo lista (actualmente solo las claves de foto de una inspección) usan un conjunto de eliminación observada (OR-Set) con semántica add-wins (las adiciones ganan). Las adiciones concurrentes sobreviven todas, y una eliminación solo surte efecto sobre las entradas concretas que observó. Esto evita el problema clásico en el que la adición de una persona borra silenciosamente la de otra.

### Eventos append-only

La tabla `event` es append-only en el uso normal: cada escritura de historial inserta una fila nueva con un id nuevo, así que dos dispositivos que añaden eventos sin conexión nunca tocan la misma fila. Un evento cambia solo junto con su registro: corregir una visita, un tratamiento o una cosecha actualiza su evento, y eliminar el registro elimina el evento con él. Consulta [historial y eventos](./history-and-events.md) para más detalle.

:::tip
Como las fusiones son deterministas, dos dispositivos cualesquiera que hayan visto el mismo conjunto de cambios calcularán siempre exactamente el mismo resultado, sin importar el orden en que esos cambios llegaron.
:::

## Compartición y replicación parcial

La unidad de compartición es el **espacio** (`tenant` y `organization` en el código). Todos los miembros de un espacio leen y escriben todos sus colmenares, colmenas y registros; no hay compartición por colmenar. Las filas personales, como una tarea sin colmenar, son la excepción: llegan solo a los dispositivos de su propietario.

La sincronización se acota en consonancia. Un dispositivo replica únicamente el espacio en el que su usuario ha iniciado sesión, un modelo conocido como replicación parcial, y mantiene una base de datos local por espacio. Esto mantiene las bases de datos locales pequeñas y significa que un miembro del espacio de una asociación nunca recibe datos de espacios en los que no participa.

El servidor comprueba la pertenencia en cada solicitud. Cuando alguien se une a un espacio, la primera descarga trae su historial; cuando la pertenencia termina, la sincronización se detiene.

## PWA mobile-first

La aplicación es una Progressive Web App, diseñada primero para el teléfono que llevas en el bolsillo junto al soporte de las colmenas.

- Un **service worker** almacena en caché la estructura de la aplicación y sus recursos para que la app cargue al instante y funcione totalmente sin conexión tras la primera visita, también en un arranque en frío. Una nueva versión se instala en segundo plano y toma el relevo cuando el usuario acepta el aviso de recarga o se cierran todas las pestañas.
- **SQLite-WASM sobre OPFS** proporciona una base de datos relacional real en el navegador, con almacenamiento duradero y privado del origen que sobrevive a las recargas. Solo una pestaña a la vez es dueña de la base de datos (un Web Lock); una segunda pestaña muestra un aviso y puede tomar el relevo.
- La aplicación es instalable en la pantalla de inicio y se comporta como una app nativa, incluido el flujo de escaneo de QR que abre la app en una colmena concreta.

## Cómo encaja todo

| Capa | Tecnología | Responsabilidad |
| --- | --- | --- |
| Interfaz | PWA de SvelteKit | Lee y escribe la base de datos local; nunca se bloquea por la red |
| Almacén local | SQLite-WASM sobre OPFS | Fuente de verdad duradera, en el dispositivo |
| Motor de sincronización | Push / Pull en segundo plano | Reconcilia cambios locales y remotos mediante HLC, LWW, OR-Sets |
| Backend | Go, Connect-RPC | Almacena y ordena los cambios; hace cumplir la pertenencia al espacio y los ámbitos; sirve las descargas |
| Almacenamiento | Backends de base de datos y blobs intercambiables | Persiste datos y medios en el servidor |

Esta separación es lo que da a Openbeehive su promesa fundamental: los registros están siempre contigo, siempre son rápidos y siempre consistentes una vez que todos vuelven a tener cobertura.

Para profundizar, lee [el protocolo de sincronización](./sync-protocol.md) e [historial y eventos](./history-and-events.md), o explora el resto de la [documentación para desarrolladores](/category/developers).
