<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/article.js'
import { useShoppingListStore } from '../stores/shoppingList.js'
import { useThemeStore } from '../stores/theme.js'
import BarcodeScanner from './BarcodeScanner.vue'
import PriceTagScanner from './PriceTagScanner.vue'
import ManualSyncButton from '../components/sync/ManualSyncButton.vue'
import SyncToast from '../components/sync/SyncToast.vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const listStore = useShoppingListStore()
const themeStore = useThemeStore()

const listId = route.params.id
const list = ref(null)

const showModal = ref(false)
const showEditModal = ref(false)
const showScanner = ref(false)
const showHidden = ref(false)
const showShareModal = ref(false)
const submitting = ref(false)
const searchQuery = ref('')

watch(searchQuery, (q) => articleStore.searchArticles(q, listId))

async function toggleFromSearch(article) {
  await articleStore.toggleChecked(listId, article)
  await articleStore.searchArticles(searchQuery.value, listId)
}

function clearSearch() {
  searchQuery.value = ''
}

const newName = ref('')
const newQuantity = ref(1)
const newUnit = ref('')
const newNote = ref('')
const newPrice = ref(null)
const newBarcode = ref(null)

const editingArticle = ref(null)
const editName = ref('')
const editQuantity = ref(1)
const editUnit = ref('')
const editNote = ref('')
const editPrice = ref(null)

onMounted(async () => {
  await listStore.loadLists()
  list.value = listStore.lists.find((l) => l._id === listId) || null
  await articleStore.loadArticles(listId)
  articleStore.startLiveSync(listId)
  listStore.startLiveSync()
})

onUnmounted(() => {
  articleStore.stopLiveSync()
  listStore.stopLiveSync()
})

function openModal() {
  newName.value = ''
  newQuantity.value = 1
  newUnit.value = ''
  newNote.value = ''
  newPrice.value = null
  newBarcode.value = null
  showModal.value = true
}

