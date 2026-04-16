# ARBEITSREPORT

**Projektgruppe -- TGM**

*Einkaufslisten-WebApp mit PWA & Offline-Sync*

Erstellt am: 09. April 2026

| Rolle | Name | Funktion |
|---|---|---|
| **Product Owner** | Simon Chladek | Projektleitung & PO |
| **Technical Architect** | Christian Parushev | Architektur & Technik |
| **A-Meise** | Jeanette Schmid | Entwicklung & QA |
| **B-Meise** | Lazar Bulic | Entwicklung & QA |
| **C-Meise** | Eren Yüksel | Entwicklung & Testing |

---

## 1. Einleitung

Dieser Report dokumentiert die geleistete Arbeit der Projektgruppe im Rahmen des Schulprojekts am TGM. Ziel des Projekts war die Entwicklung einer progressiven Web-Applikation (PWA) zur Verwaltung von Einkaufslisten mit Offline-Funktionalität und Echtzeit-Synchronisierung.

Die Arbeit wurde in Form von User Stories organisiert und nach dem Storypoint-System bewertet. Ein Storypoint (SP) entspricht einer Pomodoro-Einheit von 40 Minuten.

---

## 2. Gesamtübersicht der User Stories

Die folgende Tabelle enthält alle User Stories des Projekts mit aktuellem Status.

| ID | Beschreibung | SP | Verantw. | Prio | Status |
|:---:|---|:---:|:---:|:---:|:---:|
| 1 | Einkaufslisten mit Namen und Kategorie erstellen | 5 | Parushev | MH | Closed |
| 2 | Offline auf Listen zugreifen | 5 | Bulic | MH | Closed |
| 3 | Automatische Synchronisierung bei Internetverfügbarkeit | 8 | Bulic | MH | Closed |
| 4 | Chronologische Anzeige der Änderungen nach Synchronisierung | 5 | Schmid | MH | Closed |
| 5 | Codes für Einkaufslisten erstellen und teilen | 5 | Parushev | MH | Closed |
| 6 | Artikel zu Listen hinzufügen und bearbeiten | 5 | Chladek | MH | Closed |
| 7 | Artikel ausblenden, in Extra-Bereich einsehen und endgültig löschen | 8 | Chladek | MH | Closed |
| 8 | Listen verlassen; letzte Person löscht die Liste | 5 | Yüksel | MH | Closed |
| 9 | Ausgeblendete Artikel wieder in Ursprungsliste hinzufügen | 3 | Yüksel | MH | Closed |
| 10 | Webapp als PWA lokal herunterladen | 3 | Schmid | MH | Closed |
| 11 | Suchfeld für Produkte in Listen und Vergangenheit | 5 | Yüksel | MH | Closed |
| 20 | Notizen zu Artikeln hinzufügen | 3 | Bulic | SH | Closed |
| 21 | Dark-/Lightmode umschalten | 3 | Parushev | SH | Closed |
| 22 | Bild vom Preis des Artikels aufnehmen und zuordnen | 5 | Chladek | SH | Closed |
| 23 | Ansicht für optimale Pickerl-Nutzung (z.B. 25%-Rabatt) | 3 | Schmid | SH | In Progress |
| 24 | Benachrichtigungen bei Änderungen in geteilten Listen | 5 | Parushev | SH | In Progress |
| 30 | Listen als CSV-Datei exportieren | 5 | Yüksel | N2H | Closed |
| 31 | Manueller Synchronisations-Button | 3 | Parushev | N2H | Closed |
| 32 | Barcode scannen und Nährwerte anzeigen | 8 | Schmid | N2H | Closed |
| 33 | Rechnung einscannen und Produkte abhaken | 5 | Chladek | N2H | In Progress |

**Legende:** MH = Must Have | SH = Should Have | N2H = Nice to Have

---

## 3. Teamleistung im Überblick

Zusammenfassung der erbrachten Leistung je Teammitglied basierend auf den abgeschlossenen GitHub Issues.

| Name | Rolle | Stories | Closed | In Progress | SP done |
|---|---|:---:|:---:|:---:|:---:|
| **Simon Chladek** | Product Owner | 4 | 3 / 4 | 1 | 18 / 23 |
| **Christian Parushev** | Technical Architect | 5 | 4 / 5 | 1 | 16 / 21 |
| **Jeanette Schmid** | A-Meise | 4 | 3 / 4 | 1 | 16 / 19 |
| **Lazar Bulic** | B-Meise | 3 | 3 / 3 | 0 | 16 / 16 |
| **Eren Yüksel** | C-Meise | 4 | 4 / 4 | 0 | 18 / 18 |

---

## 4. Individuelle Leistungsbewertung

### 4.1 Simon Chladek -- Product Owner

**Storypoints gesamt: 23 | Großteil der Stories abgeschlossen, eine in Bearbeitung**

*Verantwortliche Stories: #6, #7, #22, #33*

