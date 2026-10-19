---
sidebar_position: 11
title: "Die App installieren"
---

# Die App installieren

Openbeehive ist eine Progressive Web App (PWA). Das bedeutet, du brauchst keinen App
Store, keinen Download und kein Konto, nur um loszulegen. Du öffnest sie in deinem
Browser und fügst sie mit einem einzigen Tipp zu deinem Gerät hinzu, sodass sie sich wie
jede andere App verhält: ein eigenes Symbol, ein Vollbildfenster und volle
Offline-Unterstützung.

Das Installieren ist optional, aber empfohlen. Einmal installiert, startet die App
sofort, blendet die Browser-Adressleiste aus und hält deine Aufzeichnungen verfügbar,
selbst wenn du draußen am Bienenstand ohne Empfang bist.

## Was du durch das Installieren bekommst

- **Ein App-Symbol** auf deinem Startbildschirm oder in deinem App-Launcher.
- **Ein Vollbildfenster** ohne Browser-Bedienelemente, sodass mehr Platz für deine
  Beuten und Durchsichten bleibt.
- **Offline-Zugriff.** Deine Aufzeichnungen leben in einer lokalen Datenbank auf
  dem Gerät und synchronisieren im Hintergrund. Siehe [Offline und Synchronisation](/using-the-app/offline-and-sync).
- **Schnelles QR-Scannen.** Das [QR-Etikett](/using-the-app/qr-labels) einer Beute zu
  scannen öffnet diese Beute.

:::tip
Du kannst Openbeehive weiterhin in einem normalen Browser-Tab nutzen, ohne zu
installieren. Die Funktionen sind dieselben; das Installieren lässt es sich nur wie eine
native App anfühlen und ist im Feld praktischer.
:::

## Auf iPhone und iPad installieren (Safari)

1. Öffne **Safari** und gehe zu [app.openbeehive.org](https://app.openbeehive.org).
2. Tippe auf die Schaltfläche **Teilen** (das Quadrat mit einem nach oben weisenden Pfeil).
3. Scrolle nach unten und tippe auf **Zum Home-Bildschirm**.
4. Passe den Namen an, falls du möchtest, und tippe dann auf **Hinzufügen**.

Das Openbeehive-Symbol sitzt nun auf deinem Startbildschirm. Starte es von dort, um das
Vollbild- und Offline-Erlebnis zu erhalten.

:::note
Unter iOS liegt die Installationsoption in Safaris Teilen-Menü. Andere Browser auf
iPhone und iPad können keine Web-Apps installieren, nutze daher für diesen Schritt Safari.
:::

## Auf Android installieren (Chrome)

1. Öffne **Chrome** und gehe zu [app.openbeehive.org](https://app.openbeehive.org).
2. Tippe auf das **Menü** (drei Punkte) in der oberen rechten Ecke.
3. Tippe auf **App installieren** (oder **Zum Startbildschirm hinzufügen**).
4. Bestätige durch Tippen auf **Installieren**.

Du siehst möglicherweise auch eine Aufforderung oder ein Banner, das anbietet, Openbeehive
direkt zu installieren. Es anzutippen bewirkt dasselbe.

## Auf dem Desktop installieren (Chrome, Edge und andere)

In den meisten Desktop-Browsern erscheint ein Installationssymbol am rechten Ende der
Adressleiste, wenn du die App besuchst.

1. Gehe zu [app.openbeehive.org](https://app.openbeehive.org).
2. Klicke auf das **Installationssymbol** in der Adressleiste (es sieht oft aus wie ein
   kleiner Monitor oder ein nach unten weisender Pfeil in eine Ablage).
3. Klicke auf **Installieren**, um zu bestätigen.

Wenn du das Symbol nicht siehst, öffne das Browser-Menü und suche nach **Openbeehive
installieren** oder **Apps -> Diese Website als App installieren**. Die App öffnet sich dann in
ihrem eigenen Fenster und erscheint neben deinen anderen Anwendungen.

| Plattform | Browser | Wo die Installationsoption zu finden ist |
| --- | --- | --- |
| iOS / iPadOS | Safari | Teilen-Menü -> Zum Home-Bildschirm |
| Android | Chrome | Menü (drei Punkte) -> App installieren |
| Windows / Linux | Chrome / Edge | Installationssymbol in der Adressleiste |
| macOS | Chrome / Edge | Installationssymbol in der Adressleiste |
| macOS | Safari | Ablage -> Zum Dock hinzufügen |

## Eine selbst gehostete Instanz installieren

Wenn du deinen eigenen Openbeehive-Server betreibst, installiert sich die App auf genau
dieselbe Weise. Richte deinen Browser einfach auf die eigene Adresse deines Servers statt
auf den gehosteten Dienst und folge dann denselben Schritten oben für deine Plattform.

Öffne zum Beispiel deine Instanz unter ihrer `BEEHIVE_PUBLIC_BASE_URL` (etwa
`https://bees.example.com`) und nutze **Zum Home-Bildschirm** oder die Installationsoption
des Browsers. Die installierte App spricht dann mit deinem Server, und deine Aufzeichnungen
bleiben auf deiner eigenen Infrastruktur.

:::caution
Damit die Installation reibungslos funktioniert, sollte eine selbst gehostete Instanz über
**HTTPS** mit einem gültigen Zertifikat ausgeliefert werden. Die meisten Browser bieten die
PWA-Installation nur auf sicheren Ursprüngen an. Siehe [Reverse Proxy](/self-hosting/reverse-proxy)
dafür, wie du TLS vor deinen Server setzt.
:::

Wenn du selbst hostest, führt dich der Abschnitt [Selbst-Hosting](/category/self-hosting)
durch Bereitstellung, Konfiguration und Backups.

## Die App aktualisieren

Die PWA aktualisiert sich selbst. Wenn eine neue Version veröffentlicht wird, holt die App
sie im Hintergrund und wendet sie beim nächsten Start oder Neuladen an. Du musst nichts neu
installieren. Wenn du jemals sichergehen willst, dass du die neueste Version hast, schließe
die App vollständig und öffne sie wieder.

## Die App entfernen

Das Deinstallieren der PWA entfernt nur die App-Verknüpfung und ihren lokalen Cache; es
löscht keine Aufzeichnungen, die bereits zum Server synchronisiert wurden. Zum Deinstallieren:

- **iOS / Android:** drücke und halte das Symbol, dann wähle **Entfernen** oder
  **Deinstallieren**.
- **Desktop:** öffne die App, dann nutze ihr Fenstermenü (oder die App-Einstellungen des
  Browsers) und wähle **Deinstallieren**.

:::caution
Wenn du Aufzeichnungen hast, die beim Deinstallieren noch nicht synchronisiert wurden, leben
sie nur in der lokalen Datenbank des Geräts und können verloren gehen. Stelle sicher, dass die
App synchronisiert hat, bevor du sie entfernst. Siehe [Offline und Synchronisation](/using-the-app/offline-and-sync).
:::
