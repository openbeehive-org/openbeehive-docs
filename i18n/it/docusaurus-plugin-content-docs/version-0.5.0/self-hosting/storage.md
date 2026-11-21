---
sidebar_position: 6
title: "Archiviazione blob"
---

# Archiviazione blob

Openbeehive memorizza i tuoi registri in un database, ma le immagini a piena risoluzione delle foto risiedono separatamente nell'**archiviazione blob**. Questo mantiene snello il database e ti permette di scalare l'archiviazione delle immagini in modo indipendente.

Una foto ha due parti. Il suo record, con una piccola miniatura di circa 200 pixel, è memorizzato nel database e si sincronizza su ogni dispositivo come qualsiasi altro record. L'immagine a piena risoluzione (al massimo 2048 pixel sul lato più lungo e 5 MiB) è memorizzata nell'archiviazione blob sotto un prefisso per ciascuno spazio (`<workspace>/photos/...`). Il server la serve solo ai membri di quello spazio che hanno effettuato l'accesso, tramite `/photos/<id>`; l'archivio dei blob in sé non è mai esposto. Eliminare una foto ne rimuove l'immagine, ed eliminare uno spazio rimuove tutto ciò che si trova sotto il suo prefisso.

Scegli un backend con la variabile d'ambiente `BEEHIVE_BLOB_BACKEND`. Ci sono due
opzioni: il **filesystem** locale e un object store **compatibile con S3** come
**MinIO**.

## Scegliere un backend

| Backend | `BEEHIVE_BLOB_BACKEND` | Ideale per | Note |
| --- | --- | --- | --- |
| Filesystem | `fs` | Self-hosting su singolo server | Il più semplice; nessun servizio extra da eseguire |
| MinIO / S3 | `minio` | Cloud, multi-server, flotte più grandi | Scalabile, durevole, può essere delegato |

Una buona regola pratica: se esegui il profilo **selfhost** su una macchina, usa il
filesystem. Se esegui il profilo **cloud** o prevedi di crescere, usa l'object
storage.

:::note
Il backend dei blob è indipendente dal driver del database. Puoi abbinare SQLite
a MinIO, o PostgreSQL al filesystem, in qualsiasi combinazione si addica alla
tua configurazione.
:::

## Archiviazione su filesystem

Questo è il valore predefinito per il self-hosting. Le foto vengono scritte in una directory su disco.

```bash
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
```

`BEEHIVE_BLOB_DIR` è dove vengono memorizzati i file. Il percorso è relativo alla directory di lavoro
del processo del server, quindi per risultati prevedibili su un server, usa un
percorso assoluto come `/var/lib/openbeehive/blobs`.

Dai ai blob una directory tutta loro. La manutenzione del server elenca ed elimina i file al suo interno, quindi con SQLite il server si rifiuta di avviarsi quando `BEEHIVE_BLOB_DIR` contiene il file del database, e indica una directory da usare al suo posto.

Il server non serve questa directory direttamente, e non dovrebbe farlo nient'altro: le immagini raggiungono l'app solo tramite l'endpoint autenticato `/photos/`. Fino alla 0.4.x il server pubblicava la directory sotto `/files/` e leggeva `BEEHIVE_BLOB_PUBLIC_URL`; entrambi non esistono più (il server avvisa all'avvio se l'impostazione è ancora presente).

Il server crea la directory se non esiste, ma assicurati che il processo
ne sia proprietario e possa scrivervi.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution[Esegui il backup]
La directory dei blob **non** è memorizzata nel tuo database. Un solo backup del database
non salverà le tue foto. Un backup è il database più `BEEHIVE_BLOB_DIR`, e i due vanno ripristinati insieme. Vedi
[Backup](./backups.md).
:::

### Nota su Docker

Se esegui l'[immagine Docker](./docker.md), monta un volume così i blob
sopravvivono ai riavvii e agli aggiornamenti del container. Il container viene
eseguito come uid `65532`; una directory dell'host montata con bind mount deve
appartenere a quell'utente:

```bash
docker run -d \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-blobs:/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## Archiviazione MinIO / S3

L'object storage è la scelta giusta per il profilo cloud e per chiunque
voglia un'archiviazione delle foto durevole e scalabile che possa risiedere su una macchina separata o un
servizio gestito.

```bash
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=play.min.io
BEEHIVE_MINIO_ACCESS_KEY=your-access-key
BEEHIVE_MINIO_SECRET_KEY=your-secret-key
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=true
```

| Variabile | Scopo |
| --- | --- |
| `BEEHIVE_MINIO_ENDPOINT` | Host (e porta opzionale) dell'object store, senza schema |
| `BEEHIVE_MINIO_ACCESS_KEY` | Access key / key ID |
| `BEEHIVE_MINIO_SECRET_KEY` | Secret key |
| `BEEHIVE_MINIO_BUCKET` | Bucket dove sono memorizzati i blob |
| `BEEHIVE_MINIO_USE_SSL` | `true` per connetterti tramite HTTPS, `false` per HTTP semplice |

:::tip[Formato dell'endpoint]
Indica `BEEHIVE_MINIO_ENDPOINT` come host, facoltativamente con una porta, ad esempio
`minio.example.com` o `minio.example.com:9000`. Non includere `https://`.
Controlla lo schema con `BEEHIVE_MINIO_USE_SSL` invece.
:::

