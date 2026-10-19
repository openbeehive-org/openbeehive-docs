---
sidebar_position: 4
title: "Trackers automatisés"
---

# Trackers automatisés et capteurs

Une balance de ruche, une sonde de température du nid à couvain ou un capteur
d'humidité peut envoyer ses relevés dans Openbeehive via
`InspectionService.CreateInspection`. Chaque relevé devient une ligne de
visite sur la ruche, se synchronise vers chaque appareil comme une visite
saisie à la main, et alimente les graphiques **Évolution** de la ruche. Cette
page décrit ce que le serveur fait réellement de ces relevés et comment les
envoyer depuis un script.

## Ce qu'est un relevé

Il n'y a pas de table de capteurs séparée. Un relevé est une visite dont seuls
les champs de mesure sont remplis :

| Champ JSON | Signification | Unité |
| --- | --- | --- |
| `weightKg` | Poids de la ruche | kg |
| `tempHive` | Température à l'intérieur de la ruche | °C |
| `tempOutside` | Température extérieure | °C |
| `humidityHive` | Humidité relative à l'intérieur de la ruche | % |
| `humidityOutside` | Humidité relative extérieure | % |
| `note` | Texte libre, par exemple le nom de l'appareil | |

N'envoyez que ce que votre appareil mesure. Le serveur stocke les champs que
vous omettez comme `0` ; les graphiques Évolution ne tracent que les valeurs
supérieures à zéro, mais le résumé de visite dans l'application affiche une
température de `0` comme un `0 °C` mesuré, n'envoyez donc pas un champ de
température que vous n'avez pas mesuré.

Sur le serveur, le relevé suit le même chemin qu'une visite enregistrée dans
l'application : la ligne est estampillée avec le rucher et la reine régnante à
sa `date`, un événement `INSPECTION` est écrit, et le changement est ajouté au
journal de synchronisation avec votre compte comme auteur. Voir la
[présentation de l'API](./overview.md#writes-go-through-sync).

## Ce que l'application en fait

- Le relevé apparaît dans le journal des visites et les graphiques de la ruche
  après la prochaine synchronisation de l'appareil (l'application se
  synchronise toutes les 15 secondes lorsqu'elle est ouverte, et après chaque
  écriture locale).
- Il compte comme la dernière visite de la ruche. Le panneau **Visites à
  effectuer** du tableau de bord et `StatsService.GetDashboard` calculent les
  « jours depuis la dernière visite » à partir de la ligne de visite la plus
  récente, de sorte qu'une ruche qui envoie un relevé quotidien n'apparaît
  jamais comme à visiter, même si personne ne l'a ouverte depuis des semaines.
- Chaque relevé est une visite dans le journal. Un relevé par minute produit
  1 440 visites par jour et repousse les entrées saisies à la main hors de
  vue.

Envoyez au plus quelques relevés par jour, ou agrégez sur l'appareil et
envoyez une valeur quotidienne. Mettez le nom de l'appareil dans `note` pour
distinguer facilement les relevés automatiques de vos propres visites. Les
cadences de 15 minutes et plus fines relèvent de votre propre base de séries
temporelles, pas du journal des visites.

## S'authentifier depuis un script

