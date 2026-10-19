---
sidebar_position: 13
title: "Konten & Mandanten"
---

# Konten & Mandanten

Wie du dich anmeldest, hängt davon ab, wie die Instanz eingerichtet ist. Eine einzeln betriebene, selbst gehostete Instanz braucht unter Umständen gar keine Anmeldung; eine gemeinsam genutzte Instanz (wie der gehostete Dienst) gibt jedem ein eigenes Konto und organisiert Bienenstände in **Mandanten**, zwischen denen du wechseln kannst.

## Anmelden

Je nach Instanz bietet der Anmeldebildschirm eine oder mehrere der folgenden Möglichkeiten:

- **E-Mail & Passwort**: **Konto erstellen** mit Name, E-Mail-Adresse und Passwort, danach **Anmelden**.
- **Ein Anbieter** (Google, Keycloak, ...): **Weiter mit ...**.
- **Ein Passkey**: **Mit Passkey anmelden** per Fingerabdruck, Gesicht, Geräte-PIN oder Sicherheitsschlüssel. Passkeys fügst du nach der Anmeldung unter **Einstellungen → Passkeys** hinzu.
- **Die Demo**: **Demo erkunden** auf Instanzen, die eine betreiben.

Auf einer Einzelbenutzer-Instanz ohne konfigurierte Anmeldung öffnet die App direkt deine Aufzeichnungen.

Die Methoden gehören zu einem Konto: Wenn du dich mit E-Mail und Passwort registriert hast und dich später mit einem Anbieter anmeldest, der dieselbe E-Mail-Adresse meldet, werden die beiden verknüpft.

Wenn die Instanz eine E-Mail-Bestätigung verlangt, erhältst du nach der Registrierung einen Bestätigungslink per E-Mail. Öffne ihn vor deiner ersten Anmeldung.

:::note Wer der Admin ist
Der Instanz-Administrator ist nicht die erste Person, die sich registriert. Auf einer selbst gehosteten Instanz ist es das Konto, das der Betreiber mit `BEEHIVE_ADMIN_EMAIL` und `BEEHIVE_ADMIN_PASSWORD` konfiguriert (siehe [Authentifizierung](/self-hosting/authentication)); auf dem gehosteten Dienst ist es der Betreiber. Eine Registrierung vergibt diese Rolle nie.
:::

## Was ein Mandant ist

Ein **Mandant** ist eine Sammlung von Bienenständen, Beuten und Aufzeichnungen, die zusammengehören. Jedes Konto beginnt mit einem **persönlichen Mandanten**. Du kannst außerdem zu gemeinsamen Mandanten gehören, zum Beispiel einem Vereinsbienenstand, den mehrere Imker betreuen, einem Lehrbienenstand oder einem zweiten Betrieb, den du von deinen privaten Beuten getrennt hältst.

Alles, was du erfasst, liegt im **aktiven Mandanten**, und jedes Mitglied eines Mandanten sieht alles davon. Beim Wechsel des Mandanten ändert sich, welche Bienenstände, Beuten und Durchsichten du siehst. Eine feinere Freigabe gibt es nicht: Um manche Beuten zu teilen und andere nicht, legst du sie in getrennte Mandanten.

## Mandanten wechseln

Öffne **Einstellungen → Mandanten**. Jeder Mandant, zu dem du gehörst, ist mit deiner Rolle darin aufgeführt; der aktive ist markiert. Tippe auf einen anderen, um zu wechseln; die App lädt mit den Aufzeichnungen dieses Mandanten neu.

## Einen Mandanten erstellen

