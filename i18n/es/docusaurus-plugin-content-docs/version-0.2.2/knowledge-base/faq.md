---
sidebar_position: 5
title: "Preguntas frecuentes"
---

# Preguntas frecuentes

Respuestas rápidas a las preguntas que oímos con más frecuencia. Si falta algo, consulta la [guía de resolución de problemas](/knowledge-base/troubleshooting) o pregunta a la comunidad en [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## ¿Es Openbeehive gratuito?

Sí. Openbeehive es de código abierto bajo la licencia **AGPL-3.0**, así que eres libre de usarlo, estudiarlo, modificarlo y autoalojarlo.

El servicio alojado en [app.openbeehive.org](https://app.openbeehive.org) es gratuito por ahora, mientras el proyecto es joven. Si eso cambiara alguna vez, siempre podrás exportar tus datos y ejecutar tu propia instancia en su lugar.

## ¿Son privados mis datos?

Tus registros viven primero en tu propio dispositivo. Openbeehive es **offline-first**: la aplicación almacena todo en una base de datos local en tu teléfono, tableta u ordenador, y solo sincroniza con el servidor en segundo plano.

Si te autoalojas, tus datos nunca salen de tu propia infraestructura. En el servicio alojado, tus registros se almacenan en nuestros servidores para que puedan sincronizarse entre tus dispositivos, pero siguen siendo tuyos.

:::tip
¿Quieres control total? Consulta [Autoalojamiento](/category/self-hosting) para ejecutar Openbeehive en tu propio hardware.
:::

## ¿Funciona sin conexión?

Sí, por completo. Openbeehive es una Progressive Web App (PWA) que mantiene una copia completa de tus datos en el dispositivo. Leer y escribir registros es local e instantáneo, así que funciona perfectamente en un colmenar sin señal.

Cuando recuperas la conectividad, tus cambios se sincronizan automáticamente. Más información en [Sin conexión y sincronización](/using-the-app/offline-and-sync).

## ¿Funciona en mi teléfono?

Sí. Openbeehive se ejecuta en cualquier navegador moderno y puede instalarse en tu pantalla de inicio para que se comporte como una aplicación. Funciona en teléfonos, tabletas y ordenadores de escritorio. Consulta [Instalar la aplicación](/using-the-app/install) para conocer los pasos en cada plataforma.

## ¿Hay una aplicación nativa?

Hoy no hay una aplicación nativa independiente en la App Store ni en la Play Store, y no la necesitas. La PWA instalable te ofrece un icono de aplicación, uso sin conexión y modo de pantalla completa en iOS, Android, Windows, macOS y Linux desde una única base de código.

## ¿Puedo exportar mis datos?

Sí. Como el proyecto es de código abierto y tus datos se almacenan en una base de datos SQLite estándar, nunca quedas atrapado.

- Quienes se **autoalojan** pueden hacer copia de seguridad de la base de datos directamente. Consulta [Copias de seguridad](/self-hosting/backups).
- En el **servicio alojado**, las herramientas de exportación forman parte de la hoja de ruta. Tus registros también se conservan localmente en cada dispositivo sincronizado.

## ¿Puedo autoalojarlo?

Por supuesto, y está diseñado para ser fácil. Hay dos perfiles de despliegue:

| Perfil | Mejor para | Pila tecnológica |
| --- | --- | --- |
| `selfhost` | Aficionados, un solo usuario | Un único binario, SQLite + archivos locales, sin necesidad de Docker |
| `cloud` | Multiusuario, instalaciones mayores | Docker, PostgreSQL + almacenamiento S3/MinIO |

Empieza con la [Guía de inicio rápido](/self-hosting/quick-start), o ve directamente a la [guía del binario único](/self-hosting/single-binary).

:::note
Para una instancia privada de un solo usuario puedes desactivar el inicio de sesión por completo. Consulta [Autenticación](/self-hosting/authentication).
:::

## ¿Cómo funciona la compartición?

La compartición se produce a nivel de **colmenar** mediante "ámbitos" (scopes). Cuando compartes un colmenar, las personas con quienes lo compartes pueden ver y contribuir a todo lo que contiene: sus colmenas, reinas, inspecciones, tareas y más.

La sincronización está libre de conflictos por diseño, así que dos personas editando el mismo colmenar en distintos dispositivos no se pisarán el trabajo. Las ediciones se fusionan limpiamente incluso tras largos periodos sin conexión. Los detalles técnicos se tratan en el [protocolo de sincronización](/developers/sync-protocol).

## ¿Qué tipos de colmena se admiten?

Openbeehive admite los sistemas de cuadro y de listones más comunes:

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Otro

Consulta [Tipos de colmena](/knowledge-base/hive-types) para orientación sobre cómo elegir.

## ¿Cómo se marcan las reinas?

Openbeehive sigue el esquema internacional de colores de marcaje de reinas, basado en el último dígito del año:

| El año termina en | Color |
| --- | --- |
| 1 o 6 | Blanco |
| 2 o 7 | Amarillo |
| 3 o 8 | Rojo |
| 4 o 9 | Verde |
| 5 o 0 | Azul |

La aplicación elige el color correcto por ti automáticamente. Todos los detalles están en la página de [colores de marcaje de reinas](/knowledge-base/queen-marking-colours).

## ¿Para qué sirven las etiquetas QR?

Cada colmena puede tener una etiqueta QR imprimible. Al escanearla se abre Openbeehive directamente en esa colmena, para que puedas consultar sus registros en el colmenar sin teclear ni buscar. Consulta [Etiquetas QR](/using-the-app/qr-labels).

## ¿En qué idiomas está disponible?

Openbeehive se está construyendo pensando en la internacionalización, con el alemán y el inglés como primer foco dadas las raíces del proyecto. Los idiomas adicionales son bienvenidos como contribuciones de la comunidad.

## ¿Qué bases de datos y backends de almacenamiento se admiten?

Al autoalojar, el backend es modular:

- **Bases de datos:** PostgreSQL, MySQL o SQLite. Consulta [Bases de datos](/self-hosting/databases).
- **Almacenamiento de blobs:** almacenamiento de objetos compatible con MinIO/S3, o el sistema de archivos local. Consulta [Almacenamiento](/self-hosting/storage).

## ¿Cómo inicio sesión?

El servicio alojado usa inicio de sesión OIDC (iniciar sesión con un proveedor compatible), con claves de acceso opcionales (WebAuthn) para una experiencia sin contraseña. Quienes se autoalojan pueden configurar sus propios proveedores OIDC, habilitar claves de acceso o desactivar el inicio de sesión por completo para instalaciones de un solo usuario. Consulta [Autenticación](/self-hosting/authentication).

## ¿Cómo informo de un error o solicito una funcionalidad?

Por favor, abre una incidencia en nuestra [organización de GitHub](https://github.com/openbeehive-org/openbeehive-app). Unos pasos claros para reproducirlo, tu plataforma y navegador, y una captura de pantalla ayudan enormemente.

La [página de resolución de problemas](/knowledge-base/troubleshooting) puede que ya cubra problemas comunes.

## ¿Cómo puedo contribuir?

Las contribuciones de todo tipo son bienvenidas: código, documentación, traducciones, informes de errores e ideas. La pila es Go en el backend y una PWA en SvelteKit en el frontend.

Lee la [guía de contribución](/developers/contributing) para empezar, y echa un vistazo a la [visión general de la arquitectura](/developers/architecture) para entender cómo encajan las piezas.

## ¿Qué versión es esta?

La versión actual es la **v0.1.0**, nuestra primera versión pública. Espera mejoras rápidas, y consulta la [guía de actualización](/self-hosting/upgrading) cuando lleguen nuevas versiones.
