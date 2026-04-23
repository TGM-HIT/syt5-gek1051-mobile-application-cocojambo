describe('Notizen zu Artikeln', () => {
  const listName = 'Notiz-Testliste'

  function createListAndOpen() {
    cy.visit('/')
    cy.clearPouchDB()
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type(listName)
    cy.contains('button', 'Erstellen').click()
    cy.contains(listName).click()
  }

  function addArticle(name, { quantity, packageUnit, note } = {}) {
    cy.contains('button', '+ Artikel').click()
    cy.get('input[placeholder="z.B. Milch"]').type(name)
    if (quantity) {
      cy.get('input[type="number"]').first().clear().type(quantity)
    }
    if (packageUnit) {
      cy.get('input[placeholder="z.B. kg"]').type(packageUnit)
    }
    if (note) {
      cy.get('input[placeholder="z.B. Bio-Qualität"]').type(note)
    }
    cy.contains('button', 'Hinzufügen').click()
  }

  beforeEach(() => {
    createListAndOpen()
  })

  it('zeigt das Notiz-Feld im Erstellen-Modal', () => {
    cy.contains('button', '+ Artikel').click()
    cy.get('input[placeholder="z.B. Bio-Qualität"]').should('be.visible')
  })

  it('erstellt einen Artikel mit Notiz und zeigt sie in der Liste an', () => {
    addArticle('Milch', { note: 'Nur Bio' })
    cy.contains('Milch').should('be.visible')
    cy.contains('Nur Bio').should('be.visible')
  })

  it('erstellt einen Artikel ohne Notiz — keine Notiz wird angezeigt', () => {
    addArticle('Brot')
    cy.contains('Brot').should('be.visible')
    cy.get('.italic').should('not.exist')
  })

  it('zeigt das Notiz-Feld im Bearbeiten-Modal mit bestehendem Wert', () => {
    addArticle('Eier', { note: 'Freiland' })
    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. Bio-Qualität"]').should('have.value', 'Freiland')
  })

  it('bearbeitet eine bestehende Notiz', () => {
    addArticle('Butter', { note: 'Irische' })
    cy.contains('Irische').should('be.visible')

    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. Bio-Qualität"]').clear().type('Almbutter')
    cy.contains('button', 'Speichern').click()

    cy.contains('Almbutter').should('be.visible')
    cy.contains('Irische').should('not.exist')
  })

  it('fügt eine Notiz zu einem Artikel ohne Notiz hinzu', () => {
    addArticle('Käse')
    cy.get('.italic').should('not.exist')

    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. Bio-Qualität"]').type('Gouda')
    cy.contains('button', 'Speichern').click()

    cy.contains('Gouda').should('be.visible')
  })

  it('entfernt eine Notiz durch Leeren des Feldes', () => {
    addArticle('Joghurt', { note: 'Griechisch' })
    cy.contains('Griechisch').should('be.visible')

    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. Bio-Qualität"]').clear()
    cy.contains('button', 'Speichern').click()

    cy.contains('Griechisch').should('not.exist')
  })

  it('Notiz bleibt nach Seiten-Reload erhalten', () => {
    addArticle('Reis', { note: 'Basmati' })
    cy.contains('Basmati').should('be.visible')

    cy.reload()
    cy.contains('Basmati').should('be.visible')
  })

  it('Notiz mit Sonderzeichen wird korrekt angezeigt', () => {
    const specialNote = 'Nur beim Hofer! (Bio) – max. 2 Stück'
    addArticle('Äpfel', { note: specialNote })
    cy.contains(specialNote).should('be.visible')
  })

  it('mehrere Artikel mit unterschiedlichen Notizen', () => {
    addArticle('Milch', { note: 'Vollmilch' })
    addArticle('Brot', { note: 'Roggen' })
    addArticle('Wasser')

    cy.contains('Vollmilch').should('be.visible')
    cy.contains('Roggen').should('be.visible')
    cy.get('.italic').should('have.length', 2)
  })
})
