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

- `frontend/src/db/index.js` — Sync-Konfiguration und Change-Listener
- `frontend/src/stores/article.js` — Konfliktbehandlung, Patch- und Intent-Logik
- `frontend/src/stores/shoppingList.js` — Live-Reaktion auf Listenänderungen

---

### Grundlegende Synchronisation

Beim App-Start wird in `db/index.js` eine bidirektionale Live-Synchronisation zwischen der lokalen PouchDB und der entfernten CouchDB gestartet:

```js
db.sync(remoteUrl, { live: true, retry: true })
```

- `live: true` hält die Verbindung dauerhaft offen und überträgt Änderungen in Echtzeit.
- `retry: true` stellt die Verbindung nach einem Abbruch automatisch wieder her — auch nach längerer Offline-Zeit.

Alle Lese- und Schreiboperationen erfolgen immer zuerst lokal in PouchDB (IndexedDB). Sobald eine Verbindung besteht, werden ausstehende lokale Änderungen automatisch mit CouchDB abgeglichen.

---

### Change-Listener und UI-Reaktivität

Damit die Oberfläche bei eingehenden Synchronisationsänderungen sofort aktualisiert wird, stellt `db/index.js` zwei Arten von Listener-Funktionen bereit:

- **`onDbChange(callback)`** — wird bei jeder Änderung der lokalen Datenbank ausgelöst, egal ob durch eine eigene Aktion oder durch eingehende Replikation. Wird von `startLiveSync()` in den Stores genutzt, um beim Eintreffen fremder Änderungen die Ansicht neu zu laden.
- **`onRemoteChange(callback)`** — wird ausschließlich bei eingehenden Änderungen vom Server ausgelöst (Pull-Richtung). Wird vom Benachrichtigungs-Store genutzt, um Push-Benachrichtigungen bei neuen Artikeln anderer Nutzer anzuzeigen.

In `useArticleStore.startLiveSync(listId)` lauscht der Store auf alle relevanten Dokumenttypen und ruft bei jeder Änderung `loadArticles()` auf:

```js
onDbChange((change) => {
  const type = change.doc?.type
  if (change.deleted || type === 'article' || type === 'article-patch'
      || type === 'check-event' || type === 'delete-intent') {
    this.loadArticles(this._currentListId)
  }
})
```

---

### Konfliktbehandlung: Delete Wins

PouchDB/CouchDB löst Konflikte standardmäßig nach dem Prinzip „Last Write Wins" auf Dokumentebene. Das bedeutet: wenn ein Nutzer einen Artikel offline löscht und ein anderer ihn gleichzeitig bearbeitet, könnte nach der Synchronisation die Bearbeitung gewinnen und der gelöschte Artikel wieder erscheinen.

Um sicherzustellen, dass Löschungen immer gewinnen, wird beim endgültigen Löschen eines Artikels zusätzlich ein **`delete-intent`-Dokument** geschrieben:

```json
{
  "_id": "delete-intent-{articleId}",
  "type": "delete-intent",
  "articleId": "...",
  "listId": "...",
  "deletedAt": "2026-03-27T10:00:00.000Z",
  "deletedBy": "Alice#a1b2"
}
```

Da dieses Dokument eine feste, eindeutige `_id` hat und keinen Inhalt des Artikels enthält, kann es nie mit Bearbeitungen in Konflikt geraten — es synchronisiert sich unabhängig davon, ob der Artikel selbst noch existiert oder wie er zuletzt aussah. `loadArticles()` filtert alle Artikel heraus, für die ein `delete-intent`-Eintrag vorhanden ist, noch bevor Patches angewendet werden.

---

### Konfliktbehandlung: Feldweise Zusammenführung bei Offline-Bearbeitungen

Wenn zwei Nutzer denselben Artikel offline bearbeiten, würde PouchDBs Standardverhalten die gesamte Änderung eines Nutzers verwerfen. Um stattdessen feldweise zu mergen (und bei Konflikten auf demselben Feld den zuletzt Schreibenden gewinnen zu lassen), werden Bearbeitungen nicht mehr direkt in das Artikel-Dokument geschrieben, sondern als separate **`article-patch`-Dokumente**:

