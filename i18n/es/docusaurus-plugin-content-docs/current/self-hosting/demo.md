---
sidebar_position: 11
title: "Modo demo"
---

# Modo demo

El modo demo instala una **cuenta y un espacio de demostración** ya preparados
para que los visitantes puedan probar Openbeehive con datos realistas, sin tocar
los registros reales de nadie. Está **desactivado de forma predeterminada** y
pensado para exhibiciones públicas y pruebas.

:::note[¿Buscas la demo pública?]
La demo del propio proyecto es el botón **Probar la demo** en
[app.openbeehive.org/login](https://app.openbeehive.org/login). No hay un sitio
de demostración aparte. Esta página trata de cómo activar la demo en tu propia
instancia.
:::

## Qué configura

Cuando se activa, Openbeehive crea:

- una cuenta de demostración (`demo@app.openbeehive.org` / `demo` de forma
  predeterminada),
- un **espacio** de demostración con **15 colmenas repartidas en 4 colmenares**,
- una temporada de datos: reinas, 105 inspecciones (7 por colmena, repartidas a lo
  largo de los últimos diez meses, con temperatura, humedad, varroa, peso y más),
  una cosecha de miel y dos tratamientos contra la varroa por colmena.

Los datos se **vuelven a sembrar cada hora**, de modo que la exhibición siempre
luce igual. Las sesiones de demostración son de solo lectura: el servidor
rechaza cualquier cambio de la cuenta de demostración, y la aplicación deshace en
pantalla un cambio rechazado con un mensaje. Nada de lo que hace un visitante
llega al servidor ni a otros visitantes.

La pantalla de inicio de sesión recibe un botón **Probar la demo** junto al
inicio de sesión normal; inicia la sesión del visitante sin contraseña.

Cuando alguien ha iniciado sesión en la cuenta de demostración, la aplicación
muestra un **banner** que dice que la demo es de solo lectura y que nada de lo que
cambie se guarda. El cuadro de inicio de sesión dice lo mismo, y los formularios de
registro muestran una nota y un botón **Guardar** desactivado.

## Cómo activarlo

```bash
BEEHIVE_DEMO=true
```

Eso es todo lo que necesitas. Al activar el modo demo se habilita
automáticamente el [inicio de sesión con correo/contraseña](./authentication.md)
para que la cuenta de demostración pueda iniciar sesión. Opcionalmente, puedes
sobrescribir las credenciales:

```bash
BEEHIVE_DEMO_EMAIL=demo@app.openbeehive.org
BEEHIVE_DEMO_PASSWORD=demo
```

Reinicia el servidor. Verás una línea de registro que confirma que la demo se
instaló, y la cuenta de demostración podrá iniciar sesión de inmediato. Como el modo demo
implica la autenticación por contraseña, la instancia también necesita su administrador
dedicado (`BEEHIVE_ADMIN_EMAIL` y `BEEHIVE_ADMIN_PASSWORD`, consulta
[Autenticación](./authentication.md)), y el correo del administrador debe ser
distinto del correo de la demo. Como todo método de inicio de sesión, necesita
`BEEHIVE_SESSION_SECRET`.

`docker-compose.demo.yml` en el repositorio es el despliegue que hay detrás de
`app.openbeehive.org` (registro solo por invitación más la demo, accesible con el
botón **Probar la demo** de la página de inicio de sesión). No es una plantilla para tu propio servidor; parte de
[`docker-compose.prod.yml`](./docker.md#several-users) y añade `BEEHIVE_DEMO: "true"`
al entorno de su servicio `server` si quieres una demo.

### Hosts de demostración: saltarse la pantalla de inicio de sesión

En un host que solo existe para mostrar la demo puedes iniciar la sesión de los visitantes
automáticamente:

```bash
BEEHIVE_DEMO_AUTOLOGIN=true
```

Los visitantes anónimos entran directamente en el espacio de la demo en lugar de ver la
pantalla de inicio de sesión. Déjalo desactivado en una instancia que también sirva a usuarios
reales, para que vean la página de inicio de sesión normal con el botón de la demo.

## Cómo está aislado

- La demo vive en su **propio espacio**; el reinicio horario solo elimina y
  reconstruye los datos de la **demo**, nunca los de otros espacios.
- Los usuarios reales en la misma instancia no se ven afectados: tienen sus
  propios espacios.

:::caution
La cuenta de demostración es una cuenta real con la que se puede iniciar sesión.
En una instancia pública, elige una contraseña de demostración que te sientas
cómodo compartiendo, y no la reutilices en ningún otro lugar. Deja
`BEEHIVE_DEMO=false` en instancias privadas que no necesiten una exhibición.
:::

## Cómo desactivarlo

Establece `BEEHIVE_DEMO=false` (o elimínalo) y reinicia. Al arrancar, el servidor
bloquea entonces la cuenta de demostración: elimina su contraseña, sesiones, claves
API y passkeys, de modo que nadie puede iniciar sesión en ella, y el correo de la demo
sigue reservado y de solo lectura. Los datos de demostración existentes permanecen
hasta que los elimines. La cuenta y el espacio de
demostración tienen los id internos `demo-user` / `demo-tenant` por si quieres
eliminarlos de la base de datos.
