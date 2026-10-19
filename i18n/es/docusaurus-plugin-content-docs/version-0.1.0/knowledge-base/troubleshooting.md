---
sidebar_position: 6
title: "Resolución de problemas"
---

# Resolución de problemas

La mayoría de los problemas con Openbeehive entran en un puñado de categorías: sincronización, almacenamiento local, la cámara/escáner QR o el inicio de sesión. Esta página recorre cada una, con comprobaciones prácticas que puedes hacer tú mismo antes de pedir ayuda.

La buena noticia: como Openbeehive es offline-first, tus registros viven en una base de datos local en tu dispositivo. Casi nada de lo que hagas aquí puede perder datos que ya se hayan sincronizado con el servidor.

## Los datos no se sincronizan

Tus cambios se guardan al instante en el dispositivo. La sincronización con el servidor ocurre discretamente en segundo plano, así que un retraso es normal y rara vez es motivo de preocupación. Si los cambios que hiciste en un dispositivo no aparecen en otro, repasa esta lista.

**1. Comprueba que estás en línea.** La sincronización solo se ejecuta cuando tienes conexión de red. Mira el indicador de estado de sincronización en la aplicación. Si has estado trabajando en el campo sin señal, tus ediciones quedan en cola de forma segura y se enviarán en cuanto vuelvas a conectarte.

**2. Comprueba que has iniciado sesión.** La sincronización requiere una sesión autenticada. Si tu sesión ha caducado, aún podrás leer y editar localmente, pero nada se sincronizará hasta que vuelvas a iniciar sesión. Abre el menú de cuenta y confirma que has iniciado sesión.

**3. Comprueba el ámbito del colmenar.** La compartición en Openbeehive se produce a nivel de colmenar mediante **ámbitos** (scopes). Si falta una colmena o inspección en otro dispositivo o para otra persona, confirma que el colmenar correspondiente está compartido con esa cuenta. Los registros de un colmenar al que no puedes acceder nunca aparecerán.

**4. Dale un momento y vuelve a abrirla.** La sincronización en segundo plano se ejecuta periódicamente. Cerrar y volver a abrir la aplicación, o cambiar a ella desde segundo plano, provoca un nuevo intento de sincronización.

:::note
La sincronización está libre de conflictos por diseño. Openbeehive usa relojes lógicos híbridos con "gana la última escritura" para los campos individuales y conjuntos de "gana la adición" para las listas, y los eventos de solo adición (inspecciones, tratamientos, cosechas) nunca entran en conflicto. No perderás trabajo porque dos dispositivos editaran a la vez. La edición más reciente de un campo dado gana; ambas adiciones a una lista se conservan.
:::

Si te autoalojas y la sincronización falla para todos, lo más probable es que el problema esté en el lado del servidor. Consulta [Configuración de autoalojamiento](/self-hosting/configuration) y revisa los registros del servidor.

## Cómo funciona el almacenamiento local

Openbeehive es una Progressive Web App (PWA). Mantiene todo tu conjunto de datos en una base de datos SQLite que se ejecuta dentro de tu navegador, almacenada en **OPFS** (el Origin Private File System). Cada lectura y escritura ocurre contra esta base de datos local, por eso la aplicación se siente instantánea y funciona sin ninguna señal.

Algunas consecuencias prácticas:

- Tus datos están ligados al navegador y al dispositivo donde usas Openbeehive. Cada dispositivo mantiene su propia copia local y se sincroniza con el servidor.
- El almacenamiento OPFS es privado del origen de la aplicación. Otros sitios web no pueden leerlo.
- Instalar la aplicación en tu pantalla de inicio (consulta [Instalación](/using-the-app/install)) usa el mismo almacenamiento que la pestaña del navegador en la mayoría de las plataformas.

:::caution
Las herramientas del navegador que "borran los datos del sitio", "borran cookies y almacenamiento" o la navegación privada/de incógnito pueden eliminar la base de datos OPFS local. Eso es seguro **solo si tus datos ya se han sincronizado** con el servidor, porque se volverán a descargar en el próximo inicio de sesión. Si tienes cambios sin conexión sin sincronizar, asegúrate de estar en línea y deja que la sincronización termine primero.
:::

## Borrar o reinstalar la aplicación

A veces un comienzo desde cero arregla comportamientos extraños tras una actualización. Mientras hayas iniciado sesión en una cuenta que sincroniza, esto no es destructivo: tus registros sincronizados vuelven desde el servidor.

