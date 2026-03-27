function assertDarkMode(enabled) {
  cy.document().then((doc) => {
    expect(doc.documentElement.classList.contains('dark')).to.equal(enabled)
  })
}

describe('Dark/Light Mode (E2E)', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      win.localStorage.removeItem('theme')
    })
    cy.visit('/')
    cy.get('h1').should('contain', 'Einkaufslisten')
  })

  it('startet im Light Mode', () => {
    assertDarkMode(false)
  })

  it('wechselt zu Dark Mode bei Klick auf den Toggle', () => {
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
  })

  it('wechselt zurück zu Light Mode', () => {
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    cy.get('button[title="Light Mode"]').click()
    assertDarkMode(false)
  })

  it('Dark Mode bleibt nach Reload erhalten', () => {
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    cy.reload()
    cy.get('button[title="Light Mode"]').should('be.visible')
    assertDarkMode(true)
  })

  it('Light Mode bleibt nach Reload erhalten', () => {
    cy.get('button[title="Dark Mode"]').click()
    cy.get('button[title="Light Mode"]').click()
    cy.reload()
    assertDarkMode(false)
    cy.get('button[title="Dark Mode"]').should('be.visible')
  })

  it('Toggle ist auch auf der Artikelseite vorhanden', () => {
    cy.clearPouchDB()
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Testliste').click()
    cy.get('button[title="Dark Mode"]').should('be.visible')
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
  })

  it('Dark Mode Einstellung wird zwischen Seiten beibehalten', () => {
    cy.clearPouchDB()
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Testliste').click()
    assertDarkMode(true)
    cy.get('button[title="Light Mode"]').should('be.visible')
  })
})
