# Prompts

## Prompt 1

**Technologie:** Claude AI (Modell Sonnet 4.6)

### Input

Wie sollte die Architektur und Ordnerstruktur im Frontend für das folgende Projekt sein:

Ich habe ein Vue-Frontend, PouchDB als LocalStorage und CouchDB als Zentrale DB. Ich habe kein Backend. Sinn des Projektes ist eine geteilte Shopping-Liste.

wie sollte ich jetzt im Frontend die Architektur/Ordnerstruktur machen, um möglichst Effizient aber auch sauber zu arbeiten. gib mir auch alle Quellen von denen du die Information hast

### Output

# Frontend-Architektur: Vue + PouchDB + CouchDB Shopping-Liste

## Empfohlene Ordnerstruktur

```
src/
├── assets/                  # Statische Dateien (Icons, Bilder, globale CSS)
│
├── components/              # Wiederverwendbare UI-Komponenten
│   ├── common/              # Generische Komponenten (Button, Input, Modal...)
│   └── shopping/            # Feature-spezifische Komponenten
│       ├── ShoppingItem.vue
│       ├── ShoppingList.vue
│       └── AddItemForm.vue
│
├── composables/             # Vue Composition API Logik (wiederverwendbare Hooks)
│   ├── useShoppingList.js   # CRUD-Operationen für die Liste
│   ├── useSync.js           # Sync-Status, Fehlerbehandlung
│   └── useOffline.js        # Online/Offline-Erkennung
│
├── db/                      # Alles rund um PouchDB & CouchDB
│   ├── index.js             # PouchDB-Instanz & CouchDB-Verbindung
│   ├── sync.js              # Replikations-Logik (live sync)
│   └── migrations.js        # Schema-Änderungen (optional)
│
├── stores/                  # Pinia Stores (globaler State)
│   ├── shoppingStore.js     # Listeneinträge, Filter, Sortierstatus
│   └── syncStore.js         # Sync-Status (online, syncing, error)
│
├── views/                   # Seiten (Router-Ebene)
│   ├── HomeView.vue
│   └── SettingsView.vue     # z.B. CouchDB-URL konfigurieren
│
├── router/
│   └── index.js
│
└── main.js
```

---

## Warum diese Struktur?

### `db/` als eigene Schicht

PouchDB ist dein "Backend". Diese Schicht sauber zu isolieren ist entscheidend, damit du die DB-Logik nicht über Komponenten verstreust. In `db/index.js` erstellst du die PouchDB-Instanz, in `sync.js` konfigurierst du die Live-Replikation zu CouchDB.

```js
// db/index.js
import PouchDB from 'pouchdb'

export const localDB = new PouchDB('shopping-list')
export const remoteDB = new PouchDB('https://your-couchdb-url/shopping-list')
```

```js
// db/sync.js
import { localDB, remoteDB } from './index'

export function startSync(onError) {
  return localDB.sync(remoteDB, {
    live: true,
    retry: true
  }).on('error', onError)
}
```

### `composables/` statt direkte DB-Aufrufe in Komponenten

Komponenten sollten nie direkt PouchDB aufrufen. Composables sind der Mittler zwischen DB-Schicht und UI.

```js
// composables/useShoppingList.js
import { localDB } from '@/db'
import { useShoppingStore } from '@/stores/shoppingStore'

export function useShoppingList() {
  const store = useShoppingStore()

  async function addItem(name) {
    const doc = { _id: new Date().toISOString(), name, checked: false }
    await localDB.put(doc)
    store.addItem(doc)
  }

  return { addItem }
}
```

### Pinia für globalen State

PouchDB-Änderungen (auch durch Remote-Sync) triggern `changes()`-Events. Diese fütterst du in den Pinia Store, damit die UI reaktiv bleibt.

---

## Sync-Strategie (wichtig für geteilte Listen)

PouchDB's Live-Sync mit CouchDB ist für dein Use-Case ideal. Du musst jedoch **Konflikt-Handling** einplanen: Wenn zwei Nutzer gleichzeitig dasselbe Item ändern, entsteht ein CouchDB-Konflikt. Dafür lohnt es sich, in `db/sync.js` eine `paused`/`active`/`denied`-Event-Behandlung zu implementieren und den Status im `syncStore` abzulegen, damit die UI z.B. einen "Offline"-Indikator zeigen kann.

---

## Quellen

Da du explizit nach Quellen gefragt hast — ich bin ein Sprachmodell und habe kein Quellenverzeichnis im klassischen Sinne. Mein Wissen stammt aus Trainingsdaten. Für dieses Thema empfehle ich dir folgende offizielle Quellen zur eigenen Vertiefung:

- **PouchDB Getting Started & Replication**: https://pouchdb.com/guides/
- **PouchDB + CouchDB Sync**: https://pouchdb.com/guides/replication.html
- **Vue 3 Composition API**: https://vuejs.org/guide/reusability/composables.html
- **Pinia (State Management)**: https://pinia.vuejs.org/
- **CouchDB Conflict Handling**: https://docs.couchdb.org/en/stable/replication/conflicts.html
- **Vue Project Structure Best Practices**: https://vuejs.org/guide/scaling-up/tooling.html
