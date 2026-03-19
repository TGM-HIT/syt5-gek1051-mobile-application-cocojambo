import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useArticleStore } from '../../src/stores/article.js'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'
import { seedLists, seedArticles } from '../../src/db/seedData.js'
import ArticleListView from '../../src/views/ArticleListView.vue'

const mockList = {
  ...seedLists[0],
  _rev: '1-abc',
}

const mockArticles = [
  { ...seedArticles[0], checked: false, hidden: false, _rev: '1-a1' },
  { ...seedArticles[1], checked: false, hidden: false, _rev: '1-a2' },
]

const mockHiddenArticles = [
  { ...seedArticles[2], hidden: true, _rev: '1-a3' },
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

    cy.wrap(router.push(`/list/${mockList._id}`)).then(() => {
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
    cy.wrap(articleStore.hideArticle).should('have.been.calledWith', mockList._id, mockArticles[0])
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
    cy.wrap(articleStore.restoreArticle).should('have.been.calledWith', mockList._id, mockHiddenArticles[0])
  })

  it('calls deleteArticle when permanent delete button is clicked in hidden section', () => {
    articleStore.hiddenArticles = [...mockHiddenArticles]
    cy.contains('Ausgeblendete Artikel (1)').click()
    cy.get('button[title="Endgültig löschen"]').click()
    cy.wrap(articleStore.deleteArticle).should('have.been.calledWith', mockList._id, mockHiddenArticles[0]._id, mockHiddenArticles[0]._rev)
  })

  it('shows the count of hidden articles in the toggle button', () => {
    articleStore.hiddenArticles = [
      ...mockHiddenArticles,
      { ...seedArticles[6], hidden: true, _rev: '1-a4' },
    ]
    cy.contains('Ausgeblendete Artikel (2)').should('be.visible')
  })
})

// seedArticles[7] = Schrauben from seed-list-2
const mockOtherListArticle = {
  ...seedArticles[7], _rev: '1-b1',
}
// seedArticles[5] = Joghurt, hidden article from seed-list-1
const mockPastArticle = {
  ...seedArticles[5], _rev: '1-c1',
}

describe('ArticleListView – Suche', () => {
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
    cy.stub(articleStore, 'searchArticles').resolves()
    cy.stub(articleStore, 'addFromSearch').resolves()
    cy.stub(listStore, 'loadLists').resolves()

    listStore.lists = [mockList]

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/list/:id', component: ArticleListView }],
    })

    cy.wrap(router.push(`/list/${mockList._id}`)).then(() => {
      cy.mount(ArticleListView, {
        global: { plugins: [pinia, router] },
      })
    })
  })

  it('shows the search input', () => {
    cy.get('input[placeholder="Artikel suchen..."]').should('be.visible')
  })

  it('does not show results panel when query is empty', () => {
    cy.contains('In dieser Liste').should('not.exist')
    cy.contains('Aus anderen Listen').should('not.exist')
    cy.contains('Vergangene Artikel').should('not.exist')
  })

  it('does not show the clear button when query is empty', () => {
    cy.get('input[placeholder="Artikel suchen..."]').should('be.visible')
    cy.contains('button', '✕').should('not.exist')
  })

  it('calls searchArticles when typing', () => {
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.wrap(articleStore.searchArticles).should('have.been.calledWith', 'Milch', mockList._id)
  })

  it('shows clear button when query is not empty', () => {
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.get('button').filter(':contains("✕")').should('be.visible')
  })

  it('clears search and hides results on clear button click', () => {
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.get('button').filter(':contains("✕")').click()
    cy.get('input[placeholder="Artikel suchen..."]').should('have.value', '')
    cy.contains('In dieser Liste').should('not.exist')
  })

  it('shows "In dieser Liste" group when inCurrentList results exist', () => {
    articleStore.searchResults = { inCurrentList: [mockArticles[0]], inOtherLists: [], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.contains('In dieser Liste').should('be.visible')
    cy.contains('Milch').should('be.visible')
  })

  it('shows "Aus anderen Listen" group when inOtherLists results exist', () => {
    articleStore.searchResults = { inCurrentList: [], inOtherLists: [mockOtherListArticle], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Schrauben')
    cy.contains('Aus anderen Listen').should('be.visible')
  })

  it('shows "Vergangene Artikel" group when inPast results exist', () => {
    articleStore.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [mockPastArticle] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Joghurt')
    cy.contains('Vergangene Artikel').should('be.visible')
    cy.contains('Joghurt').should('be.visible')
  })

  it('shows "Keine Artikel gefunden" when all result groups are empty', () => {
    articleStore.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('xyz')
    cy.contains('Keine Artikel gefunden').should('be.visible')
  })

  it('calls toggleChecked when clicking a result in current list', () => {
    articleStore.searchResults = { inCurrentList: [mockArticles[0]], inOtherLists: [], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.contains('In dieser Liste').parent().contains('Milch').click()
    cy.wrap(articleStore.toggleChecked).should('have.been.calledWith', mockList._id, mockArticles[0])
  })

  it('calls addFromSearch and clears query when clicking a result from other list', () => {
    articleStore.searchResults = { inCurrentList: [], inOtherLists: [mockOtherListArticle], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Schrauben')
    cy.contains('Aus anderen Listen').parent().contains('Schrauben').click()
    cy.wrap(articleStore.addFromSearch).should('have.been.calledWith', mockList._id, mockOtherListArticle)
    cy.get('input[placeholder="Artikel suchen..."]').should('have.value', '')
  })

  it('calls addFromSearch and clears query when clicking a past article', () => {
    articleStore.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [mockPastArticle] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Joghurt')
    cy.contains('Vergangene Artikel').parent().contains('Joghurt').click()
    cy.wrap(articleStore.addFromSearch).should('have.been.calledWith', mockList._id, mockPastArticle)
    cy.get('input[placeholder="Artikel suchen..."]').should('have.value', '')
  })

  it('shows quantity and unit in search results', () => {
    articleStore.searchResults = { inCurrentList: [mockArticles[0]], inOtherLists: [], inPast: [] }
    cy.get('input[placeholder="Artikel suchen..."]').type('Milch')
    cy.contains('2 l').should('be.visible')
  })
})

describe('ArticleListView – Teilen', () => {
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

    cy.wrap(router.push(`/list/${mockList._id}`)).then(() => {
      cy.mount(ArticleListView, {
        global: { plugins: [pinia, router] },
      })
    })
  })

  it('shows the share button', () => {
    cy.contains('button', 'Teilen').should('be.visible')
  })

  it('opens share modal on button click', () => {
    cy.contains('button', 'Teilen').click()
    cy.contains('h2', 'Liste teilen').should('be.visible')
  })

  it('displays the share code in the modal', () => {
    cy.contains('button', 'Teilen').click()
    cy.contains(mockList.shareCode).should('be.visible')
  })

  it('closes share modal on Schliessen click', () => {
    cy.contains('button', 'Teilen').click()
    cy.contains('h2', 'Liste teilen').should('be.visible')
    cy.contains('button', 'Schliessen').click()
    cy.contains('h2', 'Liste teilen').should('not.exist')
  })
})