1. Confirma que estás **en línea y con sesión iniciada**, y que el indicador de sincronización muestra que todo está al día.
2. Desinstala o quita la PWA de tu pantalla de inicio, o borra el almacenamiento del sitio en la configuración de tu navegador.
3. Vuelve a abrir Openbeehive e inicia sesión.
4. Espera a que la sincronización inicial descargue tus colmenares, colmenas e historial.

:::danger
No borres el almacenamiento si tienes cambios solo locales que aún no han llegado al servidor (por ejemplo, inspecciones registradas en el campo estando sin señal). Esas ediciones existen solo en ese dispositivo hasta que se complete la sincronización. Conéctate y deja que la sincronización termine primero.
:::

## La cámara y el escáner QR no funcionan

Cada colmena puede llevar una etiqueta QR imprimible que enlaza directamente a esa colmena (consulta [Etiquetas QR](/using-the-app/qr-labels)). El escaneo necesita acceso a la cámara.

- **Concede permiso de cámara.** Cuando se te solicite, permite el acceso a la cámara. Si lo denegaste antes, vuelve a habilitarlo en la configuración de tu navegador o sistema operativo para el sitio, y luego recarga.
- **Usa HTTPS.** Los navegadores solo permiten el acceso a la cámara en orígenes seguros. La aplicación alojada se sirve por HTTPS; quienes se autoalojan deben servir también por HTTPS (o `localhost` para pruebas). Consulta [Proxy inverso](/self-hosting/reverse-proxy).
- **Comprueba que no esté en uso.** Cierra otras aplicaciones o pestañas que puedan estar ocupando la cámara.

:::tip iOS Safari
En iPhone y iPad el escáner integrado en la aplicación puede estar restringido. Si el escaneo no funciona, abre la **app Cámara** integrada y apúntala al código QR. iOS reconoce el enlace codificado y ofrece abrirlo; al tocar el enlace se inicia Openbeehive en la colmena correcta. La etiqueta codifica un enlace web sencillo, así que cualquier lector de QR sirve como alternativa.
:::

## Problemas de inicio de sesión

- **Atascado en la pantalla de inicio de sesión.** Confirma que estás llegando a la dirección correcta (la aplicación alojada está en app.openbeehive.org). Tras iniciar sesión con tu proveedor deberías ser redirigido de vuelta automáticamente; si no, recarga la página.
- **La redirección falla o errores de "redirección no válida" (autoalojamiento).** Esto casi siempre significa que la URL de redirección OIDC o `BEEHIVE_PUBLIC_BASE_URL` está mal configurada. Consulta [Autenticación y configuración](/self-hosting/authentication).
- **No se ofrece la clave de acceso.** WebAuthn/las claves de acceso deben estar habilitadas y debes haber registrado una clave de acceso en ese dispositivo. Si no está disponible, inicia sesión con tu proveedor habitual.
- **Autoalojamiento de un solo usuario sin inicio de sesión.** Si lo ejecutas sin proveedores OIDC y con WebAuthn desactivado, no hay ningún paso de inicio de sesión. Si ves inesperadamente una pantalla de inicio de sesión, revisa la configuración de tu servidor.

## Presentar un buen informe de error

Si nada de lo anterior ayuda, por favor abre una incidencia en [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Un informe claro consigue un arreglo más rápido. Intenta incluir:

| Detalle | Ejemplo |
| --- | --- |
| Qué hiciste | "Pulsé Guardar en una nueva inspección" |
| Qué esperabas | "La inspección aparece en la línea de tiempo de la colmena" |
| Qué ocurrió en su lugar | "Un indicador de carga y luego la entrada desapareció" |
| Versión de la aplicación | v0.1.0 (mostrada en la pantalla Acerca de de la aplicación) |
| Plataforma y navegador | iPhone 14, iOS 17, Safari |
| Alojada o autoalojada | Autoalojada, perfil `selfhost`, SQLite |
| En línea o sin conexión | "Estaba sin conexión en el campo, sincronizando ahora" |
| ¿Reproducible? | "Pasa siempre" / "Solo una vez" |

:::caution
Por favor, no pegues secretos. Oculta los secretos de sesión, los secretos de cliente OIDC, las contraseñas de bases de datos y los datos personales antes de compartir registros o configuración.
:::

Para preguntas de autoalojamiento sobre bases de datos, almacenamiento, autenticación y variables de entorno, la [sección de Autoalojamiento](/category/self-hosting) y la [referencia de configuración](/self-hosting/configuration) son los mejores puntos de partida. Consulta también las [Preguntas frecuentes](/knowledge-base/faq).
