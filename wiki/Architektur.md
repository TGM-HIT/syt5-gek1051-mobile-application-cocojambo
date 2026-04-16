# Architektur

## Systemübersicht

```mermaid
flowchart LR
    subgraph Client["Client (Browser / PWA)"]
        UI[Vue 3 App]
        Store[Pinia Stores]
        Local[(PouchDB<br/>IndexedDB)]
    end

    subgraph External["Externe Services"]
        OFF[Open Food Facts<br/>API]
        GV[Google Vision<br/>OCR API]
    end

    subgraph Server["Server (Docker)"]
        Remote[(CouchDB 3.3)]
    end

    UI --> Store
    Store <--> Local
    Local <-. live sync .-> Remote
    UI -->|Barcode-Lookup| OFF
    UI -->|Preis-OCR| GV
```

## Designentscheidung: Kein Backend

Die App besitzt **keinen eigenen Backend-Server**. Der Browser synchronisiert direkt mit CouchDB.

**Warum?**
- CouchDB bietet von Haus aus HTTP/REST-Zugriff, Authentifizierung, CORS, Konfliktlösung
- PouchDB <-> CouchDB ist ein **erprobtes Replikationsprotokoll**
- Weniger Code, weniger Fehlerquellen, bessere Offline-Eigenschaften
- Entspricht dem **Offline-First**-Prinzip (task.md-Anforderung)

**Nachteile, die akzeptiert werden:**
- Keine serverseitige Business-Logik (z.B. keine Mail-Benachrichtigungen)
- Datenvalidierung nur clientseitig (für ein Schulprojekt okay)
- CouchDB-Credentials im Frontend-Bundle (kein Login-System)

## Komponenten-Hierarchie

```mermaid
flowchart TD
    App[App.vue]
    App --> UP[Username-Prompt]
    App --> OB[Offline-Banner]
    App --> R[Vue Router]

    R -->|/| Home[HomeView]
    R -->|/list/:id| List[ArticleListView]

    Home --> CM[Create-Modal]
    Home --> JM[Join-Modal]
    Home --> QR[QrScanner]
    Home --> DM[Delete-Modal]

    List --> Search[Such-Leiste]
    List --> Items[Artikel-Liste]
    List --> Hidden[Ausgeblendet-Sektion]
    List --> BS[BarcodeScanner]
    List --> PS[PriceTagScanner]
    List --> Share[Share-Modal mit QR]
    List --> AM[Article-Modal]
```

## Pinia Stores

Alle Stores in `frontend/src/stores/`:

| Store | Verantwortung | Persistenz |
|---|---|---|
| `shoppingList.js` | Listen-CRUD, Join/Leave, Live-Sync | PouchDB |
| `article.js` | Artikel-CRUD, Hide/Restore, Suche, Preis-Historie | PouchDB |
| `theme.js` | Dark Mode Toggle | localStorage |
| `onlineStatus.js` | `navigator.onLine`-Wrapper | — |

**Konvention:** Stores sind im **Options-API-Style** geschrieben (außer `theme.js`, der Setup-Syntax nutzt — historisch gewachsen).

## Datenfluss (Beispiel: Artikel hinzufügen)

```mermaid
sequenceDiagram
    participant U as User
    participant V as ArticleListView
    participant S as article-Store
    participant P as PouchDB
    participant C as CouchDB
    participant V2 as Anderer Client

    U->>V: "+ Artikel" → Name eingeben
    V->>S: addArticle({name, listId, ...})
    S->>P: db.put(doc)
    P-->>S: OK
    S->>S: articles.push(doc) (reaktiv)
    V-->>U: Liste aktualisiert
    P-->>C: Live-Sync (Replikation)
    C-->>V2: Changes-Feed
    V2->>V2: onDbChange-Handler
    V2-->>V2: UI automatisch aktualisiert
```

## Live-Sync mit `onDbChange`

In `db/index.js`:
```js
db.changes({ since: 'now', live: true, include_docs: true })
  .on('change', (change) => callbacks.forEach(cb => cb(change)))
```

Stores registrieren sich mit `onDbChange(handler)` und reagieren auf:
- Neue Dokumente (von anderen Clients)
- Updates (z.B. `checked` umgestellt)
- Deletes (`_deleted: true`)

Damit ist die UI **ohne Polling** reaktiv.

## Routing

```
/                → HomeView   (Listen-Übersicht)
/list/:id        → ArticleListView   (einzelne Liste)
```

Keine geschützten Routen — der Username-Prompt in `App.vue` wirkt als Gatekeeper.

## State-Initialisierung

1. `App.vue` onMount → prüft `hasUsername()`
2. Wenn ja → `seed.js` läuft (nur beim allerersten Start, sonst Skip)
3. Stores laden Daten aus PouchDB via `allDocs`
4. Changes-Feed wird gestartet → Live-Sync aktiv
5. CouchDB-Sync: `PouchDB.sync(local, remote, { live: true, retry: true })`

## Diagramm: Komplette Datenhaltung

```mermaid
erDiagram
    LIST ||--o{ ARTICLE : contains
    LIST {
        string _id PK
        string type "list"
        string name
        string category
        string[] members
        string shareCode "6-char"
        string createdAt
    }
    ARTICLE {
        string _id PK
        string type "article"
        string listId FK
        string name
        number quantity
        string unit
        string note
        number price
        string barcode
        object[] priceHistory
        bool checked
        bool hidden
        string createdAt
    }
```

Details → [Datenmodell-und-Sync](Datenmodell-und-Sync)
