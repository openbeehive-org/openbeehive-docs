---
sidebar_position: 1
title: "Architecture offline-first"
---

# Architecture offline-first

Openbeehive est conçu pour que l'apiculture se déroule sur le rucher, souvent loin de tout signal. Chaque appareil emporte une copie complète des données dont il a besoin, l'interface lit et écrit cette copie locale instantanément, et un moteur d'arrière-plan maintient discrètement tout en phase avec le serveur lorsqu'une connexion est disponible.

Cette page explique comment les pièces s'assemblent. Pour connaître les règles exactes qui maintiennent la cohérence des réplicas, voir [le protocole de synchronisation](/developers/sync-protocol) et [historique et événements](/developers/history-and-events).

## Local-first par conception

L'idée centrale est simple : l'appareil est la source de vérité pour le travail que vous effectuez en ce moment.

- Chaque appareil conserve sa propre base de données. L'application web (une PWA SvelteKit) exécute une base de données SQLite embarquée compilée en WebAssembly (SQLite-WASM), adossée à l'Origin Private File System (OPFS) du navigateur pour un stockage durable et privé.
- L'interface utilisateur ne lit et n'écrit que dans la base de données locale. Aucun appel réseau ne se trouve sur le chemin critique, donc ouvrir une ruche, enregistrer une inspection ou cocher une tâche est immédiat et fonctionne sans aucun signal.
- Un moteur d'arrière-plan distinct gère le réseau. Il pousse les changements locaux vers le serveur et récupère les changements distants, réconciliant les deux sans jamais bloquer l'interface.

Parce que la base de données locale est toujours disponible, l'application se comporte de la même manière que vous soyez en ligne, hors ligne ou sur une connexion mobile capricieuse au milieu d'un verger.

## Le flux de données

Le schéma ci-dessous montre comment un changement voyage d'une pression dans l'interface jusqu'au serveur et revient vers les autres appareils.

```text
        Device A                          Server                       Device B
   +----------------+               +----------------+            +----------------+
   |   SvelteKit UI |               |   Go backend   |            |   SvelteKit UI |
   |  (reads/writes |               | (Connect-RPC:  |            |  (reads/writes |
   |    locally)    |               |  gRPC + JSON)  |            |    locally)    |
   +-------+--------+               +-------+--------+            +--------+-------+
           | read/write                     |                              | read/write
           v                                |                              v
   +----------------+                       |                     +----------------+
   | SQLite-WASM    |                       |                     | SQLite-WASM    |
   |   on OPFS      |                       |                     |   on OPFS      |
   +-------+--------+                       |                     +--------+-------+
           |                                |                              |
           |  Sync engine                   |                  Sync engine |
           |  (Push / Pull)                 |                              |
           +-----> Push changes ----------->|                              |
           |                                | store + order by HLC          |
           |<----- Pull changes ------------|                              |
                                            |------> Push changes <---------+
                                            |------- Pull changes --------->|
   scope: only apiaries the user can see (partial replication)
```

Le moteur de synchronisation n'échange que les enregistrements qui appartiennent aux scopes auxquels un utilisateur a accès, de sorte qu'un appareil ne télécharge jamais le monde entier : seulement les ruchers auxquels il a droit.

