---
sidebar_position: 6
title: "Códigos QR y deep links"
---

# Códigos QR y deep links

Cada colmena puede llevar una etiqueta QR impresa. Escanearla abre la aplicación
en esa colmena. El código está en `app/src/lib/qr.ts`,
`app/src/lib/components/QrLabel.svelte`, `app/src/routes/h/[id]/+page.svelte` y
`app/src/routes/(app)/scan/+page.svelte`.

## Qué codifica un QR de colmena

```text
<base>/h/<hiveId>
```

- `<base>` es `BEEHIVE_PUBLIC_URL` si se definió al compilar la SPA (Vite
  expone las variables `BEEHIVE_*`); en caso contrario, el origen en el que se
  ejecuta la aplicación. Una instancia autoalojada imprime por tanto códigos que
  apuntan a sí misma.
- `<hiveId>` es el UUID de la colmena, acuñado en el dispositivo cuando se crea
  la colmena y nunca reasignado, así que una etiqueta impresa sigue siendo válida.

El id codifica una colmena, no un permiso. Conocer un id no concede nada; la
colmena solo se resuelve si su colmenar se ha sincronizado con el dispositivo.

## Cómo se resuelve `/h/[id]`

La ruta es un resolvedor, no una página:

1. Busca el id en la base de datos local (`hives.get`).
2. Si falta y el navegador está en línea, ejecuta `syncOnce()` y vuelve a buscar.
3. Si se encuentra, `goto('/hives/<id>')` con `replaceState`.
4. En caso contrario muestra "no encontrada" (en línea) o "sin conexión" (sin conexión).

```text
scan QR -> /h/<id> -> local lookup
                          |
              found ------+------ not found
                |                    |
          /hives/<id>          online? sync, re-check
                                     |
                          found -> /hives/<id>
                          still missing -> "not found" / "offline"
```

Una colmena que ya está en el dispositivo se resuelve sin ningún viaje de ida y
vuelta por la red.

## Renderizado e impresión

`qrSvg(text, size)` renderiza el QR como una cadena SVG en el dispositivo usando
el paquete `qrcode` con nivel de corrección de errores H, coloca la marca de
Openbeehive en el centro y el nombre de la marca debajo. No interviene ninguna
llamada de red.

`shortCode(hiveId)` son los seis primeros caracteres del id sin guiones, en
mayúsculas. Se imprime bajo el QR como leyenda legible y se usa en el nombre del
archivo SVG. Es solo para mostrar; nada enruta sobre él y no es una columna de la
base de datos.

`QrLabel` muestra el QR con el nombre de la colmena y el código corto, abre una
ventana de impresión limpia (`Print`) y descarga el SVG (`SVG`). Aparece en la
página de detalle de la colmena `/hives/[id]`.

## Análisis de las cargas escaneadas

`parseHiveId(payload)` acepta tres formas y devuelve el id o `null`:

| Entrada | Ejemplo |
| --- | --- |
| Cualquier URL que contenga `/h/<id>` | `https://bees.example.com/h/2b1f6c0e-...` |
| Esquema personalizado | `openbeehive://hive/2b1f6c0e-...` |
| UUID sin más | `2b1f6c0e-...` |

El esquema personalizado se analiza, pero nada en la aplicación lo genera; las
etiquetas impresas usan siempre la forma `https://` para que se abran en un
navegador cuando la aplicación no está instalada.

## Escáner dentro de la aplicación

`/scan` usa la API `BarcodeDetector` del navegador (`formats: ['qr_code']`)
sobre un flujo de vídeo de la cámara trasera y llama a `parseHiveId` con cada
código detectado, y luego navega a `/hives/<id>`. Donde `BarcodeDetector` no está
disponible (Safari en iOS), la página muestra un mensaje de "no compatible" y la
forma de escanear es la aplicación de cámara del teléfono; el QR es una URL
plana y abre la misma ruta. Para esas plataformas podría incorporarse una
biblioteca de decodificación como `@zxing/browser`; no se incluye ninguna.

El escáner necesita permiso de cámara y un contexto seguro (HTTPS o
`localhost`).

## Envoltorios de aplicación nativa

La aplicación es una PWA y no existe ningún envoltorio nativo. Si construyes uno,
la ruta `/h/*` es la que hay que reclamar con App Links de Android o Universal
Links de iOS; el servidor no sirve `/.well-known/assetlinks.json` ni
`/.well-known/apple-app-site-association`, así que tendrías que añadirlos tú
mismo en el proxy inverso.