```json
{
  "_id": "patch-{articleId}-{timestamp}-{random}",
  "type": "article-patch",
  "articleId": "...",
  "listId": "...",
  "fields": { "name": "Biomilch", "price": 2.49 },
  "editedBy": "Bob#c3d4",
  "editedAt": "2026-03-27T10:05:00.000Z"
}
```

Da jedes Patch-Dokument eine eindeutige `_id` (aus Artikel-ID, Zeitstempel und Zufallswert) erhält, können zwei Nutzer offline beliebig viele Patches erstellen, ohne dass diese miteinander in Konflikt geraten. Beim Laden wird `applyPatches()` aufgerufen, das alle Patches eines Artikels chronologisch nach `editedAt` zusammenführt:

- **Gleiche Felder** (z. B. beide ändern den Preis): Das spätere Patch gewinnt — Last Write Wins pro Feld.
- **Verschiedene Felder** (z. B. einer ändert den Namen, der andere den Preis): Beide Patches werden angewendet — alle Änderungen bleiben erhalten.

`Menge` und `Einheit` werden dabei immer als untrennbares Paar in dasselbe Patch geschrieben, da eine isolierte Änderung nur eines der beiden Felder inhaltlich keinen Sinn ergibt.

Preisänderungen schreiben zusätzlich einen `priceHistoryEntry` ins Patch, sodass `applyPatches()` beim Laden die vollständige Preishistorie aus allen Patches aller Nutzer rekonstruieren kann:

```js
const priceHistory = [...(base.priceHistory || []), ...newPriceEntries]
  .sort((a, b) => new Date(a.setAt) - new Date(b.setAt))
  .slice(-20)
```

---

## User Story 4 — Chronologische Anzeige nach Synchronisation

> Als Benutzer möchte ich, dass nach der Synchronisierung meiner Listen die Änderungen chronologisch angezeigt werden, um Probleme bei der Koordination der Einkäufe zu vermindern.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/stores/shoppingList.js` — Listen-Sortierung
- `frontend/src/stores/article.js` — Artikel-Sortierung, Check-Event-Logik
- `frontend/src/views/ArticleListView.vue` — Anzeige der Abhakvorgänge

---

### Chronologische Sortierung

Jedes Dokument enthält ein `createdAt`-Feld mit ISO-8601-Timestamp, der beim Erstellen lokal gesetzt wird. Die Sortierung erfolgt in `loadArticles()` bzw. `loadLists()`:

- **Listen** werden absteigend sortiert (neueste zuerst):

  ```js
  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  ```

- **Artikel** werden aufsteigend sortiert (älteste zuerst, d. h. in der Reihenfolge, in der sie hinzugefügt wurden):

  ```js
  .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  ```

Da die Timestamps lokal beim Erstellen vergeben werden, spiegelt die Reihenfolge nach der Synchronisation die tatsächliche zeitliche Abfolge der Aktionen aller Nutzer wider.

---

### Abhakvorgänge: Wer hat wann abgehakt?

Wenn zwei oder mehr Nutzer denselben Artikel offline abhaken und anschließend synchronisieren, würde das `checked`-Feld des Artikel-Dokuments nach PouchDBs standardmäßigem „Last Write Wins" nur einen einzigen Vorgang festhalten — der andere ginge verloren.

Um alle Abhakvorgänge aller Nutzer lückenlos zu erfassen, wird beim Abhaken eines Artikels zusätzlich ein eigenständiges **`check-event`-Dokument** erstellt:

```json
{
  "_id": "check-{timestamp}-{random}",
  "type": "check-event",
  "articleId": "...",
  "listId": "...",
  "checkedBy": "Alice#a1b2",
  "checkedAt": "2026-03-27T10:05:00.000Z"
}
```

Da jedes Dokument eine eindeutige `_id` erhält (aus Zeitstempel und Zufallswert), können zwei Nutzer offline dasselbe Artikel abhaken, ohne dass ihre Ereignisse in Konflikt geraten — beide Dokumente existieren nach der Synchronisation gleichzeitig in der Datenbank.

**Laden und Gruppieren:**

`loadArticles()` lädt alle `check-event`-Dokumente der aktuellen Liste, sortiert sie nach `checkedAt` und gruppiert sie nach `articleId`:

```js
all
  .filter((doc) => doc.type === 'check-event' && doc.listId === listId)
  .sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt))
  .forEach((event) => {
    if (!eventsByArticle[event.articleId]) eventsByArticle[event.articleId] = []
    eventsByArticle[event.articleId].push(event)
  })
