---
sidebar_position: 7
title: "Autenticación"
---

# Autenticación

Openbeehive te permite elegir cuánta autenticación necesitas. Un apicultor en solitario que ejecuta el binario único en casa puede omitir el inicio de sesión por completo. Una instancia compartida puede usar cuentas integradas de correo y contraseña, passkeys, inicio de sesión a través de un proveedor de identidad, o una combinación.

## Elegir un modo

| Modo | Cuándo usarlo | Ajustes clave |
| --- | --- | --- |
| Sin inicio de sesión (un solo usuario) | Una persona, un servidor, en tu propio ordenador o en una red en la que confías | `BEEHIVE_PASSWORD_AUTH` desactivado (valor predeterminado de selfhost), `BEEHIVE_OIDC_PROVIDERS` vacío, `BEEHIVE_WEBAUTHN_ENABLED=false` |
| Correo y contraseña (cuentas en la aplicación) | Una instancia compartida sin proveedor de identidad externo | `BEEHIVE_PASSWORD_AUTH=true` (predeterminado para el perfil `cloud`) más `BEEHIVE_ADMIN_EMAIL` / `BEEHIVE_ADMIN_PASSWORD` |
| Passkeys (WebAuthn) | Inicio de sesión sin contraseña con la biometría del dispositivo o llaves de seguridad, añadido sobre otro método | `BEEHIVE_WEBAUTHN_ENABLED=true` más `BEEHIVE_WEBAUTHN_RP_*` |
| Proveedores OIDC | Ya tienes Google, Keycloak, Authentik o similar, o quieres un control centralizado de cuentas | `BEEHIVE_OIDC_PROVIDERS` más ajustes por proveedor |

