<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import QRCode from 'qrcode'
import { useArticleStore } from '../stores/article.js'
import { useShoppingListStore } from '../stores/shoppingList.js'
import { useTagStore } from '../stores/tag.js'
import { useThemeStore } from '../stores/theme.js'
import { useNotificationStore } from '../stores/notification.js'
import BarcodeScanner from './BarcodeScanner.vue'
import PriceTagScanner from './PriceTagScanner.vue'
import ReceiptScanner from './ReceiptScanner.vue'
import ManualSyncButton from '../components/sync/ManualSyncButton.vue'
import SyncToast from '../components/sync/SyncToast.vue'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const listStore = useShoppingListStore()
const tagStore = useTagStore()
const themeStore = useThemeStore()

const listId = route.params.id
const list = ref(null)
const notificationStore = useNotificationStore()
const listNotifications = computed(() => notificationStore.notifications.filter((n) => n.listId === listId))

const showModal = ref(false)
const showEditModal = ref(false)
const showScanner = ref(false)
const showHidden = ref(false)
const showShareModal = ref(false)
const showReceiptScanner = ref(false)
const showHistory = ref(false)
const listHistory = computed(() => notificationStore.history.filter((n) => n.listId === listId))
const submitting = ref(false)
const searchQuery = ref('')
const shareQrCanvas = ref(null)

watch([showShareModal, () => list.value?.shareCode], async ([open, code]) => {
  if (!open || !code) return
  await nextTick()
  if (shareQrCanvas.value) {
    await QRCode.toCanvas(shareQrCanvas.value, code, { width: 200, margin: 1 })
  }
})

watch(searchQuery, (q) => articleStore.searchArticles(q, listId))

async function toggleFromSearch(article) {
  await articleStore.toggleChecked(listId, article)
  await articleStore.searchArticles(searchQuery.value, listId)
}

function clearSearch() {
  searchQuery.value = ''
}

const tagNames = computed(() => tagStore.tags.map((t) => t.name))

const filterTag = ref('')
const showTagManager = ref(false)
const newTagName = ref('')
const editingTag = ref(null)
const editingTagName = ref('')

async function addTag() {
  if (!newTagName.value.trim()) return
  await tagStore.createTag(listId, newTagName.value)
  newTagName.value = ''
}

function startEditTag(tag) {
  editingTag.value = tag
  editingTagName.value = tag.name
}

async function saveEditTag() {
  if (!editingTag.value) return
  await tagStore.updateTag(listId, editingTag.value, editingTagName.value)
  editingTag.value = null
  editingTagName.value = ''
}

async function removeTag(tag) {
  await tagStore.deleteTag(listId, tag)
  if (filterTag.value === tag.name) filterTag.value = ''
}

const newName = ref('')
const newQuantity = ref(1)
const newPackageSize = ref(null)
const newPackageUnit = ref('')
const newNote = ref('')
const newPrice = ref(null)
const newBarcode = ref(null)
const newTag = ref('')
const newRabattfähig = ref(false)

const editingArticle = ref(null)
const editName = ref('')
const editQuantity = ref(1)
const editPackageSize = ref(null)
const editPackageUnit = ref('')
const editNote = ref('')
const editPrice = ref(null)
const editTag = ref('')
const editRabattfähig = ref(false)

onMounted(async () => {
  await listStore.loadLists()
  list.value = listStore.lists.find((l) => l._id === listId) || null
  await tagStore.ensureDefaultTags(listId)
  await tagStore.loadTags(listId)
  await articleStore.loadArticles(listId)
  articleStore.startLiveSync(listId)
  tagStore.startLiveSync(listId)
  listStore.startLiveSync()
})

onUnmounted(() => {
  articleStore.stopLiveSync()
  tagStore.stopLiveSync()
  listStore.stopLiveSync()
})

function openModal() {
  newName.value = ''
  newQuantity.value = 1
  newPackageSize.value = null
  newPackageUnit.value = ''
  newNote.value = ''
  newPrice.value = null
  newBarcode.value = null
  newTag.value = ''
  newRabattfähig.value = false
  showModal.value = true
}