this.checkEvents = eventsByArticle
```

**Anzeige in der UI:**

In `ArticleListView.vue` werden unterhalb jedes Artikels, für den Abhak-Ereignisse vorliegen, alle Vorgänge in chronologischer Reihenfolge angezeigt. Der `#xxxx`-Suffix des Benutzernamens wird dabei für die Lesbarkeit abgeschnitten:

```
✓ Alice, 27.3.2026 um 10:05 Uhr
✓ Bob, 27.3.2026 um 10:08 Uhr
```

Ereignisse beim Entfernen des Hakens werden nicht erfasst — nur das Setzen des Hakens wird protokolliert. Wird ein Artikel erneut abgehakt, fügt sich der neue Eintrag chronologisch ans Ende der Liste.

---

## User Story 5 — Listen über Codes teilen

> Als Benutzer möchte ich für Einkaufslisten Codes erstellen können, mit dem andere Benutzer diese Listen ebenfalls bearbeiten können, um meine Listen zu teilen.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/db/index.js` — `getDeviceId()`, `generateShareCode()`, CouchDB-URL-Konfiguration
- `frontend/src/stores/shoppingList.js` — `createList()`, `joinList()`, `leaveList()`, `loadLists()`
- `frontend/src/views/HomeView.vue` — "Liste beitreten"-Button und Beitreten-Modal
- `frontend/src/views/ArticleListView.vue` — "Teilen"-Button und Share-Code-Modal
- `frontend/.env` / `frontend/.env.example` — CouchDB-Verbindungskonfiguration
- `couchdb/local.ini` — CouchDB CORS-Konfiguration
- `docker-compose.yaml` — Einbindung der CouchDB-Konfigurationsdatei

**Konzept:**

Die Sharing-Funktion basiert auf drei Säulen:

1. **Geräte-Identifikation:** Jedes Gerät erhält beim ersten App-Start eine eindeutige ID (`deviceId`), die in `localStorage` gespeichert wird. Es wird `crypto.getRandomValues()` statt `crypto.randomUUID()` verwendet, da letzteres nur in sicheren Kontexten (HTTPS/localhost) verfügbar ist.

2. **Mitgliedschaft:** Jede Liste enthält ein `members`-Array mit den `deviceId`s aller Geräte, die Zugriff haben. `loadLists()` filtert die Anzeige auf Listen, in denen die eigene `deviceId` enthalten ist.

3. **Share-Codes:** Jede Liste erhält bei der Erstellung einen zufälligen 6-stelligen alphanumerischen Code (`shareCode`). Zeichen wie O/0/I/1 werden ausgelassen, um Verwechslungen zu vermeiden.

**Technischer Ablauf — Liste teilen:**

1. Der Besitzer öffnet eine Liste in `ArticleListView.vue` und klickt auf "Teilen".
2. Ein Modal zeigt den 6-stelligen Share-Code der Liste an.
3. Der Besitzer teilt diesen Code mündlich, per Chat oder auf anderem Weg.

**Technischer Ablauf — Liste beitreten:**

1. Ein anderer Benutzer klickt in `HomeView.vue` auf "Liste beitreten".
2. Im Modal gibt er den 6-stelligen Code ein.
3. `joinList(code)` durchsucht die lokale PouchDB nach einem Listendokument mit passendem `shareCode`.
4. Wird die Liste gefunden, wird die eigene `deviceId` zum `members`-Array hinzugefügt und das Dokument via `db.put()` aktualisiert.
5. Durch die PouchDB/CouchDB-Synchronisation wird die Änderung an alle Geräte verteilt.
6. Der Benutzer wird automatisch zur beigetretenen Liste navigiert.

**Dokumentstruktur (erweitert):**

```json
{
  "_id": "1709742000000",
  "type": "list",
  "name": "Wocheneinkauf",
  "category": "Lebensmittel",
  "members": ["a1b2c3d4e5f6...", "f6e5d4c3b2a1..."],
  "shareCode": "A3X9K2",
  "createdAt": "2026-03-06T12:00:00.000Z"
}
```

**Netzwerk-Konfiguration:**

Damit die Synchronisation zwischen verschiedenen Geräten funktioniert, sind zwei Konfigurationen notwendig:

1. **CouchDB-URL:** Die Verbindung zur CouchDB wird über einzelne Umgebungsvariablen in `frontend/.env` konfiguriert (siehe `frontend/.env.example` als Vorlage). Die Variablen `VITE_COUCHDB_USER`, `VITE_COUCHDB_PASSWORD`, `VITE_COUCHDB_HOST`, `VITE_COUCHDB_PORT` und `VITE_COUCHDB_DB` werden in `db/index.js` zur Remote-URL zusammengesetzt. `VITE_COUCHDB_HOST` muss auf die IP des CouchDB-Servers gesetzt werden (nicht `localhost`), damit andere Geräte im Netzwerk die gleiche Datenbank erreichen.

2. **CORS:** CouchDB muss Cross-Origin-Requests erlauben, da Frontend (z.B. Port 5173) und CouchDB (Port 5984) unterschiedliche Origins sind. Die CORS-Konfiguration wird über `couchdb/local.ini` eingebunden:
   
   ```ini
   [httpd]
   enable_cors = true
   
   [cors]
   origins = *
   methods = GET, PUT, POST, HEAD, DELETE
   credentials = true
   headers = accept, authorization, content-type, origin, referer
   ```
   
   Diese Datei wird in `docker-compose.yaml` als Volume gemountet.

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

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/stores/shoppingList.js` — `leaveList()`-Logik

