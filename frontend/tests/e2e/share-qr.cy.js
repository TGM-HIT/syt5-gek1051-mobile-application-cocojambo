describe('Share-Code QR', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.window().then((win) => {
      win.localStorage.setItem('username', 'TestUser#abcd')
      win.localStorage.setItem('__cypress_skip_seed', '1')
    })
    cy.reload()
  })

  it('zeigt einen QR-Code im Share-Modal einer Liste', () => {
    cy.contains('+ Neue Liste').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('QR-Testliste')
    cy.contains('Erstellen').click()
    cy.contains('QR-Testliste').click()

    cy.get('button[title="Liste teilen"]').click()
    cy.get('[data-cy="share-qr"]').should('be.visible')
    cy.get('[data-cy="share-qr"]').should(($canvas) => {
      expect($canvas[0].width).to.be.greaterThan(0)
      expect($canvas[0].height).to.be.greaterThan(0)
    })
  })

  it('zeigt einen QR-Scan-Button im Beitreten-Modal', () => {
    cy.contains('Liste beitreten').click()
    cy.get('[data-cy="qr-scan-btn"]').should('be.visible')
  })
})
