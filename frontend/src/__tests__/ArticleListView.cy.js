import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useArticleStore } from '../stores/article.js'
import { useShoppingListStore } from '../stores/shoppingList.js'
import ArticleListView from '../views/ArticleListView.vue'

const mockList = {
  _id: 'list-1',
  name: 'Wocheneinkauf',
  category: 'Lebensmittel',
  createdAt: '2024-01-01T10:00:00.000Z',
  _rev: '1-abc',
}

const mockArticles = [
  { _id: 'a1', type: 'article', listId: 'list-1', name: 'Milch', quantity: 2, unit: 'l', checked: false, hidden: false, _rev: '1-a1' },
  { _id: 'a2', type: 'article', listId: 'list-1', name: 'Brot', quantity: 1, unit: '', checked: false, hidden: false, _rev: '1-a2' },
]

const mockHiddenArticles = [
  { _id: 'a3', type: 'article', listId: 'list-1', name: 'Butter', quantity: 1, unit: 'kg', checked: false, hidden: true, _rev: '1-a3' },
]

describe('ArticleListView – Ausblenden & Löschen', () => {
  let articleStore, listStore

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)

    articleStore = useArticleStore()
    listStore = useShoppingListStore()

    cy.stub(articleStore, 'loadArticles').resolves()
    cy.stub(articleStore, 'createArticle').resolves()
    cy.stub(articleStore, 'updateArticle').resolves()
    cy.stub(articleStore, 'toggleChecked').resolves()
    cy.stub(articleStore, 'hideArticle').resolves()
    cy.stub(articleStore, 'restoreArticle').resolves()
    cy.stub(articleStore, 'deleteArticle').resolves()
    cy.stub(listStore, 'loadLists').resolves()

    listStore.lists = [mockList]

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/list/:id', component: ArticleListView }],
    })

    cy.wrap(router.push('/list/list-1')).then(() => {
      cy.mount(ArticleListView, {
        global: { plugins: [pinia, router] },
      })
    })
  })

  it('shows active articles', () => {
    articleStore.articles = [...mockArticles]
    cy.contains('Milch').should('be.visible')
    cy.contains('Brot').should('be.visible')
  })

  it('calls hideArticle when the hide button is clicked', () => {
    articleStore.articles = [mockArticles[0]]
    cy.get('button[title="Ausblenden"]').click()
    cy.wrap(articleStore.hideArticle).should('have.been.calledWith', 'list-1', mockArticles[0])
  })

  it('does not call deleteArticle when hide button is clicked', () => {
    articleStore.articles = [mockArticles[0]]
    cy.get('button[title="Ausblenden"]').click()
    cy.wrap(articleStore.deleteArticle).should('not.have.been.called')
  })

  it('hidden articles section is not shown when hiddenArticles is empty', () => {
    articleStore.articles = [...mockArticles]
    articleStore.hiddenArticles = []
    cy.contains('Ausgeblendete Artikel').should('not.exist')
  })

  it('shows toggle button when hiddenArticles exist', () => {
    articleStore.articles = [...mockArticles]
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').should('be.visible')
  })

  it('hidden articles list is collapsed by default', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').should('be.visible')
    cy.contains('Butter').should('not.exist')
  })

  it('expands hidden articles on toggle click', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.contains('Butter').should('be.visible')
  })

  it('collapses hidden articles on second toggle click', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.contains('Butter').should('be.visible')
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.contains('Butter').should('not.exist')
  })

  it('calls restoreArticle when restore button is clicked', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.get('button[title="Wiederherstellen"]').click()
    cy.wrap(articleStore.restoreArticle).should('have.been.calledWith', 'list-1', mockHiddenArticles[0])
  })

  it('calls deleteArticle when permanent delete button is clicked in hidden section', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.get('button[title="Endgültig löschen"]').click()
    cy.wrap(articleStore.deleteArticle).should('have.been.calledWith', 'list-1', 'a3', '1-a3')
  })

  it('shows the count of hidden articles in the toggle button', () => {
    articleStore.hiddenArticles = [
      ...mockHiddenArticles,
      { _id: 'a4', name: 'Käse', quantity: 1, unit: '', hidden: true, _rev: '1-a4' },
    ]
    cy.contains('Ausgeblendete Artikel (2)').should('be.visible')
  })
})
