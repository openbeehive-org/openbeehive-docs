---
sidebar_position: 13
title: "Cuentas y espacios"
---

# Cuentas y espacios

La forma en que inicias sesión depende de cómo esté configurada la instancia. Una instancia autoalojada para una sola persona puede no necesitar inicio de sesión alguno; una instancia compartida (como el servicio alojado) da a cada persona una cuenta y organiza los colmenares en **espacios** entre los que puedes alternar.

## Iniciar sesión

Según la instancia, la pantalla de inicio de sesión ofrece una o varias de estas opciones:

- **Correo y contraseña**: "Crear cuenta" con tu nombre, correo y contraseña, y después "Iniciar sesión".
- **Un proveedor** (Google, Keycloak, ...): "Continuar con ...".
- **Una passkey**: "Iniciar sesión con passkey" usando tu huella dactilar, tu rostro, el PIN del dispositivo o una llave de seguridad. Las passkeys se añaden en **Ajustes → Cuenta → Passkeys** una vez iniciada la sesión.
- **La demo**: "Probar la demo" en las instancias que la ejecutan. No necesita cuenta.

En una instancia de un solo usuario sin inicio de sesión configurado, la aplicación abre directamente tus registros.

Los métodos están vinculados a una sola cuenta: si te registraste con correo y contraseña y más tarde inicias sesión con un proveedor que informa del mismo correo, ambos se enlazan, siempre que el proveedor confirme la dirección como verificada y la dirección de tu cuenta también esté verificada. En caso contrario, el inicio de sesión con el proveedor se rechaza y sigues iniciando sesión como lo hacías antes.

Tras demasiados intentos fallidos, la pantalla de inicio de sesión dice "Demasiados intentos. Espera unos minutos y vuelve a intentarlo." El bloqueo se levanta solo al cabo de 15 minutos como máximo.

Si la instancia requiere verificación de correo, recibirás un enlace de confirmación por correo después de registrarte. Ábrelo antes de tu primer inicio de sesión.

## Tu contraseña \{#password}

En **Ajustes → Cuenta → Contraseña** introduce la **Contraseña actual** y la nueva dos veces, y después toca **Cambiar contraseña**. Se cierra la sesión en tus otros dispositivos; en este sigue abierta.

Si la has olvidado, toca **¿Olvidaste tu contraseña?** en la pantalla de inicio de sesión e introduce tu dirección de correo. Si el servidor envía correos, recibirás un enlace válido durante una hora y de un solo uso; elige allí una contraseña nueva, y se cerrará tu sesión en todos los dispositivos. Si el servidor no envía correos, la página lo indica: pídeselo al administrador de la instancia, que puede crear en Ajustes un enlace de restablecimiento para tu cuenta y dártelo.

La contraseña del administrador de la instancia se define en la configuración del servidor y no se puede cambiar en la aplicación. Las cuentas que solo inician sesión con un proveedor o una passkey no tienen contraseña que cambiar.

## Cerrar sesión \{#signing-out}

**Ajustes → Cuenta → Cerrar sesión** cuenta primero los cambios de este dispositivo que aún no se han subido y te avisa de ellos. Los cambios sin enviar se quedan en el dispositivo y se suben cuando vuelves a iniciar sesión en él. En un dispositivo compartido, marca **Quitar también los datos de este dispositivo** para borrar del navegador los registros de este espacio y las fotos descargadas; todo lo que se sincronizó se conserva en tu cuenta. Los cambios sin enviar se pierden al quitar los datos, así que conéctate y espera antes a la sincronización.

Cada cuenta guarda sus propios datos locales en un dispositivo, por espacio. Cuando otra persona inicia sesión en el mismo navegador, aunque sea en el mismo espacio, obtiene su propia copia: no ve tus cambios sin enviar ni tus tareas personales, y nada tuyo se sube con su cuenta.

**Cerrar sesión en todas partes** cierra tu sesión en todos tus demás dispositivos, por ejemplo tras perder un teléfono. En este sigues con la sesión iniciada, y las claves API siguen funcionando.

:::note[Quién es el administrador]
El administrador de la instancia no es la primera persona que se registra. En una instancia autoalojada es la cuenta que el operador configura con `BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD` (consulta [Autenticación](../self-hosting/authentication.md)); en el servicio alojado es el operador. El registro nunca concede ese rol.
:::

## Qué es un espacio

Un **espacio** es un conjunto de colmenares, colmenas y registros que pertenecen al mismo grupo. Cada cuenta comienza con un **espacio personal**. También puedes pertenecer a espacios compartidos, por ejemplo el colmenar de un club que varios apicultores atienden, un colmenar didáctico o una segunda explotación que mantienes separada de tus colmenas privadas.

