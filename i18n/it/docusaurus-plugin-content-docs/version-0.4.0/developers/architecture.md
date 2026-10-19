---
sidebar_position: 1
title: "Architettura offline-first"
---

# Architettura offline-first

Openbeehive è costruito in modo che l'apicoltura si svolga all'apiario, spesso lontano da qualsiasi segnale. Ogni dispositivo porta con sé una copia completa dei dati di cui ha bisogno, l'interfaccia legge e scrive immediatamente quella copia locale, e un motore in background mantiene in silenzio tutto allineato con il server quando è disponibile una connessione.

Questa pagina spiega come si incastrano i vari pezzi. Per le regole esatte che mantengono coerenti le repliche, consulta [il protocollo di sincronizzazione](/developers/sync-protocol) e [storia ed eventi](/developers/history-and-events).

## Local-first per progettazione

L'idea centrale è semplice: il dispositivo è la fonte di verità per il lavoro che stai svolgendo in questo momento.

- Ogni dispositivo mantiene il proprio database. L'app web (una PWA SvelteKit) esegue un database SQLite incorporato compilato in WebAssembly (SQLite-WASM), supportato dall'Origin Private File System (OPFS) del browser per un archiviazione durevole e privata.
- L'interfaccia utente legge e scrive sempre e solo dal database locale. Non c'è alcuna chiamata di rete nel percorso critico, quindi aprire un'arnia, registrare un'ispezione o spuntare un'attività è immediato e funziona anche senza alcun segnale.
- Un motore in background separato gestisce la rete. Invia le modifiche locali al server e scarica quelle remote, riconciliando le due cose senza mai bloccare l'interfaccia.

Poiché il database locale è sempre disponibile, l'app si comporta allo stesso modo che tu sia online, offline o su una connessione mobile instabile in mezzo a un frutteto.

## Il flusso dei dati

Il diagramma seguente mostra come una modifica viaggia da un tocco nell'interfaccia fino al server e di nuovo verso gli altri dispositivi.

```text
        Device A                          Server                       Device B
   +----------------+               +----------------+            +----------------+
   |   SvelteKit UI |               |   Go backend   |            |   SvelteKit UI |
   |  (reads/writes |               | (Connect-RPC:  |            |  (reads/writes |
   |    locally)    |               |  gRPC + JSON)  |            |    locally)    |
   +-------+--------+               +-------+--------+            +--------+-------+
           | read/write                     |                              | read/write
           v                                |                              v
   +----------------+                       |                     +----------------+
   | SQLite-WASM    |                       |                     | SQLite-WASM    |
   |   on OPFS      |                       |                     |   on OPFS      |
   +-------+--------+                       |                     +--------+-------+
           |                                |                              |
           |  Sync engine                   |                  Sync engine |
           |  (Push / Pull)                 |                              |
           +-----> Push changes ----------->|                              |
           |                                | store + order by HLC          |
           |<----- Pull changes ------------|                              |
                                            |------> Push changes <---------+
                                            |------- Pull changes --------->|
   scope: only apiaries the user can see (partial replication)
```

Il motore di sincronizzazione scambia solo i record che appartengono agli ambiti a cui un utente può accedere, quindi un dispositivo non scarica mai il mondo intero: solo gli apiari a cui ha diritto.

