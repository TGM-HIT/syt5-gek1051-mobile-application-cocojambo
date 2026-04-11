describe('Username-Prompt', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      win.localStorage.removeItem('username')
      win.localStorage.setItem('__cypress_skip_seed', '1')
    })
    cy.reload()
  })

  it('zeigt Username-Prompt bei erstem Besuch', () => {
    cy.get('[data-cy="username-prompt"]').should('be.visible')
    cy.contains('Willkommen!').should('be.visible')
    cy.get('[data-cy="username-input"]').should('be.visible')
  })

  it('blockiert App-Zugriff ohne Username', () => {
    cy.get('[data-cy="username-prompt"]').should('be.visible')
    cy.get('h1').should('not.exist')
  })

  it('erlaubt App-Zugriff nach Username-Eingabe', () => {
    cy.get('[data-cy="username-input"]').type('E2EUser')
    cy.get('[data-cy="username-submit"]').click()
    cy.get('[data-cy="username-prompt"]').should('not.exist')
    cy.get('h1').should('contain', 'Einkaufslisten')
  })

  it('speichert Username mit Suffix in localStorage', () => {
    cy.get('[data-cy="username-input"]').type('PersistTest')
    cy.get('[data-cy="username-submit"]').click()
    cy.window().then((win) => {
      const username = win.localStorage.getItem('username')
      expect(username).to.match(/^PersistTest#[0-9a-f]{4}$/)
    })
  })

  it('Username bleibt nach Seitenreload gesetzt', () => {
    cy.get('[data-cy="username-input"]').type('ReloadTest')
    cy.get('[data-cy="username-submit"]').click()
    cy.get('h1').should('contain', 'Einkaufslisten')
    cy.reload()
    cy.get('[data-cy="username-prompt"]').should('not.exist')
    cy.get('h1').should('contain', 'Einkaufslisten')
  })
})

describe('Benutzername ändern', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      win.localStorage.setItem('username', 'TestUser#abcd')
      win.localStorage.setItem('__cypress_skip_seed', '1')
    })
    cy.reload()
    cy.get('[data-cy="rename-username-btn"]').should('be.visible')
  })

  it('zeigt aktuellen Displaynamen im Header-Button', () => {
    cy.get('[data-cy="rename-username-btn"]').should('contain', 'TestUser')
  })

  it('öffnet das Rename-Modal beim Klick auf den Username-Button', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-modal"]').should('be.visible')
  })

  it('befüllt das Eingabefeld mit dem aktuellen Displaynamen', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').should('have.value', 'TestUser')
  })

  it('schließt das Modal beim Klick auf Abbrechen ohne Änderung', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').clear().type('SollNichtGespeichertWerden')
    cy.contains('Abbrechen').click()
    cy.get('[data-cy="rename-modal"]').should('not.exist')
    cy.get('[data-cy="rename-username-btn"]').should('contain', 'TestUser')
  })

  it('ändert den angezeigten Namen nach erfolgreichem Speichern', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').clear().type('NeuerName')
    cy.get('[data-cy="rename-submit"]').click()
    cy.get('[data-cy="rename-modal"]').should('not.exist')
    cy.get('[data-cy="rename-username-btn"]').should('contain', 'NeuerName')
  })

  it('speichert neuen Namen mit unverändertem Suffix in localStorage', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').clear().type('NeuerName')
    cy.get('[data-cy="rename-submit"]').click()
    cy.get('[data-cy="rename-modal"]').should('not.exist')
    cy.window().its('localStorage').invoke('getItem', 'username').should('equal', 'NeuerName#abcd')
  })

  it('zeigt Fehlermeldung wenn der Name ein # enthält', () => {
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').clear().type('Ungültig#Name')
    cy.get('[data-cy="rename-submit"]').click()
    cy.get('[data-cy="rename-modal"]').should('be.visible')
    cy.contains('Der Name darf kein # enthalten.').should('be.visible')
  })

  it('lässt den localStorage-Wert unverändert bei ungültigem Namen', () => {
    cy.window().then((win) => {
      const before = win.localStorage.getItem('username')
      cy.get('[data-cy="rename-username-btn"]').click()
      cy.get('[data-cy="rename-input"]').clear().type('Bad#Input')
      cy.get('[data-cy="rename-submit"]').click()
      cy.window().then((win2) => {
        expect(win2.localStorage.getItem('username')).to.equal(before)
      })
    })
  })

  it('aktualisiert checkedBy in bestehenden check-events nach Umbenennung', () => {
    // Artikel erstellen und abhaken, dann umbenennen
    cy.visit('/')
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('Erstellen').click()
    cy.contains('Testliste').click()
    cy.contains('+ Artikel').click()
    cy.get('input[placeholder="z.B. Milch"]').type('Testartikel')
    cy.contains('Hinzufügen').click()
    cy.contains('p', 'Testartikel').parent().parent().find('input[type="checkbox"]').check()

    // Zurück zur Startseite und umbenennen
    cy.go('back')
    cy.get('[data-cy="rename-username-btn"]').click()
    cy.get('[data-cy="rename-input"]').clear().type('UmbenannterUser')
    cy.get('[data-cy="rename-submit"]').click()

    // Zur Liste navigieren und prüfen ob neuer Name erscheint
    cy.contains('Testliste').click()
    cy.contains('UmbenannterUser').should('be.visible')
  })
})
