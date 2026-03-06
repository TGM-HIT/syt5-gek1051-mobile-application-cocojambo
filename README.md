# CocoJambo - Shopping List

## Roles

- Simon Chladek: Product Owner
- Christian Parushev: Technical Architect
- Jeanette Schmid: A-Meise
- Lazar Bulic: B-Meise
- Eren Yüksel: C-Meise

## Voraussetzungen

- Node.js (^20.19.0 oder >=22.12.0)
- npm
- CouchDB (lokal oder remote, für Synchronisation)

## Projekt starten

### 1. Dependencies installieren

```bash
cd frontend
npm install
```

### 2. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
```

In der `.env` die CouchDB-URL anpassen:

```
VITE_COUCHDB_URL=http://admin:password@localhost:5984/shopping_lists
```

### 3. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5173` erreichbar.

### 4. Produktions-Build

```bash
npm run build
npm run preview
```

Der Preview-Server läuft auf `http://localhost:4173`.

## Tests

Die Tests befinden sich unter `frontend/tests/`:

```
tests/
├── e2e/        E2E-Tests (gesamte App im Browser)
├── unit/       Unit-/Component-Tests (einzelne Komponenten)
├── support/    Cypress Support-Dateien
└── fixtures/   Test-Daten
```

### Unit-Tests (Component Tests)

Headless ausführen:

```bash
npm run test:unit
```

Mit Cypress UI (interaktiv):

```bash
npm run test:unit:dev
```

### E2E-Tests

Headless ausführen (baut die App und startet den Preview-Server automatisch):

```bash
npm run test:e2e
```

Mit Cypress UI (interaktiv, startet den Dev-Server automatisch):

```bash
npm run test:e2e:dev
```
