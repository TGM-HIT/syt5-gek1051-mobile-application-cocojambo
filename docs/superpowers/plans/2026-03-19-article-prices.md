# Article Prices & Price Tag Scanning — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add price tracking to shopping list articles with manual entry, barcode scanner integration, and OCR price tag scanning via Google Cloud Vision.

**Architecture:** Extend the existing PouchDB article documents with `price`, `barcode`, and `priceHistory` fields. Refactor `createArticle` to an options object API. Add a new `PriceTagScanner.vue` component for OCR and a `ocrPrice.js` utility for Google Vision API + regex extraction. Modify `BarcodeScanner.vue` to emit barcode and optional price. Add price display, totals, and history to `ArticleListView.vue`.

**Tech Stack:** Vue 3, Pinia, PouchDB, Google Cloud Vision REST API, Tailwind CSS, Cypress component tests

**Spec:** `docs/superpowers/specs/2026-03-19-article-prices-design.md`

---

### Task 1: Refactor `createArticle` to options object and add price fields

**Files:**
- Modify: `frontend/src/stores/article.js`
- Modify: `frontend/tests/unit/article.store.cy.js`

- [ ] **Step 1: Update existing tests to use options object API**

In `frontend/tests/unit/article.store.cy.js`, update all `store.createArticle` calls from positional params to options object. Replace the describe block name and all test calls:

```js
// Before (every test):
await store.createArticle('list-1', 'Milch', 2, 'l', 'Bio bitte')
// After:
await store.createArticle('list-1', { name: 'Milch', quantity: 2, unit: 'l', note: 'Bio bitte' })
```

Apply this pattern to ALL existing tests in the file. Do not change assertions.

- [ ] **Step 2: Add new tests for price fields and updatePrice**

Append a new describe block to `frontend/tests/unit/article.store.cy.js`:

```js
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd frontend && npx cypress run --component --spec tests/unit/article.store.cy.js`
Expected: New tests FAIL (createArticle doesn't accept options, updatePrice doesn't exist). Existing tests FAIL (positional args changed to options object).

- [ ] **Step 4: Implement the store changes**

Replace `frontend/src/stores/article.js` `createArticle` and add `updatePrice`:

```js
async createArticle(listId, { name, quantity, unit, note, price, barcode } = {}) {
  await db.put({
    _id: Date.now().toString(),
    type: 'article',
    listId,
    name,
    quantity: quantity || 1,
    unit: unit || '',
    note: note || '',
    price: price ?? null,
    barcode: barcode ?? null,
    priceHistory: [],
    checked: false,
    hidden: false,
    createdAt: new Date().toISOString(),
  })
  await this.loadArticles(listId)
},
```

Add new action after `deleteArticle`:

```js
async updatePrice(listId, article, newPrice) {
  if (article.price === newPrice) return
  const history = [...(article.priceHistory || [])]
  history.push({ price: newPrice, setAt: new Date().toISOString() })
  if (history.length > 20) history.splice(0, history.length - 20)
  await db.put({ ...article, price: newPrice, priceHistory: history })
  await this.loadArticles(listId)
},
```

Update `addFromSearch` to use options object:

