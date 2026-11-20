---
sidebar_position: 7
title: "Autenticazione"
---

# Autenticazione

Openbeehive ti permette di scegliere quanta autenticazione ti serve. Un apicoltore singolo che esegue il binario unico a casa può saltare del tutto l'accesso. Un'istanza condivisa può usare account email/password integrati, passkey, l'accesso tramite un provider di identità, o una combinazione di questi.

## Scegliere una modalità

| Modalità | Quando usarla | Impostazioni chiave |
| --- | --- | --- |
| Nessun accesso (utente singolo) | Una persona, un server, sul tuo computer o su una rete di cui ti fidi | `BEEHIVE_PASSWORD_AUTH` disattivato (predefinito di selfhost), `BEEHIVE_OIDC_PROVIDERS` vuoto, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Email e password (account in-app) | Un'istanza condivisa senza un provider di identità esterno | `BEEHIVE_PASSWORD_AUTH=true` (predefinito per il profilo `cloud`) più `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkey (WebAuthn) | Accesso senza password con dati biometrici del dispositivo o chiavi di sicurezza, aggiunto sopra un altro metodo | `BEEHIVE_WEBAUTHN_ENABLED=true` più `BEEHIVE_WEBAUTHN_RP_*` |
| Provider OIDC | Hai già Google, Keycloak, Authentik o simili, oppure vuoi un controllo centralizzato degli account | `BEEHIVE_OIDC_PROVIDERS` più le impostazioni per ciascun provider |

I metodi di accesso si combinano. La schermata di accesso offre quelli abilitati, e un unico account funziona con tutti: accedere con un provider si aggancia a un account esistente con lo stesso indirizzo email quando entrambe le parti hanno verificato quell'indirizzo (vedi [Modalità 4](#oidc-linking)).

Le prime righe del log del server indicano la modalità in vigore: `auth: NO LOGIN (single-user mode): every request has full access to all data` oppure `auth: LOGIN REQUIRED (email+password, passkeys, OIDC:google)`.

Abilitare un qualsiasi metodo di accesso abilita anche gli spazi e gli inviti (Impostazioni → Spazi); vedi [Account e spazi](../using-the-app/accounts-tenants.md).

## Modalità 1: utente singolo, nessun accesso

Il valore predefinito per un'istanza `selfhost`. Lascia tutti e tre disattivati:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Senza alcun metodo di accesso abilitato, Openbeehive funziona come istanza a utente singolo con un'identità locale fissa e non mostra mai una schermata di accesso.

Un server di questo tipo risponde solo alle richieste indirizzate a `localhost`, a un indirizzo IP o all'host di `BEEHIVE_PUBLIC_BASE_URL`. Se lo apri con un altro nome, elenca quel nome in [`BEEHIVE_ALLOWED_HOSTS`](./configuration.md#allowed-hosts); la pagina `403` che ottieni altrimenti lo indica.

:::caution
"Nessun accesso" significa che chiunque possa raggiungere il server può leggere e modificare i tuoi dati. Usalo solo su `localhost` o su una rete fidata. Se la tua istanza è raggiungibile da internet, abilita un metodo di accesso. All'avvio il server scrive un avviso nel log quando non c'è alcun accesso e `BEEHIVE_PUBLIC_BASE_URL` non è un indirizzo locale.
:::

## Impostazioni di sessione (richieste una volta abilitato un qualsiasi accesso)

Non appena un metodo di accesso è attivo, il server emette token di sessione firmati e ha bisogno di un segreto di almeno 32 byte. Senza di esso, o con uno più corto, il server rifiuta di avviarsi e indica l'impostazione:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accetta una durata in formato Go (`720h` sono 30 giorni, `24h` un giorno). Alla scadenza, gli utenti accedono di nuovo.

Le sessioni possono essere terminate prima della scadenza. `POST /auth/logout-all` termina ogni altra sessione dell'account chiamante e restituisce un nuovo token al chiamante. Inoltre, a ogni richiesta il server verifica che l'account sia ancora membro dello spazio in cui lavora. Entrambe le cose hanno effetto entro circa 10 secondi.