Gib unter **Einstellungen → Mandanten** einen Namen ein (zum Beispiel „Imkerverein") und tippe auf **Mandant erstellen**. Du wirst sein **Admin** und er wird dein aktiver Mandant.

## Rollen

| Rolle | Berechtigungen |
| --- | --- |
| **Admin** (Eigentümer des Mandanten) | Alles, was ein Mitglied kann, plus Personen einladen, offene Einladungen zurückziehen, API-Schlüssel von Mitgliedern entfernen und den Mandanten löschen. Wer einen Mandanten erstellt, ist sein Admin. |
| **Mitglied** | Mit allen Bienenständen, Beuten und Aufzeichnungen des Mandanten arbeiten. |

Die Rolle des Instanz-Administrators aus der Serverkonfiguration ist davon getrennt: Innerhalb eines Mandanten ist der Instanz-Administrator Admin oder Mitglied wie alle anderen.

## Imker einladen

Als Mandanten-Admin öffnest du **Einstellungen → Mandanten → Imker:in einladen**, gibst die E-Mail-Adresse der Person ein und tippst auf **Einladung senden**. Die App zeigt den Einladungslink mit einem Button **Link kopieren**; gib ihn direkt weiter. Wenn auf dem Server SMTP konfiguriert ist, wird derselbe Link zusätzlich per E-Mail verschickt. Eingeladene treten als Mitglieder bei.

Offene Einladungen sind unter **Offene Einladungen** mit eigenen Buttons **Link kopieren** und **Zurückziehen** aufgeführt. Eine Einladung verschwindet aus der Liste, sobald sie angenommen wurde.

## Eine Einladung annehmen

Der Einladungslink öffnet den Anmeldebildschirm mit dem Hinweis, dass du eingeladen wurdest.

- Wenn du noch kein Konto hast, erstelle eines. Auf einer Instanz mit Einladungspflicht muss die E-Mail-Adresse die sein, an die die Einladung ging.
- Wenn du schon ein Konto hast, melde dich an.

Sobald du angemeldet bist, nimmt die App dich in den Mandanten auf und wechselt dich hinein. Ab dann erscheint er in deinen eigenen **Einstellungen → Mandanten**.

## Einen Mandanten löschen

Ein Mandanten-Admin kann den Mandanten unter **Einstellungen → Mandanten → Gefahrenzone** löschen. Das entfernt den Mandanten mit allen Bienenständen, Beuten und Aufzeichnungen für jedes Mitglied und lässt sich nicht rückgängig machen.

## API-Schlüssel \{#api-keys}

Unter **Einstellungen → API-Schlüssel** erstellst du Zugangsdaten für Skripte und Geräte wie eine Stockwaage, die die [API](/using-the-api/overview) in deinem Namen nutzen. Der Bereich erscheint nur, wenn du angemeldet bist; eine Einzelbenutzer-Instanz ohne Anmeldung hat keine Schlüssel und braucht auch keine.

- Gib im Feld **Schlüssel benennen (z. B. Stockwaage)** einen Namen ein, wähle die Berechtigungen in der Auswahl **Berechtigungen** (**Lesen und Schreiben**, die Vorgabe, oder **Nur Lesen**) und die Laufzeit in der Auswahl **Läuft ab nach** (**Läuft nie ab**, die Vorgabe, **30 Tagen**, **90 Tagen** oder **1 Jahr**) und tippe auf **Schlüssel erstellen**. Der Schlüssel erscheint darunter mit dem Hinweis „Kopiere den Schlüssel jetzt. Er wird nur einmal angezeigt." und einem Button **Kopieren** (er zeigt kurz **Kopiert**). Was du jetzt nicht kopierst, ist weg; der Server behält nur einen Hash.
- Jeder Schlüssel ist mit seinem Namen aufgeführt (**Unbenannter Schlüssel**, wenn du das Feld leer gelassen hast), seinen ersten Zeichen, einem Badge **Lesen und Schreiben** oder **Nur Lesen**, **Erstellt**, dann **Läuft ab** und dem Datum, wenn du eine Laufzeit gesetzt hast (**Abgelaufen** und das Datum, in Rot, sobald dieser Tag vorbei ist), und, sobald ein Skript ihn verwendet hat, **Zuletzt verwendet**. Abgelaufene Schlüssel bleiben in der Liste, bis du sie entfernst.
- **Entfernen** zieht einen Schlüssel nach einer Bestätigung zurück („Diesen Schlüssel entfernen? Skripte, die ihn verwenden, funktionieren sofort nicht mehr.").

Als Mandanten-Admin siehst du unter deinen eigenen Schlüsseln außerdem **Schlüssel anderer Mitglieder** mit dem Hinweis „Als Mandanten-Admin kannst du den Schlüssel jedes Mitglieds entfernen, etwa wenn jemand ausscheidet oder ein Gerät verloren geht." Jede Zeile zeigt den Namen des Schlüssels, seine ersten Zeichen, sein Badge **Lesen und Schreiben** oder **Nur Lesen**, die E-Mail-Adresse des Besitzers und, sobald ein Skript ihn verwendet hat, **Zuletzt verwendet**. **Entfernen** fragt dort „Den Schlüssel dieses Mitglieds entfernen? Dessen Skripte funktionieren damit sofort nicht mehr." Die Liste umfasst nur den aktiven Mandanten und erscheint nur, wenn andere Mitglieder Schlüssel haben; Mitglieder können die Schlüssel der anderen weder sehen noch entfernen.

Ein Schlüssel handelt als du in dem Mandanten, der beim Erstellen aktiv war; wechsle also zuerst den Mandanten, wenn ein Gerät zu einem gemeinsamen Bienenstand gehört. Ein Schlüssel mit **Nur Lesen** kann nur lesen; Skripte, die schreiben, brauchen **Lesen und Schreiben**. Ein Schlüssel läuft nur ab, wenn du eine Laufzeit setzt; er funktioniert nicht mehr, wenn er abläuft, wenn du ihn entfernst oder wenn du diesen Mandanten verlässt. Das Demo-Konto kann keine Schlüssel erstellen. Wie ein Skript den Schlüssel sendet, steht unter [Authentifizierung](../using-the-api/overview.md#authentication).

## Die Demo

Manche Instanzen betreiben ein **Demo-Konto**. Solange du darin angemeldet bist, erinnert dich ein Banner daran, dass die Daten jede Stunde zurückgesetzt werden. Der Server lehnt Änderungen vom Demo-Konto ab, alles, was du eingibst, bleibt also nur auf deinem Gerät. Betreiber können sie über den [Demo-Modus](/self-hosting/demo) aktivieren.
