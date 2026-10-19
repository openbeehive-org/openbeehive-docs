---
sidebar_position: 1
title: "El panel de control"
---

# El panel de control

El **Resumen** es la primera pantalla tras abrir la aplicación. Todo lo que muestra se lee de la base de datos local de tu dispositivo, así que se carga al instante con o sin cobertura.

El botón **+ Nuevo** de la cabecera te lleva a la lista de Colmenares para crear un colmenar.

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

Lista hasta cinco colmenas, primero las que llevan más tiempo sin visitar, con los días transcurridos desde la última inspección de cada una ("nunca" para las colmenas sin visitas). La insignia se resalta a partir de 21 días, o cuando no hay ninguna visita. Toca una colmena para abrirla y registrar una visita. Cuando no hay colmenas, el panel dice "Todo al día".

No hay un intervalo configurable: la lista se ordena por el tiempo transcurrido desde la última visita registrada.

## Próximas tareas

Muestra hasta cinco tareas abiertas con sus fechas de vencimiento. Las tareas cuya fecha ya ha pasado se marcan con **!**. Marca las tareas como hechas en la vista **Tareas**; consulta [Tareas](/using-the-app/tasks).

## Cómo moverte

Los mismos destinos están disponibles en todas partes: **Resumen, Colmenares, Escanear, Colmenas, Tareas** y **Ajustes**.

- En el móvil, una **barra de pestañas inferior** contiene los seis.
- En escritorio o tableta, una **barra lateral** a la izquierda lista Resumen, Colmenares, Escanear, Colmenas y Tareas, con tu cuenta (correo y estado de conexión) en la parte inferior enlazando a Ajustes.

## Ajustes

**Ajustes** contiene:

- **Idioma**: inglés, alemán, francés, español, italiano. La elección se guarda en el dispositivo.
- **Espacios**: cambiar, crear, invitar y gestionar (en instancias con inicio de sesión). Consulta [Cuentas y espacios](/using-the-app/accounts-tenants).
- **Passkeys**: añadir o eliminar passkeys (cuando el servidor las habilita).
- **Claves API**: crear y eliminar claves para scripts y dispositivos (en instancias con inicio de sesión). Consulta [Cuentas y espacios](./accounts-tenants.md#api-keys).
- **Datos y copia de seguridad**: exportar e importar; consulta [Importar y exportar](/using-the-app/import-export).
- **Cuenta**: con qué cuenta has iniciado sesión, y **Cerrar sesión**.

En una instancia autoalojada de un solo usuario sin inicio de sesión no hay sesión que cerrar; el bloque de cuenta muestra la identidad local.

## El indicador de conexión/sin conexión

La barra lateral muestra **En línea** o **Sin conexión** junto a tu cuenta, y mientras estás sin conexión una barra en la parte superior indica "Sin conexión: los cambios se guardan y se sincronizan más tarde". Sigue registrando exactamente igual que siempre; la sincronización se reanuda cuando vuelve la conexión. Consulta [Sin conexión y sincronización](/using-the-app/offline-and-sync).
