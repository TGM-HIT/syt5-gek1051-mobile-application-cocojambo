import ManualSyncButton from '../../src/components/sync/ManualSyncButton.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ManualSyncButton Component', () => {
  beforeEach(() => {
    // Setup fresh Pinia instance for testing stores
    setActivePinia(createPinia())
  })

  it('renders correctly and shows offline status when disconnected', () => {
    // Forcing navigator.onLine mock to false for offline simulation
    cy.stub(window.navigator, 'onLine').value(false)
    window.dispatchEvent(new Event('offline'))

    cy.mount(ManualSyncButton)
    
    // Checks if the button is properly disabled and indicates "Offline"
    cy.get('.sync-btn').should('contain.text', 'Offline')
    cy.get('.sync-btn').should('be.disabled')
    cy.get('.sync-btn').should('have.class', 'offline')
  })

  it('renders online text when connected', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    window.dispatchEvent(new Event('online'))
    
    cy.mount(ManualSyncButton)
    
    cy.get('.sync-btn').should('contain.text', 'Jetzt Synchronisieren')
    cy.get('.sync-btn').should('not.be.disabled')
    cy.get('.sync-btn').should('not.have.class', 'offline')
  })
})
