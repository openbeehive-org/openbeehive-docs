---
sidebar_position: 3
title: "gRPC"
---

# gRPC

For typed clients, streaming and high-volume sync, talk to Openbeehive over
**gRPC**. The server is built with [Connect-RPC](https://connectrpc.com/), so a
single endpoint speaks three compatible wire protocols:

- **gRPC** (HTTP/2) — the classic protocol, for gRPC clients in any language.
- **gRPC-Web** — for browsers and gRPC-Web clients.
- **Connect** — Connect's own protocol (unary over HTTP/1.1 or HTTP/2).

The server runs HTTP/2 cleartext (h2c) as well as TLS, so gRPC works with or
without HTTPS in front.

## The contract is the source of truth

The API is defined in Protocol Buffers under
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto).
Generate a client for your language from that contract with
[buf](https://buf.build):

```bash
# fetch the proto contract, then generate (example: Go + TypeScript)
buf generate
```

The repo's `buf.gen.yaml` already wires up Go (`protoc-gen-connect-go`) and
TypeScript (`protoc-gen-connect-es`) stubs; point your own `buf.gen.yaml` at the
plugins for your language.

## Example: a unary call (Go)

```go
client := openbeehivev1connect.NewApiaryServiceClient(
    http.DefaultClient, "https://app.openbeehive.org",
)
res, err := client.ListApiaries(ctx, connect.NewRequest(&apiaryv1.ListApiariesRequest{}))
```

## Example: quick call from the shell

You can hit gRPC endpoints without writing code using
[`buf curl`](https://buf.build/docs/curl) or `grpcurl`:

```bash
buf curl --schema . \
  --data '{"hiveId":"h-7","tempHive":34.6,"humidityHive":55}' \
  https://app.openbeehive.org/openbeehive.v1.InspectionService/CreateInspection
```

## Streaming: live updates

`SyncService.Subscribe` is a **server-streaming** method: open it once and the
server pushes a lightweight event whenever something changes in a scope you can
read. It's the basis of near-real-time multi-device updates.

```
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
```

Correctness never depends on the stream — it's a "poke" to pull sooner. See the
[sync protocol](/developers/sync-protocol) for `Pull` / `Push` details.

## Authentication

Send the session as request metadata (header) `Authorization: Bearer <token>`,
exactly as for [HTTP/JSON](/using-the-api/rest). Self-hosted single-user
instances need none.

## When to choose gRPC over HTTP/JSON

- You want a **typed, generated client** and compile-time safety.
- You need **streaming** (`Subscribe`).
- You're moving **a lot of data** (sync, bulk import) and want efficient framing.

For one-off scripts, sensors and webhooks, [HTTP + JSON](/using-the-api/rest) is
usually simpler — and it's the same API.
