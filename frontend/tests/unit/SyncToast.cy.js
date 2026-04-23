import SyncToast from '../../src/components/sync/SyncToast.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useManualSyncStore } from '../../src/stores/manualSyncStore'

const NOW = '2026-01-01T10:00:00.000Z'
const LATER = '2026-01-01T10:00:03.500Z'

describe('SyncToast – Sichtbarkeit', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('ist initial nicht sichtbar', () => {
    cy.mount(SyncToast)
    cy.get('.fixed').should('not.exist')
  })

  it('erscheint wenn ein Sync startet', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('.fixed').should('be.visible')
  })

  it('bleibt sichtbar während der Sync läuft', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('.fixed').should('be.visible')
    cy.wait(200)
    cy.get('.fixed').should('be.visible')
  })

  it('bleibt nach einem erfolgreichen Sync sichtbar (vor Auto-Hide)', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('.fixed').should('be.visible')
  })
})

describe('SyncToast – Überschriften', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('zeigt "Synchronisiere..." während der Sync läuft', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('h4').should('contain', 'Synchronisiere...')
  })

  it('zeigt "Synchronisation erfolgreich" nach erfolgreichem Sync', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: { docs_written: 2 }, pull: { docs_read: 3 } })
    })
    cy.get('h4').should('contain', 'Synchronisation erfolgreich')
  })

  it('zeigt "Sync fehlgeschlagen" nach einem Fehler', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.failSync(new Error('Verbindungsfehler'))
    })
    cy.get('h4').should('contain', 'Sync fehlgeschlagen')
  })
})

describe('SyncToast – Status Icons', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('zeigt animierten Spinner während der Sync läuft', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('svg.animate-spin').should('exist')
  })

  it('zeigt keinen Spinner nach erfolgreichem Sync', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('svg.animate-spin').should('not.exist')
  })

  it('zeigt keinen Spinner nach Sync-Fehler', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.failSync(new Error('Fehler'))
    })
    cy.get('svg.animate-spin').should('not.exist')
  })
})

describe('SyncToast – Detailinformationen', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('zeigt "Bitte warten"-Text während des laufenden Syncs', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('p').should('contain', 'Bitte warten')
  })

  it('zeigt die Summe aus push und pull Einträgen nach Erfolg', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({
        endTime: LATER,
        push: { docs_written: 3 },
        pull: { docs_read: 4 },
      })
    })
    cy.get('p').should('contain', '7 Einträge')
  })

  it('zeigt 0 Einträge wenn keine Dokumente übertragen wurden', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('p').should('contain', '0 Einträge')
  })

  it('zeigt die Fehlermeldung nach einem fehlgeschlagenen Sync', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.failSync(new Error('Verbindung getrennt'))
    })
    cy.get('p.text-red-500').should('contain', 'Verbindung getrennt')
  })

  it('zeigt die Sync-Dauer in Sekunden nach Erfolg', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('p').should('contain', 'Dauer:')
  })
})

describe('SyncToast – Schließen-Button', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('schließt den Toast wenn der X-Button geklickt wird', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('.fixed').should('be.visible')
    cy.get('button').click()
    cy.get('.fixed').should('not.exist')
  })

  it('schließt auch einen laufenden Sync-Toast', () => {
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('.fixed').should('be.visible')
    cy.get('button').click()
    cy.get('.fixed').should('not.exist')
  })
})

describe('SyncToast – Auto-Hide', () => {
  let syncStore

  beforeEach(() => {
    setActivePinia(createPinia())
    syncStore = useManualSyncStore()
  })

  it('versteckt sich nach 6 Sekunden bei Erfolg', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('.fixed').should('be.visible')
    cy.tick(6100)
    cy.get('.fixed').should('not.exist')
  })

  it('versteckt sich nach 6 Sekunden bei Fehler', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.failSync(new Error('Netzwerkfehler'))
    })
    cy.get('.fixed').should('be.visible')
    cy.tick(6100)
    cy.get('.fixed').should('not.exist')
  })

  it('verschwindet nicht automatisch während der Sync läuft', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => syncStore.startSync())
    cy.get('.fixed').should('be.visible')
    cy.tick(7000)
    cy.get('.fixed').should('be.visible')
  })

  it('verlängert den Auto-Hide-Timer bei erneutem Sync', () => {
    cy.clock()
    cy.mount(SyncToast)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.tick(3000)
    cy.wrap(null).then(() => {
      syncStore.startSync()
      syncStore.finishSync({ endTime: LATER, push: {}, pull: {} })
    })
    cy.get('.fixed').should('be.visible')
    cy.tick(3000)
    cy.get('.fixed').should('be.visible')
    cy.tick(3100)
    cy.get('.fixed').should('not.exist')
  })
})