function onBarcodeScanned({ name, barcode, price }) {
  showScanner.value = false
  newName.value = name
  newBarcode.value = barcode || null
  newPrice.value = price || null
  newQuantity.value = 1
  newUnit.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

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

function openEditModal(article) {
  editingArticle.value = article
  editName.value = article.name
  editQuantity.value = article.quantity
  editUnit.value = article.unit || ''
  editNote.value = article.note || ''
  editPrice.value = article.price
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingArticle.value = null
}

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

function escapeCsvField(value) {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function exportToCsv() {
  const allArticles = [
    ...articleStore.articles,
    ...articleStore.hiddenArticles,
  ]

  const header = ['Name', 'Menge', 'Einheit', 'Notiz', 'Erledigt']
  const rows = allArticles.map((a) => [
    escapeCsvField(a.name),
    escapeCsvField(a.quantity),
    escapeCsvField(a.unit || ''),
    escapeCsvField(a.note || ''),
    a.checked ? 'Ja' : 'Nein',
  ])

  const csvContent =
    [header, ...rows].map((row) => row.join(',')).join('\r\n')

  // BOM prefix so Excel opens UTF-8 correctly
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const listName = list.value?.name ?? 'Liste'
  link.href = url
  link.download = `${listName}_export.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

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
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm safe-top">
      <div class="max-w-3xl mx-auto px-4 pt-4 pb-5 space-y-3">
        <!-- Top row: navigation + title + dark mode -->
        <div class="flex items-center gap-3">
          <button
            @click="router.push('/')"
            class="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 transition-colors text-lg font-medium p-1"
            title="Zurück"
          >
            ←
          </button>
          <div class="flex-1 min-w-0">
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100 truncate">{{ list?.name ?? 'Liste' }}</h1>
            <span
              v-if="list?.category"
              class="inline-block text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full px-2 py-0.5"
            >
              {{ list.category }}
            </span>
          </div>
          <button
            @click="themeStore.toggle()"
            class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-lg transition-colors flex-shrink-0"
            :title="themeStore.isDark ? 'Light Mode' : 'Dark Mode'"
          >
            {{ themeStore.isDark ? '☀️' : '🌙' }}
          </button>
        </div>
        <!-- Bottom row: action buttons -->
        <div class="flex gap-2">
          <ManualSyncButton />
          <button
            @click="showShareModal = true"
            class="flex-1 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium py-2.5 rounded-lg transition-colors"
            title="Liste teilen"
          >
            Teilen
          </button>
          <button
            @click="showScanner = true"
            class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2.5 rounded-lg transition-colors"
            title="Barcode scannen"
          >
            Barcode
          </button>
          <button
            @click="openModal"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            + Artikel
          </button>
        </div>
        <button
          @click="exportToCsv"
          class="border border-green-600 text-green-600 hover:bg-green-50 font-medium px-3 py-2 rounded-lg transition-colors"
          title="Als CSV exportieren"
          id="btn-export-csv"
        >
          CSV
        </button>
      </div>
    </header>

    <!-- Search -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <div class="max-w-3xl mx-auto px-4 py-3">
        <div class="relative">
          <span class="absolute left-3 top-2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Artikel suchen..."
            class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            v-if="searchQuery"
            @click="clearSearch"
            class="absolute right-3 top-2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <!-- Search results -->
        <div
          v-if="searchQuery"
          class="mt-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden"
        >
          <!-- In current list -->
          <div v-if="articleStore.searchResults.inCurrentList.length > 0">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-4 pt-3 pb-1 uppercase tracking-wide">
              In dieser Liste
            </p>
            <div
              v-for="article in articleStore.searchResults.inCurrentList"
              :key="article._id"
              @click="toggleFromSearch(article)"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                :checked="article.checked"
                class="w-4 h-4 accent-blue-600 pointer-events-none flex-shrink-0"
              />
              <span
                class="text-sm text-gray-800 dark:text-gray-200 flex-1"
                :class="{ 'line-through text-gray-400 dark:text-gray-500': article.checked }"
              >
                {{ article.name }}
              </span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ article.quantity }}{{ article.unit ? ' ' + article.unit : '' }}
              </span>
            </div>
          </div>

          <!-- From other lists -->
          <div v-if="articleStore.searchResults.inOtherLists.length > 0">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-4 pt-3 pb-1 uppercase tracking-wide">
              Aus anderen Listen
            </p>
            <div
              v-for="article in articleStore.searchResults.inOtherLists"
              :key="article._id"
              @click="articleStore.addFromSearch(listId, article); clearSearch()"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <span class="text-gray-400 text-sm flex-shrink-0">+</span>
              <span class="text-sm text-gray-800 dark:text-gray-200 flex-1">{{ article.name }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ article.quantity }}{{ article.unit ? ' ' + article.unit : '' }}
              </span>
            </div>
          </div>

          <!-- Past / hidden articles -->
          <div v-if="articleStore.searchResults.inPast.length > 0">
            <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-4 pt-3 pb-1 uppercase tracking-wide">
              Vergangene Artikel
            </p>
            <div
              v-for="article in articleStore.searchResults.inPast"
              :key="article._id"
              @click="articleStore.addFromSearch(listId, article); clearSearch()"
              class="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
            >
              <span class="text-gray-400 text-sm flex-shrink-0">↩</span>
              <span class="text-sm text-gray-500 flex-1 line-through">{{ article.name }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500">
                {{ article.quantity }}{{ article.unit ? ' ' + article.unit : '' }}
              </span>
            </div>
          </div>

          <!-- No results -->
          <div
            v-if="
              articleStore.searchResults.inCurrentList.length === 0 &&
              articleStore.searchResults.inOtherLists.length === 0 &&
              articleStore.searchResults.inPast.length === 0
            "
            class="px-4 py-4 text-center text-sm text-gray-400 dark:text-gray-500"
          >
            Keine Artikel gefunden.
          </div>
        </div>
      </div>
    </div>

    <!-- Article list -->
    <main class="max-w-3xl mx-auto px-4 py-6" :class="{ 'pb-20': listTotal > 0 }">
      
      <div v-if="articleStore.articles.length === 0" class="text-center text-gray-400 dark:text-gray-500 mt-16">
        <p class="text-lg">Noch keine Artikel vorhanden.</p>
        <p class="text-sm mt-1">Füge deinen ersten Artikel hinzu!</p>
      </div>

      <div class="grid gap-3">
        <div
          v-for="article in articleStore.articles"
          :key="article._id"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4"
          :class="{ 'opacity-60': article.checked }"
        >
          <!-- Checkbox -->
          <input
            type="checkbox"
            :checked="article.checked"
            @change="articleStore.toggleChecked(listId, article)"
            class="w-5 h-5 accent-blue-600 cursor-pointer flex-shrink-0"
          />

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <p
              class="text-base font-medium text-gray-800 dark:text-gray-100 truncate"
              :class="{ 'line-through text-gray-400 dark:text-gray-500': article.checked }"
            >
              {{ article.name }}
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500">
              {{ article.quantity }}
              <span v-if="article.unit">{{ article.unit }}</span>
            </p>
            <p v-if="article.note" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5 italic">{{ article.note }}</p>
            <p v-if="article.price != null" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
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
              class="mt-1 text-xs text-gray-400 dark:text-gray-500 space-y-0.5"
            >
              <p v-for="(entry, idx) in article.priceHistory" :key="idx">
                {{ new Date(entry.setAt).toLocaleDateString('de-AT') }}: {{ formatPrice(entry.price) }}
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 flex-shrink-0">
            <button
              @click="openPriceScanner(article)"
              class="text-gray-400 hover:text-green-500 transition-colors p-2"
              title="Preis scannen"
            >
              📷
            </button>
            <button
              @click="openEditModal(article)"
              class="text-gray-400 hover:text-blue-500 transition-colors p-2"
              title="Bearbeiten"
            >
              ✎
            </button>
            <button
              @click="articleStore.hideArticle(listId, article)"
              class="text-gray-400 hover:text-orange-500 transition-colors p-2"
              title="Ausblenden"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      <!-- Hidden articles section -->
      <div v-if="articleStore.hiddenArticles.length > 0" class="mt-8">
        <button
          @click="showHidden = !showHidden"
          class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium"
        >
          <span>{{ showHidden ? '▾' : '▸' }}</span>
          Ausgeblendete Artikel ({{ articleStore.hiddenArticles.length }})
        </button>

        <div v-if="showHidden" class="grid gap-3 mt-3">
          <div
            v-for="article in articleStore.hiddenArticles"
            :key="article._id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-dashed border-gray-300 dark:border-gray-600 p-4 flex items-center gap-4 opacity-60"
          >
            <div class="flex-1 min-w-0">
              <p class="text-base font-medium text-gray-500 dark:text-gray-400 truncate line-through">
                {{ article.name }}
              </p>
              <p class="text-xs text-gray-400 dark:text-gray-500">
                {{ article.quantity }}
                <span v-if="article.unit">{{ article.unit }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click="articleStore.restoreArticle(listId, article)"
                class="text-gray-400 hover:text-green-500 transition-colors text-sm"
                title="Wiederherstellen"
              >
                ↩
              </button>
              <button
                @click="articleStore.deleteArticle(listId, article._id, article._rev)"
                class="text-gray-400 hover:text-red-500 transition-colors text-sm"
                title="Endgültig löschen"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </main>

    <!-- Global Sync Toast Overlay -->
    <SyncToast />

    <!-- Total footer -->
    <div
      v-if="listTotal > 0"
      class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40 safe-bottom"
    >
      <div class="max-w-3xl mx-auto px-4 py-3 flex justify-between items-center">
        <span class="text-sm font-medium text-gray-600 dark:text-gray-400">Gesamt</span>
        <span class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ formatPrice(listTotal) }}</span>
      </div>
    </div>

    <!-- Create modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 overflow-y-auto"
      @click.self="closeModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 px-6 pt-6 pb-8">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Neuer Artikel</h2>
        <form @submit.prevent="submitCreate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              v-model="newName"
              type="text"
              required
              placeholder="z.B. Milch"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Menge</label>
              <input
                v-model.number="newQuantity"
                type="number"
                min="0"
                step="any"
                placeholder="1"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einheit</label>
              <input
                v-model="newUnit"
                type="text"
                placeholder="z.B. kg"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preis (€)</label>
            <input
              v-model.number="newPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="z.B. 2,49"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notiz</label>
            <input
              v-model="newNote"
              type="text"
              placeholder="z.B. Bio-Qualität"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {{ submitting ? 'Hinzufügen...' : 'Hinzufügen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Barcode scanner -->
    <BarcodeScanner
      v-if="showScanner"
      @scanned="onBarcodeScanned"
      @close="showScanner = false"
    />

    <!-- Price tag scanner -->
    <PriceTagScanner
      v-if="showPriceScanner"
      :article-name="priceScanArticle?.name ?? ''"
      @scanned="onPriceScanned"
      @close="showPriceScanner = false"
    />
    <!-- Share modal -->
    <div
      v-if="showShareModal"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      @click.self="showShareModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 px-6 pt-6 pb-8 text-center">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Liste teilen</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Teile diesen Code, damit andere Benutzer der Liste beitreten können.</p>
        <div class="bg-gray-100 dark:bg-gray-700 rounded-xl py-4 px-6 mb-6">
          <span class="text-3xl font-mono font-bold tracking-widest text-gray-800 dark:text-gray-100">
            {{ list?.shareCode ?? '------' }}
          </span>
        </div>
        <button
          @click="showShareModal = false"
          class="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Schliessen
        </button>
      </div>
    </div>

    <!-- Edit modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 overflow-y-auto"
      @click.self="closeEditModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 px-6 pt-6 pb-8">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Artikel bearbeiten</h2>
        <form @submit.prevent="submitEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Menge</label>
              <input
                v-model.number="editQuantity"
                type="number"
                min="0"
                step="any"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einheit</label>
              <input
                v-model="editUnit"
                type="text"
                placeholder="z.B. kg"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preis (€)</label>
            <input
              v-model.number="editPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="z.B. 2,49"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notiz</label>
            <input
              v-model="editNote"
              type="text"
              placeholder="z.B. Bio-Qualität"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="closeEditModal"
              class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {{ submitting ? 'Speichern...' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
