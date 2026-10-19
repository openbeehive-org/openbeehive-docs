---
sidebar_position: 9
title: "Etichette QR"
---

# Etichette QR

Un'etichetta QR trasforma un'arnia in una scorciatoia da un solo tocco. Attacca un'etichetta sul coperchio o sul nido, punta il telefono verso di essa e Openbeehive si apre sul registro di quell'arnia. Niente scorrimento di elenchi in apiario, niente occhi strizzati su numeri scritti a mano sotto la pioggia.

## Cosa contiene il codice QR

Il codice di ogni arnia codifica un singolo deep link a quell'arnia:

```text
<base>/h/<hiveId>
```

`<base>` è l'indirizzo a cui usi l'app (`https://app.openbeehive.org` sul servizio ospitato, il tuo URL su un'istanza self-hosted) e `<hiveId>` è l'identificatore dell'arnia. L'etichetta stampa anche un codice breve di sei caratteri ricavato dall'id, per distinguere le etichette a occhio.

Il codice non contiene dati sulle api né informazioni personali; è solo un link. Chi lo scansiona senza avere accesso deve accedere e vede l'arnia solo se è membro del tenant che la contiene.

Una volta installata l'app, il link apre l'arnia dal tuo database locale, quindi funziona senza segnale.

## Stampare un'etichetta per una singola arnia

1. Apri l'arnia.
2. Tocca l'azione **QR** (l'icona con il quadrato punteggiato accanto a Modifica e Sposta). Compare una scheda con il codice, il nome dell'arnia e il codice breve.
3. Tocca **Stampa**. Un'etichetta pulita si apre in una nuova finestra e segue la finestra di stampa. **SVG** scarica invece il codice come file, per i tuoi layout di etichette.
4. Stampa su un foglio di etichette o su carta semplice e fissala all'arnia.

:::tip Falla durare all'aperto
Stampa su supporti di etichette resistenti alle intemperie o in vinile, oppure copri un'etichetta di carta con nastro da imballaggio trasparente o una pouch plastificante. Posizionala dove i melari sollevati e rimessi non la raschino: il lato del nido o sotto il bordo del coperchio.
:::

## Stampare un foglio per un apiario

1. Apri l'apiario.
2. Tocca **Etichette QR**.
3. Si apre un foglio A4 con un codice etichettato per ogni arnia di quell'apiario, seguito dalla finestra di stampa.
4. Stampa, ritaglia e applica.

## Scansionare un'etichetta

### Con la fotocamera del telefono

La maggior parte dei telefoni riconosce i codici QR nell'app fotocamera integrata. Punta la fotocamera verso l'etichetta, tocca il link che compare e Openbeehive si apre sull'arnia. Funziona per chiunque abbia accesso, senza aprire prima l'app.

### Con lo scanner integrato nell'app

**Scansiona** nella navigazione apre lo scanner di Openbeehive, utile quando sei già nell'app e ti sposti da un'arnia all'altra.

1. Apri **Scansiona** e concedi l'autorizzazione alla fotocamera la prima volta.
2. Inquadra il codice QR dell'arnia; l'arnia si apre non appena viene riconosciuto.

Sui dispositivi il cui browser non supporta lo scanner integrato, la schermata lo segnala e suggerisce di usare la normale app fotocamera.

## Se una scansione non apre l'arnia giusta

| Sintomo | Causa probabile | Cosa fare |
| --- | --- | --- |
| La fotocamera non mette a fuoco il codice | Etichetta bagnata, sbiadita o arricciata | Asciugala; ristampala se è consumata |
| Il link si apre ma dice "Arnia non trovata" | L'arnia è stata eliminata, o appartiene a un altro tenant | Verifica che l'arnia esista ancora e che sia attivo il tenant giusto |
| Ti chiede di accedere | Non hai effettuato l'accesso su questo dispositivo, oppure l'arnia è in un tenant di cui non sei membro | Accedi; chiedi all'admin del tenant di invitarti |
| Non succede nulla al tocco | Il telefono non ha riconosciuto il codice come link | Usa lo scanner integrato o un altro lettore QR |

L'accesso segue l'appartenenza al tenant; vedi [Account e tenant](/using-the-app/accounts-tenants).

## Ristampare e cambiare le etichette

Le etichette non scadono mai. Il link resta valido per tutta la vita del registro dell'arnia. Se ritiri una cassetta ma mantieni la colonia come la stessa arnia in Openbeehive, la vecchia etichetta continua a funzionare. Se avvii un nuovo registro di arnia, stampa una nuova etichetta.

Le etichette codificano l'indirizzo da cui le hai stampate. Se la tua istanza self-hosted passa a un nuovo dominio, ristampale.

:::caution
Non spostare un'etichetta stampata da una cassetta a un'altra aspettandoti che punti alla nuova colonia; aprirà comunque l'arnia originale. Stampa invece una nuova etichetta.
:::

Dettagli tecnici del formato del link: [Codici QR per sviluppatori](/developers/qr-codes).