Los métodos de inicio de sesión se combinan. La pantalla de inicio de sesión ofrece los que estén habilitados, y una misma cuenta funciona con todos ellos: iniciar sesión con un proveedor se asocia a una cuenta existente con la misma dirección de correo cuando ambas partes han verificado esa dirección (consulta el [Modo 4](#oidc-linking)).

Las primeras líneas del registro del servidor indican el modo en vigor: `auth: NO LOGIN (single-user mode): every request has full access to all data` o bien `auth: LOGIN REQUIRED (email+password, passkeys, OIDC:google)`.

Habilitar cualquier método de inicio de sesión también habilita los espacios y las invitaciones (Ajustes → Espacios); consulta [Cuentas y espacios](../using-the-app/accounts-tenants.md).

## Modo 1: un solo usuario, sin inicio de sesión

El valor predeterminado para una instancia `selfhost`. Deja las tres opciones desactivadas:

```bash
# BEEHIVE_PASSWORD_AUTH is off by default in the selfhost profile
BEEHIVE_OIDC_PROVIDERS=
BEEHIVE_WEBAUTHN_ENABLED=false
```

Sin ningún método de inicio de sesión habilitado, Openbeehive funciona como una instancia de un solo usuario bajo una identidad local fija y nunca muestra una pantalla de inicio de sesión.

Un servidor así solo responde a las solicitudes dirigidas a `localhost`, a una dirección IP o al host de `BEEHIVE_PUBLIC_BASE_URL`. Si lo abres con otro nombre, añade ese nombre a [`BEEHIVE_ALLOWED_HOSTS`](./configuration.md#allowed-hosts); la página `403` que recibes en caso contrario así lo indica.

:::caution
"Sin inicio de sesión" significa que cualquiera que pueda alcanzar el servidor puede leer y editar tus registros. Úsalo solo en `localhost` o en una red de confianza. Si tu instancia es accesible desde internet, habilita un método de inicio de sesión. El servidor registra una advertencia al arrancar cuando no hay inicio de sesión y `BEEHIVE_PUBLIC_BASE_URL` no es una dirección local.
:::

## Ajustes de sesión (obligatorios una vez habilitado cualquier inicio de sesión)

En cuanto un método de inicio de sesión está activo, el servidor emite tokens de sesión firmados y necesita un secreto de al menos 32 bytes. Sin él, o con uno más corto, el servidor se niega a arrancar e indica de qué ajuste se trata:

```bash
# Generate a strong random secret
openssl rand -base64 32
```

```bash
BEEHIVE_SESSION_SECRET=PUT_YOUR_GENERATED_SECRET_HERE
BEEHIVE_SESSION_TTL=720h
```

`BEEHIVE_SESSION_TTL` acepta una duración de Go (`720h` son 30 días, `24h` un día). Cuando expira, los usuarios vuelven a iniciar sesión.

Las sesiones pueden terminarse antes de que expiren. `POST /auth/logout-all` termina todas las demás sesiones de la cuenta que hace la llamada y le devuelve un token nuevo. El servidor también comprueba en cada solicitud que la cuenta sigue siendo miembro del espacio en el que trabaja. Ambas cosas surten efecto en unos 10 segundos.

:::danger
Mantén `BEEHIVE_SESSION_SECRET` en secreto y estable. Cualquiera que lo conozca puede falsificar sesiones. Si lo cambias, se cierra la sesión de todo el mundo. Nunca lo subas al control de versiones.
:::

Si sirves la aplicación a través de HTTPS mediante un proxy inverso, asegúrate de que `BEEHIVE_PUBLIC_BASE_URL` use `https://` para que los enlaces de redirección e invitación sean correctos. Consulta [Proxy inverso](./reverse-proxy.md).

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

### Limitación de intentos de inicio de sesión

Los inicios de sesión fallidos se cuentan por cuenta y por dirección del cliente: tras 10 fallos para una cuenta o 30 desde una misma dirección en 15 minutos, los intentos siguientes reciben HTTP `429` con una cabecera `Retry-After` hasta que pasen los 15 minutos. El inicio de sesión con passkey se limita por dirección de la misma manera.

Detrás de un proxy inverso, todas las solicitudes parecen venir del proxy. Establece ahí `BEEHIVE_TRUST_PROXY_HEADERS=true` para que el servidor cuente la dirección real del cliente, tomada de la última entrada de `X-Forwarded-For`. Hazlo solo con exactamente un proxy delante y con el puerto del servidor inaccesible por cualquier otra vía; consulta [Proxy inverso](./reverse-proxy.md).

### Instancias solo por invitación

Para impedir que desconocidos creen cuentas, establece `BEEHIVE_REGISTRATION=false`. El administrador viene del entorno, así que una instancia nueva siempre tiene uno. Todos los demás se unen mediante enlaces de invitación, que un admin de espacio emite desde Ajustes → Espacios. Una invitación es válida durante 7 días y solo funciona para la dirección de correo para la que se emitió. La pantalla de inicio de sesión muestra un aviso de que la instancia es solo por invitación; las cuentas existentes inician sesión con normalidad.

Cada cuenta nueva comienza con su propio [espacio](../using-the-app/accounts-tenants.md) personal. Solo la cuenta de administrador configurada lleva el rol de administrador de la instancia.

### Verificación de correo opcional

Por defecto, una cuenta nueva puede iniciar sesión de inmediato. Para exigir que la gente confirme primero su dirección de correo:

```bash
BEEHIVE_EMAIL_VERIFICATION=true
```

La verificación necesita un servidor de correo: con `BEEHIVE_EMAIL_VERIFICATION=true` y sin `BEEHIVE_SMTP_HOST` el servidor se niega a arrancar. Configura SMTP para que los correos de verificación e invitación se envíen:

```bash
BEEHIVE_SMTP_HOST=smtp.example.com
BEEHIVE_SMTP_PORT=587
BEEHIVE_SMTP_USER=postbox@example.com
BEEHIVE_SMTP_PASS=your-smtp-password
BEEHIVE_SMTP_FROM=Openbeehive <no-reply@example.com>
```

:::note
Los enlaces de invitación y de verificación nunca se escriben en el registro del servidor. Sin `BEEHIVE_SMTP_HOST` no se envía ningún correo de invitación; el admin que creó una invitación copia su enlace desde Ajustes → Espacios y lo hace llegar a su destinatario.
:::

### Cambiar y restablecer contraseñas \{#password-reset}

Los usuarios con la sesión iniciada cambian su contraseña en **Ajustes → Cuenta → Contraseña**; esto cierra su sesión en todos sus demás dispositivos. Quien ha olvidado la contraseña tiene dos formas de recuperarla, según haya o no correo:

- **Con `BEEHIVE_SMTP_HOST`**, "¿Olvidaste tu contraseña?" en la página de inicio de sesión envía por correo un enlace válido durante una hora y de un solo uso. La respuesta es la misma tenga o no cuenta la dirección. Las solicitudes se limitan igual que los inicios de sesión.
- **Sin correo**, la página indica que hay que pedírselo al administrador. El administrador de la instancia crea el enlace en **Ajustes → Restablecer la contraseña de un usuario** y lo entrega; los admins de un espacio no pueden hacerlo.

Establecer una contraseña nueva mediante un enlace cierra la sesión de la cuenta en todas partes. La contraseña del administrador de la instancia es la de `BEEHIVE_ADMIN_PASSWORD`: no se puede cambiar en la aplicación ni mediante un enlace de restablecimiento. La contraseña de la cuenta de demostración tampoco se puede cambiar.

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

### Cómo se asignan a las cuentas los inicios de sesión con proveedor \{#oidc-linking}

Cuando alguien inicia sesión a través de un proveedor, Openbeehive busca una cuenta ya vinculada a esa identidad del proveedor. Si no la hay, busca una cuenta con la misma dirección de correo y le asocia el inicio de sesión del proveedor, pero solo cuando el proveedor declara la dirección como verificada **y** la dirección de la cuenta existente está verificada. En caso contrario, el inicio de sesión se rechaza y la persona sigue iniciando sesión como lo hacía antes. Si no existe tal cuenta, se crea una nueva, salvo que el registro esté cerrado (`BEEHIVE_REGISTRATION=false`): las instancias solo por invitación no crean cuentas a través de un proveedor.

El administrador de la instancia sigue siendo la cuenta indicada en `BEEHIVE_ADMIN_EMAIL`, sea cual sea la forma en que inicie sesión.

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

## Cuentas \{#accounts}

Cada persona elimina su propia cuenta en **Ajustes → Eliminar la cuenta**. Los espacios en los que es el único miembro se eliminan con ella. Mientras sea el único admin de un espacio que tiene otros miembros, la eliminación se rechaza hasta que nombre admin a otra persona o elimine ese espacio. Sus registros en espacios compartidos se conservan, atribuidos a un usuario eliminado. La eliminación se confirma con la contraseña, una passkey o, en las cuentas que solo inician sesión a través de un proveedor, un inicio de sesión de hace menos de 5 minutos. El administrador de la instancia de `BEEHIVE_ADMIN_EMAIL` y la cuenta de demostración no se pueden eliminar en la aplicación.

Las direcciones de correo son únicas sin distinguir mayúsculas y minúsculas. Dos cuentas de versiones anteriores cuyas direcciones solo se diferencian en mayúsculas y minúsculas siguen funcionando, pero el inicio de sesión por correo, las invitaciones y los restablecimientos de contraseña solo llegan a una de ellas. El registro del servidor indica cada uno de estos pares en cada arranque; decide qué cuenta conserva la dirección y elimina la otra o asígnale otra dirección.

Los enlaces que un navegador abre como página (`/auth/verify` desde un correo de verificación, `/auth/login` y `/auth/callback` de un inicio de sesión con proveedor) redirigen el navegador a la página de inicio de sesión con un mensaje de error traducido cuando algo falla, en lugar de mostrar JSON.

## Activar el inicio de sesión en una instancia existente de un solo usuario \{#single-user-to-login}

Los registros creados sin inicio de sesión pertenecen a un espacio local fijo que ninguna cuenta puede ver. Cuando el servidor arranca con el inicio de sesión por correo y contraseña habilitado y encuentra registros así, los traslada al espacio del administrador de la instancia y anota en el registro del servidor cuántas filas ha movido. Las unidades y el idioma elegidos sin inicio de sesión pasan a ser los ajustes del administrador. Inicia sesión como administrador para verlos. El traslado ocurre una sola vez y no se puede deshacer volviendo a desactivar el inicio de sesión; haz antes una [copia de seguridad](./backups.md).

Dos cosas que conviene saber:

- Los cambios que un dispositivo no había sincronizado antes del cambio de modo se quedan en los datos locales antiguos de ese dispositivo y no se suben. Sincroniza todos los dispositivos antes de activar el inicio de sesión.
- Solo con OIDC o passkeys no hay administrador de la instancia. Los registros se quedan entonces donde están y el registro del servidor indica que establezcas `BEEHIVE_PASSWORD_AUTH=true` con `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD` para adoptarlos.

## Verificar tu configuración

Reinicia el servidor y carga la aplicación en un navegador:

1. **Sin inicio de sesión**, el Resumen se abre directamente.
2. Con un método de inicio de sesión habilitado, la pantalla de inicio de sesión ofrece cada método habilitado (y "Probar la demo" si la demo está activa).
3. Completa un inicio de sesión y confirma que llegas al Resumen y que los registros se sincronizan.

Si algo no funciona, revisa los registros del servidor y [Resolución de problemas](../knowledge-base/troubleshooting.md).
