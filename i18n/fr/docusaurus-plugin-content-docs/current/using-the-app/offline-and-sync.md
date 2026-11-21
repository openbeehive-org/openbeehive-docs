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
Comme les enregistrements sont stockés sur l'appareil, installez Openbeehive comme une application plutôt que de l'utiliser dans un onglet de navigateur. Voir [Installer Openbeehive](./install.md).
:::

## L'état de synchronisation \{#sync-status}

Une petite pastille d'état en haut de chaque page (et sous votre adresse e-mail dans la barre latérale) indique si les modifications de cet appareil ont atteint le serveur :

| La pastille affiche | Signification |
| --- | --- |
| **Synchronisé** et une heure | Tout ce qui se trouve sur cet appareil est sur le serveur. |
| **Synchronisation…** | Un échange avec le serveur est en cours. |
| **Modifications en attente d’envoi** | Des modifications sont enregistrées sur l'appareil et pas encore envoyées. |
| **Hors ligne** ou **Hors ligne · modifications en attente** | Pas de connexion. Les modifications attendent sur l'appareil. |
| **Échec de la synchronisation · nouvel essai** | Le serveur n'a pas pu être joint ou a répondu par une erreur. L'application continue d'essayer. |
| **Déconnecté · connectez-vous pour synchroniser** | Votre session a pris fin. Touchez la pastille pour vous connecter ; rien n'est perdu. |
| **Problèmes de synchronisation : 2** | Deux modifications n'ont pas pu être synchronisées ; voir ci-dessous. |
| **Application obsolète · mettez-la à jour pour synchroniser** | Le serveur exige une version plus récente de l'application. Chargez la nouvelle version ; d'ici là, les modifications attendent sur l'appareil. |

Touchez la pastille pour ouvrir l'**État de la synchronisation** : l'état, la dernière synchronisation de cet appareil, le nombre de modifications et de photos en attente d'envoi et, s'il y en a, le nombre de modifications refusées par le serveur, avec **Voir les problèmes de synchronisation**. **Synchroniser maintenant** lance aussitôt une synchronisation. Une visite peut représenter plusieurs modifications : la visite elle-même, ses photos et son entrée dans la chronologie. Sans toucher la pastille, l'application synchronise après chaque modification, à intervalles rapprochés tant qu'elle est ouverte, et dès que la connexion revient.

Tant que l'appareil n'a pas de connexion, une barre en haut de la page indique aussi « Hors ligne : les modifications sont enregistrées et synchronisées plus tard. » C'est purement informatif ; continuez exactement comme avant.

:::note
Un indicateur hors ligne persistant signifie généralement une couverture faible au rucher. S'il reste affiché même avec une bonne connexion à la maison, consultez [Dépannage](../knowledge-base/troubleshooting.md).
:::

### Problèmes de synchronisation \{#sync-problems}

De temps à autre, le serveur n'accepte pas une modification, par exemple parce que l'enregistrement appartient à un autre espace ou parce que l'horloge de l'appareil avançait beaucoup. Une telle modification n'est pas jetée : elle reste sur l'appareil, et la pastille affiche **Problèmes de synchronisation** avec le nombre de modifications refusées. La liste **Problèmes de synchronisation** sous **Paramètres → Données et synchro** nomme chacune avec le motif et propose **Réessayer** (ou **Tout réessayer**) et **Abandonner**. Abandonner arrête l'envoi ; l'enregistrement reste tel quel sur cet appareil mais n'atteint jamais le serveur, vos autres appareils ni les autres membres.

La liste affiche aussi les modifications reçues du serveur que cet appareil n'a pas pu appliquer, marquées « modification reçue non appliquée ». Les enregistrements de cet appareil restent tels quels, et le reste de la synchronisation continue. Une telle entrée peut seulement être abandonnée ; si la même modification arrive de nouveau, elle remplace l'entrée.

### Horloges des appareils

