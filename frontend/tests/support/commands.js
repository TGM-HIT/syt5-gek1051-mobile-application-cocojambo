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
 * Deletes the PouchDB IndexedDB database and reloads the page so the app
 * starts fresh with an empty database. Requires a page to already be visited.
 */
/**
 * Destroys the PouchDB database via the app's exposed helper (closes the
 * IndexedDB connection cleanly) then reloads so the app starts fresh.
 */
Cypress.Commands.add('clearPouchDB', () => {
  cy.window().then((win) => win.__destroyDB())
  cy.reload()
})