Script e sensori entrano nello stesso quadro tramite i servizi CRUD del server ([Utilizzo dell'API](/using-the-api/overview)). Le loro scritture non aggirano questo flusso: il server applica ciascuna con la stessa unione per campo e la aggiunge allo stesso registro delle modifiche di una modifica inviata con push, quindi una lettura inviata da una bilancia per arnie è solo un'altra modifica che i dispositivi scaricano alla sincronizzazione successiva.

## Risoluzione dei conflitti

Due dispositivi possono modificare la stessa arnia mentre sono entrambi offline. Quando si riconnettono, Openbeehive unisce le loro modifiche in modo deterministico, senza richieste manuali di risoluzione dei conflitti. Tre tecniche rendono tutto privo di conflitti.

### Hybrid Logical Clocks (HLC)

Ogni modifica viene marcata con un valore Hybrid Logical Clock, che combina l'orologio reale con un contatore logico e un identificatore di nodo. L'HLC conferisce a ogni modifica, su ogni dispositivo, un ordine totale e causalmente coerente, anche quando gli orologi dei dispositivi divergono. Questo ordinamento è la base per le regole seguenti.

### Last-writer-wins per campo per gli scalari

Per i campi scalari semplici, come il nome o il tipo di un'arnia o il colore di marcatura di una regina, vince il valore con l'HLC più alto. L'unione avviene per campo, non per record, quindi due persone che modificano campi diversi della stessa arnia mantengono entrambe le proprie modifiche.

### OR-Set per i campi di tipo elenco

I campi simili a elenchi (attualmente solo le chiavi delle foto di un'ispezione) usano un observed-remove set (OR-Set) con semantica add-wins. Le aggiunte concorrenti sopravvivono tutte, e una rimozione ha effetto solo sulle voci specifiche che ha osservato. Questo evita il classico problema in cui l'aggiunta di una persona cancella silenziosamente quella di un'altra.

### Eventi append-only

La tabella `event` è append-only per convenzione: ogni scrittura nella storia inserisce una nuova riga con un id nuovo e nulla la modifica o la elimina, quindi due dispositivi che aggiungono eventi offline non toccano mai la stessa riga. Vedi [storia ed eventi](/developers/history-and-events) per i dettagli.

:::tip
Poiché le unioni sono deterministiche, due dispositivi qualsiasi che hanno visto lo stesso insieme di modifiche calcoleranno sempre esattamente lo stesso risultato, indipendentemente dall'ordine in cui tali modifiche sono arrivate.
:::

## Condivisione e replica parziale

In Openbeehive la condivisione avviene a livello di apiario tramite gli **ambiti** (scope). Un ambito concede a un utente l'accesso a un determinato apiario e a tutto ciò che vi è contenuto: le sue arnie, regine, ispezioni, attività, eventi, raccolti e trattamenti.

La sincronizzazione è limitata di conseguenza. Un dispositivo replica solo i dati all'interno degli ambiti che il suo utente può vedere, un modello noto come replica parziale. Questo mantiene i database locali piccoli e mirati, limita ciò che viaggia sulla rete e fa sì che un membro dell'apiario di un'associazione non riceva mai dati da apiari di cui non fa parte.

Quando viene concesso un nuovo ambito, la sincronizzazione successiva scarica la storia di quell'apiario; quando l'accesso viene revocato, quei record smettono di sincronizzarsi.

## PWA mobile-first

L'app è una Progressive Web App, progettata innanzitutto per il telefono che hai in tasca davanti alle arnie.

- Un **service worker** memorizza nella cache lo scheletro dell'applicazione e le risorse, in modo che l'app si carichi all'istante e funzioni completamente offline dopo la prima visita.
- **SQLite-WASM su OPFS** fornisce un vero database relazionale nel browser, con un archiviazione durevole e privata per l'origine che sopravvive ai ricaricamenti.
- L'app è installabile sulla schermata principale e si comporta come un'app nativa, incluso il flusso di scansione QR che apre l'app su una specifica arnia.

## Come tutto si incastra

| Livello | Tecnologia | Responsabilità |
| --- | --- | --- |
| Interfaccia | PWA SvelteKit | Legge e scrive il database locale; non si blocca mai sulla rete |
| Archivio locale | SQLite-WASM su OPFS | Fonte di verità durevole, sul dispositivo |
| Motore di sincronizzazione | Push / Pull in background | Riconcilia le modifiche locali e remote tramite HLC, LWW, OR-Set |
| Backend | Go, Connect-RPC | Memorizza e ordina le modifiche; applica gli ambiti; serve i pull |
| Archiviazione | Backend di database e blob intercambiabili | Persiste dati e contenuti multimediali sul server |

Questa separazione è ciò che dà a Openbeehive la sua promessa fondamentale: i record sono sempre con te, sempre veloci e sempre coerenti una volta che tutti tornano a portata.

Per approfondire, leggi [il protocollo di sincronizzazione](/developers/sync-protocol) e [storia ed eventi](/developers/history-and-events), oppure sfoglia il resto della [documentazione per sviluppatori](/category/developers).
