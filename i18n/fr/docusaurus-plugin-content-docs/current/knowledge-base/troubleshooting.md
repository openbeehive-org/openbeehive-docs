---
sidebar_position: 6
title: "Dépannage"
---

# Dépannage

La plupart des problèmes avec Openbeehive entrent dans une poignée de catégories : la synchronisation, le stockage local, l'appareil photo / le scanner QR, ou la connexion. Cette page passe en revue chacune d'elles, avec des vérifications pratiques que vous pouvez effectuer vous-même avant de demander de l'aide.

Vos archives résident dans une base de données locale sur votre appareil, si bien que presque rien de ce que vous faites ici ne peut perdre des données déjà synchronisées sur le serveur.

## Les données ne se synchronisent pas \{#data-not-syncing}

Vos modifications sont enregistrées instantanément sur l'appareil. La synchronisation vers le serveur se fait discrètement en arrière-plan, donc un délai est normal et rarement préoccupant. Si des modifications faites sur un appareil n'apparaissent pas sur un autre, parcourez cette liste.

**1. Lisez l'état de synchronisation.** La pastille en haut de la page indique ce qui se passe : **Hors ligne**, **En attente d'envoi**, **Échec de la synchronisation · nouvel essai**, **Déconnecté** ou **Problèmes de synchronisation**. Voir [l'état de synchronisation](../using-the-app/offline-and-sync.md#sync-status). Si vous avez travaillé sur le terrain sans réseau, vos modifications sont mises en file d'attente et sont envoyées dès la reconnexion.

**2. Vérifiez que vous êtes connecté.** La synchronisation nécessite une session. Si elle a expiré, la pastille affiche **Déconnecté · connectez-vous pour synchroniser** ; vous pouvez toujours lire et modifier localement, mais rien ne se synchronise tant que vous ne vous reconnectez pas. **Paramètres → Compte** indique avec quel compte vous êtes connecté.

**3. Vérifiez l'espace actif.** Les archives appartiennent à un espace. Si une ruche manque sur un autre appareil, ouvrez-y **Paramètres → Espaces** et assurez-vous que le même espace est actif. Si elle manque pour une autre personne, celle-ci n'est pas membre de cet espace ; un administrateur de l'espace peut l'inviter.

**4. Synchronisez maintenant.** La synchronisation en arrière-plan s'exécute à intervalles rapprochés ; toucher la pastille d'état lance aussitôt une synchronisation.

**5. Cherchez les modifications refusées.** Si la pastille affiche **Problèmes de synchronisation**, le serveur n'a pas accepté certaines modifications. Elles sont toujours sur l'appareil. La liste **Problèmes de synchronisation** nomme chacune avec le motif et vous permet de réessayer ou de l'abandonner ; voir [Problèmes de synchronisation](../using-the-app/offline-and-sync.md#sync-problems). Une horloge d'appareil très en avance en est une cause ; l'application la compense et renvoie d'elle-même les modifications, mais régler l'appareil sur l'heure automatique l'évite.

:::note
La synchronisation est sans conflit par conception. La modification la plus récente d'un champ l'emporte, les ajouts (photos, visites, récoltes, traitements) sont conservés, et vous ne perdrez pas de travail parce que deux appareils ont modifié en même temps.
:::

Si vous l'hébergez vous-même et que la synchronisation échoue pour tout le monde, le problème est plus probablement côté serveur. Voir [Configuration de l'auto-hébergement](../self-hosting/configuration.md) et vérifiez les journaux du serveur.

## Comment fonctionne le stockage local

Openbeehive est une Progressive Web App (PWA). Il conserve l'intégralité de votre jeu de données dans une base de données SQLite qui s'exécute à l'intérieur de votre navigateur, stockée dans **OPFS** (l'Origin Private File System). Chaque lecture et chaque écriture se fait contre cette base de données locale, ce qui explique pourquoi l'application semble instantanée et fonctionne sans aucun réseau.

Quelques conséquences pratiques :

- Vos données sont liées au navigateur et à l'appareil sur lequel vous utilisez Openbeehive. Chaque appareil conserve sa propre copie locale et se synchronise au serveur.
- Le stockage OPFS est privé à l'origine de l'application. Les autres sites web ne peuvent pas le lire.
- Installer l'application sur votre écran d'accueil (voir [Installation](../using-the-app/install.md)) utilise le même stockage que l'onglet du navigateur sur la plupart des plateformes.

