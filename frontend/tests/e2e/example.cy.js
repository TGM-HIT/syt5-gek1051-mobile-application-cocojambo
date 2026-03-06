describe('Shopping Lists', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.clearPouchDB()
  })

  it('shows the page header', () => {
    cy.get('h1').should('contain', 'Einkaufslisten')
  })

  it('shows empty state when no lists exist', () => {
    cy.contains('Noch keine Listen vorhanden').should('be.visible')
  })

  it('creates a new list with name and category', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Wocheneinkauf')
    cy.get('input[placeholder="z.B. Lebensmittel"]').type('Lebensmittel')
    cy.contains('button', 'Erstellen').click()

    cy.contains('Wocheneinkauf').should('be.visible')
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

    cy.get('button[title="Liste löschen"]').click()
    cy.contains('Zu löschende Liste').should('not.exist')
  })

  it('shows empty state after last list is deleted', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Einzige Liste')
    cy.contains('button', 'Erstellen').click()

    cy.get('button[title="Liste löschen"]').click()
    cy.contains('Noch keine Listen vorhanden').should('be.visible')
  })
})
