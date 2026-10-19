---
sidebar_position: 13
title: "Cuentas y espacios"
---

# Cuentas y espacios

La forma en que inicias sesión depende de cómo esté configurada la instancia. Una instancia autoalojada para una sola persona puede no necesitar inicio de sesión alguno; una instancia compartida (como el servicio alojado) da a cada persona una cuenta y organiza los colmenares en **espacios** (tenants) entre los que puedes alternar.

## Iniciar sesión

Según la instancia, la pantalla de inicio de sesión ofrece una o varias de estas opciones:

- **Correo y contraseña**: "Crear cuenta" con tu nombre, correo y contraseña, y después "Iniciar sesión".
- **Un proveedor** (Google, Keycloak, ...): "Continuar con ...".
- **Una passkey**: "Iniciar sesión con passkey" usando tu huella dactilar, tu rostro, el PIN del dispositivo o una llave de seguridad. Las passkeys se añaden en **Ajustes → Passkeys** una vez iniciada la sesión.
- **La demo**: "Explorar la demo" en las instancias que la ejecutan.

En una instancia de un solo usuario sin inicio de sesión configurado, la aplicación abre directamente tus registros.

Los métodos están vinculados a una sola cuenta: si te registraste con correo y contraseña y más tarde inicias sesión con un proveedor que informa del mismo correo, ambos se enlazan.

Si la instancia requiere verificación de correo, recibirás un enlace de confirmación por correo después de registrarte. Ábrelo antes de tu primer inicio de sesión.

:::note Quién es el administrador
El administrador de la instancia no es la primera persona que se registra. En una instancia autoalojada es la cuenta que el operador configura con `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD` (consulta [Autenticación](/self-hosting/authentication)); en el servicio alojado es el operador. El registro nunca concede ese rol.
:::

## Qué es un espacio

Un **espacio** es un conjunto de colmenares, colmenas y registros que pertenecen al mismo grupo. Cada cuenta comienza con un **espacio personal**. También puedes pertenecer a espacios compartidos, por ejemplo el colmenar de un club que varios apicultores atienden, un colmenar didáctico o una segunda explotación que mantienes separada de tus colmenas privadas.

Todo lo que registras reside en el **espacio activo**, y todos los miembros de un espacio lo ven todo. Cambiar de espacio cambia qué colmenares, colmenas y visitas ves. No hay compartición más fina: para compartir algunas colmenas pero no otras, ponlas en espacios separados.

## Cambiar de espacio

Abre **Ajustes → Espacios**. Se listan todos los espacios a los que perteneces junto con tu rol en cada uno; el activo aparece marcado. Toca otro para cambiar; la aplicación se recarga con los registros de ese espacio.

## Crear un espacio

En **Ajustes → Espacios**, escribe un nombre (por ejemplo "Club de apicultura") y toca **Crear espacio**. Te conviertes en su **Admin** y pasa a ser tu espacio activo.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **Admin** (propietario del espacio) | Todo lo que puede hacer un miembro, además de invitar a personas, revocar invitaciones pendientes, eliminar las claves API de los miembros y eliminar el espacio. Quien crea un espacio es su admin. |
| **Miembro** | Trabajar con todos los colmenares, colmenas y registros del espacio. |

El rol de administrador de la instancia definido en la configuración del servidor es independiente de estos: dentro de un espacio, el administrador de la instancia es admin o miembro como cualquier otra persona.

## Invitar apicultores

Como admin de un espacio, abre **Ajustes → Espacios → Invitar a un apicultor**, introduce la dirección de correo de la persona y toca **Enviar invitación**. La aplicación muestra el enlace de invitación con un botón **Copiar enlace**; compártelo directamente con ella. Si el servidor tiene SMTP configurado, el mismo enlace también se envía por correo. Las personas invitadas se unen como miembros.

Las invitaciones pendientes se listan en **Invitaciones pendientes**, cada una con sus propios botones **Copiar enlace** y **Revocar**. Una invitación desaparece de la lista en cuanto se acepta.

