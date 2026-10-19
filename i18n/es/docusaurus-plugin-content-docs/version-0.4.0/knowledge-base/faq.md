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

Tus registros viven primero en tu propio dispositivo: la aplicación almacena todo en una base de datos local en tu teléfono, tableta u ordenador y sincroniza con el servidor en segundo plano.

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

Sí. **Ajustes → Datos y copia de seguridad** exporta todo lo que hay en tu dispositivo como copia completa en JSON, hoja de cálculo (XLSX), archivos CSV en un ZIP, BeeXML o un informe PDF imprimible, e importa JSON, BeeXML y CSV de otras aplicaciones. Consulta [Importar y exportar](/using-the-app/import-export). Quienes se autoalojan también pueden hacer copia de seguridad de la base de datos del servidor directamente; consulta [Copias de seguridad](/self-hosting/backups).

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

Los registros se comparten mediante **espacios** (tenants). Cada cuenta tiene un espacio personal y puede ser invitada a otros, por ejemplo el de un club. Todos los miembros de un espacio ven y editan todos sus colmenares, colmenas y registros; no hay compartición por colmenar. La sincronización está libre de conflictos, así que dos personas editando en el mismo espacio desde distintos dispositivos no se sobrescriben el trabajo. Consulta [Cuentas y espacios](/using-the-app/accounts-tenants).

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

La aplicación incluye cinco idiomas: inglés, alemán, francés, español e italiano. Cámbialo en **Ajustes → Idioma**. Otras traducciones son bienvenidas como contribuciones.

## ¿Qué bases de datos y backends de almacenamiento se admiten?

Al autoalojar, el backend es modular:

- **Bases de datos:** PostgreSQL, MySQL o SQLite. Consulta [Bases de datos](/self-hosting/databases).
- **Almacenamiento de blobs:** almacenamiento de objetos compatible con MinIO/S3, o el sistema de archivos local. Consulta [Almacenamiento](/self-hosting/storage).

## ¿Cómo inicio sesión?

El servicio alojado usa cuentas con correo electrónico y contraseña. Quienes se autoalojan pueden habilitar cuentas con correo y contraseña, añadir proveedores OIDC (Google, Keycloak, Authentik y similares), habilitar passkeys o desactivar el inicio de sesión por completo para una instalación de un solo usuario. Consulta [Autenticación](/self-hosting/authentication).

## ¿Cómo informo de un error o solicito una funcionalidad?

Por favor, abre una incidencia en nuestra [organización de GitHub](https://github.com/openbeehive-org/openbeehive-app). Unos pasos claros para reproducirlo, tu plataforma y navegador, y una captura de pantalla ayudan enormemente.

La [página de resolución de problemas](/knowledge-base/troubleshooting) puede que ya cubra problemas comunes.

## ¿Cómo puedo contribuir?

Las contribuciones de todo tipo son bienvenidas: código, documentación, traducciones, informes de errores e ideas. La pila es Go en el backend y una PWA en SvelteKit en el frontend.

## ¿Qué versión es esta?

Las versiones se etiquetan en [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Quienes se autoalojan ejecutan la etiqueta que compilaron o la etiqueta de imagen que descargaron; consulta la [guía de actualización](/self-hosting/upgrading) cuando lleguen nuevas versiones.
