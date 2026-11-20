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
| `BEEHIVE_TRUST_PROXY_HEADERS` | `true` behind the proxy, so sign-in throttling counts the real client address (the last `X-Forwarded-For` entry) instead of the proxy's. Only with exactly one proxy in front and the server port unreachable otherwise: a client that can reach the port directly could forge the header. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Only when the web app is served from a different origin than the API. Otherwise leave it empty (same-origin). |

Nothing else is required. The web app talks to the server with ordinary HTTP requests (Connect-RPC), so there is no WebSocket to upgrade. The server limits every request to 2 minutes (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`) and one RPC message to 16 MiB; keep the proxy's body limit at 16 MiB or above (nginx: `client_max_body_size 16m;`). Two requests may run longer: the optional `Subscribe` stream of the API, which is exempt from the timeouts, and the server export `GET /export`, which may take up to 30 minutes. If your proxy limits how long a response may take in total, allow at least 30 minutes for `/export`.

### Headers the server sends

The server adds its own security headers to every response: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, a `Content-Security-Policy` that allows the app's own origin plus the configured map tile and address search origins, and `Strict-Transport-Security` when `BEEHIVE_PUBLIC_BASE_URL` starts with `https://`. Do not add a second Content-Security-Policy in the proxy; browsers apply both and the app may stop loading.

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

Test and reload:

```bash
nginx -t && systemctl reload nginx
```

`$proxy_add_x_forwarded_for` appends the client address as the last entry, which is the one the server reads with `BEEHIVE_TRUST_PROXY_HEADERS=true`. `proxy_pass` speaks HTTP/1.1 to the backend, which is all the web app needs. gRPC clients need HTTP/2 end to end; for those add a separate `location` with `grpc_pass grpc://127.0.0.1:8080;`.

## Split origins (app on a different host)

Most self-hosters serve the web app and the API from one domain with `BEEHIVE_SERVE_WEB=true`. If the PWA runs on a separate origin, the browser blocks cross-origin requests unless that origin is allowed:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

List multiple origins comma-separated. `*` allows any origin but never with credentials, so it does not work for a signed-in app.

The separate app must also be served by a separate web server. The web app this server serves runs under a Content-Security-Policy with `connect-src 'self'`, so a build that points at another API address (`BEEHIVE_API_URL` at build time) is blocked when it is served from here.

## Checklist

- `BEEHIVE_PUBLIC_BASE_URL` is the public `https://` URL.
- TLS is in place: automatic with Caddy, via certbot with nginx.
- `BEEHIVE_TRUST_PROXY_HEADERS=true`, and the server port is reachable through the proxy only.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` is set only if the app is on a different origin.
- QR labels encode the address they were printed from; reprint them after a domain change.

For the server options see [Configuration](./configuration.md).
