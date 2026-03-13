import { createPinia, setActivePinia } from 'pinia'
import { useShoppingListStore } from '../stores/shoppingList.js'
import { seedLists } from '../db/seedData.js'
import HomeView from '../views/HomeView.vue'

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

    cy.mount(HomeView, {
      global: { plugins: [pinia] },
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

  it('calls deleteList when delete button is clicked', () => {
    store.lists = [mockLists[0]]
    cy.get('button[title="Liste löschen"]').click()
    cy.wrap(store.deleteList).should('have.been.calledWith', mockLists[0]._id, mockLists[0]._rev)
  })
})
