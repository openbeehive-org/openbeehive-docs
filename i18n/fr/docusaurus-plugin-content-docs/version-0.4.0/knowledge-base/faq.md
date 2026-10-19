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

Vos archives résident d'abord sur votre propre appareil : l'application stocke tout dans une base de données locale sur votre téléphone, tablette ou ordinateur et se synchronise au serveur en arrière-plan.

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

Oui. **Paramètres → Données & sauvegarde** exporte tout ce qui se trouve sur votre appareil sous forme de sauvegarde JSON complète, de feuille de calcul (XLSX), de fichiers CSV dans un ZIP, de BeeXML ou de rapport PDF imprimable, et importe du JSON, du BeeXML et du CSV depuis d'autres applications. Voir [Import et export](/using-the-app/import-export). Les auto-hébergeurs peuvent aussi sauvegarder directement la base de données du serveur ; voir [Sauvegardes](/self-hosting/backups).

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

Les archives sont partagées par l'intermédiaire des **espaces** (tenants). Chaque compte possède un espace personnel et peut être invité dans d'autres, par exemple celui d'un club. Tous les membres d'un espace voient et modifient l'ensemble de ses ruchers, ruches et archives ; il n'y a pas de partage par rucher. La synchronisation est sans conflit, si bien que deux personnes modifiant le même espace sur des appareils différents n'écrasent pas le travail l'une de l'autre. Voir [Comptes et espaces](/using-the-app/accounts-tenants).

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

Cinq langues sont livrées dans l'application : anglais, allemand, français, espagnol et italien. Changez de langue sous **Paramètres → Langue**. D'autres traductions sont les bienvenues sous forme de contributions.

## Quelles bases de données et quels stockages sont pris en charge ?

En auto-hébergement, le backend est modulaire :

- **Bases de données :** PostgreSQL, MySQL ou SQLite. Voir [Bases de données](/self-hosting/databases).
- **Stockage d'objets :** stockage d'objets compatible MinIO/S3, ou le système de fichiers local. Voir [Stockage](/self-hosting/storage).

## Comment me connecter ?

Le service hébergé utilise des comptes avec e-mail et mot de passe. Les auto-hébergeurs peuvent activer les comptes e-mail/mot de passe, ajouter des fournisseurs OIDC (Google, Keycloak, Authentik et similaires), activer les passkeys, ou désactiver entièrement la connexion pour une installation à utilisateur unique. Voir [Authentification](/self-hosting/authentication).

## Comment signaler un bug ou demander une fonctionnalité ?

Veuillez ouvrir un ticket dans le [dépôt GitHub](https://github.com/openbeehive-org/openbeehive-app). Des étapes de reproduction claires, votre plateforme et votre navigateur, ainsi qu'une capture d'écran aident.

La [page de dépannage](/knowledge-base/troubleshooting) couvre peut-être déjà les problèmes courants.

## Comment puis-je contribuer ?

Les contributions de toutes sortes sont les bienvenues : code, documentation, traductions, rapports de bugs et idées. La pile technique est Go pour le backend et une PWA SvelteKit pour le frontend.

## Quelle est cette version ?

Les versions sont étiquetées sur [GitHub](https://github.com/openbeehive-org/openbeehive-app/releases). Les auto-hébergeurs exécutent le tag qu'ils ont compilé ou le tag d'image qu'ils ont téléchargé ; consultez le [guide de mise à niveau](/self-hosting/upgrading) à la sortie de nouvelles versions.