```js
async addFromSearch(currentListId, article) {
  await this.createArticle(currentListId, {
    name: article.name,
    quantity: article.quantity,
    unit: article.unit,
    note: article.note,
    barcode: article.barcode || null,
  })
  this.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [] }
},
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd frontend && npx cypress run --component --spec tests/unit/article.store.cy.js`
Expected: ALL tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/stores/article.js frontend/tests/unit/article.store.cy.js
git commit -m "feat: refactor createArticle to options object, add price fields and updatePrice action"
```

---

### Task 2: Update seed data with price fields

**Files:**
- Modify: `frontend/src/db/seedData.js`

- [ ] **Step 1: Add price, barcode, priceHistory, and note fields to all seed articles**

Update `frontend/src/db/seedData.js`. Add the new fields to each seed article. Example for first few articles (apply pattern to all 15):

```js
{ _id: 'seed-article-1',  type: 'article', listId: 'seed-list-1', name: 'Milch',        quantity: 2,   unit: 'l',   note: '', price: 1.49,  barcode: '9001234567890', priceHistory: [{ price: 1.29, setAt: '2024-01-05T10:00:00.000Z' }, { price: 1.49, setAt: '2024-01-10T08:01:00.000Z' }], checked: false, hidden: false, createdAt: '2024-01-10T08:01:00.000Z' },
{ _id: 'seed-article-2',  type: 'article', listId: 'seed-list-1', name: 'Brot',         quantity: 1,   unit: '',    note: '', price: 3.29,  barcode: null, priceHistory: [], checked: true,  hidden: false, createdAt: '2024-01-10T08:02:00.000Z' },
{ _id: 'seed-article-3',  type: 'article', listId: 'seed-list-1', name: 'Butter',       quantity: 250, unit: 'g',   note: '', price: 2.79,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:03:00.000Z' },
{ _id: 'seed-article-4',  type: 'article', listId: 'seed-list-1', name: 'Eier',         quantity: 10,  unit: 'St',  note: '', price: 3.99,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:04:00.000Z' },
{ _id: 'seed-article-5',  type: 'article', listId: 'seed-list-1', name: 'Äpfel',        quantity: 1,   unit: 'kg',  note: '', price: 2.49,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:05:00.000Z' },
```

For some articles, set `price: null` to test the "no price" display path. Use realistic Austrian supermarket prices. Give at least `seed-article-1` a `priceHistory` with 2 entries to test history display.

- [ ] **Step 2: Bump the seed marker**

In `frontend/src/db/seed.js`, change `const SEED_MARKER = 'seed-v2'` to `const SEED_MARKER = 'seed-v3'` so existing databases get re-seeded with new data.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/db/seedData.js frontend/src/db/seed.js
git commit -m "feat: add price, barcode, and priceHistory to seed data"
```

---

### Task 3: Update ArticleListView — create/edit modals and onBarcodeScanned

**Files:**
- Modify: `frontend/src/views/ArticleListView.vue`

- [ ] **Step 1: Add price ref variables and update onBarcodeScanned**

In the `<script setup>` section, add new refs and update existing functions:

```js
// Add alongside existing refs:
const newPrice = ref(null)
const newBarcode = ref(null)
const editPrice = ref(null)
```

Update `openModal`:
```js
function openModal() {
  newName.value = ''
  newQuantity.value = 1
  newUnit.value = ''
  newNote.value = ''
  newPrice.value = null
  newBarcode.value = null
  showModal.value = true
}
```

Update `onBarcodeScanned` to destructure object:
```js
function onBarcodeScanned({ name, barcode, price }) {
  showScanner.value = false
  newName.value = name
  newBarcode.value = barcode || null
  newPrice.value = price || null
  newQuantity.value = 1
  newUnit.value = ''
  showModal.value = true
}
```

Update `submitCreate` to use options object:
```js
async function submitCreate() {
  if (!newName.value.trim()) return
  submitting.value = true
  await articleStore.createArticle(listId, {
    name: newName.value.trim(),
    quantity: newQuantity.value,
    unit: newUnit.value.trim(),
    note: newNote.value.trim(),
    price: newPrice.value ?? null,
    barcode: newBarcode.value ?? null,
  })
  submitting.value = false
  closeModal()
}
```

Update `openEditModal`:
```js
function openEditModal(article) {
  editingArticle.value = article
  editName.value = article.name
  editQuantity.value = article.quantity
  editUnit.value = article.unit || ''
  editNote.value = article.note || ''
  editPrice.value = article.price
  showEditModal.value = true
}
```

Update `submitEdit` to include price (uses `updatePrice` for history tracking when price changes):
```js
async function submitEdit() {
  if (!editName.value.trim() || !editingArticle.value) return
  submitting.value = true
  const newPrice = editPrice.value ?? null
  // Track price change in history if price differs
  if (newPrice !== editingArticle.value.price && newPrice != null) {
    await articleStore.updatePrice(listId, editingArticle.value, newPrice)
    // Reload the article with updated _rev before saving other fields
    await articleStore.loadArticles(listId)
    const updated = articleStore.articles.find((a) => a._id === editingArticle.value._id)
      || articleStore.hiddenArticles.find((a) => a._id === editingArticle.value._id)
    if (updated) editingArticle.value = updated
  }
  await articleStore.updateArticle(listId, {
    ...editingArticle.value,
    name: editName.value.trim(),
    quantity: editQuantity.value,
    unit: editUnit.value.trim(),
    note: editNote.value.trim(),
    price: newPrice,
  })
  submitting.value = false
  closeEditModal()
}
```

- [ ] **Step 2: Add price input to create modal template**

In the create modal form, add a price field after the Menge/Einheit row and before Notiz:

```html
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
  <input
    v-model.number="newPrice"
    type="number"
    min="0"
    step="0.01"
    placeholder="z.B. 2,49"
    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

- [ ] **Step 3: Add price input to edit modal template**

Same field in the edit modal, using `editPrice`:

```html
<div>
  <label class="block text-sm font-medium text-gray-700 mb-1">Preis (€)</label>
  <input
    v-model.number="editPrice"
    type="number"
    min="0"
    step="0.01"
    placeholder="z.B. 2,49"
    class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
</div>
```

- [ ] **Step 4: Run all tests**

Run: `cd frontend && npx cypress run --component`
Expected: ALL tests PASS. (ArticleListView tests may need updates — see Task 6.)

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/ArticleListView.vue
git commit -m "feat: add price field to create/edit modals and update onBarcodeScanned handler"
```

---

### Task 4: Update ArticleListView — price display, trend indicator, total footer, price history

**Files:**
- Modify: `frontend/src/views/ArticleListView.vue`

- [ ] **Step 1: Add price formatting helper and total computed**

Add to `<script setup>`:

```js
import { ref, computed, onMounted, watch } from 'vue'

function formatPrice(price) {
  if (price == null) return null
  return '€ ' + price.toFixed(2).replace('.', ',')
}

const expandedPriceId = ref(null)

function togglePriceHistory(articleId) {
  expandedPriceId.value = expandedPriceId.value === articleId ? null : articleId
}

function priceTrend(article) {
  if (!article.priceHistory || article.priceHistory.length < 2) return null
  const prev = article.priceHistory[article.priceHistory.length - 2].price
  const curr = article.priceHistory[article.priceHistory.length - 1].price
  if (curr > prev) return 'up'
  if (curr < prev) return 'down'
  return null
}

const listTotal = computed(() => {
  return articleStore.articles
    .filter((a) => !a.checked && a.price != null)
    .reduce((sum, a) => sum + a.price * (a.quantity || 1), 0)
})
```

- [ ] **Step 2: Add price display and trend to article rows**

In the article info `<div>`, after the quantity/unit line, add:

```html
<p v-if="article.price != null" class="text-xs text-gray-500 mt-0.5">
  <span
    @click="togglePriceHistory(article._id)"
    class="cursor-pointer hover:text-blue-500"
  >
    {{ formatPrice(article.price) }}
  </span>
  <span v-if="priceTrend(article) === 'up'" class="text-red-500 ml-1">↑</span>
  <span v-if="priceTrend(article) === 'down'" class="text-green-500 ml-1">↓</span>
</p>
<!-- Price history expandable -->
<div
  v-if="expandedPriceId === article._id && article.priceHistory && article.priceHistory.length > 0"
  class="mt-1 text-xs text-gray-400 space-y-0.5"
>
  <p v-for="(entry, idx) in article.priceHistory" :key="idx">
    {{ new Date(entry.setAt).toLocaleDateString('de-AT') }}: {{ formatPrice(entry.price) }}
  </p>
</div>
```

- [ ] **Step 3: Add camera icon button for price scanning**

In the actions div of each article row, add before the edit button:

```html
<button
  @click="openPriceScanner(article)"
  class="text-gray-400 hover:text-green-500 transition-colors"
  title="Preis scannen"
>
  📷
</button>
```

Add the `openPriceScanner` function and state (will be connected to PriceTagScanner in Task 7):

```js
const showPriceScanner = ref(false)
const priceScanArticle = ref(null)

function openPriceScanner(article) {
  priceScanArticle.value = article
  showPriceScanner.value = true
}

async function onPriceScanned(newPrice) {
  showPriceScanner.value = false
  if (priceScanArticle.value && newPrice != null) {
    await articleStore.updatePrice(listId, priceScanArticle.value, newPrice)
  }
  priceScanArticle.value = null
}
```

- [ ] **Step 4: Add total footer**

Add after `</main>` and before the create modal:

```html
<!-- Total footer -->
<div
  v-if="listTotal > 0"
  class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40"
>
  <div class="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
    <span class="text-sm font-medium text-gray-600">Gesamt</span>
    <span class="text-lg font-bold text-gray-800">{{ formatPrice(listTotal) }}</span>
  </div>
</div>
```

Add bottom padding to `<main>` so the footer doesn't overlap content: add `pb-20` to the main class when total is visible.

- [ ] **Step 5: Run all tests**

Run: `cd frontend && npx cypress run --component`
Expected: ALL tests PASS.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/views/ArticleListView.vue
git commit -m "feat: add price display, trend indicators, price history, and total footer"
```

---

### Task 5: Update BarcodeScanner to emit barcode and price

**Files:**
- Modify: `frontend/src/views/BarcodeScanner.vue`

- [ ] **Step 1: Update lookupProduct to return barcode**

In `lookupProduct`, capture the barcode parameter and include it in the return objects. **Important:** Keep all 8 existing `per100g` nutrition rows exactly as they are (Energie, Fett, gesättigte Fettsäuren, Kohlenhydrate, Zucker, Ballaststoffe, Eiweiß, Salz). Only add the `barcode` field to each return object:

```js
async function lookupProduct(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1) {
      const p = data.product
      const n = p.nutriments || {}
      return {
        name: p.product_name_de || p.product_name || barcode,
        barcode,
        per100g: [
          { label: 'Energie', value: n['energy-kcal_100g'] ?? null, unit: 'kcal' },
          { label: 'Fett', value: n['fat_100g'] ?? null, unit: 'g' },
          { label: 'davon gesättigte Fettsäuren', value: n['saturated-fat_100g'] ?? null, unit: 'g' },
          { label: 'Kohlenhydrate', value: n['carbohydrates_100g'] ?? null, unit: 'g' },
          { label: 'davon Zucker', value: n['sugars_100g'] ?? null, unit: 'g' },
          { label: 'Ballaststoffe', value: n['fiber_100g'] ?? null, unit: 'g' },
          { label: 'Eiweiß', value: n['proteins_100g'] ?? null, unit: 'g' },
          { label: 'Salz', value: n['salt_100g'] ?? null, unit: 'g' },
        ].filter((row) => row.value !== null),
      }
    }
  } catch {
    // ignore network errors
  }
  return { name: barcode, barcode, per100g: [] }
}
```

- [ ] **Step 2: Add price ref and input to confirmation popup**

Add ref:
```js
const scannedPrice = ref(null)
```

In the template, inside the nutrition popup `<div class="px-5 py-4">` section, add a price input after the nutrition table and before the action buttons:

```html
<div class="mt-4 border-t border-gray-100 pt-4">
  <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
    Preis (optional)
  </label>
  <div class="flex items-center gap-2">
    <span class="text-sm text-gray-500">€</span>
    <input
      v-model.number="scannedPrice"
      type="number"
      min="0"
      step="0.01"
      placeholder="z.B. 2,49"
      class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
</div>
```

- [ ] **Step 3: Update confirmAdd to emit object**

Also reset `scannedPrice` when a new product is detected. In the `onMounted` callback, after `nutritionData.value = await lookupProduct(result.getText())`, add:
```js
scannedPrice.value = null
```
And similarly in `submitManual`, after `nutritionData.value = await lookupProduct(barcode)`, add:
```js
scannedPrice.value = null
```

Update `confirmAdd`:
```js
function confirmAdd() {
  emit('scanned', {
    name: nutritionData.value.name,
    barcode: nutritionData.value.barcode,
    price: scannedPrice.value ?? null,
  })
}
```

- [ ] **Step 4: Run all tests**

Run: `cd frontend && npx cypress run --component`
Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/BarcodeScanner.vue
git commit -m "feat: extend BarcodeScanner to emit barcode and optional price"
```

---

### Task 6: Create OCR price extraction utility with tests

**Files:**
- Create: `frontend/src/utils/ocrPrice.js`
- Create: `frontend/tests/unit/ocrPrice.cy.js`

- [ ] **Step 1: Write tests for price extraction**

Create `frontend/tests/unit/ocrPrice.cy.js`:

```js
import { extractPrices } from '../../src/utils/ocrPrice.js'

describe('extractPrices', () => {
  it('extracts € prefix with comma decimal', () => {
    expect(extractPrices('€ 2,49')).to.deep.equal([2.49])
  })

  it('extracts € prefix without space', () => {
    expect(extractPrices('€2,49')).to.deep.equal([2.49])
  })

  it('extracts € suffix with comma decimal', () => {
    expect(extractPrices('2,49 €')).to.deep.equal([2.49])
  })

  it('extracts € suffix without space', () => {
    expect(extractPrices('2,49€')).to.deep.equal([2.49])
  })

  it('extracts EUR prefix', () => {
    expect(extractPrices('EUR 3,99')).to.deep.equal([3.99])
  })

  it('falls back to dot decimal when no currency match', () => {
    expect(extractPrices('price is 2.49 today')).to.deep.equal([2.49])
  })

  it('prefers currency matches over dot decimal', () => {
    expect(extractPrices('€ 2,49 weight 1.5 kg')).to.deep.equal([2.49])
  })

  it('extracts multiple prices', () => {
    const result = extractPrices('€ 2,49 / kg\n€ 1,25 / Stk')
    expect(result).to.deep.equal([2.49, 1.25])
  })

  it('filters out prices below 0.01', () => {
    expect(extractPrices('€ 0,00')).to.deep.equal([])
  })

  it('filters out prices above 999.99', () => {
    expect(extractPrices('€ 1234,56')).to.deep.equal([])
  })

  it('returns empty array for no matches', () => {
    expect(extractPrices('no prices here')).to.deep.equal([])
  })

  it('handles real Austrian price tag text', () => {
    const text = 'SPAR\nVollmilch 3,5%\n1l\n€ 1,49\nAktion gültig bis 25.03.'
    expect(extractPrices(text)).to.deep.equal([1.49])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npx cypress run --component --spec tests/unit/ocrPrice.cy.js`
Expected: FAIL — module doesn't exist.

- [ ] **Step 3: Implement extractPrices**

Create `frontend/src/utils/ocrPrice.js`:

```js
export function extractPrices(text) {
  // Regex declared inside function to avoid /g lastIndex state bugs
  const CURRENCY_PATTERN = /(?:€\s?|EUR\s?)(\d{1,3},\d{2})|(\d{1,3},\d{2})\s?€/g
  const DOT_DECIMAL_PATTERN = /(?<!\d)(\d{1,3}\.\d{2})(?!\d)/g

  const prices = []

  // First try currency-symbol patterns
  let match
  while ((match = CURRENCY_PATTERN.exec(text)) !== null) {
    const raw = match[1] || match[2]
    const value = parseFloat(raw.replace(',', '.'))
    if (value >= 0.01 && value <= 999.99) prices.push(value)
  }

  // Fall back to dot decimal only if no currency matches found
  if (prices.length === 0) {
    while ((match = DOT_DECIMAL_PATTERN.exec(text)) !== null) {
      const value = parseFloat(match[1])
      if (value >= 0.01 && value <= 999.99) prices.push(value)
    }
  }

  return prices
}

export async function recognizePrice(imageBase64) {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY
  if (!apiKey) throw new Error('VITE_GOOGLE_VISION_API_KEY is not set')

  const body = {
    requests: [{
      image: { content: imageBase64 },
      features: [{ type: 'TEXT_DETECTION' }],
    }],
  }

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )

  if (!res.ok) throw new Error(`Vision API error: ${res.status}`)

  const data = await res.json()
  const text = data.responses?.[0]?.fullTextAnnotation?.text || ''
  return extractPrices(text)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx cypress run --component --spec tests/unit/ocrPrice.cy.js`
Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/ocrPrice.js frontend/tests/unit/ocrPrice.cy.js
git commit -m "feat: add OCR price extraction utility with Austrian price format support"
```

---

### Task 7: Create PriceTagScanner component

**Files:**
- Create: `frontend/src/views/PriceTagScanner.vue`
- Modify: `frontend/src/views/ArticleListView.vue` (wire it up)

- [ ] **Step 1: Create PriceTagScanner.vue**

Create `frontend/src/views/PriceTagScanner.vue`:

```vue
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { recognizePrice, extractPrices } from '../utils/ocrPrice.js'
import { useOnlineStatusStore } from '../stores/onlineStatus.js'

const props = defineProps({
  articleName: { type: String, required: true },
})

const emit = defineEmits(['scanned', 'close'])

const onlineStore = useOnlineStatusStore()
const videoRef = ref(null)
const canvasRef = ref(null)
const error = ref(null)
const loading = ref(false)
const candidates = ref([])
const selectedPrice = ref(null)
const manualPrice = ref(null)
const showResult = ref(false)
let stream = null

onMounted(async () => {
  // If offline, go straight to manual entry
  if (!onlineStore.isOnline) {
    showResult.value = true
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (e) {
    error.value = 'Kamera konnte nicht gestartet werden: ' + e.message
    showResult.value = true
  }
})

onUnmounted(() => {
  stopCamera()
})

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

async function captureAndRecognize() {
  if (!videoRef.value || !canvasRef.value) return
  loading.value = true
  error.value = null

  const video = videoRef.value
  const canvas = canvasRef.value
  // Resize to max 1280px longest edge
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = video.videoWidth * scale
  canvas.height = video.videoHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

  stopCamera()

  try {
    const prices = await recognizePrice(base64)
    candidates.value = prices
    if (prices.length === 1) {
      selectedPrice.value = prices[0]
      manualPrice.value = prices[0]
    } else if (prices.length > 1) {
      selectedPrice.value = prices[0]
      manualPrice.value = prices[0]
    } else {
      manualPrice.value = null
    }
  } catch (e) {
    error.value = 'Preiserkennung fehlgeschlagen. Bitte manuell eingeben.'
    manualPrice.value = null
  }

  showResult.value = true
  loading.value = false
}

function selectCandidate(price) {
  selectedPrice.value = price
  manualPrice.value = price
}

function confirm() {
  const price = manualPrice.value
  emit('scanned', price != null && price > 0 ? price : null)
}

function close() {
  stopCamera()
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
    <!-- Camera view -->
    <div v-if="!showResult" class="relative w-full max-w-md mx-4">
      <div class="bg-black rounded-2xl overflow-hidden relative">
        <video
          ref="videoRef"
          autoplay
          playsinline
          class="w-full"
          style="aspect-ratio: 4/3; object-fit: cover"
        />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="border-2 border-white/60 rounded-lg w-56 h-36"></div>
        </div>
      </div>
      <p v-if="error" class="text-red-400 text-sm text-center mt-3">{{ error }}</p>
      <p v-else class="text-white/70 text-sm text-center mt-3">
        {{ loading ? 'Preis wird erkannt...' : 'Preisschild ins Bild halten und aufnehmen' }}
      </p>
      <button
        @click="captureAndRecognize"
        :disabled="loading"
        class="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
      >
        {{ loading ? 'Wird erkannt...' : 'Aufnehmen' }}
      </button>
      <button
        @click="close"
        class="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded-xl py-3 font-medium transition-colors"
      >
        Abbrechen
      </button>
    </div>

    <!-- Result / manual entry -->
    <div v-else class="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Preis für</p>
        <h2 class="text-lg font-bold text-gray-800">{{ articleName }}</h2>
      </div>

      <div class="px-5 py-4">
        <p v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</p>

        <!-- Multiple candidates -->
        <div v-if="candidates.length > 1" class="mb-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Erkannte Preise
          </p>
          <label
            v-for="price in candidates"
            :key="price"
            class="flex items-center gap-3 py-2 cursor-pointer"
          >
            <input
              type="radio"
              :value="price"
              v-model="selectedPrice"
              @change="manualPrice = price"
              class="accent-blue-600"
            />
            <span class="text-sm text-gray-800">
              € {{ price.toFixed(2).replace('.', ',') }}
            </span>
          </label>
        </div>

        <!-- Single candidate message -->
        <p v-else-if="candidates.length === 1" class="text-sm text-green-600 mb-3">
          Preis erkannt!
        </p>

        <!-- Manual entry / correction -->
        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {{ candidates.length > 0 ? 'Preis korrigieren' : 'Preis eingeben' }}
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">€</span>
            <input
              v-model.number="manualPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="z.B. 2,49"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="px-5 pb-5 flex gap-3">
        <button
          @click="close"
          class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          @click="confirm"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Übernehmen
        </button>
      </div>
    </div>

    <canvas ref="canvasRef" class="hidden" />
  </div>
</template>
```

- [ ] **Step 2: Wire PriceTagScanner into ArticleListView**

In `ArticleListView.vue`, add the import and template:

```js
import PriceTagScanner from './PriceTagScanner.vue'
```

Add in template after the BarcodeScanner block:

```html
<!-- Price tag scanner -->
<PriceTagScanner
  v-if="showPriceScanner"
  :article-name="priceScanArticle?.name ?? ''"
  @scanned="onPriceScanned"
  @close="showPriceScanner = false"
/>
```

- [ ] **Step 3: Run all tests**

Run: `cd frontend && npx cypress run --component`
Expected: ALL tests PASS.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/views/PriceTagScanner.vue frontend/src/views/ArticleListView.vue
git commit -m "feat: add PriceTagScanner component with Google Vision OCR and offline fallback"
```

---

### Task 8: Update ArticleListView tests

**Files:**
- Modify: `frontend/tests/unit/ArticleListView.cy.js`

- [ ] **Step 1: Update existing test data with price fields**

In `ArticleListView.cy.js`, update the mock data to include price fields:

```js
const mockArticles = [
  { ...seedArticles[0], checked: false, hidden: false, _rev: '1-a1', price: 1.49, barcode: '123', priceHistory: [{ price: 1.29, setAt: '2026-03-01T00:00:00.000Z' }, { price: 1.49, setAt: '2026-03-10T00:00:00.000Z' }] },
  { ...seedArticles[1], checked: false, hidden: false, _rev: '1-a2', price: 3.29, barcode: null, priceHistory: [] },
]
```

- [ ] **Step 2: Add price display and total tests**

Add new tests to the "Ausblenden & Löschen" describe block:

```js
it('shows price on article', () => {
  articleStore.articles = [mockArticles[0]]
  cy.contains('€ 1,49').should('be.visible')
})

it('shows price trend up indicator', () => {
  articleStore.articles = [mockArticles[0]]
  cy.contains('↑').should('be.visible')
})

it('shows total footer', () => {
  articleStore.articles = [...mockArticles]
  cy.contains('Gesamt').should('be.visible')
})
```

- [ ] **Step 3: Add stub for updatePrice in beforeEach**

In both describe block `beforeEach` sections, add:

```js
cy.stub(articleStore, 'updatePrice').resolves()
```

- [ ] **Step 4: Run tests**

Run: `cd frontend && npx cypress run --component --spec tests/unit/ArticleListView.cy.js`
Expected: ALL tests PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/tests/unit/ArticleListView.cy.js
git commit -m "test: update ArticleListView tests for price display, trends, and total"
```

---

### Task 9: Final integration test and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run all unit tests**

Run: `cd frontend && npx cypress run --component`
Expected: ALL tests PASS.

- [ ] **Step 2: Build and run e2e tests**

Run: `cd frontend && npm run build && npm run test:e2e`
Expected: ALL tests PASS.

- [ ] **Step 3: Manual smoke test**

Start dev server: `cd frontend && npm run dev`
Verify:
1. Open a list — articles show prices where set
2. Total footer shows at bottom
3. Create modal has price field
4. Edit modal shows existing price
5. Price history expands when clicking a price
6. Trend arrows show on articles with history

- [ ] **Step 4: Final commit if any adjustments were needed**

```bash
git add -A
git commit -m "feat: article prices and price tag scanning — integration fixes"
```