Chaque modification porte l'heure de l'appareil qui l'a faite. Le serveur refuse les modifications horodatées plus de 10 minutes en avance sur sa propre heure. L'application apprend l'heure du serveur à chaque synchronisation, compense une horloge d'appareil fausse, puis horodate et renvoie d'elle-même ces modifications.

## Votre première synchronisation sur un nouvel appareil

Se connecter sur un nouvel appareil, ou rouvrir l'application après l'effacement de son stockage, démarre avec une base de données locale vide. L'application charge depuis le serveur les enregistrements actuels de l'espace, et non l'historique complet de chaque modification, et remplit la base en arrière-plan :

- Les listes affichent des **espaces réservés scintillants** pendant qu'elles lisent la base de données locale.
- Tant que le premier téléchargement est en cours, la Vue d'ensemble et les listes de ruchers, de ruches et de tâches affichent **« Synchronisation de vos données… »** plutôt qu'un état vide.
- Les grands jeux de données apparaissent **progressivement** : chaque lot reçu par l'application est affiché aussitôt.

Ce n'est qu'une fois que l'application sait que les données sont complètes qu'elle affiche un véritable état vide. Si l'appareil est hors ligne ou que le serveur est injoignable, l'indication cède la place à ce qui est stocké localement.

Après la mise à jour de l'application vers la version 0.5.0, chaque appareil charge une nouvelle fois les enregistrements actuels depuis le serveur. Cela comble les lacunes que des versions antérieures pouvaient laisser et ne demande aucune action de votre part. Un appareil qui ne s'est pas synchronisé depuis plus longtemps que le serveur ne conserve sa liste de modifications (180 jours par défaut) fait de même.

### Après une restauration du serveur \{#after-restore}

Si l'opérateur restaure le serveur à partir d'une sauvegarde, il se peut que le serveur ne dispose plus de modifications que votre appareil avait déjà synchronisées. L'application s'en aperçoit à la synchronisation suivante, renvoie tous les enregistrements qu'elle détient, avec les photos qu'elle conserve, et charge les données actuelles. Elle affiche alors « Les données du serveur ont été réinitialisées ou restaurées. Cet appareil a renvoyé ses enregistrements et chargé les données actuelles. » Il n'y a rien à faire ; touchez **OK** pour fermer le message.

## Synchroniser entre vos appareils

Utilisez Openbeehive sur plusieurs appareils, un téléphone sur le terrain et un ordinateur portable à la maison, et ils restent en phase. Chaque appareil conserve sa propre copie locale et échange les modifications avec le serveur en arrière-plan. Enregistrez une visite sur votre téléphone aux ruches, et le temps de vous asseoir devant votre ordinateur portable, elle y est. Tant que chaque appareil se connecte au même compte, ils voient tous les mêmes enregistrements.

## Que se passe-t-il quand deux appareils modifient la même chose

Openbeehive résout les modifications qui se chevauchent **automatiquement**, sans question du type « quelle version voulez-vous garder ? ».

