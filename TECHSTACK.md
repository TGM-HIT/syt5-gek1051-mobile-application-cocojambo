# Shopping List - Techstack

## Überblick

| Schicht                   | Technologie                |
| ------------------------- | -------------------------- |
| Frontend                  | VueJS (Compositions API)   |
| Backend                   | Spring Boot                |
| Datenbank (Server)        | Couchbase Server / CouchDB |
| Datenbank (local storage) | Couchbase Lite / PouchDB   |

## Frontend

Als Frontend-Framework wurde **VueJS** ausgewählt, da das Team damit schon Erfahrung hat und es die Anforderungen erfüllt. Für die Kommunikation mit dem Backend wird Axios gewählt sowie der Vue Router für die Strukturierung der Unterseiten.

Zusätzlich wird zur Vereinfachung des Codes **TailwindCSS** als CSS-Framework verwendet.

### PWA

Ebenfalls wird eine PWA zur Verfügung stehen. Diese wird mit dem Vite-Plugin erstellt.

## Backend

Hier wird **Spring Boot** verwendet, da wir damit ebenfalls schon Erfahrung haben, sowie dieses Backend-Framework passend zu dem Projekt ist. Folgende genauere Funktionen kommen hier vor:

- REST-Controller

- REST-API von CouchDB zur Kommunikation mit CouchDB (falls verwendet wird)

## DevOps

Als Versionierungssystem wird hier **Git & Github** verwendet. Alle Komponenten des Projekts werden in einem **docker-compose.yml** vereinfacht. Ebenfalls werden **Workflow-Dateien** (.yml) für die CI/CD-Pipeline verwendet. Diese wird durch Pull-Requests ausgelöst. Es sind nur Pull-Requests vorgesehen und direkte Pushes in den Main-Branch sind durch Branch-Restrictions nicht möglich. Für das Deployment wird wieder das zur Verfügung stehende Gitub Student Developer Pack verwendet.
