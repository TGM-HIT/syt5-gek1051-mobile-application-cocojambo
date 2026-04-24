function assertDarkMode(enabled) {
  cy.document().then((doc) => {
    expect(doc.documentElement.classList.contains('dark')).to.equal(enabled)
  })
}

function openMenu() {
  cy.get('[data-cy="menu-btn"]').click()
}

function closeMenu() {
  cy.get('[data-cy="menu-close"]').click()
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
    openMenu()
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
  })

  it('wechselt zurück zu Light Mode', () => {
    openMenu()
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    cy.get('button[title="Light Mode"]').click()
    assertDarkMode(false)
  })

  it('Dark Mode bleibt nach Reload erhalten', () => {
    openMenu()
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    cy.reload()
    openMenu()
    cy.get('button[title="Light Mode"]').should('be.visible')
    assertDarkMode(true)
  })

  it('Light Mode bleibt nach Reload erhalten', () => {
    openMenu()
    cy.get('button[title="Dark Mode"]').click()
    cy.get('button[title="Light Mode"]').click()
    cy.reload()
    assertDarkMode(false)
    openMenu()
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
    openMenu()
    cy.get('button[title="Dark Mode"]').click()
    assertDarkMode(true)
    closeMenu()
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Testliste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('Testliste').click()
    assertDarkMode(true)
    cy.get('button[title="Light Mode"]').should('be.visible')
  })
})
