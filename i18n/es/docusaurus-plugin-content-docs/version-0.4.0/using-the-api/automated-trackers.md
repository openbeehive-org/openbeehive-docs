---
sidebar_position: 4
title: "Rastreadores automáticos"
---

# Rastreadores automáticos y sensores

Una báscula de colmena, una sonda de temperatura del nido de cría o un sensor
de humedad pueden publicar sus lecturas en Openbeehive a través de
`InspectionService.CreateInspection`. Cada lectura se convierte en una fila de
inspección de la colmena, se sincroniza con todos los dispositivos como una
visita introducida a mano y alimenta los gráficos de **Evolución** de la
colmena. Esta página describe qué hace realmente el servidor con esas lecturas
y cómo publicarlas desde un script.

## Qué es una lectura

No hay una tabla de sensores aparte. Una lectura es una inspección con solo los
campos de medición rellenados:

| Campo JSON | Significado | Unidad |
| --- | --- | --- |
| `weightKg` | Peso de la colmena | kg |
| `tempHive` | Temperatura dentro de la colmena | °C |
| `tempOutside` | Temperatura exterior | °C |
| `humidityHive` | Humedad relativa dentro de la colmena | % |
| `humidityOutside` | Humedad relativa exterior | % |
| `note` | Texto libre, por ejemplo el nombre del dispositivo | |

Envía solo lo que mide tu dispositivo. El servidor almacena los campos que
omites como `0`; los gráficos de Evolución solo dibujan valores por encima de
cero, pero el resumen de la visita en la aplicación muestra una temperatura de
`0` como un `0 °C` medido, así que no envíes un campo de temperatura que no
hayas medido.

