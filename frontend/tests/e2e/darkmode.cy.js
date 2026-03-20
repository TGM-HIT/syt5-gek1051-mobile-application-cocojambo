describe('Dark/Light Mode (E2E)', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('theme')
      },
    })
  })

  it('startet im Light Mode', () => {
    cy.document().its('documentElement.classList').should('not.contain', 'dark')
    cy.get('header').should('have.css', 'background-color').and('not.equal', 'rgb(31, 41, 55)')
  })

  it('wechselt zu Dark Mode bei Klick auf den Toggle', () => {
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
  })

  it('wechselt zurück zu Light Mode', () => {
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.get('button[title="Light Mode"]').click()
    cy.document().its('documentElement.classList').should('not.contain', 'dark')
  })

  it('Dark Mode bleibt nach Reload erhalten', () => {
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.reload()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.get('button[title="Light Mode"]').should('be.visible')
  })

  it('Light Mode bleibt nach Reload erhalten', () => {
    cy.get('button[title="Dark Mode"]').click()
    cy.get('button[title="Light Mode"]').click()
    cy.reload()
    cy.document().its('documentElement.classList').should('not.contain', 'dark')
    cy.get('button[title="Dark Mode"]').should('be.visible')
  })

  it('Toggle ist auch auf der Artikelseite vorhanden', () => {
    cy.clearPouchDB()
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Testliste').click()
    cy.get('button[title="Dark Mode"]').should('be.visible')
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
  })

  it('Dark Mode Einstellung wird zwischen Seiten beibehalten', () => {
    cy.clearPouchDB()
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Testliste').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.get('button[title="Light Mode"]').should('be.visible')
  })
})
