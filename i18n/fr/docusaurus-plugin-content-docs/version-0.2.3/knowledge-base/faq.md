---
sidebar_position: 5
title: "FAQ"
---

# Foire aux questions

Des réponses rapides aux questions que l'on nous pose le plus souvent. S'il manque quelque chose, consultez le [guide de dépannage](/knowledge-base/troubleshooting) ou demandez à la communauté sur [GitHub](https://github.com/openbeehive-org/openbeehive-app).

## Openbeehive est-il gratuit ?

Oui. Openbeehive est open source sous licence **AGPL-3.0**, vous êtes donc libre de l'utiliser, de l'étudier, de le modifier et de l'héberger vous-même.

Le service hébergé sur [app.openbeehive.org](https://app.openbeehive.org) est gratuit pour le moment, tant que le projet est jeune. Si cela venait à changer, vous pourrez toujours exporter vos données et faire tourner votre propre instance à la place.

## Mes données sont-elles privées ?

Vos archives résident d'abord sur votre propre appareil. Openbeehive fonctionne **hors ligne d'abord** : l'application stocke tout dans une base de données locale sur votre téléphone, tablette ou ordinateur, et ne se synchronise au serveur qu'en arrière-plan.

Si vous l'hébergez vous-même, vos données ne quittent jamais votre propre infrastructure. Sur le service hébergé, vos archives sont stockées sur nos serveurs afin de pouvoir se synchroniser entre vos appareils, mais elles restent les vôtres.

:::tip
Vous voulez un contrôle total ? Voir [Auto-hébergement](/category/self-hosting) pour faire tourner Openbeehive sur votre propre matériel.
:::

## Fonctionne-t-il hors ligne ?

Oui, totalement. Openbeehive est une Progressive Web App (PWA) qui conserve une copie complète de vos données sur l'appareil. La lecture et l'écriture des archives sont locales et instantanées, si bien qu'il fonctionne parfaitement dans un rucher sans réseau.

Lorsque vous retrouvez une connexion, vos modifications se synchronisent automatiquement. En savoir plus dans [Hors ligne et synchronisation](/using-the-app/offline-and-sync).

## Fonctionne-t-il sur mon téléphone ?

Oui. Openbeehive fonctionne dans tout navigateur moderne et peut être installé sur votre écran d'accueil pour se comporter comme une application. Il fonctionne sur téléphones, tablettes et ordinateurs de bureau. Voir [Installer l'application](/using-the-app/install) pour les étapes sur chaque plateforme.

## Existe-t-il une application native ?

Il n'y a pas aujourd'hui d'application native distincte sur l'App Store ou le Play Store, et vous n'en avez pas besoin. La PWA installable vous offre une icône d'application, l'usage hors ligne et le mode plein écran sur iOS, Android, Windows, macOS et Linux à partir d'une seule base de code.

## Puis-je exporter mes données ?

Oui. Comme le projet est open source et que vos données sont stockées dans une base de données SQLite standard, vous n'êtes jamais captif.

- Les **auto-hébergeurs** peuvent sauvegarder directement la base de données. Voir [Sauvegardes](/self-hosting/backups).
- Sur le **service hébergé**, des outils d'export font partie de la feuille de route. Vos archives sont aussi conservées localement sur chaque appareil synchronisé.

## Puis-je l'héberger moi-même ?

Absolument, et il est conçu pour être facile à héberger. Il existe deux profils de déploiement :

| Profil | Idéal pour | Pile technique |
| --- | --- | --- |
| `selfhost` | Amateurs, utilisateur unique | Un binaire unique, SQLite + fichiers locaux, sans Docker |
| `cloud` | Multi-utilisateurs, installations plus grandes | Docker, PostgreSQL + stockage S3/MinIO |

Commencez par le [Démarrage rapide](/self-hosting/quick-start), ou passez directement au [guide du binaire unique](/self-hosting/single-binary).

:::note
Pour une instance privée à utilisateur unique, vous pouvez désactiver entièrement la connexion. Voir [Authentification](/self-hosting/authentication).
:::

## Comment fonctionne le partage ?

Le partage se fait au niveau du **rucher** via des « portées » (scopes). Lorsque vous partagez un rucher, les personnes avec qui vous le partagez peuvent voir et contribuer à tout ce qu'il contient : ses ruches, reines, inspections, tâches et plus encore.

La synchronisation est sans conflit par conception, si bien que deux personnes modifiant le même rucher sur des appareils différents n'écraseront pas le travail l'une de l'autre. Les modifications fusionnent proprement même après de longues périodes hors ligne. Les détails techniques sont traités dans le [protocole de synchronisation](/developers/sync-protocol).

## Quels types de ruches sont pris en charge ?

Openbeehive prend en charge les systèmes à cadres et à barrettes les plus courants :

- Zander
- Dadant
- Deutsch Normal
- Langstroth
- Warré
- Top-bar
- Autre

Voir [Types de ruches](/knowledge-base/hive-types) pour des conseils sur le choix.

## Comment les reines sont-elles marquées ?

Openbeehive suit le code international de couleurs de marquage des reines, basé sur le dernier chiffre de l'année :

| L'année se termine par | Couleur |
| --- | --- |
| 1 ou 6 | Blanc |
| 2 ou 7 | Jaune |
| 3 ou 8 | Rouge |
| 4 ou 9 | Vert |
| 5 ou 0 | Bleu |

L'application choisit automatiquement la bonne couleur pour vous. Tous les détails sont sur la page [couleurs de marquage des reines](/knowledge-base/queen-marking-colours).

## À quoi servent les étiquettes QR ?

Chaque ruche peut avoir une étiquette QR imprimable. La scanner ouvre Openbeehive directement sur cette ruche, vous permettant d'afficher ses archives au rucher sans saisie ni recherche. Voir [Étiquettes QR](/using-the-app/qr-labels).

## En quelles langues est-il disponible ?

Openbeehive est conçu avec l'internationalisation à l'esprit, l'allemand et l'anglais étant les premières priorités compte tenu des origines du projet. Les langues supplémentaires sont les bienvenues sous forme de contributions communautaires.

## Quelles bases de données et quels stockages sont pris en charge ?

En auto-hébergement, le backend est modulaire :

- **Bases de données :** PostgreSQL, MySQL ou SQLite. Voir [Bases de données](/self-hosting/databases).
- **Stockage d'objets :** stockage d'objets compatible MinIO/S3, ou le système de fichiers local. Voir [Stockage](/self-hosting/storage).

## Comment me connecter ?

Le service hébergé utilise la connexion OIDC (connexion via un fournisseur pris en charge), avec des clés d'accès (WebAuthn) facultatives pour une expérience sans mot de passe. Les auto-hébergeurs peuvent configurer leurs propres fournisseurs OIDC, activer les clés d'accès, ou désactiver entièrement la connexion pour les installations à utilisateur unique. Voir [Authentification](/self-hosting/authentication).

## Comment signaler un bug ou demander une fonctionnalité ?

Veuillez ouvrir un ticket sur notre [organisation GitHub](https://github.com/openbeehive-org/openbeehive-app). Des étapes de reproduction claires, votre plateforme et votre navigateur, ainsi qu'une capture d'écran aident énormément.

La [page de dépannage](/knowledge-base/troubleshooting) couvre peut-être déjà les problèmes courants.

## Comment puis-je contribuer ?

Les contributions de toutes sortes sont les bienvenues : code, documentation, traductions, rapports de bugs et idées. La pile technique est Go pour le backend et une PWA SvelteKit pour le frontend.

Lisez le [guide de contribution](/developers/contributing) pour commencer, et jetez un œil à la [vue d'ensemble de l'architecture](/developers/architecture) pour comprendre comment les pièces s'assemblent.

## Quelle est cette version ?

La version actuelle est la **v0.1.0**, notre première version publique. Attendez-vous à des améliorations rapides, et consultez le [guide de mise à niveau](/self-hosting/upgrading) à la sortie de nouvelles versions.
