---
sidebar_position: 6
title: "Dépannage"
---

# Dépannage

La plupart des problèmes avec Openbeehive entrent dans une poignée de catégories : la synchronisation, le stockage local, l'appareil photo / le scanner QR, ou la connexion. Cette page passe en revue chacune d'elles, avec des vérifications pratiques que vous pouvez effectuer vous-même avant de demander de l'aide.

La bonne nouvelle : comme Openbeehive fonctionne hors ligne d'abord, vos archives résident dans une base de données locale sur votre appareil. Presque rien de ce que vous faites ici ne peut perdre des données déjà synchronisées sur le serveur.

## Les données ne se synchronisent pas

Vos modifications sont enregistrées instantanément sur l'appareil. La synchronisation vers le serveur se fait discrètement en arrière-plan, donc un délai est normal et rarement préoccupant. Si des modifications faites sur un appareil n'apparaissent pas sur un autre, parcourez cette liste.

**1. Vérifiez que vous êtes en ligne.** La synchronisation ne s'exécute que lorsque vous avez une connexion réseau. Regardez l'indicateur d'état de synchronisation dans l'application. Si vous avez travaillé sur le terrain sans réseau, vos modifications sont mises en file d'attente en toute sécurité et seront envoyées dès la reconnexion.

**2. Vérifiez que vous êtes connecté.** La synchronisation nécessite une session authentifiée. Si votre session a expiré, vous pourrez toujours lire et modifier localement, mais rien ne se synchronisera tant que vous ne vous reconnecterez pas. Ouvrez le menu du compte et confirmez que vous êtes connecté.

**3. Vérifiez la portée du rucher.** Le partage dans Openbeehive se fait au niveau du rucher via des **portées** (scopes). Si une ruche ou une inspection manque sur un autre appareil ou pour une autre personne, vérifiez que le rucher concerné est bien partagé avec ce compte. Les archives d'un rucher auquel vous n'avez pas accès n'apparaîtront jamais.

**4. Patientez un instant, puis rouvrez.** La synchronisation en arrière-plan s'exécute périodiquement. Fermer et rouvrir l'application, ou y revenir depuis l'arrière-plan, déclenche une nouvelle tentative de synchronisation.

:::note
La synchronisation est sans conflit par conception. Openbeehive utilise des horloges logiques hybrides avec « le dernier qui écrit l'emporte » pour les champs individuels et des ensembles « l'ajout l'emporte » pour les listes, et les événements en ajout seul (inspections, traitements, récoltes) n'entrent jamais en conflit. Vous ne perdrez pas de travail parce que deux appareils ont modifié en même temps. La modification la plus récente d'un champ donné l'emporte ; les deux ajouts à une liste sont conservés.
:::

Si vous l'hébergez vous-même et que la synchronisation échoue pour tout le monde, le problème est plus probablement côté serveur. Voir [Configuration de l'auto-hébergement](/self-hosting/configuration) et vérifiez les journaux du serveur.

## Comment fonctionne le stockage local

Openbeehive est une Progressive Web App (PWA). Il conserve l'intégralité de votre jeu de données dans une base de données SQLite qui s'exécute à l'intérieur de votre navigateur, stockée dans **OPFS** (l'Origin Private File System). Chaque lecture et chaque écriture se fait contre cette base de données locale, ce qui explique pourquoi l'application semble instantanée et fonctionne sans aucun réseau.

Quelques conséquences pratiques :

- Vos données sont liées au navigateur et à l'appareil sur lequel vous utilisez Openbeehive. Chaque appareil conserve sa propre copie locale et se synchronise au serveur.
- Le stockage OPFS est privé à l'origine de l'application. Les autres sites web ne peuvent pas le lire.
- Installer l'application sur votre écran d'accueil (voir [Installation](/using-the-app/install)) utilise le même stockage que l'onglet du navigateur sur la plupart des plateformes.

:::caution
Les outils de navigateur qui « effacent les données du site », « effacent les cookies et le stockage », ou la navigation privée/incognito peuvent effacer la base de données OPFS locale. Cela n'est sans danger **que si vos données ont déjà été synchronisées** sur le serveur, car elles seront retéléchargées à la prochaine connexion. Si vous avez des modifications hors ligne non synchronisées, assurez-vous d'être en ligne et laissez la synchronisation se terminer d'abord.
:::

### « unable to open database file » ou un bouton qui ne fait rien

Les versions antérieures à la 0.2.2 pouvaient épuiser les emplacements réservés du stockage local ; chaque enregistrement échouait alors avec `SQLITE_CANTOPEN: unable to open database file` — visible comme un bouton qui semblait ne rien faire. Depuis la 0.2.2, l'application réserve d'emblée assez d'emplacements et répare automatiquement le stockage quand il vient à manquer. Si l'erreur persiste, rechargez l'application deux fois (pour que la nouvelle version prenne le relais) et réessayez ; les enregistrements déjà sauvegardés ne sont pas affectés.

## Effacer ou réinstaller l'application

Parfois, un nouveau départ corrige un comportement étrange après une mise à jour. Tant que vous êtes connecté à un compte qui se synchronise, cette opération est non destructive : vos archives synchronisées reviennent du serveur.

