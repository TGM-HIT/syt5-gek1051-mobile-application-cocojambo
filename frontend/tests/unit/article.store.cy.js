import { createPinia, setActivePinia } from 'pinia'
import { useArticleStore } from '../../src/stores/article.js'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

describe('ArticleStore – Notiz Store-Methoden', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()

    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('createArticle speichert eine normale Notiz korrekt', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Milch', quantity: 2, unit: 'l', note: 'Bio bitte' })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('Bio bitte')
    })
  })

  it('createArticle speichert eine leere Notiz als leeren String', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Brot', quantity: 1, unit: '', note: '' })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('')
    })
  })

  it('createArticle speichert eine sehr lange Notiz vollständig', () => {
    const longNote = 'A'.repeat(1000)
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Butter', quantity: 1, unit: 'kg', note: longNote })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal(longNote)
      expect(doc.note).to.have.length(1000)
    })
  })

  it('createArticle setzt note auf leeren String wenn undefined übergeben wird', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Käse', quantity: 1, unit: 'kg', note: undefined })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('')
    })
  })

  it('updateArticle speichert die geänderte Notiz korrekt', () => {
    cy.window().then(async (win) => {
      await store.updateArticle('list-1', 'a1', { note: 'neue Notiz' })
      const [doc] = win.__db.put.args[0]
      expect(doc.fields.note).to.equal('neue Notiz')
    })
  })

  it('updateArticle kann Notiz auf leeren String setzen', () => {
    cy.window().then(async (win) => {
      await store.updateArticle('list-1', 'a1', { note: '' })
      const [doc] = win.__db.put.args[0]
      expect(doc.fields.note).to.equal('')
    })
  })

  it('createArticle speichert Notiz mit Sonderzeichen korrekt', () => {
    const specialNote = 'Nur beim Hofer! (Bio) – max. 2 Stück, kein Diskonter'
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Ei', quantity: 6, unit: 'Stk', note: specialNote })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal(specialNote)
    })
  })
})

describe('ArticleStore – Preis-Funktionen', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()

    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('createArticle sets price and barcode when provided', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Milch', quantity: 2, unit: 'l', price: 1.49, barcode: '123456' })
      const [doc] = win.__db.put.args[0]
      expect(doc.price).to.equal(1.49)
      expect(doc.barcode).to.equal('123456')
      expect(doc.priceHistory).to.deep.equal([])
    })
  })

  it('createArticle defaults price and barcode to null', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Brot', quantity: 1 })
      const [doc] = win.__db.put.args[0]
      expect(doc.price).to.equal(null)
      expect(doc.barcode).to.equal(null)
      expect(doc.priceHistory).to.deep.equal([])
    })
  })

  it('createArticle sets hidden to false explicitly', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', { name: 'Butter', quantity: 1 })
      const [doc] = win.__db.put.args[0]
      expect(doc.hidden).to.equal(false)
    })
  })

  it('updatePrice adds history entry when price changes', () => {
    cy.window().then(async (win) => {
      await store.updatePrice('list-1', 'a1', 1.29, 1.49)
      const [doc] = win.__db.put.args[0]
      expect(doc.fields.price).to.equal(1.49)
      expect(doc.priceHistoryEntry.price).to.equal(1.49)
      expect(doc.priceHistoryEntry).to.have.property('setAt')
    })
  })

  it('updatePrice does nothing when price is the same', () => {
    cy.window().then(async (win) => {
      await store.updatePrice('list-1', 'a1', 1.49, 1.49)
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('loadArticles caps priceHistory at 20 entries when many patches exist', () => {
    const baseArticle = {
      _id: 'a1', type: 'article', listId: 'list-1',
      name: 'Milch', quantity: 2, unit: 'l', note: '', checked: false, hidden: false,
      price: 1.0, barcode: null, priceHistory: [],
      createdBy: 'test', createdAt: '2026-01-01T00:00:00.000Z',
    }
    const patches = Array.from({ length: 21 }, (_, i) => ({
      _id: `patch-a1-${i}`,
      type: 'article-patch',
      articleId: 'a1',
      listId: 'list-1',
      fields: { price: i + 1 },
      priceHistoryEntry: { price: i + 1, setAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z` },
      editedAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    }))
    cy.window().then(async (win) => {
      win.__db.allDocs.resolves(makeAllDocsResult([baseArticle, ...patches]))
      await store.loadArticles('list-1')
      expect(store.articles[0].priceHistory).to.have.length(20)
      expect(store.articles[0].priceHistory[19].price).to.equal(21)
    })
  })
})
