import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../../src/App.vue'
import { useOnlineStatusStore } from '../../src/stores/onlineStatus.js'

function mountApp() {
  localStorage.setItem('username', 'TestUser#abcd')
  const pinia = createPinia()
  setActivePinia(pinia)
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
  })
  cy.mount(App, { global: { plugins: [pinia, router] } })
  return useOnlineStatusStore()
}

describe('Offline-Indikator', () => {
  it('zeigt keinen Banner wenn online', () => {
    const store = mountApp()
    store.isOnline = true
    cy.get('[data-cy="offline-banner"]').should('not.exist')
  })

  it('zeigt den Offline-Banner wenn offline', () => {
    const store = mountApp()
    store.isOnline = false
    cy.get('[data-cy="offline-banner"]').should('be.visible')
    cy.get('[data-cy="offline-banner"]').should('contain', 'Offline')
  })

  it('Banner verschwindet wenn Verbindung wiederhergestellt wird', () => {
    const store = mountApp()
    store.isOnline = false
    cy.get('[data-cy="offline-banner"]').should('be.visible')
    cy.then(() => { store.isOnline = true })
    cy.get('[data-cy="offline-banner"]').should('not.exist')
  })

  it('reagiert auf das offline-Event des Browsers', () => {
    const store = mountApp()
    store.isOnline = true
    cy.window().then((win) => win.dispatchEvent(new Event('offline')))
    cy.then(() => expect(store.isOnline).to.be.false)
    cy.get('[data-cy="offline-banner"]').should('be.visible')
  })

  it('reagiert auf das online-Event des Browsers', () => {
    const store = mountApp()
    store.isOnline = false
    cy.window().then((win) => win.dispatchEvent(new Event('online')))
    cy.then(() => expect(store.isOnline).to.be.true)
    cy.get('[data-cy="offline-banner"]').should('not.exist')
  })
})
