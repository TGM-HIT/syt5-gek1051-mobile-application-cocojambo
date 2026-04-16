# Deployment

## Lokales Dev-Setup

### Voraussetzungen

- Node.js ≥ 20.19.0 (oder ≥ 22.12.0)
- npm
- Docker + Docker Compose

### Schritte

```bash
# 1. Repo klonen
git clone https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo.git
cd syt5-gek1051-mobile-application-cocojambo

# 2. Env-Variablen setzen
cp .env.example .env
# Datei bearbeiten: APP_USER, APP_PASSWORD, optional APP_HTTP_PORT

# 3. Frontend-Deps installieren
cd frontend
npm install

# 4. Frontend-Env setzen
cp .env.example .env
# Datei bearbeiten: VITE_COUCHDB_HOST muss die IP deines Hosts sein, nicht "localhost"!

# 5. CouchDB starten
cd ..
docker compose up -d

# 6. Dev-Server
cd frontend
npm run dev
```

Dev-Server läuft auf `http://localhost:5173` bzw. `http://<YOUR_IP>:5173`.

## Umgebungsvariablen

### Root `.env` (für Docker-Compose)

```env
APP_VERSION=3.3
APP_NAME=couchdb
APP_HTTP_PORT=5984
APP_USER=admin
APP_PASSWORD=supersecret
```

### Frontend `.env` (für Vite)

```env
VITE_COUCHDB_USER=admin
VITE_COUCHDB_PASSWORD=supersecret
VITE_COUCHDB_HOST=192.168.1.100     # <-- deine IP, nicht localhost!
VITE_COUCHDB_PORT=5984
VITE_COUCHDB_DB=shopping_lists
VITE_GOOGLE_VISION_API_KEY=         # optional, für Preis-OCR
```

> **Warum nicht `localhost`?**
> Damit andere Geräte im Netzwerk (z.B. dein Handy zum Testen) synchronisieren können, muss die IP von außen erreichbar sein. `localhost` zeigt immer auf das jeweils aufrufende Gerät.

## Docker-Compose

`docker-compose.yaml` startet zwei Container im Netzwerk `172.40.0.0/24`:

| Service | IP | Port |
|---|---|---|
| `couchdb` | 172.40.0.10 | 5984 |
| `frontend` (nginx) | 172.40.0.20 | 80 |

### Befehle

```bash
docker compose up -d          # starten
docker compose down           # stoppen
docker compose logs -f        # Logs
docker compose logs couchdb   # nur CouchDB-Logs
```

### CouchDB-Admin-UI

Nach `docker compose up -d` erreichbar unter:
```
http://<HOST_IP>:5984/_utils
```

Login mit `APP_USER` / `APP_PASSWORD`.

## CouchDB CORS-Konfiguration

`couchdb/local.ini`:

```ini
[httpd]
enable_cors = true

[cors]
origins = *
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer, x-csrf-token
```

**Wichtig:** Wird beim Container-Start in CouchDB reingemountet. Ohne CORS scheitern Browser-Requests am Same-Origin-Policy.

## Produktions-Build

```bash
cd frontend
npm run build          # erzeugt dist/
npm run preview        # lokaler Preview auf Port 4173
```

Der Preview-Server dient nur zum Test — für echtes Hosting:

### Option 1: nginx im Docker-Compose

Der `frontend`-Service im Compose verwendet die `Dockerfile`, die `npm run build` → `dist/` → nginx serviert.

```bash
docker compose up -d frontend
# Frontend auf http://<HOST_IP>:80
```

### Option 2: Statisches Hosting

`dist/` kann auf jeden Static-Host:
- GitHub Pages
- Netlify
- Vercel
- S3 + CloudFront

**Wichtig:** `VITE_*`-Variablen werden zur Build-Zeit eingebaut, nicht zur Laufzeit. Bei Umgebungswechsel → neu bauen.

## Produktions-Anforderungen (task.md)

Für "Erweiterte Anforderungen zur Gänze erfüllt":

### System global erreichbar (https + domain)

1. **Domain** registrieren (z.B. Cloudflare, IONOS)
2. **DNS** auf deinen Server-Host zeigen lassen
3. **Reverse-Proxy** (nginx/Caddy/Traefik) vor CouchDB und Frontend
4. **TLS-Zertifikat** via Let's Encrypt (Certbot oder Caddy automatisch)

#### Beispiel: Caddy-Config

```caddy
cocojambo.example.com {
    reverse_proxy localhost:80   # Frontend
}

couchdb.cocojambo.example.com {
    reverse_proxy localhost:5984  # CouchDB
}
```

Caddy besorgt TLS automatisch. Danach:
- Frontend: `https://cocojambo.example.com`
- CouchDB-Sync: `https://couchdb.cocojambo.example.com`

### Frontend-Env für Prod

```env
VITE_COUCHDB_HOST=couchdb.cocojambo.example.com
VITE_COUCHDB_PORT=443
# ggf. VITE_COUCHDB_PROTOCOL=https (wenn im Code unterstützt)
```

## PWA-Installation

Nach Deployment:

### Chrome (Android / Desktop)

- **Android:** Browser-Menü → "App installieren" / "Zum Startbildschirm"
- **Desktop:** Install-Icon in der Adressleiste

### Safari (iOS)

- Teilen-Button → "Zum Home-Bildschirm hinzufügen"
- **Hinweis:** iOS hat einige PWA-Einschränkungen (kein Push, begrenzter Storage)

### Edge

- Install-Icon in der Adressleiste oder Menü → "Apps → Diese Seite als App installieren"

Nach Install verhält sich CocoJambo wie eine native App.

## CI/CD

### GitHub Actions Workflow

`.github/workflows/frontend.yml`:

- **Trigger:** Push/PR auf `main`, wenn `frontend/**` geändert wurde
- **Steps:**
  1. Checkout
  2. Node 20 Setup
  3. `npm ci`
  4. `npm run build`
  5. `npm run test:unit`
  6. `npm run test:e2e`

### Branch-Protection

`main` ist geschützt:
- Keine direkten Pushes
- Erfordert mindestens 1 Review
- Status-Checks müssen grün sein (CI)
