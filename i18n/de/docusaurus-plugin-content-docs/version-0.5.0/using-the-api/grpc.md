---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Der Server ist mit [Connect-RPC](https://connectrpc.com/) gebaut, daher
beantworten dieselben Handler gRPC (HTTP/2), gRPC-Web und das
Connect-Protokoll. Er lauscht mit h2c, sodass gRPC auch ohne vorgeschaltetes
TLS funktioniert; in Produktion terminiert ein Reverse-Proxy TLS.

## Einen Client generieren

Der Vertrag liegt in
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
und wird mit [buf](https://buf.build) gebaut. Die `buf.gen.yaml` des Repos
generiert Go (`protocolbuffers/go` + `connectrpc/go`) nach
`server/internal/gen` und TypeScript (`bufbuild/es` v2) nach
`app/src/lib/proto`. Beide Ausgabeverzeichnisse sind gitignored; führe nach
dem Klonen `make proto` aus. Für eine andere Sprache kopierst du das
Verzeichnis `proto/` und richtest deine eigene `buf.gen.yaml` auf die Plugins
aus, die du brauchst.

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

Jeder der zehn Dienste hat seinen eigenen Client-Konstruktor
(`NewApiaryServiceClient`, `NewHiveServiceClient`, `NewQueenServiceClient`,
`NewInspectionServiceClient`, `NewTaskServiceClient`,
`NewTreatmentServiceClient`, `NewHarvestServiceClient`,
`NewEventServiceClient`, `NewStatsServiceClient`, `NewSyncServiceClient`). Eine Stockwaage zum
Beispiel sendet über den `InspectionService`:

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

Das generierte Paket ist `internal` im Server-Modul, ein eigenständiges
Go-Programm muss sich also seine eigene Kopie aus den `.proto`-Dateien
generieren.

## TypeScript

Der Client der App selbst liegt in `app/src/lib/client.ts`:

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SyncService } from './proto/openbeehive/v1/sync_pb';

const transport = createConnectTransport({ baseUrl: origin, interceptors: [authInterceptor] });
export const syncClient = createClient(SyncService, transport);
```

`authInterceptor` setzt `Authorization: Bearer <token>` aus der gespeicherten
Sitzung.

## Aus der Shell

[`buf curl`](https://buf.build/docs/curl) spricht alle drei Protokolle und
nutzt dafür das Schema aus dem Repo:

```bash
cd openbeehive-app
buf curl --schema . \
  --header "Authorization: Bearer $TOKEN" \
  --data '{"apiaryId":"2b1f6c0e-..."}' \
  https://bees.example.com/openbeehive.v1.HiveService/ListHives
```

Mit `--protocol grpc` erzwingst du gRPC statt Connect.

## Authentifizierung

Sende einen API-Schlüssel (`obhk_...`, erstellt unter
**Einstellungen → Arbeitsbereich → API-Schlüssel**) oder ein Sitzungstoken als Header
`Authorization: Bearer <token>` (gRPC-Metadaten); `token` in den Snippets
oben ist eines von beiden. Für Sitzungstokens wird auch das Cookie
`obh_session` akzeptiert. Derselbe Interceptor prüft beide Arten und deckt
unäre Aufrufe und den `Subscribe`-Stream gleichermaßen ab. Eine Instanz ohne
konfigurierte Anmeldemethode braucht keinen Header. Siehe den
[Überblick](./overview.md#authentication).

## Subscribe

```protobuf
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Der Server prüft alle zwei Sekunden, welche die neueste Änderung ist, die der
Aufrufer pullen kann (der aktive Arbeitsbereich plus die persönlichen Zeilen
des Aufrufers), und sendet ein `SubscribeEvent`, sobald sie über den von dir
gesendeten Cursor hinausgegangen ist (und über den zuletzt gesendeten Wert).
Das Ereignis trägt keine Daten; rufe `Pull` mit deinem gespeicherten Cursor
auf, wenn du eines empfängst. Aktivität in anderen Arbeitsbereichen weckt den
Stream nicht.

Ein Nutzer darf höchstens 4 offene `Subscribe`-Streams halten; ein fünfter
wird mit `resource_exhausted` abgelehnt. Der Stream ist vom 2-Minuten-Timeout
des Servers für Anfragen ausgenommen, aber ein Reverse Proxy dazwischen kann
ungenutzte Verbindungen schließen, sei also darauf vorbereitet, dich neu zu
verbinden.

Die App nutzt `Subscribe` nicht; sie pusht und pullt alle 15 Sekunden, nach
jedem lokalen Schreibvorgang und beim `online`-Ereignis des Browsers.
