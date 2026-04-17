import { createPinia, setActivePinia } from 'pinia'
import PriceTagScanner from '../../src/views/PriceTagScanner.vue'
import { useOnlineStatusStore } from '../../src/stores/onlineStatus.js'

function mountOffline(onScanned = cy.spy(), onClose = cy.spy()) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const onlineStore = useOnlineStatusStore()
  onlineStore.isOnline = false
  cy.mount(PriceTagScanner, {
    props: { articleName: 'Milch' },
    global: { plugins: [pinia] },
    attrs: { onScanned, onClose },
  })
  return { onScanned, onClose }
}

describe('PriceTagScanner – offline manual entry', () => {
  it('shows manual entry form immediately when offline', () => {
    mountOffline()
    cy.contains('Preis für').should('be.visible')
    cy.contains('Milch').should('be.visible')
    cy.contains('Preis eingeben').should('be.visible')
  })

  it('displays the article name in the header', () => {
    mountOffline()
    cy.contains('h2', 'Milch').should('be.visible')
  })

  it('has a number input for manual price entry', () => {
    mountOffline()
    cy.get('input[type="number"]').should('exist')
  })

  it('emits scanned with price when Übernehmen clicked', () => {
    const onScanned = cy.spy().as('scanned')
    mountOffline(onScanned)
    cy.get('input[type="number"]').type('2.49')
    cy.contains('Übernehmen').click()
    cy.get('@scanned').should('have.been.calledWith', 2.49)
  })

  it('emits scanned with null when no price entered', () => {
    const onScanned = cy.spy().as('scanned')
    mountOffline(onScanned)
    cy.contains('Übernehmen').click()
    cy.get('@scanned').should('have.been.calledWith', null)
  })

  it('emits close when Abbrechen clicked', () => {
    const onClose = cy.spy().as('close')
    mountOffline(cy.spy(), onClose)
    cy.contains('Abbrechen').click()
    cy.get('@close').should('have.been.calledOnce')
  })

  it('shows Preis eingeben label when no candidates', () => {
    mountOffline()
    cy.contains('Preis eingeben').should('be.visible')
  })
})

describe('PriceTagScanner – online camera mode', () => {
  it('shows error and manual entry when camera fails', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const onlineStore = useOnlineStatusStore()
    onlineStore.isOnline = true

    cy.stub(navigator.mediaDevices, 'getUserMedia').rejects(new Error('Permission denied'))

    cy.mount(PriceTagScanner, {
      props: { articleName: 'Butter' },
      global: { plugins: [pinia] },
    })

    cy.contains('Kamera konnte nicht gestartet werden').should('be.visible')
    cy.get('input[type="number"]').should('exist')
  })
})
