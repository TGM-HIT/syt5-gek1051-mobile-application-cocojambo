# Shopping List - Techstack

## Überblick

| Schicht                   | Technologie              |
| ------------------------- | ------------------------ |
| Frontend                  | VueJS (Compositions API) |
| Datenbank (Server)        | CouchDB                  |
| Datenbank (local storage) | PouchDB                  |

## Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Benutzer (Browser)                        │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                     Vue.js Frontend (SPA)                     │  │
│  │                                                               │  │
│  │   ┌─────────────┐  ┌──────────────────┐  ┌───────────────┐   │  │
│  │   │  HomeView   │  │ ArticleListView  │  │  Vue Router   │   │  │
│  │   │  (Listen)   │  │   (Artikel)      │  │  (Navigation) │   │  │
│  │   └──────┬──────┘  └────────┬─────────┘  └───────────────┘   │  │
│  │          │                  │                                  │  │
│  │          ▼                  ▼                                  │  │
│  │   ┌─────────────────────────────────────┐                     │  │
│  │   │         Pinia Stores                │                     │  │
│  │   │  ┌─────────────┐ ┌───────────────┐  │                    │  │
│  │   │  │ shoppingList│ │   article     │  │                    │  │
│  │   │  │   Store     │ │    Store      │  │                    │  │
│  │   │  └──────┬──────┘ └───────┬───────┘  │                    │  │
│  │   └─────────┼────────────────┼──────────┘                    │  │
│  │             │                │                                 │  │
│  │             ▼                ▼                                 │  │
│  │   ┌─────────────────────────────────────┐                     │  │
│  │   │       PouchDB (IndexedDB)           │                     │  │
│  │   │       Lokale Datenbank              │                     │  │
│  │   └──────────────────┬──────────────────┘                     │  │
│  │                      │                                        │  │
│  └──────────────────────┼────────────────────────────────────────┘  │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                          │  Live Sync (bidirektional)
                          │  { live: true, retry: true }
                          │
                          ▼
               ┌─────────────────────┐
               │      CouchDB        │
               │  (Remote-Datenbank) │
               │   REST-API (:5984)  │
               └─────────────────────┘
                          ▲
                          │  Live Sync
                          │
               ┌─────────────────────┐
               │  Andere Benutzer    │
               │  (gleiche Struktur) │
               └─────────────────────┘
