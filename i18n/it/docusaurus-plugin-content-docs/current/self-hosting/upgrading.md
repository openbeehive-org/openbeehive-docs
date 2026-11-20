---
sidebar_position: 10
title: "Aggiornamento"
---

# Aggiornamento

Gli aggiornamenti sono semplici: sostituisci il binario o scarica una nuova immagine, riavvia, e il server porta da solo lo schema del database alla versione corrente.

:::caution[Esegui prima il backup, ogni volta]
Esegui un backup prima di aggiornare. Vedi [Backup](./backups.md).
:::

## Prima di iniziare

1. **Leggi le note di rilascio.** Controlla il [CHANGELOG](https://github.com/openbeehive-org/openbeehive-app/blob/main/CHANGELOG.md) e la [release su GitHub](https://github.com/openbeehive-org/openbeehive-app/releases) per la versione a cui stai passando. Annota nuova configurazione richiesta o passaggi manuali.
2. **Esegui il backup** del database e dell'archiviazione blob.
3. **Annota la tua versione attuale** (il tag che hai compilato o il tag dell'immagine che esegui) così sai a cosa tornare in caso di rollback.
4. **Scegli un momento tranquillo.** Il riavvio è breve; i dispositivi continuano a lavorare localmente e si sincronizzano una volta che il server è di nuovo attivo.

## Passaggi specifici per release

### Aggiornamento alla 0.5.0 \{#upgrading-to-050}

La 0.5.0 rende più restrittivi diversi valori predefiniti. Esegui prima un backup, poi scorri questo elenco; dove manca un'impostazione il server si ferma all'avvio e la indica.

**Impostazioni**

- **Segreto di sessione.** Con qualsiasi metodo di accesso, `BEEHIVE_SESSION_SECRET` deve essere impostato e lungo almeno 32 byte, altrimenti il server non si avvia. Generane uno con `openssl rand -base64 32`; un nuovo segreto disconnette tutti.
- **`.env` viene letto dal binario.** Il server ora carica `.env` dalla sua directory di lavoro. Controlla che un vecchio `.env` rimasto lì contenga ciò che vuoi; le vere variabili d'ambiente hanno comunque la precedenza.
- **CORS è limitato alla stessa origine per impostazione predefinita.** Se l'app è servita da un'origine diversa da quella dell'API, elencala in `BEEHIVE_CORS_ALLOWED_ORIGINS`. `*` non consente più le credenziali.
- **Senza accesso: solo nomi host noti.** Un server senza accesso risponde solo a `localhost`, agli indirizzi IP e all'host di `BEEHIVE_PUBLIC_BASE_URL`. Metti gli altri nomi in `BEEHIVE_ALLOWED_HOSTS`.
- **La verifica email richiede un server di posta.** `BEEHIVE_EMAIL_VERIFICATION=true` richiede `BEEHIVE_SMTP_HOST`. I link non vengono più scritti nel log; senza SMTP, copia i link di invito dalle Impostazioni.
- **OIDC.** Un provider elencato in `BEEHIVE_OIDC_PROVIDERS` senza issuer e client id blocca l'avvio. Un accesso tramite provider viene agganciato a un account esistente solo quando entrambe le parti hanno verificato l'indirizzo email.
- **Reverse proxy.** Imposta `BEEHIVE_TRUST_PROXY_HEADERS=true` dietro il tuo proxy, altrimenti la limitazione dei tentativi di accesso conta tutti gli utenti come un unico indirizzo.
- **`BEEHIVE_NODE_ID`** ora ha come valore predefinito un id casuale a ogni avvio; rimuovilo dalla tua configurazione a meno che tu non lo imposti di proposito. Le impostazioni inutilizzate della dimensione di pagina della sincronizzazione non esistono più.
- **Conservazione del registro delle modifiche.** Il server ora rimuove le voci del registro delle modifiche più vecchie di `BEEHIVE_CHANGELOG_RETENTION_DAYS` (predefinito 180, `0` conserva tutto). Con il valore predefinito, la prima rimozione avviene 180 giorni dopo l'aggiornamento.
- **App vecchie.** `BEEHIVE_SYNC_MIN_PROTOCOL` (predefinito `0`) continua ad accettare le app 0.4.x installate; impostalo a `1` quando tutti i dispositivi si sono aggiornati.
- **`BEEHIVE_BLOB_PUBLIC_URL`** viene ignorata e il server lo segnala all'avvio; rimuovila.

**File Compose**

- `docker-compose.yml` è lo stack di sviluppo: ora richiede `BEEHIVE_SESSION_SECRET` e `MINIO_ROOT_PASSWORD`, pubblica PostgreSQL e MinIO solo su `127.0.0.1` e abilita OIDC solo quando lo chiedi.
- Per eseguire Openbeehive, usa il nuovo `docker-compose.selfhost.yml` (un container, SQLite) oppure `docker-compose.prod.yml` (PostgreSQL e MinIO). `docker-compose.demo.yml` è la demo ospitata e pubblica su `127.0.0.1` a meno che `BEEHIVE_BIND` non sia impostato. Vedi [Docker e Compose](./docker.md).

**Dati**

- **Attivare l'accesso sposta i dati dell'utente singolo.** Se l'istanza funzionava senza accesso e abiliti l'accesso email/password, i dati esistenti passano nello spazio dell'amministratore dell'istanza all'avvio successivo. Non può essere annullato; vedi [Autenticazione](./authentication.md#single-user-to-login).
- **Migrazioni del database.** Il primo avvio ricostruisce la tabella delle visite e l'indice del registro delle modifiche, quindi richiede più tempo su un database grande. Su MariaDB converte inoltre le tabelle a una collation binaria, e una migrazione che lì fallisce non può essere annullata: un backup è l'unico modo per tornare indietro.
- **Le foto passano all'archiviazione blob.** Il primo avvio converte le foto memorizzate direttamente nel database in record di foto con le loro immagini nell'archiviazione blob, prima che il server accetti richieste; con molte foto richiede alcuni minuti. Da ora in poi un backup è il database **più** la directory o il bucket dei blob. Vedi [Archiviazione](./storage.md#inline-photos).
- **Ripristinare un backup** significa: fermare il server, ripristinare insieme database e blob, avviarlo. Le app aggiornate caricano poi ciò che il backup ha perso; le app 0.4.x non possono farlo. Vedi [Backup](./backups.md#restoring).
- **Indirizzi email che differiscono solo per maiuscole e minuscole.** Due account esistenti i cui indirizzi differiscono solo per maiuscole e minuscole continuano a funzionare, ma l'accesso via email raggiunge solo uno dei due. Il log indica ogni coppia a ogni avvio; vedi [Autenticazione](./authentication.md#accounts).
- **Esegui esattamente un'istanza del server** per database. La compattazione e la manutenzione delle foto girano all'interno del processo del server.

**Comportamenti che utenti e script noteranno**

- **Gli inviti** scadono dopo 7 giorni e funzionano solo per l'indirizzo email invitato. Gli inviti aperti più vecchi devono essere emessi di nuovo.
- **Limitazione dei tentativi di accesso.** Dopo 10 accessi falliti per un account o 30 da un indirizzo in 15 minuti il server risponde `429` con `Retry-After`.
- **Limiti.** Un messaggio RPC può essere al massimo di 16 MiB e una richiesta può durare al massimo 2 minuti (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`).
- **Orologi dei dispositivi.** Le modifiche con una marca temporale più di 10 minuti avanti rispetto all'ora del server vengono rifiutate. Le app aggiornate si correggono da sole; un'app 0.4.x con l'orologio sbagliato perde tali modifiche, quindi aggiorna l'app su ogni dispositivo.
- **API.** Le chiamate di aggiornamento modificano solo i campi inviati; `DeleteApiary` fallisce con `failed_precondition` finché l'apiario ha arnie; le attività personali vengono restituite solo al loro proprietario; i valori numerici delle ispezioni che non sono stati registrati vengono omessi invece di essere restituiti come `0`. Gli endpoint HTTP semplici sotto `/auth/` e `/tenants/` accettano solo il metodo documentato, richiedono `Content-Type: application/json` quando accettano un corpo, e `/tenants/delete` richiede `org_id`. Vedi [REST](../using-the-api/rest.md).
- **Foto via HTTP.** `/files/` non esiste più. Le immagini a piena risoluzione vengono servite su `/photos/<id>` solo ai membri dello spazio, con una sessione o una chiave API.
- **Link aperti nel browser.** `/auth/verify`, `/auth/login` e `/auth/callback` reindirizzano alla pagina di accesso con un messaggio di errore invece di rispondere con JSON.
- **Gli script che chiamano `SyncService`** devono inviare l'intestazione `Openbeehive-Sync-Protocol: 1`; senza di essa ricevono i dati come li vede un'app 0.4.1, senza foto né snapshot. Vedi [Protocollo di sincronizzazione](../developers/sync-protocol.md#versions).

Le app 0.4.x installate continuano a funzionare con un server 0.5.0, ma non vedono le foto aggiunte dai dispositivi aggiornati. Dopo che l'app si è aggiornata, ogni dispositivo carica ancora una volta i dati attuali dal server.

### 0.4.0: il container viene eseguito come utente non privilegiato

Fino alla 0.3.1 l'immagine veniva eseguita come root, quindi un volume creato da un container più vecchio appartiene a root e il server 0.4.0 (uid `65532`) non riesce ad aprire il database al suo interno. Correggi la proprietà una volta sola, prima di avviare la nuova immagine:

```bash
# named volume from the quick start
docker run --rm -v openbeehive-data:/data docker.io/library/alpine:3.23 chown -R 65532:65532 /data

# bind-mounted host directory
sudo chown -R 65532:65532 /srv/openbeehive
```

Il sintomo di un chown saltato è `unable to open database file` o `permission denied` nel log del server subito dopo l'avvio. I deployment Kubernetes con `securityContext.fsGroup: 65532` non richiedono alcun passaggio manuale. I volumi creati dalla 0.4.0 in poi hanno il proprietario giusto fin dall'inizio.

Il profilo cloud (Postgres e MinIO) non è interessato: il container del server non contiene dati.

## Come funzionano le migrazioni

Le migrazioni dello schema vengono eseguite automaticamente all'avvio del server. All'avvio il server applica in ordine eventuali migrazioni in sospeso e solo allora inizia a servire le richieste. Funziona allo stesso modo per PostgreSQL, MariaDB e SQLite.

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

Questo produce un nuovo `./server/bin/openbeehive`. I prerequisiti sono in [Binario singolo](./single-binary.md) (Go 1.27+, Node 24+, buf).

## Aggiornare con Docker

Il comando necessario dipende da dove proviene l'immagine.

**Immagine pubblicata** (il `docker run` a singolo container dell'[avvio rapido](./quick-start.md), oppure un file Compose con una riga `image:` come `docker-compose.selfhost.yml` o `docker-compose.prod.yml`). I file Compose fissano una release tramite tag e digest; cambia la riga `image:` con la release che vuoi (o prendi il file da quella release), poi:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f server
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

:::caution[La 0.x è software in fase iniziale]
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

Se qualcosa sembra sbagliato, vedi [Risoluzione dei problemi](../knowledge-base/troubleshooting.md) ed effettua il rollback al tuo backup mentre indaghi.