En el servidor la lectura sigue el mismo camino que una visita registrada en la
aplicación: la fila se marca con el colmenar y la reina reinante en su `date`,
se escribe un evento `INSPECTION` y el cambio se añade al registro de
sincronización con tu cuenta como autor. Consulta la
[visión general de la API](./overview.md#writes-go-through-sync).

## Qué hace la aplicación con ella

- La lectura aparece en el registro de visitas y en los gráficos de la colmena
  tras la siguiente sincronización del dispositivo (la aplicación sincroniza
  cada 15 segundos mientras está abierta, y tras cada escritura local).
- Cuenta como la última inspección de la colmena. El panel **Inspecciones
  pendientes** del resumen y `StatsService.GetDashboard` calculan los "días
  desde la última visita" a partir de la fila de inspección más reciente, así
  que una colmena que informa a diario nunca aparece como pendiente, aunque
  nadie la haya abierto en semanas.
- Cada lectura es una visita en el registro. Una lectura cada minuto produce
  1440 visitas al día y deja fuera de la vista las entradas escritas a mano.

Publica como mucho unas pocas lecturas al día, o agrega en el dispositivo y
publica un valor diario. Pon el nombre del dispositivo en `note` para que las
lecturas de máquina se distingan fácilmente de tus propias visitas. Las
cadencias de 15 minutos o más finas pertenecen a tu propio almacén de series
temporales, no al registro de visitas.

## Autenticarse desde un script

Da a cada dispositivo su propia clave API (consulta
[Autenticación](./overview.md#authentication)):

1. En la aplicación, cambia al espacio al que pertenece la colmena y abre
   **Ajustes → Claves API**.
2. Nombra la clave según el dispositivo (por ejemplo `scale-01`), deja los
   permisos en **Lectura y escritura** (un sensor crea inspecciones, algo
   que una clave de **Solo lectura** no puede hacer) y elige si caduca, y
   después toca **Crear clave**. Copia el valor `obhk_...`; se muestra una
   sola vez.
3. Guárdala en el dispositivo y envíala como `Authorization: Bearer obhk_...`
   en cada llamada.

La clave actúa como tú dentro de ese espacio y funciona con cualquier método
de inicio de sesión (contraseña, OIDC o passkeys). Caduca solo si elegiste
una caducidad (**30 días**, **90 días** o **1 año**); una clave caducada
recibe `unauthenticated` (HTTP 401) en cada llamada hasta que crees una
nueva. Ajustes muestra cuándo se usó por última vez cada clave. Cuando
retires el dispositivo, toca **Eliminar** junto a su clave; la siguiente
llamada desde él devuelve `unauthenticated`. La clave también deja de
funcionar si abandonas el espacio. Usa una clave de **Solo lectura** para
todo lo que solo lea, como un panel o un script de exportación; recibe
`permission_denied` en `CreateInspection` y en cualquier otra escritura.

Dos casos no necesitan clave o no pueden usar una:

- **Instancia sin inicio de sesión** (autoalojada, sin contraseña, OIDC ni
  WebAuthn configurados): cada solicitud se ejecuta como el usuario local. No
  envíes cabecera. La sección de claves API no existe ahí.
- **Inicio de sesión como alternativa**: con el inicio de sesión por
  contraseña habilitado, `POST /auth/signin` con `email` y `password`
  devuelve un `token` de sesión que puedes enviar de la misma manera. Caduca
  tras `BEEHIVE_SESSION_TTL` (por defecto `720h`, 30 días), así que el script
  tiene que iniciar sesión de nuevo al recibir `unauthenticated`. Es
  preferible una clave.

La cuenta de demostración es de solo lectura y no puede crear claves;
`CreateInspection` devuelve `permission_denied` en ella.

## Encontrar el id de la colmena

`hiveId` es el UUID de la colmena, el mismo que está codificado en su
[etiqueta QR](/using-the-app/qr-labels). Búscalo una vez y guárdalo en el
dispositivo:

```bash
curl -s -X POST "$OB/openbeehive.v1.ApiaryService/ListApiaries" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" -d '{}'

curl -s -X POST "$OB/openbeehive.v1.HiveService/ListHives" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '{"apiaryId":"2b1f6c0e-..."}'
```

Ambos devuelven `id` y `name` por fila. Mantén un `hiveId` estable por sensor;
si la colmena se traslada a otro colmenar en la aplicación, el id no cambia.

## Ejemplo: publicar una lectura

```bash
#!/usr/bin/env bash
# Post one reading for one hive. Run it from cron a few times a day.
set -eu
OB="https://bees.example.com"
HIVE="c41a..."
# The API key from Settings -> API keys, stored once on the device.
TOKEN=$(cat /etc/openbeehive-key)

body=$(printf '{"hiveId":"%s","weightKg":%s,"tempHive":%s,"humidityHive":%s,"note":"scale-01"}' \
  "$HIVE" "$(read_sensor weight)" "$(read_sensor brood_temp)" "$(read_sensor brood_rh)")

curl -fsS -X POST "$OB/openbeehive.v1.InspectionService/CreateInspection" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d "$body"
```

`read_sensor` representa lo que sea que lea tu hardware. Una clave sin
caducidad no necesita renovación; una salida distinta de cero con HTTP 401
significa que la clave fue eliminada o ha caducado. En una instancia sin
inicio de sesión quita la cabecera `Authorization`. La misma solicitud en
Python:

```python
import json, urllib.request

OB = "https://bees.example.com"
TOKEN = open("/etc/openbeehive-key").read().strip()  # obhk_...

def create_inspection(hive_id, **fields):
    body = json.dumps({"hiveId": hive_id, **fields}).encode()
    req = urllib.request.Request(
        f"{OB}/openbeehive.v1.InspectionService/CreateInspection", data=body,
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req) as res:
        return json.load(res)["inspection"]

create_inspection("c41a...", weightKg=42.5, tempHive=34.2, humidityHive=58, note="scale-01")
```

Para poner una fecha anterior a una lectura (por ejemplo cuando el dispositivo
la guardó en búfer mientras estaba sin conexión), envía `date` como cadena
RFC 3339. El servidor resuelve el colmenar y la reina para esa fecha.

## Buenas prácticas

- **Guarda en búfer sin conexión.** Encola las lecturas en el dispositivo y
  publícalas con su `date` original cuando el servidor vuelva a estar
  accesible.
- **Una colmena por sensor.** No publiques la misma lectura en varias colmenas.
- **Cuida las unidades.** Temperatura en °C, humedad de 0 a 100, peso en kg.
- **Limpia los datos de prueba.** `ListInspections` con tu `hiveId` y
  `DeleteInspection` eliminan lecturas; la eliminación también se sincroniza
  con los dispositivos.
