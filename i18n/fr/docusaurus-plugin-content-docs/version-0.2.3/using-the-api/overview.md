---
sidebar_position: 1
title: "Présentation de l'API"
---

# L'API Openbeehive

Openbeehive est **API-first et ouvert**. Il n'y a pas de backend caché : tout
ce que fait l'application — créer des ruchers, enregistrer des inspections,
synchroniser des appareils, lire des statistiques — passe par une seule API
**Connect-RPC** publique. Le même contrat qui alimente l'application est
disponible pour vous.

Cette ouverture est délibérée. Vos données vous appartiennent ; vous devez donc
pouvoir les lire, les scripter, les alimenter depuis vos propres capteurs et les
déplacer ailleurs sans demander la permission à qui que ce soit.

## Un contrat, deux protocoles

L'API est définie une seule fois sous forme de contrat [Protocol Buffers](https://protobuf.dev/)
et servie avec [Connect-RPC](https://connectrpc.com/). Cela signifie que **chaque
endpoint est accessible de deux façons**, depuis la même URL :

| Style | Idéal pour | Page |
| --- | --- | --- |
| **HTTP + JSON** (de type REST) | curl, scripts, webhooks, microcontrôleurs, intégrations rapides | [REST / HTTP + JSON](/using-the-api/rest) |
| **gRPC / gRPC-Web / Connect** | clients typés, streaming, synchronisation à haut volume | [gRPC](/using-the-api/grpc) |

Vous ne choisissez pas un protocole côté serveur — vous le choisissez par
requête, grâce aux en-têtes que vous envoyez. Optez pour celui qui est le plus
facile pour votre outil.

## URL de base

L'API est servie par le même processus que celui qui sert l'application :

- Service hébergé : `https://app.openbeehive.org`
- Auto-hébergé : votre propre origine, par exemple `https://bees.example.com` (voir
  [Auto-hébergement](/category/self-hosting))

Chaque méthode se trouve à un chemin prévisible :

```
POST <base-url>/openbeehive.v1.<Service>/<Method>
```

Par exemple : `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`.

## Services

Le contrat est regroupé en services. Chacun correspond à une partie du domaine
que vous connaissez déjà depuis l'application :

| Service | Ce qu'il couvre |
| --- | --- |
| `ApiaryService` | Créer, lire, mettre à jour, supprimer et lister les ruchers |
| `HiveService` | Les ruches, y compris le déplacement d'une ruche entre ruchers |
| `QueenService` | Les reines et l'historique de leur règne |
| `InspectionService` | Inspections / visites (température et humidité incluses), URL d'envoi de photos |
| `TreatmentService` | Traitements / le Bestandsbuch (produit, lot, dose, délai d'attente) |
| `TaskService` | Tâches et rappels |
| `EventService` | Le flux d'événements / historique en ajout seul |
| `StatsService` | Totaux du tableau de bord et statistiques de miel |
| `SyncService` | `Pull`, `Push` et un `Subscribe` en streaming — le moteur de synchronisation offline-first |

:::note Statut d'implémentation (v0.1.0)
`ApiaryService` et `SyncService` sont aujourd'hui entièrement câblés côté
serveur. Les autres services sont définis dans le contrat et suivent la même
forme ; ils sont en cours de remplissage. Consultez le
[contrat](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
pour la source de vérité actuelle, et les
[notes de version](https://github.com/openbeehive-org/openbeehive-app/releases) pour
savoir ce qui est en service.
:::

## Authentification

- **Auto-hébergé, utilisateur unique :** lorsqu'aucune connexion n'est
  configurée, l'API est ouverte à l'instance (vous êtes le seul utilisateur).
  C'est la configuration la plus simple pour les serveurs domestiques et les
  scripts. Voir [Authentification](/self-hosting/authentication).
- **Avec la connexion activée / le service hébergé :** les requêtes portent une
  session établie via OIDC ou une clé d'accès (passkey). Envoyez-la sous forme de
  jeton bearer : `Authorization: Bearer <token>`. Les jetons d'API programmatiques
  pour les clients sans surveillance (scripts, capteurs) sont prévus dans la
  feuille de route — d'ici là, l'auto-hébergement en mode utilisateur unique est
  la voie sans friction pour l'automatisation.

## Comment l'application elle-même l'utilise

L'application est **offline-first** : elle écrit d'abord dans une base de données
locale et le moteur de synchronisation se réconcilie avec le serveur via
`SyncService.Push` / `Pull`. Les services CRUD (`ApiaryService`,
`InspectionService`, …) sont les points d'entrée faisant autorité côté serveur,
utilisés pour les intégrations directes, l'export et l'automatisation. Les deux
vues reposent sur les mêmes données — voir
[Mode hors ligne et synchronisation](/using-the-app/offline-and-sync) et
l'[architecture pour développeurs](/developers/architecture).

## Ce que vous pouvez construire

- Récupérer vos données dans un tableur, un notebook ou un tableau de bord BI.
- Scripter des modifications groupées ou des migrations depuis un autre outil
  apicole.
- Alimenter les relevés provenant de **trackers automatisés** — balances de
  ruches, capteurs de température et d'humidité — directement dans les
  inspections. Voir
  [Trackers automatisés](/using-the-api/automated-trackers).
- Construire votre propre client, bot ou widget mobile à partir d'un contrat
  stable et typé.

Prêt pour les détails ? Commencez par [REST / HTTP + JSON](/using-the-api/rest).