### Il bucket

All'avvio il server controlla se il bucket indicato in `BEEHIVE_MINIO_BUCKET` esiste e lo crea in caso contrario, quindi con credenziali che possono creare bucket non c'è nulla da preparare. Se le tue credenziali sono limitate a un bucket esistente, crealo prima, ad esempio con il client MinIO:

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

:::caution[Mantieni il bucket privato]
I blob possono contenere foto identificabili dei tuoi apiari. Non rendere il bucket
leggibile pubblicamente. Openbeehive serve le immagini solo ai membri dello spazio
che hanno effettuato l'accesso, quindi l'object store non ha bisogno di accesso pubblico.
:::

## Compatibilità S3

Il backend MinIO comunica con l'API S3 standard, quindi funziona con qualsiasi
provider compatibile con S3, non solo MinIO. Questo include:

- **MinIO** (object storage self-hosted)
- **Amazon S3**
- Altri servizi compatibili con S3 (ad esempio l'endpoint S3 di Backblaze B2,
  Cloudflare R2, Wasabi o Ceph RADOS Gateway)

Per questi, punta `BEEHIVE_MINIO_ENDPOINT` all'endpoint S3 del provider, imposta l'access
key e la secret key, scegli il tuo bucket e imposta `BEEHIVE_MINIO_USE_SSL=true`.

| Provider | Endpoint di esempio |
| --- | --- |
| Amazon S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2 | `s3.<region>.backblazeb2.com` |
| MinIO (self-host) | `minio.example.com:9000` |

:::note[Regioni e indirizzamento]
Alcuni provider sono sensibili alle impostazioni di regione o richiedono l'indirizzamento
in stile path anziché virtual-hosted. Se i caricamenti falliscono con un provider diverso da MinIO,
ricontrolla l'endpoint e che il bucket esista nella regione prevista.
Vedi [Risoluzione dei problemi](../knowledge-base/troubleshooting.md) se i problemi persistono.
:::

## Manutenzione \{#upkeep}

Il server tiene in ordine l'archiviazione blob da solo; non c'è nulla da pianificare:

- L'immagine di una foto eliminata viene rimossa poco dopo l'eliminazione; una che sfugge viene rimossa dal passaggio successivo, una volta vecchia di un'ora.
- Anche le foto di una visita o di un'arnia eliminata da più di un'ora vengono eliminate.
- Ogni sei ore un passaggio rimuove le immagini che nessun record di foto conosce (per esempio un caricamento il cui record non è mai arrivato, o le immagini di uno spazio eliminato) una volta più vecchie di 30 giorni o di `BEEHIVE_CHANGELOG_RETENTION_DAYS`, se più lungo. Dopo il ripristino di un database, i dispositivi inviano di nuovo i record delle foto più recenti alla sincronizzazione successiva, che può avvenire settimane dopo, e le loro immagini devono essere ancora lì.
- Il passaggio all'avvio non rimuove nulla: restituisce solo le immagini ai record di foto che le hanno perse, come dopo un ripristino.
- Vengono toccate solo le chiavi nella forma che il server costruisce per le foto; gli altri file nel bucket o nella directory restano intatti.

Questo presuppone una sola istanza del server: eseguine esattamente una per database.

## Foto dalla 0.4.x \{#inline-photos}

Fino alla 0.4.x l'app memorizzava le foto direttamente nel database, come data URL nelle righe delle visite e delle arnie. Al primo avvio della 0.5.0 il server converte ogni foto incorporata visibile in un record di foto con la sua immagine nell'archiviazione blob, prima di accettare richieste. Su un database con molte foto questo può richiedere alcuni minuti. Il log indica quando inizia, e il server si mette in ascolto, `/healthz` compreso, solo quando ha finito, quindi concedi ai controlli di salute abbastanza tempo: i file Compose prevedono dieci minuti (`start_period: 10m`). Una conversione interrotta riprende all'avvio successivo.

Le app 0.4.x installate continuano a funzionare: il server accetta e serve ancora per loro le foto incorporate e converte ciò che caricano. Non vedono le foto aggiunte dai dispositivi aggiornati. Un caricamento rifiutato dal server non lascia alcuna immagine, e un caricamento ripetuto sostituisce l'immagine del tentativo precedente.

## Cambiare backend in seguito

Se inizi sul filesystem e in seguito passi all'object storage, le foto esistenti
non vengono migrate automaticamente. Pianifica di copiare il contenuto di `BEEHIVE_BLOB_DIR` nel tuo
bucket (ad esempio con `mc cp --recursive` o `aws s3 sync`) prima di cambiare
`BEEHIVE_BLOB_BACKEND`, così le foto delle ispezioni più vecchie restino disponibili.
