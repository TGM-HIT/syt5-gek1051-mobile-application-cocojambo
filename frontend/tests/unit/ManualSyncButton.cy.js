import ManualSyncButton from '../../src/components/sync/ManualSyncButton.vue'
import { createPinia, setActivePinia } from 'pinia'

describe('ManualSyncButton Component', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders correctly and shows offline status when disconnected', () => {
    cy.stub(window.navigator, 'onLine').value(false)
    window.dispatchEvent(new Event('offline'))

    cy.mount(ManualSyncButton)
    
    // Check title attribute instead of text
    cy.get('button').should('have.attr', 'title', 'Offline')
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.class', 'disabled:opacity-50')
  })

  it('renders online text when connected', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    window.dispatchEvent(new Event('online'))
    
    cy.mount(ManualSyncButton)
    
    cy.get('button').should('have.attr', 'title', 'Manueller Sync')
    cy.get('button').should('not.be.disabled')
  })
})
