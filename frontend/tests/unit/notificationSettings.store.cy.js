import { createPinia, setActivePinia } from 'pinia'
import { useNotificationSettingsStore } from '../../src/stores/notificationSettings.js'

describe('NotificationSettings – Standardwerte', () => {
  beforeEach(() => {
    localStorage.removeItem('notif-sound')
    localStorage.removeItem('notif-vibration')
  })

  it('soundEnabled ist standardmäßig true', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.soundEnabled).to.be.true
  })

  it('vibrationEnabled ist standardmäßig true', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.vibrationEnabled).to.be.true
  })

  it('soundEnabled ist false wenn localStorage "false" enthält', () => {
    localStorage.setItem('notif-sound', 'false')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.soundEnabled).to.be.false
  })

  it('vibrationEnabled ist false wenn localStorage "false" enthält', () => {
    localStorage.setItem('notif-vibration', 'false')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.vibrationEnabled).to.be.false
  })

  it('soundEnabled ist true wenn localStorage "true" enthält', () => {
    localStorage.setItem('notif-sound', 'true')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.soundEnabled).to.be.true
  })

  it('vibrationEnabled ist true wenn localStorage "true" enthält', () => {
    localStorage.setItem('notif-vibration', 'true')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.vibrationEnabled).to.be.true
  })
})

describe('NotificationSettings – toggleSound', () => {
  beforeEach(() => {
    localStorage.removeItem('notif-sound')
  })

  it('togglet soundEnabled von true zu false', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    expect(store.soundEnabled).to.be.true
    store.toggleSound()
    expect(store.soundEnabled).to.be.false
  })

  it('togglet soundEnabled von false zu true', () => {
    localStorage.setItem('notif-sound', 'false')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleSound()
    expect(store.soundEnabled).to.be.true
  })

  it('togglet zweimal zurück zum Ausgangszustand', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleSound()
    store.toggleSound()
    expect(store.soundEnabled).to.be.true
  })

  it('persistiert soundEnabled=false in localStorage', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleSound()
    cy.wrap(null).should(() => {
      expect(localStorage.getItem('notif-sound')).to.equal('false')
    })
  })

  it('persistiert soundEnabled=true in localStorage nach erneutem Aktivieren', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleSound() // true → false
    cy.wrap(null).should(() => {
      expect(localStorage.getItem('notif-sound')).to.equal('false')
    })
    cy.wrap(null).then(() => store.toggleSound()) // false → true, after watcher has flushed
    cy.wrap(null).should(() => {
      expect(localStorage.getItem('notif-sound')).to.equal('true')
    })
  })
})

describe('NotificationSettings – toggleVibration', () => {
  beforeEach(() => {
    localStorage.removeItem('notif-vibration')
  })

  it('togglet vibrationEnabled von true zu false', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleVibration()
    expect(store.vibrationEnabled).to.be.false
  })

  it('togglet vibrationEnabled von false zu true', () => {
    localStorage.setItem('notif-vibration', 'false')
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleVibration()
    expect(store.vibrationEnabled).to.be.true
  })

  it('persistiert vibrationEnabled=false in localStorage', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleVibration()
    cy.wrap(null).should(() => {
      expect(localStorage.getItem('notif-vibration')).to.equal('false')
    })
  })

  it('togglet vibrationEnabled unabhängig von soundEnabled', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleVibration()
    expect(store.vibrationEnabled).to.be.false
    expect(store.soundEnabled).to.be.true
  })

  it('togglet soundEnabled unabhängig von vibrationEnabled', () => {
    setActivePinia(createPinia())
    const store = useNotificationSettingsStore()
    store.toggleSound()
    expect(store.soundEnabled).to.be.false
    expect(store.vibrationEnabled).to.be.true
  })
})