:::danger
Mantieni `BEEHIVE_SESSION_SECRET` segreto e stabile. Chiunque lo scopra può falsificare le sessioni. Se lo cambi, tutti vengono disconnessi. Non inserirlo mai nel controllo di versione.
:::

Se servi l'app tramite HTTPS attraverso un reverse proxy, assicurati che `BEEHIVE_PUBLIC_BASE_URL` usi `https://` in modo che i link di reindirizzamento e di invito siano corretti. Vedi [Reverse proxy](./reverse-proxy.md).

## Modalità 2: email e password (account in-app)

```bash
BEEHIVE_PASSWORD_AUTH=true
```

Attivo per impostazione predefinita nel profilo `cloud`, disattivato per `selfhost`, e implicito con `BEEHIVE_DEMO=true`. La schermata di accesso offre allora "Accedi" e "Crea account".

L'autenticazione con password richiede un **amministratore dell'istanza** dedicato, configurato nell'ambiente anziché creato tramite la registrazione. Senza di esso il server rifiuta di avviarsi:

```bash
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters
```

Il server garantisce questo account a ogni avvio: viene creato se manca, il ruolo viene forzato ad amministratore, la password viene reimpostata al valore configurato. Quest'ultimo punto funge anche da recupero della password per l'amministratore: cambia la variabile e riavvia. La registrazione non concede mai il ruolo di amministratore, e l'email dell'amministratore deve essere diversa da quella dell'account demo.

### Limitazione dei tentativi di accesso

Gli accessi falliti vengono contati per account e per indirizzo del client: dopo 10 tentativi falliti per un account o 30 da un indirizzo nell'arco di 15 minuti, gli ulteriori tentativi ricevono HTTP `429` con un'intestazione `Retry-After` finché i 15 minuti non sono trascorsi. L'accesso con passkey viene limitato per indirizzo allo stesso modo.

Dietro un reverse proxy ogni richiesta sembra provenire dal proxy. Imposta lì `BEEHIVE_TRUST_PROXY_HEADERS=true` in modo che il server conti il vero indirizzo del client, preso dall'ultima voce di `X-Forwarded-For`. Fallo solo con esattamente un proxy davanti e con la porta del server non raggiungibile in altro modo; vedi [Reverse proxy](./reverse-proxy.md).

### Istanze solo su invito

Per impedire a estranei di creare account, imposta `BEEHIVE_REGISTRATION=false`. L'amministratore viene dall'ambiente, quindi un'istanza nuova ne ha sempre uno. Tutti gli altri si uniscono tramite link di invito, che un amministratore dello spazio emette da Impostazioni → Spazi. Un invito è valido per 7 giorni e funziona solo per l'indirizzo email per cui è stato emesso. La schermata di accesso mostra un avviso che l'istanza è solo su invito; gli account esistenti accedono normalmente.

Ogni nuovo account inizia con il proprio [spazio](../using-the-app/accounts-tenants.md) personale. Solo l'account amministratore configurato porta il ruolo di amministratore dell'istanza.

### Verifica email facoltativa

Per impostazione predefinita un nuovo account può accedere immediatamente. Per richiedere alle persone di confermare prima il proprio indirizzo email:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

La verifica richiede un server di posta: con `BEEHIVE_EMAIL_VERIFICATION=true` e senza `BEEHIVE_SMTP_HOST` il server rifiuta di avviarsi. Configura SMTP affinché le email di verifica e di invito vengano inviate:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
I link di invito e di verifica non vengono mai scritti nel log del server. Senza `BEEHIVE_SMTP_HOST` non viene inviata alcuna email di invito; l'amministratore che ha creato un invito ne copia il link da Impostazioni → Spazi e lo inoltra.
:::

### Cambiare e reimpostare le password \{#password-reset}

Chi ha effettuato l'accesso cambia la propria password da **Impostazioni → Account → Password**; così viene disconnesso da tutti gli altri suoi dispositivi. Chi ha dimenticato la password ha due modi per rientrare, a seconda della posta:

- **Con `BEEHIVE_SMTP_HOST`**, "Password dimenticata?" nella pagina di accesso invia per email un link valido per un'ora e utilizzabile una sola volta. La risposta è la stessa sia che l'indirizzo abbia un account sia che non lo abbia. Le richieste sono limitate come gli accessi.
- **Senza posta**, la pagina invita a rivolgersi all'amministratore. L'amministratore dell'istanza crea il link da **Impostazioni → Reimposta la password di un utente** e lo consegna; gli amministratori di uno spazio non possono farlo.

