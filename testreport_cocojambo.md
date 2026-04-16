# Testreport – Cocojambo

**Projektgruppe – TGM**

*Einkaufslisten-WebApp mit PWA & Offline-Sync*

Erstellt am: 10. April 2026

---

## 1. Übersicht

### Testframework & Umgebung

| Eigenschaft | Wert |
|---|---|
| **Framework** | Cypress 14 (Component Testing + E2E) |
| **Sprache** | JavaScript (Vue 3 + Pinia) |
| **Testarten** | Unit/Component Tests, E2E Tests |
| **Testverzeichnis** | `frontend/tests/unit/`, `frontend/tests/e2e/` |

### Gesamtergebnis

| Metrik | Anzahl |
|---|---|
| **Testdateien** | 15 Unit + 5 E2E |
| **Testfälle gesamt** | **285** |
| **Bestanden** | **285** |
| **Fehlgeschlagen** | **0** |
| **Übersprungen** | **0** |
| **Erfolgsquote** | **100 %** |

---

## 2. Unit- und Component-Tests

### 2.1 App – Username-Prompt (`App.cy.js`)

**Beschreibung:** Testet das initiale Onboarding-Verhalten der App (Username-Eingabe beim ersten Start).

| # | Testfall | Status |
|---|---|:---:|
| 1 | App – Username-Prompt: zeigt Username-Prompt wenn kein Username gesetzt | PASS |
| 2 | App – Username-Prompt: bestätigt Username und schließt Prompt bei Eingabe | PASS |
| 3 | App – Username-Prompt: Button ist deaktiviert bei leerem Feld | PASS |
| 4 | App – Username-Prompt: akzeptiert keinen Username ohne #-Hashtag | PASS |
| 5 | App – Username bereits gesetzt: zeigt keinen Prompt wenn Username vorhanden | PASS |
| 6 | App – Username bereits gesetzt: rendert Router-View direkt | PASS |
| 7 | Offline-Indikator: zeigt keinen Banner wenn online | PASS |

**Ergebnis:** 7 / 7 bestanden

---

### 2.2 HomeView (`HomeView.cy.js`)

**Beschreibung:** Testet die Hauptansicht mit Listen-Übersicht, Erstellen, Beitreten und Löschen von Einkaufslisten.

| # | Testfall | Status |
|---|---|:---:|
| 1 | renders the page header | PASS |
| 2 | shows the create button | PASS |
| 3 | calls loadLists on mount | PASS |
| 4 | shows empty state when no lists | PASS |
| 5 | shows list cards when lists exist | PASS |
| 6 | shows category badge for list with category | PASS |
| 7 | does not show category badge for list without category | PASS |
| 8 | opens the create modal on button click | PASS |
| 9 | closes modal on Abbrechen click | PASS |
| 10 | does not call createList when name is empty | PASS |
| 11 | calls createList with name and category on valid submit | PASS |
| 12 | closes modal after successful create | PASS |
| 13 | calls deleteList after confirmation | PASS |
| 14 | does not call deleteList when canceled | PASS |
| 15 | shows the correct list name in the delete modal | PASS |
| 16 | closes delete modal after successful deletion | PASS |
| 17 | shows the join button | PASS |
| 18 | opens the join modal on button click | PASS |
| 19 | closes join modal on Abbrechen click | PASS |
| 20 | shows error message when code is not found | PASS |
| 21 | calls joinList with entered code | PASS |
| 22 | closes join modal on successful join | PASS |

**Ergebnis:** 22 / 22 bestanden

---

### 2.3 ArticleListView – Ausblenden & Löschen (`ArticleListView.cy.js`)

**Beschreibung:** Testet die Artikelverwaltung: Anzeige, Ausblenden, Wiederherstellen und endgültiges Löschen von Artikeln.

| # | Testfall | Status |
|---|---|:---:|
| 1 | shows active articles | PASS |
| 2 | calls hideArticle when the hide button is clicked | PASS |
| 3 | does not call deleteArticle when hide button is clicked | PASS |
| 4 | hidden articles section is not shown when hiddenArticles is empty | PASS |
| 5 | shows toggle button when hiddenArticles exist | PASS |
| 6 | hidden articles list is collapsed by default | PASS |
| 7 | expands hidden articles on toggle click | PASS |
| 8 | collapses hidden articles on second toggle click | PASS |
| 9 | calls restoreArticle when restore button is clicked | PASS |
| 10 | calls deleteArticle when permanent delete button is clicked in hidden section | PASS |
| 11 | shows the count of hidden articles in the toggle button | PASS |
| 12 | shows price on article | PASS |
| 13 | shows price trend up indicator | PASS |
| 14 | shows total footer | PASS |

**Ergebnis:** 14 / 14 bestanden

---

### 2.4 ArticleListView – Suche (`ArticleListView.cy.js`)

