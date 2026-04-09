import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { useArticleStore } from '../../src/stores/article.js'
import { useShoppingListStore } from '../../src/stores/shoppingList.js'
import ArticleListView from '../../src/views/ArticleListView.vue'

const TEST_USERNAME = 'TestUser#abcd'

const mockList = {
  _id: 'seed-list-1',
  type: 'list',
  name: 'Wocheneinkauf',
  category: 'Lebensmittel',
  members: [TEST_USERNAME],
  shareCode: 'WCH3NK',
  createdAt: '2024-01-10T08:00:00.000Z',
  _rev: '1-abc',
}

// Article eligible for discount with a price
const mockRabattArtikel = {
  _id: 'rabatt-1',
  type: 'article',
  listId: 'seed-list-1',
  name: 'Milch',
  quantity: 2,
  unit: 'l',
  note: '',
  price: 1.50,
  barcode: null,
  priceHistory: [],
  checked: false,
  hidden: false,
  rabattfähig: true,
  rabattAngewendet: null,
  createdAt: '2024-01-10T08:01:00.000Z',
  _rev: '1-r1',
}

// Article NOT eligible for discount
const mockNormalArtikel = {
  _id: 'normal-1',
  type: 'article',
  listId: 'seed-list-1',
  name: 'Brot',
  quantity: 1,
  unit: '',
  note: '',
  price: 3.00,
  barcode: null,
  priceHistory: [],
  checked: false,
  hidden: false,
  rabattfähig: false,
  rabattAngewendet: null,
  createdAt: '2024-01-10T08:02:00.000Z',
  _rev: '1-r2',
}

// rabattfähig article that is already checked (bought)
const mockCheckedRabattArtikel = {
  ...mockRabattArtikel,
  _id: 'rabatt-checked-1',
  name: 'Eier',
  checked: true,
  _rev: '1-r3',
}

// rabattfähig article without a price
const mockRabattOhnePreis = {
  ...mockRabattArtikel,
  _id: 'rabatt-noPrice-1',
  name: 'Käse',
  price: null,
  _rev: '1-r4',
}

// Article with an already applied discount
const mockDiscountedArtikel = {
  ...mockRabattArtikel,
  _id: 'rabatt-applied-1',
  name: 'Butter',
  price: 1.60,
  rabattAngewendet: { prozent: 20, originalPreis: 2.00 },
  _rev: '1-r5',
}

function mountComponent() {
  const pinia = createPinia()
  setActivePinia(pinia)

  const articleStore = useArticleStore()
  const listStore = useShoppingListStore()

  cy.stub(articleStore, 'loadArticles').resolves()
  cy.stub(articleStore, 'createArticle').resolves()
  cy.stub(articleStore, 'updateArticle').resolves()
  cy.stub(articleStore, 'toggleChecked').resolves()
  cy.stub(articleStore, 'hideArticle').resolves()
  cy.stub(articleStore, 'restoreArticle').resolves()
  cy.stub(articleStore, 'deleteArticle').resolves()
  cy.stub(articleStore, 'updatePrice').resolves()
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

  return { articleStore, listStore }
}

// ── Pickerl button ────────────────────────────────────────────────────────────

describe('ArticleListView – Pickerl button', () => {
  let articleStore

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    ;({ articleStore } = mountComponent())
  })

  it('shows the Pickerl button', () => {
    cy.contains('button', '🏷 Pickerl').should('be.visible')
  })

  it('opens the Pickerl modal when the button is clicked', () => {
    cy.contains('button', '🏷 Pickerl').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('be.visible')
  })

  it('closes the Pickerl modal when Schliessen is clicked', () => {
    cy.contains('button', '🏷 Pickerl').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('be.visible')
    cy.contains('button', 'Schliessen').click()
    cy.contains('h2', '🏷 Rabatt Pickerl').should('not.exist')
  })
})

// ── rabattfähig badge on article cards ────────────────────────────────────────

describe('ArticleListView – rabattfähig Artikel-Badge', () => {
  let articleStore

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    ;({ articleStore } = mountComponent())
  })

  it('shows "Rabatt Pickerl kann verwendet werden" badge on eligible articles', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('Rabatt Pickerl kann verwendet werden').should('be.visible')
  })

  it('does not show the rabatt badge on non-eligible articles', () => {
    articleStore.articles = [mockNormalArtikel]
    cy.contains('Rabatt Pickerl kann verwendet werden').should('not.exist')
  })

  it('shows applied discount info on article with rabattAngewendet', () => {
    articleStore.articles = [mockDiscountedArtikel]
    cy.contains('−20% Rabatt').should('be.visible')
    cy.contains('war € 2,00').should('be.visible')
  })

  it('does not show discount info on article without rabattAngewendet', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('% Rabatt').should('not.exist')
  })
})

// ── Pickerl modal – article eligibility ──────────────────────────────────────