Les scripts et les capteurs entrent dans le même schéma via les services CRUD du serveur ([Utiliser l'API](/using-the-api/overview)). Leurs écritures ne contournent pas ce flux : le serveur applique chacune d'elles avec la même fusion champ par champ et l'ajoute au même journal des changements qu'un changement poussé, de sorte qu'un relevé envoyé par une balance de ruche n'est qu'un changement de plus que les appareils récupèrent à leur prochaine synchronisation.

## Résolution des conflits

Deux appareils peuvent modifier la même ruche alors qu'ils sont tous deux hors ligne. Lorsqu'ils se reconnectent, Openbeehive fusionne leurs changements de manière déterministe, sans aucune invite de conflit manuelle. Trois techniques rendent cela exempt de conflit.

### Horloges logiques hybrides (HLC)

Chaque changement est horodaté avec une valeur d'horloge logique hybride (Hybrid Logical Clock), combinant l'heure murale, un compteur logique et un identifiant de nœud. La HLC donne à chaque changement, sur chaque appareil, un ordre total et causalement cohérent, même lorsque les horloges des appareils dérivent. Cet ordonnancement est le fondement des règles ci-dessous.

### Dernier écrivain gagne par champ pour les scalaires

Pour les champs scalaires simples, comme le nom d'une ruche, son type ou la couleur de marquage d'une reine, la valeur ayant la HLC la plus élevée l'emporte. La fusion se fait par champ, pas par enregistrement, de sorte que deux personnes modifiant des champs différents de la même ruche conservent toutes deux leurs changements.

### OR-Sets pour les champs de liste

Les champs de type liste (actuellement uniquement les clés de photos d'une inspection) utilisent un ensemble à suppression observée (OR-Set) avec une sémantique « l'ajout gagne ». Les ajouts concurrents survivent tous, et une suppression ne prend effet que contre les entrées spécifiques qu'elle a observées. Cela évite le problème classique où l'ajout d'une personne efface silencieusement celui d'une autre.

### Événements en ajout seul

La table `event` est en ajout seul par convention : chaque écriture dans l'historique insère une nouvelle ligne avec un nouvel identifiant, et rien ne modifie ni ne supprime une ligne existante, de sorte que deux appareils ajoutant des événements hors ligne ne touchent jamais la même ligne. Voir [historique et événements](/developers/history-and-events) pour les détails.

:::tip
Parce que les fusions sont déterministes, deux appareils ayant vu le même ensemble de changements calculeront toujours exactement le même résultat, quel que soit l'ordre dans lequel ces changements sont arrivés.
:::

## Partage et réplication partielle

Le partage dans Openbeehive se fait au niveau du rucher via des **scopes**. Un scope accorde à un utilisateur l'accès à un rucher particulier et à tout ce qui se trouve en dessous : ses ruches, reines, inspections, tâches, événements, récoltes et traitements.

La synchronisation est cadrée en conséquence. Un appareil ne réplique que les données comprises dans les scopes que son utilisateur peut voir, un modèle connu sous le nom de réplication partielle. Cela maintient les bases de données locales petites et ciblées, limite ce qui transite par le réseau, et signifie qu'un membre du rucher d'une association ne reçoit jamais de données provenant de ruchers auxquels il ne participe pas.

Lorsqu'un nouveau scope est accordé, la prochaine récupération télécharge l'historique de ce rucher ; lorsque l'accès est retiré, ces enregistrements cessent de se synchroniser.

## PWA mobile-first

L'application est une Progressive Web App, conçue d'abord pour le téléphone dans votre poche au rucher.

- Un **service worker** met en cache la coque de l'application et les ressources, de sorte que l'application se charge instantanément et fonctionne entièrement hors ligne après la première visite.
- **SQLite-WASM sur OPFS** fournit une véritable base de données relationnelle dans le navigateur, avec un stockage durable et privé à l'origine qui survit aux rechargements.
- L'application est installable sur l'écran d'accueil et se comporte comme une application native, y compris le flux de scan QR qui ouvre l'application sur une ruche précise.

## Comment tout s'assemble

| Couche | Technologie | Responsabilité |
| --- | --- | --- |
| Interface | PWA SvelteKit | Lit et écrit la base de données locale ; ne bloque jamais sur le réseau |
| Stockage local | SQLite-WASM sur OPFS | Source de vérité durable, sur l'appareil |
| Moteur de synchronisation | Push / Pull en arrière-plan | Réconcilie les changements locaux et distants via HLC, LWW, OR-Sets |
| Backend | Go, Connect-RPC | Stocke et ordonne les changements ; applique les scopes ; sert les récupérations |
| Stockage | Backends de base de données et de blobs enfichables | Persiste les données et les médias sur le serveur |

Cette séparation est ce qui donne à Openbeehive sa promesse fondamentale : les enregistrements sont toujours avec vous, toujours rapides et toujours cohérents une fois que tout le monde est de nouveau à portée.

Pour aller plus loin, lisez [le protocole de synchronisation](/developers/sync-protocol) et [historique et événements](/developers/history-and-events), ou parcourez le reste de la [documentation développeur](/category/developers).
