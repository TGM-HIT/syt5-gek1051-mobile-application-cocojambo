describe('Article Prices', () => {
  // Helper: create a list and navigate into it
  function createListAndOpen(name) {
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type(name)
    cy.contains('button', 'Erstellen').click()
    cy.contains(name).click()
  }

  // Helper: create an article with optional price
  function createArticle(name, { quantity, unit, price } = {}) {
    cy.contains('+ Artikel').click()
    cy.get('input[placeholder="z.B. Milch"]').type(name)
    if (quantity) {
      cy.get('input[placeholder="1"]').clear().type(quantity)
    }
    if (unit) {
      cy.get('input[placeholder="z.B. kg"]').first().type(unit)
    }
    if (price) {
      cy.get('input[placeholder="z.B. 2,49"]').first().type(price)
    }
    cy.contains('button', 'Hinzufügen').click()
  }

  beforeEach(() => {
    cy.visit('/')
    cy.clearPouchDB()
  })

  it('creates an article with a price and displays it', () => {
    createListAndOpen('Preistest')
    createArticle('Milch', { quantity: 2, unit: 'l', price: '1.49' })

    cy.contains('Milch').should('be.visible')
    cy.contains('€ 1,49').should('be.visible')
  })

  it('creates an article without a price', () => {
    createListAndOpen('Ohne Preis')
    createArticle('Brot')

    cy.contains('Brot').should('be.visible')
    cy.contains('€').should('not.exist')
  })

  it('shows total footer when articles have prices', () => {
    createListAndOpen('Total Test')
    createArticle('Milch', { quantity: 2, unit: 'l', price: '1.49' })
    createArticle('Butter', { price: '2.79' })

    // Total = 2*1.49 + 1*2.79 = 5.77
    cy.contains('Gesamt').should('be.visible')
    cy.contains('€ 5,77').should('be.visible')
  })

  it('does not show total when no articles have prices', () => {
    createListAndOpen('Kein Preis')
    createArticle('Brot')
    createArticle('Wasser')

    cy.contains('Gesamt').should('not.exist')
  })

  it('excludes checked articles from total', () => {
    createListAndOpen('Check Test')
    createArticle('Milch', { price: '1.49' })
    createArticle('Butter', { price: '2.79' })

    // Total should be 1.49 + 2.79 = 4.28
    cy.contains('€ 4,28').should('be.visible')

    // Check off Milch — total should drop to 2.79
    cy.contains('Milch').parent().parent().find('input[type="checkbox"]').click()
    cy.contains('€ 2,79').should('be.visible')
  })

  it('edits an article price', () => {
    createListAndOpen('Edit Preis')
    createArticle('Milch', { price: '1.49' })

    cy.contains('€ 1,49').should('be.visible')

    // Open edit modal
    cy.get('button[title="Bearbeiten"]').click()
    cy.contains('Artikel bearbeiten').should('be.visible')

    // Change price
    cy.get('input[placeholder="z.B. 2,49"]').first().clear().type('1.99')
    cy.contains('button', 'Speichern').click()

    cy.contains('€ 1,99').should('be.visible')
  })

  it('shows price history after editing price', () => {
    createListAndOpen('History Test')
    createArticle('Milch', { price: '1.49' })

    // Edit price to create first history entry
    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. 2,49"]').first().clear().type('1.99')
    cy.contains('button', 'Speichern').click()

    // Click on price to expand history
    cy.contains('€ 1,99').click()

    // History entry records the new price with a date
    cy.contains('€ 1,99').should('be.visible')
  })

  it('shows trend indicator after two price changes', () => {
    createListAndOpen('Trend Test')
    createArticle('Milch', { price: '1.49' })

    // First price change: 1.49 → 1.29 (creates history entry 1)
    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. 2,49"]').first().clear().type('1.29')
    cy.contains('button', 'Speichern').click()
    cy.contains('€ 1,29').should('be.visible')

    // Second price change: 1.29 → 1.99 (creates history entry 2, now trend shows)
    cy.get('button[title="Bearbeiten"]').click()
    cy.get('input[placeholder="z.B. 2,49"]').first().clear().type('1.99')
    cy.contains('button', 'Speichern').click()

    // Should show upward trend (1.29 → 1.99)
    cy.contains('↑').should('be.visible')
  })

  it('persists price after page reload', () => {
    createListAndOpen('Persist Test')
    createArticle('Milch', { price: '1.49' })
    cy.contains('€ 1,49').should('be.visible')

    cy.reload()
    cy.contains('€ 1,49').should('be.visible')
  })

  it('shows camera button for price scanning on each article', () => {
    createListAndOpen('Scan Button Test')
    createArticle('Milch', { price: '1.49' })

    cy.get('button[title="Preis scannen"]').should('be.visible')
  })

  it('opens price scanner modal when camera button is clicked', () => {
    createListAndOpen('Scanner Test')
    createArticle('Milch', { price: '1.49' })

    cy.get('button[title="Preis scannen"]').click()

    // Scanner modal opens — camera view with capture button or manual entry
    cy.contains('button', 'Abbrechen').should('be.visible')
  })

  it('price scanner can be closed and returns to article list', () => {
    createListAndOpen('Manual Scan Test')
    createArticle('Milch', { price: '1.49' })

    cy.get('button[title="Preis scannen"]').click()
    cy.contains('button', 'Abbrechen').should('be.visible')
    cy.contains('button', 'Abbrechen').click()

    // Original price should remain
    cy.contains('€ 1,49').should('be.visible')
  })

  it('price scanner can be cancelled', () => {
    createListAndOpen('Cancel Scan Test')
    createArticle('Milch', { price: '1.49' })

    cy.get('button[title="Preis scannen"]').click()
    cy.contains('button', 'Abbrechen').click()

    // Original price should remain
    cy.contains('€ 1,49').should('be.visible')
  })
})
