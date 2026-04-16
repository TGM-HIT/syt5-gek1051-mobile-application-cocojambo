# Troubleshooting

Häufige Probleme und Lösungen — sowohl für Endnutzer als auch für Entwickler.

## Sync / CouchDB

### "Meine Änderungen erscheinen nicht auf dem anderen Gerät"

**Checkliste:**

1. **Internet auf beiden Geräten?** Das gelbe Offline-Banner sollte verschwunden sein.
2. **Beide Geräte haben den gleichen `VITE_COUCHDB_HOST` konfiguriert?**
3. **CouchDB läuft?**
   ```bash
   docker compose ps
   curl http://<HOST>:5984
   # → {"couchdb":"Welcome", ...}
   ```
4. **CORS konfiguriert?** → siehe `couchdb/local.ini`
5. **Bist du der Liste beigetreten?** Nur dann wird sie synchronisiert.

### "CORS-Error im Browser-Console"

```
Access to fetch at 'http://...:5984' has been blocked by CORS policy
```

**Lösung:**
1. `couchdb/local.ini` prüfen (siehe [Deployment](Deployment))
2. CouchDB-Container neu starten: `docker compose restart couchdb`
3. Browser-Cache leeren (harter Reload: Strg+Shift+R)

### "ERR_CONNECTION_REFUSED bei Sync"

- `VITE_COUCHDB_HOST` zeigt auf `localhost`? → Auf IP ändern, Frontend neu bauen
- CouchDB läuft nicht? → `docker compose up -d couchdb`
- Firewall blockiert Port 5984? → `sudo ufw allow 5984` (Linux) oder entsprechend

### "Login-Fenster erscheint ständig"

CouchDB-Credentials in Frontend-`.env` stimmen nicht mit Root-`.env` überein. Beide müssen identisch sein (`APP_USER`/`APP_PASSWORD` ↔ `VITE_COUCHDB_USER`/`VITE_COUCHDB_PASSWORD`).

## Kamera / Scanner

### "Kamera öffnet sich nicht"

**Ursachen:**
1. **HTTPS fehlt** (Produktions-Deployment ohne TLS)
   - Browser erlauben Kamera-Zugriff nur über HTTPS oder `localhost`
   - Lösung: TLS einrichten → siehe [Deployment](Deployment)
2. **Kamera-Berechtigung verweigert**
   - Browser-Settings → Website-Einstellungen → Kamera → erlauben
3. **Keine Kamera vorhanden** (z.B. Desktop ohne Webcam)

### "Barcode wird nicht erkannt"

- Genug Licht?
- Barcode gerade halten, nicht zu nah
- ZXing unterstützt EAN-13/UPC am besten. Kryptische Codes (QR mit Text drin) funktionieren nicht im Barcode-Scanner

### "Produkt nicht gefunden nach Barcode-Scan"

Open Food Facts ist community-gepflegt und hat nicht jedes Produkt. Du kannst:
- Produkt manuell eintragen
- Beitragen: [world.openfoodfacts.org](https://world.openfoodfacts.org) — Produkt selbst hinzufügen

### "Preis-OCR funktioniert nicht"

- `VITE_GOOGLE_VISION_API_KEY` gesetzt?
- Google-Cloud-Projekt hat Vision API aktiviert?
- Billing konfiguriert? (Erste 1000 Requests/Monat gratis, aber Billing muss eingerichtet sein)
- Bild zu dunkel / verwackelt?

## IndexedDB / PouchDB

### "IndexedDB voll" / "QuotaExceededError"

Browser haben Storage-Limits (typisch 50 MB - einige GB je nach Browser).

**Lösung:**
- Nicht-benötigte Listen verlassen
- Browser-Daten löschen und neu beitreten (Daten kommen aus CouchDB zurück)

### "App zeigt alte Daten"

1. Service-Worker-Cache:
   - DevTools → Application → Service Workers → Unregister
   - Seite neu laden
2. IndexedDB manuell löschen:
   - DevTools → Application → IndexedDB → `_pouch_<dbname>` → Löschen
3. Im Code (Debug-Helper):
   ```js
   window.__destroyDB()
   ```

## Username / Identität

### "Username-Prompt erscheint nicht"

Normales Verhalten, wenn `localStorage.username` bereits gesetzt ist.

**Reset:**
```js
localStorage.removeItem('username')
location.reload()
```

Oder DevTools → Application → Local Storage → Key löschen.

### "Ich will meinen Namen ändern"

Profileinstellung in der App (Story #25).

Alternativ direkt:
```js
localStorage.username = 'NewName#a1b2'
```

**Achtung:** Der Suffix `#a1b2` ist wichtig, um dich eindeutig zu identifizieren. Ohne ihn wirst du in geteilten Listen nicht mehr als "du" erkannt.

## Dark Mode

### "Dark Mode aktiviert, aber UI bleibt hell"

- `<html>` Element sollte die Klasse `dark` haben
- `localStorage.theme === 'dark'` prüfen
- Browser-Cache: Strg+Shift+R

### "Dark Mode flackert beim Laden"

Bekanntes Problem bei FOUC (Flash of Unstyled Content). Die Theme-Initialisierung passiert erst, wenn Vue gemountet ist.

Lösung: Inline-Script im `<head>` von `index.html`:
```html
<script>
  if (localStorage.theme === 'dark') {
    document.documentElement.classList.add('dark')
  }
</script>
```

## PWA

### "App-Install-Prompt erscheint nicht"

**Requirements für PWA-Install:**
1. HTTPS (außer localhost)
2. Gültiges `manifest.json` (vite-plugin-pwa erzeugt das)
3. Service Worker registriert
4. `start_url` im Manifest muss erreichbar sein

Prüfen: DevTools → Application → Manifest → Errors/Warnings

### "Alte Version wird angezeigt nach Update"

Mit `registerType: 'autoUpdate'` sollte der neue SW beim nächsten Besuch aktiv werden. Falls nicht:
1. DevTools → Application → Service Workers → "Update on reload"
2. Unregister + Reload erzwingt Update

## Tests

### "Tests schlagen lokal fehl, aber in CI grün"

Oder umgekehrt. Mögliche Ursachen:
- Unterschiedliche Node-Versionen (lokal vs CI: Node 20)
- Ungelöschte IndexedDB zwischen Tests → `cy.clearPouchDB()` nutzen
- Timing/Race-Conditions → Cypress-Retry-Mechanismus

### "Cypress bleibt hängen"

- Port 5173/4173 bereits belegt? `lsof -i :5173`
- Browser nicht installiert? Cypress braucht Chrome/Electron

## Build / Entwicklung

### "npm install schlägt fehl"

- Node-Version prüfen: `node -v` (mindestens 20.19.0)
- `node_modules` + `package-lock.json` löschen, neu installieren
- NPM-Cache: `npm cache clean --force`

### "Vite kann Module nicht finden"

- Meist `@`-Alias-Problem. Check `vite.config.js` und `jsconfig.json`.
- Restart Dev-Server nach Config-Änderungen

### "PWA-Build schlägt fehl"

`vite-plugin-pwa` braucht valide Icons. Prüfe `public/`-Ordner auf alle referenzierten Icon-Files.

## Debug-Tools

```js
// In Browser DevTools Console:
window.__db                      // PouchDB-Instanz
await window.__db.info()         // DB-Statistiken
await window.__db.allDocs({ include_docs: true })   // alle Dokumente
window.__destroyDB()             // lokale DB löschen (reload nötig)
```

## Hilfe bekommen

- Issue auf GitHub erstellen: [Issues](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/issues)
- Team kontaktieren (siehe [Home](Home))