**Beschreibung:** Testet die Suchfunktion (Story #11) mit Treffern aus aktueller Liste, anderen Listen und vergangenen Artikeln.

| # | Testfall | Status |
|---|---|:---:|
| 1 | shows the search input | PASS |
| 2 | does not show results panel when query is empty | PASS |
| 3 | does not show the clear button when query is empty | PASS |
| 4 | calls searchArticles when typing | PASS |
| 5 | shows clear button when query is not empty | PASS |
| 6 | clears search and hides results on clear button click | PASS |
| 7 | shows "In dieser Liste" group when inCurrentList results exist | PASS |
| 8 | shows "Aus anderen Listen" group when inOtherLists results exist | PASS |
| 9 | shows "Vergangene Artikel" group when inPast results exist | PASS |
| 10 | shows "Keine Artikel gefunden" when all result groups are empty | PASS |
| 11 | calls toggleChecked when clicking a result in current list | PASS |
| 12 | calls addFromSearch and clears query when clicking a result from other list | PASS |
| 13 | calls addFromSearch and clears query when clicking a past article | PASS |
| 14 | shows quantity and unit in search results | PASS |

**Ergebnis:** 14 / 14 bestanden

---

### 2.5 ArticleListView – Teilen (`ArticleListView.cy.js`)

**Beschreibung:** Testet das Teilen von Einkaufslisten via Share-Code (Story #5).

| # | Testfall | Status |
|---|---|:---:|
| 1 | shows the share button | PASS |
| 2 | opens share modal on button click | PASS |
| 3 | displays the share code in the modal | PASS |
| 4 | closes share modal on Schliessen click | PASS |

**Ergebnis:** 4 / 4 bestanden

---

### 2.6 ArticleListView – CSV Export (`ArticleListView.cy.js`)

**Beschreibung:** Testet den CSV-Export von Einkaufslisten inklusive Artikelinhalt und Sonderfälle (Story #30).

| # | Testfall | Status |
|---|---|:---:|
| 1 | shows the CSV export button | PASS |
| 2 | CSV export button has the correct label | PASS |
| 3 | triggers a download when CSV export button is clicked | PASS |
| 4 | does not crash when article list is empty | PASS |
| 5 | includes all visible articles in the CSV export | PASS |
| 6 | marks checked articles as "Ja" in the CSV | PASS |
| 7 | includes hidden articles in the CSV export | PASS |

**Ergebnis:** 7 / 7 bestanden

---

### 2.7 ArticleListView – Pickerl (`ArticleListView.pickerl.cy.js`)

**Beschreibung:** Testet die Rabatt-Pickerl-Ansicht für optimale Preissticker-Nutzung (Story #23).

| # | Testfall | Status |
|---|---|:---:|
| 1 | Pickerl button: zeigt den Pickerl-Button | PASS |
| 2 | Pickerl button: öffnet das Pickerl-Modal beim Klick | PASS |
| 3 | Pickerl button: schließt das Modal beim Klick auf Schließen | PASS |
| 4 | rabattfähig Artikel-Badge: zeigt Badge für Artikel mit Preis | PASS |
| 5 | rabattfähig Artikel-Badge: kein Badge für Artikel ohne Preis | PASS |
| 6 | rabattfähig Artikel-Badge: kein Badge für bereits abgehakte Artikel | PASS |
| 7 | Pickerl Modal Artikel-Sichtbarkeit: zeigt nur Artikel mit Preis im Modal | PASS |
| 8 | Pickerl Modal Artikel-Sichtbarkeit: zeigt Artikel ohne Preis nicht im Modal | PASS |
| 9 | Pickerl Modal Artikel-Sichtbarkeit: zeigt nur aktive (nicht versteckte) Artikel | PASS |
| 10 | Pickerl Modal Artikel-Sichtbarkeit: zeigt abgehakte Artikel nicht | PASS |
| 11 | Pickerl Preisberechnung: berechnet Ersparnis korrekt (25% Rabatt) | PASS |
| 12 | Pickerl Preisberechnung: berechnet Ersparnis korrekt (10% Rabatt) | PASS |
| 13 | Pickerl Preisberechnung: zeigt Gesamtbetrag aller Artikel im Modal | PASS |
| 14 | Pickerl Preisberechnung: markiert teuersten Artikel als Empfehlung | PASS |
| 15 | Pickerl Preisberechnung: zeigt "maximale Ersparnis" Betrag an | PASS |
| 16 | Pickerl Anwenden: markiert Artikel als ausgewählt beim Klick | PASS |
| 17 | Pickerl Anwenden: demarkiert Artikel beim zweiten Klick | PASS |
| 18 | Pickerl Anwenden: zeigt Gesamtersparnis für ausgewählte Artikel | PASS |
| 19 | Pickerl Anwenden: Anwenden-Button ist deaktiviert ohne Auswahl | PASS |
| 20 | Pickerl Anwenden: Anwenden-Button ist aktiv mit Auswahl | PASS |
| 21 | Pickerl Anwenden: ruft updateArticle für jeden ausgewählten Artikel auf | PASS |
| 22 | Pickerl Anwenden: schließt Modal nach dem Anwenden | PASS |

**Ergebnis:** 22 / 22 bestanden

---

### 2.8 ArticleStore – Notizen & Preisfunktionen (`article.store.cy.js`)

**Beschreibung:** Testet Store-Methoden für Notizen (Story #20) und Preiserfassung (Story #22).

| # | Testfall | Status |
|---|---|:---:|
| 1 | createArticle speichert eine normale Notiz korrekt | PASS |
| 2 | createArticle speichert eine leere Notiz als leeren String | PASS |
| 3 | createArticle speichert eine sehr lange Notiz vollständig | PASS |
| 4 | createArticle setzt note auf leeren String wenn undefined übergeben | PASS |
| 5 | updateArticle speichert die geänderte Notiz korrekt | PASS |
| 6 | updateArticle kann Notiz auf leeren String setzen | PASS |
| 7 | createArticle speichert Notiz mit Sonderzeichen korrekt | PASS |
| 8 | createArticle sets price and barcode when provided | PASS |
| 9 | createArticle defaults price and barcode to null | PASS |
| 10 | createArticle sets hidden to false explicitly | PASS |
| 11 | updatePrice adds history entry when price changes | PASS |
| 12 | updatePrice does nothing when price is the same | PASS |
| 13 | loadArticles caps priceHistory at 20 entries when many patches exist | PASS |

**Ergebnis:** 13 / 13 bestanden

---

### 2.9 BarcodeScanner (`BarcodeScanner.cy.js`)

**Beschreibung:** Testet den Barcode-Scanner zur Anzeige von Nährwerten (Story #32).

| # | Testfall | Status |
|---|---|:---:|
| 1 | Kameraansicht: zeigt Kamera-Platzhalter | PASS |
| 2 | Kameraansicht: zeigt Start-Button für Kamerastream | PASS |
| 3 | Kameraansicht: startet Kamerastream bei Klick | PASS |
| 4 | Kameraansicht: stoppt Kamerastream beim Verlassen | PASS |
| 5 | Kameraansicht: zeigt Scan-Overlay nach Kamerastart | PASS |
| 6 | Kameraansicht: zeigt manuellen Eingabe-Fallback | PASS |
| 7 | Manuelle Eingabe & API: gibt Produkt zurück bei gültigem Barcode | PASS |
| 8 | Manuelle Eingabe & API: zeigt Produktname und Nährwerte | PASS |
| 9 | Manuelle Eingabe & API: zeigt Kcal, Proteine, Fette, Kohlenhydrate | PASS |
| 10 | Manuelle Eingabe & API: zeigt Einheit des Nährwerts (per 100g) | PASS |
| 11 | Manuelle Eingabe & API: API wird mit dem richtigen Barcode aufgerufen | PASS |
| 12 | Manuelle Eingabe & API: deaktiviert Button während Anfrage läuft | PASS |
| 13 | Manuelle Eingabe & API: aktiviert Button nach Abschluss | PASS |
| 14 | Manuelle Eingabe & API: zeigt Nutriscore wenn verfügbar | PASS |
| 15 | Manuelle Eingabe & API: leert Eingabe nach Scan | PASS |
| 16 | Manuelle Eingabe & API: zeigt Hinweis für fehlende Nährwerte | PASS |
| 17 | Produkt nicht gefunden: zeigt Fehlermeldung bei 404 | PASS |
| 18 | Produkt nicht gefunden: zeigt Barcode in der Fehlermeldung | PASS |
| 19 | Produkt nicht gefunden: versteckt Nährwerttabelle | PASS |
| 20 | Produkt nicht gefunden: ermöglicht erneuten Scan nach Fehler | PASS |
| 21 | Netzwerkfehler: zeigt generische Fehlermeldung | PASS |
| 22 | Netzwerkfehler: zeigt Stack nicht in der UI | PASS |
| 23 | Netzwerkfehler: ermöglicht Retry nach Netzwerkfehler | PASS |
| 24 | Netzwerkfehler: deaktiviert Submit nicht dauerhaft nach Fehler | PASS |
| 25 | Netzwerkfehler: zeigt keinen alten Produkteintrag nach Fehler | PASS |

**Ergebnis:** 25 / 25 bestanden

---

### 2.10 Chronologische Sortierung (`chronologicalSorting.cy.js`)

**Beschreibung:** Testet die chronologische Sortierung von Listen und Artikeln (Story #4).

| # | Testfall | Status |
|---|---|:---:|
| 1 | loadLists() sortiert Listen absteigend nach createdAt – neueste zuerst | PASS |
| 2 | loadLists() sortiert Listen bei gleichem Timestamp stabil | PASS |
| 3 | loadLists() behandelt fehlende createdAt-Felder | PASS |
| 4 | loadArticles() sortiert Artikel aufsteigend nach createdAt – älteste zuerst | PASS |
| 5 | loadArticles() sortiert Hidden-Artikel ebenso aufsteigend | PASS |
| 6 | loadArticles() behandelt fehlende createdAt in Artikeln | PASS |
| 7 | loadArticles() unterscheidet Nanosekunden-Differenzen korrekt | PASS |
| 8 | loadArticles() sortiert korrekt über DST-Grenze hinweg | PASS |
| 9 | applyPatches() wendet Patches in editedAt-Reihenfolge an | PASS |
| 10 | applyPatches() ignoriert Patches mit fehlenden editedAt-Feldern | PASS |
| 11 | applyPatches() wendet mehrere Felder pro Patch an | PASS |
| 12 | applyPatches() behält letzten Wert bei mehreren Patches auf gleichem Feld | PASS |
| 13 | loadArticles() sortiert check-events nach checkedAt | PASS |
| 14 | loadArticles() berechnet checked-Status aus letztem check-event | PASS |
| 15 | loadArticles() ignoriert check-events ohne checkedAt | PASS |
| 16 | delete-intents: entfernt Artikel aus der sortierten Ansicht | PASS |
| 17 | delete-intents: entfernt mehrere Artikel gleichzeitig | PASS |
| 18 | HomeView – UI zeigt Listen in absteigender chronologischer Reihenfolge (3 Listen) | PASS |
| 19 | HomeView – UI: neueste Liste steht oben | PASS |
| 20 | HomeView – UI: älteste Liste steht unten | PASS |
| 21 | searchArticles() kategorisiert Artikel aus aktueller Liste korrekt | PASS |
| 22 | searchArticles() kategorisiert Artikel aus anderen Listen korrekt | PASS |
| 23 | searchArticles() kategorisiert vergangene (versteckte) Artikel korrekt | PASS |
| 24 | searchArticles() behält chronologische Reihenfolge in Suchergebnissen | PASS |
| 25 | searchArticles() gibt leere Gruppen zurück bei keinem Treffer | PASS |
| 26 | searchArticles() matcht case-insensitiv | PASS |
| 27 | searchArticles() matcht Teilstring im Artikelnamen | PASS |
| 28 | searchArticles() schließt Artikel der eigenen Liste aus anderen Listen aus | PASS |
| 29 | loadArticles() mit mehreren Patch-Typen kombiniert | PASS |
| 30 | loadArticles() behandelt leeres Patch-Array | PASS |
| 31 | applyPatches() mit leerem Array ändert nichts | PASS |
| 32 | applyPatches() mit einzelnem Patch | PASS |
| 33 | check-events: mehrere events auf denselben Artikel | PASS |
| 34 | check-events: letztes event bestimmt finalen Status | PASS |
| 35 | delete-intents: kein Artikel deleted wenn keine intents | PASS |
| 36 | loadLists() mit einzelner Liste | PASS |
| 37 | loadLists() mit keiner Liste ergibt leeres Array | PASS |
| 38 | loadLists() ignoriert non-list Dokumente | PASS |
| 39 | loadArticles() ignoriert non-article Dokumente | PASS |
| 40 | loadArticles() filtert nach listId | PASS |
| 41 | homeView rendert Listen korrekt | PASS |
| 42 | loadLists() sortiert nach createdAt desc mit ISO-Strings | PASS |
| 43 | applyPatches() verarbeitet note-Patches korrekt | PASS |
| 44 | check-events: unchecked-event nach checked-event | PASS |
| 45 | check-events: checked-event nach unchecked-event | PASS |
| 46 | applyPatches() verarbeitet checked-Patches | PASS |
| 47 | delete-intents: löscht nur Artikel der betreffenden Liste | PASS |
| 48 | searchArticles() schließt gelöschte Artikel aus | PASS |

**Ergebnis:** 48 / 48 bestanden

---

### 2.11 ManualSyncButton (`ManualSyncButton.cy.js`)

**Beschreibung:** Testet den manuellen Synchronisations-Button (Story #31) in verschiedenen Zuständen.

| # | Testfall | Status |
|---|---|:---:|
| 1 | Online/Offline State: ist disabled und zeigt Offline-Tooltip wenn navigator.onLine false | PASS |
| 2 | Online/Offline State: ist nicht disabled und zeigt Sync-Tooltip wenn navigator.onLine true | PASS |
| 3 | Online/Offline State: wird disabled wenn offline-Event gefeuert wird nach dem Mount | PASS |
| 4 | Syncing State: ist disabled wenn isSyncing true ist | PASS |
| 5 | Syncing State: zeigt den Spinner-SVG wenn isSyncing true ist | PASS |
| 6 | Syncing State: zeigt kein Refresh-Icon wenn isSyncing true ist | PASS |
| 7 | Syncing State: zeigt den Fortschrittsbalken wenn isSyncing true ist | PASS |
| 8 | Syncing State: zeigt keinen Fortschrittsbalken wenn nicht syncing | PASS |
| 9 | Syncing State: zeigt das Refresh-Icon wenn nicht syncing | PASS |
| 10 | Trigger Behaviour: ruft startSync auf wenn online und geklickt | PASS |
| 11 | Trigger Behaviour: triggert keinen Sync wenn offline | PASS |
| 12 | Trigger Behaviour: triggert keinen zweiten Sync wenn bereits syncint | PASS |

**Ergebnis:** 12 / 12 bestanden

---

### 2.12 manualSyncStore (`manualSync.store.cy.js`)

**Beschreibung:** Testet den Pinia-Store für den manuellen Sync-Mechanismus.

| # | Testfall | Status |
|---|---|:---:|
| 1 | startSync(): setzt isSyncing auf true | PASS |
| 2 | startSync(): setzt syncProgress auf 0 | PASS |
| 3 | startSync(): leert syncLogs | PASS |
| 4 | startSync(): ist idempotent wenn bereits syncing | PASS |
| 5 | startSync(): setzt lastSyncStartedAt | PASS |
| 6 | updateProgress(): setzt syncProgress auf übergebenen Wert | PASS |
| 7 | updateProgress(): clamped auf 0–100 | PASS |
| 8 | updateProgress(): fügt Log-Einträge hinzu | PASS |
| 9 | updateProgress(): behält maximal 100 Log-Einträge | PASS |
| 10 | finishSync(): setzt isSyncing auf false | PASS |
| 11 | finishSync(): setzt syncProgress auf 100 | PASS |
| 12 | finishSync(): setzt lastSyncAt | PASS |
| 13 | finishSync(): setzt syncError auf null | PASS |
| 14 | failSync(): setzt isSyncing auf false | PASS |
| 15 | failSync(): setzt syncError auf übergebene Nachricht | PASS |
| 16 | failSync(): setzt syncProgress nicht auf 100 | PASS |
| 17 | failSync(): setzt lastSyncAt nicht | PASS |
| 18 | clearLogs(): leert syncLogs | PASS |
| 19 | clearLogs(): setzt syncError auf null | PASS |
| 20 | clearLogs(): lässt isSyncing unverändert | PASS |
| 21 | clearLogs(): lässt lastSyncAt unverändert | PASS |
| 22 | Gesamtzustand nach vollständigem Sync-Zyklus | PASS |
| 23 | Gesamtzustand nach fehlgeschlagenem Sync-Zyklus | PASS |
| 24 | updateProgress(): überschreibt keinen syncError | PASS |
| 25 | startSync() nach failSync(): resettet Fehlerstate | PASS |
| 26 | finishSync() ohne vorheriges startSync() | PASS |
| 27 | updateProgress() ohne vorheriges startSync() | PASS |

**Ergebnis:** 27 / 27 bestanden

---

### 2.13 OCR Preiserkennung (`ocrPrice.cy.js`)

**Beschreibung:** Testet die Hilfsfunktion zur Preisextraktion aus OCR-Text für die Preisfoto-Funktion (Story #22).

| # | Testfall | Status |
|---|---|:---:|
| 1 | extracts € prefix with comma decimal (€ 2,49) | PASS |
| 2 | extracts € prefix without space (€2,49) | PASS |
| 3 | extracts € suffix with comma decimal (2,49 €) | PASS |
| 4 | extracts € suffix without space (2,49€) | PASS |
| 5 | extracts EUR prefix (EUR 3,99) | PASS |
| 6 | falls back to dot decimal when no currency match | PASS |
| 7 | prefers currency matches over dot decimal | PASS |
| 8 | extracts multiple prices | PASS |
| 9 | filters out prices below 0.01 | PASS |
| 10 | returns empty array for non-price text | PASS |
| 11 | handles whitespace variations | PASS |
| 12 | handles three-digit amounts (€ 12,99) | PASS |

**Ergebnis:** 12 / 12 bestanden

---

### 2.14 Offline-Indikator / Online-Status (`onlineStatus.cy.js`)

**Beschreibung:** Testet den Offline-Banner und die Online-Status-Überwachung.

| # | Testfall | Status |
|---|---|:---:|
| 1 | zeigt keinen Banner wenn online | PASS |
| 2 | zeigt den Offline-Banner wenn offline | PASS |
| 3 | Banner verschwindet wenn Verbindung wiederhergestellt wird | PASS |
| 4 | reagiert auf das offline-Event des Browsers | PASS |
| 5 | reagiert auf das online-Event des Browsers | PASS |

**Ergebnis:** 5 / 5 bestanden

---

### 2.15 ShoppingListStore (`shoppingList.store.cy.js`)

**Beschreibung:** Testet Store-Logik für Listen-Erstellung, Laden, Beitreten, Verlassen und Löschen.

| # | Testfall | Status |
|---|---|:---:|
| 1 | createList setzt members mit eigenem Username | PASS |
| 2 | createList generiert einen 6-stelligen shareCode | PASS |
| 3 | loadLists: zeigt nur Listen in denen der eigene Username enthalten ist | PASS |
| 4 | loadLists: zeigt Listen ohne members-Array (Rückwärtskompatibilität) | PASS |
| 5 | joinList: gibt null zurück wenn kein passender Code gefunden wird | PASS |
| 6 | joinList: fügt Username zu members hinzu bei gültigem Code | PASS |
| 7 | joinList: akzeptiert Code case-insensitive | PASS |
| 8 | joinList: fügt Username nicht doppelt hinzu wenn bereits Mitglied | PASS |
| 9 | leaveList: entfernt Username aus members wenn andere Mitglieder vorhanden | PASS |
| 10 | leaveList: löscht Liste und Artikel wenn letztes Mitglied verlässt | PASS |
| 11 | leaveList: löscht keine Artikel aus anderen Listen | PASS |
| 12 | deleteList: ruft db.remove mit id und rev auf | PASS |
| 13 | deleteList: aktualisiert die Listenansicht nach dem Löschen | PASS |

**Ergebnis:** 13 / 13 bestanden

---

### 2.16 Sync-Store – Konfliktauflösung (`sync.store.cy.js`)

**Beschreibung:** Testet die Synchronisierungslogik mit Konflikterkennung und CRDT-artigem Merge (Story #3).

| # | Testfall | Status |
|---|---|:---:|
| 1 | Delete wins: delete-intent überschreibt alle anderen Patches | PASS |
| 2 | Delete wins: delete-intent mit älterem Timestamp gewinnt trotzdem | PASS |
| 3 | Delete wins: kein Artikel wird angezeigt nach delete-intent | PASS |
| 4 | Delete wins: mehrere delete-intents werden dedupliziert | PASS |
| 5 | Last-Write-Wins: neuerer Patch überschreibt älteren bei gleichem Feld | PASS |
| 6 | Last-Write-Wins: älterer Patch wird ignoriert | PASS |
| 7 | Last-Write-Wins: gleichzeitige Patches – deterministisches Ergebnis | PASS |
| 8 | Last-Write-Wins: unterschiedliche Felder werden unabhängig gemerged | PASS |
| 9 | Field-Level Merge: name-Patch und note-Patch werden beide angewendet | PASS |
| 10 | Field-Level Merge: quantity und unit werden als atomares Paar behandelt | PASS |
| 11 | Field-Level Merge: überlebt fehlende Felder in Patches | PASS |
| 12 | Menge/Einheit: quantity-Änderung zieht unit-Änderung mit | PASS |
| 13 | Menge/Einheit: unit-Änderung alleine ist ungültig | PASS |
| 14 | Menge/Einheit: atomares Paar bleibt konsistent bei Konflikten | PASS |
| 15 | Check-Events: letztes event bestimmt checked-Status | PASS |
| 16 | Check-Events: checked nach unchecked ist checked | PASS |
| 17 | Check-Events: unchecked nach checked ist unchecked | PASS |
| 18 | Check-Events: identische Timestamps – deterministisches Ergebnis | PASS |
| 19 | Check-Events: check-events ohne Timestamp werden ignoriert | PASS |

**Ergebnis:** 19 / 19 bestanden

---

### 2.17 Dark/Light Mode (`theme.cy.js`)

**Beschreibung:** Testet den Theme-Toggle zwischen Dark Mode und Light Mode (Story #21).

| # | Testfall | Status |
|---|---|:---:|
| 1 | startet standardmäßig im Light Mode | PASS |
| 2 | zeigt den Dark-Mode-Toggle-Button | PASS |
| 3 | wechselt zu Dark Mode bei Klick auf den Toggle | PASS |
| 4 | wechselt zurück zu Light Mode bei erneutem Klick | PASS |
| 5 | speichert die Auswahl in localStorage | PASS |
| 6 | speichert Light Mode in localStorage nach Zurückwechseln | PASS |
| 7 | lädt Dark Mode aus localStorage | PASS |
| 8 | zeigt Sonnen-Icon im Dark Mode und Mond-Icon im Light Mode | PASS |
| 9 | Theme Store: isDark ist false standardmäßig | PASS |
| 10 | Theme Store: isDark ist true wenn localStorage "dark" gesetzt ist | PASS |
| 11 | Theme Store: toggle() wechselt isDark | PASS |
| 12 | Theme Store: toggle() aktualisiert localStorage | PASS |
| 13 | Theme Store: toggle() setzt die dark-Klasse auf documentElement | PASS |

**Ergebnis:** 13 / 13 bestanden

---

### 2.18 Username (`username.cy.js`)

**Beschreibung:** Testet die Username-Validierung und Hilfsfunktionen.

| # | Testfall | Status |
|---|---|:---:|
| 1 | Hilfsfunktionen: getUsername gibt null zurück wenn nicht gesetzt | PASS |
| 2 | Hilfsfunktionen: getUsername gibt gesetzten Username zurück | PASS |
| 3 | Hilfsfunktionen: isValidUsername akzeptiert gültige Benutzernamen | PASS |
| 4 | Hilfsfunktionen: isValidUsername lehnt Namen ohne # ab | PASS |
| 5 | Hilfsfunktionen: isValidUsername lehnt leeren String ab | PASS |
| 6 | Hilfsfunktionen: isValidUsername lehnt Namen ohne Suffix nach # ab | PASS |
| 7 | Hilfsfunktionen: isValidUsername lehnt Namen mit zu kurzem Suffix ab | PASS |
| 8 | Hilfsfunktionen: generateUsername fügt #-Suffix hinzu | PASS |

**Ergebnis:** 8 / 8 bestanden

---

## 3. E2E-Tests

### 3.1 Article Prices (`article-prices.cy.js`)

**Beschreibung:** End-to-End-Test für Preiserfassung und Preisverlauf-Anzeige (Story #22).

| # | Testfall | Status |
|---|---|:---:|
| 1 | zeigt Preis am Artikel | PASS |
| 2 | zeigt Preishistorie-Indikator | PASS |
| 3 | öffnet Preishistorie-Modal | PASS |
| 4 | zeigt Preistrend korrekt (steigend/fallend) | PASS |

**Ergebnis:** 4 / 4 bestanden

---

### 3.2 Dark Mode (`darkmode.cy.js`)

**Beschreibung:** End-to-End-Test für das Dark-Mode-Toggle (Story #21).

| # | Testfall | Status |
|---|---|:---:|
| 1 | startet im Light Mode | PASS |
| 2 | wechselt zu Dark Mode | PASS |
| 3 | behält Dark Mode nach Reload | PASS |

**Ergebnis:** 3 / 3 bestanden

---

### 3.3 Discounts / Pickerl (`discounts.cy.js`)

**Beschreibung:** End-to-End-Test für die Rabatt-Pickerl-Ansicht (Story #23).

| # | Testfall | Status |
|---|---|:---:|
| 1 | zeigt Pickerl-Button in Artikelliste | PASS |
| 2 | öffnet Pickerl-Modal und zeigt Artikel mit Preisen | PASS |
| 3 | berechnet und zeigt maximale Ersparnis | PASS |
| 4 | markiert Artikel und übernimmt Pickerl | PASS |

**Ergebnis:** 4 / 4 bestanden

---

### 3.4 Notizen (`notes.cy.js`)

**Beschreibung:** End-to-End-Test für Artikelnotizen (Story #20).

| # | Testfall | Status |
|---|---|:---:|
| 1 | zeigt Notiz-Eingabefeld beim Erstellen | PASS |
| 2 | speichert Notiz korrekt | PASS |
| 3 | zeigt gespeicherte Notiz am Artikel | PASS |
| 4 | bearbeitet Notiz nachträglich | PASS |

**Ergebnis:** 4 / 4 bestanden

---

### 3.5 Username (`username.cy.js`)

**Beschreibung:** End-to-End-Test für das Username-Onboarding.

| # | Testfall | Status |
|---|---|:---:|
| 1 | zeigt Username-Prompt beim ersten Besuch | PASS |
| 2 | akzeptiert gültigen Username und navigiert weiter | PASS |
| 3 | zeigt Fehlermeldung bei ungültigem Format | PASS |

**Ergebnis:** 3 / 3 bestanden

---

## 4. Abdeckung nach User Story

| Story | Beschreibung | Verantw. | Testdatei(en) | Testfälle |
|:---:|---|:---:|---|:---:|
| #1 | Einkaufslisten erstellen | Parushev | `HomeView.cy.js`, `shoppingList.store.cy.js` | 15 |
| #2 | Offline-Zugriff | Bulic | `onlineStatus.cy.js`, `sync.store.cy.js` | 10 |
| #3 | Automatische Synchronisierung | Bulic | `sync.store.cy.js`, `manualSync.store.cy.js` | 28 |
| #4 | Chronologische Anzeige | Schmid | `chronologicalSorting.cy.js` | 48 |
| #5 | Listen teilen via Code | Parushev | `ArticleListView.cy.js` (Teilen), `shoppingList.store.cy.js` | 8 |
| #6 | Artikel hinzufügen & bearbeiten | Chladek | `ArticleListView.cy.js`, `article.store.cy.js` | 17 |
| #7 | Artikel ausblenden & löschen | Chladek | `ArticleListView.cy.js` (Ausblenden) | 14 |
| #8 | Listen verlassen | Yüksel | `shoppingList.store.cy.js` | 3 |
| #9 | Ausgeblendete Artikel wiederherstellen | Yüksel | `ArticleListView.cy.js` | 3 |
| #10 | PWA | Schmid | (Manifest & Service Worker) | — |
| #11 | Suchfeld | Yüksel | `ArticleListView.cy.js` (Suche) | 14 |
| #20 | Notizen | Bulic | `article.store.cy.js`, `notes.cy.js` | 11 |
| #21 | Dark-/Lightmode | Parushev | `theme.cy.js`, `darkmode.cy.js` | 16 |
| #22 | Preisfoto / OCR | Chladek | `ocrPrice.cy.js`, `article.store.cy.js`, `article-prices.cy.js` | 19 |
| #23 | Pickerl-Ansicht | Schmid | `ArticleListView.pickerl.cy.js`, `discounts.cy.js` | 26 |
| #30 | CSV-Export | Yüksel | `ArticleListView.cy.js` (CSV) | 7 |
| #31 | Manueller Sync-Button | Parushev | `ManualSyncButton.cy.js`, `manualSync.store.cy.js` | 39 |
| #32 | Barcode-Scanner | Schmid | `BarcodeScanner.cy.js` | 25 |

---

## 5. Gesamtzusammenfassung

### Testergebnisse nach Datei

| Testdatei | Testart | Testfälle | Bestanden | Fehlgeschlagen |
|---|:---:|:---:|:---:|:---:|
| `App.cy.js` | Unit | 7 | 7 | 0 |
| `HomeView.cy.js` | Unit | 22 | 22 | 0 |
| `ArticleListView.cy.js` | Unit | 39 | 39 | 0 |
| `ArticleListView.pickerl.cy.js` | Unit | 22 | 22 | 0 |
| `article.store.cy.js` | Unit | 13 | 13 | 0 |
| `BarcodeScanner.cy.js` | Unit | 25 | 25 | 0 |
| `chronologicalSorting.cy.js` | Unit | 48 | 48 | 0 |
| `ManualSyncButton.cy.js` | Unit | 12 | 12 | 0 |
| `manualSync.store.cy.js` | Unit | 27 | 27 | 0 |
| `ocrPrice.cy.js` | Unit | 12 | 12 | 0 |
| `onlineStatus.cy.js` | Unit | 5 | 5 | 0 |
| `shoppingList.store.cy.js` | Unit | 13 | 13 | 0 |
| `sync.store.cy.js` | Unit | 19 | 19 | 0 |
| `theme.cy.js` | Unit | 13 | 13 | 0 |
| `username.cy.js` | Unit | 8 | 8 | 0 |
| `article-prices.cy.js` | E2E | 4 | 4 | 0 |
| `darkmode.cy.js` | E2E | 3 | 3 | 0 |
| `discounts.cy.js` | E2E | 4 | 4 | 0 |
| `notes.cy.js` | E2E | 4 | 4 | 0 |
| `username.cy.js` | E2E | 3 | 3 | 0 |
| **Gesamt** | | **285** | **285** | **0** |

### Leistung nach Teammitglied

| Name | Verantw. Stories | Abgedeckte Testfälle |
|---|:---:|:---:|
| Simon Chladek | #6, #7, #9, #22, #33 | ~53 |
| Christian Parushev | #1, #5, #21, #24, #31 | ~78 |
| Jeanette Schmid | #4, #10, #23, #32 | ~76 |
| Lazar Bulic | #2, #3, #20 | ~49 |
| Eren Yüksel | #8, #9, #11, #30 | ~27 |

---

## 6. Fazit

Die Testabdeckung des Projekts ist umfassend. Alle **285 Testfälle** wurden erfolgreich ausgeführt, was einer Erfolgsquote von **100 %** entspricht. Die Tests decken alle abgeschlossenen User Stories ab und umfassen sowohl Unit/Component-Tests als auch End-to-End-Tests.

Besonders hervorzuheben:

- **Chronologische Sortierung** (Story #4, Schmid): Mit 48 Testfällen die umfangreichste Testsuite, die Edge Cases wie DST-Grenzen, Nanosekunden-Differenzen und fehlende Timestamps abdeckt.
- **Sync-Konfliktauflösung** (Story #3, Bulic): 19 + 27 Tests sichern das komplexe CRDT-basierte Merge-Verhalten ab.
- **Barcode-Scanner** (Story #32, Schmid): 25 Tests für Kamerastream, API-Kommunikation und Fehlerbehandlung.
- **Manueller Sync** (Story #31, Parushev): 39 Tests für Button-Zustände, Store-Logik und Trigger-Verhalten.
