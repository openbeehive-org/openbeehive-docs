---
sidebar_position: 7
title: "Contribuer et configuration de développement"
---

# Contribuer et configuration de développement

Openbeehive est un logiciel libre et open source, et nous accueillons les
contributions de toutes tailles - de la correction d'une coquille à la
construction d'une nouvelle fonctionnalité. Cette page vous mène d'un clone neuf
à un environnement de développement fonctionnel, puis explique les conventions
qui maintiennent le code en bonne santé.

Le projet est sous licence **AGPL-3.0**. En contribuant, vous acceptez que votre
travail soit publié sous la même licence.

:::tip Par où commencer
Parcourez les tickets ouverts sur GitHub, et lisez le `CONTRIBUTING.md` dans le
dépôt principal avant d'ouvrir une pull request. Les PR petites et ciblées sont
beaucoup plus faciles à relire et à fusionner.
:::

## Les dépôts

Openbeehive est réparti sur quelques dépôts sous
[github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app) :

| Dépôt | Ce qu'il contient |
| --- | --- |
| `openbeehive` | L'application : backend Go et frontend PWA SvelteKit |
| `openbeehive-site` | Le site vitrine sur openbeehive.org |
| `openbeehive-docs` | Ce site de documentation (Docusaurus) |

La plupart des contributions de code arrivent dans le dépôt principal
`openbeehive`. Les changements de documentation appartiennent à `openbeehive-docs`.

## Prérequis

Vous aurez besoin de :

- **Go 1.25+** - pour le backend
- **Node 22+** - pour le frontend SvelteKit
- **buf** - pour générer le code à partir des définitions Protocol Buffer

Un `make` fonctionnel est supposé (n'importe quel GNU Make récent). Sous Windows,
nous recommandons WSL2.

## Mise en place

Clonez le dépôt et générez d'abord le code protobuf, puis démarrez le serveur et
l'application dans deux terminaux séparés.

```bash
git clone https://github.com/openbeehive-org/openbeehive-app.git
cd openbeehive

# Generate Go + TypeScript code from the .proto files
make proto

# Terminal 1 - run the Go backend
make run-server

# Terminal 2 - run the SvelteKit app in dev mode
make dev-app
```

`make run-server` lit sa configuration depuis votre environnement (ou un fichier
`.env`). Pour le développement local, les valeurs par défaut fonctionnent telles
quelles : une base de données SQLite et le système de fichiers local pour les
blobs. Voir [Configuration](/self-hosting/configuration) pour la liste complète
des variables.

Pour une configuration à développeur unique, vous pouvez laisser `BEEHIVE_OIDC_PROVIDERS`
vide et `BEEHIVE_WEBAUTHN_ENABLED=false` pour ignorer entièrement la connexion.

:::note Compiler depuis les sources
Pour produire un binaire de version plutôt qu'un serveur de développement,
exécutez `make proto && make build`, ce qui écrit `./server/bin/openbeehive`.
Voir [Binaire unique](/self-hosting/single-binary) pour les détails de
déploiement.
:::

## L'architecture en une minute

Si vous êtes nouveau dans le code, survolez d'abord
[Architecture](/developers/architecture) et le
[Modèle de données](/developers/data-model). La version courte :

- Le frontend est **offline-first**. Il possède une base de données SQLite-WASM
  locale (stockée dans OPFS) et est entièrement utilisable sans connexion réseau.
- Les changements se synchronisent vers le serveur en arrière-plan en utilisant
  des [horloges logiques hybrides et des CRDT](/developers/sync-protocol), de
  sorte que les modifications concurrentes fusionnent sans conflit.
- L'API est définie avec **Connect-RPC** (gRPC et HTTP/JSON), générée à partir des
  fichiers `.proto`.

## Conventions clés

Ces conventions comptent pour la justesse, pas seulement pour le style. Veuillez
les suivre.

### 1. Les fichiers `.proto` sont la source de vérité

La surface de l'API, les formes des messages et les enums sont tous définis en
Protocol Buffers. Ne modifiez jamais le code généré à la main. Modifiez le
`.proto`, exécutez `make proto`, et laissez le Go et le TypeScript générés suivre.

### 2. Les écritures passent par le dépôt local, pas par CRUD

Le client **n'appelle pas** le serveur pour créer ou mettre à jour des
enregistrements directement. Au lieu de cela, toutes les écritures passent par la
couche du dépôt local, qui enregistre le changement localement et laisse le moteur
de synchronisation le propager. C'est ce qui rend l'application instantanée et
capable de fonctionner hors ligne.

:::caution
Si vous ajoutez un chemin d'écriture qui parle directement au serveur, vous cassez
le support hors ligne et contournez la logique de fusion. Acheminez chaque
écriture par le dépôt local.
:::

### 3. Gardez `merge.go` et `merge.ts` synchronisés

Les règles de fusion - dernier écrivain gagne par champ pour les scalaires,
OR-Sets « l'ajout gagne » pour les champs de liste, événements en ajout seul -
sont implémentées **deux fois** : une fois sur le serveur (`merge.go`) et une fois
sur le client (`merge.ts`). Elles doivent se comporter de manière identique.

Tout changement de la sémantique de fusion doit être fait dans les deux fichiers,
avec des tests correspondants. Une divergence ici fait fusionner les données
différemment sur le client et le serveur, ce qui est un bug sérieux. Voir
[Protocole de synchronisation](/developers/sync-protocol) pour les règles.

### 4. Écrivez du SQL portable

Le backend prend en charge **PostgreSQL, MySQL et SQLite** comme bases de données
enfichables. Gardez le SQL portable entre les trois - évitez la syntaxe propre à
un moteur, et testez les changements de schéma sur plus d'un pilote lorsque vous
le pouvez. Voir [Bases de données](/self-hosting/databases).

### 5. L'anglais dans le code, les traductions pour les utilisateurs

Écrivez tout le code, les commentaires, les identifiants et les messages de commit
en **anglais**.

Tout ce qu'un utilisateur voit, cependant, doit être traduisible. Lorsque vous
ajoutez ou modifiez une chaîne destinée aux utilisateurs, fournissez des
traductions pour toutes les langues prises en charge :

| Locale | Langue |
| --- | --- |
| `en` | Anglais |
| `de` | Allemand |
| `fr` | Français |
| `es` | Espagnol |
| `it` | Italien |

Si vous n'êtes pas sûr d'une langue, ajoutez le texte anglais et signalez-le dans
votre PR afin qu'un locuteur natif puisse vous aider.

## Ouvrir une pull request

1. Forkez le dépôt et créez une branche pour votre changement.
2. Assurez-vous que `make proto` a été exécuté si vous avez touché un `.proto`.
3. Exécutez la suite de tests et les linters localement.
4. Gardez la PR ciblée et décrivez ce qu'elle change et pourquoi.
5. Pour les changements de logique de fusion, de synchronisation ou de schéma,
   signalez-le explicitement afin que les relecteurs sachent qu'il faut regarder
   de près.

Lisez les directives complètes dans
[`CONTRIBUTING.md`](https://github.com/openbeehive-org/openbeehive-app/blob/main/CONTRIBUTING.md).

Merci de nous aider à améliorer les enregistrements apicoles pour tout le monde.
Si vous êtes bloqué, ouvrez une discussion ou un ticket sur GitHub - nous sommes
heureux d'aider.