Impostare una nuova password tramite un link disconnette l'account ovunque. La password dell'amministratore dell'istanza è quella di `BEEHIVE_ADMIN_PASSWORD`: non può essere cambiata nell'app né con un link di reimpostazione. Nemmeno la password dell'account demo può essere cambiata.

## Modalità 3: passkey (WebAuthn)

Le passkey permettono alle persone di accedere con un'impronta digitale, una scansione del volto, un PIN del dispositivo o una chiave di sicurezza hardware.

```bash
BEEHIVE_WEBAUTHN_ENABLED=true
BEEHIVE_WEBAUTHN_RP_ID=beehive.example.com
BEEHIVE_WEBAUTHN_RP_ORIGINS=https://beehive.example.com
BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME=Openbeehive
```

- `BEEHIVE_WEBAUTHN_RP_ID` è il relying party ID: il dominio che gli utenti visitano, senza schema e senza porta (per esempio `beehive.example.com`, oppure `localhost` per i test locali). Per impostazione predefinita è l'host di `BEEHIVE_PUBLIC_BASE_URL`. Le passkey sono associate a questo dominio.
- `BEEHIVE_WEBAUTHN_RP_ORIGINS` è l'origine completa (o le origini separate da virgola) che il browser invia, incluso lo schema e la porta. Per impostazione predefinita è `BEEHIVE_PUBLIC_BASE_URL`.
- `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME` è il nome mostrato nella richiesta di passkey del browser.

Una passkey si aggiunge da **Impostazioni → Passkeys** dopo aver effettuato l'accesso, quindi le persone hanno bisogno prima di un altro modo per accedere (email/password o un provider). In seguito la schermata di accesso offre "Accedi con passkey".

:::caution
WebAuthn richiede un contesto sicuro: HTTPS, oppure `http://localhost` per lo sviluppo. Metti il server dietro TLS prima di abilitare le passkey in produzione. L'RP ID deve corrispondere al dominio in `BEEHIVE_PUBLIC_BASE_URL`.
:::

## Modalità 4: provider OIDC

Collega uno o più provider di identità OpenID Connect. Elencali separati da virgola e configura ciascuno per nome.

```bash
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://beehive.example.com/auth/callback
```

`BEEHIVE_OIDC_REDIRECT_URL` (predefinito `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback`) è l'indirizzo a cui il provider rimanda gli utenti. Deve corrispondere esattamente a quello che registri presso il provider. Ogni provider elencato ha bisogno di un issuer e di un client ID, altrimenti il server rifiuta di avviarsi.

### Come gli accessi tramite provider vengono associati agli account \{#oidc-linking}

Quando qualcuno accede tramite un provider, Openbeehive cerca un account già collegato a quell'identità del provider. In mancanza, cerca un account con lo stesso indirizzo email e vi aggancia l'accesso tramite provider, ma solo quando il provider segnala l'indirizzo come verificato **e** l'indirizzo dell'account esistente è verificato. Altrimenti l'accesso viene rifiutato e la persona continua ad accedere come faceva prima. Se non esiste un account simile, ne viene creato uno nuovo, a meno che la registrazione non sia chiusa (`BEEHIVE_REGISTRATION=false`): le istanze solo su invito non creano account tramite un provider.

L'amministratore dell'istanza resta l'account indicato in `BEEHIVE_ADMIN_EMAIL`, in qualunque modo acceda.

### Google

```bash
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=your-client-secret
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile
```

Crea il client nella Google Cloud Console sotto **APIs & Services → Credentials → OAuth client ID** (tipo: applicazione Web).

### Keycloak e Authentik

Keycloak, Authentik e altri provider conformi agli standard usano le variabili generiche per ciascun provider. Il nome del provider in `BEEHIVE_OIDC_PROVIDERS`, in maiuscolo, è il prefisso della variabile.

```bash
BEEHIVE_OIDC_PROVIDERS=keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/main
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=openbeehive
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=your-client-secret
```

