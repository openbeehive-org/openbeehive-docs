---
sidebar_position: 5
title: "Ispezioni (visite)"
---

# Ispezioni (visite)

Un'ispezione è la registrazione di una singola visita a un'arnia: ciò che hai visto, ciò che hai fatto e qualsiasi cosa valga la pena ricordare. Nell'arco di una stagione le visite compongono un quadro di come si sta sviluppando ogni colonia. Funziona offline; vedi [Offline e sincronizzazione](./offline-and-sync.md).

:::tip
Per cosa cercare durante una visita e con quale frequenza ispezionare, leggi [Ispezionare una colonia](../beekeeping/inspecting.md). Questa pagina spiega come registrarla.
:::

## Avviare una visita

Apri un'arnia (o scansiona la sua [etichetta QR](./qr-labels.md)) e tocca **Registra visita** nell'intestazione. Il modulo si apre con la data di oggi, e **Salva** resta a portata di mano in fondo allo schermo mentre scorri.

Ogni campo è facoltativo. Un rapido "tutto a posto" senza nient'altro compilato è una voce valida.

### Vuoto non significa zero

I campi numerici partono vuoti. Lascia vuoto un campo quando non hai guardato; inserisci `0` quando hai guardato e non hai trovato nulla. "Celle reali di sciamatura: 0" è un'osservazione, un campo vuoto no. I conteggi hanno i pulsanti **−** e **+**, così puoi inserirli con i guanti.

### Parti dall'ultima visita

Se l'arnia ha una visita precedente, **Parti dall'ultima visita** (con la data di quella visita) compila ciò che di solito cambia poco: telaini occupati, telaini di covata, scorte di cibo, docilità e calma. Correggi ciò che oggi è diverso. I campi che l'ultima visita aveva lasciato vuoti restano vuoti.

## Data e meteo

| Campo | Note |
| --- | --- |
| Data | Predefinita a oggi; modificala per registrare una visita passata. Le date future non sono accettate. |
| Meteo | Testo libero, ad es. "soleggiato, 22°C". |

## Colonia e comportamento

| Campo | Cosa registra |
| --- | --- |
| Regina vista | Se hai avvistato la regina. |
| Uova viste | Il segno più rapido di una regina che ha deposto di recente. |
| Covata opercolata vista | Se è presente covata di operaie sigillata. |
| Larva più giovane | Età in giorni dello stadio di covata più giovane che hai trovato. |
| Telaini occupati | Quanti telaini coprono le api. |
| Telaini di covata | Quanti telaini contengono covata. |
| Scorte di cibo | Buone, Medie, Scarse o Assenti. |
| Celle reali di sciamatura | Quante celle reali hai trovato. |
| Docilità | Molto docile, Docile, Normale, Nervosa o Aggressiva. |
| Calma sul favo | Fugge dal favo, Irrequieta, Calma o Molto calma. |
| Varroa | Acari al giorno. Inserisci un numero semplice come `3` se vuoi che compaia nei grafici; altro testo viene conservato ma non rappresentato nei grafici. |
| Peso dell'arnia | In kg, se pesi l'arnia. |

:::note
Il trio "uova viste / larva più giovane / covata opercolata" di solito conferma una regina in deposizione in salute senza doverla trovare ogni volta.
:::

## Attività di questa visita

Questa sezione parte compressa; tocca la sua intestazione per aprirla.

| Attività | Registra |
| --- | --- |
| Nutrita | Quantità somministrata, in kg. |
| Telaini aggiunti / rimossi | I telaini che hai inserito o tolto. |
| Telaino da fuco tagliato | Se hai asportato un telaino di covata da fuco (una misura di controllo della varroa). |
| Melario aggiunto | Se hai aggiunto un melario. |

Il miele non si registra più nel modulo della visita. Registralo come [smielatura](./harvests.md), con varietà, contenuto d'acqua e numero di lotto. Le quantità di "Miele raccolto" inserite nelle visite dalle versioni precedenti vengono ancora mostrate.

