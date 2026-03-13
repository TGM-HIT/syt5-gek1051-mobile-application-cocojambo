# Technische Dokumentation - User Stories

## Architektur-Überblick

```
App.vue
├── HomeView.vue          (/ Route)
│   ├── Einkaufslisten-Karten
│   └── Liste-erstellen-Modal
└── ArticleListView.vue   (/list/:id Route)
    ├── Suchleiste
    ├── Artikelliste
    ├── Ausgeblendete Artikel
    ├── Artikel-erstellen-Modal
    └── Artikel-bearbeiten-Modal
```

**State Management (Pinia Stores):**

- `useShoppingListStore` — verwaltet Listen (`lists[]`)
- `useArticleStore` — verwaltet Artikel (`articles[]`, `hiddenArticles[]`, `searchResults{}`)

**Datenbank:**

- PouchDB (lokal, IndexedDB) mit Live-Sync zu CouchDB (remote)
- Kein Backend — direkte Kommunikation über PouchDB/CouchDB REST-Schnittstelle

---

## User Story 1 — Einkaufslisten erstellen

> Als Benutzer möchte ich die Möglichkeit haben, Einkaufslisten mit Namen und Kategorie erstellen können, um die Verwaltung online zur Verfügung zu haben.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/HomeView.vue` — UI mit Modal-Formular
- `frontend/src/stores/shoppingList.js` — Store-Logik
- `frontend/src/db/index.js` — Datenbankzugriff

**Technischer Ablauf:**

1. Der Benutzer öffnet ein Modal in `HomeView.vue` und gibt Name (Pflichtfeld) und Kategorie (optional) ein.
2. Beim Absenden wird `useShoppingListStore.createList(name, category)` aufgerufen.
3. Die Methode erstellt ein neues Dokument mit `db.put()` in PouchDB.
4. Anschließend wird `loadLists()` aufgerufen, um die Ansicht zu aktualisieren.

**Dokumentstruktur:**

```json
{
  "_id": "1709742000000",
  "type": "list",
  "name": "Wocheneinkauf",
  "category": "Lebensmittel",
  "createdAt": "2026-03-06T12:00:00.000Z"
}
```

---

## User Story 2 — Offline-Zugriff

> Als Benutzer will ich offline auf meine Listen zugreifen können, um trotz Netzwerkproblemen auf meine Listen zugreifen zu können.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/db/index.js` — PouchDB-Instanz

**Technischer Ablauf:**

1. PouchDB wird als lokale Datenbank instanziiert: `new PouchDB('shopping_lists')`.
2. Alle Daten werden automatisch in der IndexedDB des Browsers gespeichert.
3. Lese- und Schreiboperationen erfolgen immer zuerst lokal — der Benutzer merkt keinen Unterschied zwischen Online und Offline.
4. Daten überleben Seitenreloads und bleiben persistent im Browser.

---

## User Story 3 — Automatische Synchronisation

> Als Benutzer möchte ich, sobald wieder Internet zur Verfügung steht, dass sich meine Listen automatisch aktualisieren/synchronisieren, um Konsistenzprobleme zu verhindern.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/db/index.js` — Sync-Konfiguration

**Technischer Ablauf:**

1. Beim App-Start wird eine bidirektionale Live-Synchronisation gestartet:
   
   ```js
   db.sync(remoteUrl, { live: true, retry: true })
   ```
2. `live: true` hält die Verbindung dauerhaft offen und synchronisiert Änderungen in Echtzeit.
3. `retry: true` sorgt dafür, dass bei Verbindungsabbruch automatisch erneut versucht wird zu synchronisieren.
4. Konflikte werden über PouchDBs MVCC-Modell (Multi-Version Concurrency Control) und Revision-History gelöst.

---

## User Story 4 — Chronologische Anzeige nach Synchronisation

> Als Benutzer möchte ich, dass nach der Synchronisierung meiner Listen die Änderungen chronologisch angezeigt werden, um Probleme bei der Koordination der Einkäufe zu vermindern.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/stores/shoppingList.js` — Listen-Sortierung
- `frontend/src/stores/article.js` — Artikel-Sortierung

**Technischer Ablauf:**

1. Jedes Dokument enthält ein `createdAt`-Feld mit ISO-Timestamp.
2. Listen werden absteigend sortiert (neueste zuerst):
   
   ```js
   .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
   ```
3. Artikel werden aufsteigend sortiert (älteste zuerst):
   
   ```js
   .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
   ```
4. Nach der Synchronisation werden die Timestamps verwendet, um die Reihenfolge der Änderungen korrekt darzustellen — z.B. wer ein Produkt zuerst abgehakt hat.

---

## User Story 5 — Listen über Codes teilen