```

**Datenfluss:**
1. Benutzer interagiert mit den Vue.js Views (HomeView, ArticleListView)
2. Views rufen Aktionen in den Pinia Stores auf (createList, createArticle, etc.)
3. Stores kommunizieren direkt mit PouchDB (lokale IndexedDB)
4. PouchDB synchronisiert automatisch bidirektional mit CouchDB (Remote)
5. Änderungen anderer Benutzer kommen über CouchDB zurück in die lokale PouchDB

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

Ebenfalls wird eine PWA zur Verfügung stehen. Diese wird mit dem Vue-Cli-Plugin erstellt.

## Datenbank

Hier wird **CouchDB** als zentrale Datenbank gewählt, sowie **PouchDB** als lokalen Storage, welcher bei z.B. Offline-Aktivität verwendet wird. 

**Achtung:** CouchDB und PouchDB werden (Stand Februar 2026) nicht meht aktiv weiterentwickelt, bekommen aber noch Sicherheitsupdates.

## Synchronisationsansatz

Um Konsistenzprobleme und doppelte Einträge in den Listen zu verhindern, nutzen wir den Timestamp als Ansatz. Beispielsweise können zwei Leute gleichzeitig ohne Internet ein Produkt abhaken, ohne zu wissen, dass der andere es schon abgehakt hat. Deswegen wird bei jedem Abhaken von einem Produkt der Timestamp mitgeschickt. So können dann die Abhakungen chronologisch unter dem Artikel angezeigt werden — man sieht, wer das Produkt wann abgehakt hat. Beispielsweise kann man es sich so ausmachen, dass die Person die am frühesten das Produkt abgehakt hat, dieses kaufen soll.

### Konfliktstrategie: Delete wins

Bei der Synchronisation von Offline-Änderungen kann es zu Konflikten kommen. Ein typisches Szenario: Person A bearbeitet einen Artikel offline (z.B. ändert die Menge), während Person B denselben Artikel offline löscht. Standardmäßig würde CouchDB den Konflikt chronologisch lösen — wenn Person A nach Person B bearbeitet, würde der Artikel wiederhergestellt werden.

Dieses Verhalten ist unerwünscht. In unserer Anwendung gilt das Prinzip **"Delete wins"**: Wenn ein Artikel von einem Benutzer gelöscht (ausgeblendet) wird, bleibt er gelöscht — unabhängig davon, ob ein anderer Benutzer den Artikel zeitlich danach bearbeitet hat. Die Löschung hat immer Vorrang, da ein Benutzer bewusst entschieden hat, dass der Artikel nicht mehr benötigt wird. Eine nachträgliche Bearbeitung durch einen anderen Benutzer, der die Löschung noch nicht synchronisiert bekommen hat, soll diese Entscheidung nicht rückgängig machen.

### Konfliktstrategie: Last write wins

Wenn zwei Benutzer denselben Artikel gleichzeitig offline bearbeiten (z.B. Person A ändert die Menge und Person B ändert den Preis), gilt das Prinzip **"Last write wins"**: Die zuletzt synchronisierte Änderung überschreibt die vorherige. CouchDB löst solche Konflikte automatisch anhand der Revision-History — die Änderung mit der höheren Revision gewinnt. In der Praxis bedeutet das, dass die Person, die zuerst wieder online geht und synchronisiert, ihre Änderung zunächst durchsetzt, diese aber von der zweiten Person beim Synchronisieren überschrieben wird.

## Schnittstelle

Da CouchDB über eine ReST-Schnittstelle angesprochen wird und bestehende Javascript-Methoden für die Kommunikation existieren, werden diese verwendet. Ein Beispiel zur Löschung eines Elements:

```java
db.remove(task);
```

Ein Backend gibt es nicht, somit erfolgt die Kommunikation direkt über die ReST-Schnittstelle der DB.

## Scan von QR-/Barcodes

Dazu wird die Library **html5-qrcode** verwendet.

## Abruf von Nährwerten von Produkten

Hierzu gibt es die **Open Foods API**, welche wir verwenden werden. Hierbei können wir die zuvor mit html5-qrcode gescannten Codes zur Suche verwenden.

## DevOps

Als Versionierungssystem wird hier **Git & Github** verwendet. Alle Komponenten des Projekts werden in einem **docker-compose.yml** vereinfacht. Ebenfalls werden **Workflow-Dateien** (.yml) für die CI/CD-Pipeline verwendet. Diese wird durch Pull-Requests ausgelöst. Es sind nur Pull-Requests vorgesehen und direkte Pushes in den Main-Branch sind durch Branch-Restrictions nicht möglich. Für das Deployment wird wieder das zur Verfügung stehende Gitub Student Developer Pack verwendet.

## Quellen

[1] PouchDB, „PouchDB Guides,“ [Online]. Verfügbar unter: [Introduction to PouchDB](https://pouchdb.com/guides/) [Zugriff am: 20. Februar 2026].

[2] Vue.js, „Introduction | Vue.js,“ [Online]. Verfügbar unter: [Introduction | Vue.js](https://vuejs.org/guide/introduction) [Zugriff am: 20. Februar 2026].

[3] GitHub, „GitHub Actions Documentation,“ [Online]. Verfügbar unter: https://docs.github.com/en/actions [Zugriff am: 20. Februar 2026].

[4] Vue CLI, „@vue/cli-plugin-pwa | Vue CLI,“ [Online]. Verfügbar unter: [@vue/cli-plugin-pwa | Vue CLI](https://cli.vuejs.org/core-plugins/pwa.html#example-configuration) [Zugriff am: 20. Februar 2026].

[5] M. Bhayas, „html5-qrcode: Lightweight & robust QR Code & Barcode scanning library for HTML5,“ GitHub, [Online]. Verfügbar unter: [GitHub - mebjas/html5-qrcode: A cross platform HTML5 QR code reader. See end to end implementation at: https://scanapp.org](https://github.com/mebjas/html5-qrcode) [Zugriff am: 20. Februar 2026].

[6] Open Food Facts, „Open Food Facts Server API Documentation,“ [Online]. Verfügbar unter: [Introduction to Open Food Facts API documentation - Product Opener (Open Food Facts Server)](https://openfoodfacts.github.io/openfoodfacts-server/api/) [Zugriff am: 20. Februar 2026].
