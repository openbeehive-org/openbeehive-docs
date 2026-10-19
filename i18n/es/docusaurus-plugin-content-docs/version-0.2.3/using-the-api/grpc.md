---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Para clientes tipados, streaming y sincronizacion de alto volumen, comunicate con
Openbeehive a traves de **gRPC**. El servidor esta construido con
[Connect-RPC](https://connectrpc.com/), de modo que un unico endpoint habla tres
protocolos de transporte compatibles:

- **gRPC** (HTTP/2) — el protocolo clasico, para clientes gRPC en cualquier lenguaje.
- **gRPC-Web** — para navegadores y clientes gRPC-Web.
- **Connect** — el protocolo propio de Connect (unario sobre HTTP/1.1 o HTTP/2).

El servidor funciona con HTTP/2 en texto plano (h2c) ademas de TLS, por lo que gRPC
funciona con o sin HTTPS por delante.

## El contrato es la fuente de verdad

La API se define en Protocol Buffers bajo
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto).
Genera un cliente para tu lenguaje a partir de ese contrato con
[buf](https://buf.build):

```bash
# fetch the proto contract, then generate (example: Go + TypeScript)
buf generate
```

El `buf.gen.yaml` del repositorio ya conecta los stubs de Go (`protoc-gen-connect-go`)
y TypeScript (`protoc-gen-connect-es`); apunta tu propio `buf.gen.yaml` a los
plugins de tu lenguaje.

## Ejemplo: una llamada unaria (Go)

```go
client := openbeehivev1connect.NewApiaryServiceClient(
    http.DefaultClient, "https://app.openbeehive.org",
)
res, err := client.ListApiaries(ctx, connect.NewRequest(&apiaryv1.ListApiariesRequest{}))
```

## Ejemplo: llamada rapida desde la terminal

Puedes acceder a los endpoints gRPC sin escribir codigo usando
[`buf curl`](https://buf.build/docs/curl) o `grpcurl`:

```bash
buf curl --schema . \
  --data '{"hiveId":"h-7","tempHive":34.6,"humidityHive":55}' \
  https://app.openbeehive.org/openbeehive.v1.InspectionService/CreateInspection
```

## Streaming: actualizaciones en vivo

`SyncService.Subscribe` es un metodo de **streaming desde el servidor**: abrelo una
vez y el servidor envia un evento ligero cada vez que cambia algo en un ambito que
puedes leer. Es la base de las actualizaciones multidispositivo casi en tiempo real.

```
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
```

La correccion nunca depende del stream — es un "aviso" para extraer antes. Consulta
el [protocolo de sincronizacion](/developers/sync-protocol) para los detalles de
`Pull` / `Push`.

## Autenticacion

Envia la sesion como metadato de la solicitud (cabecera) `Authorization: Bearer <token>`,
exactamente igual que para [HTTP/JSON](/using-the-api/rest). Las instancias
autoalojadas de un solo usuario no necesitan ninguna.

## Cuando elegir gRPC en lugar de HTTP/JSON

- Quieres un **cliente tipado y generado** y seguridad en tiempo de compilacion.
- Necesitas **streaming** (`Subscribe`).
- Estas moviendo **muchos datos** (sincronizacion, importacion masiva) y quieres un
  framing eficiente.

Para scripts puntuales, sensores y webhooks, [HTTP + JSON](/using-the-api/rest) suele
ser mas sencillo — y es la misma API.