> Als Benutzer möchte ich für Einkaufslisten Codes erstellen können, mit dem andere Benutzer diese Listen ebenfalls bearbeiten können, um meine Listen zu teilen.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Generierung eines eindeutigen Share-Codes pro Liste
- Ein Eingabefeld, um einen Code einzugeben und einer fremden Liste beizutreten
- Verwaltung von Benutzerzugehörigkeiten pro Liste

---

## User Story 6 — Artikel hinzufügen und bearbeiten

> Als Benutzer möchte ich zu meinen Listen Artikel hinzufügen sowie bearbeiten können, um meinen geplanten Einkauf im Blick zu behalten.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — UI mit Erstellen/Bearbeiten-Modals
- `frontend/src/stores/article.js` — Store-Logik

**Technischer Ablauf:**

1. **Erstellen:** Der Benutzer füllt ein Modal-Formular (Name, Menge, Einheit) aus. `createArticle(listId, name, quantity, unit)` erstellt ein neues Dokument mit `db.put()`.
2. **Bearbeiten:** Beim Klick auf einen Artikel öffnet sich ein vorausgefülltes Modal. `updateArticle(listId, article)` speichert die Änderungen über `db.put(article)` mit bestehender `_id` und `_rev`.
3. **Abhaken:** `toggleChecked()` invertiert das `checked`-Feld des Artikels.

**Dokumentstruktur:**

```json
{
  "_id": "1709742060000",
  "type": "article",
  "listId": "1709742000000",
  "name": "Milch",
  "quantity": 2,
  "unit": "Liter",
  "checked": false,
  "hidden": false,
  "createdAt": "2026-03-06T12:01:00.000Z"
}
```

---

## User Story 7 — Artikel ausblenden und endgültig löschen

> Als Benutzer möchte ich die Möglichkeit haben, Artikel in Einkaufslisten ausblenden zu können und diese in einem extra Bereich einsehen zu können. Zusätzlich möchte ich ausgeblendete Elemente endgültig löschen können.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — UI mit ausklappbarem Bereich für versteckte Artikel
- `frontend/src/stores/article.js` — Hide/Delete-Logik

**Technischer Ablauf:**

1. **Ausblenden (Soft Delete):** `hideArticle()` setzt `hidden: true` auf dem Dokument via `db.put()`.
2. **Anzeige:** `loadArticles()` trennt Artikel in zwei Arrays:
   - `articles` — alle mit `hidden !== true`
   - `hiddenArticles` — alle mit `hidden === true`
3. **Endgültig löschen:** `deleteArticle(listId, id, rev)` entfernt das Dokument permanent via `db.remove(id, rev)`.
4. In der UI erscheinen ausgeblendete Artikel in einem aufklappbaren Bereich mit Buttons für "Wiederherstellen" und "Endgültig löschen".

---

## User Story 8 — Liste verlassen

> Als Benutzer möchte ich die Möglichkeit haben, Listen die ich bearbeiten kann zu "verlassen", um nicht unnötige Listen zu speichern. Sobald die letzte Person eine Liste verlässt, soll die Liste gelöscht werden.

**Status:** Teilweise implementiert

**Beteiligte Dateien:**

- `frontend/src/stores/shoppingList.js` — Delete-Logik

**Technischer Ablauf:**

1. `deleteList(id, rev)` entfernt die Liste permanent via `db.remove(id, rev)`.
2. Da die Teilen-Funktion (Story 5) noch nicht implementiert ist, gibt es keine Multi-User-Logik — jeder Benutzer kann seine Listen direkt löschen.

---

## User Story 9 — Ausgeblendete Artikel wiederherstellen

> Als Benutzer möchte ich ausgeblendete Artikel wieder in die Ursprungsliste hinzufügen können, falls Artikel doch benötigt werden.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — "Wiederherstellen"-Button
- `frontend/src/stores/article.js` — Restore-Logik

**Technischer Ablauf:**

1. `restoreArticle(listId, article)` setzt `hidden: false` auf dem Dokument via `db.put()`.
2. Der Artikel verschwindet aus `hiddenArticles` und erscheint wieder in `articles`.

---

## User Story 10 — PWA-Unterstützung

> Als Benutzer möchte ich die Möglichkeit haben, die Webapp lokal als PWA herunterzuladen, um weitere Offline-Funktionalitäten zu gewährleisten.

**Status:** Teilweise implementiert

**Beteiligte Dateien:**

- `frontend/vite.config.js` — Vite-Konfiguration
- `frontend/index.html` — Meta-Tags

**Technischer Ablauf:**

1. Die Grundstruktur (Vite-basiertes Vue-Projekt) ist PWA-fähig.
2. PouchDB bietet bereits Offline-Datenzugriff über IndexedDB.
3. Noch fehlend für vollständige PWA: `manifest.json`, Service Worker, App-Icons, Installationsprompt.

---