## Aceptar una invitación

El enlace de invitación abre la pantalla de inicio de sesión con un aviso de "Has recibido una invitación".

- Si aún no tienes cuenta, crea una. En una instancia solo por invitación, la dirección de correo debe ser aquella a la que se envió la invitación.
- Si ya tienes cuenta, inicia sesión.

En cuanto inicias sesión, la aplicación te une al espacio y lo activa. A partir de entonces aparece en tus propios **Ajustes → Espacios**.

## Eliminar un espacio

Un admin del espacio puede eliminarlo en **Ajustes → Espacios → Zona de peligro**. Esto elimina el espacio con todos sus colmenares, colmenas y registros para todos los miembros, y no se puede deshacer.

## Claves API \{#api-keys}

**Ajustes → Claves API** es donde creas credenciales para scripts y dispositivos, como una báscula de colmena, que usan la [API](/using-the-api/overview) en tu nombre. La sección aparece solo cuando has iniciado sesión; una instancia de un solo usuario sin inicio de sesión no tiene claves y no las necesita.

- Escribe un nombre en el campo **Nombra esta clave (p. ej. báscula de colmena)**, elige los permisos en el selector **Permisos** (**Lectura y escritura**, el valor predeterminado, o **Solo lectura**) y la duración en el selector **Caduca tras** (**No caduca**, el valor predeterminado, **30 días**, **90 días** o **1 año**), y después toca **Crear clave**. La clave aparece debajo con el aviso "Copia la clave ahora. Solo se muestra una vez." y un botón **Copiar** (que muestra **Copiada** durante un momento). Lo que no copies ahora se pierde; el servidor conserva solo un hash.
- Cada clave se lista con su nombre (**Clave sin nombre** si dejaste el campo vacío), sus primeros caracteres, una insignia **Lectura y escritura** o **Solo lectura**, **Creada**, después **Caduca** y la fecha cuando estableciste una duración (**Caducada** y la fecha, en rojo, una vez pasado ese día) y, una vez que un script la ha usado, **Último uso**. Las claves caducadas permanecen en la lista hasta que las eliminas.
- **Eliminar** revoca una clave tras una confirmación ("¿Eliminar esta clave? Los scripts que la usan dejan de funcionar de inmediato.").

Como admin de un espacio también ves **Claves de otros miembros** debajo de tus propias claves, con el aviso "Como administrador del espacio puedes eliminar la clave de cualquier miembro, por ejemplo cuando alguien se va o se pierde un dispositivo." Cada fila muestra el nombre de la clave, sus primeros caracteres, su insignia **Lectura y escritura** o **Solo lectura**, el correo del propietario y **Último uso** una vez que un script la ha usado. Allí, **Eliminar** pregunta "¿Eliminar la clave de este miembro? Sus scripts que la usan dejan de funcionar de inmediato." La lista abarca solo el espacio activo y aparece solo cuando otros miembros tienen claves; los miembros no pueden ver ni eliminar las claves de los demás.

Una clave actúa como tú en el espacio que estaba activo cuando la creaste, así que cambia primero de espacio cuando un dispositivo pertenece a un colmenar compartido. Una clave de **Solo lectura** solo puede leer; los scripts que escriben necesitan **Lectura y escritura**. Una clave caduca solo si estableces una duración; deja de funcionar cuando caduca, cuando la eliminas o cuando abandonas ese espacio. La cuenta de demostración no puede crear claves. Consulta [Autenticación](../using-the-api/overview.md#authentication) para saber cómo un script envía la clave.

## La demo

Algunas instancias ejecutan una **cuenta de demostración**. Mientras tienes la sesión iniciada en ella, un aviso te recuerda que los datos se restablecen cada hora. El servidor rechaza los cambios de la cuenta de demostración, así que todo lo que introduzcas se queda solo en tu dispositivo. Los operadores pueden habilitarla mediante el [Modo demostración](/self-hosting/demo).
