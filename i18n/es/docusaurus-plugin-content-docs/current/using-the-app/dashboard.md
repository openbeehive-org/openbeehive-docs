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
| **Miel esta temporada** | Total de kilogramos cosechados registrados en el año natural en curso. |

Los mosaicos son solo recuentos; usa la navegación para abrir la sección correspondiente.

## Inspecciones pendientes

Lista hasta cinco colmenas, primero las que llevan más tiempo sin visitar, con los días transcurridos desde la última inspección de cada una ("hoy", o "nunca" para las colmenas sin visitas). La insignia se resalta a partir de 21 días, o cuando no hay ninguna visita. Toca una colmena para abrirla y registrar una visita.

Solo cuentan las visitas que registró una persona. Las lecturas que un sensor o una báscula envían a través de la API no hacen que una colmena cuente como "inspeccionada", y las colonias con el estado **Perdida** o **Disuelta** se dejan fuera. Cuando no hay colmenas, el panel indica que no hay nada pendiente.

No hay un intervalo configurable: la lista se ordena por el tiempo transcurrido desde la última visita registrada.

## Próximas tareas

Muestra hasta cinco tareas abiertas con sus fechas de vencimiento. Las tareas cuya fecha ya ha pasado se marcan como **Vencida**. Toca una tarea para ir a ella en la vista **Tareas**, donde la marcas como hecha; consulta [Tareas](./tasks.md).

## Cómo moverte

Los mismos destinos están disponibles en todas partes: **Resumen, Colmenares, Escanear, Colmenas, Tareas** y **Ajustes**.

- En el móvil, una **barra de pestañas inferior** contiene los seis.
- En escritorio o tableta, una **barra lateral** a la izquierda lista Resumen, Colmenares, Escanear, Colmenas y Tareas, con tu cuenta (correo y estado de sincronización) en la parte inferior enlazando a Ajustes.

## Ajustes

**Ajustes** contiene:

- **Idioma**: inglés, alemán, francés, español, italiano. La elección se guarda en el dispositivo.
- **Apariencia**: **Sistema** (sigue el ajuste claro u oscuro del dispositivo), **Claro** u **Oscuro**. La elección se guarda en el dispositivo.
- **Espacios**: cambiar, crear, invitar y gestionar (en instancias con inicio de sesión). Consulta [Cuentas y espacios](./accounts-tenants.md).
- **Passkeys**: añadir o eliminar passkeys (cuando el servidor las habilita).
- **Claves API**: crear y eliminar claves para scripts y dispositivos (en instancias con inicio de sesión). Consulta [Cuentas y espacios](./accounts-tenants.md#api-keys).
- **Datos y copia de seguridad**: exportar e importar; consulta [Importar y exportar](./import-export.md).
- **Cuenta**: con qué cuenta has iniciado sesión, y **Cerrar sesión**.

En una instancia autoalojada de un solo usuario sin inicio de sesión no hay sesión que cerrar; el bloque de cuenta muestra la identidad local.

## El estado de sincronización

Un indicador de estado en la parte superior de la página y junto a tu cuenta en la barra lateral muestra si tus cambios han llegado al servidor (**Sincronizado**, **Pendientes de subir**, **Sin conexión**, **Problemas de sincronización**, etc.), y mientras estás sin conexión una barra en la parte superior indica "Sin conexión: los cambios se guardan y se sincronizan más tarde." Sigue registrando exactamente igual que siempre; la sincronización se reanuda cuando vuelve la conexión. Consulta [Sin conexión y sincronización](./offline-and-sync.md#sync-status).
