---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Für typisierte Clients, Streaming und Synchronisierung mit hohem Datenaufkommen
kommunizieren Sie mit Openbeehive über **gRPC**. Der Server ist mit
[Connect-RPC](https://connectrpc.com/) gebaut, sodass ein einziger Endpunkt drei
kompatible Wire-Protokolle spricht:

- **gRPC** (HTTP/2) — das klassische Protokoll, für gRPC-Clients in jeder Sprache.
- **gRPC-Web** — für Browser und gRPC-Web-Clients.
- **Connect** — Connects eigenes Protokoll (unär über HTTP/1.1 oder HTTP/2).

Der Server läuft sowohl im HTTP/2-Klartext (h2c) als auch mit TLS, sodass gRPC
mit oder ohne vorgeschaltetes HTTPS funktioniert.

## Der Vertrag ist die Quelle der Wahrheit

Die API ist in Protocol Buffers unter
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
definiert. Generieren Sie mit [buf](https://buf.build) einen Client für Ihre
Sprache aus diesem Vertrag:

```bash
# fetch the proto contract, then generate (example: Go + TypeScript)
buf generate
```

Die `buf.gen.yaml` des Repositorys verdrahtet bereits Go
(`protoc-gen-connect-go`) und TypeScript (`protoc-gen-connect-es`) Stubs; richten
Sie Ihre eigene `buf.gen.yaml` auf die Plugins für Ihre Sprache aus.

## Beispiel: ein unärer Aufruf (Go)

```go
client := openbeehivev1connect.NewApiaryServiceClient(
    http.DefaultClient, "https://app.openbeehive.org",
)
res, err := client.ListApiaries(ctx, connect.NewRequest(&apiaryv1.ListApiariesRequest{}))
```

## Beispiel: schneller Aufruf aus der Shell

Sie können gRPC-Endpunkte ohne Programmieren ansprechen, indem Sie
[`buf curl`](https://buf.build/docs/curl) oder `grpcurl` verwenden:

```bash
buf curl --schema . \
  --data '{"hiveId":"h-7","tempHive":34.6,"humidityHive":55}' \
  https://app.openbeehive.org/openbeehive.v1.InspectionService/CreateInspection
```

## Streaming: Live-Aktualisierungen

`SyncService.Subscribe` ist eine **Server-Streaming**-Methode: Öffnen Sie sie
einmal, und der Server sendet ein leichtgewichtiges Ereignis, sobald sich etwas
in einem Bereich ändert, den Sie lesen dürfen. Sie ist die Grundlage für
Multi-Device-Aktualisierungen nahezu in Echtzeit.

```
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
```

Die Korrektheit hängt niemals vom Stream ab — er ist ein „Anstoß“, um früher
abzurufen. Details zu `Pull` / `Push` finden Sie im
[Sync-Protokoll](/developers/sync-protocol).

## Authentifizierung

Senden Sie die Sitzung als Request-Metadaten (Header)
`Authorization: Bearer <token>`, genau wie bei
[HTTP/JSON](/using-the-api/rest). Selbst gehostete Einzelbenutzer-Instanzen
benötigen keine.

## Wann gRPC statt HTTP/JSON wählen

- Sie möchten einen **typisierten, generierten Client** und Sicherheit zur
  Kompilierzeit.
- Sie benötigen **Streaming** (`Subscribe`).
- Sie bewegen **große Datenmengen** (Synchronisierung, Massenimport) und möchten
  effizientes Framing.

Für einmalige Skripte, Sensoren und Webhooks ist
[HTTP + JSON](/using-the-api/rest) meist einfacher — und es ist dieselbe API.
