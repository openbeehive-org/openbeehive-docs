---
sidebar_position: 8
title: "Reverse proxy e TLS"
---

# Reverse proxy e TLS

Openbeehive è in ascolto su HTTP semplice (`BEEHIVE_ADDR`, `:8080` per impostazione predefinita). Per qualsiasi deployment che altre persone raggiungono, metti davanti un reverse proxy che termina il TLS e inoltra il traffico all'app. Questa pagina mostra configurazioni funzionanti per Caddy e nginx.

HTTPS è necessario per la PWA installabile, lo scanner QR basato sulla fotocamera e le passkey. Mantieni Openbeehive legato a localhost e lascia che il proxy si affacci su internet.

## Impostazioni sul lato di Openbeehive

| Impostazione | Perché |
| --- | --- |
| `BEEHIVE_PUBLIC_BASE_URL` | L'URL HTTPS pubblico, ad es. `https://bees.example.com`. Usato per i redirect OIDC, i link di invito e di verifica e i valori predefiniti delle passkey. |
| `BEEHIVE_ADDR` | `127.0.0.1:8080` lega il server solo a localhost, così l'app è raggiungibile unicamente attraverso il proxy. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `true` dietro il proxy, così la limitazione dei tentativi di accesso conta il vero indirizzo del client (l'ultima voce di `X-Forwarded-For`) invece di quello del proxy. Solo con esattamente un proxy davanti e con la porta del server non raggiungibile in altro modo: un client che può raggiungere direttamente la porta potrebbe falsificare l'intestazione. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Solo quando la web app è servita da un'origine diversa da quella dell'API. Altrimenti lascialo vuoto (stessa origine). |

Non serve altro. La web app parla con il server tramite normali richieste HTTP (Connect-RPC), quindi non c'è alcun WebSocket da aggiornare. Il server limita ogni richiesta a 2 minuti (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`) e un messaggio RPC a 16 MiB; mantieni il limite del corpo delle richieste del proxy a 16 MiB o più (nginx: `client_max_body_size 16m;`). L'unica richiesta di lunga durata è lo stream facoltativo `Subscribe` dell'API, che è escluso dai timeout.

### Intestazioni inviate dal server

Il server aggiunge le proprie intestazioni di sicurezza a ogni risposta: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, una `Content-Security-Policy` che consente l'origine dell'app più le origini configurate delle tessere della mappa e della ricerca di indirizzi, e `Strict-Transport-Security` quando `BEEHIVE_PUBLIC_BASE_URL` inizia con `https://`. Non aggiungere una seconda Content-Security-Policy nel proxy; i browser le applicano entrambe e l'app potrebbe smettere di caricarsi.

## Caddy

Caddy ottiene e rinnova automaticamente i certificati Let's Encrypt.

```text title="Caddyfile"
bees.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

Ricarica con `caddy reload` (o `systemctl reload caddy`); Caddy recupera un certificato alla prima richiesta. Per far passare anche i client gRPC, inoltra HTTP/2 in chiaro al backend: `reverse_proxy h2c://127.0.0.1:8080`.

## nginx

nginx non gestisce esso stesso i certificati; abbinalo a certbot (`certbot --nginx`).

```nginx title="/etc/nginx/sites-available/openbeehive.conf"
server {
    listen 443 ssl http2;
    server_name bees.example.com;

    ssl_certificate     /etc/letsencrypt/live/bees.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bees.example.com/privkey.pem;

    location / {
        client_max_body_size 16m;
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name bees.example.com;
    return 301 https://$host$request_uri;
}
```

Testa e ricarica:

```bash
nginx -t && systemctl reload nginx
```

`$proxy_add_x_forwarded_for` aggiunge l'indirizzo del client come ultima voce, che è quella che il server legge con `BEEHIVE_TRUST_PROXY_HEADERS=true`. `proxy_pass` parla HTTP/1.1 con il backend, che è tutto ciò di cui la web app ha bisogno. I client gRPC richiedono HTTP/2 da un capo all'altro; per loro aggiungi una `location` separata con `grpc_pass grpc://127.0.0.1:8080;`.

## Origini separate (app su un host diverso)

La maggior parte dei self-hoster serve la web app e l'API da un unico dominio con `BEEHIVE_SERVE_WEB=true`. Se la PWA viene eseguita su un'origine separata, il browser blocca le richieste cross-origin a meno che quell'origine non sia consentita:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Elenca più origini separate da virgole. `*` consente qualsiasi origine ma mai con credenziali, quindi non funziona per un'app con accesso effettuato.

L'app separata deve anche essere servita da un server web separato. La web app servita da questo server gira sotto una Content-Security-Policy con `connect-src 'self'`, quindi una build che punta a un altro indirizzo dell'API (`BEEHIVE_API_URL` in fase di build) viene bloccata quando è servita da qui.

## Checklist

- `BEEHIVE_PUBLIC_BASE_URL` è l'URL pubblico `https://`.
- Il TLS è in atto: automatico con Caddy, tramite certbot con nginx.
- `BEEHIVE_TRUST_PROXY_HEADERS=true`, e la porta del server è raggiungibile solo attraverso il proxy.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` è impostato solo se l'app è su un'origine diversa.
- Le etichette QR codificano l'indirizzo da cui sono state stampate; ristampale dopo un cambio di dominio.

Per le opzioni del server vedi [Configurazione](./configuration.md).
