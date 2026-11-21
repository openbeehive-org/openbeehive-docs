---
sidebar_position: 12
title: "Import et export"
---

# Import et export

Vos données vous appartiennent. Openbeehive vous permet d'emporter **toutes vos
données** : pour une sauvegarde, pour migrer vers une autre instance, pour les
analyser dans un tableur ou pour les partager avec d'autres outils. Tout se
trouve sous **Paramètres → Données et synchro**.

L'export et l'import portent sur l'**espace actif**. Tous deux attendent que
l'appareil ait terminé sa première synchronisation de l'espace ; d'ici là, le
panneau l'indique.

## Sauvegarde complète \{#full-backup}

**Télécharger la sauvegarde complète** enregistre chaque rucher, ruche, reine,
visite, traitement, récolte, tâche et entrée d'historique de l'espace tels que
cet appareil les détient, y compris vos tâches personnelles et les modifications
qui n'ont pas encore été envoyées. Le panneau indique combien il y a de telles
modifications, et combien le serveur en a refusé (voir
[Problèmes de synchronisation](./offline-and-sync.md#sync-problems)) : elles
figurent dans le fichier, mais pas sur le serveur.

- Sans les photos, la sauvegarde est un seul fichier JSON.
- Avec **Inclure les photos**, c'est un ZIP qui contient aussi les images en
  taille réelle. Les images absentes de cet appareil sont récupérées sur le
  serveur ; si ce n'est pas possible (hors ligne, ou pas encore envoyées),
  l'application indique combien manquent, et leurs miniatures sont incluses.

Les poids et les températures sont toujours exportés en kilogrammes et en
degrés Celsius, quelles que soient les unités choisies sous
**Paramètres → Préférences → Unités**.

### Télécharger depuis le serveur \{#server-copy}

**Télécharger la copie du serveur** récupère la copie complète de l'espace que
détient le serveur, dans le même format. Elle inclut vos propres tâches
personnelles, mais pas celles des autres membres, et il lui manque les
modifications qu'un appareil n'a pas encore envoyées. Quelques téléchargements
par heure sont autorisés. Les scripts peuvent récupérer le même fichier avec une
clé API ; voir [REST](../using-the-api/rest.md#export). Le compte de démonstration
ne peut pas la télécharger, et la démo ne propose pas d'import.

## Autres formats

| Format | Ce que vous obtenez | Idéal pour |
| --- | --- | --- |
| **Tableur (XLSX)** | Un classeur, une feuille par type d'enregistrement | Analyse dans Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` par type d'enregistrement, regroupés dans un `.zip` | Échange universel, scripts, autres applications |
| **BeeXML** | Ruchers, ruches, reines et visites dans un fichier XML structuré | Partage avec des outils qui utilisent le format d'échange [BeeXML](https://beexml.org/) |
| **Rapport (PDF)** | Un rapport de rucher imprimable : ruches, reines actuelles et derniers relevés | Impression, partage, archivage |

Ces formats servent à consulter les données ailleurs ; pour restaurer vos
données, utilisez la sauvegarde complète. Le **Rapport (PDF)** ouvre un
récapitulatif dans un nouvel onglet et déclenche la boîte de dialogue
d'impression de votre navigateur ; choisissez « Enregistrer au format PDF » pour
en conserver une copie. Pour les sauvegardes côté serveur d'une instance entière,
consultez [Auto-hébergement → Sauvegardes](../self-hosting/backups.md).

## Importer \{#importing}

**Importer → Choisir un fichier…** lit un fichier dans l'espace actif. Choisissez
le **Format du fichier** ou laissez-le sur **Détection automatique** :

- **Sauvegarde Openbeehive (JSON ou ZIP)** : une sauvegarde complète de cette
  instance ou d'une autre, avec les photos s'il s'agit d'un ZIP.
- **BeeXML** : ruchers, ruches, reines et visites depuis un fichier au format
  BeeXML.
- **CSV d'une autre application** : des visites issues d'une autre application
  apicole ou d'un tableur (voir ci-dessous).

Rien n'est écrit avant que vous ayez vu un **Aperçu** : pour chaque type
d'enregistrement, combien sont **Nouveaux**, **Écrasés**, **Restaurés** et
**Ignorés (déjà présents)**. Touchez ensuite **Importer maintenant**.

Par défaut, un import ne fait qu'ajouter. Les enregistrements qui existent déjà
dans cet espace, y compris ceux qui ont été supprimés, sont ignorés et jamais
modifiés ; importer deux fois la même sauvegarde ne change donc rien. Deux
options modifient ce comportement :

- **Écraser les enregistrements existants** écrit les valeurs du fichier là où
  elles diffèrent. Seuls les champs présents dans le fichier sont écrits ; les
  modifications faites depuis l'export sont perdues. Les enregistrements
  supprimés restent supprimés.
- **Restaurer aussi les enregistrements supprimés** fait revenir les
  enregistrements qui ont été supprimés ici.

Un fichier provenant d'**un autre espace** reçoit de nouveaux identifiants : il
ne touche donc jamais aux enregistrements existants, et l'aperçu le signale. Les
enregistrements importés se synchronisent comme tout ce que vous saisissez à la
main. Les nombres du fichier sont lus en kilogrammes et en degrés Celsius.

**Annuler le dernier import** supprime ce que le dernier import a créé, même hors
ligne. Un rucher ou une ruche qui a reçu entre-temps ses propres enregistrements
(une visite, une ruche qui y a été déplacée) est conservé, et l'application
indique combien.

## Migrer depuis une autre application

La plupart des applications apicoles peuvent exporter leurs enregistrements au
format **CSV** (par exemple **Apiary Book**, **HiveBook**, **BeeKeeperPal** ou
votre propre tableur). Openbeehive lit ces fichiers en **faisant correspondre les
noms de colonnes**, vous n'avez donc généralement rien à reformater.

Colonnes reconnues (la casse, les espaces et la ponctuation n'ont pas
d'importance ; plusieurs langues sont prises en charge) :

| Champ Openbeehive | Noms de colonnes reconnus |
| --- | --- |
| Rucher | apiary, yard, location, standort, rucher, colmenar, apiario |
| Ruche | hive, colony, beute, volk, ruche, colmena, arnia |
| Date | date, inspection date, visit date, datum, fecha, data |
| Météo | weather, wetter, meteo, tiempo |
| Varroa | varroa, mites, mite count |
| Température de la ruche | hive temp, brood temp |
| Température extérieure | temperature, temp, outside temp, ambient temp |
| Humidité de la ruche | hive humidity |
| Humidité extérieure | humidity, outside humidity |
| Poids de la ruche | weight, hive weight, gewicht |
| Miel | honey, harvest, yield, honig, ernte |
| Notes | note, notes, comment, comments, remarks, notiz, bemerkung |

Chaque ligne CSV devient une **visite** de la ruche correspondante. Les ruchers
et les ruches qui existent déjà sous le même nom (sans tenir compte des
majuscules et minuscules) sont utilisés ; les autres sont créés (les lignes sans
rucher sont placées dans un rucher « Importé »). Une visite déjà enregistrée pour
cette ruche ce jour-là avec les mêmes valeurs est ignorée : importer deux fois le
même fichier ne change donc rien, et un import avec écrasement laisse ces visites
telles quelles. Les colonnes non reconnues sont ignorées. Les poids et les
températures sont lus en kilogrammes et en degrés Celsius.

:::tip[Privilégiez l'aller-retour]
Si vous migrez entre instances Openbeehive, préférez la **sauvegarde complète**
(en ZIP avec les photos) : elle est complète et sans perte. Utilisez le CSV pour venir **depuis** d'autres
applications.
:::

## Pourquoi c'est important

Openbeehive est conçu pour que vos données ne puissent pas être prises en otage.
L'histoire est longue des registres apicoles enfermés dans le cloud d'un seul
fournisseur. Des initiatives ouvertes comme [BeeXML](https://beexml.org/) (un
standard d'échange Apimondia) et le projet [BEEP](https://beep.nl/) visent à
corriger cela ; Openbeehive va dans le même sens — formats ouverts, une
[API](/category/using-the-api) documentée et une sauvegarde complète en un clic.
Emportez vos abeilles et partez quand bon vous semble.

Pour un accès programmatique et des flux automatisés, consultez
[Utiliser l'API](/category/using-the-api).
