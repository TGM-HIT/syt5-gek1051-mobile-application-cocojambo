import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'
import { seedLists } from '../../src/db/seedData.js'
import HomeView from '../../src/views/HomeView.vue'

const mockLists = [
  { ...seedLists[0], _rev: '1-abc' },
  { ...seedLists[1], category: '', _rev: '1-def' },
]

describe('HomeView', () => {
  let store

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    store = useShoppingListStore()

    cy.stub(store, 'loadLists').resolves()
    cy.stub(store, 'createList').resolves()
    cy.stub(store, 'deleteList').resolves()
    cy.stub(store, 'joinList').resolves(null)

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', component: HomeView },
        { path: '/list/:id', component: { template: '<div />' } },
      ],
    })

    cy.mount(HomeView, {
      global: { plugins: [pinia, router] },
    })
  })

  it('renders the page header', () => {
    cy.get('h1').should('contain', 'Einkaufslisten')
  })

  it('shows the create button', () => {
    cy.contains('+ Neue Liste erstellen').should('be.visible')
  })

  it('calls loadLists on mount', () => {
    cy.wrap(store.loadLists).should('have.been.called')
  })

  it('shows empty state when no lists', () => {
    cy.contains('Noch keine Listen vorhanden').should('be.visible')
  })

  it('shows list cards when lists exist', () => {
    store.lists = [...mockLists]
    cy.contains('Wocheneinkauf').should('be.visible')
    cy.contains('Baumarkt').should('be.visible')
  })

  it('shows category badge for list with category', () => {
    store.lists = [mockLists[0]]
    cy.contains('span', 'Lebensmittel').should('be.visible')
  })

  it('does not show category badge for list without category', () => {
    store.lists = [mockLists[1]]
    cy.contains('h2', 'Baumarkt').parent().within(() => {
      cy.get('span').should('not.exist')
    })
  })

  it('opens the create modal on button click', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.contains('h2', 'Neue Liste erstellen').should('be.visible')
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').should('be.visible')
    cy.get('input[placeholder="z.B. Lebensmittel"]').should('be.visible')
  })

  it('closes modal on Abbrechen click', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.contains('button', 'Abbrechen').click()
    cy.contains('h2', 'Neue Liste erstellen').should('not.exist')
  })

  it('does not call createList when name is empty', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.contains('button', 'Erstellen').click()
    cy.wrap(store.createList).should('not.have.been.called')
  })

  it('calls createList with name and category on valid submit', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Test Liste')
    cy.get('input[placeholder="z.B. Lebensmittel"]').type('Test Kategorie')
    cy.contains('button', 'Erstellen').click()
    cy.wrap(store.createList).should('have.been.calledWith', 'Test Liste', 'Test Kategorie')
  })

  it('closes modal after successful create', () => {
    cy.contains('+ Neue Liste erstellen').click()
    cy.get('input[placeholder="z.B. Wocheneinkauf"]').type('Test Liste')
    cy.contains('button', 'Erstellen').click()
    cy.contains('h2', 'Neue Liste erstellen').should('not.exist')
  })

  it('calls deleteList after confirmation', () => {
    store.lists = [mockLists[0]]
    cy.get('button[title="Liste löschen"]').click()
    cy.contains('h2', 'Liste löschen?').should('be.visible')
    cy.contains('button', 'Löschen').click()
    cy.wrap(store.deleteList).should('have.been.calledWith', mockLists[0]._id, mockLists[0]._rev)
  })

  it('shows the join button', () => {
    cy.contains('Liste beitreten').should('be.visible')
  })

  it('opens the join modal on button click', () => {
    cy.contains('Liste beitreten').click()
    cy.contains('h2', 'Liste beitreten').should('be.visible')
    cy.get('input[placeholder="z.B. A3X9K2"]').should('be.visible')
  })

  it('closes join modal on Abbrechen click', () => {
    cy.contains('Liste beitreten').click()
    cy.contains('h2', 'Liste beitreten').should('be.visible')
    cy.contains('button', 'Abbrechen').click()
    cy.contains('h2', 'Liste beitreten').should('not.exist')
  })

  it('shows error message when code is not found', () => {
    cy.contains('Liste beitreten').click()
    cy.get('input[placeholder="z.B. A3X9K2"]').type('WRONG1')
    cy.contains('button', 'Beitreten').click()
    cy.contains('Keine Liste mit diesem Code gefunden').should('be.visible')
  })

  it('calls joinList with entered code', () => {
    cy.contains('Liste beitreten').click()
    cy.get('input[placeholder="z.B. A3X9K2"]').type('ABC123')
    cy.contains('button', 'Beitreten').click()
    cy.wrap(store.joinList).should('have.been.calledWith', 'ABC123')
  })

  it('closes join modal on successful join', () => {
    store.joinList.resolves({ _id: 'list-1', name: 'Test' })
    cy.contains('Liste beitreten').click()
    cy.get('input[placeholder="z.B. A3X9K2"]').type('ABC123')
    cy.contains('button', 'Beitreten').click()
    cy.contains('h2', 'Liste beitreten').should('not.exist')
  })
})
