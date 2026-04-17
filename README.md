[![Frontend](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/frontend.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/frontend.yml)
[![coverage](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/schlad3k/9ba7c2b7782fea0f767c26be0a743f9f/raw/cocojambo-coverage.json)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/frontend.yml)
[![Reports](https://img.shields.io/badge/reports-artifacts-blue)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/frontend.yml)
[![Node.js Package](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/npm-publish-github-packages.yml/badge.svg)](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/npm-publish-github-packages.yml)
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

Passe die Werte in der `.env` an deine Umgebung an. **Wichtig:** `VITE_COUCHDB_HOST` muss auf die tatsächliche IP-Adresse des CouchDB-Servers gesetzt werden (nicht `localhost`), damit andere Geräte im Netzwerk synchronisieren können.

### 3. CouchDB starten

```bash
docker compose up -d
```

Die CouchDB-Zugangsdaten werden in der Root-`.env` konfiguriert (`APP_USER`, `APP_PASSWORD`). Die CORS-Konfiguration in `couchdb/local.ini` erlaubt Cross-Origin-Requests, was für die Kommunikation zwischen Frontend und CouchDB notwendig ist.

### 4. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist dann unter `http://localhost:5173` bzw. `http://[YOUR_IP]:5173` erreichbar.

### 5. Produktions-Build

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

### Coverage

Führt alle Tests mit Istanbul-Instrumentierung aus und erstellt einen HTML/LCOV-Coverage-Report:

```bash
npm run test:coverage
```

Reports danach unter `frontend/coverage/` (HTML: `coverage/index.html`, LCOV: `coverage/lcov.info`).

### Test-Reports

Cypress nutzt den `cypress-mochawesome-reporter`. Nach jedem Run werden HTML-Reports unter `frontend/cypress/reports/` erzeugt. In der CI werden Reports und Coverage als Artifacts hochgeladen und können über die GitHub-Actions-Run-Page heruntergeladen werden.
