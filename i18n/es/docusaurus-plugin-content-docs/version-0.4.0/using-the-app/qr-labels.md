---
sidebar_position: 9
title: "Etiquetas QR"
---

# Etiquetas QR

Una etiqueta QR convierte una colmena en un atajo de un solo toque. Pega una etiqueta en el techo o la cámara de cría, apunta tu teléfono hacia ella y Openbeehive se abre en la ficha de esa colmena. Sin recorrer listas en el colmenar, sin forzar la vista para leer números escritos a mano bajo la lluvia.

## Qué contiene el código QR

El código de cada colmena codifica un único enlace profundo a esa colmena:

```text
<base>/h/<hiveId>
```

`<base>` es la dirección en la que usas la aplicación (`https://app.openbeehive.org` en el servicio alojado, tu propia URL en una instancia autoalojada) y `<hiveId>` es el identificador de la colmena. La etiqueta también imprime un código corto de seis caracteres derivado del id, para distinguir las etiquetas a simple vista.

El código no contiene datos de abejas ni información personal; es solo un enlace. A quien lo escanee sin acceso se le pide que inicie sesión, y solo ve la colmena si es miembro del espacio (tenant) que la contiene.

Una vez instalada la aplicación, el enlace abre la colmena desde tu base de datos local, así que funciona sin cobertura.

## Imprimir una etiqueta para una colmena

1. Abre la colmena.
2. Toca la acción **QR** (el icono de cuadrado punteado junto a Editar y Mover). Aparece una tarjeta con el código, el nombre de la colmena y el código corto.
3. Toca **Imprimir**. Se abre una etiqueta limpia en una ventana nueva, seguida del diálogo de impresión. **SVG** descarga el código como archivo, para tus propios diseños de etiqueta.
4. Imprime en papel de etiquetas o papel normal y fíjala a la colmena.

:::tip Haz que dure a la intemperie
Imprime en papel de etiqueta resistente a la intemperie o de vinilo, o cubre una etiqueta de papel con cinta de embalar transparente o una funda de plastificar. Colócala donde no la rocen las alzas al levantarlas y ponerlas: el lateral de la cámara de cría o bajo el borde del techo.
:::

## Imprimir una hoja para un colmenar

1. Abre el colmenar.
2. Toca **Etiquetas QR**.
3. Se abre una hoja A4 con un código etiquetado por cada colmena de ese colmenar, seguida del diálogo de impresión.
4. Imprime, recorta y aplica.

## Escanear una etiqueta

### Con la cámara de tu teléfono

La mayoría de los teléfonos reconocen los códigos QR en la aplicación de cámara integrada. Apunta la cámara a la etiqueta, toca el enlace que aparece y Openbeehive se abre en la colmena. Esto funciona para cualquiera con acceso, sin abrir antes la aplicación.

### Con el escáner integrado en la aplicación

**Escanear**, en la navegación, abre el escáner propio de Openbeehive, útil cuando ya estás en la aplicación y te mueves entre colmenas.

1. Abre **Escanear** y concede permiso de cámara la primera vez.
2. Apunta al código QR de la colmena; la colmena se abre en cuanto se reconoce.

En dispositivos cuyo navegador no admite el escáner integrado, la pantalla lo indica y sugiere usar la aplicación de cámara habitual.

## Si un escaneo no abre la colmena correcta

| Síntoma | Causa probable | Qué hacer |
| --- | --- | --- |
| La cámara no enfoca el código | Etiqueta húmeda, descolorida o curvada | Sécala; reimprímela si está desgastada |
| El enlace abre pero dice "Colmena no encontrada" | La colmena se eliminó, o pertenece a otro espacio | Comprueba que la colmena sigue existiendo y que está activo el espacio correcto |
| Te pide iniciar sesión | No has iniciado sesión en este dispositivo, o la colmena está en un espacio del que no eres miembro | Inicia sesión; pide al admin del espacio que te invite |
| No pasa nada al tocar | El teléfono no reconoció el código como un enlace | Usa el escáner integrado u otro lector de QR |

El acceso sigue la pertenencia al espacio; consulta [Cuentas y espacios](/using-the-app/accounts-tenants).

## Reimprimir y cambiar etiquetas

Las etiquetas nunca caducan. El enlace sigue siendo válido durante toda la vida de la ficha de la colmena. Si retiras una caja pero mantienes la colonia como la misma colmena en Openbeehive, la etiqueta antigua sigue funcionando. Si inicias una ficha de colmena nueva, imprime una etiqueta nueva.

Las etiquetas codifican la dirección desde la que las imprimiste. Si tu instancia autoalojada se muda a un dominio nuevo, reimprime.

:::caution
No traslades una etiqueta impresa de una caja a otra esperando que apunte a la nueva colonia; seguirá abriendo la colmena original. Imprime una etiqueta nueva.
:::

Detalles técnicos del formato del enlace: [Códigos QR para desarrolladores](/developers/qr-codes).