Simon Chladek hat als Product Owner neben der Projektleitung auch aktiv an der Entwicklung mitgewirkt. Er übernahm die Artikel-Verwaltung (#6) sowie die technisch anspruchsvolle Ausblend- und Löschlogik (#7, 8 SP). Im Should-Have-Bereich realisierte er die Preiserfassung per Kamerabild (#22). Die Rechnungsscan-Funktion (#33) befindet sich noch in Bearbeitung. Mit 23 SP trägt er die höchste Storypoint-Last im Team.

- Stärken: Projektleitung und gleichzeitig hohe Entwicklungsleistung, komplexe UI-Logik
- Offen: Story #33 (In Progress) -- Rechnungsscan und Artikel abhaken

### 4.2 Christian Parushev -- Technical Architect

**Storypoints gesamt: 21 | Großteil der Stories abgeschlossen, eine in Bearbeitung**

*Verantwortliche Stories: #1, #5, #21, #24, #31*

Christian Parushev hat als Technical Architect eine zentrale Rolle übernommen und den Großteil seiner zugewiesenen User Stories erfolgreich abgeschlossen. Er war verantwortlich für das Kernstück der Applikation -- die Erstellung von Einkaufslisten (#1) sowie das Teilen via Codes (#5). Zusätzlich realisierte er den Dark-/Lightmode (#21) und den manuellen Synchronisations-Button (#31). Die Story #24 (Push-Benachrichtigungen bei Änderungen) befindet sich noch in Bearbeitung, was angesichts der technischen Komplexität dieser Anforderung nachvollziehbar ist.

- Stärken: Breite technische Abdeckung, solides Architekturverständnis
- Offen: Story #24 (In Progress) -- Echtzeit-Benachrichtigungen

### 4.3 Jeanette Schmid -- A-Meise

**Storypoints gesamt: 19 | Großteil der Stories abgeschlossen, eine in Bearbeitung**

*Verantwortliche Stories: #4, #10, #23, #32*

Jeanette Schmid hat mit 19 SP eine hohe Storypoint-Last getragen. Sie war für die chronologische Anzeige von Änderungen (#4) sowie die PWA-Offline-Funktionalität (#10) zuständig. Darüber hinaus lieferte sie den Barcode-Scanner mit Nährwertanzeige (#32, 8 SP) ab -- eine technisch sehr aufwändige Story. Die Pickerl-Ansicht (#23) befindet sich noch in Bearbeitung.

- Stärken: Komplexe Backend-Logik, hohe technische Tiefe
- Offen: Story #23 (In Progress) -- Pickerl-Optimierungsansicht

### 4.4 Lazar Bulic -- B-Meise

**Storypoints gesamt: 16 | Alle zugewiesenen Stories: Closed**

*Verantwortliche Stories: #2, #3, #20*

Lazar Bulic hat alle ihm zugewiesenen User Stories erfolgreich abgeschlossen. Er war für die Offline-Zugriffsfunktionalität (#2) sowie die technisch anspruchsvolle automatische Synchronisierung bei Internetverfügbarkeit (#3, 8 SP) verantwortlich. Zusätzlich hat er die Notizfunktion für Artikel (#20) vollständig umgesetzt. Es ist anzumerken, dass er zu Projektbeginn mit einem verzögerten Setup konfrontiert war, was den Einstieg in die aktive Entwicklung erschwert hat. Die Gesamtleistung ist unter Berücksichtigung der Setup-Problematik als sehr positiv zu bewerten.

- Stärken: Vollständige Umsetzung trotz erschwerter Anfangsbedingungen, komplexe Sync-Logik
- Hinweis: Anfängliche Setup-Verzögerungen wurden gut kompensiert

### 4.5 Eren Yüksel -- C-Meise

**Storypoints gesamt: 18 | Alle zugewiesenen Stories: Closed**

*Verantwortliche Stories: #8, #9, #11, #30*

Eren Yüksel hat trotz eines besonderen Umstands -- er arbeitete bewusst ohne KI-Unterstützung (Claude) -- vier Stories eigenverantwortlich umgesetzt. Aufgrund dieses Verzichts verlief die Entwicklung naturgemäß langsamer, was sich jedoch in einer deutlich intensiveren Testaktivität niederschlug. Yüksel hat damit eine wichtige Qualitätssicherungsfunktion für das gesamte Team übernommen. Stories wie das Verlassen von Listen (#8), die Wiederherstellung ausgeblendeter Artikel (#9), das Suchfeld (#11) und der CSV-Export (#30) wurden vollständig umgesetzt.

- Stärken: Intensives Testing, eigenständige Entwicklung ohne KI-Tools
- Besondere Leistung: Übernahme einer erweiterten QA-Rolle für das Team

---

## 5. Offene und abgeschlossene Stories

Von insgesamt 20 User Stories sind:

- **17 Stories vollständig abgeschlossen (Closed)**
- **3 Stories noch in Bearbeitung (In Progress): #23, #24, #33**

### Offene Stories im Detail

| ID | Beschreibung | Prio | Verantw. | SP |
|:---:|---|:---:|:---:|:---:|
| 23 | Ansicht für optimale Pickerl-Nutzung (z.B. 25%-Rabatt) | SH | Schmid | 3 |
| 24 | Benachrichtigungen bei Änderungen in geteilten Listen | SH | Parushev | 5 |
| 33 | Rechnung einscannen und Produkte abhaken | N2H | Chladek | 5 |

---

## 6. Fazit

Das Projektteam hat insgesamt eine solide und engagierte Leistung erbracht. 17 von 20 User Stories wurden vollständig abgeschlossen, was einer Abschlussquote von 85 % entspricht. Die noch offenen Stories (#23, #24, #33) befinden sich in einem fortgeschrittenen Bearbeitungsstand.

Die Storypoint-Verteilung (16--23 SP je Person) zeigt eine faire Aufgabenverteilung, wobei Simon Chladek als Product Owner mit 23 SP die höchste Last trug. Die individuellen Herausforderungen -- Setup-Verzögerungen bei Bulic und bewusst tool-agnostische Entwicklung bei Yüksel -- wurden vom Team gut aufgefangen.

Die technische Tiefe des Projekts (PWA, Offline-Sync, Barcode-Scanner, Real-Time-Benachrichtigungen) ist für ein Schulprojekt bemerkenswert und zeugt von hoher Motivation und Eigeninitiative aller Beteiligten.
