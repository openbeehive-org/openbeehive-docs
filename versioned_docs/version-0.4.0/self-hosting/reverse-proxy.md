---
sidebar_position: 8
title: "Reverse proxy & TLS"
---

# Reverse proxy & TLS

Openbeehive listens on plain HTTP (`BEEHIVE_ADDR`, `:8080` by default). For any deployment other people reach, put a reverse proxy in front that terminates TLS and forwards to the app. This page shows working configurations for Caddy and nginx.

HTTPS is needed for the installable PWA, the camera-based QR scanner and passkeys. Keep Openbeehive bound to localhost and let the proxy face the internet.

## Settings on the Openbeehive side

| Setting | Why |
| --- | --- |
| `BEEHIVE_PUBLIC_BASE_URL` | The public HTTPS URL, e.g. `https://bees.example.com`. Used for OIDC redirects, invite and verification links, and passkey defaults. |
| `BEEHIVE_ADDR` | `127.0.0.1:8080` binds only to localhost so the app is reachable through the proxy alone. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Only when the web app is served from a different origin than the API. Otherwise leave the default. |

Nothing else is required. The web app talks to the server with ordinary HTTP requests (Connect-RPC), so there is no WebSocket to upgrade and no long-lived stream to keep open. The server's own read and write timeouts default to `0` (no limit) and need no change.

## Caddy

Caddy obtains and renews Let's Encrypt certificates automatically.

```text title="Caddyfile"
bees.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

Reload with `caddy reload` (or `systemctl reload caddy`); Caddy fetches a certificate on the first request. To let gRPC clients through as well, forward HTTP/2 cleartext to the backend: `reverse_proxy h2c://127.0.0.1:8080`.

## nginx

nginx does not manage certificates itself; pair it with certbot (`certbot --nginx`).

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

Test and reload:

```bash
nginx -t && systemctl reload nginx
```

`proxy_pass` speaks HTTP/1.1 to the backend, which is all the web app needs. gRPC clients need HTTP/2 end to end; for those add a separate `location` with `grpc_pass grpc://127.0.0.1:8080;`.

## Split origins (app on a different host)

Most self-hosters serve the web app and the API from one domain with `BEEHIVE_SERVE_WEB=true`. If the PWA runs on a separate origin, the browser blocks cross-origin requests unless that origin is allowed:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

List multiple origins comma-separated. Avoid `*` together with `BEEHIVE_CORS_ALLOW_CREDENTIALS=true`; browsers reject that combination for credentialed requests.

## Checklist

- `BEEHIVE_PUBLIC_BASE_URL` is the public `https://` URL.
- TLS is in place: automatic with Caddy, via certbot with nginx.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` is set only if the app is on a different origin.
- QR labels encode the address they were printed from; reprint them after a domain change.

For the server options see [Configuration](/self-hosting/configuration).