1. Confirmez que vous êtes **en ligne et connecté**, et que l'indicateur de synchronisation montre que tout est à jour.
2. Désinstallez ou retirez la PWA de votre écran d'accueil, ou effacez le stockage du site dans les réglages de votre navigateur.
3. Rouvrez Openbeehive et connectez-vous.
4. Attendez que la synchronisation initiale télécharge vos ruchers, ruches et historique.

:::danger
N'effacez pas le stockage si vous avez des modifications uniquement hors ligne qui n'ont pas encore atteint le serveur (par exemple, des inspections enregistrées sur le terrain hors réseau). Ces modifications n'existent que sur cet appareil tant que la synchronisation n'est pas terminée. Connectez-vous et laissez la synchronisation se terminer d'abord.
:::

## L'appareil photo et le scanner QR ne fonctionnent pas

Chaque ruche peut porter une étiquette QR imprimable qui pointe directement vers cette ruche (voir [Étiquettes QR](/using-the-app/qr-labels)). Le scan nécessite l'accès à l'appareil photo.

- **Accordez l'autorisation d'accès à l'appareil photo.** Lorsque cela vous est demandé, autorisez l'accès à l'appareil photo. Si vous l'aviez précédemment refusé, réactivez-le dans les réglages de votre navigateur ou de votre système d'exploitation pour le site, puis rechargez.
- **Utilisez HTTPS.** Les navigateurs n'autorisent l'accès à l'appareil photo que sur des origines sécurisées. L'application hébergée est servie en HTTPS ; les auto-hébergeurs doivent aussi servir en HTTPS (ou `localhost` pour les tests). Voir [Proxy inverse](/self-hosting/reverse-proxy).
- **Vérifiez qu'il n'est pas déjà utilisé.** Fermez les autres applications ou onglets susceptibles de mobiliser l'appareil photo.

:::tip Safari sur iOS
Sur iPhone et iPad, le scanner intégré à l'application peut être restreint. Si le scan ne fonctionne pas, ouvrez l'**application Appareil photo** intégrée et pointez-la sur le code QR. iOS reconnaît le lien encodé et propose de l'ouvrir ; toucher le lien lance Openbeehive sur la bonne ruche. L'étiquette encode un simple lien web, donc n'importe quel lecteur de QR fonctionne en solution de repli.
:::

## Problèmes de connexion

- **Bloqué sur l'écran de connexion.** Confirmez que vous accédez à la bonne adresse (l'application hébergée est sur app.openbeehive.org). Après vous être connecté avec votre fournisseur, vous devriez être redirigé automatiquement ; sinon, rechargez la page.
- **Échec de redirection ou erreurs « invalid redirect » (auto-hébergement).** Cela signifie presque toujours que l'URL de redirection OIDC ou `BEEHIVE_PUBLIC_BASE_URL` est mal configurée. Voir [Authentification et configuration](/self-hosting/authentication).
- **Clé d'accès non proposée.** WebAuthn / les clés d'accès doivent être activées et vous devez avoir enregistré une clé d'accès sur cet appareil. Si elle n'est pas disponible, connectez-vous plutôt avec votre fournisseur habituel.
- **Auto-hébergement à utilisateur unique sans connexion.** Si vous fonctionnez sans fournisseur OIDC et avec WebAuthn désactivé, il n'y a aucune étape de connexion. Si vous voyez de manière inattendue un écran de connexion, vérifiez la configuration de votre serveur.

## Rédiger un bon rapport de bug

Si rien de ce qui précède n'aide, veuillez ouvrir un ticket sur [github.com/openbeehive-org/openbeehive-app](https://github.com/openbeehive-org/openbeehive-app). Un rapport clair obtient une correction plus rapide. Essayez d'inclure :

| Détail | Exemple |
| --- | --- |
| Ce que vous avez fait | « Appuyé sur Enregistrer pour une nouvelle inspection » |
| Ce que vous attendiez | « L'inspection apparaît dans la chronologie de la ruche » |
| Ce qui s'est passé à la place | « Roue de chargement, puis l'entrée a disparu » |
| Version de l'application | v0.1.0 (affichée dans l'écran À propos de l'application) |
| Plateforme et navigateur | iPhone 14, iOS 17, Safari |
| Hébergé ou auto-hébergé | Auto-hébergé, profil `selfhost`, SQLite |
| En ligne ou hors ligne | « J'étais hors ligne sur le terrain, en cours de synchronisation » |
| Reproductible ? | « Se produit à chaque fois » / « Une seule fois » |

:::caution
Veuillez ne pas coller de secrets. Masquez les secrets de session, les secrets client OIDC, les mots de passe de base de données et les données personnelles avant de partager des journaux ou de la configuration.
:::

Pour les questions d'auto-hébergement sur les bases de données, le stockage, l'authentification et les variables d'environnement, la [section Auto-hébergement](/category/self-hosting) et la [référence de configuration](/self-hosting/configuration) sont les meilleurs points de départ. Voir aussi la [FAQ](/knowledge-base/faq).