Donnez à chaque appareil sa propre clé API (voir
[Authentification](./overview.md#authentication)) :

1. Dans l'application, basculez vers l'espace auquel la ruche appartient et
   ouvrez **Paramètres → Clés API**.
2. Nommez la clé d'après l'appareil (par exemple `scale-01`), laissez les
   permissions sur **Lecture et écriture** (un capteur crée des visites, ce
   qu'une clé **Lecture seule** ne peut pas faire) et choisissez si elle
   expire, puis touchez **Créer une clé**. Copiez la valeur `obhk_...` ; elle
   n'est affichée qu'une seule fois.
3. Stockez-la sur l'appareil et envoyez-la dans
   `Authorization: Bearer obhk_...` à chaque appel.

La clé agit en votre nom dans cet espace et fonctionne avec n'importe quelle
méthode de connexion (mot de passe, OIDC ou passkeys). Elle n'expire que si
vous avez choisi une expiration (**30 jours**, **90 jours** ou **1 an**) ; une
clé expirée reçoit `unauthenticated` (HTTP 401) à chaque appel jusqu'à ce que
vous en créiez une nouvelle. Les Paramètres indiquent quand chaque clé a été
utilisée pour la dernière fois. Lorsque l'appareil est retiré, touchez
**Supprimer** à côté de sa clé ; l'appel suivant venant de lui renvoie
`unauthenticated`. La clé cesse aussi de fonctionner si vous quittez l'espace.
Utilisez une clé **Lecture seule** pour tout ce qui ne fait que lire, comme un
tableau de bord ou un script d'export ; elle reçoit `permission_denied` sur
`CreateInspection` et sur toute autre écriture.

Deux cas n'ont pas besoin de clé ou ne peuvent pas en utiliser :

- **Instance sans connexion** (auto-hébergée, sans mot de passe, OIDC ni
  WebAuthn configuré) : chaque requête s'exécute en tant qu'utilisateur local.
  N'envoyez aucun en-tête. La section Clés API n'y existe pas.
- **Connexion par session en solution de repli** : avec la connexion par mot
  de passe activée, `POST /auth/signin` avec `email` et `password` renvoie un
  `token` de session que vous pouvez envoyer de la même façon. Il expire après
  `BEEHIVE_SESSION_TTL` (`720h` par défaut, 30 jours), le script doit donc se
  reconnecter sur `unauthenticated`. Préférez une clé.

Le compte de démonstration est en lecture seule et ne peut pas créer de clés ;
`CreateInspection` y renvoie `permission_denied`.

## Trouver l'id de la ruche

`hiveId` est l'UUID de la ruche, le même que celui encodé dans son
[étiquette QR](/using-the-app/qr-labels). Recherchez-le une fois et stockez-le
sur l'appareil :

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

Les deux renvoient `id` et `name` par ligne. Conservez un `hiveId` stable par
capteur ; si la ruche est déplacée vers un autre rucher dans l'application,
l'id reste le même.

## Exemple : envoyer un relevé

```bash
#!/usr/bin/env bash
# Post one reading for one hive. Run it from cron a few times a day.
set -eu
OB="https://bees.example.com"
HIVE="c41a..."
# The API key from Settings -> API keys, stored once on the device.
TOKEN=$(cat /etc/openbeehive-key)

body=$(printf '{"hiveId":"%s","weightKg":%s,"tempHive":%s,"humidityHive":%s,"note":"scale-01"}' \
  "$HIVE" "$(read_sensor weight)" "$(read_sensor brood_temp)" "$(read_sensor brood_rh)")

curl -fsS -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "$body"
```

`read_sensor` représente ce qui lit votre matériel. Une clé sans expiration
n'a pas besoin d'être rafraîchie ; une sortie non nulle avec HTTP 401 signifie
que la clé a été supprimée ou a expiré. Sur une instance sans connexion,
supprimez l'en-tête `Authorization`. La même requête en Python :

```python
import json, urllib.request

OB = "https://bees.example.com"
TOKEN = open("/etc/openbeehive-key").read().strip()  # obhk_...

def create_inspection(hive_id, **fields):
    body = json.dumps({"hiveId": hive_id, **fields}).encode()
    req = urllib.request.Request(
        f"{OB}/openbeehive.v1.InspectionService/CreateInspection", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req) as res:
        return json.load(res)["inspection"]

create_inspection("c41a...", weightKg=42.5, tempHive=34.2, humidityHive=58, note="scale-01")
```

Pour antidater un relevé (par exemple lorsque l'appareil a mis en mémoire
tampon hors ligne), envoyez `date` sous forme de chaîne RFC 3339. Le serveur
résout le rucher et la reine pour cette date.

## Bonnes pratiques

- **Mettez en mémoire tampon hors ligne.** Mettez les relevés en file d'attente
  sur l'appareil et envoyez-les avec leur `date` d'origine une fois le serveur
  joignable.
- **Une ruche par capteur.** N'envoyez pas le même relevé à plusieurs ruches.
- **Attention aux unités.** Température en °C, humidité de 0 à 100, poids en
  kg.
- **Nettoyez les données de test.** `ListInspections` avec votre `hiveId` et
  `DeleteInspection` suppriment les relevés ; la suppression se synchronise
  aussi vers les appareils.
