---
sidebar_position: 1
title: "Vision general de la API"
---

# La API de Openbeehive

Openbeehive es **API-first y abierta**. No hay un backend oculto: todo
lo que hace la aplicacion — crear colmenares, registrar inspecciones, sincronizar dispositivos,
leer estadisticas — pasa por una unica API **Connect-RPC** publica. El mismo
contrato que impulsa la aplicacion esta disponible para ti.

Esa apertura es deliberada. Tus registros son tuyos, asi que deberias poder
leerlos, automatizarlos con scripts, alimentarlos desde tus propios sensores y llevarlos a otro lugar
sin pedir permiso a nadie.

## Un contrato, dos protocolos

La API se define una sola vez como un contrato de [Protocol Buffers](https://protobuf.dev/)
y se sirve con [Connect-RPC](https://connectrpc.com/). Eso significa que **cada
endpoint es accesible de dos formas**, desde la misma URL:

| Estilo | Ideal para | Pagina |
| --- | --- | --- |
| **HTTP + JSON** (estilo REST) | curl, scripts, webhooks, microcontroladores, integraciones rapidas | [REST / HTTP + JSON](/using-the-api/rest) |
| **gRPC / gRPC-Web / Connect** | clientes tipados, streaming, sincronizacion de alto volumen | [gRPC](/using-the-api/grpc) |

No eliges un protocolo en el servidor — lo eliges por solicitud, mediante las
cabeceras que envias. Escoge el que sea mas facil para tu herramienta.

## URL base

La API es servida por el mismo proceso que sirve la aplicacion:

- Servicio alojado: `https://app.openbeehive.org`
- Autoalojado: tu propio origen, p. ej. `https://bees.example.com` (consulta
  [Autoalojamiento](/category/self-hosting))

Cada metodo reside en una ruta predecible:

```
POST <base-url>/openbeehive.v1.<Service>/<Method>
```

Por ejemplo: `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`.

## Servicios

El contrato se agrupa en servicios. Cada uno se corresponde con una parte del dominio que
ya conoces de la aplicacion:

| Servicio | Que abarca |
| --- | --- |
| `ApiaryService` | Crear, leer, actualizar, eliminar y listar colmenares |
| `HiveService` | Colmenas, incluido el traslado de una colmena entre colmenares |
| `QueenService` | Reinas y su historial de reinado |
| `InspectionService` | Inspecciones / visitas (incl. temperatura y humedad), URLs para subir fotos |
| `TreatmentService` | Tratamientos / el Bestandsbuch (producto, lote, dosis, periodo de espera) |
| `TaskService` | Tareas y recordatorios |
| `EventService` | El feed de eventos / historial de solo adicion (append-only) |
| `StatsService` | Totales del panel y estadisticas de miel |
| `SyncService` | `Pull`, `Push` y un `Subscribe` en streaming — el motor de sincronizacion offline-first |

:::note Estado de implementacion (v0.1.0)
`ApiaryService` y `SyncService` estan completamente conectados del lado del servidor hoy. Los demas
servicios estan definidos en el contrato y siguen la misma forma; se estan
completando. Consulta el [contrato](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
para ver la fuente de verdad actual, y las
[notas de la version](https://github.com/openbeehive-org/openbeehive-app/releases) para saber que esta
en funcionamiento.
:::

## Autenticacion

- **Autoalojado, un solo usuario:** cuando no hay inicio de sesion configurado, la API esta abierta a
  la instancia (eres el unico usuario). Esta es la configuracion mas sencilla para servidores
  domesticos y scripts. Consulta [Autenticacion](/self-hosting/authentication).
- **Con inicio de sesion habilitado / el servicio alojado:** las solicitudes llevan una sesion
  establecida mediante OIDC o una passkey. Enviala como un token bearer:
  `Authorization: Bearer <token>`. Los tokens de API programaticos para clientes desatendidos
  (scripts, sensores) estan en la hoja de ruta — hasta entonces, el autoalojamiento en
  modo de un solo usuario es el camino sin friccion para la automatizacion.

## Como la usa la propia aplicacion

La aplicacion es **offline-first**: escribe primero en una base de datos local y el
motor de sincronizacion reconcilia con el servidor a traves de `SyncService.Push` / `Pull`.
Los servicios CRUD (`ApiaryService`, `InspectionService`, …) son los
puntos de entrada con autoridad del servidor que se usan para integraciones directas, exportacion y
automatizacion. Ambas vistas se apoyan en los mismos datos — consulta
[Offline y sincronizacion](/using-the-app/offline-and-sync) y la
[arquitectura para desarrolladores](/developers/architecture).

## Que puedes construir

- Extraer tus datos a una hoja de calculo, cuaderno o panel de BI.
- Automatizar ediciones masivas o migraciones desde otra herramienta de apicultura.
- Alimentar lecturas desde **rastreadores automatizados** — basculas de colmena, sensores de temperatura y
  humedad — directamente en las inspecciones. Consulta
  [Rastreadores automatizados](/using-the-api/automated-trackers).
- Construir tu propio cliente, bot o widget movil contra un contrato estable y tipado.

Listo para los detalles? Empieza con [REST / HTTP + JSON](/using-the-api/rest).
