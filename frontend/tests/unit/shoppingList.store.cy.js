import { createPinia, setActivePinia } from 'pinia'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'
import { getUsername } from '../../src/db/index.js'

const TEST_USERNAME = 'TestUser#abcd'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

describe('ShoppingListStore – createList mit members und shareCode', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useShoppingListStore()

    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: '1', rev: '1-a' })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('createList setzt members mit eigenem Username', () => {
    cy.window().then(async (win) => {
      const username = getUsername()
      await store.createList('Test', 'Kategorie')
      const [doc] = win.__db.put.args[0]
      expect(doc.members).to.deep.equal([username])
    })
  })

  it('createList generiert einen 6-stelligen shareCode', () => {
    cy.window().then(async (win) => {
      await store.createList('Test', '')
      const [doc] = win.__db.put.args[0]
      expect(doc.shareCode).to.be.a('string')
      expect(doc.shareCode).to.have.length(6)
    })
  })
})

describe('ShoppingListStore – loadLists filtert nach Mitgliedschaft', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useShoppingListStore()
  })

  it('zeigt nur Listen an, in denen der eigene Username enthalten ist', () => {
    const username = getUsername()
    const ownList = { _id: 'list-1', type: 'list', name: 'Meine Liste', members: [username], createdAt: '2024-01-10T08:00:00.000Z' }
    const otherList = { _id: 'list-2', type: 'list', name: 'Fremde Liste', members: ['other-user#1234'], createdAt: '2024-01-11T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([ownList, otherList]))
      await store.loadLists()
      expect(store.lists).to.have.length(1)
      expect(store.lists[0].name).to.equal('Meine Liste')
    })
  })

  it('zeigt Listen ohne members-Array an (Rückwärtskompatibilität)', () => {
    const legacyList = { _id: 'list-3', type: 'list', name: 'Alte Liste', createdAt: '2024-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([legacyList]))
      await store.loadLists()
      expect(store.lists).to.have.length(1)
      expect(store.lists[0].name).to.equal('Alte Liste')
    })
  })
})

describe('ShoppingListStore – joinList', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useShoppingListStore()

    cy.window().then((win) => {
      cy.stub(win.__db.replicate, 'from').resolves()
    })
  })

  it('gibt null zurück wenn kein passender Code gefunden wird', () => {
    const mockList = { _id: 'list-1', type: 'list', name: 'Test', shareCode: 'ABC123', members: ['x'], createdAt: '2024-01-10T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([mockList]))
      cy.stub(win.__db, 'put').resolves({ ok: true })
      const result = await store.joinList('WRONG1')
      expect(result).to.be.null
    })
  })

  it('fügt Username zu members hinzu bei gültigem Code', () => {
    const username = getUsername()
    const listToJoin = { _id: 'list-2', type: 'list', name: 'Fremde', shareCode: 'XYZ789', members: ['other-user#1234'], createdAt: '2024-01-10T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([listToJoin]))
      cy.stub(win.__db, 'put').resolves({ ok: true })
      const result = await store.joinList('XYZ789')
      expect(result).to.not.be.null
      expect(result.members).to.include(username)
    })
  })

  it('akzeptiert Code case-insensitive', () => {
    const listToJoin = { _id: 'list-2', type: 'list', name: 'Fremde', shareCode: 'XYZ789', members: ['other-user#1234'], createdAt: '2024-01-10T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([listToJoin]))
      cy.stub(win.__db, 'put').resolves({ ok: true })
      const result = await store.joinList('xyz789')
      expect(result).to.not.be.null
    })
  })

  it('fügt Username nicht doppelt hinzu wenn bereits Mitglied', () => {
    const username = getUsername()
    const ownList = { _id: 'list-1', type: 'list', name: 'Meine', shareCode: 'ABC123', members: [username], createdAt: '2024-01-10T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([ownList]))
      cy.stub(win.__db, 'put').resolves({ ok: true })
      const result = await store.joinList('ABC123')
      expect(result.members.filter((m) => m === username)).to.have.length(1)
      expect(win.__db.put).to.not.have.been.called
    })
  })
})

describe('ShoppingListStore – leaveList', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useShoppingListStore()
  })

  it('entfernt Username aus members wenn andere Mitglieder vorhanden', () => {
    const username = getUsername()
    const listWithTwo = { _id: 'list-1', _rev: '1-abc', type: 'list', name: 'Test', members: [username, 'other-user#1234'], createdAt: '2024-01-10T08:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves(listWithTwo)
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.leaveList('list-1')
      const [doc] = win.__db.put.args[0]
      expect(doc.members).to.deep.equal(['other-user#1234'])
    })
  })

  it('löscht Liste und Artikel wenn letztes Mitglied verlässt', () => {
    const username = getUsername()
    const lastMemberList = { _id: 'list-1', _rev: '1-abc', type: 'list', name: 'Test', members: [username], createdAt: '2024-01-10T08:00:00.000Z' }
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', listId: 'list-1', name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves(lastMemberList)
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([lastMemberList, article]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.leaveList('list-1')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs).to.have.length(2)
      expect(docs[0]._deleted).to.be.true
      expect(docs[1]._deleted).to.be.true
    })
  })

  it('löscht keine Artikel aus anderen Listen', () => {
    const username = getUsername()
    const lastMemberList = { _id: 'list-1', _rev: '1-abc', type: 'list', name: 'Test', members: [username], createdAt: '2024-01-10T08:00:00.000Z' }
    const ownArticle = { _id: 'art-1', _rev: '1-a', type: 'article', listId: 'list-1', name: 'Milch' }
    const otherArticle = { _id: 'art-2', _rev: '1-b', type: 'article', listId: 'list-99', name: 'Brot' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'get').resolves(lastMemberList)
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([lastMemberList, ownArticle, otherArticle]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.leaveList('list-1')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs).to.have.length(2)
      expect(docs.find((d) => d._id === 'art-2')).to.be.undefined
    })
  })
})
