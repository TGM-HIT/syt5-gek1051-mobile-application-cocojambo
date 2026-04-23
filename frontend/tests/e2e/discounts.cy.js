describe('Discount Mechanics (Rabatt / Pickerl)', () => {
  function createListAndOpen(name) {
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type(name)
    cy.contains('button', 'Erstellen').click()
    cy.contains(name).click()
  }

  function createArticle(name, { quantity, packageSize, packageUnit, price, rabattfähig } = {}) {
    cy.contains('+ Artikel').click()
    cy.get('input[placeholder="z.B. Milch"]').type(name)
    if (quantity) {
      cy.get('input[placeholder="1"]').clear().type(quantity)
    }
    if (packageSize) {
      cy.get('input[placeholder="z.B. 250"]').first().type(packageSize)
    }
    if (packageUnit) {
      cy.get('input[placeholder="z.B. kg"]').first().type(packageUnit)
    }
    if (price) {
      cy.get('input[placeholder="z.B. 2,49"]').first().type(price)
    }
    if (rabattfähig) {
      cy.get('#new-rabattfähig').check()
    }
    cy.contains('button', 'Hinzufügen').click()
  }

  beforeEach(() => {
    cy.visit('/')
    cy.clearPouchDB()
  })

  // ── rabattfähig flag ──────────────────────────────────────────────────────

  it('shows "Rabatt Pickerl kann verwendet werden" badge on rabattfähig article', () => {
    createListAndOpen('Rabatt Badge Test')
    createArticle('Milch', { price: '2.00', rabattfähig: true })

    cy.contains('Rabatt Pickerl kann verwendet werden').should('be.visible')
  })

  it('does not show rabatt badge on a non-rabattfähig article', () => {
    createListAndOpen('Kein Badge Test')
    createArticle('Brot', { price: '3.00' })

    cy.contains('Rabatt Pickerl kann verwendet werden').should('not.exist')
  })

  it('toggles rabattfähig on an existing article via edit modal', () => {
    createListAndOpen('Toggle Rabatt Test')
    createArticle('Butter', { price: '2.79' })

    cy.contains('Rabatt Pickerl kann verwendet werden').should('not.exist')

    cy.get('button[title="Bearbeiten"]').click()
    cy.get('#edit-rabattfähig').check()
    cy.contains('button', 'Speichern').click()

    cy.contains('Rabatt Pickerl kann verwendet werden').should('be.visible')
  })

  // ── Pickerl button & modal ────────────────────────────────────────────────

  it('shows the Pickerl button on the article list page', () => {
    createListAndOpen('Pickerl Button Test')
    cy.contains('button', '🏷 Pickerl').should('be.visible')
  })

  it('opens the Pickerl modal when the button is clicked', () => {
    createListAndOpen('Modal Open Test')
    cy.contains('button', '🏷 Pickerl').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('be.visible')
  })

  it('closes the Pickerl modal with the Schliessen button', () => {
    createListAndOpen('Modal Close Test')
    cy.contains('button', '🏷 Pickerl').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('be.visible')
    cy.contains('button', 'Schliessen').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('not.exist')
  })

  // ── "Keine rabattfähigen Artikel" message ─────────────────────────────────

  it('shows "Keine rabattfähigen Artikel" when percentage entered but no eligible articles exist', () => {
    createListAndOpen('Kein Artikel Test')
    createArticle('Brot', { price: '3.00' })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
  })

  it('does not show the "Keine" message when no percentage is entered yet', () => {
    createListAndOpen('Kein Prozent Test')
    cy.contains('button', '🏷 Pickerl').click()
    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('not.exist')
  })

  // ── Article eligibility in Pickerl modal ─────────────────────────────────

  it('shows a rabattfähig article with a price in the Pickerl list', () => {
    createListAndOpen('Eligible Test')
    createArticle('Milch', { price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Milch').should('be.visible')
    cy.contains('button', 'Anwenden').should('be.visible')
  })

  it('does not show a non-rabattfähig article in the Pickerl list', () => {
    createListAndOpen('Not Eligible Test')
    createArticle('Brot', { price: '3.00' })
    createArticle('Milch', { price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    // Pickerl modal items use border-yellow-200; article cards use border-yellow-300
    // Only Milch should be a Pickerl candidate, not Brot
    cy.get('.border-yellow-200').should('have.length', 1)
    cy.get('.border-yellow-200').should('contain', 'Milch')
    cy.get('.border-yellow-200').should('not.contain', 'Brot')
  })

  it('does not show a rabattfähig article without a price in the Pickerl list', () => {
    createListAndOpen('No Price Test')
    createArticle('Milch', { rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
  })

  it('does not show a checked (already bought) rabattfähig article in the Pickerl list', () => {
    createListAndOpen('Checked Article Test')
    createArticle('Milch', { price: '2.00', rabattfähig: true })

    // Check off the article
    cy.contains('p', 'Milch').parent().parent().find('input[type="checkbox"]').click()

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
  })

  // ── Price calculation in modal ────────────────────────────────────────────

  it('shows the correct discounted total in the Pickerl modal', () => {
    createListAndOpen('Preisberechnung Test')
    // price 2.00, qty 1 → 20% off → discounted total = € 1,60
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    // Original total shown struck through
    cy.contains('€ 2,00').should('be.visible')
    // Discounted total shown in green
    cy.contains('€ 1,60').should('be.visible')
  })

  it('updates discounted total when percentage changes', () => {
    createListAndOpen('Prozent Change Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    const percentInput = cy.get('input[type="number"][min="1"][max="100"]')
    percentInput.type('10')
    cy.contains('€ 1,80').should('be.visible')
  })

  // ── Applying a discount ───────────────────────────────────────────────────

  it('applies the discount and moves the article to the applied section with ✓', () => {
    createListAndOpen('Apply Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    // Article is now in the green applied section with checkmark
    cy.contains('✓').should('be.visible')
    // "Anwenden" button is gone (article moved to snapshot section)
    cy.contains('button', 'Anwenden').should('not.exist')
  })

  it('shows the updated price on the article card after discount is applied', () => {
    createListAndOpen('Preis Update Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()
    cy.contains('button', 'Schliessen').click()

    // New price is € 1,60
    cy.contains('€ 1,60').should('be.visible')
  })

  it('shows the discount info badge on the article card after applying Pickerl', () => {
    createListAndOpen('Discount Badge Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()
    cy.contains('button', 'Schliessen').click()

    // Discount info shown: "🏷 −20% Rabatt (war € 2,00)"
    cy.contains('−20% Rabatt').should('be.visible')
    cy.contains('war € 2,00').should('be.visible')
  })

  it('applying a discount updates the list total', () => {
    createListAndOpen('Total Update Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })
    createArticle('Brot', { price: '3.00' })

    // Total before: 2.00 + 3.00 = 5.00
    cy.contains('€ 5,00').should('be.visible')

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()
    cy.contains('button', 'Schliessen').click()

    // Total after Milch discount: 1.60 + 3.00 = 4.60
    cy.contains('€ 4,60').should('be.visible')
  })

  it('can apply discounts to multiple rabattfähig articles', () => {
    createListAndOpen('Multi Apply Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })
    createArticle('Butter', { quantity: 1, price: '4.00', rabattfähig: true })

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('50')

    // Pickerl modal items use border-yellow-200; article cards use border-yellow-300
    cy.contains('.border-yellow-200', 'Milch').contains('button', 'Anwenden').click()
    cy.contains('.border-yellow-200', 'Butter').contains('button', 'Anwenden').click()

    // Both should have checkmarks
    cy.get('.text-green-600').filter(':contains("✓")').should('have.length', 2)
  })

  // ── Discount price reset ──────────────────────────────────────────────────

  it('restores original price when rabattfähig is unchecked after discount was applied', () => {
    createListAndOpen('Preis Reset Test')
    createArticle('Milch', { quantity: 1, price: '2.00', rabattfähig: true })

    // Apply 20% discount
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()
    cy.contains('button', 'Schliessen').click()

    // Price is now € 1,60
    cy.contains('€ 1,60').should('be.visible')

    // Edit the article and remove rabattfähig
    cy.get('button[title="Bearbeiten"]').click()
    cy.get('#edit-rabattfähig').uncheck()
    cy.contains('button', 'Speichern').click()

    // Original price should be restored
    cy.contains('€ 2,00').should('be.visible')
    cy.contains('€ 1,60').should('not.exist')
  })
})
