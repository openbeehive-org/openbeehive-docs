---
sidebar_position: 8
title: "Reverse proxy et TLS"
---

# Reverse proxy et TLS

Openbeehive écoute en HTTP simple (`BEEHIVE_ADDR`, `:8080` par défaut). Pour tout déploiement que d'autres personnes atteignent, placez devant un reverse proxy qui termine TLS et transmet le trafic à l'application. Cette page présente des configurations fonctionnelles pour Caddy et nginx.

HTTPS est nécessaire pour la PWA installable, le scanner QR basé sur la caméra et les passkeys. Gardez Openbeehive lié à localhost et laissez le proxy faire face à Internet.

## Paramètres côté Openbeehive

| Paramètre | Pourquoi |
| --- | --- |
| `BEEHIVE_PUBLIC_BASE_URL` | L'URL HTTPS publique, par exemple `https://bees.example.com`. Utilisée pour les redirections OIDC, les liens d'invitation et de vérification, et les valeurs par défaut des passkeys. |
| `BEEHIVE_ADDR` | `127.0.0.1:8080` ne lie que localhost, de sorte que l'application n'est joignable qu'à travers le proxy. |
| `BEEHIVE_TRUST_PROXY_HEADERS` | `true` derrière le proxy, afin que la limitation des tentatives de connexion compte la véritable adresse du client (la dernière entrée de `X-Forwarded-For`) au lieu de celle du proxy. Uniquement avec exactement un proxy en amont et un port du serveur inaccessible autrement : un client pouvant atteindre le port directement pourrait falsifier l'en-tête. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Uniquement lorsque l'application web est servie depuis une origine différente de l'API. Sinon, laissez-le vide (même origine). |

Rien d'autre n'est requis. L'application web communique avec le serveur par des requêtes HTTP ordinaires (Connect-RPC) : il n'y a donc aucun WebSocket à mettre à niveau. Le serveur limite chaque requête à 2 minutes (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`) et un message RPC à 16 MiB ; gardez la limite de taille de corps du proxy à 16 MiB ou plus (nginx : `client_max_body_size 16m;`). Deux requêtes peuvent durer plus longtemps : le flux `Subscribe` facultatif de l'API, qui est exempté de ces délais, et l'export serveur `GET /export`, qui peut prendre jusqu'à 30 minutes. Si votre proxy limite la durée totale d'une réponse, accordez au moins 30 minutes à `/export`.

### En-têtes envoyés par le serveur

Le serveur ajoute ses propres en-têtes de sécurité à chaque réponse : `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, une `Content-Security-Policy` qui autorise l'origine propre de l'application ainsi que les origines configurées pour les tuiles de carte et la recherche d'adresse, et `Strict-Transport-Security` lorsque `BEEHIVE_PUBLIC_BASE_URL` commence par `https://`. N'ajoutez pas une seconde Content-Security-Policy dans le proxy ; les navigateurs appliquent les deux et l'application peut cesser de se charger.

## Caddy

Caddy obtient et renouvelle automatiquement les certificats Let's Encrypt.

```text title="Caddyfile"
bees.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

Rechargez avec `caddy reload` (ou `systemctl reload caddy`) ; Caddy récupère un certificat à la première requête. Pour laisser passer aussi les clients gRPC, transmettez le HTTP/2 en clair au backend : `reverse_proxy h2c://127.0.0.1:8080`.

## nginx

nginx ne gère pas les certificats lui-même ; associez-le à certbot (`certbot --nginx`).

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

Testez et rechargez :

```bash
nginx -t && systemctl reload nginx
```

`$proxy_add_x_forwarded_for` ajoute l'adresse du client comme dernière entrée, celle que le serveur lit avec `BEEHIVE_TRUST_PROXY_HEADERS=true`. `proxy_pass` parle HTTP/1.1 au backend, ce qui suffit à l'application web. Les clients gRPC ont besoin de HTTP/2 de bout en bout ; pour eux, ajoutez un `location` distinct avec `grpc_pass grpc://127.0.0.1:8080;`.

## Origines distinctes (application sur un hôte différent)

La plupart des auto-hébergeurs servent l'application web et l'API depuis un seul domaine avec `BEEHIVE_SERVE_WEB=true`. Si la PWA s'exécute sur une origine distincte, le navigateur bloque les requêtes cross-origin sauf si cette origine est autorisée :

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Listez plusieurs origines séparées par des virgules. `*` autorise n'importe quelle origine, mais jamais avec des identifiants ; il ne fonctionne donc pas pour une application connectée.

L'application séparée doit aussi être servie par un serveur web séparé. L'application web que sert ce serveur s'exécute sous une Content-Security-Policy avec `connect-src 'self'` : une version compilée qui pointe vers une autre adresse d'API (`BEEHIVE_API_URL` à la compilation) est donc bloquée lorsqu'elle est servie d'ici.

## Liste de contrôle

- `BEEHIVE_PUBLIC_BASE_URL` est l'URL `https://` publique.
- TLS est en place : automatique avec Caddy, via certbot avec nginx.
- `BEEHIVE_TRUST_PROXY_HEADERS=true`, et le port du serveur n'est joignable qu'à travers le proxy.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` n'est défini que si l'application est sur une origine différente.
- Les étiquettes QR encodent l'adresse depuis laquelle elles ont été imprimées ; réimprimez-les après un changement de domaine.

Pour les options serveur, voir [Configuration](./configuration.md).