## User Story 11 — Suchfeld für Produkte

> Als Benutzer möchte ich ein Suchfeld in meiner Liste haben welches Produkte in dieser Liste, Produkte in anderen Listen oder Produkte aus der Vergangenheit anzeigt, um Produkte einfacher abzuhaken oder hinzuzufügen.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — Suchfeld-UI und Ergebnisanzeige
- `frontend/src/stores/article.js` — Suchlogik

**Technischer Ablauf:**

1. Ein `watch()` auf dem Suchfeld triggert `searchArticles(query, currentListId)` bei jeder Eingabe (Echtzeit-Suche).
2. Die Methode lädt alle Artikel aus der Datenbank und filtert nach dem Suchbegriff (case-insensitive `includes()`).
3. Die Ergebnisse werden in drei Kategorien aufgeteilt:
   - **"In dieser Liste"** — aktive Artikel der aktuellen Liste (Klick: abhaken)
   - **"Aus anderen Listen"** — Artikel aus anderen Listen (Klick: zur aktuellen Liste hinzufügen)
   - **"Vergangene Artikel"** — ausgeblendete Artikel (Klick: wiederherstellen und hinzufügen)
4. `addFromSearch(article, targetListId)` kopiert einen Artikel aus einer anderen Liste oder stellt einen vergangenen Artikel wieder her.

---

## User Story 20 — Notizen zu Artikeln

> Als Benutzer möchte ich Notizen zu einem hinzugefügten Artikel hinzufügen, um unvorhersehbare Informationen mitzuteilen.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Ein `notes`-Feld im Artikel-Dokument
- Ein Textfeld in der Artikel-UI zum Anzeigen und Bearbeiten von Notizen
- Eine Store-Methode zum Aktualisieren der Notizen

---

## User Story 21 — Dark/Light Mode

> Als Benutzer möchte ich die Möglichkeit haben, die Oberfläche zwischen Dark- und Lightmode zu schalten, um ein besseres Nutzererlebnis zu haben.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Einen Theme-State im Pinia Store (oder `localStorage`)
- TailwindCSS Dark-Mode-Klassen
- Einen Toggle-Button in der UI

---

## User Story 22 — Foto-Preiserkennung

> Als Benutzer möchte ich ein Bild vom Preis des Artikels machen können. Dieser Preis wird dann dem Artikel hinzugefügt.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Kamerazugriff über die Browser-API
- Eine OCR-Library (z.B. Tesseract.js) zur Preiserkennung
- Ein `price`-Feld im Artikel-Dokument

---

## User Story 23 — Rabatt-Pickerl-Optimierung

> Als Benutzer möchte ich eine Ansicht haben, welche mir anzeigt auf welche Produkte es am sinnvollsten ist, Rabatt-Pickerl zu kleben.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Preisfelder auf Artikeln
- Berechnungslogik zur Optimierung (teuerste Artikel zuerst)
- Eine eigene Ansicht/Komponente zur Darstellung

---

## User Story 30 — CSV-Export

> Als Benutzer möchte ich die Möglichkeit haben, meine Listen als CSV-Dateien zu exportieren.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Eine Funktion zum Formatieren der Listendaten als CSV
- Einen Download-Button in der UI
- Einen Datei-Download via `Blob` und `URL.createObjectURL()`

---

## User Story 31 — Manueller Sync-Button

> Als Benutzer möchte ich einen Button haben, der meine Listen aktualisiert, um eine manuelle Option für die Synchronisation zu haben.

**Status:** Nicht implementiert

Aktuell läuft die Synchronisation automatisch (`live: true`). Die Implementierung würde erfordern:

- Eine Store-Methode, die manuell `db.sync()` auslöst
- Einen Button in der UI mit Statusanzeige (synchronisiert/fehlgeschlagen)

---

## User Story 32 — Barcode-Scan und Nährwerte

> Als Benutzer möchte ich die Möglichkeit haben, Barcodes der Produkte scannen zu können und die Nährwerte angezeigt zu bekommen.

**Status:** Nicht implementiert

**Geplante Technologien (laut TECHSTACK.md):**

- `html5-qrcode` für Barcode-Scanning
- Open Food Facts API für Nährwertdaten

Die Implementierung würde erfordern:

- Eine Scan-Komponente mit `html5-qrcode`
- API-Anbindung an Open Food Facts
- Anzeige der Nährwerte (Kcal, Proteine, Fette, Kohlenhydrate)

---

## User Story 33 — Rechnungs-Scan

> Als Benutzer will ich meine Rechnung einscannen können, um die eingekauften Produkte einfach abhaken zu können.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Kamerazugriff und Bildverarbeitung
- OCR zur Erkennung von Produktnamen auf Rechnungen
- Abgleich mit bestehenden Artikeln in der Liste und automatisches Abhaken
