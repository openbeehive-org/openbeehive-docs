---
sidebar_position: 10
title: "Aggiornamento"
---

# Aggiornamento

Mantenere aggiornata la tua istanza di Openbeehive significa nuove funzionalità, correzioni e patch di sicurezza. Gli aggiornamenti sono volutamente semplici: sostituisci il binario o scarica una nuova immagine, riavvia, e il server aggiorna da solo il tuo database.

Questa pagina copre la routine di aggiornamento sicura, la numerazione delle versioni e come effettuare il rollback se qualcosa va storto.

:::caution Esegui prima il backup, ogni volta
Esegui sempre un backup prima di aggiornare. Richiede solo un momento ed è l'unica cosa che trasforma un aggiornamento andato male in un non-evento. Vedi [Backup](/self-hosting/backups) per come fare un'istantanea del tuo database e dell'archiviazione blob.
:::

## Prima di iniziare

Un buon aggiornamento richiede cinque minuti e un po' di lettura:

1. **Leggi le note di rilascio.** Controlla il [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app) e la release su GitHub per la versione a cui stai passando. Annota eventuali modifiche che rompono la compatibilità, nuova configurazione richiesta o passaggi manuali.
2. **Esegui il backup** del tuo database e dell'archiviazione blob.
3. **Annota la tua versione attuale** così sai a cosa effettuare il rollback se necessario.
4. **Scegli un momento tranquillo.** Gli aggiornamenti comportano un breve riavvio. Poiché l'app è offline-first, chiunque la stia usando continua a lavorare localmente e si sincronizza una volta che il server è di nuovo attivo.

## Come funzionano le migrazioni

Le migrazioni dello schema del database vengono eseguite **automaticamente** all'avvio del server. Non c'è un comando di migrazione separato da ricordare.

All'avvio il server controlla la versione dello schema registrata nel tuo database, applica in ordine eventuali migrazioni in sospeso e solo allora inizia a servire le richieste. Funziona allo stesso modo su tutti i driver supportati (PostgreSQL, MySQL e SQLite).

:::note
Poiché le migrazioni vengono eseguite all'avvio, il primissimo avvio di una nuova versione potrebbe richiedere un po' più del solito mentre lo schema viene aggiornato. Osserva i log per confermare che termini in modo pulito prima di inviarvi traffico.
:::

## Aggiornare il binario singolo

Se esegui la build `selfhost` a file singolo, un aggiornamento è uno scambio di file.

```bash
# 1. Ferma il servizio in esecuzione
sudo systemctl stop openbeehive

# 2. Esegui il backup del binario e dei tuoi dati
cp ./server/bin/openbeehive ./server/bin/openbeehive.bak
# (esegui anche il backup del tuo database SQLite + directory dei blob — vedi Backup)

# 3. Sostituisci il binario con la nuova release, poi riavvia
sudo systemctl start openbeehive

# 4. Controlla i log per confermare che le migrazioni siano state eseguite
sudo journalctl -u openbeehive -f
```

Compili dai sorgenti invece? Scarica il nuovo tag e ricompila:

```bash
git fetch --tags
git checkout v0.1.0
make proto && make build
```

Questo produce un nuovo `./server/bin/openbeehive`. Vedi [Binario singolo](/self-hosting/single-binary) per i prerequisiti di build completi (Go 1.25+, Node 22+, buf).

## Aggiornare con Docker

Per il profilo `cloud` (o qualsiasi deployment Docker), scarica la nuova immagine e ricrea il container.

```bash
# 1. Scarica la nuova immagine
docker compose pull

# 2. Ricrea i container con la nuova immagine
docker compose up -d

# 3. Segui i log per confermare un avvio pulito e le migrazioni
docker compose logs -f openbeehive
```

L'immagine pubblicata è `ghcr.io/openbeehive-org/openbeehive-app:latest`. Per deployment riproducibili, fissa un tag di versione specifico anziché `latest`, così sai sempre esattamente cosa è in esecuzione.

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:v0.1.0
```

Vedi [Docker](/self-hosting/docker) per la configurazione Compose completa.

## Versioning

Openbeehive segue il [versioning semantico](https://semver.org): `MAJOR.MINOR.PATCH`.

| Parte | Esempio | Significa |
| --- | --- | --- |
| MAJOR | `1.0.0` | Modifiche che rompono la compatibilità; leggi attentamente le note di aggiornamento |
| MINOR | `0.2.0` | Nuove funzionalità, retrocompatibili |
| PATCH | `0.1.1` | Correzioni di bug e patch di sicurezza, retrocompatibili |

La release attuale è la **v0.1.0**, la prima release pubblica.

:::caution la v0.1.x è software in fase iniziale
Mentre Openbeehive è nella serie `0.x`, le release minori possono includere modifiche che richiedono passaggi manuali o che non sono completamente retrocompatibili. Leggi le note di rilascio per ogni aggiornamento, non solo per quelli major, e tieni i tuoi backup a portata di mano.
:::

## Rollback

Se un aggiornamento si comporta male, effettua il rollback alla versione da cui provenivi.

La regola importante: **uno schema più recente potrebbe non essere leggibile da un binario più vecchio.** Una volta che le migrazioni sono state eseguite, il semplice downgrade dell'applicazione non è garantito funzionare. Il modo affidabile per effettuare il rollback è ripristinare sia l'applicazione *che* il database da prima dell'aggiornamento.

1. Ferma il servizio.
2. Ripristina il database (e, se pertinente, l'archiviazione blob) dal backup che hai fatto prima di aggiornare. Vedi [Backup](/self-hosting/backups).
3. Reinstalla la versione precedente del binario o dell'immagine.
4. Avvia il servizio e conferma che si avvii in modo pulito.

```bash
# Esempio Docker: fissa di nuovo la versione precedente
docker compose down
# modifica il tuo file compose al tag precedente, ad es. v0.1.0
docker compose up -d
```

:::danger
Non ripristinare un vecchio database sotto un binario più recente, né eseguire un database più recente sotto un binario più vecchio, eccetto per la coppia abbinata di cui hai eseguito il backup insieme. Schema e codice non corrispondenti possono corrompere i dati. Ripristina sempre il binario e il database come insieme.
:::

## Dopo l'aggiornamento

- Controlla i log per errori o avvisi di migrazione.
- Apri l'app e conferma che i tuoi apiari, le arnie e le ispezioni recenti appaiano come previsto.
- Avvia una sincronizzazione da un dispositivo client e conferma che le modifiche fluiscano in entrambe le direzioni.

Se qualcosa sembra sbagliato, vedi [Risoluzione dei problemi](/knowledge-base/troubleshooting), e non esitare a effettuare il rollback al tuo backup mentre indaghi.
