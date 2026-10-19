---
sidebar_position: 1
title: "API-Überblick"
---

# Die Openbeehive-API

Openbeehive ist **API-first und offen**. Es gibt kein verstecktes Backend: Alles,
was die App tut — Bienenstände anlegen, Durchsichten erfassen, Geräte
synchronisieren, Statistiken lesen — läuft über eine einzige, öffentliche
**Connect-RPC**-API. Derselbe Vertrag, der die App antreibt, steht auch Ihnen zur
Verfügung.

Diese Offenheit ist bewusst gewählt. Ihre Aufzeichnungen gehören Ihnen, deshalb
sollten Sie sie lesen, mit Skripten verarbeiten, aus eigenen Sensoren speisen und
anderswohin verschieben können, ohne jemanden um Erlaubnis zu fragen.

## Ein Vertrag, zwei Protokolle

Die API wird einmal als [Protocol Buffers](https://protobuf.dev/)-Vertrag
definiert und mit [Connect-RPC](https://connectrpc.com/) bereitgestellt. Das
bedeutet, **jeder Endpunkt ist auf zwei Wegen erreichbar**, von derselben URL:

| Stil | Am besten geeignet für | Seite |
| --- | --- | --- |
| **HTTP + JSON** (REST-artig) | curl, Skripte, Webhooks, Mikrocontroller, schnelle Integrationen | [REST / HTTP + JSON](/using-the-api/rest) |
| **gRPC / gRPC-Web / Connect** | typisierte Clients, Streaming, Synchronisierung mit hohem Volumen | [gRPC](/using-the-api/grpc) |

Sie wählen das Protokoll nicht auf dem Server — Sie wählen es pro Anfrage, über
die Header, die Sie senden. Nehmen Sie das, was für Ihr Werkzeug einfacher ist.

## Basis-URL

Die API wird vom selben Prozess bereitgestellt, der auch die App ausliefert:

- Gehosteter Dienst: `https://app.openbeehive.org`
- Selbst gehostet: Ihr eigener Ursprung, z. B. `https://bees.example.com` (siehe
  [Self-hosting](/category/self-hosting))

Jede Methode liegt unter einem vorhersehbaren Pfad:

```
POST <base-url>/openbeehive.v1.<Service>/<Method>
```

Zum Beispiel: `https://app.openbeehive.org/openbeehive.v1.ApiaryService/ListApiaries`.

## Dienste

Der Vertrag ist in Dienste gegliedert. Jeder bildet einen Teil der Domäne ab, die
Sie bereits aus der App kennen:

| Dienst | Was er abdeckt |
| --- | --- |
| `ApiaryService` | Bienenstände anlegen, lesen, aktualisieren, löschen und auflisten |
| `HiveService` | Bienenstöcke, einschließlich Umsetzen eines Stocks zwischen Bienenständen |
| `QueenService` | Königinnen und ihre Weisel-Historie |
| `InspectionService` | Durchsichten / Besuche (inkl. Temperatur & Luftfeuchtigkeit), Upload-URLs für Fotos |
| `TreatmentService` | Behandlungen / das Bestandsbuch (Produkt, Charge, Dosis, Wartezeit) |
| `TaskService` | Aufgaben und Erinnerungen |
| `EventService` | Der reine Anfüge-Ereignis- / Verlaufsfeed |
| `StatsService` | Dashboard-Summen und Honigstatistiken |
| `SyncService` | `Pull`, `Push` und ein streamendes `Subscribe` — die Offline-First-Synchronisierungs-Engine |

:::note Implementierungsstatus (v0.1.0)
`ApiaryService` und `SyncService` sind heute serverseitig vollständig
angebunden. Die übrigen Dienste sind im Vertrag definiert und folgen derselben
Struktur; sie werden gerade ausgearbeitet. Prüfen Sie den
[Vertrag](https://github.com/openbeehive-org/openbeehive-app/tree/main/proto)
für die aktuelle Quelle der Wahrheit und die
[Release Notes](https://github.com/openbeehive-org/openbeehive-app/releases) dafür, was
bereits live ist.
:::

## Authentifizierung

- **Selbst gehostet, einzelner Benutzer:** Wenn kein Login konfiguriert ist, ist
  die API für die Instanz offen (Sie sind der einzige Benutzer). Das ist die
  einfachste Einrichtung für Heimserver und Skripte. Siehe
  [Authentication](/self-hosting/authentication).
- **Mit aktiviertem Login / dem gehosteten Dienst:** Anfragen führen eine Sitzung
  mit sich, die über OIDC oder einen Passkey eingerichtet wurde. Senden Sie sie
  als Bearer-Token: `Authorization: Bearer <token>`. Programmatische API-Tokens
  für unbeaufsichtigte Clients (Skripte, Sensoren) stehen auf der Roadmap — bis
  dahin ist Self-Hosting im Einzelbenutzer-Modus der reibungslose Weg für
  Automatisierung.

## Wie die App selbst sie nutzt

Die App ist **Offline-First**: Sie schreibt zuerst in eine lokale Datenbank, und
die Synchronisierungs-Engine gleicht über `SyncService.Push` / `Pull` mit dem
Server ab. Die CRUD-Dienste (`ApiaryService`, `InspectionService`, …) sind die
serverautoritativen Einstiegspunkte für direkte Integrationen, Export und
Automatisierung. Beide Sichten liegen auf denselben Daten — siehe
[Offline & sync](/using-the-app/offline-and-sync) und die
[Entwickler-Architektur](/developers/architecture).

## Was Sie bauen können

- Ziehen Sie Ihre Daten in eine Tabellenkalkulation, ein Notebook oder ein
  BI-Dashboard.
- Skripten Sie Massenbearbeitungen oder Migrationen aus einem anderen
  Imkereiwerkzeug.
- Speisen Sie Messwerte aus **automatisierten Trackern** — Stockwaagen,
  Temperatur- und Luftfeuchtigkeitssensoren — direkt in Durchsichten ein. Siehe
  [Automatisierte Tracker](/using-the-api/automated-trackers).
- Bauen Sie Ihren eigenen Client, Bot oder Mobil-Widget gegen einen stabilen,
  typisierten Vertrag.

Bereit für die Details? Beginnen Sie mit [REST / HTTP + JSON](/using-the-api/rest).