Todo lo que registras reside en el **espacio activo**, y todos los miembros de un espacio lo ven todo. Cambiar de espacio cambia qué colmenares, colmenas y visitas ves. No hay compartición más fina: para compartir algunas colmenas pero no otras, ponlas en espacios separados.

## Cambiar de espacio

Abre **Ajustes → Espacio**. Se listan todos los espacios a los que perteneces junto con tu rol en cada uno; el activo aparece marcado. Toca otro para cambiar; la aplicación se recarga con los registros de ese espacio.

## Crear un espacio

En **Ajustes → Espacio**, escribe un nombre (por ejemplo "Club de apicultura") y toca **Crear espacio**. Te conviertes en su **Admin** y pasa a ser tu espacio activo.

## Roles

| Rol | Qué puede hacer |
| --- | --- |
| **Admin** (propietario del espacio) | Todo lo que puede hacer un miembro, además de invitar a personas, revocar invitaciones pendientes, cambiar el rol de los miembros, quitar miembros, eliminar las claves API de los miembros y eliminar el espacio. Quien crea un espacio es su admin. |
| **Miembro** | Trabajar con todos los colmenares, colmenas y registros del espacio, ver quién más es miembro y salir del espacio. |

Un espacio puede tener varios admins y siempre conserva al menos uno: el último admin no puede salir ni pasar a ser miembro. Nombra antes admin a otra persona, o elimina el espacio.

El rol de administrador de la instancia definido en la configuración del servidor es independiente de estos: dentro de un espacio, el administrador de la instancia es admin o miembro como cualquier otra persona.

## Invitar apicultores

Como admin de un espacio, abre **Ajustes → Espacio → Invitar a un apicultor**, introduce la dirección de correo de la persona y toca **Enviar invitación**. La aplicación muestra el enlace de invitación con un botón **Copiar enlace**; compártelo directamente con ella. Si el servidor tiene SMTP configurado, el mismo enlace también se envía por correo. Las personas invitadas se unen como miembros.

Una invitación es válida durante 7 días y solo funciona para la dirección de correo para la que se emitió. Las invitaciones pendientes se listan en **Invitaciones pendientes**, cada una con sus propios botones **Copiar enlace** y **Revocar**. Una invitación desaparece de la lista en cuanto se acepta.

Invitar a una dirección que ya tiene una invitación pendiente la sustituye: la aplicación lo indica, el nuevo enlace es válido otros 7 días y el enlace antiguo deja de funcionar. A alguien que ya es miembro no se le puede invitar de nuevo.

## Aceptar una invitación

El enlace de invitación abre la pantalla de inicio de sesión, que nombra el espacio y la dirección para la que es la invitación, parcialmente oculta: "Te han invitado al espacio «Club de apicultura». Crea una cuenta o inicia sesión con j…@e….org."

- Si aún no tienes cuenta, crea una con la dirección de correo a la que se envió la invitación.
- Si ya tienes una cuenta con esa dirección, inicia sesión.

En cuanto inicias sesión, la aplicación te une al espacio y lo activa. A partir de entonces aparece en tus propios **Ajustes → Espacio**.

Si la invitación no se puede usar, la pantalla de inicio de sesión indica por qué y sigue abierta:

- con la sesión iniciada con otra dirección: "Esta invitación es para j…@e….org. Inicia sesión o crea una cuenta con esa dirección, o pide una invitación para esta."
- con más de 7 días: "Esta invitación ha caducado. Pide una nueva a la persona que te invitó."
- ya usada, revocada o con su espacio eliminado: "Esta invitación ya no es válida: ya se usó o se revocó, o el espacio se eliminó. Pide una nueva."

**Continuar sin unirse** te lleva entonces a la aplicación sin el espacio.

## Miembros \{#members}

**Ajustes → Espacio → Miembros** lista quién pertenece al espacio activo. Un admin ve la dirección de correo y el rol de cada miembro, puede cambiar el **Rol** (**Admin** o **Miembro**) y puede **Quitar** a un miembro. Un miembro quitado pierde el acceso de inmediato, también sus claves API; los registros que escribió se conservan. Sus tareas personales en este espacio se eliminan.

Cualquier miembro puede **Salir** de un espacio. Pierdes de inmediato el acceso a sus registros y necesitas una nueva invitación para volver. Si eres su único miembro, no hay nada de lo que salir; elimina el espacio en su lugar.

Si pierdes el acceso al espacio en el que estabas trabajando, la aplicación te lo indica y continúa en otro de tus espacios.

## Eliminar un espacio

Un admin del espacio puede eliminarlo en **Ajustes → Espacio → Zona de peligro**. Escribe el nombre del espacio para confirmar. Esto elimina el espacio con todos sus colmenares, colmenas, registros y fotos para todos los miembros, y no se puede deshacer.

