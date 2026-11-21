---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Il server è realizzato con [Connect-RPC](https://connectrpc.com/), quindi gli
stessi handler rispondono a gRPC (HTTP/2), gRPC-Web e al protocollo Connect.
Ascolta con h2c, quindi gRPC funziona anche senza TLS davanti; in produzione
è un reverse proxy a terminare TLS.

## Generare un client

Il contratto si trova in
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
e viene compilato con [buf](https://buf.build). Il file `buf.gen.yaml` del
repository genera Go (`protocolbuffers/go` + `connectrpc/go`) in
`server/internal/gen` e TypeScript (`bufbuild/es` v2) in `app/src/lib/proto`.
Entrambe le directory di output sono ignorate da git; esegui `make proto` dopo
aver clonato. Per un altro linguaggio, copia la directory `proto/` e punta il
tuo `buf.gen.yaml` ai plugin di cui hai bisogno.

## Go

```go
import (
    "connectrpc.com/connect"
    "google.golang.org/protobuf/proto"
    obv1 "github.com/openbeehive-org/openbeehive-app/server/internal/gen/openbeehive/v1"
    "github.com/openbeehive-org/openbeehive-app/server/internal/gen/openbeehive/v1/openbeehivev1connect"
)

client := openbeehivev1connect.NewApiaryServiceClient(http.DefaultClient, "https://bees.example.com")
req := connect.NewRequest(&obv1.ListApiariesRequest{})
req.Header().Set("Authorization", "Bearer "+token)
res, err := client.ListApiaries(ctx, req)
```

Ognuno dei dieci servizi ha il proprio costruttore di client
(`NewApiaryServiceClient`, `NewHiveServiceClient`, `NewQueenServiceClient`,
`NewInspectionServiceClient`, `NewTaskServiceClient`,
`NewTreatmentServiceClient`, `NewHarvestServiceClient`,
`NewEventServiceClient`, `NewStatsServiceClient`, `NewSyncServiceClient`).
Una bilancia per arnie, per esempio, invia tramite `InspectionService`:

```go
insp := openbeehivev1connect.NewInspectionServiceClient(http.DefaultClient, "https://bees.example.com")
req := connect.NewRequest(&obv1.CreateInspectionRequest{
    HiveId:   hiveID,
    Source:   obv1.InspectionSource_INSPECTION_SOURCE_SENSOR,
    WeightKg: proto.Float64(42.5), // optional fields are pointers: unset means "not recorded"
    TempHive: proto.Float64(34.2),
})
req.Header().Set("Authorization", "Bearer "+token)
res, err := insp.CreateInspection(ctx, req)
```

Il pacchetto generato è `internal` al modulo del server, quindi un programma Go
separato deve generare la propria copia dai file `.proto`.

## TypeScript

Il client dell'app stessa si trova in `app/src/lib/client.ts`:

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SyncService } from './proto/openbeehive/v1/sync_pb';

const transport = createConnectTransport({ baseUrl: origin, interceptors: [authInterceptor] });
export const syncClient = createClient(SyncService, transport);
```

`authInterceptor` imposta `Authorization: Bearer <token>` a partire dalla
sessione salvata.

## Dalla shell

[`buf curl`](https://buf.build/docs/curl) parla tutti e tre i protocolli usando
lo schema nel repository:

```bash
cd openbeehive-app
buf curl --schema . \
  --header "Authorization: Bearer $TOKEN" \
  --data '{"apiaryId":"2b1f6c0e-..."}' \
  https://bees.example.com/openbeehive.v1.HiveService/ListHives
```

Aggiungi `--protocol grpc` per forzare gRPC al posto di Connect.

## Autenticazione

Invia una chiave API (`obhk_...`, creata in **Impostazioni → Spazio → Chiavi API**) o
un token di sessione come header `Authorization: Bearer <token>` (metadati
gRPC); `token` negli snippet qui sopra è l'uno o l'altro. Anche il cookie
`obh_session` è accettato per i token di sessione. Lo stesso interceptor
verifica entrambi i tipi e copre allo stesso modo le chiamate unarie e lo
stream `Subscribe`. Un'istanza senza alcun metodo di login configurato non ha
bisogno dell'header. Vedi la [panoramica](./overview.md#authentication).

## Subscribe

```protobuf
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Il server controlla ogni due secondi la modifica più recente che il chiamante
può scaricare con un pull (lo spazio attivo, più le righe personali del
chiamante) e invia un `SubscribeEvent` ogni volta che questa ha superato il
cursore che hai inviato (e l'ultimo valore che ha inviato). L'evento non
trasporta dati; chiama `Pull` con il cursore che hai salvato quando ne ricevi
uno. L'attività in altri spazi non risveglia lo stream.

Un utente può tenere aperti al massimo 4 stream `Subscribe`; un quinto viene
rifiutato con `resource_exhausted`. Lo stream è escluso dal timeout di 2
minuti del server per le richieste, ma un reverse proxy interposto può
chiudere le connessioni inattive, quindi preparati a riconnetterti.

L'app non usa `Subscribe`. Esegue push e pull ogni 15 secondi, dopo ogni
scrittura locale e all'evento `online` del browser.
