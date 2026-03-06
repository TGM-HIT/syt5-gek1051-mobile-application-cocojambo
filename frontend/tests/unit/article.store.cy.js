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
      await store.createArticle('list-1', 'Milch', 2, 'l', 'Bio bitte')
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('Bio bitte')
    })
  })

  it('createArticle speichert eine leere Notiz als leeren String', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', 'Brot', 1, '', '')
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal('')
    })
  })

  it('createArticle speichert eine sehr lange Notiz vollständig', () => {
    const longNote = 'A'.repeat(1000)
    cy.window().then(async (win) => {
      await store.createArticle('list-1', 'Butter', 1, 'kg', longNote)
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal(longNote)
      expect(doc.note).to.have.length(1000)
    })
  })

  it('createArticle setzt note auf leeren String wenn undefined übergeben wird', () => {
    cy.window().then(async (win) => {
      await store.createArticle('list-1', 'Käse', 1, 'kg', undefined)
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
      await store.createArticle('list-1', 'Ei', 6, 'Stk', specialNote)
      const [doc] = win.__db.put.args[0]
      expect(doc.note).to.equal(specialNote)
    })
  })
})
