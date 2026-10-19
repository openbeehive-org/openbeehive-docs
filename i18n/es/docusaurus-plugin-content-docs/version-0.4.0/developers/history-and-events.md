---
sidebar_position: 2
title: "Historial y eventos"
---

# Historial y eventos

Una colmena se mueve entre colmenares, una reina reina y es reemplazada, la
miel se retira un día concreto. Para que ese historial siga siendo correcto
después de que el mundo cambie, cada escritura de historial congela el contexto
que era cierto en ese momento. El código está en `app/src/lib/local/history.ts`.

## Los eventos congelan su contexto

La tabla `event` es append-only. Cada fila almacena, como columnas normales, el
`apiary_id`, `hive_id` y `queen_id` que aplicaban en la `date` del evento.
Mueve la colmena el mes que viene y la inspección de la semana pasada sigue
perteneciendo al colmenar antiguo; cambia la reina y una cosecha anterior sigue
atribuida a la reina que la produjo.

Las mismas filas sirven como tabla de hechos para las estadísticas: `amount_kg`
se copia en los eventos de cosecha, así que la miel por colmenar, por reina o
por año es un único `GROUP BY` sobre `event` sin joins.

## Historiales por intervalos

Dos tablas contienen intervalos semiabiertos `[start, end)`:

| Tabla | Intervalo | Significado |
| --- | --- | --- |
| `queen` | `[introduced_at, replaced_at)` | La reina encabeza la colonia desde su introducción hasta que es reemplazada. `replaced_at` es null mientras reina; `active` también está activado. |
| `placement` | `[start_at, end_at)` | La colmena está en `apiary_id` desde `start_at` hasta que se mueve. `end_at` es null para la ubicación actual. |

Los intervalos semiabiertos encajan sin solaparse: en un día de cambio coincide
exactamente una fila.

## resolveContext

Las entradas suelen tener fecha retroactiva (la visita del sábado introducida el
lunes), así que el contexto se resuelve para la fecha propia de la entrada, no
para el momento actual:

```ts
resolveContext(hiveId: string, date: string) -> { apiaryId, queenId }
```

Ejecuta dos consultas contra la base de datos local y recurre a los valores
actuales cuando ningún intervalo cubre la fecha:

```sql
-- Where the hive lived on the date (falls back to hive.apiary_id).
SELECT apiary_id FROM placement
WHERE hive_id = ? AND deleted = 0 AND start_at <= ?
  AND (end_at IS NULL OR end_at > ?)
ORDER BY start_at DESC LIMIT 1;

-- Who reigned on the date (falls back to the queen with active = 1).
SELECT id FROM queen
WHERE hive_id = ? AND deleted = 0 AND introduced_at <= ?
  AND (replaced_at IS NULL OR replaced_at > ?)
ORDER BY introduced_at DESC LIMIT 1;
```

## Funciones que escriben historial

| Función | Escribe |
| --- | --- |
| `createHive` | fila `hive`, un `placement` abierto, evento `CREATED` |
| `setQueen` | cierra la reina activa (`active = 0`, `replaced_at`), inserta la nueva, eventos `QUEEN_REPLACED` y `QUEEN_INTRODUCED` |
| `moveHive` | cierra el `placement` abierto, abre uno nuevo, actualiza `hive.apiary_id`, evento `MOVED` con `detail = {from, to}` |
| `recordHarvest` | fila `harvest` con `apiary_id` / `queen_id` congelados, evento `HARVEST` con `amount_kg` y `ref_id` |
| `recordTreatment` | fila `treatment` con contexto congelado, evento `TREATMENT` |
| `recordInspection` | fila `inspection`, evento `INSPECTION` |

`recordHarvest`, `recordTreatment` y `recordInspection` llaman primero a
`resolveContext`. Todas las escrituras pasan por `patch()` en
`app/src/lib/local/repo.ts`, así que aterrizan en la tabla local y en el outbox
de sincronización como cualquier otro cambio. Las filas de detalle (`harvest`,
`treatment`, `inspection`) son filas sincronizadas normales; solo `event` se
trata como append-only por convención. Nada en la aplicación edita ni elimina un
evento.

Los números de tipo de evento se listan en el [modelo de datos](/developers/data-model#event).

## Leer el historial

```ts
historyForHive(hiveId)     // SELECT * FROM event WHERE deleted = 0 AND hive_id = ?   ORDER BY date DESC
historyForApiary(apiaryId) // ... WHERE apiary_id = ?
historyForQueen(queenId)   // ... WHERE queen_id = ?
```

Estadísticas:

```sql
-- honeyByApiary
SELECT apiary_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY apiary_id ORDER BY kg DESC;

-- honeyByQueen
SELECT queen_id AS key, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY queen_id ORDER BY kg DESC;

-- honeyByYear
SELECT substr(date, 1, 4) AS year, SUM(amount_kg) AS kg
FROM event WHERE type = 7 AND deleted = 0
GROUP BY year ORDER BY year;
```

`type = 7` es `HARVEST`. Como las dimensiones están congeladas en la fila, no
hace falta ningún join con el estado actual.

## Sincronización

Las filas de `event` llevan `scope_id` (el id del colmenar) como columna y se
sincronizan como cualquier otra tabla, con last-writer-wins por campo. Como
cada evento tiene un UUID nuevo y nunca se edita, dos dispositivos que añaden
eventos sin conexión nunca tocan la misma fila y ambos conjuntos sobreviven.
Consulta el [protocolo de sincronización](/developers/sync-protocol).
