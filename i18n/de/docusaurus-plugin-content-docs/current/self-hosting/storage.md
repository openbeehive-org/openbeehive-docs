---
sidebar_position: 6
title: "Blob-Speicher"
---

# Blob-Speicher

Openbeehive speichert deine Aufzeichnungen in einer Datenbank, aber die Bilder von Fotos in voller Größe liegen separat im **Blob-Speicher**. Das hält die Datenbank schlank und ermöglicht es dir, den Bildspeicher unabhängig zu skalieren.

Ein Foto besteht aus zwei Teilen. Sein Eintrag mit einem kleinen Vorschaubild von etwa 200 Pixeln liegt in der Datenbank und synchronisiert wie jede andere Aufzeichnung auf alle Geräte. Sein Bild in voller Größe (höchstens 2048 Pixel an der längeren Kante und 5 MiB) liegt im Blob-Speicher unter einem Präfix pro Arbeitsbereich (`<workspace>/photos/...`). Der Server liefert es nur an angemeldete Mitglieder dieses Arbeitsbereichs aus, über `/photos/<id>`; der Blob-Speicher selbst wird nie offengelegt. Wird ein Foto gelöscht, wird sein Bild entfernt, und wird ein Arbeitsbereich gelöscht, wird alles unter seinem Präfix entfernt.

Du wählst ein Backend mit der Umgebungsvariablen `BEEHIVE_BLOB_BACKEND`. Es gibt zwei
Optionen: das lokale **Dateisystem** und einen **S3-kompatiblen** Objektspeicher wie
**MinIO**.

## Ein Backend wählen

| Backend | `BEEHIVE_BLOB_BACKEND` | Am besten für | Hinweise |
| --- | --- | --- | --- |
| Dateisystem | `fs` | Self-Hosting auf einem Server | Am einfachsten; keine zusätzlichen Dienste zu betreiben |
| MinIO / S3 | `minio` | Cloud, mehrere Server, größere Flotten | Skalierbar, langlebig, kann ausgelagert werden |

Eine gute Faustregel: Wenn du das **selfhost**-Profil auf einer Maschine betreibst, nutze das
Dateisystem. Wenn du das **cloud**-Profil betreibst oder erwartest zu wachsen, nutze
Objektspeicher.

:::note
Das Blob-Backend ist unabhängig von deinem Datenbanktreiber. Du kannst SQLite
mit MinIO koppeln oder PostgreSQL mit dem Dateisystem, in jeder Kombination, die zu
deinem Setup passt.
:::

## Dateisystem-Speicher

Dies ist der Standard für Self-Hosting. Fotos werden in ein Verzeichnis auf der Festplatte geschrieben.

```bash
BEEHIVE_BLOB_BACKEND=fs
BEEHIVE_BLOB_DIR=./data/blobs
```

`BEEHIVE_BLOB_DIR` ist der Ort, an dem Dateien gespeichert werden. Der Pfad ist relativ zum
Arbeitsverzeichnis des Serverprozesses, daher verwende für vorhersehbare Ergebnisse auf einem Server einen
absoluten Pfad wie `/var/lib/openbeehive/blobs`.

Der Server liefert dieses Verzeichnis nicht selbst aus, und auch sonst sollte es niemand tun: Bilder erreichen die App nur über den authentifizierten Endpunkt `/photos/`. Bis 0.4.x veröffentlichte der Server das Verzeichnis unter `/files/` und las `BEEHIVE_BLOB_PUBLIC_URL`; beides gibt es nicht mehr (der Server warnt beim Start, wenn die Einstellung noch gesetzt ist).

Der Server erstellt das Verzeichnis, falls es nicht existiert, aber stelle sicher, dass der Prozess
es besitzt und darin schreiben kann.

```bash
mkdir -p /var/lib/openbeehive/blobs
chown openbeehive:openbeehive /var/lib/openbeehive/blobs
```

:::caution Sichere es
Das Blob-Verzeichnis ist **nicht** in deiner Datenbank gespeichert. Ein Datenbank-Backup allein
wird deine Fotos nicht retten. Ein Backup besteht aus der Datenbank plus `BEEHIVE_BLOB_DIR`, und beide werden zusammen wiederhergestellt. Siehe
[Backups](./backups.md).
:::

### Docker-Hinweis

Wenn du das [Docker-Image](./docker.md) betreibst, hänge ein Volume ein, damit Blobs
Container-Neustarts und Upgrades überstehen. Der Container läuft als uid `65532`;
ein per Bind-Mount eingehängtes Host-Verzeichnis muss diesem Benutzer gehören:

```bash
docker run -d \
  -e BEEHIVE_BLOB_BACKEND=fs \
  -e BEEHIVE_BLOB_DIR=/data/blobs \
  -v openbeehive-blobs:/data/blobs \
  ghcr.io/openbeehive-org/openbeehive-app:latest
```

## MinIO-/S3-Speicher

Objektspeicher ist die richtige Wahl für das Cloud-Profil und für jeden, der
langlebigen, skalierbaren Fotospeicher möchte, der auf einer separaten Maschine oder einem
verwalteten Dienst liegen kann.

```bash
BEEHIVE_BLOB_BACKEND=minio
BEEHIVE_MINIO_ENDPOINT=play.min.io
BEEHIVE_MINIO_ACCESS_KEY=your-access-key
BEEHIVE_MINIO_SECRET_KEY=your-secret-key
BEEHIVE_MINIO_BUCKET=openbeehive
BEEHIVE_MINIO_USE_SSL=true
```