function onBarcodeScanned({ name, barcode, price }) {
  showScanner.value = false
  newName.value = name
  newBarcode.value = barcode || null
  newPrice.value = price || null
  newQuantity.value = 1
  newPackageSize.value = null
  newPackageUnit.value = ''
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
    packageSize: newPackageSize.value ?? null,
    packageUnit: newPackageUnit.value.trim(),
    note: newNote.value.trim(),
    price: newPrice.value ?? null,
    barcode: newBarcode.value ?? null,
    tag: newTag.value,
    rabattfähig: newRabattfähig.value,
  })
  submitting.value = false
  closeModal()
}

function openEditModal(article) {
  editingArticle.value = article
  editName.value = article.name
  editQuantity.value = article.quantity
  editPackageSize.value = article.packageSize ?? null
  editPackageUnit.value = article.packageUnit || article.unit || ''
  editNote.value = article.note || ''
  editPrice.value = article.price
  editTag.value = article.tag || ''
  editRabattfähig.value = article.rabattfähig ?? false
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingArticle.value = null
}

async function submitEdit() {
  if (!editName.value.trim() || !editingArticle.value) return
  submitting.value = true
  const article = editingArticle.value
  const newPrice = editPrice.value ?? null
  const removingRabatt = (article.rabattfähig ?? false) && !editRabattfähig.value && article.rabattAngewendet

  if (removingRabatt) {
    await articleStore.updatePrice(listId, article._id, article.price, article.rabattAngewendet.originalPreis, article.name)
  } else if (newPrice !== article.price && newPrice != null) {
    await articleStore.updatePrice(listId, article._id, article.price, newPrice, article.name)
  }

  const changedFields = {}
  if (editName.value.trim() !== article.name) changedFields.name = editName.value.trim()
  if (editQuantity.value !== article.quantity) changedFields.quantity = editQuantity.value
  const oldPkgSize = article.packageSize ?? null
  const oldPkgUnit = article.packageUnit || article.unit || ''
  if (editPackageSize.value !== oldPkgSize) changedFields.packageSize = editPackageSize.value ?? null
  if (editPackageUnit.value.trim() !== oldPkgUnit) changedFields.packageUnit = editPackageUnit.value.trim()
  if (editNote.value.trim() !== (article.note || '')) changedFields.note = editNote.value.trim()
  if (!removingRabatt && newPrice !== article.price && newPrice == null) changedFields.price = null
  if (editRabattfähig.value !== (article.rabattfähig ?? false)) changedFields.rabattfähig = editRabattfähig.value
  if (removingRabatt) changedFields.rabattAngewendet = null
  if (editTag.value !== (article.tag || '')) changedFields.tag = editTag.value

  await articleStore.updateArticle(listId, article._id, changedFields, article.name)
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

  // Tests expect header: Name,Menge,Einheit,Notiz,Erledigt
  const header = ['Name', 'Menge', 'Einheit', 'Notiz', 'Erledigt']

  // Helper to produce Menge and Einheit columns compatible with UI display
  function formatQuantityUnitForCsv(a) {
    const menge = a.quantity != null ? String(a.quantity) : ''
    const einheit = a.packageUnit || a.unit || ''
    return { menge, einheit }
  }

  const rows = allArticles.map((a) => {
    const { menge, einheit } = formatQuantityUnitForCsv(a)
    return [
      escapeCsvField(a.name),
      escapeCsvField(menge),
      escapeCsvField(einheit),
      escapeCsvField(a.note || ''),
      a.checked ? 'Ja' : 'Nein',
    ]
  })

  const csvContent = [header, ...rows].map((row) => row.join(',')).join('\r\n')

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

// Helper to format quantity and unit like in tests (e.g. '2 l' or '1')
function formatQuantityUnit(a) {
  const qty = a.quantity != null ? a.quantity : ''
  const unit = a.packageSize ? (a.packageUnit || a.unit || '') : (a.packageUnit || a.unit || '')
  if (unit && qty) return `${qty} ${unit}`
  if (qty) return String(qty)
  return ''
}

function togglePriceHistory(articleId) {
  expandedPriceId.value = expandedPriceId.value === articleId ? null : articleId
}

function displayName(username) {
  return username ? username.split('#')[0] : 'Unbekannt'
}

function formatCheckTime(isoString) {
  const date = new Date(isoString)
  return (
    date.toLocaleDateString('de-AT') +
    ' um ' +
    date.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' }) +
    ' Uhr'
  )
}

function priceTrend(article) {
  if (!article.priceHistory || article.priceHistory.length < 2) return null
  const prev = article.priceHistory[article.priceHistory.length - 2].price
  const curr = article.priceHistory[article.priceHistory.length - 1].price
  if (curr > prev) return 'up'
  if (curr < prev) return 'down'
  return null
}

const filteredArticles = computed(() => {
  if (!filterTag.value) return articleStore.articles
  return articleStore.articles.filter((a) => a.tag === filterTag.value)
})

const groupedArticles = computed(() => {
  const groups = []
  let currentTag = null
  for (const article of filteredArticles.value) {
    const tag = article.tag || ''
    if (tag !== currentTag) {
      groups.push({ tag, articles: [] })
      currentTag = tag
    }
    groups[groups.length - 1].articles.push(article)
  }
  return groups
})

const listTotal = computed(() => {
  return filteredArticles.value
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
    await articleStore.updatePrice(listId, priceScanArticle.value._id, priceScanArticle.value.price, newPrice, priceScanArticle.value.name)
  }
  priceScanArticle.value = null
}

const showPickerlModal = ref(false)
const pickerlProzent = ref(null)
const pickerlAppliedIds = ref(new Set())
const pickerlAppliedSnapshots = ref({})

function openPickerlModal() {
  pickerlProzent.value = null
  pickerlAppliedIds.value = new Set()
  pickerlAppliedSnapshots.value = {}
  showPickerlModal.value = true
}

const pickerlArtikel = computed(() => {
  if (!pickerlProzent.value || pickerlProzent.value <= 0 || pickerlProzent.value > 100) return []
  return articleStore.articles
    .filter((a) => a.rabattfähig && !a.checked && a.price != null && !pickerlAppliedIds.value.has(a._id))
    .map((a) => {
      const originalTotal = a.price * (a.quantity || 1)
      const discountedTotal = originalTotal * (1 - pickerlProzent.value / 100)
      return { ...a, originalTotal, discountedTotal }
    })
})

async function applyPickerl(a) {
  const prozent = pickerlProzent.value
  const discountedPreis = parseFloat((a.price * (1 - prozent / 100)).toFixed(2))
  // Snapshot before the store updates so display stays frozen
  pickerlAppliedSnapshots.value[a._id] = {
    name: a.name,
    quantity: a.quantity,
    packageSize: a.packageSize,
    packageUnit: a.packageUnit || a.unit || '',
    originalTotal: a.originalTotal,
    discountedTotal: a.discountedTotal,
  }
  pickerlAppliedIds.value = new Set([...pickerlAppliedIds.value, a._id])
  await articleStore.updatePrice(listId, a._id, a.price, discountedPreis)
  await articleStore.updateArticle(listId, a._id, { rabattAngewendet: { prozent, originalPreis: a.price } })
}

async function onReceiptMatched(matchedArticles) {
  showReceiptScanner.value = false
  for (const article of matchedArticles) {
    if (!article.checked) {
      await articleStore.toggleChecked(listId, article)
    }
  }
}

</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Notification banners -->
    <TransitionGroup
      name="notification"
      tag="div"
      class="fixed top-0 left-0 right-0 z-[45] safe-top flex flex-col gap-2 max-w-3xl mx-auto px-3 sm:px-4 pt-2 sm:pt-3 pointer-events-none"
    >
      <div
        v-for="n in listNotifications"
        :key="n.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-lg px-3 py-2.5 sm:px-4 sm:py-3 flex items-start gap-2.5 sm:gap-3 pointer-events-auto cursor-pointer"
        :class="n.type === 'add'
          ? 'border border-green-200 dark:border-green-700'
          : n.type === 'update'
            ? 'border border-blue-200 dark:border-blue-700'
            : n.type === 'check'
              ? 'border border-yellow-200 dark:border-yellow-700'
              : 'border border-red-200 dark:border-red-700'"
        @click="notificationStore.dismiss(n.id)"
      >
        <span
          class="text-base sm:text-lg flex-shrink-0 leading-5"
          :class="n.type === 'add' ? 'text-green-500' : n.type === 'update' ? 'text-blue-500' : n.type === 'check' ? 'text-yellow-500' : 'text-red-500'"
        >●</span>
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium break-words"
            :class="n.type === 'add' ? 'text-green-700 dark:text-green-300' : n.type === 'update' ? 'text-blue-700 dark:text-blue-300' : n.type === 'check' ? 'text-yellow-700 dark:text-yellow-300' : 'text-red-700 dark:text-red-300'"
          >{{ n.message }}</p>
          <p
            class="text-xs mt-0.5"
            :class="n.type === 'add' ? 'text-green-400 dark:text-green-500' : n.type === 'update' ? 'text-blue-400 dark:text-blue-500' : n.type === 'check' ? 'text-yellow-400 dark:text-yellow-500' : 'text-red-400 dark:text-red-500'"
          >{{ n.time }}</p>
        </div>
      </div>
    </TransitionGroup>

    <!-- Notification history drawer -->
    <Transition name="notification">
      <div
        v-if="showHistory"
        class="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center sm:justify-center"
        @click.self="showHistory = false"
      >
        <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-base font-bold text-gray-800 dark:text-gray-100">Benachrichtigungen</h2>
            <div class="flex items-center gap-1">
              <button
                v-if="listHistory.length > 0"
                @click="notificationStore.clearHistory(listId)"
                class="text-xs text-gray-500 hover:text-red-500 dark:text-gray-400 px-2 py-1 rounded"
              >Leeren</button>
              <button
                @click="showHistory = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                title="Schließen"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
          </div>
          <div class="overflow-y-auto flex-1 px-3 py-2 space-y-1.5">
            <p v-if="listHistory.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              Noch keine Benachrichtigungen.
            </p>
            <div
              v-for="n in listHistory"
              :key="n.id"
              class="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <span
                class="text-base flex-shrink-0 leading-5"
                :class="n.type === 'add' ? 'text-green-500' : n.type === 'update' ? 'text-blue-500' : n.type === 'check' ? 'text-yellow-500' : 'text-red-500'"
              >●</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-800 dark:text-gray-100 break-words">{{ n.message }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ n.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

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
            @click="showHistory = true"
            class="relative border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-lg transition-colors flex-shrink-0"
            title="Benachrichtigungen"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
            </svg>
            <span
              v-if="listHistory.length > 0"
              class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
            >{{ listHistory.length > 99 ? '99+' : listHistory.length }}</span>
          </button>
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
        <div class="flex gap-2">
          <button
            @click="exportToCsv"
            class="border border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 font-medium px-3 py-2 rounded-lg transition-colors"
            title="Als CSV exportieren"
            id="btn-export-csv"
          >
            CSV
          </button>
          <button
            @click="openPickerlModal"
            class="border border-yellow-500 text-yellow-600 dark:text-yellow-400 dark:border-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 font-medium px-3 py-2 rounded-lg transition-colors"
            title="Rabatt Pickerl berechnen"
          >
            🏷 Pickerl
          </button>
          <button
            @click="showReceiptScanner = true"
            class="border border-orange-500 text-orange-600 dark:text-orange-400 dark:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 font-medium px-3 py-2 rounded-lg transition-colors"
            title="Rechnung scannen und Artikel abhaken"
            id="btn-receipt-scanner"
          >
            🧾 Rechnung
          </button>
        </div>
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
                {{ formatQuantityUnit(article) }}
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
                {{ formatQuantityUnit(article) }}
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
                {{ formatQuantityUnit(article) }}
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
            class="px-4 py-4 flex items-center justify-between gap-3"
          >
            <span class="text-sm text-gray-400 dark:text-gray-500">Keine Artikel gefunden.</span>
            <button
              @click="() => { const q = searchQuery; clearSearch(); openModal(); newName = q }"
              class="flex-shrink-0 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              + Hinzufügen
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter chips -->
    <div v-if="tagNames.length > 0" class="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
      <div class="max-w-3xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          @click="filterTag = ''"
          class="flex-shrink-0 text-xs font-medium rounded-full px-3 py-1 transition-colors"
          :class="filterTag === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >Alle</button>
        <button
          v-for="name in tagNames"
          :key="name"
          @click="filterTag = filterTag === name ? '' : name"
          class="flex-shrink-0 text-xs font-medium rounded-full px-3 py-1 transition-colors"
          :class="filterTag === name ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
        >{{ name }}</button>
        <button
          @click="showTagManager = true"
          class="flex-shrink-0 text-xs font-medium rounded-full px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          title="Abteilungen verwalten"
        >Verwalten</button>
      </div>
    </div>

    <!-- Article list -->
    <main class="max-w-3xl mx-auto px-4 py-6" :class="{ 'pb-20': listTotal > 0 }">
      
      <div v-if="articleStore.articles.length === 0" class="text-center text-gray-400 dark:text-gray-500 mt-16">
        <p class="text-lg">Noch keine Artikel vorhanden.</p>
        <p class="text-sm mt-1">Füge deinen ersten Artikel hinzu!</p>
      </div>

      <div class="grid gap-3">
        <template v-for="group in groupedArticles" :key="group.tag">
          <div v-if="group.tag" class="flex items-center gap-2 mt-2 first:mt-0">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wide">{{ group.tag }}</span>
            <div class="flex-1 border-t border-gray-200"></div>
          </div>
          <div
            v-for="article in group.articles"
            :key="article._id"
            class="relative rounded-xl shadow-sm border p-4 flex items-center gap-4"
            :class="{
              'opacity-60': article.checked,
              'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-600 pt-8': article.rabattfähig,
              'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700': !article.rabattfähig,
            }"
          >
            <!-- Rabatt badge -->
            <span
              v-if="article.rabattfähig"
              class="absolute top-1.5 right-2 text-xs font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-200 dark:bg-yellow-800/60 rounded-full px-2 py-0.5 leading-tight"
            >
              🏷 Rabatt Pickerl kann verwendet werden
            </span>
            <!-- No-price warning for rabattfähig articles -->
            <span
              v-if="article.rabattfähig && article.price == null"
              class="absolute top-1.5 left-2 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/50 rounded-full px-2 py-0.5 leading-tight"
            >
              ⚠ Kein Preis – Sortierung ungenau
            </span>
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
              <span v-if="article.quantity > 1">{{ article.quantity }}x </span>
              <span v-if="article.packageSize">{{ article.packageSize }}{{ article.packageUnit ? ' ' + article.packageUnit : '' }}</span>
              <span v-else-if="article.packageUnit">{{ article.packageUnit }}</span>
              <span v-else-if="article.unit">{{ article.quantity }} {{ article.unit }}</span>
              <span v-else-if="article.quantity <= 1">{{ article.quantity }}</span>
            </p>
            <span v-if="article.tag" class="inline-block text-[10px] font-medium bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 mt-0.5">{{ article.tag }}</span>
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
            <!-- Discount applied indicator -->
            <p v-if="article.rabattAngewendet" class="text-xs text-green-600 dark:text-green-400 mt-0.5">
              🏷 −{{ article.rabattAngewendet.prozent }}% Rabatt (war {{ formatPrice(article.rabattAngewendet.originalPreis) }})
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
            <!-- Check events -->
            <div
              v-if="articleStore.checkEvents[article._id]?.length"
              class="mt-1 space-y-0.5"
            >
              <p
                v-for="event in articleStore.checkEvents[article._id]"
                :key="event._id"
                class="text-xs text-gray-400 dark:text-gray-500"
              >
                ✓ {{ displayName(event.checkedBy) }}, {{ formatCheckTime(event.checkedAt) }}
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
        </template>
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
                <span v-if="article.quantity > 1">{{ article.quantity }}x </span>
                <span v-if="article.packageSize">{{ article.packageSize }}{{ article.packageUnit ? ' ' + article.packageUnit : '' }}</span>
                <span v-else-if="article.packageUnit">{{ article.packageUnit }}</span>
                <span v-else-if="article.unit">{{ article.quantity }} {{ article.unit }}</span>
                <span v-else-if="article.quantity <= 1">{{ article.quantity }}</span>
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
                @click="articleStore.deleteArticle(listId, article._id, article._rev, article.name)"
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
            <div class="w-20">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anzahl</label>
              <input
                v-model.number="newQuantity"
                type="number"
                min="1"
                step="1"
                placeholder="1"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Packungsgröße</label>
              <input
                v-model.number="newPackageSize"
                type="number"
                min="0"
                step="any"
                placeholder="z.B. 250"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="w-20">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einheit</label>
              <input
                v-model="newPackageUnit"
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Abteilung</label>
            <select
              v-model="newTag"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Keine Abteilung</option>
              <option v-for="t in tagNames" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="newRabattfähig"
              type="checkbox"
              id="new-rabattfähig"
              class="w-4 h-4 accent-yellow-500 cursor-pointer"
            />
            <label for="new-rabattfähig" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Rabattfähig</label>
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

    <!-- Receipt scanner -->
    <ReceiptScanner
      v-if="showReceiptScanner"
      :articles="articleStore.articles"
      @matched="onReceiptMatched"
      @close="showReceiptScanner = false"
    />

    <!-- Pickerl modal -->
    <div
      v-if="showPickerlModal"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      @click.self="showPickerlModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 px-6 pt-6 pb-8">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">🏷 Rabatt Pickerl</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Gib den Rabatt in Prozent ein, um den Restbetrag für alle rabattfähigen Artikel zu berechnen.</p>

        <div class="flex gap-3 items-center mb-6">
          <input
            v-model.number="pickerlProzent"
            type="number"
            min="1"
            max="100"
            step="1"
            placeholder="z.B. 20"
            class="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
          />
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">%</span>
        </div>

        <!-- Results -->
        <div v-if="pickerlArtikel.length > 0 || Object.keys(pickerlAppliedSnapshots).length > 0" class="space-y-2 mb-5">
          <!-- Pending articles -->
          <div
            v-for="a in pickerlArtikel"
            :key="a._id"
            class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ a.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ a.quantity > 1 ? a.quantity + 'x ' : '' }}{{ a.packageSize ? a.packageSize + ' ' : '' }}{{ a.packageUnit || a.unit || '' }} · ursprünglich {{ formatPrice(a.originalTotal) }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="text-right">
                <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ formatPrice(a.discountedTotal) }}</p>
                <p class="text-xs text-gray-400 line-through">{{ formatPrice(a.originalTotal) }}</p>
              </div>
              <button
                @click="applyPickerl(a)"
                class="text-xs font-medium bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg px-2 py-1 transition-colors flex-shrink-0"
              >
                Anwenden
              </button>
            </div>
          </div>
          <!-- Applied articles (frozen snapshot) -->
          <div
            v-for="(snap, id) in pickerlAppliedSnapshots"
            :key="id"
            class="flex items-center justify-between gap-2 rounded-lg px-3 py-2 border bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700 opacity-60"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ snap.name }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ snap.quantity > 1 ? snap.quantity + 'x ' : '' }}{{ snap.packageSize ? snap.packageSize + ' ' : '' }}{{ snap.packageUnit || '' }} · ursprünglich {{ formatPrice(snap.originalTotal) }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="text-right">
                <p class="text-sm font-bold text-green-700 dark:text-green-400">{{ formatPrice(snap.discountedTotal) }}</p>
                <p class="text-xs text-gray-400 line-through">{{ formatPrice(snap.originalTotal) }}</p>
              </div>
              <span class="text-green-600 dark:text-green-400 text-sm flex-shrink-0">✓</span>
            </div>
          </div>

        </div>

        <div
          v-else-if="pickerlProzent > 0 && Object.keys(pickerlAppliedSnapshots).length === 0"
          class="text-sm text-gray-500 dark:text-gray-400 text-center mb-5 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
        >
          Keine rabattfähigen Artikel mit Preis vorhanden.
        </div>

        <button
          @click="showPickerlModal = false"
          class="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Schliessen
        </button>
      </div>
    </div>
    <!-- Share modal -->
    <div
      v-if="showShareModal"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      @click.self="showShareModal = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 px-6 pt-6 pb-8 text-center">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Liste teilen</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Teile diesen Code oder scanne den QR-Code, damit andere Benutzer der Liste beitreten können.</p>
        <div class="bg-gray-100 dark:bg-gray-700 rounded-xl py-4 px-6 mb-4">
          <span class="text-3xl font-mono font-bold tracking-widest text-gray-800 dark:text-gray-100">
            {{ list?.shareCode ?? '------' }}
          </span>
        </div>
        <div class="flex justify-center mb-6">
          <div class="bg-white p-2 rounded-xl">
            <canvas ref="shareQrCanvas" data-cy="share-qr"></canvas>
          </div>
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
            <div class="w-20">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Anzahl</label>
              <input
                v-model.number="editQuantity"
                type="number"
                min="1"
                step="1"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Packungsgröße</label>
              <input
                v-model.number="editPackageSize"
                type="number"
                min="0"
                step="any"
                placeholder="z.B. 250"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="w-20">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einheit</label>
              <input
                v-model="editPackageUnit"
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
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Abteilung</label>
            <select
              v-model="editTag"
              class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Keine Abteilung</option>
              <option v-for="t in tagNames" :key="t" :value="t">{{ t }}</option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <input
              v-model="editRabattfähig"
              type="checkbox"
              id="edit-rabattfähig"
              class="w-4 h-4 accent-yellow-500 cursor-pointer"
            />
            <label for="edit-rabattfähig" class="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">Rabattfähig</label>
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
    <!-- Tag manager modal -->
    <div
      v-if="showTagManager"
      class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
      @click.self="showTagManager = false"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 px-6 pt-6 pb-8 max-h-[80vh] flex flex-col">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Abteilungen verwalten</h2>

        <div class="flex gap-2 mb-4">
          <input
            v-model="newTagName"
            type="text"
            placeholder="Neue Abteilung..."
            class="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keydown.enter="addTag"
          />
          <button
            @click="addTag"
            class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >+</button>
        </div>

        <div class="overflow-y-auto flex-1 space-y-2">
          <div
            v-for="tag in tagStore.tags"
            :key="tag._id"
            class="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
          >
            <template v-if="editingTag && editingTag._id === tag._id">
              <input
                v-model="editingTagName"
                type="text"
                class="flex-1 border border-blue-400 dark:border-blue-500 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                @keydown.enter="saveEditTag"
                @keydown.escape="editingTag = null"
              />
              <button
                @click="saveEditTag"
                class="text-green-600 hover:text-green-700 text-sm font-medium px-2"
              >OK</button>
              <button
                @click="editingTag = null"
                class="text-gray-400 hover:text-gray-600 text-sm px-1"
              >Abbrechen</button>
            </template>
            <template v-else>
              <span class="flex-1 text-sm text-gray-800 dark:text-gray-200">{{ tag.name }}</span>
              <button
                @click="startEditTag(tag)"
                class="text-gray-400 hover:text-blue-500 transition-colors text-sm p-1"
                title="Umbenennen"
              >✎</button>
              <button
                @click="removeTag(tag)"
                class="text-gray-400 hover:text-red-500 transition-colors text-sm p-1"
                title="Löschen"
              >✕</button>
            </template>
          </div>
          <p v-if="tagStore.tags.length === 0" class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            Keine Abteilungen vorhanden.
          </p>
        </div>

        <button
          @click="showTagManager = false"
          class="w-full mt-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Schliessen
        </button>
      </div>
    </div>
  </div>
</template>
