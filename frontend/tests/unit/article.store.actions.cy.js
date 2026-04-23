import { createPinia, setActivePinia } from 'pinia'
import { useArticleStore } from '../../src/stores/article.js'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

describe('ArticleStore – toggleChecked', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('sets checked to true for an unchecked article', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', checked: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.toggleChecked('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.checked).to.be.true
    })
  })

  it('sets checked to false for a checked article', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', checked: true }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.toggleChecked('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.checked).to.be.false
    })
  })

  it('creates a check-event document when checking an article', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', checked: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.toggleChecked('list-1', article)
      expect(win.__db.put).to.have.been.calledTwice
      const checkEvent = win.__db.put.args[1][0]
      expect(checkEvent.type).to.equal('check-event')
      expect(checkEvent.articleId).to.equal('art-1')
      expect(checkEvent.articleName).to.equal('Milch')
      expect(checkEvent.listId).to.equal('list-1')
    })
  })

  it('check-event has a valid ISO checkedAt timestamp', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', checked: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.toggleChecked('list-1', article)
      const checkEvent = win.__db.put.args[1][0]
      expect(checkEvent.checkedAt).to.be.a('string')
      expect(() => new Date(checkEvent.checkedAt)).to.not.throw()
    })
  })

  it('does not create a check-event when unchecking an article', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', checked: true }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.toggleChecked('list-1', article)
      expect(win.__db.put).to.have.been.calledOnce
    })
  })
})

describe('ArticleStore – hideArticle', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('sets hidden to true', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.hideArticle('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.hidden).to.be.true
    })
  })

  it('stores a valid ISO hiddenAt timestamp', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.hideArticle('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.hiddenAt).to.be.a('string')
      expect(() => new Date(doc.hiddenAt)).to.not.throw()
    })
  })

  it('preserves all other article fields when hiding', () => {
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', listId: 'list-1', name: 'Milch', hidden: false, price: 1.49 }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.hideArticle('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.name).to.equal('Milch')
      expect(doc.price).to.equal(1.49)
    })
  })
})

describe('ArticleStore – restoreArticle', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('sets hidden to false', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: true }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.restoreArticle('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.hidden).to.be.false
    })
  })

  it('preserves the article name when restoring', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Butter', hidden: true }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves({ ...article })
      cy.stub(win.__db, 'put').resolves({ ok: true })
      await store.restoreArticle('list-1', article)
      const [doc] = win.__db.put.args[0]
      expect(doc.name).to.equal('Butter')
    })
  })
})

describe('ArticleStore – deleteArticle', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('creates a delete-intent document', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      await store.deleteArticle('list-1', 'art-1', '1-a', 'Milch')
      const [doc] = win.__db.put.args[0]
      expect(doc.type).to.equal('delete-intent')
      expect(doc.articleId).to.equal('art-1')
      expect(doc.listId).to.equal('list-1')
    })
  })

  it('uses the delete-intent-{id} id pattern', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      await store.deleteArticle('list-1', 'art-1', '1-a', 'Milch')
      const [doc] = win.__db.put.args[0]
      expect(doc._id).to.equal('delete-intent-art-1')
    })
  })

  it('stores the article name in the delete-intent', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      await store.deleteArticle('list-1', 'art-1', '1-a', 'Apfel')
      const [doc] = win.__db.put.args[0]
      expect(doc.articleName).to.equal('Apfel')
    })
  })

  it('calls db.remove with the article id and rev', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      await store.deleteArticle('list-1', 'art-1', '1-abc', 'Milch')
      expect(win.__db.remove).to.have.been.calledWith('art-1', '1-abc')
    })
  })

  it('stores a valid ISO deletedAt timestamp', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      await store.deleteArticle('list-1', 'art-1', '1-a', 'Milch')
      const [doc] = win.__db.put.args[0]
      expect(doc.deletedAt).to.be.a('string')
      expect(() => new Date(doc.deletedAt)).to.not.throw()
    })
  })

  it('gracefully handles a stale rev when db.remove fails', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'remove').rejects(new Error('conflict'))
      await store.deleteArticle('list-1', 'art-1', '1-stale', 'Milch')
      expect(win.__db.put).to.have.been.called
    })
  })
})

