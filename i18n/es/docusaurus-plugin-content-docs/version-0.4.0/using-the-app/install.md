---
sidebar_position: 11
title: "Instalar la aplicación"
---

# Instalar la aplicación

Openbeehive es una aplicación web progresiva (PWA). Eso significa que no necesitas una
tienda de aplicaciones, ni una descarga, ni una cuenta solo para empezar. La abres en tu
navegador y, con un solo toque, la añades a tu dispositivo para que se comporte como
cualquier otra aplicación: su propio icono, una ventana a pantalla completa y soporte
completo sin conexión.

Instalarla es opcional pero recomendable. Una vez instalada, la aplicación se inicia al
instante, oculta la barra de direcciones del navegador y mantiene tus registros
disponibles incluso cuando estás en el colmenar sin cobertura.

## Qué obtienes al instalarla

- **Un icono de aplicación** en tu pantalla de inicio o en tu lanzador de aplicaciones.
- **Una ventana a pantalla completa** sin la interfaz del navegador, así que hay más sitio
  para tus colmenas e inspecciones.
- **Acceso sin conexión.** Tus registros viven en una base de datos local en el
  dispositivo y se sincronizan en segundo plano. Consulta
  [Sin conexión y sincronización](/using-the-app/offline-and-sync).
- **Escaneo QR rápido.** Escanear la [etiqueta QR](/using-the-app/qr-labels) de una colmena
  abre esa colmena.

:::tip
Puedes seguir usando Openbeehive en una pestaña normal del navegador sin instalarlo. Las
funciones son las mismas; instalarlo solo hace que se sienta como una aplicación nativa y
es más práctico sobre el terreno.
:::

## Instalar en iPhone y iPad (Safari)

1. Abre **Safari** y ve a [app.openbeehive.org](https://app.openbeehive.org).
2. Pulsa el botón **Compartir** (el cuadrado con una flecha hacia arriba).
3. Desplázate hacia abajo y pulsa **Añadir a la pantalla de inicio**.
4. Ajusta el nombre si quieres, luego pulsa **Añadir**.

El icono de Openbeehive queda ahora en tu pantalla de inicio. Iníciala desde ahí para
obtener la experiencia a pantalla completa y sin conexión.

:::note
En iOS la opción de instalación está en el menú Compartir de Safari. Otros navegadores en
iPhone y iPad no pueden instalar aplicaciones web, así que usa Safari para este paso.
:::

## Instalar en Android (Chrome)

1. Abre **Chrome** y ve a [app.openbeehive.org](https://app.openbeehive.org).
2. Pulsa el **menú** (tres puntos) en la esquina superior derecha.
3. Pulsa **Instalar aplicación** (o **Añadir a la pantalla de inicio**).
4. Confirma pulsando **Instalar**.

También puede que veas un aviso o banner que ofrezca instalar Openbeehive directamente.
Pulsarlo hace lo mismo.

## Instalar en escritorio (Chrome, Edge y otros)

En la mayoría de los navegadores de escritorio, aparece un icono de instalación en el
extremo derecho de la barra de direcciones cuando visitas la aplicación.

1. Ve a [app.openbeehive.org](https://app.openbeehive.org).
2. Haz clic en el **icono de instalación** en la barra de direcciones (a menudo parece un
   pequeño monitor o una flecha hacia abajo dentro de una bandeja).
3. Haz clic en **Instalar** para confirmar.

Si no ves el icono, abre el menú del navegador y busca **Instalar Openbeehive** o
**Aplicaciones -> Instalar este sitio como aplicación**. La aplicación se abre entonces en
su propia ventana y aparece junto a tus demás aplicaciones.

| Plataforma | Navegador | Dónde encontrar la opción de instalación |
| --- | --- | --- |
| iOS / iPadOS | Safari | Menú Compartir -> Añadir a la pantalla de inicio |
| Android | Chrome | Menú (tres puntos) -> Instalar aplicación |
| Windows / Linux | Chrome / Edge | Icono de instalación en la barra de direcciones |
| macOS | Chrome / Edge | Icono de instalación en la barra de direcciones |
| macOS | Safari | Archivo -> Añadir al Dock |

## Instalar una instancia autoalojada

Si ejecutas tu propio servidor de Openbeehive, la aplicación se instala exactamente de la
misma manera. Solo apunta tu navegador a la dirección de tu propio servidor en lugar de al
servicio alojado, y luego sigue los mismos pasos de arriba para tu plataforma.

Por ejemplo, abre tu instancia en su `BEEHIVE_PUBLIC_BASE_URL` (como
`https://bees.example.com`) y usa **Añadir a la pantalla de inicio** o la opción de
instalación del navegador. La aplicación instalada habla entonces con tu servidor, y tus
registros se quedan en tu propia infraestructura.

:::caution
Para que la instalación funcione sin problemas, una instancia autoalojada debería servirse
a través de **HTTPS** con un certificado válido. La mayoría de los navegadores solo ofrecen
la instalación de PWA en orígenes seguros. Consulta [Proxy inverso](/self-hosting/reverse-proxy) para ver cómo poner
TLS delante de tu servidor.
:::

Si te autoalojas, la sección [Autoalojamiento](/category/self-hosting) recorre el
despliegue, la configuración y las copias de seguridad.

## Actualizar la aplicación

La PWA se actualiza sola. Cuando se publica una nueva versión, la aplicación la descarga en
segundo plano y la aplica la próxima vez que la inicias o la recargas. No necesitas
reinstalar. Si alguna vez quieres asegurarte de que estás en la última versión, cierra del
todo la aplicación y vuelve a abrirla.

## Eliminar la aplicación

Desinstalar la PWA elimina solo el acceso directo de la aplicación y su caché local; no
borra los registros que ya se han sincronizado con el servidor. Para desinstalar:

- **iOS / Android:** mantén pulsado el icono, luego elige **Eliminar** o
  **Desinstalar**.
- **Escritorio:** abre la aplicación, luego usa el menú de su ventana (o los ajustes de
  aplicaciones del navegador) y elige **Desinstalar**.

:::caution
Si tienes registros que aún no se han sincronizado cuando desinstalas, viven solo en la
base de datos local del dispositivo y pueden perderse. Asegúrate de que la aplicación se ha
sincronizado antes de eliminarla. Consulta [Sin conexión y sincronización](/using-the-app/offline-and-sync).
:::
