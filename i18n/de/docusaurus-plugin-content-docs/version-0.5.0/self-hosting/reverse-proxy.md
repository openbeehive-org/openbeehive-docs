---
sidebar_position: 8
title: "Reverse Proxy & TLS"
---

# Reverse Proxy & TLS

Openbeehive lauscht auf reinem HTTP (`BEEHIVE_ADDR`, standardmäßig `:8080`). Für jede Bereitstellung, die andere Personen erreichen, setze einen Reverse Proxy davor, der TLS terminiert und an die App weiterleitet. Diese Seite zeigt funktionierende Konfigurationen für Caddy und nginx.

HTTPS ist nötig für die installierbare PWA, den kamerabasierten QR-Scanner und Passkeys. Lass Openbeehive an localhost gebunden und wende den Proxy dem Internet zu.

## Einstellungen auf der Openbeehive-Seite

| Einstellung | Warum |
| --- | --- |
| `BEEHIVE_PUBLIC_BASE_URL` | Die öffentliche HTTPS-URL, z. B. `https://bees.example.com`. Wird für OIDC-Redirects, Einladungs- und Verifizierungslinks sowie Passkey-Standardwerte verwendet. |
| `BEEHIVE_ADDR` | `127.0.0.1:8080` bindet nur an localhost, sodass die App ausschließlich über den Proxy erreichbar ist. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `true` hinter dem Proxy, damit die Drosselung der Anmeldung die echte Client-Adresse zählt (den letzten `X-Forwarded-For`-Eintrag) statt die des Proxys. Nur wenn genau ein Proxy davorsteht und der Server-Port anders nicht erreichbar ist: Ein Client, der den Port direkt erreichen kann, könnte den Header fälschen. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Nur wenn die Web-App von einem anderen Ursprung als die API ausgeliefert wird. Andernfalls leer lassen (Same-Origin). |

Kommen Anfragen mit `X-Forwarded-For` an, während `BEEHIVE_TRUST_PROXY_HEADERS` auf `false` steht, protokolliert der Server einmal eine Warnung, die die Einstellung nennt. Mit einem CDN vor deinem Proxy ist der letzte `X-Forwarded-For`-Eintrag die Adresse des CDN, sodass sich alle Besucher ein Drosselungsbudget teilen. Lass den Proxy zuerst die Client-Adresse aus dem CDN wiederherstellen (in nginx das Modul `realip` mit den Adressbereichen des CDN). Beim Start protokolliert der Server außerdem seinen CORS-Modus.

Mehr ist nicht erforderlich. Die Web-App spricht mit dem Server über gewöhnliche HTTP-Anfragen (Connect-RPC), es gibt also keinen WebSocket zum Upgraden. Der Server begrenzt jede Anfrage auf 2 Minuten (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`) und eine RPC-Nachricht auf 16 MiB; halte das Body-Limit des Proxys bei 16 MiB oder darüber (nginx: `client_max_body_size 16m;`). Zwei Anfragen können länger laufen: der optionale `Subscribe`-Stream der API, der von den Timeouts ausgenommen ist, und der Server-Export `GET /export`, der bis zu 30 Minuten dauern darf. Begrenzt dein Proxy die Gesamtdauer einer Antwort, erlaube für `/export` mindestens 30 Minuten.

### Header, die der Server sendet

Der Server fügt jeder Antwort seine eigenen Sicherheits-Header hinzu: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, eine `Content-Security-Policy`, die den eigenen Ursprung der App sowie die konfigurierten Ursprünge für Kartenkacheln und Adresssuche erlaubt, und `Strict-Transport-Security`, wenn `BEEHIVE_PUBLIC_BASE_URL` mit `https://` beginnt. Füge im Proxy keine zweite Content-Security-Policy hinzu; Browser wenden beide an, und die App lädt dann möglicherweise nicht mehr.

## Caddy

Caddy beschafft und erneuert Let's-Encrypt-Zertifikate automatisch.

```text title="Caddyfile"
bees.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

Lade mit `caddy reload` (oder `systemctl reload caddy`) neu; Caddy holt bei der ersten Anfrage ein Zertifikat. Um auch gRPC-Clients durchzulassen, leite HTTP/2-Klartext an das Backend weiter: `reverse_proxy h2c://127.0.0.1:8080`.

## nginx

nginx verwaltet Zertifikate nicht selbst; kopple es mit certbot (`certbot --nginx`).

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

Testen und neu laden:

```bash
nginx -t && systemctl reload nginx
```

`$proxy_add_x_forwarded_for` hängt die Client-Adresse als letzten Eintrag an, und genau diesen liest der Server mit `BEEHIVE_TRUST_PROXY_HEADERS=true`. `proxy_pass` spricht HTTP/1.1 mit dem Backend, was für die Web-App völlig ausreicht. gRPC-Clients brauchen HTTP/2 durchgehend; füge für sie eine separate `location` mit `grpc_pass grpc://127.0.0.1:8080;` hinzu.

## Geteilte Ursprünge (App auf einem anderen Host)

Die meisten Self-Hoster liefern die Web-App und die API von einer Domain aus, mit `BEEHIVE_SERVE_WEB=true`. Wenn die PWA auf einem separaten Ursprung läuft, blockiert der Browser Cross-Origin-Anfragen, es sei denn, dieser Ursprung ist erlaubt:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Liste mehrere Ursprünge kommagetrennt auf. `*` erlaubt jeden Ursprung, aber nie mit Anmeldedaten, und funktioniert daher nicht für eine angemeldete App.

Die separate App muss außerdem von einem separaten Webserver ausgeliefert werden. Die Web-App, die dieser Server ausliefert, läuft unter einer Content-Security-Policy mit `connect-src 'self'`; ein Build, der auf eine andere API-Adresse zeigt (`BEEHIVE_API_URL` zur Build-Zeit), wird daher blockiert, wenn er von hier ausgeliefert wird.

## Checkliste

- `BEEHIVE_PUBLIC_BASE_URL` ist die öffentliche `https://`-URL.
- TLS ist eingerichtet: automatisch mit Caddy, über certbot mit nginx.
- `BEEHIVE_TRUST_PROXY_HEADERS=true`, und der Server-Port ist nur über den Proxy erreichbar.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` ist nur gesetzt, wenn die App auf einem anderen Ursprung liegt.
- QR-Etiketten enthalten die Adresse, von der sie gedruckt wurden; drucke sie nach einem Domainwechsel neu.

Für die Server-Optionen siehe [Konfiguration](./configuration.md).
