import { createPinia, setActivePinia } from 'pinia'
import { useArticleStore } from '../../src/stores/article.js'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

const baseArticle = (overrides = {}) => ({
  _id: 'a1',
  type: 'article',
  listId: 'list-1',
  name: 'Milch',
  quantity: 1,
  unit: 'l',
  note: '',
  price: 1.0,
  barcode: null,
  priceHistory: [],
  checked: false,
  hidden: false,
  createdBy: 'userA#0001',
  createdAt: '2026-01-01T10:00:00.000Z',
  ...overrides,
})

const makePatch = (overrides = {}) => ({
  _id: `patch-a1-${Date.now()}-xxx`,
  type: 'article-patch',
  articleId: 'a1',
  listId: 'list-1',
  fields: {},
  editedBy: 'userA#0001',
  editedAt: '2026-01-01T11:00:00.000Z',
  ...overrides,
})

describe('Sync – Delete wins', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
    })
  })

  it('filtert Artikel heraus wenn eine delete-intent vorhanden ist', () => {
    const article = baseArticle()
    const deleteIntent = {
      _id: 'delete-intent-a1',
      type: 'delete-intent',
      articleId: 'a1',
      listId: 'list-1',
      deletedAt: '2026-01-01T12:00:00.000Z',
      deletedBy: 'userB#0002',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, deleteIntent]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(0)
    })
  })

  it('delete-intent gewinnt auch wenn neuere Patches existieren', () => {
    const article = baseArticle()
    const deleteIntent = {
      _id: 'delete-intent-a1',
      type: 'delete-intent',
      articleId: 'a1',
      listId: 'list-1',
      deletedAt: '2026-01-01T09:00:00.000Z',
      deletedBy: 'userB#0002',
    }
    const laterPatch = makePatch({
      _id: 'patch-a1-later',
      fields: { name: 'Bio-Milch' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T12:00:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, deleteIntent, laterPatch]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(0)
    })
  })

  it('zeigt Artikel an wenn keine delete-intent existiert', () => {
    const article = baseArticle()
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(1)
    })
  })

  it('delete-intent eines anderen Artikels beeinflusst den eigenen nicht', () => {
    const article = baseArticle()
    const otherDeleteIntent = {
      _id: 'delete-intent-a99',
      type: 'delete-intent',
      articleId: 'a99',
      listId: 'list-1',
      deletedAt: '2026-01-01T12:00:00.000Z',
      deletedBy: 'userB#0002',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, otherDeleteIntent]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(1)
      expect(store.articles[0]._id).to.equal('a1')
    })
  })
})

describe('Sync – Last-Write-Wins bei gleichem Feld', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
    })
  })

  it('späterer Preis-Patch gewinnt bei zwei gleichzeitigen Preisänderungen', () => {
    const article = baseArticle({ price: 1.0 })
    const patchA = makePatch({
      _id: 'patch-a1-early',
      fields: { price: 2.0 },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchB = makePatch({
      _id: 'patch-a1-late',
      fields: { price: 2.5 },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T12:00:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchA, patchB]))
      await store.loadArticles('list-1')
      expect(store.articles[0].price).to.equal(2.5)
    })
  })

  it('früherer Preis-Patch verliert gegen späteren', () => {
    const article = baseArticle({ price: 1.0 })
    const patchA = makePatch({
      _id: 'patch-a1-early',
      fields: { price: 20.0 },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T10:00:00.000Z',
    })
    const patchB = makePatch({
      _id: 'patch-a1-late',
      fields: { price: 25.0 },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchA, patchB]))
      await store.loadArticles('list-1')
      expect(store.articles[0].price).to.equal(25.0)
    })
  })

  it('späterer Name-Patch gewinnt bei zwei gleichzeitigen Namensänderungen', () => {
    const article = baseArticle({ name: 'Milch' })
    const patchA = makePatch({
      _id: 'patch-a1-early',
      fields: { name: 'Vollmilch' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T10:00:00.000Z',
    })
    const patchB = makePatch({
      _id: 'patch-a1-late',
      fields: { name: 'Bio-Vollmilch' },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchA, patchB]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Bio-Vollmilch')
    })
  })
})

