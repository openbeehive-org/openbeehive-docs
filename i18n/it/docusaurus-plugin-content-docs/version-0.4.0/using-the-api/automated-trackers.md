---
sidebar_position: 4
title: "Tracker automatici"
---

# Tracker automatici e sensori

Una bilancia per arnie, una sonda di temperatura del nido di covata o un
sensore di umidità possono inviare le proprie letture a Openbeehive tramite
`InspectionService.CreateInspection`. Ogni lettura diventa una riga di
ispezione sull'arnia, si sincronizza su ogni dispositivo come una visita
inserita a mano e alimenta i grafici **Andamento** dell'arnia. Questa pagina
descrive cosa fa davvero il server con queste letture e come inviarle da uno
script.

## Cos'è una lettura

Non esiste una tabella separata per i sensori. Una lettura è un'ispezione con
compilati solo i campi di misurazione:

| Campo JSON | Significato | Unità |
| --- | --- | --- |
| `weightKg` | Peso dell'arnia | kg |
| `tempHive` | Temperatura all'interno dell'arnia | °C |
| `tempOutside` | Temperatura esterna | °C |
| `humidityHive` | Umidità relativa all'interno dell'arnia | % |
| `humidityOutside` | Umidità relativa esterna | % |
| `note` | Testo libero, per esempio il nome del dispositivo | |

Invia solo ciò che il tuo dispositivo misura. Il server memorizza i campi che
ometti come `0`; i grafici Andamento tracciano solo i valori sopra lo zero,
ma il riepilogo della visita nell'app mostra una temperatura `0` come uno
`0 °C` misurato, quindi non inviare un campo di temperatura che non hai
misurato.

Sul server la lettura segue lo stesso percorso di una visita registrata
nell'app: la riga viene marcata con l'apiario e la regina regnante alla sua
`date`, viene scritto un evento `INSPECTION` e la modifica viene aggiunta al
registro di sincronizzazione con il tuo account come autore. Vedi la
[panoramica delle API](./overview.md#writes-go-through-sync).

## Cosa ne fa l'app

- La lettura compare nel diario delle visite e nei grafici dell'arnia dopo la
  sincronizzazione successiva del dispositivo (l'app si sincronizza ogni 15
  secondi mentre è aperta e dopo ogni scrittura locale).
- Conta come ultima ispezione dell'arnia. Il pannello **Visite in scadenza**
  della panoramica e `StatsService.GetDashboard` calcolano i "giorni
  dall'ultima visita" dalla riga di ispezione più recente, quindi un'arnia che
  riporta dati ogni giorno non compare mai come in scadenza, anche se nessuno
  l'ha aperta da settimane.
- Ogni lettura è una visita nel diario. Una lettura al minuto produce 1.440
  visite al giorno e spinge fuori vista le voci scritte a mano.

Invia al massimo poche letture al giorno, oppure aggrega sul dispositivo e
invia un solo valore giornaliero. Metti il nome del dispositivo in `note` così
le letture automatiche si distinguono facilmente dalle tue visite. Cadenze di
15 minuti o più fitte appartengono al tuo archivio di serie temporali, non al
diario delle visite.

## Autenticarsi da uno script

Assegna a ogni dispositivo la propria chiave API (vedi
[Autenticazione](./overview.md#authentication)):

1. Nell'app, passa al tenant a cui appartiene l'arnia e apri
   **Impostazioni → Chiavi API**.
2. Dai alla chiave il nome del dispositivo (per esempio `scale-01`), lascia i
   permessi su **Lettura e scrittura** (un sensore crea ispezioni, cosa che una
   chiave in **Sola lettura** non può fare) e scegli se deve scadere, poi tocca
   **Crea chiave**. Copia il valore `obhk_...`; viene mostrato una sola volta.
3. Conservalo sul dispositivo e invialo come `Authorization: Bearer obhk_...`
   a ogni chiamata.

La chiave agisce a tuo nome all'interno di quel tenant e funziona con
qualsiasi metodo di login (password, OIDC o passkey). Scade solo se hai scelto
una scadenza (**30 giorni**, **90 giorni** o **1 anno**); una chiave scaduta
riceve `unauthenticated` (HTTP 401) a ogni chiamata finché non ne crei una
nuova. Le Impostazioni mostrano quando ogni chiave è stata usata l'ultima
volta. Quando il dispositivo viene dismesso, tocca **Rimuovi** accanto alla sua
chiave; la chiamata successiva da quel dispositivo restituisce
`unauthenticated`. La chiave smette di funzionare anche se lasci il tenant. Usa
una chiave in **Sola lettura** per tutto ciò che si limita a leggere, come una
dashboard o uno script di esportazione; riceve `permission_denied` su
`CreateInspection` e su ogni altra scrittura.

Due casi non hanno bisogno di una chiave o non possono usarne una:

- **Istanza senza login** (self-hosted, senza password, OIDC o WebAuthn
  configurati): ogni richiesta viene eseguita come l'utente locale. Non
  inviare alcun header. La sezione delle chiavi API lì non esiste.
- **Accesso con sessione come ripiego**: con il login a password abilitato,
  `POST /auth/signin` con `email` e `password` restituisce un `token` di
  sessione che puoi inviare allo stesso modo. Scade dopo
  `BEEHIVE_SESSION_TTL` (predefinito `720h`, 30 giorni), quindi lo script deve
  accedere di nuovo quando riceve `unauthenticated`. Preferisci una chiave.

L'account demo è in sola lettura e non può creare chiavi; lì
`CreateInspection` restituisce `permission_denied`.

## Trovare l'id dell'arnia

`hiveId` è l'UUID dell'arnia, lo stesso codificato nella sua
[etichetta QR](/using-the-app/qr-labels). Cercalo una volta e conservalo sul
dispositivo:

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

Entrambi restituiscono `id` e `name` per ogni riga. Mantieni un solo `hiveId`
stabile per sensore; se l'arnia viene spostata in un altro apiario nell'app,
l'id resta lo stesso.

## Esempio: inviare una lettura

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

`read_sensor` sta per qualunque cosa legga il tuo hardware. Una chiave senza
scadenza non ha bisogno di rinnovo; un'uscita diversa da zero con HTTP 401
significa che la chiave è stata rimossa o è scaduta. Su un'istanza senza login
elimina l'header `Authorization`. La stessa richiesta in Python:

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

Per retrodatare una lettura (per esempio quando il dispositivo ha accumulato
dati mentre era offline), invia `date` come stringa RFC 3339. Il server
risolve l'apiario e la regina per quella data.

## Buone pratiche

- **Accumula quando sei offline.** Metti in coda le letture sul dispositivo e
  inviale con la loro `date` originale quando il server torna raggiungibile.
- **Un'arnia per sensore.** Non inviare la stessa lettura a più arnie.
- **Attenzione alle unità.** Temperatura in °C, umidità da 0 a 100, peso in
  kg.
- **Ripulisci i dati di prova.** `ListInspections` con il tuo `hiveId` e
  `DeleteInspection` rimuovono le letture; anche la cancellazione si
  sincronizza sui dispositivi.
