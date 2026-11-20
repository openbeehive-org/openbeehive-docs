---
sidebar_position: 1
title: "La dashboard"
---

# La dashboard

La **Panoramica** è la prima schermata che vedi quando apri l'app. Tutto ciò che contiene viene letto dal database locale sul tuo dispositivo, quindi si carica all'istante con o senza segnale.

Il pulsante **+ Nuovo** nell'intestazione apre un menu con **Nuovo apiario**, **Nuova arnia** e **Nuova attività**; ciascuna voce ti porta all'elenco corrispondente con il modulo aperto.

## Per iniziare

Finché non viene registrata la tua prima visita, la Panoramica ti accoglie con "Ti diamo il benvenuto in Openbeehive" e una lista di controllo **Per iniziare** in tre passaggi: **Crea un apiario**, **Aggiungi un'arnia**, **Registra la prima visita**. Il passaggio successivo è un link al punto giusto; i passaggi completati sono spuntati. La lista scompare quando tutti e tre sono stati completati.

## Riquadri statistici

| Riquadro | Cosa mostra |
| --- | --- |
| **Apiari** | Numero di apiari nello spazio attivo. |
| **Arnie** | Numero di arnie. |
| **Regine** | Regine attualmente registrate a capo di una colonia. |
| **Attività aperte** | Attività non ancora spuntate. |
| **Miele in questa stagione** | Totale dei chilogrammi raccolti registrati nell'anno solare corrente. |

I riquadri sono solo conteggi; usa la navigazione per aprire la sezione corrispondente.

## Visite in scadenza

Elenca fino a cinque arnie, prima quelle non visitate da più tempo, con il numero di giorni trascorsi dall'ultima visita ("oggi", oppure "mai" per le arnie senza alcuna visita). Il badge è evidenziato a partire da 21 giorni, o quando non c'è nessuna visita. Tocca un'arnia per aprirla e registrare una visita.

Contano solo le visite registrate da una persona. Le letture inviate da un sensore o da una bilancia tramite l'API non rendono un'arnia "visitata", e le colonie con lo stato **Persa** o **Sciolta** vengono escluse. Quando non ci sono arnie il pannello dice che non c'è niente in scadenza.

Non esiste un intervallo configurabile: l'elenco è ordinato per tempo trascorso dall'ultima visita registrata.

## Prossime attività

Mostra fino a cinque attività aperte con le loro scadenze. Le attività la cui scadenza è passata sono contrassegnate come **Scaduta**. Tocca un'attività per raggiungerla nella vista **Attività**, dove la spunti; vedi [Attività](./tasks.md).

## Come orientarsi

Le stesse destinazioni sono disponibili ovunque: **Panoramica, Apiari, Scansiona, Arnie, Attività** e **Impostazioni**.

- Su un telefono, una **barra delle schede inferiore** le contiene tutte e sei.
- Su desktop o tablet, una **barra laterale** a sinistra elenca Panoramica, Apiari, Scansiona, Arnie e Attività, con il tuo account (e-mail e stato della sincronizzazione) in fondo che rimanda alle Impostazioni.

## Impostazioni

**Impostazioni** contiene:

- **Lingua**: inglese, tedesco, francese, spagnolo, italiano. La scelta viene salvata sul dispositivo.
- **Aspetto**: **Sistema** (segue l'impostazione chiara o scura del dispositivo), **Chiaro** o **Scuro**. La scelta viene salvata sul dispositivo.
- **Spazi**: cambia, crea, invita e gestisci (sulle istanze con login). Vedi [Account e spazi](./accounts-tenants.md).
- **Passkeys**: aggiungi o rimuovi passkey (quando il server le abilita).
- **Chiavi API**: crea e rimuovi chiavi per script e dispositivi (sulle istanze con login). Vedi [Account e spazi](./accounts-tenants.md#api-keys).
- **Dati e backup**: esporta e importa; vedi [Importazione ed esportazione](./import-export.md).
- **Account**: con quale utente hai effettuato l'accesso, e **Esci**.

Su un'istanza self-hosted a utente singolo senza login non c'è nulla da cui disconnettersi; il blocco account mostra l'identità locale.

## Lo stato della sincronizzazione

Un chip di stato in cima alla pagina e accanto al tuo account nella barra laterale mostra se le tue modifiche hanno raggiunto il server (**Sincronizzato**, **In attesa di invio**, **Offline**, **Problemi di sincronizzazione** e così via), e mentre sei offline una barra in alto dice "Offline: le modifiche vengono salvate e sincronizzate in seguito." Continua a registrare esattamente come sempre; la sincronizzazione riprende quando torna la connessione. Vedi [Offline e sincronizzazione](./offline-and-sync.md#sync-status).
