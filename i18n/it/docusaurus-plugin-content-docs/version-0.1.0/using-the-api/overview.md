---
sidebar_position: 1
title: "Panoramica delle API"
---

# Le API di Openbeehive

Openbeehive è **API-first e aperto**. Non c'è alcun backend nascosto: tutto
ciò che l'app fa — creare apiari, registrare ispezioni, sincronizzare dispositivi,
leggere statistiche — passa attraverso un'unica API pubblica **Connect-RPC**. Lo stesso
contratto che alimenta l'app è disponibile anche per te.

Questa apertura è una scelta deliberata. I tuoi dati sono tuoi, quindi dovresti poterli
leggere, automatizzare via script, alimentarli dai tuoi sensori e spostarli altrove
senza chiedere il permesso a nessuno.

## Un contratto, due protocolli

L'API è definita una sola volta come contratto [Protocol Buffers](https://protobuf.dev/)
e servita con [Connect-RPC](https://connectrpc.com/). Ciò significa che **ogni
endpoint è raggiungibile in due modi**, dallo stesso URL:

| Stile | Ideale per | Pagina |
| --- | --- | --- |
| **HTTP + JSON** (in stile REST) | curl, script, webhook, microcontrollori, integrazioni rapide | [REST / HTTP + JSON](/using-the-api/rest) |
| **gRPC / gRPC-Web / Connect** | client tipizzati, streaming, sincronizzazione ad alto volume | [gRPC](/using-the-api/grpc) |

Non scegli un protocollo sul server — lo scegli per ogni richiesta, tramite gli
header che invii. Scegli quello più comodo per il tuo strumento.

## URL di base

L'API è servita dallo stesso processo che serve l'app:

- Servizio in hosting: `https://app.openbeehive.org`
- Self-hosted: la tua origine, ad esempio `https://bees.example.com` (vedi
  [Self-hosting](/category/self-hosting))

Ogni metodo si trova su un percorso prevedibile:

```
POST <base-url>/openbeehive.v1.<Service>/<Method>
```

Ad esempio: `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`.

## Servizi

Il contratto è suddiviso in servizi. Ognuno corrisponde a una parte del dominio che
già conosci dall'app:

| Servizio | Cosa copre |
| --- | --- |
| `ApiaryService` | Creare, leggere, aggiornare, eliminare ed elencare gli apiari |
| `HiveService` | Arnie, incluso lo spostamento di un'arnia tra apiari |
| `QueenService` | Regine e la cronologia del loro regno |
| `InspectionService` | Ispezioni / visite (incl. temperatura e umidità), URL per il caricamento delle foto |
| `TreatmentService` | Trattamenti / il Bestandsbuch (prodotto, lotto, dose, tempo di sospensione) |
| `TaskService` | Attività e promemoria |
| `EventService` | Il feed di eventi / cronologia in sola aggiunta |
| `StatsService` | Totali della dashboard e statistiche sul miele |
| `SyncService` | `Pull`, `Push` e un `Subscribe` in streaming — il motore di sincronizzazione offline-first |

:::note Stato dell'implementazione (v0.1.0)
`ApiaryService` e `SyncService` sono oggi completamente integrati lato server. Gli altri
servizi sono definiti nel contratto e seguono la stessa struttura; sono in fase di
completamento. Consulta il [contratto](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
per la fonte di verità attuale e le
[note di rilascio](https://github.com/openbeehive-org/openbeehive-app/releases) per ciò che è
già attivo.
:::

## Autenticazione

- **Self-hosted, utente singolo:** quando non è configurato alcun login, l'API è aperta
  all'istanza (sei l'unico utente). Questa è la configurazione più semplice per i server
  domestici e gli script. Vedi [Autenticazione](/self-hosting/authentication).
- **Con il login abilitato / il servizio in hosting:** le richieste trasportano una sessione
  stabilita tramite OIDC o una passkey. Inviala come bearer token:
  `Authorization: Bearer <token>`. I token API programmatici per i client
  automatizzati (script, sensori) sono nella roadmap — fino ad allora, il self-hosting in
  modalità utente singolo è il percorso senza attriti per l'automazione.

## Come l'app stessa la utilizza

L'app è **offline-first**: scrive prima su un database locale e il
motore di sincronizzazione riconcilia con il server tramite `SyncService.Push` / `Pull`.
I servizi CRUD (`ApiaryService`, `InspectionService`, …) sono i
punti di ingresso autoritativi lato server utilizzati per integrazioni dirette, esportazione e
automazione. Entrambe le viste poggiano sugli stessi dati — vedi
[Offline e sincronizzazione](/using-the-app/offline-and-sync) e
l'[architettura per sviluppatori](/developers/architecture).

## Cosa puoi costruire

- Importare i tuoi dati in un foglio di calcolo, un notebook o una dashboard BI.
- Automatizzare via script modifiche di massa o migrazioni da un altro strumento di apicoltura.
- Alimentare le letture dai **tracker automatizzati** — bilance per arnie, sensori di temperatura e
  umidità — direttamente nelle ispezioni. Vedi
  [Tracker automatizzati](/using-the-api/automated-trackers).
- Costruire il tuo client, bot o widget mobile su un contratto stabile e tipizzato.

Pronto per i dettagli? Inizia con [REST / HTTP + JSON](/using-the-api/rest).
