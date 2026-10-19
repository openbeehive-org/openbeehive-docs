---
sidebar_position: 8
title: "Proxy inverso y TLS"
---

# Proxy inverso y TLS

Openbeehive escucha en HTTP plano (`BEEHIVE_ADDR`, `:8080` por defecto). Para cualquier despliegue al que accedan otras personas, pon delante un proxy inverso que termine el TLS y reenvíe el tráfico a la aplicación. Esta página muestra configuraciones funcionales para Caddy y nginx.

HTTPS es necesario para la PWA instalable, el escáner de QR basado en la cámara y las passkeys. Mantén Openbeehive enlazado a localhost y deja que el proxy dé la cara a internet.

## Ajustes en el lado de Openbeehive

| Ajuste | Por qué |
| --- | --- |
| `BEEHIVE_PUBLIC_BASE_URL` | La URL HTTPS pública, p. ej. `https://bees.example.com`. Se usa para las redirecciones OIDC, los enlaces de invitación y verificación, y los valores predeterminados de las passkeys. |
| `BEEHIVE_ADDR` | `127.0.0.1:8080` enlaza solo a localhost para que la aplicación sea accesible únicamente a través del proxy. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Solo cuando la aplicación web se sirve desde un origen distinto al de la API. De lo contrario, deja el valor por defecto. |

No se requiere nada más. La aplicación web habla con el servidor mediante solicitudes HTTP ordinarias (Connect-RPC), así que no hay WebSocket que actualizar ni flujo de larga duración que mantener abierto. Los tiempos de espera de lectura y escritura del propio servidor son `0` por defecto (sin límite) y no necesitan cambios.

## Caddy

Caddy obtiene y renueva certificados de Let's Encrypt automáticamente.

```text title="Caddyfile"
bees.example.com {
    encode zstd gzip
    reverse_proxy 127.0.0.1:8080
}
```

Recarga con `caddy reload` (o `systemctl reload caddy`); Caddy obtiene un certificado en la primera solicitud. Para dejar pasar también a los clientes gRPC, reenvía HTTP/2 en claro al backend: `reverse_proxy h2c://127.0.0.1:8080`.

## nginx

nginx no gestiona los certificados por sí mismo; emparéjalo con certbot (`certbot --nginx`).

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

Prueba y recarga:

```bash
nginx -t && systemctl reload nginx
```

`proxy_pass` habla HTTP/1.1 con el backend, que es todo lo que la aplicación web necesita. Los clientes gRPC necesitan HTTP/2 de extremo a extremo; para ellos añade un `location` aparte con `grpc_pass grpc://127.0.0.1:8080;`.

## Orígenes divididos (aplicación en un host distinto)

La mayoría de quienes se autoalojan sirven la aplicación web y la API desde un dominio con `BEEHIVE_SERVE_WEB=true`. Si la PWA se ejecuta en un origen separado, el navegador bloquea las solicitudes de origen cruzado a menos que ese origen esté permitido:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Enumera varios orígenes separados por comas. Evita `*` junto con `BEEHIVE_CORS_ALLOW_CREDENTIALS=true`; los navegadores rechazan esa combinación para solicitudes con credenciales.

## Lista de comprobación

- `BEEHIVE_PUBLIC_BASE_URL` es la URL pública `https://`.
- El TLS está en su lugar: automático con Caddy, mediante certbot con nginx.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` se establece solo si la aplicación está en un origen distinto.
- Las etiquetas QR codifican la dirección desde la que se imprimieron; reimprímelas tras un cambio de dominio.

Para las opciones del servidor, consulta [Configuración](/self-hosting/configuration).
