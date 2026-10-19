---
sidebar_position: 3
title: "gRPC"
---

# gRPC

El servidor está construido con [Connect-RPC](https://connectrpc.com/), así
que los mismos handlers responden a gRPC (HTTP/2), gRPC-Web y el protocolo
Connect. Escucha con h2c, por lo que gRPC funciona sin TLS delante; en
producción un proxy inverso termina el TLS.

## Generar un cliente

El contrato vive en
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
y se compila con [buf](https://buf.build). El `buf.gen.yaml` del repositorio
genera Go (`protocolbuffers/go` + `connectrpc/go`) en `server/internal/gen` y
TypeScript (`bufbuild/es` v2) en `app/src/lib/proto`. Ambos directorios de
salida están en el gitignore; ejecuta `make proto` después de clonar. Para otro
lenguaje, copia el directorio `proto/` y apunta tu propio `buf.gen.yaml` a los
plugins que necesites.

## Go

```go
import (
    "connectrpc.com/connect"
    obv1 "github.com/openbeehive-org/openbeehive-app/server/internal/gen/openbeehive/v1"
    "github.com/openbeehive-org/openbeehive-app/server/internal/gen/openbeehive/v1/openbeehivev1connect"
)

client := openbeehivev1connect.NewApiaryServiceClient(http.DefaultClient, "https://bees.example.com")
req := connect.NewRequest(&obv1.ListApiariesRequest{})
req.Header().Set("Authorization", "Bearer "+token)
res, err := client.ListApiaries(ctx, req)
```

Cada uno de los diez servicios tiene su propio constructor de cliente
(`NewApiaryServiceClient`, `NewHiveServiceClient`, `NewQueenServiceClient`,
`NewInspectionServiceClient`, `NewTaskServiceClient`,
`NewTreatmentServiceClient`, `NewHarvestServiceClient`,
`NewEventServiceClient`, `NewStatsServiceClient`, `NewSyncServiceClient`).
Una báscula de colmena, por ejemplo, publica a través de `InspectionService`:

```go
insp := openbeehivev1connect.NewInspectionServiceClient(http.DefaultClient, "https://bees.example.com")
req := connect.NewRequest(&obv1.CreateInspectionRequest{HiveId: hiveID, WeightKg: 42.5, TempHive: 34.2})
req.Header().Set("Authorization", "Bearer "+token)
res, err := insp.CreateInspection(ctx, req)
```

El paquete generado es `internal` al módulo del servidor, así que un programa
Go aparte tiene que generar su propia copia a partir de los archivos `.proto`.

## TypeScript

El propio cliente de la aplicación está en `app/src/lib/client.ts`:

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SyncService } from './proto/openbeehive/v1/sync_pb';

const transport = createConnectTransport({ baseUrl: origin, interceptors: [authInterceptor] });
export const syncClient = createClient(SyncService, transport);
```

`authInterceptor` establece `Authorization: Bearer <token>` a partir de la
sesión almacenada.

## Desde la shell

[`buf curl`](https://buf.build/docs/curl) habla los tres protocolos usando el
esquema del repositorio:

```bash
cd openbeehive-app
buf curl --schema . \
  --header "Authorization: Bearer $TOKEN" \
  --data '{"apiaryId":"2b1f6c0e-..."}' \
  https://bees.example.com/openbeehive.v1.HiveService/ListHives
```

Añade `--protocol grpc` para forzar gRPC en lugar de Connect.

## Autenticación

Envía una clave API (`obhk_...`, creada en **Ajustes → Claves API**) o un
token de sesión como cabecera `Authorization: Bearer <token>` (metadatos
gRPC); `token` en los fragmentos anteriores es cualquiera de los dos. La
cookie `obh_session` también se acepta para los tokens de sesión. El mismo
interceptor verifica ambos tipos y cubre por igual las llamadas unarias y el
stream `Subscribe`. Una instancia sin ningún método de inicio de sesión
configurado no necesita cabecera. Consulta la
[visión general](./overview.md#authentication).

## Subscribe

```protobuf
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

El servidor sondea su contador global de cambios cada dos segundos y envía un
`SubscribeEvent` cada vez que el contador ha avanzado más allá del cursor que
enviaste (y del último valor que envió). El evento no lleva datos; llama a
`Pull` con tu cursor almacenado cuando recibas uno. Las filas fuera de tus
ámbitos también hacen avanzar el contador, así que un `Pull` tras un evento
puede volver vacío.

La aplicación no usa `Subscribe`. Hace push y pull cada 15 segundos, tras cada
escritura local y en el evento `online` del navegador.