:::caution
Les outils de navigateur qui « effacent les données du site », « effacent les cookies et le stockage », ou la navigation privée/incognito peuvent effacer la base de données OPFS locale. Cela n'est sans danger **que si vos données ont déjà été synchronisées** sur le serveur, car elles seront retéléchargées à la prochaine connexion. Si vous avez des modifications hors ligne non synchronisées, assurez-vous d'être en ligne et laissez la synchronisation se terminer d'abord.
:::

### « unable to open database file » ou un bouton qui ne fait rien

Les versions antérieures à la 0.2.2 pouvaient épuiser les emplacements réservés du stockage local ; chaque enregistrement échouait alors avec `SQLITE_CANTOPEN: unable to open database file`, visible comme un bouton qui semblait ne rien faire. Depuis la 0.2.2, l'application réserve d'emblée assez d'emplacements et répare automatiquement le stockage quand il vient à manquer. Si l'erreur persiste, rechargez l'application deux fois (pour que la nouvelle version prenne le relais) et réessayez ; les enregistrements déjà sauvegardés ne sont pas affectés.

### « Ce navigateur n'enregistre aucune donnée sur cet appareil » \{#storage-is-unavailable}

L'application conserve sa base de données dans le stockage privé du navigateur. Quand elle
ne peut pas ouvrir ce stockage, elle garde les enregistrements en mémoire et affiche ce
bandeau pour que vous soyez au courant. Les modifications fonctionnent toujours et se
synchronisent toujours avec le serveur tant que vous êtes connecté, mais la copie locale
disparaît à la fermeture de l'onglet.

