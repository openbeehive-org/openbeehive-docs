---
sidebar_position: 7
title: "Autenticazione"
---

# Autenticazione

Openbeehive ti permette di scegliere quanta autenticazione ti serve. Un apicoltore singolo che esegue il binario unico a casa può saltare del tutto l'accesso. Un'istanza condivisa può usare account email/password integrati, passkey, l'accesso tramite un provider di identità, o una combinazione di questi.

## Scegliere una modalità

| Modalità | Quando usarla | Impostazioni chiave |
| --- | --- | --- |
| Nessun accesso (utente singolo) | Una persona, un server, sulla tua rete o dietro un reverse proxy fidato | `BEEHIVE_PASSWORD_AUTH` disattivato (predefinito di selfhost), `BEEHIVE_OIDC_PROVIDERS` vuoto, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Email e password (account in-app) | Un'istanza condivisa senza un provider di identità esterno | `BEEHIVE_PASSWORD_AUTH=true` (predefinito per il profilo `cloud`) più `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkey (WebAuthn) | Accesso senza password con dati biometrici del dispositivo o chiavi di sicurezza, aggiunto sopra un altro metodo | `BEEHIVE_WEBAUTHN_ENABLED=true` più `BEEHIVE_WEBAUTHN_RP_*` |
| Provider OIDC | Hai già Google, Keycloak, Authentik o simili, oppure vuoi un controllo centralizzato degli account | `BEEHIVE_OIDC_PROVIDERS` più le impostazioni per ciascun provider |

I metodi di accesso si combinano. La schermata di accesso offre quelli abilitati, e un unico account funziona con tutti: accedere con un provider si collega a un account email/password esistente con la stessa email.

Abilitare un qualsiasi metodo di accesso abilita anche i tenant e gli inviti (Impostazioni → Spazi); vedi [Account e tenant](/using-the-app/accounts-tenants).

## Modalità 1: utente singolo, nessun accesso

Il valore predefinito per un'istanza `selfhost`. Lascia tutti e tre disattivati:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Senza alcun metodo di accesso abilitato, Openbeehive funziona come istanza a utente singolo con un'identità locale fissa e non mostra mai una schermata di accesso.

:::caution
"Nessun accesso" significa che chiunque possa raggiungere il server può leggere e modificare i tuoi dati. Usalo solo su una rete fidata, su `localhost`, o dietro un reverse proxy che gestisce esso stesso l'accesso. Se la tua istanza è raggiungibile da internet, abilita un metodo di accesso.
:::

## Impostazioni di sessione (richieste una volta abilitato un qualsiasi accesso)

Non appena un metodo di accesso è attivo, il server emette token di sessione firmati e ha bisogno di un segreto:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` accetta una durata in formato Go (`720h` sono 30 giorni, `24h` un giorno). Alla scadenza, gli utenti accedono di nuovo.

:::danger
Mantieni `BEEHIVE_SESSION_SECRET` segreto e stabile. Chiunque lo scopra può falsificare le sessioni. Se lo cambi, tutte le sessioni esistenti vengono invalidate. Non inserirlo mai nel controllo di versione.
:::

Se servi l'app tramite HTTPS attraverso un reverse proxy, assicurati che `BEEHIVE_PUBLIC_BASE_URL` usi `https://` in modo che i link di reindirizzamento e di invito siano corretti. Vedi [Reverse proxy](/self-hosting/reverse-proxy).

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

### Istanze solo su invito

Per impedire a estranei di creare account, imposta `BEEHIVE_REGISTRATION=false`. L'amministratore viene dall'ambiente, quindi un'istanza nuova ne ha sempre uno. Tutti gli altri si uniscono tramite link di invito, che un amministratore del tenant emette da Impostazioni → Spazi. La registrazione tramite un link di invito deve usare l'indirizzo email invitato. La schermata di accesso mostra un avviso che l'istanza è solo su invito; gli account esistenti accedono normalmente.

Ogni nuovo account inizia con il proprio [tenant](/using-the-app/accounts-tenants) personale. Solo l'account amministratore configurato porta il ruolo di amministratore dell'istanza.

### Verifica email facoltativa

Per impostazione predefinita un nuovo account può accedere immediatamente. Per richiedere alle persone di confermare prima il proprio indirizzo email:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Configura SMTP affinché le email di verifica e di invito vengano inviate:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Se `BEEHIVE_SMTP_HOST` è vuoto, Openbeehive scrive i link di verifica e di invito nel log del server invece di inviarli via email. I link di invito vengono mostrati nell'app anche all'amministratore che li ha creati.
:::

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

:::note Gli account si collegano automaticamente
Quando qualcuno accede tramite un provider, Openbeehive confronta prima l'identità del provider, poi l'indirizzo email (collegando un account email/password esistente), e altrimenti crea un nuovo account. L'amministratore dell'istanza resta l'account indicato in `BEEHIVE_ADMIN_EMAIL`, in qualunque modo acceda.
:::

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

## Verificare la configurazione

Riavvia il server e carica l'app in un browser:

1. Con **nessun accesso**, la Panoramica si apre direttamente.
2. Con un metodo di accesso abilitato, la schermata di accesso offre ciascun metodo abilitato (e "Esplora la demo" se la demo è attiva).
3. Completa un accesso e verifica di raggiungere la Panoramica e che i dati si sincronizzino.

Se qualcosa non funziona, controlla i log del server e la [Risoluzione dei problemi](/knowledge-base/troubleshooting).
