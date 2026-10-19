---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Le serveur est construit avec [Connect-RPC](https://connectrpc.com/), de sorte que
les mêmes handlers répondent à gRPC (HTTP/2), gRPC-Web et au protocole Connect. Il
écoute en h2c, donc gRPC fonctionne sans TLS en frontal ; en production, un reverse
proxy termine TLS.

## Générer un client

Le contrat se trouve dans
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto/openbeehive/v1)
et est construit avec [buf](https://buf.build). Le `buf.gen.yaml` du dépôt génère
du Go (`protocolbuffers/go` + `connectrpc/go`) dans `server/internal/gen` et du
TypeScript (`bufbuild/es` v2) dans `app/src/lib/proto`. Les deux répertoires de
sortie sont ignorés par git ; exécutez `make proto` après le clonage. Pour un autre
langage, copiez le répertoire `proto/` et faites pointer votre propre `buf.gen.yaml`
vers les plugins dont vous avez besoin.

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

Chacun des dix services a son propre constructeur de client
(`NewApiaryServiceClient`, `NewHiveServiceClient`, `NewQueenServiceClient`,
`NewInspectionServiceClient`, `NewTaskServiceClient`,
`NewTreatmentServiceClient`, `NewHarvestServiceClient`,
`NewEventServiceClient`, `NewStatsServiceClient`, `NewSyncServiceClient`). Une balance de ruche, par
exemple, envoie ses relevés via `InspectionService` :

```go
insp := openbeehivev1connect.NewInspectionServiceClient(http.DefaultClient, "https://bees.example.com")
req := connect.NewRequest(&obv1.CreateInspectionRequest{HiveId: hiveID, WeightKg: 42.5, TempHive: 34.2})
req.Header().Set("Authorization", "Bearer "+token)
res, err := insp.CreateInspection(ctx, req)
```

Le paquet généré est `internal` au module serveur ; un programme Go distinct doit
donc générer sa propre copie à partir des fichiers `.proto`.

## TypeScript

Le client propre à l'application se trouve dans `app/src/lib/client.ts` :

```ts
import { createClient } from '@connectrpc/connect';
import { createConnectTransport } from '@connectrpc/connect-web';
import { SyncService } from './proto/openbeehive/v1/sync_pb';

const transport = createConnectTransport({ baseUrl: origin, interceptors: [authInterceptor] });
export const syncClient = createClient(SyncService, transport);
```

`authInterceptor` définit `Authorization: Bearer <token>` à partir de la session
stockée.

## Depuis le shell

[`buf curl`](https://buf.build/docs/curl) parle les trois protocoles en utilisant le
schéma du dépôt :

```bash
cd openbeehive-app
buf curl --schema . \
  --header "Authorization: Bearer $TOKEN" \
  --data '{"apiaryId":"2b1f6c0e-..."}' \
  https://bees.example.com/openbeehive.v1.HiveService/ListHives
```

Ajoutez `--protocol grpc` pour forcer gRPC au lieu de Connect.

## Authentification

Envoyez une clé API (`obhk_...`, créée sous **Paramètres → Clés API**) ou un
jeton de session dans l'en-tête `Authorization: Bearer <token>` (métadonnée
gRPC) ; `token` dans les extraits ci-dessus désigne l'un ou l'autre. Le cookie
`obh_session` est accepté aussi pour les jetons de session. Le même
intercepteur vérifie les deux types et couvre aussi bien les appels unaires que
le flux `Subscribe`. Une instance sans méthode de connexion configurée n'a
besoin d'aucun en-tête. Voir la
[vue d'ensemble](./overview.md#authentication).

## Subscribe

```protobuf
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
message SubscribeRequest { string cursor = 1; }
message SubscribeEvent { string server_cursor = 1; }
```

Le serveur interroge son compteur global de changements toutes les deux secondes et
envoie un `SubscribeEvent` chaque fois que le compteur a dépassé le curseur que vous
avez envoyé (et la dernière valeur qu'il a envoyée). L'événement ne transporte aucune
donnée ; appelez `Pull` avec votre curseur stocké lorsque vous en recevez un. Les
lignes hors de vos portées font aussi avancer le compteur, donc un `Pull` après un
événement peut revenir vide.

L'application n'utilise pas `Subscribe`. Elle pousse et tire toutes les 15 secondes,
après chaque écriture locale, et lors de l'événement `online` du navigateur.
