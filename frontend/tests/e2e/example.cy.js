describe('Shopping Lists', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearPouchDB()
  })

  it('shows the page header', () => {
    cy.get('h1').should('contain', 'Einkaufslisten')
  })

  it('shows seed lists after database reset', () => {
    // After clearPouchDB + reload the seed data is re-inserted,
    // so lists are never truly empty in this setup.
    cy.contains('Wocheneinkauf').should('be.visible')
    cy.contains('Baumarkt').should('be.visible')
    cy.contains('Apotheke').should('be.visible')
  })

  it('creates a new list with name and category', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Wocheneinkauf Test')
    cy.get('input[placeholder="z.B. Lebensmittel"]').type('Lebensmittel')
    cy.contains('button', 'Erstellen').click()

    cy.contains('Wocheneinkauf Test').should('be.visible')
    cy.contains('Lebensmittel').should('be.visible')
  })

  it('creates a list without category', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Nur Name')
    cy.contains('button', 'Erstellen').click()

    cy.contains('Nur Name').should('be.visible')
  })

  it('does not submit when name is empty', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.contains('button', 'Erstellen').click()

    cy.contains('h2', 'Neue Liste erstellen').should('be.visible')
  })

  it('persists list after page reload', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Persistente Liste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Persistente Liste').should('be.visible')

    cy.reload()
    cy.contains('Persistente Liste').should('be.visible')
  })

  it('deletes a list', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Zu löschende Liste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Zu löschende Liste').should('be.visible')

    cy.contains('Zu löschende Liste')
      .closest('.bg-white')
      .find('button[title="Liste löschen"]')
      .click()
    cy.contains('Liste löschen?').should('be.visible')
    cy.contains('button', 'Löschen').click()
    cy.contains('Zu löschende Liste').should('not.exist')
  })

  it('shows empty state after all lists are deleted', () => {
    // Delete all seed lists (3) one by one
    const seedListNames = ['Wocheneinkauf', 'Baumarkt', 'Apotheke']

    seedListNames.forEach((name) => {
      cy.contains(name)
        .closest('.bg-white')
        .find('button[title="Liste löschen"]')
        .click()
      cy.contains('button', 'Löschen').click()
      cy.contains(name).should('not.exist')
    })

    cy.contains('Noch keine Listen vorhanden').should('be.visible')
  })
})