## Eliminar tu cuenta \{#delete-account}

**Ajustes → Cuenta → Eliminar la cuenta** muestra qué haría la eliminación de tu cuenta antes de que la confirmes:

- Se eliminan tus datos de inicio de sesión, tus claves API y tus tareas personales.
- Los espacios en los que eres el único miembro se eliminan con todos sus registros y fotos.
- En los espacios que compartes, tus registros se conservan para los demás miembros, marcados como escritos por un usuario eliminado.
- Mientras seas el único admin de un espacio que tiene otros miembros, la cuenta no se puede eliminar. Nombra antes allí admin a otra persona, o elimina primero el espacio.

Confirma con tu contraseña o una passkey. Una cuenta sin ninguna de las dos debe haber iniciado sesión hace menos de 5 minutos; si no, la aplicación te pide que vuelvas a iniciar sesión. La eliminación no se puede deshacer. La cuenta del administrador de la instancia y la cuenta de demostración no se pueden eliminar en la aplicación.

## Claves API \{#api-keys}

**Ajustes → Espacio → Claves API** es donde creas credenciales para scripts y dispositivos, como una báscula de colmena, que usan la [API](../using-the-api/overview.md) en tu nombre. La sección aparece solo cuando has iniciado sesión; una instancia de un solo usuario sin inicio de sesión no tiene claves y no las necesita.

- Escribe un nombre en el campo **Nombra esta clave (p. ej. báscula de colmena)**, elige los permisos en el selector **Permisos** (**Lectura y escritura**, el valor predeterminado, o **Solo lectura**) y la duración en el selector **Caduca tras** (**No caduca**, el valor predeterminado, **30 días**, **90 días** o **1 año**), y después toca **Crear clave**. La clave aparece debajo con el aviso "Copia la clave ahora. Solo se muestra una vez." y un botón **Copiar** (que muestra **Copiada** durante un momento). Lo que no copies ahora se pierde; el servidor conserva solo un hash. En **Cómo usarla** la aplicación muestra la dirección a la que enviar las solicitudes y un ejemplo listo para usar que lista tus colmenas, con **Copiar ejemplo**.
- Cada clave se lista con su nombre (**Clave sin nombre** si dejaste el campo vacío), sus primeros caracteres, una insignia **Lectura y escritura** o **Solo lectura**, **Creada**, después **Caduca** y la fecha cuando estableciste una duración (**Caducada** y la fecha, en rojo, una vez pasado ese día) y, una vez que un script la ha usado, **Último uso**. Las claves caducadas permanecen en la lista hasta que las eliminas.
- **Eliminar** revoca una clave tras una confirmación ("¿Eliminar esta clave? Los scripts que la usan dejan de funcionar de inmediato.").

Como admin de un espacio también ves **Claves de otros miembros** debajo de tus propias claves, con el aviso "Como administrador del espacio puedes eliminar la clave de cualquier miembro, por ejemplo cuando alguien se va o se pierde un dispositivo." Cada fila muestra el nombre de la clave, sus primeros caracteres, su insignia **Lectura y escritura** o **Solo lectura**, el correo del propietario y **Último uso** una vez que un script la ha usado. Allí, **Eliminar** pregunta "¿Eliminar la clave de este miembro? Sus scripts que la usan dejan de funcionar de inmediato." La lista abarca solo el espacio activo y aparece solo cuando otros miembros tienen claves; los miembros no pueden ver ni eliminar las claves de los demás.

Una clave actúa como tú en el espacio que estaba activo cuando la creaste, así que cambia primero de espacio cuando un dispositivo pertenece a un colmenar compartido. Una clave de **Solo lectura** solo puede leer; los scripts que escriben necesitan **Lectura y escritura**. Una clave caduca solo si estableces una duración; deja de funcionar cuando caduca, cuando la eliminas o cuando sales de ese espacio o te quitan de él. La cuenta de demostración no puede crear claves. Consulta [Autenticación](../using-the-api/overview.md#authentication) para saber cómo un script envía la clave.

## La demo

Algunas instancias ejecutan una **cuenta de demostración**. Mientras tienes la sesión iniciada en ella, un aviso indica que la demo es de solo lectura y que nada de lo que cambies se guarda; los formularios de registro muestran una nota y un botón **Guardar** desactivado. Si aun así un cambio llega al servidor, la aplicación lo deshace y avisa de que no se ha guardado. La demo pública del proyecto es el botón **Probar la demo** en [app.openbeehive.org/login](https://app.openbeehive.org/login). Los operadores pueden habilitarla mediante el [Modo demo](../self-hosting/demo.md).