L'issuer è l'URL di base del realm; Openbeehive scopre il resto da `<issuer>/.well-known/openid-configuration`. Authentik funziona allo stesso modo usando l'URL di configurazione OpenID della sua applicazione come issuer. Gli scope sono `openid,profile,email` per impostazione predefinita; sovrascrivili con `BEEHIVE_OIDC_<NAME>_SCOPES`.

### Registrare l'URL di reindirizzamento presso il tuo IdP

Nella configurazione del client del tuo provider, aggiungi un URI di reindirizzamento autorizzato che corrisponda a `BEEHIVE_OIDC_REDIRECT_URL` carattere per carattere:

```text
https://beehive.example.com/auth/callback
```

Errori comuni: lo schema deve corrispondere (`https` in produzione), nessuna barra finale a meno che il tuo valore non ne abbia una, e usa il tuo dominio pubblico anziché un hostname interno. Un errore di "redirect mismatch" significa che i due valori differiscono da qualche parte.

## Account \{#accounts}

Ognuno elimina il proprio account da **Impostazioni → Elimina l’account**. Gli spazi di cui è l'unico membro vengono eliminati insieme all'account. Se è l'unico amministratore di uno spazio che ha altri membri, l'eliminazione viene rifiutata finché non nomina amministratore qualcun altro o non elimina quello spazio. I suoi dati negli spazi condivisi restano, attribuiti a un utente eliminato. L'eliminazione si conferma con la password, con una passkey oppure, per gli account che accedono solo tramite un provider, con un accesso avvenuto meno di 5 minuti prima. L'amministratore dell'istanza indicato in `BEEHIVE_ADMIN_EMAIL` e l'account demo non possono essere eliminati nell'app.

Gli indirizzi email sono univoci indipendentemente da maiuscole e minuscole. Due account di versioni precedenti i cui indirizzi differiscono solo per maiuscole e minuscole continuano entrambi a funzionare, ma l'accesso via email, gli inviti e la reimpostazione della password raggiungono solo uno dei due. Il log del server indica ogni coppia di questo tipo a ogni avvio; decidi quale account tiene l'indirizzo ed elimina l'altro, oppure assegnagli un altro indirizzo.

I link che un browser apre come pagina (`/auth/verify` da un'email di verifica, `/auth/login` e `/auth/callback` di un accesso tramite provider) in caso di problemi rimandano il browser alla pagina di accesso con un messaggio di errore tradotto, invece di mostrare JSON.

## Attivare l'accesso su un'istanza a utente singolo esistente \{#single-user-to-login}

I dati creati senza accesso appartengono a uno spazio locale fisso che nessun account può vedere. Quando il server si avvia con l'accesso email/password abilitato e trova dati di questo tipo, li sposta nello spazio dell'amministratore dell'istanza e scrive nel log quante righe ha spostato. Le unità e la lingua scelte senza accesso diventano le impostazioni dell'amministratore. Accedi come amministratore per vederli. Lo spostamento avviene una sola volta e non può essere annullato disattivando di nuovo l'accesso; fai prima un [backup](./backups.md).

Due cose da sapere:

- Le modifiche che un dispositivo non aveva sincronizzato prima del passaggio restano nei vecchi dati locali di quel dispositivo e non vengono caricate. Sincronizza ogni dispositivo prima di attivare l'accesso.
- Con solo OIDC o passkey non esiste un amministratore dell'istanza. I dati restano allora dove sono e il log dice di impostare `BEEHIVE_PASSWORD_AUTH=true` con `BEEHIVE_ADMIN_EMAIL` e `BEEHIVE_ADMIN_PASSWORD` per adottarli.

## Verificare la configurazione

Riavvia il server e carica l'app in un browser:

1. Con **nessun accesso**, la Panoramica si apre direttamente.
2. Con un metodo di accesso abilitato, la schermata di accesso offre ciascun metodo abilitato (e "Prova la demo" se la demo è attiva).
3. Completa un accesso e verifica di raggiungere la Panoramica e che i dati si sincronizzino.

Se qualcosa non funziona, controlla i log del server e la [Risoluzione dei problemi](../knowledge-base/troubleshooting.md).