Les causes courantes sont la **navigation privée ou incognito** (les navigateurs
n'accordent aucun stockage persistant à ces fenêtres) et un stockage bloqué dans les
réglages du navigateur. Utilisez une fenêtre normale, ou installez l'application.

### « Openbeehive est ouvert dans un autre onglet »

Un seul onglet ou une seule fenêtre peut travailler à la fois avec les enregistrements
d'un appareil. Un second onglet affiche cet avis à la place de l'application. Continuez
dans le premier onglet, ou touchez **Utiliser ici** pour déplacer l'application dans cet
onglet. Voir [Un seul onglet à la fois](../using-the-app/offline-and-sync.md#one-tab).

### L'application affiche « Synchronisation de vos données… » au lieu de mes ruchers

C'est la première synchronisation sur cet appareil, encore en cours de téléchargement. Depuis
la version 0.2.3 de l'application, le tableau de bord et les listes affichent des espaces
réservés et cette indication jusqu'à ce que les données soient complètes, et se remplissent
progressivement à mesure que les lots arrivent. Restez en ligne et laissez-lui un instant ;
sur un grand jeu de données, les listes grandissent sous vos yeux. Si l'indication ne
disparaît jamais, suivez [Les données ne se synchronisent pas](#data-not-syncing).

### L'application ne répond pas sous mon nom d'hôte (auto-hébergement, sans connexion)

Un serveur sans connexion ne répond qu'à `localhost`, aux adresses IP et à l'hôte de
`BEEHIVE_PUBLIC_BASE_URL`. Ouvert sous un autre nom, il répond par une simple page `403`
qui indique la solution : ajoutez le nom à `BEEHIVE_ALLOWED_HOSTS` ou réglez
`BEEHIVE_PUBLIC_BASE_URL` sur l'adresse que vous utilisez. Voir
[Configuration](../self-hosting/configuration.md#allowed-hosts).

## Effacer ou réinstaller l'application

Parfois, un nouveau départ corrige un comportement étrange après une mise à jour. Tant que vous êtes connecté à un compte qui se synchronise, cette opération est non destructive : vos archives synchronisées reviennent du serveur.

1. Confirmez que vous êtes **en ligne et connecté**, et que la pastille d'état affiche **Synchronisé**.
2. Désinstallez ou retirez la PWA de votre écran d'accueil, ou effacez le stockage du site dans les réglages de votre navigateur.
3. Rouvrez Openbeehive et connectez-vous.
4. Attendez que la synchronisation initiale télécharge vos ruchers, ruches et historique.

:::danger
N'effacez pas le stockage si vous avez des modifications uniquement hors ligne qui n'ont pas encore atteint le serveur (par exemple, des inspections enregistrées sur le terrain hors réseau). Ces modifications n'existent que sur cet appareil tant que la synchronisation n'est pas terminée. Connectez-vous et laissez la synchronisation se terminer d'abord.
:::

## L'appareil photo et le scanner QR ne fonctionnent pas

Chaque ruche peut porter une étiquette QR imprimable qui pointe directement vers cette ruche (voir [Étiquettes QR](../using-the-app/qr-labels.md)). Le scan nécessite l'accès à l'appareil photo.

- **Accordez l'autorisation d'accès à l'appareil photo.** Lorsque cela vous est demandé, autorisez l'accès à l'appareil photo. Si vous l'aviez précédemment refusé, réactivez-le dans les réglages de votre navigateur ou de votre système d'exploitation pour le site, puis rechargez.
- **Utilisez HTTPS.** Les navigateurs n'autorisent l'accès à l'appareil photo que sur des origines sécurisées. L'application hébergée est servie en HTTPS ; les auto-hébergeurs doivent aussi servir en HTTPS (ou `localhost` pour les tests). Voir [Proxy inverse](../self-hosting/reverse-proxy.md).
- **Vérifiez qu'il n'est pas déjà utilisé.** Fermez les autres applications ou onglets susceptibles de mobiliser l'appareil photo.

:::tip[Pas d'appareil photo, ou une étiquette usée]
Le scanner intégré à l'application fonctionne dans tous les navigateurs actuels, y compris Safari sur iPhone et iPad et Firefox. Si l'appareil photo ne peut pas être utilisé ou si l'étiquette est difficile à lire, saisissez les six caractères imprimés sous le code QR dans **Code de l'étiquette** sur l'écran Scanner. Si vous utilisez l'application installée, scannez depuis celle-ci plutôt qu'avec l'application Appareil photo du téléphone, qui ouvre le lien dans le navigateur avec ses propres données, séparées.
:::

## Problèmes de connexion

- **Bloqué sur l'écran de connexion.** Confirmez que vous accédez à la bonne adresse (l'application hébergée est sur app.openbeehive.org). Après vous être connecté avec votre fournisseur, vous devriez être redirigé automatiquement ; sinon, rechargez la page.
- **Échec de redirection ou erreurs « invalid redirect » (auto-hébergement).** Cela signifie presque toujours que l'URL de redirection OIDC ou `BEEHIVE_PUBLIC_BASE_URL` est mal configurée. Voir [Authentification et configuration](../self-hosting/authentication.md).
- **« Trop de tentatives. »** Après 10 connexions échouées pour un compte, ou 30 depuis une même adresse réseau, les tentatives suivantes sont bloquées pendant 15 minutes au maximum. Patientez et réessayez.
- **Le serveur refuse de démarrer après l'activation de la connexion (auto-hébergement).** Le journal nomme le paramètre manquant, en général `BEEHIVE_SESSION_SECRET` (au moins 32 octets) ou le compte administrateur. Voir [Authentification](../self-hosting/authentication.md).
- **Passkey non proposée.** Les passkeys doivent être activées sur le serveur et vous devez en avoir ajouté une sous Paramètres → Passkeys. Sinon, connectez-vous avec une autre méthode.
- **Auto-hébergement à utilisateur unique sans connexion.** Avec l'authentification par mot de passe désactivée, sans fournisseur OIDC et avec WebAuthn désactivé, il n'y a aucune étape de connexion. Si vous voyez de manière inattendue un écran de connexion, vérifiez la configuration de votre serveur.

## Rédiger un bon rapport de bug

Si rien de ce qui précède n'aide, veuillez ouvrir un ticket sur [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Un rapport clair obtient une correction plus rapide. Essayez d'inclure :

| Détail | Exemple |
| --- | --- |
| Ce que vous avez fait | « Appuyé sur Enregistrer pour une nouvelle inspection » |
| Ce que vous attendiez | « L'inspection apparaît dans la chronologie de la ruche » |
| Ce qui s'est passé à la place | « Roue de chargement, puis l'entrée a disparu » |
| Version de l'application | La version que vous exécutez : le tag d'image ou le tag git sur une instance auto-hébergée |
| Plateforme et navigateur | iPhone 14, iOS 17, Safari |
| Hébergé ou auto-hébergé | Auto-hébergé, profil `selfhost`, SQLite |
| En ligne ou hors ligne | « J'étais hors ligne sur le terrain, en cours de synchronisation » |
| Reproductible ? | « Se produit à chaque fois » / « Une seule fois » |

:::caution
Veuillez ne pas coller de secrets. Masquez les secrets de session, les secrets client OIDC, les mots de passe de base de données et les données personnelles avant de partager des journaux ou de la configuration.
:::

Pour les questions d'auto-hébergement, commencez par la [référence de configuration](../self-hosting/configuration.md).
