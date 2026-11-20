---
sidebar_position: 3
title: "Arnie"
---

# Arnie

Un'arnia in Openbeehive è una singola colonia in una cassetta fisica. Quasi tutto ciò che annoti giorno per giorno (visite, raccolti, trattamenti) è collegato a un'arnia. Ogni arnia appartiene a un solo apiario alla volta e può avere una regina. Funziona offline; vedi [Offline e sincronizzazione](./offline-and-sync.md).

## Creare un'arnia

Apri un apiario, digita un nome sotto **Aggiungi arnia** e aggiungila. L'elenco **Arnie** ha lo stesso modulo con un selettore dell'apiario dietro il suo pulsante **+ Nuovo**, e **+ Nuovo → Nuova arnia** nella Panoramica porta lì. Una nuova arnia parte con stato **Attiva** e senza tipo. Apri l'arnia e scegli **Altro → Modifica arnia** per impostare:

| Campo | Cos'è |
| --- | --- |
| **Nome** | Un numero, un colore, un soprannome. |
| **Tipo** | Lo standard di telaino e cassetta; vedi sotto. |
| **Stato** | Lo stato della colonia; vedi sotto. |

Una **foto** si aggiunge dalla pagina dell'arnia toccando il segnaposto dell'immagine accanto al nome (**Rimuovi foto** la toglie di nuovo).

:::tip
Mantieni i nomi brevi e coerenti all'interno di un apiario, ad esempio "1", "2", "3". I nomi brevi si stampano chiaramente sulle etichette QR e sono rapidi da leggere sul campo.
:::

### Tipi di arnia

| Tipo | Uso tipico |
| --- | --- |
| Zander | Diffuso in alcune zone della Germania e dell'Europa centrale. |
| Dadant | Popolare per la produzione di miele, grande nido. |
| Deutsch Normal | Uno standard tradizionale tedesco. |
| Langstroth | Lo standard più comune al mondo. |
| Warré | Un design verticale a basso intervento. |
| Top-bar | Barre orizzontali senza telaino. |
| Altro | Qualsiasi cosa non elencata sopra. |

Per una descrizione più completa di ciascuno standard, vedi [Tipi di arnia](../knowledge-base/hive-types.md).

### Stato

| Stato | Significato |
| --- | --- |
| **Attiva** | Una colonia con regina, in normale utilizzo. |
| **Nucleo** | Una piccola colonia iniziale (un "nucleo"), spesso una sciamatura artificiale o un'unità di fecondazione. |
| **Orfana** | La colonia ha perso la regina e necessita di attenzione. |
| **Persa** | La colonia è morta o ha abbandonato l'arnia. |
| **Sciolta** | Hai unito o smantellato la colonia. |

Lo stato è un'etichetta che imposti modificando l'arnia; nulla lo cambia automaticamente. Impostare un'arnia su **Persa** o **Sciolta** ne conserva l'intero registro.

## L'elenco delle arnie

**Arnie** elenca tutte le arnie dello spazio con il loro apiario e il tempo trascorso dall'ultima visita. Sopra l'elenco:

- **Cerca** trova le arnie per nome, per nome dell'apiario o per i primi caratteri del codice dell'etichetta stampato sull'[etichetta QR](./qr-labels.md).
- **Stato** e **Apiario** filtrano l'elenco; **Rimuovi filtri** li azzera.
- **Ordina per** ordina per **Nome**, **Apiario** o **Da più tempo senza visita**.

I nomi vengono ordinati come li leggi: "Arnia 2" viene prima di "Arnia 10". Una riga sotto gli strumenti indica quante arnie sono mostrate.

## Spostare un'arnia tra apiari

Per ricollocare un'arnia, aprila, tocca **Sposta** nell'intestazione e scegli l'apiario di destinazione. L'arnia mantiene nome, regina, foto e registro completo; cambia solo il suo apiario.

### Cronologia posizioni

Ogni spostamento viene registrato come voce datata sotto **Cronologia posizioni** in fondo alla pagina dell'arnia, così sai dove si trovava una colonia in qualsiasi momento. Utile per tracciare l'esposizione alle malattie e per i registri dell'apicoltura nomade.

:::caution
In molte regioni, lo spostamento delle arnie tra posizioni è soggetto a norme sanitarie e di movimentazione delle api, specialmente all'interno di zone di controllo delle malattie. Verifica i requisiti nazionali o locali prima di ricollocare le colonie. Vedi [Malattie e parassiti](../knowledge-base/diseases-and-pests.md).
:::

## La pagina dell'arnia

Aprire un'arnia ti offre un'unica schermata con tutto ciò che riguarda quella colonia.

### Intestazione e azioni

L'intestazione mostra la foto, il nome, lo stato e il tipo. Accanto ci sono le due cose che fai più spesso sul campo, **Registra visita** e **Sposta**, e un menu **Altro** con:

- **Scheda dell'arnia**: una tabella stampabile di tutte le visite (con un pulsante **Stampa**).
- **Andamento**: grafici delle rilevazioni registrate nelle visite (telaini occupati, telaini di covata, scorte di cibo, celle reali di sciamatura, docilità, calma, varroa, peso dell'arnia, nutrizione, larva più giovane, temperatura e umidità) più le smielature nel tempo. Le valutazioni come le scorte di cibo e la docilità sono disegnate come livelli con un nome, con il migliore in alto, le temperature sotto zero vengono tracciate, e la varroa compare nel grafico solo dove la voce è un numero semplice.
- **Modifica arnia**, **Codice QR** (mostra l'etichetta dell'arnia con i pulsanti **Stampa** e **SVG**; vedi [Etichette QR](./qr-labels.md)) ed **Elimina arnia**.

### Ultime rilevazioni

Sotto l'intestazione, delle pillole mostrano i valori registrati nella visita più recente: telaini occupati, telaini di covata, celle reali di sciamatura, peso dell'arnia e varroa. Toccando una pillola si apre il grafico corrispondente in **Andamento**.

### Regina

La scheda **Regina** mostra anno, numero, colore di marcatura, origine e commento, con **Sostituisci regina** (o **Imposta regina** se non ce n'è nessuna registrata) e azioni per modificare o eliminare la sua registrazione. **Cronologia regine** elenca le regine precedenti con le date di introduzione e sostituzione. Vedi [Regine](./queens.md).

### Diario delle visite

**Registra visita** apre il modulo della visita. Sono elencate le cinque visite più recenti, dalla più nuova, ciascuna con data, meteo, chip che riassumono ciò che hai registrato (regina vista, telaini, scorte, celle reali, docilità, nutrizione, peso, miele, temperatura, umidità, varroa), la nota ed eventuali foto. Ogni visita ha azioni per modificarla ed eliminarla. **Vedi tutte le N visite** apre il diario completo. Vedi [Ispezioni](./inspections.md).

### Miele e Trattamenti

**Miele** mostra il totale delle smielature dell'arnia nell'intestazione ed elenca ogni smielatura (**Registra raccolto**). **Trattamenti** elenca ogni trattamento (**Registra trattamento**) e stampa il registro dei trattamenti (**Stampa registro**). Smielature e trattamenti possono essere modificati ed eliminati come le visite. Vedi [Smielature](./harvests.md) e [Trattamenti](./treatments.md).

## Eliminare contro ritirare un'arnia

Cambia lo **stato** di un'arnia anziché eliminarla. Impostare una colonia su **Persa** o **Sciolta** ne conserva la cronologia per i confronti anno su anno e la tracciabilità. Elimina un'arnia solo se è stata creata per errore; l'app chiede conferma, e l'arnia scompare con tutte le sue registrazioni.