| Variable | Zweck |
| --- | --- |
| `BEEHIVE_MINIO_ENDPOINT` | Host (und optionaler Port) des Objektspeichers, ohne Schema |
| `BEEHIVE_MINIO_ACCESS_KEY` | Access-Key / Key-ID |
| `BEEHIVE_MINIO_SECRET_KEY` | Secret-Key |
| `BEEHIVE_MINIO_BUCKET` | Bucket, in dem Blobs gespeichert werden |
| `BEEHIVE_MINIO_USE_SSL` | `true`, um über HTTPS zu verbinden, `false` für reines HTTP |

:::tip Endpunkt-Format
Gib `BEEHIVE_MINIO_ENDPOINT` als Host an, optional mit einem Port, zum Beispiel
`minio.example.com` oder `minio.example.com:9000`. Füge kein `https://` hinzu.
Steuere das Schema stattdessen mit `BEEHIVE_MINIO_USE_SSL`.
:::

### Der Bucket

Beim Start prüft der Server, ob der in `BEEHIVE_MINIO_BUCKET` benannte Bucket existiert, und legt ihn andernfalls an. Mit Zugangsdaten, die Buckets erstellen dürfen, gibt es also nichts vorzubereiten. Sind deine Zugangsdaten auf einen bestehenden Bucket beschränkt, erstelle ihn vorher, zum Beispiel mit dem MinIO-Client:

```bash
mc alias set local https://minio.example.com:9000 ACCESS_KEY SECRET_KEY
mc mb local/openbeehive
```

:::caution Halte den Bucket privat
Blobs können identifizierende Fotos deiner Bienenstände enthalten. Mach den Bucket nicht
öffentlich lesbar. Openbeehive liefert Bilder nur an angemeldete Mitglieder des
Arbeitsbereichs aus, daher braucht der Objektspeicher keinen öffentlichen Zugriff.
:::

## S3-Kompatibilität

Das MinIO-Backend spricht die standardmäßige S3-API, sodass es mit jedem
S3-kompatiblen Anbieter funktioniert, nicht nur mit MinIO. Dazu gehören:

- **MinIO** (selbstgehosteter Objektspeicher)
- **Amazon S3**
- Andere S3-kompatible Dienste (zum Beispiel der S3-Endpunkt von Backblaze B2,
  Cloudflare R2, Wasabi oder Ceph RADOS Gateway)

Für diese zeige `BEEHIVE_MINIO_ENDPOINT` auf den S3-Endpunkt des Anbieters, setze den Access-
und Secret-Key, wähle deinen Bucket und setze `BEEHIVE_MINIO_USE_SSL=true`.

| Anbieter | Beispiel-Endpunkt |
| --- | --- |
| Amazon S3 | `s3.amazonaws.com` |
| Cloudflare R2 | `<account-id>.r2.cloudflarestorage.com` |
| Backblaze B2 | `s3.<region>.backblazeb2.com` |
| MinIO (Self-Host) | `minio.example.com:9000` |

:::note Regionen und Adressierung
Einige Anbieter reagieren empfindlich auf Regions-Einstellungen oder erfordern Path-Style- gegenüber
Virtual-Hosted-Adressierung. Wenn Uploads bei einem anderen Anbieter als MinIO fehlschlagen,
prüfe noch einmal den Endpunkt und dass der Bucket in der erwarteten Region existiert.
Siehe [Fehlerbehebung](../knowledge-base/troubleshooting.md), falls Probleme weiterhin bestehen.
:::

## Pflege \{#upkeep}

Der Server räumt den Blob-Speicher selbst auf; es gibt nichts zu planen:

- Das Bild eines gelöschten Fotos wird kurz nach dem Löschen entfernt.
- Fotos einer Durchsicht oder eines Bienenstocks, die vor mehr als einer Stunde gelöscht wurden, werden ebenfalls gelöscht.
- Beim Start und alle sechs Stunden werden Bilder entfernt, auf die kein Foto-Eintrag verweist und die älter als eine Stunde sind (zum Beispiel ein Upload, dessen Eintrag nie ankam, oder die Bilder eines gelöschten Arbeitsbereichs).

Das setzt eine einzelne Server-Instanz voraus: Betreibe genau eine pro Datenbank.

## Fotos aus 0.4.x \{#inline-photos}

Bis 0.4.x speicherte die App Fotos direkt in der Datenbank, als Data-URLs in den Zeilen der Durchsichten und Bienenstöcke. Beim ersten Start von 0.5.0 wandelt der Server jedes sichtbare eingebettete Foto in einen Foto-Eintrag mit Bild im Blob-Speicher um, bevor er Anfragen annimmt. Bei einer Datenbank mit vielen Fotos kann das einige Minuten dauern. Eine unterbrochene Umwandlung wird beim nächsten Start fortgesetzt.

Installierte 0.4.x-Apps funktionieren weiter: Der Server nimmt für sie weiterhin eingebettete Fotos an, liefert sie aus und wandelt um, was sie hochladen. Fotos, die aktualisierte Geräte hinzufügen, sehen sie nicht.

## Später Backends wechseln

Wenn du mit dem Dateisystem beginnst und später zu Objektspeicher wechselst, werden bestehende Fotos
nicht automatisch migriert. Plane, den Inhalt von `BEEHIVE_BLOB_DIR` in deinen
Bucket zu kopieren (zum Beispiel mit `mc cp --recursive` oder `aws s3 sync`), bevor du
`BEEHIVE_BLOB_BACKEND` umstellst, damit ältere Durchsichtsfotos verfügbar bleiben.
