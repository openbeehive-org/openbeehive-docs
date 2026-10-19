---
sidebar_position: 10
title: "Aggiornamento"
---

# Aggiornamento

Gli aggiornamenti sono semplici: sostituisci il binario o scarica una nuova immagine, riavvia, e il server porta da solo lo schema del database alla versione corrente.

:::caution Esegui prima il backup, ogni volta
Esegui un backup prima di aggiornare. Vedi [Backup](/self-hosting/backups).
:::

## Prima di iniziare

1. **Leggi le note di rilascio.** Controlla il [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) e la [release su GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) per la versione a cui stai passando. Annota nuova configurazione richiesta o passaggi manuali.
2. **Esegui il backup** del database e dell'archiviazione blob.
3. **Annota la tua versione attuale** (il tag che hai compilato o il tag dell'immagine che esegui) così sai a cosa tornare in caso di rollback.
4. **Scegli un momento tranquillo.** Il riavvio è breve; i dispositivi continuano a lavorare localmente e si sincronizzano una volta che il server è di nuovo attivo.

## Come funzionano le migrazioni

Le migrazioni dello schema vengono eseguite automaticamente all'avvio del server. All'avvio il server applica in ordine eventuali migrazioni in sospeso e solo allora inizia a servire le richieste. Funziona allo stesso modo per PostgreSQL, MySQL e SQLite.

:::note
Il primo avvio di una nuova versione potrebbe richiedere un po' più del solito mentre lo schema viene aggiornato. Osserva i log per confermare che termini prima di inviarvi traffico.
:::

## Aggiornare il binario singolo

```bash
# 1. Stop the running service
sudo systemctl stop openbeehive

# 2. Back up the binary and your data
cp /opt/openbeehive/openbeehive /opt/openbeehive/openbeehive.bak
# (also back up the SQLite database and blob directory; see Backups)

# 3. Replace the binary with the new build, then restart
sudo systemctl start openbeehive

# 4. Check the logs to confirm migrations ran
sudo journalctl -u openbeehive -f
```

Per compilare la nuova release dai sorgenti, fai il checkout del suo tag e ricompila:

```bash
git fetch --tags
git checkout vX.Y.Z
make proto && make build
```

Questo produce un nuovo `./server/bin/openbeehive`. I prerequisiti sono in [Binario singolo](/self-hosting/single-binary) (Go 1.25+, Node 24+, buf).

## Aggiornare con Docker

Il comando necessario dipende da dove proviene l'immagine.

**Immagine pubblicata** (il `docker run` a singolo container dell'[avvio rapido](/self-hosting/quick-start), oppure un file Compose con una riga `image:` come `docker-compose.demo.yml`):

```bash
docker compose -f docker-compose.demo.yml pull
docker compose -f docker-compose.demo.yml up -d
docker compose -f docker-compose.demo.yml logs -f server
```

Per un container avviato con un semplice `docker run`: `docker pull ghcr.io/openbeehive-org/openbeehive-app:latest`, poi `docker rm -f openbeehive` ed esegui di nuovo lo stesso comando `docker run`. Il volume con nome conserva i tuoi dati.

**Compilata dai sorgenti** (il `docker-compose.yml` del repository ha una sezione `build:`, quindi `pull` non fa nulla per esso):

```bash
git pull
docker compose up -d --build
docker compose logs -f server
```

I tag dell'immagine sono `latest`, `X.Y` (patch più recente di una release minor) e `X.Y.Z`. Per deployment riproducibili fissa una versione specifica anziché `latest`:

```docker
image: ghcr.io/openbeehive-org/openbeehive-app:X.Y.Z
```

## Versioning

Openbeehive segue il [versioning semantico](https://semver.org): `MAJOR.MINOR.PATCH`.

| Parte | Significa |
| --- | --- |
| MAJOR | Modifiche che rompono la compatibilità; leggi attentamente le note di aggiornamento |
| MINOR | Nuove funzionalità, retrocompatibili |
| PATCH | Correzioni di bug e patch di sicurezza, retrocompatibili |

:::caution La 0.x è software in fase iniziale
Mentre Openbeehive è nella serie `0.x`, le release minor possono includere modifiche che richiedono passaggi manuali o che non sono completamente retrocompatibili. Leggi le note di rilascio per ogni aggiornamento e tieni i tuoi backup a portata di mano.
:::

## Rollback

Uno schema più recente potrebbe non essere leggibile da un binario più vecchio. Una volta che le migrazioni sono state eseguite, il solo downgrade dell'applicazione non è garantito funzionare. Ripristina l'applicazione *e* il database da prima dell'aggiornamento:

1. Ferma il servizio.
2. Ripristina il database (e, se pertinente, l'archiviazione blob) dal backup che hai fatto prima di aggiornare.
3. Reinstalla la versione precedente del binario o dell'immagine.
4. Avvia il servizio e conferma che si avvii in modo pulito.

```bash
# Docker example: pin back to the previous version
docker compose down
# edit the compose file back to the previous tag, e.g. X.Y.Z
docker compose up -d
```

:::danger
Non ripristinare un vecchio database sotto un binario più recente, né eseguire un database più recente sotto un binario più vecchio, eccetto per la coppia abbinata di cui hai eseguito il backup insieme. Ripristina sempre il binario e il database come insieme.
:::

## Dopo l'aggiornamento

- Controlla i log per errori o avvisi di migrazione.
- Apri l'app e conferma che i tuoi apiari, le arnie e le visite recenti appaiano.
- Registra qualcosa su un dispositivo e conferma che si sincronizzi.

Se qualcosa sembra sbagliato, vedi [Risoluzione dei problemi](/knowledge-base/troubleshooting) ed effettua il rollback al tuo backup mentre indaghi.
