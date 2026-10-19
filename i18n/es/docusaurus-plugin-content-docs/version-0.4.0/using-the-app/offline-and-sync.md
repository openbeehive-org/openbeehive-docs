---
sidebar_position: 10
title: "Sin conexión y sincronización"
---

# Sin conexión y sincronización

Openbeehive está hecho para el colmenar, no para la oficina. Sobre el terreno rara vez tienes una señal fiable, así que la aplicación es **offline-first**: todo lo que haces se guarda en tu dispositivo de inmediato y se sincroniza con el servidor más tarde, en segundo plano.

La aplicación nunca te hace esperar a la red. Abre una colmena, registra una visita, añade una tarea, anota algo sobre la reina: todo es instantáneo, haya cobertura o no.

## Todo se guarda localmente

Openbeehive mantiene una copia completa de tus registros en una pequeña base de datos en tu dispositivo. Cada lectura y cada escritura se realizan primero contra esa copia local.

- **Es rápido.** Abrir una colmena o desplazarte por las visitas nunca espera a una barra de carga.
- **Funciona sin cobertura.** Un bosque, un valle, un sótano lleno de alzas.
- **Tus datos son tuyos.** Los registros viven en tu dispositivo; el servidor es la copia para sincronizar y compartir.

:::tip
Como los registros se almacenan en el dispositivo, instala Openbeehive como una aplicación en lugar de usarlo en una pestaña del navegador. Consulta [Instalar Openbeehive](/using-the-app/install).
:::

## El indicador de sin conexión

Cuando el dispositivo no tiene conexión, el bloque de cuenta de la barra lateral pasa de **En línea** a **Sin conexión** y una barra en la parte superior de la página indica "Sin conexión: los cambios se guardan y se sincronizan más tarde". Es informativo; continúa exactamente igual que antes.

Cuando el dispositivo vuelve a estar en línea, la barra desaparece y cualquier cambio hecho sin conexión se envía automáticamente. No hay ningún botón de "sincronizar ahora".

:::note
Un indicador de sin conexión persistente normalmente significa poca cobertura en el colmenar. Si se mantiene incluso con una buena conexión en casa, consulta [Resolución de problemas](/knowledge-base/troubleshooting).
:::

## Tu primera sincronización en un dispositivo nuevo

Iniciar sesión en un dispositivo nuevo, o volver a abrir la aplicación después de borrar su almacenamiento, empieza con una base de datos local vacía que se va llenando en segundo plano:

- Las listas muestran **marcadores de posición con brillo** mientras leen de la base de datos local.
- Mientras la primera descarga sigue en marcha, el Resumen y las listas de colmenares, colmenas y tareas muestran **"Sincronizando tus datos…"** en lugar de un estado vacío.
- Los conjuntos de datos grandes aparecen **de forma progresiva**: cada lote que recibe la aplicación se muestra al instante.

Solo cuando la aplicación sabe que los datos están completos muestra un estado vacío real. Si el dispositivo está sin conexión o no se puede llegar al servidor, el aviso da paso a lo que haya almacenado localmente.

## Sincronizar entre tus dispositivos

Usa Openbeehive en varios dispositivos, un teléfono sobre el terreno y un portátil en casa, y se mantienen en sintonía. Cada dispositivo mantiene su propia copia local e intercambia cambios con el servidor en segundo plano. Registra una visita en tu teléfono junto a las colmenas, y para cuando te sientes ante tu portátil ya está ahí. Mientras cada dispositivo inicie sesión en la misma cuenta, todos ven los mismos registros.

## Qué ocurre cuando dos dispositivos cambian lo mismo

Openbeehive resuelve los cambios superpuestos **automáticamente**, sin avisos de "¿qué versión quieres conservar?".

- **Tú editas la nota de un colmenar en tu teléfono, tu coapicultor edita la misma nota en el suyo.** La edición más reciente de ese campo prevalece.
- **Ambos añadís fotos a la misma visita mientras estáis sin conexión.** Se conservan ambos conjuntos de fotos.
- **Cada uno registra una visita distinta.** Las visitas, cosechas y tratamientos solo se añaden, así que ambas se conservan una al lado de la otra.

Cada dispositivo converge en el mismo estado una vez que todos se han sincronizado.

:::tip
La versión corta: añade con libertad, edita con confianza. Cómo funciona esto por dentro se explica en las páginas del [protocolo de sincronización](/developers/sync-protocol) y la [arquitectura](/developers/architecture).
:::

## Compartir

Los registros se comparten mediante **espacios** (tenants). Todos los miembros de un espacio ven y editan todos sus colmenares, colmenas y registros; no hay compartición por colmenar ni por colmena.

| Rol | Qué puede hacer |
| --- | --- |
| **Admin** (propietario del espacio) | Todo lo que puede hacer un miembro, además de invitar y revocar, y eliminar el espacio. |
| **Miembro** | Añadir y editar colmenares, colmenas, visitas, tareas, cosechas y tratamientos en el espacio. |

Para compartir un emplazamiento con un mentor mientras mantienes otros privados, pon ese emplazamiento en su propio espacio e invita allí al mentor. Los registros compartidos se sincronizan y resuelven los conflictos exactamente igual que los tuyos. Consulta [Cuentas y espacios](/using-the-app/accounts-tenants).

## Si algo no se puede guardar

El guardado ocurre en tu dispositivo, así que prácticamente nunca falla. Si ocurre (por ejemplo porque el almacenamiento del navegador está lleno o dañado), el formulario permanece abierto con todo lo que escribiste y un mensaje de error explica qué salió mal.

En la **cuenta de demostración** pública el servidor rechaza los cambios (la demo se reinicia cada hora). Tus cambios se guardan en tu dispositivo y simplemente se quedan ahí en lugar de sincronizarse.

Hay una situación en la que guardar funciona pero no perdura: si el navegador no puede darle a la aplicación su almacenamiento privado, la aplicación recurre a una base de datos en memoria y muestra el aviso **"El almacenamiento no está disponible: los cambios no se conservarán en este dispositivo."** Todo sigue funcionando durante la sesión, y los cambios se siguen sincronizando con el servidor si has iniciado sesión, pero la copia local desaparece al cerrar la pestaña. Esto ocurre en ventanas de navegación privada y cuando una segunda pestaña de la aplicación sigue reteniendo el almacenamiento; consulta [Resolución de problemas](/knowledge-base/troubleshooting#storage-is-unavailable).

## ¿Perderé datos alguna vez?

Tus registros se escriben primero en tu dispositivo y no se eliminan porque estés sin conexión o porque la aplicación se cierre. Esperan en el dispositivo hasta que se puedan sincronizar.

Si te autoalojas, mantén también copias de seguridad del servidor. Consulta [Copias de seguridad](/self-hosting/backups).
