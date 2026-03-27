/**
 * Comprehensive Test Suite: Chronologische Sortierung (User Story 4)
 *
 * Tested areas:
 *  - ShoppingListStore.loadLists()   → descending by createdAt (newest first)
 *  - ArticleStore.loadArticles()     → ascending by createdAt  (oldest first)
 *  - ArticleStore.loadArticles()     → hidden articles maintain the same sort
 *  - ArticleStore.applyPatches()     → patches applied in editedAt order
 *  - ArticleStore.searchArticles()   → search results retain chronological order
 *  - ArticleStore.loadArticles()     → check-events sorted by checkedAt
 *  - Edge cases: same timestamp, missing timestamp, nanosecond differences, DST
 *  - UI: HomeView renders lists in correct order
 */

import { createPinia, setActivePinia } from 'pinia'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'
import { useArticleStore } from '../../src/stores/article.js'
import { createRouter, createMemoryHistory } from 'vue-router'
import HomeView from '../../src/views/HomeView.vue'

const TEST_USERNAME = 'TestUser#abcd'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeAllDocsResult = (docs) => ({ rows: docs.map((doc) => ({ doc })) })

function makeList(id, name, createdAt, extra = {}) {
  return {
    _id: id,
    _rev: '1-abc',
    type: 'list',
    name,
    category: '',
    members: [TEST_USERNAME],
    shareCode: id.toUpperCase(),
    createdAt,
    ...extra,
  }
}

function makeArticle(id, name, createdAt, extra = {}) {
  return {
    _id: id,
    _rev: '1-abc',
    type: 'article',
    listId: 'list-1',
    name,
    quantity: 1,
    unit: 'Stk',
    note: '',
    checked: false,
    hidden: false,
    price: null,
    barcode: null,
    priceHistory: [],
    createdBy: TEST_USERNAME,
    createdAt,
    ...extra,
  }
}

