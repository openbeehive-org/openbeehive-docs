---
sidebar_position: 7
title: "Autenticación"
---

# Autenticación

Openbeehive te permite elegir cuánta autenticación necesitas. Un apicultor en solitario que ejecuta el binario único en casa puede omitir el inicio de sesión por completo. Una instancia compartida puede usar cuentas integradas de correo y contraseña, passkeys, inicio de sesión a través de un proveedor de identidad, o una combinación.

## Elegir un modo

| Modo | Cuándo usarlo | Ajustes clave |
| --- | --- | --- |
| Sin inicio de sesión (un solo usuario) | Una persona, un servidor, en tu propia red o detrás de un proxy inverso de confianza | `BEEHIVE_PASSWORD_AUTH` desactivado (valor predeterminado de selfhost), `BEEHIVE_OIDC_PROVIDERS` vacío, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Correo y contraseña (cuentas en la aplicación) | Una instancia compartida sin proveedor de identidad externo | `BEEHIVE_PASSWORD_AUTH=true` (predeterminado para el perfil `cloud`) más `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Inicio de sesión sin contraseña con la biometría del dispositivo o llaves de seguridad, añadido sobre otro método | `BEEHIVE_WEBAUTHN_ENABLED=true` más `BEEHIVE_WEBAUTHN_RP_*` |
| Proveedores OIDC | Ya tienes Google, Keycloak, Authentik o similar, o quieres un control centralizado de cuentas | `BEEHIVE_OIDC_PROVIDERS` más ajustes por proveedor |

Los métodos de inicio de sesión se combinan. La pantalla de inicio de sesión ofrece los que estén habilitados, y una misma cuenta funciona con todos ellos: iniciar sesión con un proveedor se vincula a una cuenta de correo y contraseña existente con el mismo correo.

Habilitar cualquier método de inicio de sesión también habilita los espacios (tenants) y las invitaciones (Ajustes → Espacios); consulta [Cuentas y espacios](/using-the-app/accounts-tenants).

## Modo 1: un solo usuario, sin inicio de sesión

El valor predeterminado para una instancia `selfhost`. Deja las tres opciones desactivadas:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Sin ningún método de inicio de sesión habilitado, Openbeehive funciona como una instancia de un solo usuario bajo una identidad local fija y nunca muestra una pantalla de inicio de sesión.

:::caution
"Sin inicio de sesión" significa que cualquiera que pueda alcanzar el servidor puede leer y editar tus registros. Úsalo solo en una red de confianza, en `localhost`, o detrás de un proxy inverso que gestione el acceso por sí mismo. Si tu instancia es accesible desde internet, habilita un método de inicio de sesión.
:::

## Ajustes de sesión (obligatorios una vez habilitado cualquier inicio de sesión)

En cuanto un método de inicio de sesión está activo, el servidor emite tokens de sesión firmados y necesita un secreto:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` acepta una duración de Go (`720h` son 30 días, `24h` un día). Cuando expira, los usuarios vuelven a iniciar sesión.

:::danger
Mantén `BEEHIVE_SESSION_SECRET` en secreto y estable. Cualquiera que lo conozca puede falsificar sesiones. Si lo cambias, todas las sesiones existentes quedan invalidadas. Nunca lo subas al control de versiones.
:::

Si sirves la aplicación a través de HTTPS mediante un proxy inverso, asegúrate de que `BEEHIVE_PUBLIC_BASE_URL` use `https://` para que los enlaces de redirección e invitación sean correctos. Consulta [Proxy inverso](/self-hosting/reverse-proxy).

## Modo 2: correo y contraseña (cuentas en la aplicación)

```bash
BEEHIVE_PASSWORD_AUTH=true
```

Activado por defecto para el perfil `cloud`, desactivado para `selfhost`, e implícito con `BEEHIVE_DEMO=true`. La pantalla de inicio de sesión ofrece entonces "Iniciar sesión" y "Crear cuenta".

La autenticación por contraseña necesita un **administrador de la instancia** dedicado, configurado en el entorno en lugar de creado mediante el registro. El servidor se niega a arrancar sin él:

```bash
BEEHIVE_ADMIN_EMAIL=you@example.com
BEEHIVE_ADMIN_PASSWORD=at-least-eight-characters
```

El servidor garantiza esta cuenta en cada arranque: se crea si falta, su rol se fuerza a administrador y su contraseña se restablece al valor configurado. Esto último sirve también como recuperación de contraseña para el administrador: cambia la variable y reinicia. El registro nunca concede el rol de administrador, y el correo del administrador debe ser distinto del de la cuenta de demostración.

### Instancias solo por invitación

Para impedir que desconocidos creen cuentas, establece `BEEHIVE_REGISTRATION=false`. El administrador viene del entorno, así que una instancia nueva siempre tiene uno. Todos los demás se unen mediante enlaces de invitación, que un admin de espacio emite desde Ajustes → Espacios. El registro a través de un enlace de invitación debe usar la dirección de correo invitada. La pantalla de inicio de sesión muestra un aviso de que la instancia es solo por invitación; las cuentas existentes inician sesión con normalidad.

Cada cuenta nueva comienza con su propio [espacio](/using-the-app/accounts-tenants) personal. Solo la cuenta de administrador configurada lleva el rol de administrador de la instancia.

### Verificación de correo opcional

Por defecto, una cuenta nueva puede iniciar sesión de inmediato. Para exigir que la gente confirme primero su dirección de correo:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

Configura SMTP para que los correos de verificación e invitación se envíen:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Si `BEEHIVE_SMTP_HOST` está vacío, Openbeehive escribe los enlaces de verificación e invitación en el registro del servidor en lugar de enviarlos por correo. Los enlaces de invitación también se muestran en la aplicación al admin que los creó.
:::