**Technischer Ablauf:**

1. `leaveList(id)` entfernt die eigene `deviceId` aus dem `members`-Array der Liste.
2. Falls noch andere Mitglieder vorhanden sind, wird das aktualisierte Dokument via `db.put()` gespeichert — die Liste bleibt für die anderen Mitglieder bestehen.
3. Falls `members` nach dem Entfernen leer ist (letztes Mitglied verlässt), werden die Liste und alle zugehörigen Artikel via `db.bulkDocs()` mit `_deleted: true` gelöscht.
4. Anschließend wird `loadLists()` aufgerufen, um die Ansicht zu aktualisieren.

---

## User Story 34 — Einkaufsliste manuell löschen

> Als Benutzer möchte ich eine Einkaufsliste komplett löschen können (unabhängig davon, ob ich sie verlasse).

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/HomeView.vue` — UI mit Löschen-Button und Bestätigungs-Modal
- `frontend/src/stores/shoppingList.js` — `deleteList()`-Logik

**Technischer Ablauf:**

1. Ein Klick auf "Liste löschen" öffnet ein Modal zur Bestätigung.
2. Der Benutzer bestätigt den Löschvorgang.
3. `deleteList(id, rev)` entfernt das Dokument permanent via `db.remove(id, rev)`.
4. Anschließend wird `loadLists()` aufgerufen, um die Ansicht zu aktualisieren.

*Hinweis: Dies unterscheidet sich von "Liste verlassen" (Story 8), welche bei geteilten Listen lediglich das Entfernen des eigenen Benutzers aus dem `members` Array veranlasst, außer die Liste hat keine weiteren Nutzer mehr.*

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

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — Pickerl-Button, Popup-Modal, Berechnungslogik und GUI-Anzeige

---

### Datenmodell

Rabattrelevante Informationen werden direkt im Artikel-Dokument (PouchDB/CouchDB) gespeichert:

```js
{
  rabattfähig: boolean,         // Artikel ist für Rabatt-Pickerl vorgemerkt
  rabattAngewendet: {           // gesetzt, sobald ein Rabatt angewendet wurde
    prozent: number,            // angewendeter Rabattprozentsatz
    originalPreis: number       // Preis vor dem Rabatt (€ pro Einheit)
  } | null
}
```

`rabattAngewendet` wird über `articleStore.updateArticle()` als `article-patch`-Dokument persistiert und beim nächsten Laden mit den übrigen Patches zusammengeführt.

---

### Technischer Ablauf

#### 1. Artikel als rabattfähig markieren

Beim Erstellen oder Bearbeiten eines Artikels kann die Checkbox **„Rabattfähig"** gesetzt werden. Rabattfähige Artikel werden in der Listenansicht gelb hervorgehoben und nach oben sortiert (teuerste zuerst, da diese vom Rabatt am meisten profitieren).

#### 2. Pickerl-Popup öffnen

Ein **„🏷 Pickerl"**-Button im Header der Artikelliste öffnet das Popup. Beim Öffnen werden der Prozentwert und alle angewendeten Snapshots zurückgesetzt (`openPickerlModal()`).

#### 3. Rabatt eingeben und Preise berechnen

Der Benutzer gibt einen Prozentwert (1–100) ein. Die berechneten Preise werden über das Computed Property `pickerlArtikel` ermittelt:

```js
const pickerlArtikel = computed(() => {
  return articleStore.articles
    .filter((a) => a.rabattfähig && !a.checked && a.price != null && !pickerlAppliedIds.value.has(a._id))
    .map((a) => {
      const originalTotal = a.price * (a.quantity || 1)
      const discountedTotal = originalTotal * (1 - pickerlProzent.value / 100)
      return { ...a, originalTotal, discountedTotal }
    })
})
```

Gefiltert werden nur Artikel, die rabattfähig, nicht abgehakt und mit einem Preis versehen sind. Bereits angewendete Artikel werden ausgeblendet.

#### 4. Rabatt auf einen Artikel anwenden (`applyPickerl`)

Sobald der Benutzer bei einem Artikel auf **„Anwenden"** drückt:

1. Der rabattierte Einzelpreis wird berechnet: `price * (1 - prozent / 100)`, gerundet auf 2 Dezimalstellen.
2. Ein **Snapshot** der aktuellen Anzeigewerte (`originalTotal`, `discountedTotal`) wird sofort in `pickerlAppliedSnapshots` gespeichert — noch bevor der Store aktualisiert wird. Dadurch bleibt die Anzeige eingefroren und ein doppelter Rabatt wird verhindert.
3. Die Artikel-ID wird zu `pickerlAppliedIds` hinzugefügt, sodass der Artikel aus `pickerlArtikel` verschwindet.
4. Der neue Preis wird via `articleStore.updatePrice()` gespeichert (inklusive Eintrag in der Preishistorie).
5. `rabattAngewendet` wird via `articleStore.updateArticle()` persistiert.

Angewendete Artikel werden im Popup weiterhin angezeigt — grün eingefärbt, ausgegraut und mit einem **✓** versehen — basierend auf dem eingefrorenen Snapshot.

#### 5. GUI-Anzeige in der Artikelliste

Für Artikel mit gesetztem `rabattAngewendet` wird direkt unterhalb des Preises ein grüner Hinweis eingeblendet:

```
🏷 −20% Rabatt (war € 10,00)
```

Dieser zeigt den angewendeten Prozentsatz sowie den ursprünglichen Preis vor dem Rabatt.

#### 6. Rabatt rückgängig machen (bei Bearbeitung)

Wird ein Artikel bearbeitet und das Häkchen bei **„Rabattfähig"** entfernt, erkennt `submitEdit()` diesen Fall über die Variable `removingRabatt`:

```js
const removingRabatt = (article.rabattfähig ?? false) && !editRabattfähig.value && article.rabattAngewendet
```

In diesem Fall wird:

- der **Originalpreis** aus `rabattAngewendet.originalPreis` via `updatePrice()` wiederhergestellt (mit Eintrag in der Preishistorie),
- `rabattAngewendet` auf `null` gesetzt,
- der grüne Hinweis in der GUI entfernt.

---

## User Story 30 — CSV-Export

> Als Benutzer möchte ich die Möglichkeit haben, meine Listen als CSV-Dateien zu exportieren.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/ArticleListView.vue` — `exportToCsv()`-Logik und Export-Button