Per un quadro più ampio sulla gestione degli acari e sulla raccolta, vedi [Varroa](../beekeeping/varroa.md) e [Raccolto del miele](../beekeeping/honey-harvest.md).

## Clima

Anche questa sezione parte compressa.

| Campo | Unità |
| --- | --- |
| Temperatura dell'arnia | °C |
| Temperatura esterna | °C |
| Umidità dell'arnia | % |
| Umidità esterna | % |

Tutti e quattro sono facoltativi. Col tempo compaiono nei grafici **Andamento** dell'arnia insieme al peso e alla forza della colonia.

:::tip
Una bilancia per arnie o un sensore climatico può inviare questi campi tramite l'API. Tali letture sono contrassegnate come letture del sensore; vedi [Letture dei sensori](#sensor-readings) più sotto e [Tracker automatici](../using-the-api/automated-trackers.md).
:::

## Nota e foto

Aggiungi una **nota** in testo libero per tutto ciò che i campi strutturati non coprono: una cella di sostituzione contrassegnata, un carattere da tenere d'occhio, un promemoria per sostituire la regina.

**Aggiungi foto** allega una o più immagini (schema di covata, sospetta malattia, celle reali). Vengono memorizzate con la visita e si sincronizzano con il resto dei tuoi registri. Se qualcosa richiede un seguito, aggiungi un'[attività](./tasks.md) con una scadenza.

## Il diario delle visite

La pagina dell'arnia mostra le cinque visite più recenti, dalla più nuova, ciascuna riassunta in chip; **Vedi tutte le N visite** apre il diario completo, e **Altro → Scheda dell'arnia** stampa tutte le visite in una tabella.

Il diario ti permette di individuare le tendenze: la covata che cresce in primavera, le scorte che calano prima dell'inverno, un conteggio della varroa in aumento.

## Correggere o eliminare una visita \{#correcting}

Ogni visita nel diario ha un'azione di modifica e una di eliminazione.

- **Modifica visita** apre il modulo con i valori salvati. Cambia ciò che era sbagliato, data compresa, e salva. Se due dispositivi correggono la stessa visita, per ciascun campo prevale la modifica più recente.
- **Elimina** chiede una conferma che indica la data della visita. Subito dopo una barra offre **Annulla** per alcuni secondi. Eliminare una visita la rimuove anche dalla cronologia e dai grafici dell'arnia.

## Letture dei sensori \{#sensor-readings}

Le letture che una bilancia o un sensore invia tramite l'API vengono memorizzate come visite contrassegnate **Lettura del sensore**. Sommergerebbero le visite che hai fatto tu, quindi:

- la pagina dell'arnia elenca solo le visite registrate da una persona, e così fa il diario completo finché lì non spunti **Mostra le letture dei sensori** (l'etichetta dice quante sono),
- "ultima visita", l'elenco delle arnie e l'elenco delle visite in scadenza della Panoramica le ignorano,
- i grafici **Andamento** le includono.

## Consigli per un inserimento rapido sul campo

- **Scansiona l'etichetta QR** per aprire l'arnia giusta senza scorrere.
- **Registra man mano.** Tocca i campi tra un telaino e l'altro invece di ricostruire tutto dopo.
- **Affidati al trio rapido.** Uova viste, larva più giovane e covata opercolata confermano una regina in deposizione più in fretta che cercarla.
- **Tieni le note brevi.** Lascia subito una breve nota; ampliala a casa.
- **Lascia i campi vuoti.** Registra solo ciò che hai controllato.
- **Fotografa i casi dubbi.** Un'immagine di uno schema di covata insolito vale più di una descrizione scritta.

:::caution
Se sospetti una malattia soggetta a denuncia come la peste americana o europea, fotografala, chiudi l'arnia e segui le norme di segnalazione locali. Vedi [Malattie e parassiti](../knowledge-base/diseases-and-pests.md).
:::