describe('Sync – Field-Level Merge bei unterschiedlichen Feldern', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
    })
  })

  it('Preis- und Namensänderung von verschiedenen Nutzern bleiben beide erhalten', () => {
    const article = baseArticle({ name: 'Milch', price: 1.0 })
    const patchPrice = makePatch({
      _id: 'patch-a1-price',
      fields: { price: 1.99 },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchName = makePatch({
      _id: 'patch-a1-name',
      fields: { name: 'Bio-Milch' },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:30:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchPrice, patchName]))
      await store.loadArticles('list-1')
      expect(store.articles[0].price).to.equal(1.99)
      expect(store.articles[0].name).to.equal('Bio-Milch')
    })
  })

  it('Notiz- und Preisänderung von verschiedenen Nutzern bleiben beide erhalten', () => {
    const article = baseArticle({ note: '', price: 1.0 })
    const patchNote = makePatch({
      _id: 'patch-a1-note',
      fields: { note: 'Bio bitte' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchPrice = makePatch({
      _id: 'patch-a1-price',
      fields: { price: 2.49 },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:30:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchNote, patchPrice]))
      await store.loadArticles('list-1')
      expect(store.articles[0].note).to.equal('Bio bitte')
      expect(store.articles[0].price).to.equal(2.49)
    })
  })

  it('drei verschiedene Felder von drei Nutzern bleiben alle erhalten', () => {
    const article = baseArticle({ name: 'Milch', note: '', price: 1.0 })
    const patchName = makePatch({
      _id: 'patch-a1-name',
      fields: { name: 'Bio-Milch' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchNote = makePatch({
      _id: 'patch-a1-note',
      fields: { note: 'Nur beim Hofer' },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:10:00.000Z',
    })
    const patchPrice = makePatch({
      _id: 'patch-a1-price',
      fields: { price: 1.79 },
      editedBy: 'userC#0003',
      editedAt: '2026-01-01T11:20:00.000Z',
    })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, patchName, patchNote, patchPrice]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Bio-Milch')
      expect(store.articles[0].note).to.equal('Nur beim Hofer')
      expect(store.articles[0].price).to.equal(1.79)
    })
  })
})

