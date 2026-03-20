import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../../src/views/HomeView.vue'
import { useThemeStore } from '../../src/stores/theme.js'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'

function mountHomeView() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const listStore = useShoppingListStore()
  cy.stub(listStore, 'loadLists').resolves()
  cy.stub(listStore, 'createList').resolves()
  cy.stub(listStore, 'deleteList').resolves()
  cy.stub(listStore, 'joinList').resolves(null)

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: HomeView },
      { path: '/list/:id', component: { template: '<div />' } },
    ],
  })

  cy.mount(HomeView, { global: { plugins: [pinia, router] } })
  return useThemeStore()
}

describe('Dark/Light Mode', () => {
  beforeEach(() => {
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark')
  })

  it('startet standardmäßig im Light Mode', () => {
    mountHomeView()
    cy.document().its('documentElement.classList').should('not.contain', 'dark')
  })

  it('zeigt den Dark-Mode-Toggle-Button', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').should('be.visible')
  })

  it('wechselt zu Dark Mode bei Klick auf den Toggle', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
  })

  it('wechselt zurück zu Light Mode bei erneutem Klick', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').click()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.get('button[title="Light Mode"]').click()
    cy.document().its('documentElement.classList').should('not.contain', 'dark')
  })

  it('speichert die Auswahl in localStorage', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').click()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.equal('dark')
    })
  })

  it('speichert Light Mode in localStorage nach Zurückwechseln', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').click()
    cy.get('button[title="Light Mode"]').click()
    cy.window().then((win) => {
      expect(win.localStorage.getItem('theme')).to.equal('light')
    })
  })

  it('lädt Dark Mode aus localStorage', () => {
    localStorage.setItem('theme', 'dark')
    mountHomeView()
    cy.document().its('documentElement.classList').should('contain', 'dark')
    cy.get('button[title="Light Mode"]').should('be.visible')
  })

  it('zeigt Sonnen-Icon im Dark Mode und Mond-Icon im Light Mode', () => {
    mountHomeView()
    cy.get('button[title="Dark Mode"]').should('contain', '🌙')
    cy.get('button[title="Dark Mode"]').click()
    cy.get('button[title="Light Mode"]').should('contain', '☀️')
  })
})

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.removeItem('theme')
    document.documentElement.classList.remove('dark')
  })

  it('isDark ist false standardmäßig', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeStore()
    expect(store.isDark).to.be.false
  })

  it('isDark ist true wenn localStorage "dark" gesetzt ist', () => {
    localStorage.setItem('theme', 'dark')
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeStore()
    expect(store.isDark).to.be.true
  })

  it('toggle() wechselt isDark', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeStore()
    expect(store.isDark).to.be.false
    store.toggle()
    expect(store.isDark).to.be.true
    store.toggle()
    expect(store.isDark).to.be.false
  })

  it('toggle() aktualisiert localStorage', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeStore()
    store.toggle()
    expect(localStorage.getItem('theme')).to.equal('dark')
    store.toggle()
    expect(localStorage.getItem('theme')).to.equal('light')
  })

  it('toggle() setzt die dark-Klasse auf documentElement', () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const store = useThemeStore()
    store.toggle()
    expect(document.documentElement.classList.contains('dark')).to.be.true
    store.toggle()
    expect(document.documentElement.classList.contains('dark')).to.be.false
  })
})