**Technischer Ablauf:**

1. Der Benutzer klickt auf den "CSV"-Button in der Aktionsleiste einer Einkaufsliste.
2. `exportToCsv()` liest alle aktiven **und** ausgeblendeten Artikel aus den Pinia Stores.
3. Die Felder (Name, Menge, Einheit, Notiz, Erledigt) werden mit `escapeCsvField()` sauber formatiert — Komma und Anführungszeichen im Text werden korrekt escaped.
4. Ein UTF-8 BOM-Prefix (`\uFEFF`) wird vorangestellt, damit Excel die Datei korrekt als UTF-8 erkennt.
5. Ein temporärer Download-Link wird erzeugt und im Browser sofort geklickt. Die Datei wird als `<Listenname>_export.csv` heruntergeladen.

**CSV-Spalten:**

| Name | Menge | Einheit | Notiz | Erledigt |
| ---- | ----- | ------- | ----- | -------- |

---

## User Story 31 — Manueller Sync-Button

> Als Benutzer möchte ich einen Button haben, der meine Listen aktualisiert, um eine manuelle Option für die Synchronisation zu haben.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/components/sync/ManualSyncButton.vue` — Icon-Button mit Progress-Bar
- `frontend/src/components/sync/SyncToast.vue` — Toast-Benachrichtigung mit Ergebnis
- `frontend/src/services/ManualSyncService.js` — Sync-Logik mit Callbacks
- `frontend/src/stores/manualSyncStore.js` — reaktiver State (Fortschritt, Logs)

**Technischer Ablauf:**

1. Der Benutzer klickt auf den Sync-Icon-Button in der Aktionsleiste einer Liste.
2. Der Button prüft `navigator.onLine` – ist das Gerät offline, bleibt er deaktiviert.
3. `syncStore.startSync()` wird aufgerufen: `isSyncing = true`, `syncProgress = 10`.
4. `ManualSyncService.executeManualSync()` startet eine einmalige (`live: false, retry: false`) bidirektionale PouchDB-Synchronisation.
5. Während der Replikation feuert das `change`-Event. Der Store erhöht `syncProgress` schrittweise bis maximal 90%.
6. Bei Abschluss (`complete`) wird `syncStore.finishSync()` aufgerufen: `syncProgress = 100`, der Sync-Eintrag wird dem Audit-Log (`syncLogs[]`) vorangestellt.
7. Bei einem Fehler (`error`/`denied`) wird `syncStore.failSync()` aufgerufen: `syncProgress = 0`, Fehlermeldung wird im Log gespeichert.
8. Eine `SyncToast`-Komponente beobachtet den Store reaktiv und zeigt nach Abschluss für 6 Sekunden unten rechts eine Benachrichtigung an (Erfolg oder Fehler).

**Architektur-Details:**

| Komponente             | Verantwortlichkeit                                                           |
| ---------------------- | ---------------------------------------------------------------------------- |
| `ManualSyncButton.vue` | Trigger, Online/Offline-State, visueller Fortschrittsbalken                  |
| `ManualSyncService.js` | PouchDB-Replikation, Event-Callbacks (`onProgress`, `onComplete`, `onError`) |
| `manualSyncStore.js`   | Reaktiver Zustand, Audit-History (`syncLogs[]`)                              |
| `SyncToast.vue`        | User-Feedback nach Abschluss (Auto-hide nach 6s)                             |

**Unterschied zu automatischem Sync:**

Der manuelle Sync unterscheidet sich vom automatischen Hintergrund-Sync (`db.sync({ live: true, retry: true })`) in `db/index.js` dadurch, dass er:

- Einmalig ausgeführt wird (kein Retry, kein Live-Polling)
- Sofortiges visuelles Feedback via Fortschrittsbalken liefert
- Den Benutzer über Ergebnis und Fehler explizit informiert

---

## User Story 32 — Barcode-Scan und Nährwerte

> Als Benutzer möchte ich die Möglichkeit haben, Barcodes der Produkte scannen zu können und die Nährwerte angezeigt zu bekommen.

**Status:** Implementiert

**Beteiligte Dateien:**

- `frontend/src/views/BarcodeScanner.vue` — Scan-Komponente (Kamera, Produktsuche, Nährwertanzeige)
- `frontend/src/views/ArticleListView.vue` — Einbindung und Weiterverarbeitung des Scan-Ergebnisses

---

### Technischer Ablauf

#### 1. Kamera-Scan

`BarcodeScanner.vue` wird beim Mounten über `@zxing/browser` (Bibliothek für Barcode-Erkennung im Browser) initialisiert — ursprünglich war `html5-qrcode` geplant, umgesetzt wurde es mit der leistungsfähigeren `BrowserMultiFormatReader`-Klasse, die neben QR-Codes auch gängige 1D-Barcodes (EAN-13, EAN-8 u. a.) erkennt:

```js
reader = new BrowserMultiFormatReader()
await reader.decodeFromVideoDevice(undefined, videoRef.value, async (result, err) => {
  if (result && !didScan) {
    didScan = true
    BrowserMultiFormatReader.releaseAllStreams()
    nutritionData.value = await lookupProduct(result.getText())
  }
})
```

Das `didScan`-Flag verhindert, dass ein erkannter Barcode mehrfach verarbeitet wird. Nach dem ersten Fund werden alle Kamera-Streams sofort freigegeben.

Als Fallback kann der Barcode auch manuell über ein Textfeld eingegeben werden, falls die Kamera nicht verfügbar ist oder der Scan fehlschlägt.

#### 2. Produktsuche via Open Food Facts

Die Funktion `lookupProduct(barcode)` ruft die öffentliche Open Food Facts API ab:

```
GET https://world.openfoodfacts.org/api/v0/product/{barcode}.json
```

Bei Erfolg (`status === 1`) werden Produktname und Nährwerte extrahiert. Der deutsche Produktname (`product_name_de`) wird bevorzugt, fällt dieser weg, wird auf den allgemeinen Namen zurückgegriffen. Ist das Produkt nicht in der Datenbank, wird der Barcode-String selbst als Produktname verwendet.

Folgende Nährwerte pro 100 g werden ausgelesen, sofern vorhanden:

| Feld                        | Einheit |
| --------------------------- | ------- |
| Energie                     | kcal    |
| Fett                        | g       |
| davon gesättigte Fettsäuren | g       |
| Kohlenhydrate               | g       |
| davon Zucker                | g       |
| Ballaststoffe               | g       |
| Eiweiß                      | g       |
| Salz                        | g       |

Felder mit dem Wert `null` werden aus der Anzeige herausgefiltert.

#### 3. Nährwert-Anzeige und Preiseingabe

Nach dem Scan wechselt die Komponente von der Kameraansicht zur Produktkarte. Diese zeigt den Produktnamen, die verfügbaren Nährwerte und ein optionales Preisfeld. Der Nutzer kann einen Preis ergänzen oder das Feld leer lassen.

#### 4. Übergabe an die Artikelliste

Beim Bestätigen emittiert `BarcodeScanner.vue` das `scanned`-Event mit Name, Barcode und optionalem Preis:

```js
emit('scanned', {
  name: nutritionData.value.name,
  barcode: nutritionData.value.barcode,
  price: scannedPrice.value ?? null,
})
```

`ArticleListView.vue` fängt dieses Event in `onBarcodeScanned()` ab und befüllt damit das Artikel-Erstellen-Modal vor:

```js
function onBarcodeScanned({ name, barcode, price }) {
  showScanner.value = false
  newName.value = name
  newBarcode.value = barcode || null
  newPrice.value = price || null
  newQuantity.value = 1
  newUnit.value = ''
  showModal.value = true
}
```

Der Nutzer kann Name, Menge und weitere Felder noch anpassen, bevor der Artikel tatsächlich zur Liste hinzugefügt wird. Barcode und Preis werden im Artikel-Dokument gespeichert.

#### 5. Ressourcenverwaltung

`BrowserMultiFormatReader.releaseAllStreams()` wird sowohl nach erfolgreichem Scan, nach manueller Eingabe als auch beim Schließen der Komponente (`onUnmounted`) aufgerufen, um den Kamera-Stream zuverlässig freizugeben und Ressourcenlecks zu vermeiden.

---

## User Story 33 — Rechnungs-Scan

> Als Benutzer will ich meine Rechnung einscannen können, um die eingekauften Produkte einfach abhaken zu können.

**Status:** Nicht implementiert

Diese Funktion ist noch nicht umgesetzt. Die Implementierung würde erfordern:

- Kamerazugriff und Bildverarbeitung
- OCR zur Erkennung von Produktnamen auf Rechnungen
- Abgleich mit bestehenden Artikeln in der Liste und automatisches Abhaken