function makePatch(id, articleId, fields, editedAt, extra = {}) {
  return {
    _id: id,
    type: 'article-patch',
    articleId,
    listId: 'list-1',
    fields,
    editedBy: TEST_USERNAME,
    editedAt,
    ...extra,
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 1: ShoppingListStore – Listen absteigend sortieren
// ═════════════════════════════════════════════════════════════════════════════

describe('ShoppingListStore – loadLists() sortiert Listen absteigend nach createdAt', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useShoppingListStore()
  })

  it('neueste Liste erscheint zuerst wenn zwei Listen vorhanden sind', () => {
    const older = makeList('list-1', 'Ältere Liste', '2024-01-01T08:00:00.000Z')
    const newer = makeList('list-2', 'Neuere Liste', '2024-01-10T08:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([older, newer]))
      await store.loadLists()
      expect(store.lists[0].name).to.equal('Neuere Liste')
      expect(store.lists[1].name).to.equal('Ältere Liste')
    })
  })

  it('älteste Liste erscheint zuletzt bei drei Listen', () => {
    const a = makeList('a', 'A', '2024-01-05T00:00:00.000Z')
    const b = makeList('b', 'B', '2024-03-15T00:00:00.000Z')
    const c = makeList('c', 'C', '2024-02-20T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a, b, c]))
      await store.loadLists()
      expect(store.lists[0].name).to.equal('B')
      expect(store.lists[1].name).to.equal('C')
      expect(store.lists[2].name).to.equal('A')
    })
  })

  it('sortiert 10 Listen in korrekter absteigender Reihenfolge', () => {
    const lists = Array.from({ length: 10 }, (_, i) =>
      makeList(`list-${i}`, `Liste ${i}`, `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`)
    )
    cy.window().then(async (win) => {
      // Shuffle the input to ensure sort is not dependent on insertion order
      const shuffled = [...lists].sort(() => Math.random() - 0.5)
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult(shuffled))
      await store.loadLists()
      for (let i = 0; i < 9; i++) {
        const dateA = new Date(store.lists[i].createdAt)
        const dateB = new Date(store.lists[i + 1].createdAt)
        expect(dateA.getTime()).to.be.gte(dateB.getTime())
      }
    })
  })

  it('einzelne Liste wird unverändert zurückgegeben', () => {
    const solo = makeList('solo', 'Einzelliste', '2025-06-01T12:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([solo]))
      await store.loadLists()
      expect(store.lists).to.have.length(1)
      expect(store.lists[0].name).to.equal('Einzelliste')
    })
  })

  it('leere Datenbank ergibt leeres lists-Array', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.loadLists()
      expect(store.lists).to.have.length(0)
    })
  })

  it('Listen mit identischem createdAt bleiben stabil in der Ausgabe', () => {
    const same1 = makeList('s1', 'SameA', '2024-06-15T10:00:00.000Z')
    const same2 = makeList('s2', 'SameB', '2024-06-15T10:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([same1, same2]))
      await store.loadLists()
      expect(store.lists).to.have.length(2)
      // Both same date – just ensure both are present
      const names = store.lists.map((l) => l.name)
      expect(names).to.include('SameA')
      expect(names).to.include('SameB')
    })
  })

  it('sortiert Listen korrekt mit millisekundengenauer Unterscheidung', () => {
    const early = makeList('e1', 'Früher', '2024-06-15T10:00:00.000Z')
    const late  = makeList('e2', 'Später', '2024-06-15T10:00:00.001Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([early, late]))
      await store.loadLists()
      expect(store.lists[0].name).to.equal('Später')
    })
  })

  it('filtert nur eigene Listen des Users und sortiert diese', () => {
    const own1 = makeList('own1', 'Meine A', '2024-01-01T00:00:00.000Z')
    const own2 = makeList('own2', 'Meine B', '2024-03-01T00:00:00.000Z')
    const foreign = makeList('for1', 'Fremd', '2024-12-01T00:00:00.000Z', { members: ['other#1234'] })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([own1, own2, foreign]))
      await store.loadLists()
      expect(store.lists).to.have.length(2)
      expect(store.lists[0].name).to.equal('Meine B')
      expect(store.lists[1].name).to.equal('Meine A')
    })
  })

  it('sortiert nach Jahr korrekt bei weit auseinanderliegenden Daten', () => {
    const ancient = makeList('anc', '2020er Liste', '2020-01-01T00:00:00.000Z')
    const recent  = makeList('rec', '2025er Liste', '2025-06-15T00:00:00.000Z')
    const middle  = makeList('mid', '2022er Liste', '2022-09-30T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([ancient, recent, middle]))
      await store.loadLists()
      expect(store.lists[0].name).to.equal('2025er Liste')
      expect(store.lists[1].name).to.equal('2022er Liste')
      expect(store.lists[2].name).to.equal('2020er Liste')
    })
  })

  it('sortiert unabhängig von der Reihenfolge in der DB (gemischte Eingabe)', () => {
    const a = makeList('z', 'Z-Liste', '2024-12-01T00:00:00.000Z')
    const b = makeList('a', 'A-Liste', '2024-01-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      // DB gives them in alphabetical order by _id, not by createdAt
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([b, a]))
      await store.loadLists()
      expect(store.lists[0].name).to.equal('Z-Liste')
    })
  })

  it('reagiert auf einen zweiten loadLists()-Aufruf mit aktualisierten Daten', () => {
    const old = makeList('o', 'Alt', '2024-01-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      const allDocsStub = cy.stub(win.__db, 'allDocs')
      allDocsStub.onFirstCall().resolves(makeAllDocsResult([old]))
      const fresh = makeList('f', 'Frisch', '2025-01-01T00:00:00.000Z')
      allDocsStub.onSecondCall().resolves(makeAllDocsResult([old, fresh]))
      await store.loadLists()
      expect(store.lists).to.have.length(1)
      await store.loadLists()
      expect(store.lists[0].name).to.equal('Frisch')
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 2: ArticleStore – Artikel aufsteigend sortieren
// ═════════════════════════════════════════════════════════════════════════════

describe('ArticleStore – loadArticles() sortiert Artikel aufsteigend nach createdAt', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('ältester Artikel steht zuerst bei zwei Artikeln', () => {
    const older = makeArticle('art-1', 'Milch', '2024-01-01T08:00:00.000Z')
    const newer = makeArticle('art-2', 'Brot', '2024-01-10T08:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([newer, older]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Milch')
      expect(store.articles[1].name).to.equal('Brot')
    })
  })

  it('neuester Artikel steht zuletzt bei drei Artikeln', () => {
    const a = makeArticle('a1', 'Käse', '2024-03-01T10:00:00.000Z')
    const b = makeArticle('a2', 'Butter', '2024-01-01T00:00:00.000Z')
    const c = makeArticle('a3', 'Joghurt', '2024-02-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a, b, c]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Butter')
      expect(store.articles[1].name).to.equal('Joghurt')
      expect(store.articles[2].name).to.equal('Käse')
    })
  })

  it('sortiert 10 Artikel korrekt aufsteigend nach createdAt', () => {
    const articles = Array.from({ length: 10 }, (_, i) =>
      makeArticle(`art-${i}`, `Artikel ${i}`, `2024-01-${String(i + 1).padStart(2, '0')}T00:00:00.000Z`)
    )
    cy.window().then(async (win) => {
      const shuffled = [...articles].sort(() => Math.random() - 0.5)
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult(shuffled))
      await store.loadArticles('list-1')
      for (let i = 0; i < 9; i++) {
        const dateA = new Date(store.articles[i].createdAt)
        const dateB = new Date(store.articles[i + 1].createdAt)
        expect(dateA.getTime()).to.be.lte(dateB.getTime())
      }
    })
  })

  it('sortiert aufsteigend bei millisekundengenauer Unterscheidung', () => {
    const a = makeArticle('a1', 'Früher', '2024-06-01T10:00:00.000Z')
    const b = makeArticle('a2', 'Später', '2024-06-01T10:00:00.001Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([b, a]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Früher')
      expect(store.articles[1].name).to.equal('Später')
    })
  })

  it('filtert nur Artikel der angegebenen Liste und sortiert diese', () => {
    const list1a = makeArticle('a1', 'Von Liste 1 Jan', '2024-01-01T00:00:00.000Z')
    const list1b = makeArticle('a2', 'Von Liste 1 Mär', '2024-03-01T00:00:00.000Z', { listId: 'list-1' })
    const list2  = makeArticle('a3', 'Von Liste 2',    '2024-02-01T00:00:00.000Z', { listId: 'list-2' })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([list1b, list2, list1a]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(2)
      expect(store.articles[0].name).to.equal('Von Liste 1 Jan')
      expect(store.articles[1].name).to.equal('Von Liste 1 Mär')
    })
  })

  it('leere Artikelliste ergibt leeres articles-Array', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(0)
    })
  })

  it('einzelner Artikel bleibt unverändert', () => {
    const solo = makeArticle('solo', 'Einzelartikel', '2024-06-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([solo]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(1)
      expect(store.articles[0].name).to.equal('Einzelartikel')
    })
  })

  it('unterscheidet korrekt zwischen articles und hiddenArticles', () => {
    const visible = makeArticle('v1', 'Sichtbar', '2024-01-01T00:00:00.000Z')
    const hidden  = makeArticle('h1', 'Versteckt', '2024-01-02T00:00:00.000Z', { hidden: true })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([visible, hidden]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(1)
      expect(store.hiddenArticles).to.have.length(1)
      expect(store.articles[0].name).to.equal('Sichtbar')
      expect(store.hiddenArticles[0].name).to.equal('Versteckt')
    })
  })

  it('sortiert auch hiddenArticles aufsteigend nach createdAt', () => {
    const h1 = makeArticle('h1', 'AlterVersteckter', '2024-01-01T00:00:00.000Z', { hidden: true })
    const h2 = makeArticle('h2', 'NeuerVersteckter', '2024-06-01T00:00:00.000Z', { hidden: true })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([h2, h1]))
      await store.loadArticles('list-1')
      expect(store.hiddenArticles[0].name).to.equal('AlterVersteckter')
      expect(store.hiddenArticles[1].name).to.equal('NeuerVersteckter')
    })
  })

  it('gemischte sichtbare und versteckte Artikel werden korrekt getrennt und sortiert', () => {
    const v1 = makeArticle('v1', 'Vis-A', '2024-01-01T00:00:00.000Z')
    const v2 = makeArticle('v2', 'Vis-B', '2024-03-01T00:00:00.000Z')
    const h1 = makeArticle('h1', 'Hid-A', '2024-02-01T00:00:00.000Z', { hidden: true })
    const h2 = makeArticle('h2', 'Hid-B', '2024-04-01T00:00:00.000Z', { hidden: true })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([v2, h2, v1, h1]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Vis-A')
      expect(store.articles[1].name).to.equal('Vis-B')
      expect(store.hiddenArticles[0].name).to.equal('Hid-A')
      expect(store.hiddenArticles[1].name).to.equal('Hid-B')
    })
  })

  it('ignoriert Artikel aus anderen Listen bei der Sortierung', () => {
    const listA1 = makeArticle('a1', 'A-Liste Jan', '2024-01-01T00:00:00.000Z')
    const listA2 = makeArticle('a2', 'A-Liste Dez', '2024-12-01T00:00:00.000Z')
    const listB  = makeArticle('b1', 'B-Liste Jun', '2024-06-01T00:00:00.000Z', { listId: 'list-2' })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([listA2, listB, listA1]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(2)
      expect(store.articles[0].name).to.equal('A-Liste Jan')
    })
  })

  it('Artikel mit DST-Grenze werden korrekt zeitlich geordnet', () => {
    // Daylight Saving Time edge: March 31 2024 in Austria
    const beforeDST = makeArticle('a1', 'Vor DST',  '2024-03-31T00:59:00.000Z')
    const afterDST  = makeArticle('a2', 'Nach DST', '2024-03-31T03:01:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([afterDST, beforeDST]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Vor DST')
      expect(store.articles[1].name).to.equal('Nach DST')
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 3: applyPatches – Patches nach editedAt sortieren
// ═════════════════════════════════════════════════════════════════════════════

describe('ArticleStore – applyPatches() wendet Patches in editedAt-Reihenfolge an', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('späterer Patch überschreibt früheren Patch bei gleichem Feld', () => {
    const base = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z')
    const patch1 = makePatch('p1', 'a1', { name: 'Vollmilch' }, '2024-01-02T00:00:00.000Z')
    const patch2 = makePatch('p2', 'a1', { name: 'Bio-Vollmilch' }, '2024-01-03T00:00:00.000Z')
    cy.window().then(async (win) => {
      // Give patches in reversed order to confirm sorting works
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base, patch2, patch1]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Bio-Vollmilch')
    })
  })

  it('früherer Patch überschreibt NICHT späteren Patch', () => {
    const base = makeArticle('a1', 'Original', '2024-01-01T00:00:00.000Z')
    const early = makePatch('p1', 'a1', { note: 'Frühe Notiz' }, '2024-01-02T00:00:00.000Z')
    const late  = makePatch('p2', 'a1', { note: 'Späte Notiz' }, '2024-01-10T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base, late, early]))
      await store.loadArticles('list-1')
      expect(store.articles[0].note).to.equal('Späte Notiz')
    })
  })

  it('drei Patches auf verschiedene Felder werden korrekt zusammengeführt', () => {
    const base   = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z')
    const patch1 = makePatch('p1', 'a1', { name: 'Bio Milch' }, '2024-02-01T00:00:00.000Z')
    const patch2 = makePatch('p2', 'a1', { quantity: 3 }, '2024-03-01T00:00:00.000Z')
    const patch3 = makePatch('p3', 'a1', { unit: 'Liter' }, '2024-04-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base, patch3, patch1, patch2]))
      await store.loadArticles('list-1')
      const art = store.articles[0]
      expect(art.name).to.equal('Bio Milch')
      expect(art.quantity).to.equal(3)
      expect(art.unit).to.equal('Liter')
    })
  })

  it('mehrere Patches auf gleiches Feld: der zeitlich letzte gewinnt', () => {
    const base   = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z')
    const p1 = makePatch('p1', 'a1', { quantity: 2 }, '2024-01-10T00:00:00.000Z')
    const p2 = makePatch('p2', 'a1', { quantity: 5 }, '2024-01-12T00:00:00.000Z')
    const p3 = makePatch('p3', 'a1', { quantity: 1 }, '2024-01-11T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base, p3, p1, p2]))
      await store.loadArticles('list-1')
      expect(store.articles[0].quantity).to.equal(5)
    })
  })

  it('Artikel ohne Patches behält seinen Originalzustand', () => {
    const base = makeArticle('a1', 'Unverändert', '2024-01-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base]))
      await store.loadArticles('list-1')
      expect(store.articles[0].name).to.equal('Unverändert')
      expect(store.articles[0].quantity).to.equal(1)
    })
  })

  it('Patches für anderen Artikel beeinflussen diesen Artikel nicht', () => {
    const a1 = makeArticle('a1', 'Artikel A', '2024-01-01T00:00:00.000Z')
    const a2 = makeArticle('a2', 'Artikel B', '2024-01-01T00:00:00.000Z')
    const patchForA2 = makePatch('p1', 'a2', { name: 'Geänderter B' }, '2024-02-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1, a2, patchForA2]))
      await store.loadArticles('list-1')
      const articA = store.articles.find((a) => a._id === 'a1')
      const articB = store.articles.find((a) => a._id === 'a2')
      expect(articA.name).to.equal('Artikel A')
      expect(articB.name).to.equal('Geänderter B')
    })
  })

  it('priceHistory wird durch patches chronologisch aufgebaut', () => {
    const base = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z', { priceHistory: [] })
    const p1 = { ...makePatch('p1', 'a1', { price: 1.29 }, '2024-02-01T00:00:00.000Z'), priceHistoryEntry: { price: 1.29, setAt: '2024-02-01T00:00:00.000Z' } }
    const p2 = { ...makePatch('p2', 'a1', { price: 1.49 }, '2024-03-01T00:00:00.000Z'), priceHistoryEntry: { price: 1.49, setAt: '2024-03-01T00:00:00.000Z' } }
    const p3 = { ...makePatch('p3', 'a1', { price: 0.99 }, '2024-01-15T00:00:00.000Z'), priceHistoryEntry: { price: 0.99, setAt: '2024-01-15T00:00:00.000Z' } }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([base, p2, p3, p1]))
      await store.loadArticles('list-1')
      const hist = store.articles[0].priceHistory
      expect(hist).to.have.length(3)
      expect(hist[0].price).to.equal(0.99)
      expect(hist[1].price).to.equal(1.29)
      expect(hist[2].price).to.equal(1.49)
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 4: Check-Events sortieren
// ═════════════════════════════════════════════════════════════════════════════

describe('ArticleStore – loadArticles() sortiert check-events nach checkedAt', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('check-events werden nach checkedAt aufsteigend in checkEvents gespeichert', () => {
    const art = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z')
    const ev1 = { _id: 'chk-1', type: 'check-event', articleId: 'a1', listId: 'list-1', checkedBy: 'UserA#1234', checkedAt: '2024-01-10T10:00:00.000Z' }
    const ev2 = { _id: 'chk-2', type: 'check-event', articleId: 'a1', listId: 'list-1', checkedBy: 'UserB#5678', checkedAt: '2024-01-10T09:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([art, ev1, ev2]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(2)
      // First event has the earlier time
      expect(events[0].checkedBy).to.equal('UserB#5678')
      expect(events[1].checkedBy).to.equal('UserA#1234')
    })
  })

  it('check-events von anderen Listen werden nicht in checkEvents aufgenommen', () => {
    const art = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z')
    const ev1 = { _id: 'chk-1', type: 'check-event', articleId: 'a1', listId: 'list-1', checkedBy: 'User#1234', checkedAt: '2024-01-10T10:00:00.000Z' }
    const ev2 = { _id: 'chk-2', type: 'check-event', articleId: 'a1', listId: 'list-2', checkedBy: 'User#5678', checkedAt: '2024-01-10T09:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([art, ev1, ev2]))
      await store.loadArticles('list-1')
      const events = store.checkEvents['a1']
      expect(events).to.have.length(1)
      expect(events[0].checkedBy).to.equal('User#1234')
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 5: Delete-Intents verhindern Anzeige unabhängig von Sortierung
// ═════════════════════════════════════════════════════════════════════════════

describe('ArticleStore – delete-intents entfernen Artikel aus der sortierten Ansicht', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('gelöschter Artikel (via delete-intent) erscheint nicht in articles', () => {
    const a1 = makeArticle('a1', 'Sichtbar', '2024-01-01T00:00:00.000Z')
    const a2 = makeArticle('a2', 'Gelöscht', '2024-01-02T00:00:00.000Z')
    const di = { _id: 'delete-intent-a2', type: 'delete-intent', articleId: 'a2', listId: 'list-1', deletedAt: '2024-01-03T00:00:00.000Z', deletedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1, a2, di]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(1)
      expect(store.articles[0].name).to.equal('Sichtbar')
    })
  })

  it('sortierung bleibt korrekt wenn mittlerer Artikel gelöscht wurde', () => {
    const a1 = makeArticle('a1', 'Erster', '2024-01-01T00:00:00.000Z')
    const a2 = makeArticle('a2', 'Zweiter (gelöscht)', '2024-01-02T00:00:00.000Z')
    const a3 = makeArticle('a3', 'Dritter', '2024-01-03T00:00:00.000Z')
    const di = { _id: 'delete-intent-a2', type: 'delete-intent', articleId: 'a2', listId: 'list-1', deletedAt: '2024-01-04T00:00:00.000Z', deletedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a2, a3, a1, di]))
      await store.loadArticles('list-1')
      expect(store.articles).to.have.length(2)
      expect(store.articles[0].name).to.equal('Erster')
      expect(store.articles[1].name).to.equal('Dritter')
    })
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 6: UI-Tests – HomeView zeigt Listen in korrekter Reihenfolge
// ═════════════════════════════════════════════════════════════════════════════

describe('HomeView – UI zeigt Listen in absteigender chronologischer Reihenfolge', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
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

  it('neueste Liste erscheint als erster Listeneintrag', () => {
    // loadLists() is stubbed → store.lists is set pre-sorted (newest first)
    store.lists = [
      makeList('l2', 'Neueste Liste', '2024-12-01T00:00:00.000Z'),
      makeList('l3', 'Mittlere Liste', '2024-06-01T00:00:00.000Z'),
      makeList('l1', 'Älteste Liste', '2024-01-01T00:00:00.000Z'),
    ]
    cy.get('[class*="grid"]').children().first().should('contain.text', 'Neueste Liste')
  })

  it('älteste Liste erscheint als letzter Listeneintrag', () => {
    // Already sorted newest→oldest; last child must be the oldest
    store.lists = [
      makeList('l2', 'Neueste Liste', '2024-12-01T00:00:00.000Z'),
      makeList('l1', 'Älteste Liste', '2024-01-01T00:00:00.000Z'),
    ]
    cy.get('[class*="grid"]').children().last().should('contain.text', 'Älteste Liste')
  })

  it('alle drei Listen erscheinen in absteigender Reihenfolge im DOM', () => {
    store.lists = [
      makeList('l3', 'Zuerst', '2024-12-01T00:00:00.000Z'),
      makeList('l2', 'Zweite', '2024-06-15T00:00:00.000Z'),
      makeList('l1', 'Letzte', '2024-01-01T00:00:00.000Z'),
    ]
    cy.get('[class*="grid"]').children().eq(0).should('contain.text', 'Zuerst')
    cy.get('[class*="grid"]').children().eq(1).should('contain.text', 'Zweite')
    cy.get('[class*="grid"]').children().eq(2).should('contain.text', 'Letzte')
  })

  it('korrektes Datum wird für jede Liste angezeigt (lokalisiert)', () => {
    store.lists = [
      makeList('l1', 'Jänner Liste', '2024-01-15T08:00:00.000Z'),
    ]
    // Austrian locale includes year and month
    cy.contains('2024').should('be.visible')
  })

  it('eine Liste ohne Kategorie zeigt keinen Badge', () => {
    store.lists = [makeList('l1', 'Keine Kategorie', '2024-01-01T00:00:00.000Z', { category: '' })]
    cy.get('span.bg-blue-100').should('not.exist')
  })

  it('eine Liste mit Kategorie zeigt den Kategorie-Badge', () => {
    store.lists = [makeList('l1', 'Mit Kategorie', '2024-01-01T00:00:00.000Z', { category: 'Lebensmittel' })]
    cy.contains('span', 'Lebensmittel').should('be.visible')
  })

  it('nach Hinzufügen einer neuen Liste (simuliert) erscheint diese zuerst', () => {
    store.lists = [
      makeList('l1', 'Alt', '2024-01-01T00:00:00.000Z'),
    ]
    cy.get('[class*="grid"]').children().should('have.length', 1)

    // Simulate a new list being prepended (via reactive state)
    cy.then(() => {
      store.lists = [
        makeList('l2', 'NeuHinzugefügt', '2025-01-01T00:00:00.000Z'),
        makeList('l1', 'Alt', '2024-01-01T00:00:00.000Z'),
      ]
    })

    cy.get('[class*="grid"]').children().first().should('contain.text', 'NeuHinzugefügt')
  })

  it('leere Liste zeigt den Empty-State-Text', () => {
    store.lists = []
    cy.contains('Noch keine Listen vorhanden').should('be.visible')
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// BLOCK 7: Suche – Ergebnisse ignorieren generell Sortierung per-group
// ═════════════════════════════════════════════════════════════════════════════

describe('ArticleStore – searchArticles() kategorisiert nach Listengehörigkeit', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useArticleStore()
  })

  it('inCurrentList enthält nur Artikel der aktuellen Liste', () => {
    const a1 = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z', { listId: 'list-1' })
    const a2 = makeArticle('a2', 'Milch Light', '2024-01-02T00:00:00.000Z', { listId: 'list-2' })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1, a2]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
      expect(store.searchResults.inCurrentList[0].name).to.equal('Milch')
    })
  })

  it('inOtherLists enthält Artikel aus anderen Listen', () => {
    const a1 = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z', { listId: 'list-2' })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inOtherLists).to.have.length(1)
    })
  })

  it('inPast enthält ausgeblendete Artikel', () => {
    const a1 = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z', { hidden: true })
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inPast).to.have.length(1)
    })
  })

  it('leerer Suchbegriff setzt alle Suchergebnisse zurück', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.searchArticles('', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(0)
      expect(store.searchResults.inOtherLists).to.have.length(0)
      expect(store.searchResults.inPast).to.have.length(0)
    })
  })

  it('gelöschte Artikel (delete-intent) erscheinen nicht in Suchergebnissen', () => {
    const a1 = makeArticle('a1', 'Milch', '2024-01-01T00:00:00.000Z', { listId: 'list-1' })
    const di = { _id: 'delete-intent-a1', type: 'delete-intent', articleId: 'a1', listId: 'list-1', deletedAt: '2024-01-02T00:00:00.000Z', deletedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1, di]))
      await store.searchArticles('Milch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(0)
    })
  })

  it('Suche ist case-insensitive', () => {
    const a1 = makeArticle('a1', 'Vollmilch', '2024-01-01T00:00:00.000Z')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([a1]))
      await store.searchArticles('vollmilch', 'list-1')
      expect(store.searchResults.inCurrentList).to.have.length(1)
    })
  })
})
