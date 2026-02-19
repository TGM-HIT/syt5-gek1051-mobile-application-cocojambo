# Shopping List - Techstack

## Überblick

| Schicht                   | Technologie              |
| ------------------------- | ------------------------ |
| Frontend                  | VueJS (Compositions API) |
| Datenbank (Server)        | CouchDB                  |
| Datenbank (local storage) | PouchDB                  |

## Frontend

Als Frontend-Framework wurde **VueJS** ausgewählt, da das Team damit schon Erfahrung hat und es die Anforderungen erfüllt. Für die Kommunikation mit dem Backend wird Axios gewählt sowie der Vue Router für die Strukturierung der Unterseiten.

Zusätzlich wird zur Vereinfachung des Codes **TailwindCSS** als CSS-Framework verwendet.

Die Ordnerstruktur sieht so aus:

```
src
|---- assets        (Logos, Bilder...)
|---- components    (Wiederverwendbare UI-Komponenten)
|---- views         (Fertige Seiten/Views)
|---- db            (DB-Config)
|---- stores        (Stores)
|---- router        (Vue-Router-Config)
```



### PWA

Ebenfalls wird eine PWA zur Verfügung stehen. Diese wird mit dem Vite-Plugin erstellt.

## Datenbank

Hier wird **CouchDB** als zentrale Datenbank gewählt, sowie **PouchDB** als lokalen Storage, welcher bei z.B. Offline-Aktivität verwendet wird.  Um Konsistenzprobleme zu verhindern (z.B. 2 Personen haben kein Internet und haken Milch gleichzeitig ab) wird der Timestamp mitgeschickt und Abhakungen in der Liste chronologisch (anhand des Timestamps) angezeigt. 

## Scan von QR-/Barcodes

Dazu wird die Library **html5-qrcode** verwendet.

## Abruf von Nährwerten von Produkten

Hierzu gibt es die **Open Foods API**, welche wir verwenden werden. Hierbei können wir die zuvor mit html5-qrcode gescannten Codes zur Suche verwenden.

## DevOps

Als Versionierungssystem wird hier **Git & Github** verwendet. Alle Komponenten des Projekts werden in einem **docker-compose.yml** vereinfacht. Ebenfalls werden **Workflow-Dateien** (.yml) für die CI/CD-Pipeline verwendet. Diese wird durch Pull-Requests ausgelöst. Es sind nur Pull-Requests vorgesehen und direkte Pushes in den Main-Branch sind durch Branch-Restrictions nicht möglich. Für das Deployment wird wieder das zur Verfügung stehende Gitub Student Developer Pack verwendet.