describe('ArticleListView – Pickerl Modal Artikel-Sichtbarkeit', () => {
  let articleStore

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    ;({ articleStore } = mountComponent())
  })

  it('shows no articles and no "Keine" message when no percentage is entered', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()

    cy.contains('Anwenden').should('not.exist')
    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('not.exist')
  })

  it('shows "Keine rabattfähigen Artikel mit Preis vorhanden" when only non-eligible articles exist', () => {
    articleStore.articles = [mockNormalArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
  })

  it('shows rabattfähig articles in the Pickerl list when a percentage is entered', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Milch').should('be.visible')
    cy.contains('button', 'Anwenden').should('be.visible')
  })

  it('does not show non-rabattfähig articles in the Pickerl list', () => {
    articleStore.articles = [mockNormalArtikel, mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Milch').should('be.visible')
    // Brot is not rabattfähig and must not appear in the modal article list
    cy.get('.bg-yellow-50.border-yellow-200').should('not.contain', 'Brot')
  })

  it('does not show checked articles in the Pickerl list', () => {
    articleStore.articles = [mockCheckedRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    // "Keine" message proves the Pickerl list is empty
    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
    // No Anwenden button confirms no article appeared in the Pickerl list
    // (Eier is visible in the article card below, but not as a Pickerl candidate)
    cy.contains('button', 'Anwenden').should('not.exist')
  })

  it('does not show rabattfähig articles without a price in the Pickerl list', () => {
    articleStore.articles = [mockRabattOhnePreis]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('Keine rabattfähigen Artikel mit Preis vorhanden').should('be.visible')
  })
})

// ── Pickerl modal – price calculation ────────────────────────────────────────

describe('ArticleListView – Pickerl Preisberechnung', () => {
  let articleStore

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    ;({ articleStore } = mountComponent())
  })

  it('shows correct discounted total for a 20% discount', () => {
    // Milch: price 1.50, quantity 2 → originalTotal = 3.00, discountedTotal = 2.40
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    cy.contains('€ 2,40').should('be.visible') // discounted total
    cy.contains('€ 3,00').should('be.visible') // original total (struck through)
  })

  it('shows correct discounted total for a 50% discount', () => {
    // Milch: price 1.50, quantity 2 → originalTotal = 3.00, discountedTotal = 1.50
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('50')

    cy.contains('€ 1,50').should('be.visible') // discounted total
  })

  it('shows the original price as struck-through alongside the discounted price', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    // The struck-through price uses the line-through class
    cy.get('.line-through').should('contain', '€ 3,00')
  })
})

// ── Pickerl modal – applying discounts ───────────────────────────────────────

describe('ArticleListView – Pickerl Anwenden', () => {
  let articleStore

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    ;({ articleStore } = mountComponent())
  })

  it('calls updatePrice with the discounted unit price when Anwenden is clicked', () => {
    // Milch: price 1.50, 20% off → discounted unit price = 1.20
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    cy.wrap(articleStore.updatePrice).should(
      'have.been.calledWith',
      mockList._id,
      mockRabattArtikel._id,
      mockRabattArtikel.price,
      1.2, // 1.50 * 0.80 = 1.20
    )
  })

  it('calls updateArticle with rabattAngewendet metadata when Anwenden is clicked', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    cy.wrap(articleStore.updateArticle).should(
      'have.been.calledWith',
      mockList._id,
      mockRabattArtikel._id,
      { rabattAngewendet: { prozent: 20, originalPreis: mockRabattArtikel.price } },
    )
  })

  it('moves the applied article to the green snapshot section', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    // Applied snapshot section has green background
    cy.get('.bg-green-50').should('contain', 'Milch')
    // "Anwenden" button is gone
    cy.contains('button', 'Anwenden').should('not.exist')
  })

  it('shows a ✓ checkmark on the applied article snapshot', () => {
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    cy.contains('✓').should('be.visible')
  })

  it('shows the discounted total in the applied snapshot', () => {
    // Milch: price 1.50, qty 2 → discountedTotal = 2.40
    articleStore.articles = [mockRabattArtikel]
    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')
    cy.contains('button', 'Anwenden').click()

    cy.get('.bg-green-50').within(() => {
      cy.contains('€ 2,40').should('be.visible')
    })
  })

  it('can apply discounts to multiple articles in sequence', () => {
    const secondArtikel = {
      ...mockRabattArtikel,
      _id: 'rabatt-2',
      name: 'Butter',
      price: 2.00,
      quantity: 1,
      _rev: '1-r2',
    }
    articleStore.articles = [mockRabattArtikel, secondArtikel]

    cy.contains('button', '🏷 Pickerl').click()
    cy.get('input[type="number"][min="1"][max="100"]').type('20')

    // Pickerl modal items use border-yellow-200; article cards use border-yellow-300
    // so this selector uniquely targets the Pickerl list rows
    cy.contains('.border-yellow-200', 'Milch').contains('button', 'Anwenden').click()
    cy.contains('.border-yellow-200', 'Butter').contains('button', 'Anwenden').click()

    // Both are now in applied snapshots
    cy.get('.bg-green-50').should('have.length', 2)
    cy.wrap(articleStore.updatePrice).should('have.been.calledTwice')
  })
})
