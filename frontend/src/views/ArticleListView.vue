<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useArticleStore } from '../stores/article.js'
import { useShoppingListStore } from '../stores/shoppingList.js'

const route = useRoute()
const router = useRouter()
const articleStore = useArticleStore()
const listStore = useShoppingListStore()

const listId = route.params.id
const list = ref(null)

const showModal = ref(false)
const showEditModal = ref(false)
const showHidden = ref(false)
const submitting = ref(false)

const newName = ref('')
const newQuantity = ref(1)
const newUnit = ref('')
const newNote = ref('')

const editingArticle = ref(null)
const editName = ref('')
const editQuantity = ref(1)
const editUnit = ref('')
const editNote = ref('')

onMounted(async () => {
  await listStore.loadLists()
  list.value = listStore.lists.find((l) => l._id === listId) || null
  await articleStore.loadArticles(listId)
})

function openModal() {
  newName.value = ''
  newQuantity.value = 1
  newUnit.value = ''
  newNote.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitCreate() {
  if (!newName.value.trim()) return
  submitting.value = true
  await articleStore.createArticle(listId, newName.value.trim(), newQuantity.value, newUnit.value.trim(), newNote.value.trim())
  submitting.value = false
  closeModal()
}

function openEditModal(article) {
  editingArticle.value = article
  editName.value = article.name
  editQuantity.value = article.quantity
  editUnit.value = article.unit || ''
  editNote.value = article.note || ''
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingArticle.value = null
}

async function submitEdit() {
  if (!editName.value.trim() || !editingArticle.value) return
  submitting.value = true
  await articleStore.updateArticle(listId, {
    ...editingArticle.value,
    name: editName.value.trim(),
    quantity: editQuantity.value,
    unit: editUnit.value.trim(),
    note: editNote.value.trim(),
  })
  submitting.value = false
  closeEditModal()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <button
          @click="router.push('/')"
          class="text-gray-500 hover:text-gray-800 transition-colors text-lg font-medium"
          title="Zurück"
        >
          ←
        </button>
        <div class="flex-1">
          <h1 class="text-2xl font-bold text-gray-800">{{ list?.name ?? 'Liste' }}</h1>
          <span
            v-if="list?.category"
            class="inline-block text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5"
          >
            {{ list.category }}
          </span>
        </div>
        <button
          @click="openModal"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Artikel
        </button>
      </div>
    </header>

    <!-- Article list -->
    <main class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="articleStore.articles.length === 0" class="text-center text-gray-400 mt-16">
        <p class="text-lg">Noch keine Artikel vorhanden.</p>
        <p class="text-sm mt-1">Füge deinen ersten Artikel hinzu!</p>
      </div>

      <div class="grid gap-3">
        <div
          v-for="article in articleStore.articles"
          :key="article._id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
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
              class="text-base font-medium text-gray-800 truncate"
              :class="{ 'line-through text-gray-400': article.checked }"
            >
              {{ article.name }}
            </p>
            <p class="text-xs text-gray-400">
              {{ article.quantity }}
              <span v-if="article.unit">{{ article.unit }}</span>
            </p>
            <p v-if="article.note" class="text-xs text-gray-500 mt-0.5 italic">{{ article.note }}</p>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button
              @click="openEditModal(article)"
              class="text-gray-400 hover:text-blue-500 transition-colors"
              title="Bearbeiten"
            >
              ✎
            </button>
            <button
              @click="articleStore.hideArticle(listId, article)"
              class="text-gray-400 hover:text-orange-500 transition-colors"
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
          class="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
        >
          <span>{{ showHidden ? '▾' : '▸' }}</span>
          Ausgeblendete Artikel ({{ articleStore.hiddenArticles.length }})
        </button>

        <div v-if="showHidden" class="grid gap-3 mt-3">
          <div
            v-for="article in articleStore.hiddenArticles"
            :key="article._id"
            class="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-4 flex items-center gap-4 opacity-60"
          >
            <div class="flex-1 min-w-0">
              <p class="text-base font-medium text-gray-500 truncate line-through">
                {{ article.name }}
              </p>
              <p class="text-xs text-gray-400">
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

    <!-- Create modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Neuer Artikel</h2>
        <form @submit.prevent="submitCreate" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              v-model="newName"
              type="text"
              required
              placeholder="z.B. Milch"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Menge</label>
              <input
                v-model.number="newQuantity"
                type="number"
                min="0"
                step="any"
                placeholder="1"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
              <input
                v-model="newUnit"
                type="text"
                placeholder="z.B. kg"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
            <input
              v-model="newNote"
              type="text"
              placeholder="z.B. Bio-Qualität"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
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

    <!-- Edit modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeEditModal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Artikel bearbeiten</h2>
        <form @submit.prevent="submitEdit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              v-model="editName"
              type="text"
              required
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Menge</label>
              <input
                v-model.number="editQuantity"
                type="number"
                min="0"
                step="any"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Einheit</label>
              <input
                v-model="editUnit"
                type="text"
                placeholder="z.B. kg"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notiz</label>
            <input
              v-model="editNote"
              type="text"
              placeholder="z.B. Bio-Qualität"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeEditModal"
              class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
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
