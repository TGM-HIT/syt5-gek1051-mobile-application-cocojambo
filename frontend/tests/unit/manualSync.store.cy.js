import { createPinia, setActivePinia } from 'pinia'
import { useManualSyncStore } from '../../src/stores/manualSyncStore'

describe('manualSyncStore – startSync()', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useManualSyncStore()
  })

  it('setzt isSyncing auf true', () => {
    store.startSync()
    expect(store.isSyncing).to.be.true
  })

  it('setzt syncProgress auf 10 (initial bump)', () => {
    store.startSync()
    expect(store.syncProgress).to.equal(10)
  })

  it('erstellt ein currentSyncDetails-Objekt mit status "running"', () => {
    store.startSync()
    expect(store.currentSyncDetails).to.not.be.null
    expect(store.currentSyncDetails.status).to.equal('running')
  })

  it('setzt startTime als ISO-String', () => {
    store.startSync()
    expect(store.currentSyncDetails.startTime).to.be.a('string')
    expect(() => new Date(store.currentSyncDetails.startTime)).to.not.throw()
  })

  it('setzt docsRead und docsWritten initial auf 0', () => {
    store.startSync()
    expect(store.currentSyncDetails.docsRead).to.equal(0)
    expect(store.currentSyncDetails.docsWritten).to.equal(0)
  })

  it('generiert eine eindeutige id per Sync', () => {
    store.startSync()
    const id1 = store.currentSyncDetails.id
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    store.startSync()
    const id2 = store.currentSyncDetails.id
    expect(id1).to.not.equal(id2)
  })
})

describe('manualSyncStore – updateProgress()', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useManualSyncStore()
    store.startSync()
  })

  it('addiert docsRead zum laufenden Sync', () => {
    store.updateProgress({ docsRead: 5, docsWritten: 0 })
    expect(store.currentSyncDetails.docsRead).to.equal(5)
  })

  it('addiert docsWritten zum laufenden Sync', () => {
    store.updateProgress({ docsRead: 0, docsWritten: 3 })
    expect(store.currentSyncDetails.docsWritten).to.equal(3)
  })

  it('akkumuliert mehrere Progress-Events korrekt', () => {
    store.updateProgress({ docsRead: 2, docsWritten: 1 })
    store.updateProgress({ docsRead: 3, docsWritten: 2 })
    expect(store.currentSyncDetails.docsRead).to.equal(5)
    expect(store.currentSyncDetails.docsWritten).to.equal(3)
  })

  it('erhöht syncProgress bei jedem Event (bleibt <= 90% bis complete)', () => {
    const progressBefore = store.syncProgress
    store.updateProgress({ docsRead: 1, docsWritten: 0 })
    expect(store.syncProgress).to.be.gte(progressBefore)
    expect(store.syncProgress).to.be.lte(90)
  })

  it('überschreitet nicht 90% ohne finishSync', () => {
    for (let i = 0; i < 20; i++) {
      store.updateProgress({ docsRead: 1, docsWritten: 1 })
    }
    expect(store.syncProgress).to.be.lte(90)
  })

  it('tut nichts wenn kein currentSyncDetails vorhanden', () => {
    store.currentSyncDetails = null
    // Should not throw
    store.updateProgress({ docsRead: 5, docsWritten: 5 })
    expect(store.currentSyncDetails).to.be.null
  })
})

describe('manualSyncStore – finishSync()', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useManualSyncStore()
    store.startSync()
  })

  it('setzt isSyncing auf false', () => {
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    expect(store.isSyncing).to.be.false
  })

  it('setzt syncProgress auf 100', () => {
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    expect(store.syncProgress).to.equal(100)
  })

  it('setzt status auf "success"', () => {
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    expect(store.syncLogs[0].status).to.equal('success')
  })

  it('fügt den Sync dem syncLogs-Array hinzu (prepend)', () => {
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    expect(store.syncLogs).to.have.length(1)
  })

  it('nach zwei Syncs sind beide im Log, neuester zuerst', () => {
    store.finishSync({ endTime: '2000-01-01T00:00:00.000Z', push: {}, pull: {} })
    store.startSync()
    store.finishSync({ endTime: '2000-01-02T00:00:00.000Z', push: {}, pull: {} })
    expect(store.syncLogs[0].endTime).to.equal('2000-01-02T00:00:00.000Z')
  })

  it('setzt currentSyncDetails auf null nach Abschluss', () => {
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    expect(store.currentSyncDetails).to.be.null
  })

  it('speichert pushMetrics und pullMetrics im Log', () => {
    const push = { docs_written: 3 }
    const pull = { docs_read: 7 }
    store.finishSync({ endTime: new Date().toISOString(), push, pull })
    expect(store.syncLogs[0].pushMetrics.docs_written).to.equal(3)
    expect(store.syncLogs[0].pullMetrics.docs_read).to.equal(7)
  })
})

describe('manualSyncStore – failSync()', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useManualSyncStore()
    store.startSync()
  })

  it('setzt isSyncing auf false', () => {
    store.failSync(new Error('Netzwerkfehler'))
    expect(store.isSyncing).to.be.false
  })

  it('setzt syncProgress auf 0', () => {
    store.failSync(new Error('Timeout'))
    expect(store.syncProgress).to.equal(0)
  })

  it('setzt status auf "error" im Log', () => {
    store.failSync(new Error('Verbindung getrennt'))
    expect(store.syncLogs[0].status).to.equal('error')
  })

  it('speichert die Fehlermeldung korrekt im Log', () => {
    store.failSync(new Error('Failed to fetch'))
    expect(store.syncLogs[0].error).to.equal('Failed to fetch')
  })

  it('erstellt einen Fallback-Log-Eintrag wenn kein aktiver Sync läuft', () => {
    store.currentSyncDetails = null
    store.failSync(new Error('Unerwarteter Sync-Fehler'))
    expect(store.syncLogs).to.have.length(1)
    expect(store.syncLogs[0].status).to.equal('error')
  })

  it('setzt currentSyncDetails nach Fehler auf null', () => {
    store.failSync(new Error('Auth Error'))
    expect(store.currentSyncDetails).to.be.null
  })
})

describe('manualSyncStore – clearLogs()', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useManualSyncStore()
  })

  it('leert das syncLogs-Array vollständig', () => {
    store.startSync()
    store.finishSync({ endTime: new Date().toISOString(), push: {}, pull: {} })
    store.startSync()
    store.failSync(new Error('x'))
    expect(store.syncLogs.length).to.be.greaterThan(0)
    store.clearLogs()
    expect(store.syncLogs).to.have.length(0)
  })

  it('funktioniert auch wenn syncLogs bereits leer ist', () => {
    store.clearLogs()
    expect(store.syncLogs).to.have.length(0)
  })
})
