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

Le code ne contient aucune donnée sur les abeilles ni aucune information personnelle ; ce n'est qu'un lien. Une personne qui le scanne sans accès est invitée à se connecter et ne voit la ruche que si elle est membre de l'espace (tenant) qui la contient.

Une fois l'application installée, le lien ouvre la ruche depuis votre base de données locale ; il fonctionne donc sans réseau.

## Imprimer une étiquette pour une ruche

1. Ouvrez la ruche.
2. Touchez l'action **QR** (l'icône de carré en pointillés à côté de Modifier et Déplacer). Une carte apparaît avec le code, le nom de la ruche et le code court.
3. Touchez **Imprimer**. Une étiquette épurée s'ouvre dans une nouvelle fenêtre, suivie de la boîte de dialogue d'impression. **SVG** télécharge plutôt le code sous forme de fichier, pour vos propres mises en page d'étiquettes.
4. Imprimez sur du papier pour étiquettes ou du papier ordinaire et fixez-la sur la ruche.

:::tip Pour qu'elle dure en extérieur
Imprimez sur du papier pour étiquettes résistant aux intempéries ou en vinyle, ou recouvrez une étiquette papier de ruban adhésif transparent ou d'une pochette plastifiée. Placez-la là où les hausses que l'on soulève et repose ne la rayeront pas : le côté du corps de ruche ou sous le rebord du toit.
:::

## Imprimer une feuille pour un rucher

1. Ouvrez le rucher.
2. Touchez **Étiquettes QR**.
3. Une feuille A4 s'ouvre avec un code étiqueté par ruche de ce rucher, suivie de la boîte de dialogue d'impression.
4. Imprimez, découpez et appliquez.

## Scanner une étiquette

### Avec l'appareil photo de votre téléphone

La plupart des téléphones reconnaissent les codes QR dans l'application appareil photo intégrée. Pointez l'appareil photo vers l'étiquette, touchez le lien qui apparaît, et Openbeehive s'ouvre sur la ruche. Cela fonctionne pour toute personne ayant accès, sans ouvrir l'application au préalable.

### Avec le scanner intégré

**Scanner** dans la navigation ouvre le scanner propre à Openbeehive, utile lorsque vous êtes déjà dans l'application et passez d'une ruche à l'autre.

1. Ouvrez **Scanner** et accordez l'autorisation d'accès à la caméra la première fois.
2. Visez le code QR de la ruche ; la ruche s'ouvre dès qu'il est reconnu.

Sur les appareils dont le navigateur ne prend pas en charge le scanner intégré, l'écran l'indique et suggère d'utiliser l'application appareil photo habituelle.

## Si un scan n'ouvre pas la bonne ruche

| Symptôme | Cause probable | Que faire |
| --- | --- | --- |
| La caméra n'arrive pas à faire la mise au point sur le code | Étiquette mouillée, délavée ou gondolée | Essuyez-la ; réimprimez-la si elle est usée |
| Le lien s'ouvre mais indique « Ruche introuvable » | La ruche a été supprimée, ou appartient à un autre espace | Vérifiez que la ruche existe toujours et que le bon espace est actif |
| Vous demande de vous connecter | Vous n'êtes pas connecté sur cet appareil, ou la ruche est dans un espace dont vous n'êtes pas membre | Connectez-vous ; demandez à l'admin de l'espace de vous inviter |
| Rien ne se passe au toucher | Le téléphone n'a pas reconnu le code comme un lien | Utilisez le scanner intégré ou un autre lecteur de QR |

L'accès suit l'appartenance à l'espace ; voir [Comptes et espaces](/using-the-app/accounts-tenants).

## Réimprimer et changer les étiquettes

Les étiquettes n'expirent jamais. Le lien reste valide pendant toute la vie de la fiche de la ruche. Si vous mettez une caisse au rebut mais conservez la colonie comme la même ruche dans Openbeehive, l'ancienne étiquette continue de fonctionner. Si vous créez une nouvelle fiche de ruche, imprimez une nouvelle étiquette.

Les étiquettes encodent l'adresse depuis laquelle vous les avez imprimées. Si votre instance auto-hébergée change de domaine, réimprimez.

:::caution
Ne déplacez pas une étiquette imprimée d'une caisse à une autre en espérant qu'elle pointe vers la nouvelle colonie ; elle ouvre toujours la ruche d'origine. Imprimez plutôt une nouvelle étiquette.
:::

Détails techniques du format du lien : [Codes QR pour les développeurs](/developers/qr-codes).