describe('Sync – Menge/Einheit als atomares Paar', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('updateArticle schreibt Menge und Einheit immer gemeinsam in denselben Patch', () => {
    cy.window().then(async (win) => {
      await store.updateArticle('list-1', 'a1', { quantity: 10, unit: 'g' })
      const [doc] = win.__db.put.args[0]
      expect(doc.fields.quantity).to.equal(10)
      expect(doc.fields.unit).to.equal('g')
    })
  })

  it('späterer Menge/Einheit-Patch überschreibt früheren vollständig', () => {
    const article = baseArticle({ quantity: 1, unit: 'l' })
    const patchA = makePatch({
      _id: 'patch-a1-qty-early',
      fields: { quantity: 2, unit: 'l' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchB = makePatch({
      _id: 'patch-a1-qty-late',
      fields: { quantity: 500, unit: 'g' },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T12:00:00.000Z',
    })
    cy.window().then(async (win) => {
      win.__db.allDocs.resolves(makeAllDocsResult([article, patchA, patchB]))
      await store.loadArticles('list-1')
      expect(store.articles[0].quantity).to.equal(500)
      expect(store.articles[0].unit).to.equal('g')
    })
  })

  it('Menge/Einheit-Patch und Namens-Patch werden korrekt zusammengeführt', () => {
    const article = baseArticle({ name: 'Milch', quantity: 1, unit: 'l' })
    const patchQty = makePatch({
      _id: 'patch-a1-qty',
      fields: { quantity: 2, unit: 'Flasche' },
      editedBy: 'userB#0002',
      editedAt: '2026-01-01T11:00:00.000Z',
    })
    const patchName = makePatch({
      _id: 'patch-a1-name',
      fields: { name: 'Vollmilch' },
      editedBy: 'userA#0001',
      editedAt: '2026-01-01T12:00:00.000Z',
    })
    cy.window().then(async (win) => {
      win.__db.allDocs.resolves(makeAllDocsResult([article, patchQty, patchName]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Vollmilch')
      expect(store.articles[0].quantity).to.equal(2)
      expect(store.articles[0].unit).to.equal('Flasche')
    })
  })
})

describe('Sync – Check-Events: Chronologie und Deduplizierung', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useArticleStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
    })
  })

  it('zeigt Check-Events mehrerer Nutzer in chronologischer Reihenfolge', () => {
    const article = baseArticle()
    const eventA = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T10:00:00.000Z',
    }
    const eventB = {
      _id: 'check-200-bbbbb',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userB#0002',
      checkedAt: '2026-01-01T11:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, eventA, eventB]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(2)
      expect(events[0].checkedBy).to.equal('userA#0001')
      expect(events[1].checkedBy).to.equal('userB#0002')
    })
  })

  it('sortiert Check-Events korrekt wenn sie ungeordnet gespeichert sind', () => {
    const article = baseArticle()
    const eventLate = {
      _id: 'check-300-ccccc',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userB#0002',
      checkedAt: '2026-01-01T12:00:00.000Z',
    }
    const eventEarly = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T09:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, eventLate, eventEarly]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events[0].checkedAt < events[1].checkedAt).to.be.true
    })
  })

  it('zeigt jeden Nutzer nur einmal an wenn er mehrfach abhakt (Deduplizierung)', () => {
    const article = baseArticle()
    const checkFirst = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T10:00:00.000Z',
    }
    const checkSecond = {
      _id: 'check-200-bbbbb',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T11:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, checkFirst, checkSecond]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(1)
    })
  })

  it('zeigt letztes Check-Event wenn Nutzer mehrfach abhakt', () => {
    const article = baseArticle()
    const checkFirst = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T10:00:00.000Z',
    }
    const checkSecond = {
      _id: 'check-200-bbbbb',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T14:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, checkFirst, checkSecond]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events[0].checkedAt).to.equal('2026-01-01T14:00:00.000Z')
    })
  })

  it('Deduplizierung und Chronologie zusammen: zwei Nutzer, einer abhakt zweimal', () => {
    const article = baseArticle()
    const userAFirst = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T10:00:00.000Z',
    }
    const userBCheck = {
      _id: 'check-200-bbbbb',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userB#0002',
      checkedAt: '2026-01-01T11:00:00.000Z',
    }
    const userASecond = {
      _id: 'check-300-ccccc',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T13:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, userAFirst, userBCheck, userASecond]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(2)
      expect(events[0].checkedBy).to.equal('userB#0002')
      expect(events[0].checkedAt).to.equal('2026-01-01T11:00:00.000Z')
      expect(events[1].checkedBy).to.equal('userA#0001')
      expect(events[1].checkedAt).to.equal('2026-01-01T13:00:00.000Z')
    })
  })

  it('Check-Events einer anderen Liste werden nicht angezeigt', () => {
    const article = baseArticle()
    const eventOwnList = {
      _id: 'check-100-aaaaa',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-1',
      checkedBy: 'userA#0001',
      checkedAt: '2026-01-01T10:00:00.000Z',
    }
    const eventOtherList = {
      _id: 'check-200-bbbbb',
      type: 'check-event',
      articleId: 'a1',
      listId: 'list-99',
      checkedBy: 'userB#0002',
      checkedAt: '2026-01-01T11:00:00.000Z',
    }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article, eventOwnList, eventOtherList]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(1)
      expect(events[0].checkedBy).to.equal('userA#0001')
    })
  })
})