- **Vous modifiez la note d'un rucher sur votre téléphone, votre coapiculteur modifie la même note sur le sien.** La modification la plus récente de ce champ l'emporte.
- **Vous ajoutez tous les deux des photos à la même visite hors ligne.** Les deux séries de photos sont conservées.
- **Vous changez vos unités sur un appareil.** Les unités et la langue sont enregistrées avec votre compte et vous suivent sur chaque appareil ; voir [Paramètres](./dashboard.md#settings).
- **Vous consignez chacun une visite distincte.** Chaque visite, récolte et traitement est un enregistrement à part entière ; les deux sont donc conservées côte à côte.

Chaque appareil converge vers le même état une fois que tous ont synchronisé.

:::tip
En bref : ajoutez librement, modifiez en confiance. Le fonctionnement sous le capot est décrit sur les pages [protocole de synchronisation](../developers/sync-protocol.md) et [architecture](../developers/architecture.md).
:::

## Photos \{#photos}

Une photo se compose de deux parties. Un petit aperçu se synchronise avec l'enregistrement comme tout le reste : chaque appareil l'affiche donc immédiatement, même hors ligne. L'image en taille réelle reste sur l'appareil qui a pris la photo et est envoyée en arrière-plan dès qu'une connexion est disponible ; d'ici là, la photo affiche **En attente d'envoi**. Les autres appareils chargent l'image complète la première fois que vous ouvrez la photo et en gardent une copie.

Supprimer une photo est définitif : elle disparaît de tous les appareils et l'image est retirée du serveur. Les appareils qui utilisent encore la version 0.4 de l'application ne voient pas les photos ajoutées par les appareils mis à jour.

## Partage

Les enregistrements se partagent via les **espaces**. Chaque membre d'un espace voit et modifie tous ses ruchers, ruches et enregistrements ; il n'y a pas de partage par rucher ou par ruche. Les [tâches](./tasks.md) font exception : elles sont personnelles.

| Rôle | Ce qu'il peut faire |
| --- | --- |
| **Admin** (propriétaire de l'espace) | Tout ce qu'un membre peut faire, plus inviter et révoquer, et supprimer l'espace. |
| **Membre** | Ajouter et modifier des ruchers, ruches, visites, récoltes et traitements dans l'espace. |

Pour partager un emplacement avec un mentor tout en gardant les autres privés, placez cet emplacement dans son propre espace et invitez-y le mentor. Les enregistrements partagés se synchronisent et résolvent les conflits exactement comme les vôtres. Voir [Comptes et espaces](./accounts-tenants.md).

## Si quelque chose ne peut pas être enregistré

L'enregistrement se fait sur votre appareil, il n'échoue donc pratiquement jamais. Si cela arrive (par exemple parce que le stockage du navigateur est plein ou endommagé), le formulaire reste ouvert avec tout ce que vous avez saisi et un message d'erreur explique ce qui s'est passé.

Le **compte de démonstration** public est en lecture seule : une bannière l'indique, et les formulaires d'enregistrement affichent une note et un bouton **Enregistrer** désactivé. Supprimer, modifier les photos et cocher les tâches sont également désactivés. Si une modification passe malgré tout, le serveur la refuse, et l'application l'annule et indique qu'elle n'a pas été enregistrée.

Il existe une situation où l'enregistrement fonctionne mais ne dure pas : si le navigateur ne peut pas donner à l'application son stockage privé (une fenêtre de navigation privée, ou un stockage bloqué dans les réglages du navigateur), l'application garde les enregistrements en mémoire et affiche un bandeau : **« Ce navigateur n'enregistre aucune donnée sur cet appareil (fenêtre privée ou stockage bloqué). Tout ce qui n'est pas synchronisé est perdu à la fermeture de cet onglet. »** Tout continue de fonctionner pendant la session, et les modifications se synchronisent toujours avec le serveur si vous êtes connecté, mais la copie locale disparaît à la fermeture de l'onglet. Voir [Dépannage](../knowledge-base/troubleshooting.md#storage-is-unavailable).

## Un seul onglet à la fois \{#one-tab}

Un seul onglet ou une seule fenêtre peut travailler à la fois avec les enregistrements d'un appareil. Si vous ouvrez Openbeehive dans un second onglet, celui-ci affiche **« Openbeehive est ouvert dans un autre onglet »**. Continuez dans le premier onglet, ou touchez **Utiliser ici** pour déplacer l'application dans le nouvel onglet ; l'autre affiche alors l'avis.

## Vais-je perdre des données ?

Vos enregistrements sont d'abord écrits sur votre appareil et ne sont pas supprimés parce que vous êtes hors ligne ou que l'application se ferme. Ils attendent sur l'appareil jusqu'à pouvoir être synchronisés.

Sur un appareil partagé, chaque compte conserve sa propre copie locale par espace. Lorsqu'une autre personne se connecte dans le même navigateur, elle ne voit pas vos modifications non envoyées ni vos tâches personnelles, et rien de ce qui vous appartient n'est envoyé sous son compte ; vos modifications partent la prochaine fois que vous vous y connectez.

Si vous auto-hébergez, conservez aussi des sauvegardes du serveur. Voir [Sauvegardes](../self-hosting/backups.md).
