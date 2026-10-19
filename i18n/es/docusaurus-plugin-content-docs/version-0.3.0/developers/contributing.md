---
sidebar_position: 7
title: "Contribuir y configuración de desarrollo"
---

# Contribuir y configuración de desarrollo

Openbeehive está licenciado bajo **AGPL-3.0**. Al contribuir, aceptas que tu
trabajo se publica bajo la misma licencia. Lee
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md)
en el repositorio de la aplicación antes de abrir un pull request.

## Los repositorios

| Repositorio | Contenido |
| --- | --- |
| [`openbeehive-app`](https://github.com/openbeehive-org/openbeehive-app) | La aplicación: contrato proto, backend en Go, PWA en SvelteKit |
| [`openbeehive-site`](https://github.com/openbeehive-org/openbeehive-site) | El sitio de marketing en openbeehive.org |
| [`openbeehive-docs`](https://github.com/openbeehive-org/openbeehive-docs) | Este sitio de documentación (Docusaurus) |

## Requisitos previos

- **Go 1.25+** para el backend
- **Node 24+** para la aplicación SvelteKit (el Dockerfile compila con `node:24-alpine`)
- **buf** para generar código a partir de los archivos `.proto`
- GNU Make; en Windows usa WSL2

## Cómo configurarlo

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive-app

make proto        # generate Go + TypeScript stubs from proto/
make run-server   # terminal 1: Go backend on :8080 (loads .env if present)
make dev-app      # terminal 2: Vite dev server on :5173
```

`make run-server` lee su configuración del entorno o de un archivo `.env` en la
raíz del repositorio (copia `.env.example`). Los valores por defecto te dan
SQLite y blobs en el sistema de archivos; deja `BEEHIVE_PASSWORD_AUTH`
desactivado, `BEEHIVE_OIDC_PROVIDERS` vacío y `BEEHIVE_WEBAUTHN_ENABLED=false`
para ejecutar sin inicio de sesión. Consulta [Configuración](/self-hosting/configuration).

Para compilar un binario de versión: `make proto && make build` escribe
`server/bin/openbeehive` con la SPA embebida. Consulta
[Binario único](/self-hosting/single-binary).

## Código generado

`make proto` ejecuta `buf generate` con el `buf.gen.yaml` del repositorio:

| Salida | Plugins |
| --- | --- |
| `server/internal/gen/` | `protocolbuffers/go`, `connectrpc/go` |
| `app/src/lib/proto/` | `bufbuild/es` v2 (mensajes y descriptores de servicio) |

Ambos directorios están en el gitignore. Ejecuta `make proto` después de clonar
y tras cada cambio en un `.proto`; nunca edites la salida a mano. La compilación
de Docker ejecuta `buf generate` por sí misma en su primera etapa. Todos los
servicios de los protos están registrados en el servidor; consulta
[Uso de la API](/using-the-api/overview) para la lista.

## Convenciones

1. **Los archivos `.proto` son la fuente de verdad.** Cambia el contrato,
   regenera y luego implementa.
2. **Las escrituras pasan por el repositorio local.** La aplicación escribe en
   su base de datos SQLite local a través de `app/src/lib/local/repo.ts` y deja
   que el motor de sincronización envíe el cambio. No añadas código de interfaz
   que llame directamente a los servicios CRUD (`ApiaryService`,
   `InspectionService`, ...); existen para scripts e integraciones, y una
   llamada desde la interfaz se saltaría la base de datos local y el outbox,
   así que el cambio no sería visible sin conexión.
3. **Mantén `merge.go` y `merge.ts` idénticos.** El last-writer-wins por campo
   y el OR-Set add-wins están implementados en `server/internal/sync/merge.go`
   y `app/src/lib/local/merge.ts`. Cambia ambos, con pruebas. Consulta el
   [protocolo de sincronización](/developers/sync-protocol).
4. **Escribe SQL portable.** El servidor funciona con PostgreSQL, MySQL y
   SQLite. Las migraciones usan el subconjunto portable descrito al inicio de
   `0001_init.sql`; el store traduce las diferencias de dialecto restantes.
   Consulta [Bases de datos](/self-hosting/databases).
5. **Inglés en el código, traducciones para los usuarios.** El código, los
   comentarios, los identificadores y los mensajes de commit van en inglés.
   Toda cadena visible para el usuario pasa por `svelte-i18n` con entradas en
   `app/src/lib/i18n/locales/{en,de,fr,es,it}.json`. Si no puedes traducir,
   añade el texto en inglés e indícalo en el PR.

## Abrir un pull request

1. Haz un fork y crea una rama.
2. Ejecuta `make proto` si tocaste un `.proto`.
3. Ejecuta las pruebas de Go (`cd server && go test ./...`) y las comprobaciones de la aplicación.
4. Mantén el PR enfocado y describe qué cambia y por qué.
5. Indica explícitamente los cambios de lógica de fusión, sincronización o esquema.
