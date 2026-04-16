# CocoJambo Wiki

**CocoJambo** ist eine kollaborative Einkaufslisten-PWA, entwickelt als Schulprojekt am TGM-HIT (Wien) im Modul **GEK1051 Mobile Application** (SYT Systemtechnik).

Offline-fähig, Echtzeit-synchronisiert über CouchDB, mit Barcode- und Preisschild-Scanner.

![Status](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/actions/workflows/frontend.yml/badge.svg)

---

## Inhaltsverzeichnis

| Seite | Inhalt |
|---|---|
| [Benutzer-Guide](Benutzer-Guide) | Wie man die App als Endnutzer verwendet |
| [Architektur](Architektur) | Systemübersicht, Komponenten, Datenfluss |
| [Datenmodell-und-Sync](Datenmodell-und-Sync) | PouchDB/CouchDB-Schema und Replikation |
| [Features-im-Detail](Features-im-Detail) | Tech-Deep-Dive zu Scannern, PWA, Dark Mode |
| [Entwickler-Guide](Entwickler-Guide) | Conventions, Branches, Tests |
| [Deployment](Deployment) | Docker, Produktions-Setup, PWA-Installation |
| [Troubleshooting](Troubleshooting) | Häufige Probleme und Lösungen |

---

## Team

| Rolle | Person |
|---|---|
| Product Owner | Simon Chladek |
| Technical Architect | Christian Parushev |
| Developer (A-Meise) | Jeanette Schmid |
| Developer (B-Meise) | Lazar Bulic |
| Developer (C-Meise) | Eren Yüksel |

## Tech-Stack (Kurz)

- **Frontend:** Vue 3 (Composition API) + Pinia + Vue Router 5
- **Styling:** TailwindCSS v4
- **Lokale DB:** PouchDB (IndexedDB)
- **Remote DB:** CouchDB 3.3 (Docker)
- **Build/PWA:** Vite 7 + vite-plugin-pwa
- **Tests:** Cypress 15 (E2E + Component)
- **CI:** GitHub Actions

## Quick-Start

```bash
cd frontend
npm install
cp ../.env.example ../.env   # Werte anpassen
docker compose up -d         # CouchDB starten
npm run dev
```

Details → [Deployment](Deployment)

## Projektstatus

Siehe [`STORIES.md`](https://github.com/TGM-HIT/syt5-gek1051-mobile-application-cocojambo/blob/main/STORIES.md) für alle User Stories mit Prio, Status und SP-Verteilung.
