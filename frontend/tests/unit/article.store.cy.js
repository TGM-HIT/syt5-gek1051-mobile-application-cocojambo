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
    const article = {
      _id: 'a1',
      _rev: '1-abc',
      type: 'article',
      listId: 'list-1',
      name: 'Milch',
      quantity: 2,
      unit: 'l',
      note: 'alte Notiz',
      checked: false,
    }
    cy.window().then(async (win) => {
      await store.updateArticle('list-1', { ...article, note: 'neue Notiz' })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('neue Notiz')
    })
  })

  it('updateArticle kann Notiz auf leeren String setzen', () => {
    const article = {
      _id: 'a1',
      _rev: '1-abc',
      type: 'article',
      listId: 'list-1',
      name: 'Milch',
      quantity: 2,
      unit: 'l',
      note: 'wird gelöscht',
      checked: false,
    }
    cy.window().then(async (win) => {
      await store.updateArticle('list-1', { ...article, note: '' })
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('')
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
    const article = {
      _id: 'a1', _rev: '1-abc', type: 'article', listId: 'list-1',
      name: 'Milch', quantity: 2, unit: 'l', note: '', checked: false,
      price: 1.29, barcode: null, priceHistory: [],
    }
    cy.window().then(async (win) => {
      await store.updatePrice('list-1', article, 1.49)
      const [doc] = win.__db.put.args[0]
      expect(doc.price).to.equal(1.49)
      expect(doc.priceHistory).to.have.length(1)
      expect(doc.priceHistory[0].price).to.equal(1.49)
      expect(doc.priceHistory[0]).to.have.property('setAt')
    })
  })

  it('updatePrice does nothing when price is the same', () => {
    const article = {
      _id: 'a1', _rev: '1-abc', type: 'article', listId: 'list-1',
      name: 'Milch', quantity: 2, unit: 'l', note: '', checked: false,
      price: 1.49, barcode: null, priceHistory: [],
    }
    cy.window().then(async (win) => {
      await store.updatePrice('list-1', article, 1.49)
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('updatePrice caps priceHistory at 20 entries', () => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      price: 1.0 + i * 0.01,
      setAt: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`,
    }))
    const article = {
      _id: 'a1', _rev: '1-abc', type: 'article', listId: 'list-1',
      name: 'Milch', quantity: 2, unit: 'l', note: '', checked: false,
      price: 1.20, barcode: null, priceHistory: history,
    }
    cy.window().then(async (win) => {
      await store.updatePrice('list-1', article, 2.99)
      const [doc] = win.__db.put.args[0]
      expect(doc.priceHistory).to.have.length(20)
      expect(doc.priceHistory[19].price).to.equal(2.99)
    })
  })
})
