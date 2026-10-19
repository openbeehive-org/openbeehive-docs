---
sidebar_position: 10
title: "Hors ligne et synchronisation"
---

# Hors ligne et synchronisation

Openbeehive est conçu pour le rucher, pas pour le bureau. Sur le terrain, vous avez rarement un signal fiable ; l'application fonctionne donc **hors ligne d'abord** : tout ce que vous faites est enregistré immédiatement sur votre appareil et synchronisé avec le serveur plus tard, en arrière-plan.

L'application ne vous fait jamais attendre le réseau. Ouvrez une ruche, enregistrez une visite, ajoutez une tâche, notez quelque chose sur la reine : tout est instantané, avec ou sans signal.

## Tout est enregistré localement

Openbeehive conserve une copie complète de vos enregistrements dans une petite base de données sur votre appareil. Chaque lecture et chaque écriture se fait d'abord sur cette copie locale.

- **C'est rapide.** Ouvrir une ruche ou faire défiler les visites n'attend jamais une barre de chargement.
- **Ça fonctionne sans signal.** Un bois, une vallée, une cave pleine de hausses.
- **Vos données sont à vous.** Les enregistrements vivent sur votre appareil ; le serveur est la copie qui sert à la synchronisation et au partage.

:::tip
Comme les enregistrements sont stockés sur l'appareil, installez Openbeehive comme une application plutôt que de l'utiliser dans un onglet de navigateur. Voir [Installer Openbeehive](/using-the-app/install).
:::

## L'indicateur hors ligne

Lorsque l'appareil n'a pas de connexion, le bloc de compte dans la barre latérale passe de **En ligne** à **Hors ligne** et une barre en haut de la page indique « Hors ligne : les modifications sont enregistrées et synchronisées plus tard. » C'est purement informatif ; continuez exactement comme avant.

Lorsque l'appareil est de nouveau en ligne, la barre disparaît et les modifications faites hors ligne sont envoyées automatiquement. Il n'y a pas de bouton « synchroniser maintenant ».

:::note
Un indicateur hors ligne persistant signifie généralement une couverture faible au rucher. S'il reste affiché même avec une bonne connexion à la maison, consultez [Dépannage](/knowledge-base/troubleshooting).
:::

## Votre première synchronisation sur un nouvel appareil

Se connecter sur un nouvel appareil, ou rouvrir l'application après l'effacement de son stockage, démarre avec une base de données locale vide qui se remplit en arrière-plan :

- Les listes affichent des **espaces réservés scintillants** pendant qu'elles lisent la base de données locale.
- Tant que le premier téléchargement est en cours, la Vue d'ensemble et les listes de ruchers, de ruches et de tâches affichent **« Synchronisation de vos données… »** plutôt qu'un état vide.
- Les grands jeux de données apparaissent **progressivement** : chaque lot reçu par l'application est affiché aussitôt.

Ce n'est qu'une fois que l'application sait que les données sont complètes qu'elle affiche un véritable état vide. Si l'appareil est hors ligne ou que le serveur est injoignable, l'indication cède la place à ce qui est stocké localement.

## Synchroniser entre vos appareils

Utilisez Openbeehive sur plusieurs appareils, un téléphone sur le terrain et un ordinateur portable à la maison, et ils restent en phase. Chaque appareil conserve sa propre copie locale et échange les modifications avec le serveur en arrière-plan. Enregistrez une visite sur votre téléphone aux ruches, et le temps de vous asseoir devant votre ordinateur portable, elle y est. Tant que chaque appareil se connecte au même compte, ils voient tous les mêmes enregistrements.

## Que se passe-t-il quand deux appareils modifient la même chose

Openbeehive résout les modifications qui se chevauchent **automatiquement**, sans question du type « quelle version voulez-vous garder ? ».

- **Vous modifiez la note d'un rucher sur votre téléphone, votre coapiculteur modifie la même note sur le sien.** La modification la plus récente de ce champ l'emporte.
- **Vous ajoutez tous les deux des photos à la même visite hors ligne.** Les deux séries de photos sont conservées.
- **Vous consignez chacun une visite distincte.** Les visites, récoltes et traitements ne font que s'ajouter ; les deux sont donc conservées côte à côte.

Chaque appareil converge vers le même état une fois que tous ont synchronisé.

:::tip
En bref : ajoutez librement, modifiez en confiance. Le fonctionnement sous le capot est décrit sur les pages [protocole de synchronisation](/developers/sync-protocol) et [architecture](/developers/architecture).
:::

## Partage

Les enregistrements se partagent via les **espaces** (tenants). Chaque membre d'un espace voit et modifie tous ses ruchers, ruches et enregistrements ; il n'y a pas de partage par rucher ou par ruche.

| Rôle | Ce qu'il peut faire |
| --- | --- |
| **Admin** (propriétaire de l'espace) | Tout ce qu'un membre peut faire, plus inviter et révoquer, et supprimer l'espace. |
| **Membre** | Ajouter et modifier des ruchers, ruches, visites, tâches, récoltes et traitements dans l'espace. |

Pour partager un emplacement avec un mentor tout en gardant les autres privés, placez cet emplacement dans son propre espace et invitez-y le mentor. Les enregistrements partagés se synchronisent et résolvent les conflits exactement comme les vôtres. Voir [Comptes et espaces](/using-the-app/accounts-tenants).

## Si quelque chose ne peut pas être enregistré

L'enregistrement se fait sur votre appareil, il n'échoue donc pratiquement jamais. Si cela arrive (par exemple parce que le stockage du navigateur est plein ou endommagé), le formulaire reste ouvert avec tout ce que vous avez saisi et un message d'erreur explique ce qui s'est passé.

Sur le **compte de démonstration** public, le serveur rejette les modifications (la démo se réinitialise toutes les heures). Vos modifications sont enregistrées sur votre appareil et y restent simplement au lieu de se synchroniser.

Il existe une situation où l'enregistrement fonctionne mais ne dure pas : si le navigateur ne peut pas donner à l'application son stockage privé, l'application se rabat sur une base de données en mémoire et affiche le message **« Le stockage est indisponible : les modifications ne seront pas conservées sur cet appareil. »** Tout continue de fonctionner pendant la session, et les modifications se synchronisent toujours avec le serveur si vous êtes connecté, mais la copie locale disparaît à la fermeture de l'onglet. Cela se produit dans les fenêtres de navigation privée et lorsqu'un second onglet de l'application détient encore le stockage ; voir [Dépannage](/knowledge-base/troubleshooting#storage-is-unavailable).

## Vais-je perdre des données ?

Vos enregistrements sont d'abord écrits sur votre appareil et ne sont pas supprimés parce que vous êtes hors ligne ou que l'application se ferme. Ils attendent sur l'appareil jusqu'à pouvoir être synchronisés.

Si vous auto-hébergez, conservez aussi des sauvegardes du serveur. Voir [Sauvegardes](/self-hosting/backups).
