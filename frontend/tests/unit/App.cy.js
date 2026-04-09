import App from '../../src/App.vue'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

function mountApp() {
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
  })

  cy.mount(App, {
    global: { plugins: [pinia, router] },
  })
}

describe('App – Username-Prompt', () => {
  beforeEach(() => {
    localStorage.removeItem('username')
  })

  it('zeigt Username-Prompt wenn kein Username gesetzt ist', () => {
    mountApp()
    cy.get('[data-cy="username-prompt"]').should('be.visible')
    cy.get('[data-cy="username-input"]').should('be.visible')
    cy.get('[data-cy="username-submit"]').should('be.visible')
  })

  it('zeigt Willkommen-Text im Prompt', () => {
    mountApp()
    cy.contains('Willkommen!').should('be.visible')
    cy.contains('Benutzernamen').should('be.visible')
  })

  it('akzeptiert keinen leeren Username', () => {
    mountApp()
    cy.get('[data-cy="username-submit"]').click()
    cy.get('[data-cy="username-prompt"]').should('be.visible')
  })

  it('versteckt Prompt nach Username-Eingabe', () => {
    mountApp()
    cy.get('[data-cy="username-input"]').type('TestUser')
    cy.get('[data-cy="username-submit"]').click()
    cy.get('[data-cy="username-prompt"]').should('not.exist')
  })

  it('speichert Username mit Suffix in localStorage', () => {
    mountApp()
    cy.get('[data-cy="username-input"]').type('Max')
    cy.get('[data-cy="username-submit"]').click()
    cy.window().then((win) => {
      const stored = win.localStorage.getItem('username')
      expect(stored).to.match(/^Max#[0-9a-f]{4}$/)
    })
  })
})

describe('App – Username bereits gesetzt', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'ExistingUser#abcd')
  })

  it('zeigt keinen Username-Prompt wenn Username gesetzt ist', () => {
    mountApp()
    cy.get('[data-cy="username-prompt"]').should('not.exist')
  })

  it('mounts without errors', () => {
    mountApp()
    cy.get('body').should('exist')
  })
})
