---
sidebar_position: 3
title: "gRPC"
---

# gRPC

The server is built with [Connect-RPC](https://connectrpc.com/), so the same
handlers answer gRPC (HTTP/2), gRPC-Web and the Connect protocol. It listens
with h2c, so gRPC works without TLS in front of it; in production a reverse
proxy terminates TLS.

## Generate a client

The contract lives in
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
and is built with [buf](https://buf.build). The repo's `buf.gen.yaml` generates
Go (`protocolbuffers/go` + `connectrpc/go`) into `server/internal/gen` and
TypeScript (`bufbuild/es` v2) into `app/src/lib/proto`. Both output
directories are gitignored; run `make proto` after cloning. For another
language, copy the `proto/` directory and point your own `buf.gen.yaml` at the
plugins you need.

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

Each of the ten services has its own client constructor
(`NewApiaryServiceClient`, `NewHiveServiceClient`, `NewQueenServiceClient`,
`NewInspectionServiceClient`, `NewTaskServiceClient`,
`NewTreatmentServiceClient`, `NewHarvestServiceClient`,
`NewEventServiceClient`, `NewStatsServiceClient`, `NewSyncServiceClient`).
A hive scale, for example, posts through `InspectionService`:

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

The generated package is `internal` to the server module, so a separate Go
program has to generate its own copy from the `.proto` files.

## TypeScript

The app's own client is in `app/src/lib/client.ts`:

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SyncService } from './proto/openbeehive/v1/sync_pb';

const transport = createConnectTransport({ baseUrl: origin, interceptors: [authInterceptor] });
export const syncClient = createClient(SyncService, transport);
```

`authInterceptor` sets `Authorization: Bearer <token>` from the stored
session.

## From the shell

[`buf curl`](https://buf.build/docs/curl) speaks all three protocols using the
schema in the repo:

```bash
cd openbeehive-app
buf curl --schema . \
  --header "Authorization: Bearer $TOKEN" \
  --data '{"apiaryId":"2b1f6c0e-..."}' \
  https://bees.example.com/openbeehive.v1.HiveService/ListHives
```

Add `--protocol grpc` to force gRPC instead of Connect.

## Authentication

Send an API key (`obhk_...`, created under **Settings → Workspace → API keys**) or a
session token as the `Authorization: Bearer <token>` header (gRPC
metadata); `token` in the snippets above is either. The `obh_session`
cookie is accepted for session tokens too. The same interceptor verifies
both kinds and covers unary calls and the `Subscribe` stream alike. An
instance without a login method configured needs no header. See the
[overview](./overview.md#authentication).

## Subscribe

```protobuf
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

The server checks every two seconds for the newest change the caller can
pull (the active workspace, plus the caller's personal rows) and sends a
`SubscribeEvent` whenever that has moved past the cursor you sent (and past
the last value it sent). The event carries no data; call `Pull` with your
stored cursor when you receive one. Activity in other workspaces does not
wake the stream.

One user may hold at most 4 open `Subscribe` streams; a fifth is refused with
`resource_exhausted`. The stream is exempt from the server's 2-minute request
timeout, but a reverse proxy in between may close idle connections, so be
ready to reconnect.

The app does not use `Subscribe`. It pushes and pulls every 15 seconds, after
every local write, and on the browser's `online` event.
