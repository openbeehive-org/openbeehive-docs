---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Per client tipizzati, streaming e sincronizzazione ad alto volume, comunica con
Openbeehive tramite **gRPC**. Il server è realizzato con
[Connect-RPC](https://connectrpc.com/), quindi un singolo endpoint parla tre
protocolli di trasporto compatibili:

- **gRPC** (HTTP/2) — il protocollo classico, per client gRPC in qualsiasi linguaggio.
- **gRPC-Web** — per browser e client gRPC-Web.
- **Connect** — il protocollo proprio di Connect (unario su HTTP/1.1 o HTTP/2).

Il server esegue HTTP/2 in chiaro (h2c) oltre a TLS, quindi gRPC funziona con o
senza HTTPS davanti.

## Il contratto è la fonte di verità

L'API è definita in Protocol Buffers sotto
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto).
Genera un client per il tuo linguaggio a partire da quel contratto con
[buf](https://buf.build):

```bash
# fetch the proto contract, then generate (example: Go + TypeScript)
buf generate
```

Il file `buf.gen.yaml` del repository collega già gli stub per Go
(`protoc-gen-connect-go`) e TypeScript (`protoc-gen-connect-es`); punta il tuo
`buf.gen.yaml` ai plugin per il tuo linguaggio.

## Esempio: una chiamata unaria (Go)

```go
client := openbeehivev1connect.NewApiaryServiceClient(
    http.DefaultClient, "https://app.openbeehive.org",
)
res, err := client.ListApiaries(ctx, connect.NewRequest(&apiaryv1.ListApiariesRequest{}))
```

## Esempio: chiamata rapida dalla shell

Puoi raggiungere gli endpoint gRPC senza scrivere codice usando
[`buf curl`](https://buf.build/docs/curl) o `grpcurl`:

```bash
buf curl --schema . \
  --data '{"hiveId":"h-7","tempHive":34.6,"humidityHive":55}' \
  https://app.openbeehive.org/openbeehive.v1.InspectionService/CreateInspection
```

## Streaming: aggiornamenti in tempo reale

`SyncService.Subscribe` è un metodo **server-streaming**: aprilo una volta e il
server invia un evento leggero ogni volta che qualcosa cambia in un ambito che
puoi leggere. È la base degli aggiornamenti multi-dispositivo quasi in tempo
reale.

```
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
```

La correttezza non dipende mai dallo stream — è un "sollecito" per estrarre i
dati prima. Consulta il [protocollo di sincronizzazione](/developers/sync-protocol)
per i dettagli su `Pull` / `Push`.

## Autenticazione

Invia la sessione come metadati della richiesta (header)
`Authorization: Bearer <token>`, esattamente come per
[HTTP/JSON](/using-the-api/rest). Le istanze self-hosted a utente singolo non ne
hanno bisogno.

## Quando scegliere gRPC invece di HTTP/JSON

- Vuoi un **client tipizzato e generato** e la sicurezza in fase di compilazione.
- Hai bisogno di **streaming** (`Subscribe`).
- Stai spostando **molti dati** (sincronizzazione, importazione in blocco) e vuoi un framing efficiente.

Per script occasionali, sensori e webhook, [HTTP + JSON](/using-the-api/rest) è
di solito più semplice — ed è la stessa API.
