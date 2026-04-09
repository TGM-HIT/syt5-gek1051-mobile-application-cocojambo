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