describe('ArticleStore – searchArticles', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('clears all results when query is empty string', () => {
    store.searchResults = { inCurrentList: [{ name: 'x' }], inOtherLists: [], inPast: [] }
    cy.window().then(async () => {
      await store.searchArticles('', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(0)
      expect(store.searchResults.inOtherLists).to.have.length(0)
      expect(store.searchResults.inPast).to.have.length(0)
    })
  })

  it('clears all results when query is whitespace only', () => {
    cy.window().then(async () => {
      await store.searchArticles('   ', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(0)
    })
  })

  it('finds visible articles in the current list', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
      expect(store.searchResults.inCurrentList[0].name).to.equal('Milch')
    })
  })

  it('finds visible articles in other lists', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-99', name: 'Butter', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.searchArticles('Butter', 'list-1')
      expect(store.searchResults.inOtherLists).to.have.length(1)
      expect(store.searchResults.inCurrentList).to.have.length(0)
    })
  })

  it('places hidden articles in the inPast bucket', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Käse', hidden: true }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.searchArticles('Käse', 'list-1')
      expect(store.searchResults.inPast).to.have.length(1)
      expect(store.searchResults.inCurrentList).to.have.length(0)
    })
  })

  it('is case-insensitive', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.searchArticles('milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
    })
  })

  it('does a substring match', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Vollmilch', hidden: false }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.searchArticles('milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
    })
  })

  it('excludes articles that have a delete-intent', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false }
    const deleteIntent = { _id: 'delete-intent-art-1', type: 'delete-intent', articleId: 'art-1' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, deleteIntent]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(0)
    })
  })

  it('applies patches before filtering by name', () => {
    const article = { _id: 'art-1', type: 'article', listId: 'list-1', name: 'Milch', hidden: false, priceHistory: [], createdAt: '2026-01-01T00:00:00.000Z' }
    const patch = {
      _id: 'patch-art-1-1', type: 'article-patch', articleId: 'art-1', listId: 'list-1',
      fields: { name: 'Vollmilch' }, editedAt: '2026-01-01T01:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patch]))
      await store.searchArticles('Vollmilch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
    })
  })
})

describe('ArticleStore – addFromSearch', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('creates an article with name, quantity and tag from the search result', () => {
    const searchArticle = { name: 'Milch', quantity: 2, tag: 'Milchprodukte' }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.name).to.equal('Milch')
      expect(doc.quantity).to.equal(2)
      expect(doc.tag).to.equal('Milchprodukte')
    })
  })

  it('clears all search results after adding', () => {
    store.searchResults = { inCurrentList: [{ name: 'x' }], inOtherLists: [{ name: 'y' }], inPast: [] }
    const searchArticle = { name: 'Milch', quantity: 1 }
    cy.window().then(async () => {
      await store.addFromSearch('list-1', searchArticle)
      expect(store.searchResults.inCurrentList).to.have.length(0)
      expect(store.searchResults.inOtherLists).to.have.length(0)
    })
  })

  it('prefers packageUnit over unit when both are present', () => {
    const searchArticle = { name: 'Öl', quantity: 1, packageUnit: 'ml', unit: 'l' }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.packageUnit).to.equal('ml')
    })
  })

  it('falls back to unit when packageUnit is absent', () => {
    const searchArticle = { name: 'Öl', quantity: 1, unit: 'l' }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.packageUnit).to.equal('l')
    })
  })

  it('carries the barcode from the source article', () => {
    const searchArticle = { name: 'Cola', quantity: 1, barcode: '5449000133335' }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.barcode).to.equal('5449000133335')
    })
  })

  it('sets barcode to null when not present in source article', () => {
    const searchArticle = { name: 'Brot', quantity: 1 }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.barcode).to.be.null
    })
  })

  it('uses empty string for tag when source article has no tag', () => {
    const searchArticle = { name: 'Brot', quantity: 1 }
    cy.window().then(async (win) => {
      await store.addFromSearch('list-1', searchArticle)
      const [doc] = win.__db.put.args[0]
      expect(doc.tag).to.equal('')
    })
  })
})
