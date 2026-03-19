// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

/**
 * Destroys the PouchDB database via the app's exposed helper (closes the
 * IndexedDB connection cleanly) then reloads so the app starts fresh.
 * Also sets a test username so the username prompt is skipped.
 */
Cypress.Commands.add('clearPouchDB', () => {
  cy.window().then((win) => {
    // Set flag before reload so seedDatabase() skips on next load
    win.localStorage.setItem('__cypress_skip_seed', '1')
    // Set a test username so the username prompt does not appear
    win.localStorage.setItem('username', 'TestUser#abcd')
    return new Cypress.Promise((resolve) => {
      const req = win.indexedDB.deleteDatabase('_pouch_shopping_lists')
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
  })
  cy.reload()
  cy.window().should('have.property', '__destroyDB')
})
