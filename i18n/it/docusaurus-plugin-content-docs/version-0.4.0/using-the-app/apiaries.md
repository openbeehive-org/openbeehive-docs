---
sidebar_position: 2
title: "Apiari"
---

# Apiari

Un **apiario** è un luogo dove tieni le api: il tuo giardino, un orto, un tetto, un campo in affitto, una postazione ai margini di un bosco. In Openbeehive l'apiario è il vertice dei tuoi registri; tutto il resto vi pende sotto.

```text
Apiary  ->  Hive  ->  Queen
```

Ogni apiario contiene una o più arnie, ogni arnia ha la sua regina attuale (e quelle passate), e visite, raccolti e trattamenti sono collegati a un'arnia all'interno di un apiario.

## Perché gli apiari sono importanti

- **Contesto per il tuo lavoro.** Quando arrivi in una postazione, apri quell'apiario e vedi solo le arnie che hai davanti.
- **Ritrovare il posto.** Coordinate e indirizzo ti permettono di localizzare una postazione remota e pianificare un giro di visite.
- **Stampa in serie.** Le etichette QR si stampano per apiario, un'etichetta per arnia.

:::tip
Crea un apiario per ogni posizione fisica. Mantiene visite, raccolti e trattamenti raggruppati dove effettivamente svolgi il lavoro.
:::

## Creare un apiario

Dall'elenco **Apiari** (o dal pulsante **+ Nuovo** nella Panoramica) scegli **Nuovo apiario**. È richiesto solo un nome.

| Campo | Obbligatorio | A cosa serve |
| --- | --- | --- |
| **Nome** | Sì | Un'etichetta breve, ad es. "Giardino di casa" o "Postazione frutteto". |
| **Indirizzo** | No | Testo libero per aiutarti a trovare il luogo. |
| **Nota** | No | Codici dei cancelli, note di accesso, il nome del proprietario del terreno, il parcheggio. |
| **Latitudine / Longitudine** | No | Coordinate in gradi decimali. |

Funziona offline; vedi [Offline e sincronizzazione](/using-the-app/offline-and-sync).

### Impostare le coordinate GPS

Digita latitudine e longitudine a mano, oppure tocca **Usa la mia posizione** per compilarle dal GPS del tuo dispositivo. Il browser ti chiede l'autorizzazione la prima volta.

Le coordinate sono in gradi decimali, ad esempio latitudine `52.5200` e longitudine `13.4050`. I valori negativi sono validi: a sud dell'equatore per la latitudine, a ovest di Greenwich per la longitudine.

:::note
"Usa la mia posizione" cattura il punto in cui **tu** ti trovi. Se configuri una postazione remota da casa, digita le coordinate a mano, oppure correggile alla tua prossima visita.
:::

### La mappa e la ricerca dell'indirizzo

Il modulo dell'apiario include una mappa con un segnaposto trascinabile. Digita un indirizzo e il segnaposto si sposta di conseguenza; trascina il segnaposto (o tocca la mappa) e il campo dell'indirizzo viene compilato dalla posizione, ripiegando sulle semplici coordinate quando per quel punto non è noto alcun indirizzo.

Una riga di stato sotto la mappa indica cosa sta facendo la ricerca:

- **Ricerca dell'indirizzo…**: la ricerca è in corso.
- **Posizione impostata**: la posizione è stata trovata e inserita nel modulo.
- **Nessuna corrispondenza per questo indirizzo**: posiziona invece il segnaposto sulla mappa.
- **La ricerca dell'indirizzo non è al momento disponibile**: il servizio non è raggiungibile (forse sei offline). Il segnaposto e le coordinate manuali continuano a funzionare.

## Aggiungere e visualizzare le arnie

Apri un apiario per vedere le sue arnie con la data dell'ultima visita di ciascuna. Da qui puoi:

- **Aggiungi arnia**: digita un nome e aggiungila. Imposta tipo e stato in seguito modificando l'arnia.
- **Aprire un'arnia** per vederne regina, diario delle visite, raccolti e trattamenti.

Vedi [Arnie](/using-the-app/hives) e [Regine](/using-the-app/queens).

## Stampare le etichette QR per l'apiario

Il pulsante **Etichette QR** nella pagina dell'apiario stampa un foglio A4 con un'etichetta per ogni arnia dell'apiario. Ogni etichetta codifica un deep link a quell'arnia; scansionandola si apre Openbeehive direttamente sull'arnia. Vedi [Etichette QR](/using-the-app/qr-labels).

## Modificare e riorganizzare

Rinomina un apiario, o aggiornane indirizzo, nota e coordinate, con **Modifica apiario**. Se due persone modificano lo stesso apiario, per ciascun campo prevale la modifica più recente.

Se un'arnia si sposta in un'altra posizione, usa **Sposta** sull'arnia per riassegnarla all'apiario corrispondente. Gli apicoltori nomadi possono mantenere un apiario per sito e spostare le arnie man mano che si spostano.

## Condivisione

Gli apiari non si condividono singolarmente. Tutto ciò che sta in un tenant è visibile a ogni membro di quel tenant, quindi per lavorare su un apiario con qualcuno invitalo nel tenant che lo contiene (Impostazioni → Spazi → Invita un apicoltore). Per mantenere private le tue colonie di casa mentre collabori su una postazione di un club, crea un tenant separato per il club. Vedi [Account e tenant](/using-the-app/accounts-tenants).
