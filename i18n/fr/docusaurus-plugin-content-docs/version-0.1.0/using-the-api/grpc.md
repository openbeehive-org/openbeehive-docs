---
sidebar_position: 3
title: "gRPC"
---

# gRPC

Pour des clients typés, le streaming et la synchronisation à fort volume,
communiquez avec Openbeehive via **gRPC**. Le serveur est construit avec
[Connect-RPC](https://connectrpc.com/), de sorte qu'un seul point de terminaison
parle trois protocoles de communication compatibles :

- **gRPC** (HTTP/2) — le protocole classique, pour les clients gRPC dans
  n'importe quel langage.
- **gRPC-Web** — pour les navigateurs et les clients gRPC-Web.
- **Connect** — le protocole propre à Connect (unaire sur HTTP/1.1 ou HTTP/2).

Le serveur fonctionne en HTTP/2 en clair (h2c) ainsi qu'en TLS, donc gRPC
fonctionne avec ou sans HTTPS en frontal.

## Le contrat est la source de vérité

L'API est définie en Protocol Buffers sous
[`proto/openbeehive/v1`](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto).
Générez un client pour votre langage à partir de ce contrat avec
[buf](https://buf.build) :

```bash
# fetch the proto contract, then generate (example: Go + TypeScript)
buf generate
```

Le fichier `buf.gen.yaml` du dépôt configure déjà les stubs Go
(`protoc-gen-connect-go`) et TypeScript (`protoc-gen-connect-es`) ; faites
pointer votre propre `buf.gen.yaml` vers les plugins de votre langage.

## Exemple : un appel unaire (Go)

```go
client := openbeehivev1connect.NewApiaryServiceClient(
    http.DefaultClient, "https://app.openbeehive.org",
)
res, err := client.ListApiaries(ctx, connect.NewRequest(&apiaryv1.ListApiariesRequest{}))
```

## Exemple : appel rapide depuis le shell

Vous pouvez interroger les points de terminaison gRPC sans écrire de code en
utilisant [`buf curl`](https://buf.build/docs/curl) ou `grpcurl` :

```bash
buf curl --schema . \
  --data '{"hiveId":"h-7","tempHive":34.6,"humidityHive":55}' \
  https://app.openbeehive.org/openbeehive.v1.InspectionService/CreateInspection
```

## Streaming : mises à jour en direct

`SyncService.Subscribe` est une méthode de **streaming côté serveur** : ouvrez-la
une fois et le serveur pousse un événement léger chaque fois que quelque chose
change dans une portée que vous pouvez lire. C'est la base des mises à jour
multi-appareils en quasi temps réel.

```
rpc Subscribe(SubscribeRequest) returns (stream SubscribeEvent);
```

L'exactitude ne dépend jamais du flux — c'est un « coup de pouce » pour tirer les
données plus tôt. Consultez le [protocole de synchronisation](/developers/sync-protocol)
pour les détails sur `Pull` / `Push`.

## Authentification

Envoyez la session en tant que métadonnée de requête (en-tête)
`Authorization: Bearer <token>`, exactement comme pour
[HTTP/JSON](/using-the-api/rest). Les instances auto-hébergées mono-utilisateur
n'en ont pas besoin.

## Quand choisir gRPC plutôt que HTTP/JSON

- Vous voulez un **client typé et généré** et une sécurité à la compilation.
- Vous avez besoin de **streaming** (`Subscribe`).
- Vous déplacez **beaucoup de données** (synchronisation, import en masse) et
  souhaitez un cadrage efficace.

Pour des scripts ponctuels, des capteurs et des webhooks,
[HTTP + JSON](/using-the-api/rest) est généralement plus simple — et c'est la
même API.
