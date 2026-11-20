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
| `BEEHIVE_TRUST_PROXY_HEADERS` | `true` detrás del proxy, para que la limitación de intentos de inicio de sesión cuente la dirección real del cliente (la última entrada de `X-Forwarded-For`) en lugar de la del proxy. Solo con exactamente un proxy delante y con el puerto del servidor inaccesible por cualquier otra vía: un cliente que pueda alcanzar el puerto directamente podría falsificar la cabecera. |
| `BEEHIVE_CORS_ALLOWED_ORIGINS` | Solo cuando la aplicación web se sirve desde un origen distinto al de la API. De lo contrario, déjalo vacío (mismo origen). |

No se requiere nada más. La aplicación web habla con el servidor mediante solicitudes HTTP ordinarias (Connect-RPC), así que no hay WebSocket que actualizar. El servidor limita cada solicitud a 2 minutos (`BEEHIVE_HTTP_READ_TIMEOUT`, `BEEHIVE_HTTP_WRITE_TIMEOUT`) y cada mensaje RPC a 16 MiB; mantén el límite de tamaño del cuerpo del proxy en 16 MiB o más (nginx: `client_max_body_size 16m;`). La única solicitud de larga duración es el flujo opcional `Subscribe` de la API, que queda exento de los tiempos de espera.

### Cabeceras que envía el servidor

El servidor añade sus propias cabeceras de seguridad a cada respuesta: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, una `Content-Security-Policy` que permite el origen propio de la aplicación más los orígenes configurados de las teselas del mapa y de la búsqueda de direcciones, y `Strict-Transport-Security` cuando `BEEHIVE_PUBLIC_BASE_URL` empieza por `https://`. No añadas una segunda Content-Security-Policy en el proxy; los navegadores aplican ambas y la aplicación puede dejar de cargarse.

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

Prueba y recarga:

```bash
nginx -t && systemctl reload nginx
```

`$proxy_add_x_forwarded_for` añade la dirección del cliente como última entrada, que es la que lee el servidor con `BEEHIVE_TRUST_PROXY_HEADERS=true`. `proxy_pass` habla HTTP/1.1 con el backend, que es todo lo que la aplicación web necesita. Los clientes gRPC necesitan HTTP/2 de extremo a extremo; para ellos añade un `location` aparte con `grpc_pass grpc://127.0.0.1:8080;`.

## Orígenes divididos (aplicación en un host distinto)

La mayoría de quienes se autoalojan sirven la aplicación web y la API desde un dominio con `BEEHIVE_SERVE_WEB=true`. Si la PWA se ejecuta en un origen separado, el navegador bloquea las solicitudes de origen cruzado a menos que ese origen esté permitido:

```bash
BEEHIVE_PUBLIC_BASE_URL=https://api.example.com
BEEHIVE_CORS_ALLOWED_ORIGINS=https://app.example.com
BEEHIVE_CORS_ALLOW_CREDENTIALS=true
```

Enumera varios orígenes separados por comas. `*` permite cualquier origen, pero nunca con credenciales, así que no sirve para una aplicación con sesión iniciada.

La aplicación separada también debe servirla un servidor web aparte. La aplicación web que sirve este servidor se ejecuta bajo una Content-Security-Policy con `connect-src 'self'`, de modo que una compilación que apunte a otra dirección de la API (`BEEHIVE_API_URL` en tiempo de compilación) queda bloqueada cuando se sirve desde aquí.

## Lista de comprobación

- `BEEHIVE_PUBLIC_BASE_URL` es la URL pública `https://`.
- El TLS está en su lugar: automático con Caddy, mediante certbot con nginx.
- `BEEHIVE_TRUST_PROXY_HEADERS=true`, y el puerto del servidor solo es accesible a través del proxy.
- `BEEHIVE_CORS_ALLOWED_ORIGINS` se establece solo si la aplicación está en un origen distinto.
- Las etiquetas QR codifican la dirección desde la que se imprimieron; reimprímelas tras un cambio de dominio.

Para las opciones del servidor, consulta [Configuración](./configuration.md).
