---
sidebar_position: 9
title: "Étiquettes QR"
---

# Étiquettes QR

Une étiquette QR transforme une ruche en raccourci accessible d'un seul geste. Collez une étiquette sur le toit ou le corps de ruche, pointez votre téléphone dessus, et Openbeehive s'ouvre sur la fiche de cette ruche. Plus besoin de faire défiler des listes au rucher, ni de plisser les yeux sur des numéros écrits à la main sous la pluie.

## Ce que contient le code QR

Le code de chaque ruche encode un seul lien profond vers cette ruche :

```text
<base>/h/<hiveId>
```

`<base>` est l'adresse à laquelle vous utilisez l'application (`https://app.openbeehive.org` sur le service hébergé, votre propre URL sur une instance auto-hébergée) et `<hiveId>` est l'identifiant de la ruche. L'étiquette imprime aussi un code court de six caractères dérivé de l'identifiant, pour distinguer les étiquettes à l'œil.

Le code ne contient aucune donnée sur les abeilles ni aucune information personnelle ; ce n'est qu'un lien. Une personne qui le scanne sans accès est invitée à se connecter et ne voit la ruche que si elle est membre de l'espace qui la contient.

Une fois l'application installée, le lien ouvre la ruche depuis votre base de données locale ; il fonctionne donc sans réseau.

## Imprimer une étiquette pour une ruche

1. Ouvrez la ruche.
2. Choisissez **Plus → Code QR**. Une carte apparaît avec le code, le nom de la ruche et le code court.
3. Touchez **Imprimer**. Une étiquette épurée s'ouvre dans une nouvelle fenêtre, suivie de la boîte de dialogue d'impression. **SVG** télécharge plutôt le code sous forme de fichier, pour vos propres mises en page d'étiquettes.
4. Imprimez sur du papier pour étiquettes ou du papier ordinaire et fixez-la sur la ruche.

:::tip[Pour qu'elle dure en extérieur]
Imprimez sur du papier pour étiquettes résistant aux intempéries ou en vinyle, ou recouvrez une étiquette papier de ruban adhésif transparent ou d'une pochette plastifiée. Placez-la là où les hausses que l'on soulève et repose ne la rayeront pas : le côté du corps de ruche ou sous le rebord du toit.
:::

## Imprimer une feuille pour un rucher

1. Ouvrez le rucher.
2. Touchez **Étiquettes QR**.
3. La boîte de dialogue d'impression s'ouvre avec une feuille A4 comportant un code étiqueté par ruche de ce rucher.
4. Imprimez, découpez et appliquez.

## Scanner une étiquette

### Avec l'appareil photo de votre téléphone

La plupart des téléphones reconnaissent les codes QR dans l'application appareil photo intégrée. Pointez l'appareil photo vers l'étiquette, touchez le lien qui apparaît, et Openbeehive s'ouvre sur la ruche dans le navigateur. Cela fonctionne pour toute personne ayant accès, sans ouvrir l'application au préalable.

:::caution[Si vous avez installé l'application, scannez depuis celle-ci]
L'appareil photo du téléphone ouvre le lien dans le navigateur, et le navigateur conserve ses propres données, séparées de celles de l'application installée : vous devrez peut-être vous y reconnecter et attendre un téléchargement. Si vous utilisez l'application installée, ouvrez-la depuis l'écran d'accueil et utilisez **Scanner**.
:::

### Avec le scanner intégré

**Scanner** dans la navigation ouvre le scanner propre à Openbeehive, utile lorsque vous êtes déjà dans l'application et passez d'une ruche à l'autre.

1. Ouvrez **Scanner** et accordez l'autorisation d'accès à la caméra la première fois.
2. Visez le code QR de la ruche ; la ruche s'ouvre dès qu'il est reconnu.

Le scanner fonctionne dans tous les navigateurs actuels, y compris Safari sur iPhone et iPad et Firefox. Si une étiquette est difficile à lire, rapprochez-vous, ne bougez pas et évitez les reflets.

### En saisissant le code

Sous l'image de la caméra, **Code de l'étiquette** accepte les six caractères imprimés sous le code QR. Saisissez-les et touchez **Ouvrir la ruche**. Cela fonctionne aussi lorsque l'étiquette est trop usée pour être scannée, lorsque l'appareil n'a pas de caméra ou lorsque l'accès à la caméra est bloqué. Le code est recherché parmi les ruches présentes sur l'appareil.

## Si un scan n'ouvre pas la bonne ruche

| Symptôme | Cause probable | Que faire |
| --- | --- | --- |
| La caméra n'arrive pas à faire la mise au point sur le code | Étiquette mouillée, délavée ou gondolée | Essuyez-la ; réimprimez-la si elle est usée |
| « Cette ruche ne fait pas partie de vos données » | La ruche a été supprimée, ou appartient à un autre espace | Vérifiez que la ruche existe toujours et que le bon espace est actif (Paramètres → Espaces) |
| « Vous êtes hors ligne » | La ruche n'a pas encore été téléchargée sur cet appareil | Connectez-vous à Internet ; la ruche s'ouvre une fois vos données synchronisées |
| « Connectez-vous pour ouvrir cette ruche » | Ce navigateur n'est pas connecté. Typique après un scan avec l'application appareil photo alors que vous utilisez d'habitude l'application installée | Connectez-vous, ou scannez depuis l'application installée |
| « Serveur injoignable » | La ruche n'est pas sur l'appareil et le serveur n'a pas répondu | Vérifiez votre connexion et touchez **Réessayer** |
| « Ce n'est pas une étiquette de ruche Openbeehive. » | Le code scanné est un autre code QR | Scannez l'étiquette de la ruche |
| Rien ne se passe au toucher | Le téléphone n'a pas reconnu le code comme un lien | Utilisez le scanner intégré ou saisissez le code de l'étiquette |

L'accès suit l'appartenance à l'espace ; voir [Comptes et espaces](./accounts-tenants.md).

## Réimprimer et changer les étiquettes

Les étiquettes n'expirent jamais. Le lien reste valide pendant toute la vie de la fiche de la ruche. Si vous mettez une caisse au rebut mais conservez la colonie comme la même ruche dans Openbeehive, l'ancienne étiquette continue de fonctionner. Si vous créez une nouvelle fiche de ruche, imprimez une nouvelle étiquette.

Les étiquettes encodent l'adresse depuis laquelle vous les avez imprimées. Si votre instance auto-hébergée change de domaine, réimprimez.

:::caution
Ne déplacez pas une étiquette imprimée d'une caisse à une autre en espérant qu'elle pointe vers la nouvelle colonie ; elle ouvre toujours la ruche d'origine. Imprimez plutôt une nouvelle étiquette.
:::

Détails techniques du format du lien : [Codes QR pour les développeurs](../developers/qr-codes.md).
