# Entwickler-Guide

Für neue Team-Mitglieder oder externe Contributor.

## Setup

Siehe [README](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/blob/main/README.md) für Installations-Steps. Details zu Umgebungsvariablen und Docker → [Deployment](Deployment).

## Projektstruktur

```
.
├── .github/workflows/     # CI-Pipeline
├── couchdb/               # CouchDB-Config (CORS)
├── docker-compose.yaml    # CouchDB + Frontend-Container
├── documentation/         # Tech-Docs (Moodle-Abgabe)
├── prompts/               # KI-Prompts (task.md-Anforderung)
├── frontend/
│   ├── public/            # Statische Assets (Favicon, PWA-Icons)
│   ├── src/
│   │   ├── assets/        # CSS
│   │   ├── db/            # PouchDB-Setup, Sync, Seed
│   │   ├── router/        # Vue Router
│   │   ├── stores/        # Pinia Stores
│   │   ├── utils/         # Helpers (OCR)
│   │   ├── views/         # Hauptkomponenten (keine separate components/)
│   │   ├── App.vue
│   │   └── main.js
│   ├── tests/
│   │   ├── e2e/           # Cypress E2E
│   │   ├── unit/          # Cypress Component-Tests
│   │   └── support/       # Shared Helpers
│   ├── cypress.config.js
│   ├── vite.config.js
│   └── package.json
├── STORIES.md             # User Stories
└── README.md
```

## Conventions

### Vue

- **Composition API** mit `<script setup>` — keine Options-API
- **Keine separate Components-Directory** — alle Top-Level-Views in `frontend/src/views/`
- Komponenten < 50 LOC können inline bleiben, größere in eigene `.vue`-Datei

### Pinia-Stores

- **Options-API-Style** (analog zu den bestehenden Stores)
- Ausnahme: `theme.js` nutzt Composition-Syntax (historisch gewachsen, nicht migrieren, wenn nicht nötig)

```js
export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({ lists: [] }),
  actions: {
    async loadLists() { ... }
  }
})
```

### Sprache

- **UI-Labels auf Deutsch**
- **Code-Identifier auf Englisch**
- Kommentare: Deutsch oder Englisch, wie es passt

```js
// ✅ Gut
async function joinList(code) {
  // Sucht Liste via Share-Code
}
<button>Liste beitreten</button>

// ❌ Schlecht
async function ListeBeitreten(code) { ... }
<button>Join list</button>
```

### Timestamps

- Dokument-IDs: `Date.now().toString()`
- Datumsfelder: ISO-Strings (`new Date().toISOString()`)

### Styling

- TailwindCSS direkt in Templates, keine eigenen CSS-Klassen (außer `main.css`)
- Dark-Mode-Varianten für alle Farben: `bg-white dark:bg-gray-800`

## Git-Workflow

### Branches

```
main           ← geschützt, nur via PR
  └── feature/xyz  ← Feature-Entwicklung
```

**Regeln:**
- Keine direkten Pushes auf `main`
- Feature-Branches pro User Story: `feature/<kurzname>` (z.B. `feature/share-code-qr`)
- PR zu `main` wenn fertig, mindestens 1 Review

### Commit-Messages (auf Deutsch, klein geschrieben nach `feat:`/`fix:`/…)

Beispiele aus unserer History:
```
feat: Benutzernamen nachträglich ändern (Story #25)
fix(tests): Rename-Username E2E-Tests stabilisiert
docs: Story #34 QR-Code für Share-Code (N2H, Parushev, 3 SP)
qrcode-scan feature for sharing lists
```

**Format:**
- `feat:` neues Feature
- `fix:` Bugfix
- `docs:` nur Dokumentation
- `refactor:` Umbau ohne Verhaltensänderung
- `test:` Tests
- `chore:` Build, Deps etc.

### PR-Prozess

1. Branch lokal anlegen und pushen
2. PR-Template ausfüllen (Summary, Test-Plan)
3. CI muss grün sein (Build + Tests)
4. Reviewer einladen
5. Nach Approval: Squash-Merge (hält `main`-History sauber)

## Tests

### Unit / Component-Tests (Cypress)

```bash
npm run test:unit        # headless
npm run test:unit:dev    # interaktiv
```

- Jede Komponente/Store hat eine `.cy.js`-Datei unter `frontend/tests/unit/`
- Isolierter Test: mount → interact → assert
- PouchDB wird per `cy.clearPouchDB()` zwischen Tests reset

### E2E (Cypress)

```bash
npm run test:e2e         # headless (startet Preview-Server)
npm run test:e2e:dev     # interaktiv (startet Dev-Server)
```

- Ganze App im Browser
- `frontend/tests/e2e/` — ein File pro User-Flow
- `support/e2e.js` setzt Username in localStorage → Username-Prompt wird geskippt

### Test-Helpers

```js
// frontend/tests/support/commands.js
Cypress.Commands.add('clearPouchDB', () => {
  // Löscht IndexedDB, setzt Skip-Seed-Flag, setzt Test-Username, reload
})
```

### Debug-Zugriff in DevTools

```js
window.__db            // PouchDB-Instanz
window.__destroyDB()   // DB leeren
```

Nur in Entwicklung/Test verfügbar.

## Code-Qualität

### Prettier

- Config: `.prettierrc.json`
- Vor jedem Commit: `npx prettier --write .` (oder IDE-Plugin auf Save)

### Keine Type-Prüfung

- Bewusst kein TypeScript (Aufwand vs. Schulprojekt-Scope)
- `jsconfig.json` für IDE-Unterstützung via JSDoc-Hints

## Typische Tasks

### Neue User Story umsetzen

1. GitHub-Issue anlegen (falls noch nicht vorhanden)
2. Eintrag in `STORIES.md` updaten
3. Feature-Branch: `feature/<kurzname>`
4. Implementation + Tests (mindestens ein Component-Test, bei UI-Änderungen ein E2E)
5. PR mit Referenz zur Story-ID im Titel
6. Nach Merge: Issue schließen, Story in `STORIES.md` auf "Closed"

### Neuen Pinia-Store hinzufügen

1. `frontend/src/stores/<name>.js` anlegen
2. `defineStore` mit Options-API-Style
3. Falls DB-Sync: `onDbChange`-Handler registrieren
4. In `main.js` muss nichts importiert werden (Pinia lädt Stores lazy)
5. Component-Test unter `frontend/tests/unit/<name>.store.cy.js`

### Neues Dokument-Type

1. `type` Feld im Dokument
2. Filter in `allDocs`: `res.rows.filter(r => r.doc.type === 'mytype')`
3. Schema ins Wiki → [Datenmodell-und-Sync](Datenmodell-und-Sync)

## Troubleshooting für Entwickler

Siehe [Troubleshooting](Troubleshooting).
