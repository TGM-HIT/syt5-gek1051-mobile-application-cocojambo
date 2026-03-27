import ManualSyncButton from '../../src/components/sync/ManualSyncButton.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useManualSyncStore } from '../../src/stores/manualSyncStore'

describe('ManualSyncButton – Online/Offline State', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ist disabled und zeigt Offline-Tooltip wenn navigator.onLine false ist', () => {
    cy.stub(window.navigator, 'onLine').value(false)
    window.dispatchEvent(new Event('offline'))
    cy.mount(ManualSyncButton)
    cy.get('button').should('be.disabled')
    cy.get('button').should('have.attr', 'title', 'Offline')
  })

  it('ist nicht disabled und zeigt Sync-Tooltip wenn navigator.onLine true ist', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    window.dispatchEvent(new Event('online'))
    cy.mount(ManualSyncButton)
    cy.get('button').should('not.be.disabled')
    cy.get('button').should('have.attr', 'title', 'Manueller Sync')
  })

  it('wird disabled wenn offline-Event gefeuert wird nach dem Mount', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    cy.mount(ManualSyncButton)
    cy.get('button').should('not.be.disabled')

    cy.wrap(null).then(() => {
      cy.stub(window.navigator, 'onLine').value(false)
      window.dispatchEvent(new Event('offline'))
    })
    cy.get('button').should('be.disabled')
  })
})

describe('ManualSyncButton – Syncing State', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('ist disabled wenn isSyncing true ist', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = true
    cy.mount(ManualSyncButton)
    cy.get('button').should('be.disabled')
  })

  it('zeigt den Spinner-SVG wenn isSyncing true ist', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = true
    cy.mount(ManualSyncButton)
    // Spinner is the first SVG when syncing
    cy.get('svg.animate-spin').should('exist')
  })

  it('zeigt kein Refresh-Icon wenn isSyncing true ist', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = true
    cy.mount(ManualSyncButton)
    cy.get('svg.animate-spin').should('exist')
    // The plain refresh icon should be gone
    cy.get('svg').not('.animate-spin').should('not.exist')
  })

  it('zeigt den Fortschrittsbalken wenn isSyncing true ist', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = true
    syncStore.syncProgress = 45
    cy.mount(ManualSyncButton)
    cy.get('[style*="width: 45%"]').should('exist')
  })

  it('zeigt keinen Fortschrittsbalken wenn nicht syncing', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = false
    cy.mount(ManualSyncButton)
    cy.get('[style*="width:"]').should('not.exist')
  })

  it('zeigt das Refresh-Icon wenn nicht syncing', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = false
    cy.mount(ManualSyncButton)
    cy.get('svg').should('exist')
    cy.get('svg.animate-spin').should('not.exist')
  })
})

describe('ManualSyncButton – Trigger Behaviour', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('ruft startSync auf wenn online und geklickt', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    cy.stub(syncStore, 'startSync').as('startSync')
    cy.mount(ManualSyncButton)
    cy.get('button').click()
    cy.get('@startSync').should('have.been.called')
  })

  it('triggert keinen Sync wenn offline', () => {
    cy.stub(window.navigator, 'onLine').value(false)
    cy.stub(syncStore, 'startSync').as('startSync')
    cy.mount(ManualSyncButton)
    // Button is disabled so click should be a no-op
    cy.get('button').should('be.disabled')
    cy.get('@startSync').should('not.have.been.called')
  })

  it('triggert keinen zweiten Sync wenn bereits syncint', () => {
    cy.stub(window.navigator, 'onLine').value(true)
    syncStore.isSyncing = true
    cy.stub(syncStore, 'startSync').as('startSync')
    cy.mount(ManualSyncButton)
    cy.get('button').should('be.disabled')
    cy.get('@startSync').should('not.have.been.called')
  })
})
