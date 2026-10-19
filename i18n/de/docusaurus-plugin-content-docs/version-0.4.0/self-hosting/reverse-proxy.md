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
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Nur wenn die Web-App von einem anderen Ursprung als die API ausgeliefert wird. Andernfalls den Standard belassen. |

Mehr ist nicht erforderlich. Die Web-App spricht mit dem Server über gewöhnliche HTTP-Anfragen (Connect-RPC), es gibt also keinen WebSocket zum Upgraden und keinen langlebigen Stream, der offen gehalten werden muss. Die eigenen Read- und Write-Timeouts des Servers stehen standardmäßig auf `0` (kein Limit) und müssen nicht geändert werden.

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

`proxy_pass` spricht HTTP/1.1 mit dem Backend, was für die Web-App völlig ausreicht. gRPC-Clients brauchen HTTP/2 durchgehend; füge für sie eine separate `location` mit `grpc_pass grpc://127.0.0.1:8080;` hinzu.

## Geteilte Ursprünge (App auf einem anderen Host)

Die meisten Self-Hoster liefern die Web-App und die API von einer Domain aus, mit `BEEHIVE_SERVE_WEB=true`. Wenn die PWA auf einem separaten Ursprung läuft, blockiert der Browser Cross-Origin-Anfragen, es sei denn, dieser Ursprung ist erlaubt:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Liste mehrere Ursprünge kommagetrennt auf. Vermeide `*` zusammen mit `BEEHIVE_CORS_ALLOW_CREDENTIALS=true`; Browser lehnen diese Kombination für Anfragen mit Anmeldedaten ab.

## Checkliste

- `BEEHIVE_PUBLIC_BASE_URL` ist die öffentliche `https://`-URL.
- TLS ist eingerichtet: automatisch mit Caddy, über certbot mit nginx.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` ist nur gesetzt, wenn die App auf einem anderen Ursprung liegt.
- QR-Etiketten enthalten die Adresse, von der sie gedruckt wurden; drucke sie nach einem Domainwechsel neu.

Für die Server-Optionen siehe [Konfiguration](/self-hosting/configuration).
