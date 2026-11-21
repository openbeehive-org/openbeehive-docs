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
Como los registros se almacenan en el dispositivo, instala Openbeehive como una aplicación en lugar de usarlo en una pestaña del navegador. Consulta [Instalar Openbeehive](./install.md).
:::

## El estado de sincronización \{#sync-status}

Un pequeño indicador de estado en la parte superior de cada página (y bajo tu dirección de correo en la barra lateral) dice si los cambios de este dispositivo han llegado al servidor:

| El indicador dice | Significado |
| --- | --- |
| **Sincronizado** y una hora | Todo lo que hay en este dispositivo está en el servidor. |
| **Sincronizando…** | Hay un intercambio con el servidor en curso. |
| **Cambios pendientes de enviar** | Hay cambios guardados en el dispositivo que aún no se han subido. |
| **Sin conexión** o **Sin conexión · cambios pendientes** | No hay conexión. Los cambios esperan en el dispositivo. |
| **Falló la sincronización · reintentando** | No se pudo contactar con el servidor o este respondió con un error. La aplicación sigue intentándolo. |
| **Sesión cerrada · inicia sesión para sincronizar** | Tu sesión ha terminado. Toca el indicador para iniciar sesión; no se pierde nada. |
| **Problemas de sincronización: 2** | Dos cambios no se pudieron sincronizar; ver más abajo. |
| **Aplicación desactualizada · actualízala para sincronizar** | El servidor requiere una versión más reciente de la aplicación. Carga la nueva versión; hasta entonces, los cambios esperan en el dispositivo. |

Toca el indicador para abrir el **Estado de la sincronización**: el estado, cuándo se sincronizó este dispositivo por última vez, cuántos cambios y fotos esperan para subirse y, si los hay, cuántos cambios rechazó el servidor, con **Ver problemas de sincronización**. **Sincronizar ahora** inicia una sincronización de inmediato. Una visita puede ser varios cambios: la visita en sí, sus fotos y su entrada en la cronología. Sin tocarlo, la aplicación sincroniza después de cada cambio, a intervalos cortos mientras está abierta y en cuanto vuelve la conexión.

Mientras el dispositivo no tiene conexión, una barra en la parte superior de la página indica además "Sin conexión: los cambios se guardan y se sincronizan más tarde." Es informativo; continúa exactamente igual que antes.

:::note
Un indicador de sin conexión persistente normalmente significa poca cobertura en el colmenar. Si se mantiene incluso con una buena conexión en casa, consulta [Resolución de problemas](../knowledge-base/troubleshooting.md).
:::

### Problemas de sincronización \{#sync-problems}

De vez en cuando el servidor no acepta un cambio, por ejemplo porque el registro pertenece a otro espacio o porque el reloj del dispositivo iba muy adelantado. Un cambio así no se descarta: se queda en el dispositivo, y el indicador muestra **Problemas de sincronización** con el número de cambios rechazados. La lista **Problemas de sincronización** de **Ajustes → Datos y sincro** nombra cada uno con el motivo y ofrece **Reintentar** (o **Reintentar todos**) y **Descartar**. Descartar detiene la subida; el registro se queda en este dispositivo tal como está, pero nunca llega al servidor, a tus otros dispositivos ni a los demás miembros.

La lista también muestra los cambios recibidos del servidor que este dispositivo no pudo aplicar, marcados como "no se pudo aplicar". Los registros de este dispositivo se quedan como están, y el resto de la sincronización continúa. Una entrada así solo se puede descartar; si el mismo cambio vuelve a llegar, sustituye la entrada.

### Relojes de los dispositivos

Cada cambio lleva la hora del dispositivo que lo hizo. El servidor rechaza los cambios marcados con más de 10 minutos de adelanto respecto a su propia hora. La aplicación aprende la hora del servidor en cada sincronización, compensa un reloj del dispositivo mal ajustado, y vuelve a marcar y enviar esos cambios por sí sola.

## Tu primera sincronización en un dispositivo nuevo

Iniciar sesión en un dispositivo nuevo, o volver a abrir la aplicación después de borrar su almacenamiento, empieza con una base de datos local vacía. La aplicación carga desde el servidor los registros actuales del espacio, no el historial completo de cada cambio, y llena la base de datos en segundo plano:

- Las listas muestran **marcadores de posición con brillo** mientras leen de la base de datos local.
- Mientras la primera descarga sigue en marcha, el Resumen y las listas de colmenares, colmenas y tareas muestran **"Sincronizando tus datos…"** en lugar de un estado vacío.
- Los conjuntos de datos grandes aparecen **de forma progresiva**: cada lote que recibe la aplicación se muestra al instante.

Solo cuando la aplicación sabe que los datos están completos muestra un estado vacío real. Si el dispositivo está sin conexión o no se puede llegar al servidor, el aviso da paso a lo que haya almacenado localmente.

Después de que la aplicación se haya actualizado a la versión 0.5.0, cada dispositivo vuelve a cargar una vez los registros actuales del servidor. Esto repara los huecos que las versiones anteriores podían dejar y no requiere ninguna acción por tu parte. Un dispositivo que lleva sin sincronizar más tiempo del que el servidor conserva su lista de cambios (180 días por defecto) hace lo mismo.

### Después de que se restaurara el servidor \{#after-restore}

Si el operador restaura el servidor desde una copia de seguridad, puede que al servidor le falten cambios que tu dispositivo ya había sincronizado. La aplicación lo detecta en la siguiente sincronización, vuelve a subir todos los registros que tiene, junto con las fotos que conserva, y carga los datos actuales. Después muestra "Los datos del servidor se restablecieron o se restauraron. Este dispositivo ha vuelto a enviar sus registros y ha cargado los datos actuales." No hay que hacer nada; toca **Aceptar** para cerrar el mensaje.

