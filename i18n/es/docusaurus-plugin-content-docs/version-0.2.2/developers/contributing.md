---
sidebar_position: 7
title: "Contribuir y configuración de desarrollo"
---

# Contribuir y configuración de desarrollo

Openbeehive es software libre y de código abierto, y damos la bienvenida a
contribuciones de todos los tamaños, desde corregir una errata hasta construir una
nueva funcionalidad. Esta página te lleva desde un clon recién hecho hasta un
entorno de desarrollo en funcionamiento, y luego explica las convenciones que
mantienen sano el código base.

El proyecto está licenciado bajo **AGPL-3.0**. Al contribuir, aceptas que tu
trabajo se publica bajo la misma licencia.

:::tip Por dónde empezar
Explora las incidencias abiertas en GitHub, y lee el `CONTRIBUTING.md` en el
repositorio principal antes de abrir un pull request. Los PR pequeños y enfocados
son mucho más fáciles de revisar y fusionar.
:::

## Los repositorios

Openbeehive está repartido en unos pocos repositorios bajo
[github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app):

| Repositorio | Qué contiene |
| --- | --- |
| `openbeehive` | La aplicación: backend de Go y frontend PWA de SvelteKit |
| `openbeehive-site` | El sitio de marketing en openbeehive.org |
| `openbeehive-docs` | Este sitio de documentación (Docusaurus) |

La mayoría de las contribuciones de código aterrizan en el repositorio principal
`openbeehive`. Los cambios de documentación pertenecen a `openbeehive-docs`.

## Requisitos previos

Necesitarás:

- **Go 1.25+** - para el backend
- **Node 22+** - para el frontend de SvelteKit
- **buf** - para generar código a partir de las definiciones de Protocol Buffer

Se asume un `make` funcional (cualquier GNU Make reciente). En Windows recomendamos
WSL2.

## Cómo configurarlo

Clona el repositorio y genera primero el código protobuf, luego inicia el servidor
y la app en dos terminales separados.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate Go + TypeScript code from the .proto files
make proto

# Terminal 1 - run the Go backend
make run-server

# Terminal 2 - run the SvelteKit app in dev mode
make dev-app
```

`make run-server` lee su configuración de tu entorno (o de un archivo `.env`).
Para el desarrollo local los valores por defecto funcionan sin más: una base de
datos SQLite y el sistema de archivos local para los blobs. Consulta
[Configuración](/self-hosting/configuration) para la lista completa de variables.

Para una configuración de un solo desarrollador puedes dejar `BEEHIVE_OIDC_PROVIDERS`
vacío y `BEEHIVE_WEBAUTHN_ENABLED=false` para omitir el login por completo.

:::note Compilar desde el código fuente
Para producir un binario de versión en lugar de un servidor de desarrollo, ejecuta
`make proto && make build`, que escribe `./server/bin/openbeehive`. Consulta
[Binario único](/self-hosting/single-binary) para los detalles de despliegue.
:::

## Arquitectura en un minuto

Si eres nuevo en el código base, repasa primero [Arquitectura](/developers/architecture)
y el [Modelo de datos](/developers/data-model). La versión breve:

- El frontend es **offline-first**. Posee una base de datos SQLite-WASM local
  (almacenada en OPFS) y es totalmente usable sin conexión de red.
- Los cambios se sincronizan al servidor en segundo plano usando
  [Relojes Lógicos Híbridos y CRDTs](/developers/sync-protocol), de modo que las
  ediciones concurrentes se fusionan sin conflictos.
- La API se define con **Connect-RPC** (gRPC y HTTP/JSON), generada a partir de
  archivos `.proto`.

## Convenciones clave

Estas convenciones importan para la corrección, no solo para el estilo. Por favor,
síguelas.

### 1. Los archivos `.proto` son la fuente de verdad

La superficie de la API, las formas de los mensajes y los enums están todos
definidos en Protocol Buffers. Nunca edites a mano el código generado. Cambia el
`.proto`, ejecuta `make proto`, y deja que el Go y el TypeScript generados sigan.

### 2. Las escrituras pasan por el repositorio local, no por CRUD

El cliente **no** llama al servidor para crear o actualizar registros
directamente. En su lugar, todas las escrituras pasan por la capa de repositorio
local, que registra el cambio localmente y deja que el motor de sincronización lo
propague. Esto es lo que hace que la app sea instantánea y capaz de funcionar sin
conexión.

:::caution
Si añades una ruta de escritura que habla con el servidor directamente, rompes el
soporte sin conexión y eludes la lógica de fusión. Enruta cada escritura a través
del repositorio local.
:::

### 3. Mantén `merge.go` y `merge.ts` sincronizados

Las reglas de fusión — last-writer-wins por campo para escalares, OR-Sets add-wins
para campos de lista, eventos append-only — están implementadas **dos veces**: una
en el servidor (`merge.go`) y otra en el cliente (`merge.ts`). Deben comportarse de
forma idéntica.

Cualquier cambio en la semántica de fusión tiene que hacerse en ambos archivos,
con pruebas coincidentes. Una divergencia aquí hace que los datos se fusionen de
forma distinta en cliente y servidor, lo cual es un error grave. Consulta
[Protocolo de sincronización](/developers/sync-protocol) para las reglas.

### 4. Escribe SQL portable

El backend admite **PostgreSQL, MySQL y SQLite** como bases de datos
intercambiables. Mantén el SQL portable entre los tres - evita la sintaxis
específica de un motor, y prueba los cambios de esquema contra más de un
controlador cuando puedas. Consulta [Bases de datos](/self-hosting/databases).

### 5. Inglés en el código, traducciones para los usuarios

Escribe todo el código, comentarios, identificadores y mensajes de commit en
**inglés**.

Sin embargo, todo lo que ve un usuario debe ser traducible. Cuando añadas o
cambies una cadena visible para el usuario, proporciona traducciones para todos los
idiomas soportados:

| Idioma (locale) | Idioma |
| --- | --- |
| `en` | Inglés |
| `de` | Alemán |
| `fr` | Francés |
| `es` | Español |
| `it` | Italiano |

Si no te sientes seguro en un idioma, añade el texto en inglés y márcalo en tu PR
para que un hablante nativo pueda ayudar.

## Abrir un pull request

1. Haz un fork del repositorio y crea una rama para tu cambio.
2. Asegúrate de haber ejecutado `make proto` si tocaste algún `.proto`.
3. Ejecuta la suite de pruebas y los linters localmente.
4. Mantén el PR enfocado y describe qué cambia y por qué.
5. Para cambios de lógica de fusión, sincronización o esquema, indícalo
   explícitamente para que los revisores sepan que deben mirar con atención.

Lee las directrices completas en
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md).

Gracias por ayudar a mejorar los registros apícolas para todos. Si te atascas,
abre una discusión o una incidencia en GitHub - estaremos encantados de ayudar.