describe('ArticleListView – CSV Export', () => {
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

    cy.wrap(router.push(`/list/${mockList._id}`)).then(() => {
      cy.mount(ArticleListView, {
        global: { plugins: [pinia, router] },
      })
    })
  })

  it('shows the CSV export button', () => {
    cy.get('#btn-export-csv').should('be.visible')
  })

  it('CSV export button has the correct label', () => {
    cy.get('#btn-export-csv').should('contain.text', 'CSV')
  })

  it('triggers a download when CSV export button is clicked', () => {
    articleStore.articles = [...mockArticles]
    articleStore.hiddenArticles = []

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').returns('blob:mock')
      cy.stub(win.URL, 'revokeObjectURL').returns(undefined)
    })

    cy.get('#btn-export-csv').click()
    cy.window().its('URL.createObjectURL').should('have.been.calledOnce')
  })

  it('does not crash when article list is empty', () => {
    articleStore.articles = []
    articleStore.hiddenArticles = []

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').returns('blob:mock')
      cy.stub(win.URL, 'revokeObjectURL').returns(undefined)
    })

    cy.get('#btn-export-csv').click()
    cy.window().its('URL.createObjectURL').should('have.been.calledOnce')
  })

  it('includes all visible articles in the CSV export', () => {
    const articleWithNote = {
      ...seedArticles[0],
      checked: false,
      hidden: false,
      note: 'Bio bitte',
      _rev: '1-a1',
    }
    articleStore.articles = [articleWithNote]
    articleStore.hiddenArticles = []

    let capturedBlob = null

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake((blob) => {
        capturedBlob = blob
        return 'blob:mock'
      })
      cy.stub(win.URL, 'revokeObjectURL').returns(undefined)
    })

    cy.get('#btn-export-csv').click()

    cy.then(async () => {
      const text = await capturedBlob.text()
      expect(text).to.include('Name,Menge,Einheit,Notiz,Erledigt')
      expect(text).to.include('Milch')
      expect(text).to.include('Bio bitte')
      expect(text).to.include('Nein')
    })
  })

  it('marks checked articles as "Ja" in the CSV', () => {
    const checkedArticle = {
      ...seedArticles[1],
      checked: true,
      hidden: false,
      _rev: '1-a2',
    }
    articleStore.articles = [checkedArticle]
    articleStore.hiddenArticles = []

    let capturedBlob = null

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake((blob) => {
        capturedBlob = blob
        return 'blob:mock'
      })
      cy.stub(win.URL, 'revokeObjectURL').returns(undefined)
    })

    cy.get('#btn-export-csv').click()

    cy.then(async () => {
      const text = await capturedBlob.text()
      expect(text).to.include('Ja')
    })
  })

  it('includes hidden articles in the CSV export', () => {
    articleStore.articles = []
    articleStore.hiddenArticles = [...mockHiddenArticles]

    let capturedBlob = null

    cy.window().then((win) => {
      cy.stub(win.URL, 'createObjectURL').callsFake((blob) => {
        capturedBlob = blob
        return 'blob:mock'
      })
      cy.stub(win.URL, 'revokeObjectURL').returns(undefined)
    })

    cy.get('#btn-export-csv').click()

    cy.then(async () => {
      const text = await capturedBlob.text()
      expect(text).to.include('Butter')
    })
  })
})