## Sincronizar entre tus dispositivos

Usa Openbeehive en varios dispositivos, un teléfono sobre el terreno y un portátil en casa, y se mantienen en sintonía. Cada dispositivo mantiene su propia copia local e intercambia cambios con el servidor en segundo plano. Registra una visita en tu teléfono junto a las colmenas, y para cuando te sientes ante tu portátil ya está ahí. Mientras cada dispositivo inicie sesión en la misma cuenta, todos ven los mismos registros.

## Qué ocurre cuando dos dispositivos cambian lo mismo

Openbeehive resuelve los cambios superpuestos **automáticamente**, sin avisos de "¿qué versión quieres conservar?".

- **Tú editas la nota de un colmenar en tu teléfono, tu coapicultor edita la misma nota en el suyo.** La edición más reciente de ese campo prevalece.
- **Ambos añadís fotos a la misma visita mientras estáis sin conexión.** Se conservan ambos conjuntos de fotos.
- **Cambias tus unidades en un dispositivo.** Las unidades y el idioma se guardan con tu cuenta y te acompañan en todos tus dispositivos; consulta [Ajustes](./dashboard.md#settings).
- **Cada uno registra una visita distinta.** Cada visita, cosecha y tratamiento es un registro propio, así que ambas se conservan una al lado de la otra.

Cada dispositivo converge en el mismo estado una vez que todos se han sincronizado.

:::tip
La versión corta: añade con libertad, edita con confianza. Cómo funciona esto por dentro se explica en las páginas del [protocolo de sincronización](../developers/sync-protocol.md) y la [arquitectura](../developers/architecture.md).
:::

## Fotos \{#photos}

Una foto tiene dos partes. Una vista previa pequeña se sincroniza con el registro como todo lo demás, así que todos los dispositivos la muestran de inmediato, también sin conexión. La imagen a tamaño completo se guarda en el dispositivo que tomó la foto y se sube en segundo plano cuando hay conexión; hasta entonces la foto muestra **Pendiente de subir**. Los demás dispositivos cargan la imagen completa la primera vez que abres la foto y guardan una copia.

Eliminar una foto es definitivo: desaparece de todos los dispositivos y la imagen se borra del servidor. Los dispositivos que aún usan la versión 0.4 de la aplicación no ven las fotos añadidas desde dispositivos actualizados.

## Compartir

Los registros se comparten mediante **espacios**. Todos los miembros de un espacio ven y editan todos sus colmenares, colmenas y registros; no hay compartición por colmenar ni por colmena. La excepción son las [tareas](./tasks.md), que son personales.

| Rol | Qué puede hacer |
| --- | --- |
| **Admin** (propietario del espacio) | Todo lo que puede hacer un miembro, además de invitar y revocar, y eliminar el espacio. |
| **Miembro** | Añadir y editar colmenares, colmenas, visitas, cosechas y tratamientos en el espacio. |

Para compartir un emplazamiento con un mentor mientras mantienes otros privados, pon ese emplazamiento en su propio espacio e invita allí al mentor. Los registros compartidos se sincronizan y resuelven los conflictos exactamente igual que los tuyos. Consulta [Cuentas y espacios](./accounts-tenants.md).

## Si algo no se puede guardar

El guardado ocurre en tu dispositivo, así que prácticamente nunca falla. Si ocurre (por ejemplo porque el almacenamiento del navegador está lleno o dañado), el formulario permanece abierto con todo lo que escribiste y un mensaje de error explica qué salió mal.

La **cuenta de demostración** pública es de solo lectura: un aviso lo indica, y los formularios de registro muestran una nota y un botón **Guardar** desactivado. Eliminar, cambiar fotos y marcar tareas también están desactivados. Si aun así un cambio llega a pasar, el servidor lo rechaza y la aplicación lo deshace y avisa de que no se ha guardado.

Hay una situación en la que guardar funciona pero no perdura: si el navegador no puede darle a la aplicación su almacenamiento privado (una ventana de navegación privada, o el almacenamiento bloqueado en los ajustes del navegador), la aplicación mantiene los registros en memoria y muestra un aviso: **"Este navegador no guarda datos en este dispositivo (ventana privada o almacenamiento bloqueado). Lo que no se haya sincronizado se pierde al cerrar esta pestaña."** Todo sigue funcionando durante la sesión, y los cambios se siguen sincronizando con el servidor si has iniciado sesión, pero la copia local desaparece al cerrar la pestaña. Consulta [Resolución de problemas](../knowledge-base/troubleshooting.md#storage-is-unavailable).

## Una sola pestaña a la vez \{#one-tab}

Solo una pestaña o ventana puede trabajar a la vez con los registros de un dispositivo. Si abres Openbeehive en una segunda pestaña, esta muestra **"Openbeehive está abierto en otra pestaña"**. Continúa en la primera pestaña, o toca **Usar aquí** para pasar la aplicación a la nueva pestaña; la otra muestra entonces el aviso.

## ¿Perderé datos alguna vez?

Tus registros se escriben primero en tu dispositivo y no se eliminan porque estés sin conexión o porque la aplicación se cierre. Esperan en el dispositivo hasta que se puedan sincronizar.

En un dispositivo compartido, cada cuenta guarda su propia copia local por espacio. Cuando otra persona inicia sesión en el mismo navegador, no ve tus cambios sin enviar ni tus tareas personales, y nada tuyo se sube con su cuenta; tus cambios se suben la próxima vez que inicies sesión allí.

Si te autoalojas, mantén también copias de seguridad del servidor. Consulta [Copias de seguridad](../self-hosting/backups.md).