## Modo 3: passkeys (WebAuthn)

Las passkeys permiten a la gente iniciar sesión con una huella dactilar, un escaneo facial, el PIN del dispositivo o una llave de seguridad de hardware.

```bash
BEEHIVE_WEBAUTHN_ENABLED=true
BEEHIVE_WEBAUTHN_RP_ID=beehive.example.com
BEEHIVE_WEBAUTHN_RP_ORIGINS=https://beehive.example.com
BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME=Openbeehive
```

- `BEEHIVE_WEBAUTHN_RP_ID` es el ID de la parte que confía (relying party): el dominio que visitan los usuarios, sin esquema ni puerto (por ejemplo `beehive.example.com`, o `localhost` para pruebas locales). Por defecto es el host de `BEEHIVE_PUBLIC_BASE_URL`. Las passkeys están vinculadas a este dominio.
- `BEEHIVE_WEBAUTHN_RP_ORIGINS` es el origen completo (u orígenes separados por comas) que envía el navegador, incluyendo esquema y puerto. Por defecto es `BEEHIVE_PUBLIC_BASE_URL`.
- `BEEHIVE_WEBAUTHN_RP_DISPLAY_NAME` es el nombre que se muestra en el aviso de passkey del navegador.

Una passkey se añade desde **Ajustes → Passkeys** con la sesión iniciada, así que la gente necesita primero otra forma de iniciar sesión (correo y contraseña o un proveedor). Después, la pantalla de inicio de sesión ofrece "Iniciar sesión con passkey".

:::caution
WebAuthn requiere un contexto seguro: HTTPS, o `http://localhost` para desarrollo. Coloca el servidor detrás de TLS antes de habilitar las passkeys en producción. El RP ID debe coincidir con el dominio de `BEEHIVE_PUBLIC_BASE_URL`.
:::

## Modo 4: proveedores OIDC

Conecta uno o más proveedores de identidad OpenID Connect. Enuméralos separados por comas y configura cada uno por su nombre.

```bash
BEEHIVE_OIDC_PROVIDERS=google,keycloak
BEEHIVE_OIDC_REDIRECT_URL=https://beehive.example.com/auth/callback
```

`BEEHIVE_OIDC_REDIRECT_URL` (por defecto `<BEEHIVE_PUBLIC_BASE_URL>/auth/callback`) es la dirección a la que el proveedor devuelve a los usuarios. Debe coincidir exactamente con lo que registres en el proveedor. Cada proveedor listado necesita un emisor (issuer) y un ID de cliente, o el servidor se niega a arrancar.

:::note Las cuentas se vinculan automáticamente
Cuando alguien inicia sesión a través de un proveedor, Openbeehive hace coincidir primero la identidad del proveedor, luego la dirección de correo (vinculando una cuenta de correo y contraseña existente) y, en caso contrario, crea una cuenta nueva. El administrador de la instancia sigue siendo la cuenta indicada en `BEEHIVE_ADMIN_EMAIL`, sea cual sea la forma en que inicie sesión.
:::

### Google

```bash
BEEHIVE_OIDC_GOOGLE_ISSUER=https://accounts.google.com
BEEHIVE_OIDC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
BEEHIVE_OIDC_GOOGLE_CLIENT_SECRET=your-client-secret
BEEHIVE_OIDC_GOOGLE_SCOPES=openid,email,profile
```

Crea el cliente en la Google Cloud Console en **APIs & Services → Credentials → OAuth client ID** (tipo: Web application).

### Keycloak y Authentik

Keycloak, Authentik y otros proveedores que cumplen los estándares usan las variables genéricas por proveedor. El nombre del proveedor en `BEEHIVE_OIDC_PROVIDERS`, en mayúsculas, es el prefijo de la variable.

```bash
BEEHIVE_OIDC_PROVIDERS=keycloak
BEEHIVE_OIDC_KEYCLOAK_ISSUER=https://id.example.com/realms/main
BEEHIVE_OIDC_KEYCLOAK_CLIENT_ID=openbeehive
BEEHIVE_OIDC_KEYCLOAK_CLIENT_SECRET=your-client-secret
```

El emisor es la URL base del realm; Openbeehive descubre el resto a partir de `<issuer>/.well-known/openid-configuration`. Authentik funciona de la misma manera, con la URL de configuración OpenID de su aplicación como emisor. Los scopes por defecto son `openid,profile,email`; anúlalos con `BEEHIVE_OIDC_<NAME>_SCOPES`.

### Registrar la URL de redirección en tu IdP

En la configuración del cliente del proveedor, añade una URI de redirección autorizada que coincida con `BEEHIVE_OIDC_REDIRECT_URL` carácter por carácter:

```text
https://beehive.example.com/auth/callback
```

Errores comunes: el esquema debe coincidir (`https` en producción), sin barra final a menos que tu valor la tenga, y usa tu dominio público en lugar de un nombre de host interno. Un error de "redirect mismatch" significa que los dos valores difieren en algún punto.

## Verificar tu configuración

Reinicia el servidor y carga la aplicación en un navegador:

1. **Sin inicio de sesión**, el Resumen se abre directamente.
2. Con un método de inicio de sesión habilitado, la pantalla de inicio de sesión ofrece cada método habilitado (y "Explorar la demo" si la demo está activa).
3. Completa un inicio de sesión y confirma que llegas al Resumen y que los registros se sincronizan.

Si algo no funciona, revisa los registros del servidor y [Resolución de problemas](/knowledge-base/troubleshooting).
