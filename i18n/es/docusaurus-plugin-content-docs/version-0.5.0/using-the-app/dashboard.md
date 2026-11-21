---
sidebar_position: 1
title: "El panel de control"
---

# El panel de control

El **Resumen** es la primera pantalla tras abrir la aplicación. Todo lo que muestra se lee de la base de datos local de tu dispositivo, así que se carga al instante con o sin cobertura.

El botón **+ Nuevo** de la cabecera abre un menú con **Nuevo colmenar**, **Nueva colmena** y **Nueva tarea**; cada opción te lleva a la lista correspondiente con el formulario abierto.

## Primeros pasos

Hasta que registres tu primera visita, el Resumen te recibe con "Te damos la bienvenida a Openbeehive" y una lista de comprobación **Primeros pasos** de tres pasos: **Crea un colmenar**, **Añade una colmena**, **Registra la primera inspección**. El paso que toca a continuación es un enlace al lugar adecuado; los pasos terminados aparecen marcados. La lista desaparece cuando los tres están hechos.

## Mosaicos de estadísticas

| Mosaico | Qué muestra |
| --- | --- |
| **Colmenares** | Número de colmenares en el espacio activo. |
| **Colmenas** | Número de colmenas. |
| **Reinas** | Reinas registradas actualmente al frente de una colonia. |
| **Tareas abiertas** | Tareas que aún no están marcadas como hechas. |
| **Miel esta temporada** | Total de miel cosechada en el año natural en curso, en kilogramos o libras según lo elegido en **Ajustes → Preferencias → Unidades**. |

Los mosaicos son solo recuentos; usa la navegación para abrir la sección correspondiente.

## Inspecciones pendientes

Una colmena está pendiente 10 días después de su última visita; el panel lo indica. Lista hasta cinco colmenas pendientes, primero las que llevan más tiempo sin visitar, con los días transcurridos desde la última inspección de cada una ("nunca" para las colmenas sin visitas). La insignia de cada colmena de la lista se resalta. Toca una colmena para abrirla y registrar una visita. Cuando hay más colmenas pendientes, **Ver las N colmenas pendientes** abre la lista de colmenas ordenada por última visita.

Solo cuentan las visitas que registró una persona. Las lecturas que un sensor o una báscula envían a través de la API no hacen que una colmena cuente como "inspeccionada", y las colonias con el estado **Perdida** o **Disuelta** se dejan fuera. Cuando ninguna colmena está pendiente, el panel indica "Todo al día — ¡bien hecho!", y cuando no hay colmenas, que no hay nada pendiente.

El intervalo de 10 días es fijo en la aplicación; `GetDashboard` de la API usa el mismo valor predeterminado y acepta `thresholdDays` para cambiarlo.

## Próximas tareas

Muestra hasta cinco tareas abiertas con sus fechas de vencimiento. Las tareas cuya fecha ya ha pasado se marcan como **Vencida**. Toca una tarea para ir a ella en la vista **Tareas**, donde la marcas como hecha; consulta [Tareas](./tasks.md).

## Cómo moverte

Los mismos destinos están disponibles en todas partes: **Resumen, Colmenares, Escanear, Colmenas, Tareas** y **Ajustes**.

- En el móvil, una **barra de pestañas inferior** contiene los seis, con etiquetas cortas que caben en pantallas estrechas.
- En escritorio o tableta, una **barra lateral** a la izquierda lista Resumen, Colmenares, Escanear, Colmenas y Tareas, con tu cuenta (correo y estado de sincronización) en la parte inferior enlazando a Ajustes.

## Ajustes \{#settings}

**Ajustes** muestra uno de cuatro grupos a la vez; los botones de la parte superior cambian entre ellos.

**Preferencias**

- **Idioma**: inglés, alemán, francés, español o italiano. La elección se guarda con tu cuenta y se aplica en todos tus dispositivos.
- **Apariencia**: **Sistema** (sigue el ajuste claro u oscuro del dispositivo), **Claro** u **Oscuro**. La elección se guarda solo en este dispositivo.
- **Unidades**: **Peso** en kilogramos o libras y **Temperatura** en Celsius o Fahrenheit, para mostrar e introducir valores. La elección se guarda con tu cuenta y se aplica en todos tus dispositivos y espacios. Mientras no elijas, la aplicación usa unidades métricas, salvo que tu navegador esté configurado en el idioma de la aplicación para una región que usa libras y Fahrenheit (por ejemplo, inglés, Estados Unidos). Los registros se guardan siempre en kilogramos y grados Celsius, y las exportaciones y la API siguen en el sistema métrico; consulta [Inspecciones](./inspections.md#units).

**Espacio** (en instancias con inicio de sesión)

- **Espacios**: cambiar, crear, invitar y gestionar miembros. Consulta [Cuentas y espacios](./accounts-tenants.md).
- **Claves API**: crear y eliminar claves para scripts y dispositivos. Consulta [Cuentas y espacios](./accounts-tenants.md#api-keys).
- **Zona de peligro**: eliminar el espacio (solo admins).

**Datos y sincro**

- **Problemas de sincronización**: los cambios que el servidor rechazó, con **Reintentar** y **Descartar**, y los cambios recibidos que no se pudieron aplicar. Consulta [Sin conexión y sincronización](./offline-and-sync.md#sync-problems).
- **Datos y copia de seguridad**: copias de seguridad, otros formatos de exportación, la copia del servidor e importación; consulta [Importar y exportar](./import-export.md).
- **Registro de tratamientos**: imprimir el registro de todo el espacio, de un colmenar o de un año; consulta [Tratamientos](./treatments.md#treatment-register).

**Cuenta** (en instancias con inicio de sesión)

- **Cuenta**: con qué cuenta has iniciado sesión, **Cerrar sesión**, **Contraseña** y **Cerrar sesión en todas partes**. Consulta [Cuentas y espacios](./accounts-tenants.md#password).
- **Passkeys**: añadir o eliminar passkeys (cuando el servidor las habilita).
- **Restablecer la contraseña de un usuario**: solo para el administrador de la instancia; consulta [Autenticación](../self-hosting/authentication.md#password-reset).
- **Eliminar la cuenta**: consulta [Cuentas y espacios](./accounts-tenants.md#delete-account).

En una instancia autoalojada de un solo usuario sin inicio de sesión no hay grupo Cuenta: **Preferencias** muestra una nota **Sin inicio de sesión** que explica el modo, y las unidades y el idioma se guardan para la identidad local.

## El estado de sincronización

Un indicador de estado en la parte superior de la página y junto a tu cuenta en la barra lateral muestra si tus cambios han llegado al servidor (**Sincronizado**, **Cambios pendientes de enviar**, **Sin conexión**, **Problemas de sincronización**, etc.); tócalo para ver el estado de la sincronización y **Sincronizar ahora**. Mientras estás sin conexión, una barra en la parte superior indica "Sin conexión: los cambios se guardan y se sincronizan más tarde." Sigue registrando exactamente igual que siempre; la sincronización se reanuda cuando vuelve la conexión. Consulta [Sin conexión y sincronización](./offline-and-sync.md#sync-status).
