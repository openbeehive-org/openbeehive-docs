---
sidebar_position: 2
title: "Ruchers"
---

# Ruchers

Un **rucher** est un endroit où vous gardez des abeilles : votre jardin, un terrain familial, un toit, un champ loué, un emplacement en bordure de forêt. Dans Openbeehive, le rucher se situe tout en haut de vos enregistrements ; tout le reste en découle.

```text
Apiary  ->  Hive  ->  Queen
```

Chaque rucher contient une ou plusieurs ruches, chaque ruche a ses reines actuelles (et passées), et les visites, récoltes et traitements se rattachent à une ruche au sein d'un rucher.

## Pourquoi les ruchers comptent

- **Contexte pour votre travail.** Lorsque vous arrivez sur un emplacement, ouvrez ce rucher et ne voyez que les ruches qui sont devant vous.
- **Retrouver l'endroit.** Les coordonnées et une adresse vous permettent de localiser un emplacement isolé et de planifier une tournée de visites.
- **Impression par lot.** Les étiquettes QR s'impriment par rucher, une étiquette par ruche.

:::tip
Créez un rucher par emplacement physique. Cela regroupe les visites, les récoltes et les traitements là où vous effectuez réellement le travail.
:::

## Créer un rucher

Depuis la liste **Ruchers** (ou le bouton **+ Nouveau** de la Vue d'ensemble), choisissez **Nouveau rucher**. Seul un nom est requis.

| Champ | Requis | À quoi il sert |
| --- | --- | --- |
| **Nom** | Oui | Un libellé court, par exemple « Jardin de la maison » ou « Emplacement du verger ». |
| **Adresse** | Non | Texte libre pour vous aider à trouver l'endroit. |
| **Note** | Non | Codes de portail, notes d'accès, nom du propriétaire, stationnement. |
| **Latitude / Longitude** | Non | Coordonnées en degrés décimaux. |

Fonctionne hors ligne ; voir [Hors ligne et synchronisation](/using-the-app/offline-and-sync).

### Définir les coordonnées GPS

Saisissez la latitude et la longitude à la main, ou touchez **Utiliser ma position** pour les renseigner à partir du GPS de votre appareil. Votre navigateur demande l'autorisation la première fois.

Les coordonnées sont en degrés décimaux, par exemple une latitude de `52.5200` et une longitude de `13.4050`. Les valeurs négatives sont valides : au sud de l'équateur pour la latitude, à l'ouest de Greenwich pour la longitude.

:::note
« Utiliser ma position » capture l'endroit où **vous** vous tenez. Si vous configurez un emplacement distant depuis chez vous, saisissez les coordonnées à la main, ou corrigez-les lors de votre prochaine visite.
:::

### La carte et la recherche d'adresse

Le formulaire du rucher comprend une carte avec un repère déplaçable. Saisissez une adresse et le repère s'y déplace ; faites glisser le repère (ou touchez la carte) et le champ d'adresse se remplit à partir de la position, avec les simples coordonnées en repli lorsqu'aucune adresse n'est connue pour cet endroit.

Une ligne d'état sous la carte indique ce que fait la recherche :

- **Recherche de l'adresse…** : la recherche est en cours.
- **Position définie** : la position a été trouvée et reportée dans le formulaire.
- **Aucun résultat pour cette adresse** : placez plutôt le repère sur la carte.
- **La recherche d'adresse est indisponible** : le service de recherche est injoignable (vous êtes peut-être hors ligne). Le repère et les coordonnées manuelles continuent de fonctionner.

## Ajouter et consulter des ruches

Ouvrez un rucher pour voir ses ruches avec la date de la dernière visite de chacune. À partir de là, vous pouvez :

- **Ajouter une ruche** : saisissez un nom et ajoutez-la. Définissez ensuite son type et son statut en modifiant la ruche.
- **Ouvrir une ruche** pour consulter sa reine, son journal des visites, ses récoltes et ses traitements.

Voir [Ruches](/using-the-app/hives) et [Reines](/using-the-app/queens).

## Imprimer les étiquettes QR du rucher

Le bouton **Étiquettes QR** de la page du rucher imprime une feuille A4 avec une étiquette par ruche du rucher. Chaque étiquette encode un lien profond vers cette ruche ; la scanner ouvre Openbeehive sur la ruche. Voir [Étiquettes QR](/using-the-app/qr-labels).

## Modifier et réorganiser

Renommez un rucher, ou mettez à jour son adresse, sa note et ses coordonnées, avec **Modifier le rucher**. Si deux personnes modifient le même rucher, la modification la plus récente de chaque champ l'emporte.

Si une ruche change d'emplacement, utilisez **Déplacer** sur la ruche pour la réaffecter au rucher correspondant. Les apiculteurs transhumants peuvent conserver un rucher par site et déplacer les ruches au fil de leurs déplacements.

## Partage

Les ruchers ne se partagent pas individuellement. Tout ce qui se trouve dans un espace (tenant) est visible par chaque membre de cet espace ; pour travailler sur un rucher avec quelqu'un, invitez donc cette personne dans l'espace qui le contient (Paramètres → Espaces → Inviter un·e apiculteur·rice). Pour garder vos colonies domestiques privées tout en collaborant sur un rucher de club, créez un espace séparé pour le club. Voir [Comptes et espaces](/using-the-app/accounts-tenants).
