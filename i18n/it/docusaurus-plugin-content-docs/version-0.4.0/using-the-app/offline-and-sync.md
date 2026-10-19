---
sidebar_position: 10
title: "Offline e sincronizzazione"
---

# Offline e sincronizzazione

Openbeehive è costruita per l'apiario, non per l'ufficio. Sul campo raramente hai un segnale affidabile, quindi l'app è **offline-first**: tutto ciò che fai viene salvato subito sul tuo dispositivo e sincronizzato con il server più tardi, in background.

L'app non ti fa mai aspettare la rete. Apri un'arnia, registra una visita, aggiungi un'attività, annota qualcosa sulla regina: tutto è istantaneo, con o senza segnale.

## Tutto viene salvato localmente

Openbeehive mantiene una copia completa dei tuoi registri in un piccolo database sul tuo dispositivo. Ogni lettura e ogni scrittura avviene prima su quella copia locale.

- **È veloce.** Aprire un'arnia o scorrere le visite non aspetta mai una barra di caricamento.
- **Funziona senza segnale.** Un bosco, una valle, una cantina piena di melari.
- **I tuoi dati sono tuoi.** I registri vivono sul tuo dispositivo; il server è la copia per la sincronizzazione e la condivisione.

:::tip
Poiché i registri sono memorizzati sul dispositivo, installa Openbeehive come app anziché usarla in una scheda del browser. Vedi [Installare Openbeehive](/using-the-app/install).
:::

## L'indicatore offline

Quando il dispositivo non ha connessione, il blocco account nella barra laterale passa da **Online** a **Offline** e una barra in cima alla pagina dice "Offline: le modifiche vengono salvate e sincronizzate più tardi". È puramente informativo; continua esattamente come prima.

Quando il dispositivo torna online la barra scompare e tutte le modifiche fatte offline vengono inviate automaticamente. Non c'è alcun pulsante "sincronizza ora".

:::note
Un indicatore offline persistente di solito significa copertura debole in apiario. Se resta attivo anche con una buona connessione a casa, vedi [Risoluzione dei problemi](/knowledge-base/troubleshooting).
:::

## La prima sincronizzazione su un nuovo dispositivo

Accedere su un nuovo dispositivo, o riaprire l'app dopo che la sua archiviazione è stata cancellata, inizia con un database locale vuoto che si riempie in background:

- Le liste mostrano **segnaposto luccicanti** mentre leggono dal database locale.
- Finché il primo download è ancora in corso, la Panoramica e le liste di apiari, arnie e attività mostrano **"Sincronizzazione dei dati…"** anziché uno stato vuoto.
- I set di dati grandi compaiono **progressivamente**: ogni lotto ricevuto dall'app viene mostrato subito.

Solo quando l'app sa che i dati sono completi mostra un vero stato vuoto. Se il dispositivo è offline o il server non è raggiungibile, l'indicazione lascia il posto a ciò che è archiviato localmente.

## Sincronizzazione tra i tuoi dispositivi

Usa Openbeehive su più dispositivi, un telefono sul campo e un portatile a casa, e restano allineati. Ogni dispositivo mantiene la propria copia locale e scambia le modifiche con il server in background. Registra una visita sul telefono in apiario e, quando ti siedi al portatile, è già lì. Finché ogni dispositivo accede allo stesso account, vedono tutti gli stessi registri.

## Cosa succede quando due dispositivi cambiano la stessa cosa

Openbeehive risolve le modifiche sovrapposte **automaticamente**, senza richieste del tipo "quale versione vuoi mantenere?".

- **Tu modifichi la nota di un apiario sul telefono, il tuo co-apicoltore modifica la stessa nota sul suo.** La modifica più recente a quel campo prevale.
- **Aggiungete entrambi foto alla stessa visita mentre siete offline.** Entrambi i gruppi di foto vengono conservati.
- **Ciascuno di voi registra una visita separata.** Visite, smielature e trattamenti vengono solo aggiunti, quindi entrambi vengono mantenuti affiancati.

Ogni dispositivo converge sullo stesso stato una volta che tutti si sono sincronizzati.

:::tip
In breve: aggiungi liberamente, modifica con sicurezza. Come funziona sotto il cofano è spiegato nelle pagine sul [protocollo di sincronizzazione](/developers/sync-protocol) e sull'[architettura](/developers/architecture).
:::

## Condivisione

I registri si condividono tramite i **tenant**. Ogni membro di un tenant vede e modifica tutti i suoi apiari, arnie e registri; non esiste una condivisione per apiario o per arnia.

| Ruolo | Cosa può fare |
| --- | --- |
| **Admin** (proprietario del tenant) | Tutto ciò che può fare un membro, più invitare e revocare, ed eliminare il tenant. |
| **Membro** | Aggiungere e modificare apiari, arnie, visite, attività, smielature e trattamenti nel tenant. |

Per condividere una postazione con un mentore mantenendo private le altre, metti quella postazione in un tenant a sé e invita lì il mentore. I registri condivisi si sincronizzano e risolvono i conflitti esattamente come i tuoi. Vedi [Account e tenant](/using-the-app/accounts-tenants).

## Se qualcosa non può essere salvato

Il salvataggio avviene sul tuo dispositivo, quindi in pratica non fallisce mai. Se dovesse succedere (ad esempio perché l'archiviazione del browser è piena o danneggiata) il modulo resta aperto con tutto ciò che hai digitato e un messaggio di errore spiega cosa è andato storto.

Con l'**account demo** pubblico il server rifiuta le modifiche (la demo si azzera ogni ora). Le tue modifiche vengono salvate sul dispositivo e semplicemente restano lì invece di sincronizzarsi.

C'è una situazione in cui il salvataggio funziona ma non dura: se il browser non può dare all'app la sua archiviazione privata, l'app ripiega su un database in memoria e mostra l'avviso **"Archiviazione non disponibile: le modifiche non verranno conservate su questo dispositivo."** Tutto continua a funzionare per la sessione, e le modifiche si sincronizzano comunque con il server se hai effettuato l'accesso, ma la copia locale sparisce alla chiusura della scheda. Succede nelle finestre di navigazione privata e quando una seconda scheda dell'app sta ancora trattenendo l'archiviazione; vedi [Risoluzione dei problemi](/knowledge-base/troubleshooting#storage-is-unavailable).

## Perderò mai dei dati?

I tuoi registri vengono scritti prima sul tuo dispositivo e non vengono rimossi perché sei offline o perché l'app si chiude. Attendono sul dispositivo finché non possono essere sincronizzati.

Se fai self-hosting, mantieni anche backup del server. Vedi [Backup](/self-hosting/backups).
