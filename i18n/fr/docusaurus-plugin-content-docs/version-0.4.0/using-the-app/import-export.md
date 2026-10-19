---
sidebar_position: 12
title: "Import et export"
---

# Import et export

Vos données vous appartiennent. Openbeehive vous permet d'emporter **toutes vos
données** — pour une sauvegarde, pour migrer vers une autre instance, pour les
analyser dans un tableur ou pour les partager avec d'autres outils. Tout se
déroule localement depuis **Paramètres → Données et sauvegarde** ; aucune donnée
ne quitte votre appareil tant que vous ne choisissez pas de partager le fichier.

## Exporter

Ouvrez **Paramètres**, trouvez **Données et sauvegarde**, puis choisissez un
format :

| Format | Ce que vous obtenez | Idéal pour |
| --- | --- | --- |
| **Sauvegarde complète (JSON)** | Chaque enregistrement — ruchers, ruches, reines, visites, récoltes, tâches, emplacements et événements — dans un seul fichier | Conservation, et **migration vers une autre instance** (réimportable sans perte) |
| **Tableur (XLSX)** | Un classeur, une feuille par entité | Analyse dans Excel / LibreOffice / Google Sheets |
| **CSV (ZIP)** | Un `.csv` par entité, regroupés dans un `.zip` | Échange universel, scripts, autres applications |
| **BeeXML** | Un fichier XML structuré (rucher → ruche → reine / visite) | Partage avec des outils qui utilisent le format d'échange [BeeXML](https://beexml.org/) |
| **Rapport (PDF)** | Un rapport de rucher imprimable — ruches, reines actuelles et derniers relevés | Impression, partage, audit / archivage |

Le **Rapport (PDF)** ouvre un récapitulatif épuré et personnalisé dans un nouvel
onglet et déclenche la boîte de dialogue d'impression de votre navigateur —
choisissez « Enregistrer au format PDF » pour en conserver une copie.

L'export reflète ce qui se trouve sur votre appareil à l'instant présent. Les
photos ne sont pas incluses dans les exports CSV/XLSX/BeeXML (elles sont stockées
sous forme de blobs) — l'ensemble complet se trouve dans votre compte synchronisé
et son stockage de blobs ; consultez
[Auto-hébergement → Sauvegardes](/self-hosting/backups) pour les sauvegardes côté
serveur.

## Importer et restaurer

Dans le même panneau **Données et sauvegarde**, choisissez un format et
sélectionnez un fichier :

- **Sauvegarde Openbeehive (JSON)** — restaure un export précédent. Les
  enregistrements conservent leurs identifiants, donc réimporter la même
  sauvegarde est sans risque (cela ne crée pas de doublons).
- **BeeXML** — importe les ruchers, ruches, reines et visites depuis un fichier
  au format BeeXML.
- **CSV depuis une autre application** — migrez depuis une autre application
  apicole ou un tableur (voir ci-dessous).
- **Détection automatique** — choisit le bon lecteur à partir du fichier.

Les enregistrements importés deviennent partie intégrante de **votre** compte et
se synchronisent comme tout ce que vous saisissez à la main.

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
| Notes | note, notes, comment, remarks, notiz |

Chaque ligne CSV devient une **visite** sur la ruche correspondante, créant les
ruchers et les ruches au besoin (les lignes sans rucher sont placées dans un
rucher « Importé »). Les colonnes non reconnues sont ignorées — rien ne casse,
vous conservez simplement le reste.

:::tip Privilégiez l'aller-retour
Si vous migrez entre instances Openbeehive, préférez la **sauvegarde JSON** —
elle est complète et sans perte. Utilisez le CSV pour venir **depuis** d'autres
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
