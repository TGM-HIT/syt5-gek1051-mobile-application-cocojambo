# Benutzer-Guide

Diese Seite richtet sich an **Endnutzer** der App. Keine Code-Kenntnisse nötig.

## Erster Start

Beim ersten Öffnen wirst du nach einem **Benutzernamen** gefragt. Dieser wird:
- Lokal im Browser gespeichert (localStorage)
- Mit einem zufälligen 4-stelligen Suffix ergänzt (z.B. `Max#a1b2`), damit mehrere Benutzer mit demselben Namen auseinandergehalten werden können
- In geteilten Listen als Mitglied-Eintrag verwendet

> **Hinweis:** Es gibt kein Passwort und keine Registrierung. Wer den Namen kennt, ist dieser Benutzer auf diesem Gerät.

## Listen verwalten

### Liste erstellen
1. Auf der Startseite **+ Neue Liste** antippen
2. Name (z.B. "Wocheneinkauf") und optional Kategorie (z.B. "Lebensmittel") eingeben
3. **Erstellen**

### Liste teilen
1. In der Liste auf das **Teilen-Symbol** tippen
2. Der **6-stellige Share-Code** wird angezeigt (z.B. `A3X9K2`), zusätzlich als **QR-Code**
3. Andere Nutzer können:
   - Den Code manuell eingeben (Startseite → **Liste beitreten**)
   - Den QR-Code mit ihrer App scannen

### Liste verlassen
- In der Liste auf **Verlassen** tippen
- Dein Benutzername wird aus den Mitgliedern entfernt
- **Achtung:** Wenn du die letzte Person in der Liste bist, wird die Liste inklusive aller Artikel gelöscht

### Liste löschen
- Über das Kontextmenü der Liste auf der Startseite — bestätigen via Modal

## Artikel

### Artikel hinzufügen
- **Manuell:** Button **+ Artikel** → Name, Menge, Einheit, optional Notiz
- **Barcode-Scan:** Scanner-Symbol → Kamera scannt Barcode → Produktname wird automatisch aus der **Open Food Facts**-Datenbank geholt
- **Aus Suchergebnissen:** Wenn ein Produkt bereits in einer anderen Liste oder deinem Verlauf existiert, erscheint es im Suchfeld und kann direkt übernommen werden

### Artikel bearbeiten
- Antippen öffnet das Bearbeitungs-Modal
- Preis kann manuell oder per **Preisschild-Scan** (OCR) gesetzt werden

### Artikel abhaken / ausblenden / löschen
- **Checkbox:** markiert den Artikel als erledigt
- **Ausblenden:** verschiebt in einen einklappbaren Bereich unten ("Ausgeblendet")
- **Wiederherstellen:** aus dem Ausgeblendet-Bereich zurück in die Liste
- **Endgültig löschen:** nur aus dem Ausgeblendet-Bereich möglich

## Scanner

### Barcode-Scanner
- Kamera-Berechtigung erforderlich
- Unterstützt EAN-13, UPC und weitere (via `@zxing/browser`)
- Nährwerte (kcal, Protein, Fett, Kohlenhydrate) werden aus Open Food Facts angezeigt
- **Wichtig:** Funktioniert nur über HTTPS (außer `localhost`)

### Preisschild-Scanner (OCR)
- Nutzt Google Vision API
- Fotografiere das Preisschild → App erkennt die wahrscheinlichste Preisangabe
- Preis wird mit Zeitstempel in der **Preis-Historie** gespeichert — so kannst du Preisveränderungen im Laufe der Zeit sehen

## Suche

- Suchfeld in der Listen-Ansicht
- Durchsucht in drei Kategorien:
  1. Artikel der aktuellen Liste
  2. Artikel anderer Listen
  3. Historische Artikel (bereits gelöschte)

## Dark Mode

- Toggle-Button in der Navigation
- Einstellung bleibt persistent über Browser-Sessions

## Offline-Nutzung

- Die App funktioniert **vollständig offline**
- Ein gelbes Banner oben zeigt an, wenn keine Internetverbindung besteht
- Alle Änderungen werden lokal gespeichert und **automatisch synchronisiert**, sobald die Verbindung zurück ist
- Kein Datenverlust bei Verbindungsabbruch

## Als App installieren (PWA)

- **Android/Chrome:** Browser-Menü → "Zum Startbildschirm hinzufügen"
- **iOS/Safari:** Teilen-Button → "Zum Home-Bildschirm"
- **Desktop/Chrome:** Install-Icon in der Adressleiste

Nach Installation verhält sich die App wie eine native App.

## FAQ

**Warum werden meine Listen nicht synchronisiert?**
→ Prüfe Internetverbindung. Bei Problemen siehe [Troubleshooting](Troubleshooting).

**Kann ich meinen Benutzernamen ändern?**
→ Ja, über die Profil-Einstellungen (Story #25).

**Was passiert mit meinen Daten bei Browser-Cache-Löschung?**
→ Die lokale Kopie (IndexedDB) wird gelöscht. Wenn die Liste aber noch auf CouchDB existiert und du beigetreten bist, kommen die Daten beim nächsten Login zurück.

**Ist die App kostenlos?**
→ Ja, keine Kosten, keine Registrierung, keine Werbung.
