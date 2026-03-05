<script setup>
import { ref, onMounted } from 'vue'
import { useShoppingListStore } from '../stores/shoppingList.js'

const store = useShoppingListStore()

const showModal = ref(false)
const name = ref('')
const category = ref('')
const submitting = ref(false)

onMounted(() => {
  store.loadLists()
})

function openModal() {
  name.value = ''
  category.value = ''
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}

async function submitForm() {
  if (!name.value.trim()) return
  submitting.value = true
  await store.createList(name.value.trim(), category.value.trim())
  submitting.value = false
  closeModal()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800">Einkaufslisten</h1>
        <button
          @click="openModal"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Neue Liste erstellen
        </button>
      </div>
    </header>

    <!-- List -->
    <main class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="store.lists.length === 0" class="text-center text-gray-400 mt-16">
        <p class="text-lg">Noch keine Listen vorhanden.</p>
        <p class="text-sm mt-1">Erstelle deine erste Einkaufsliste!</p>
      </div>

      <div class="grid gap-4">
        <div
          v-for="list in store.lists"
          :key="list._id"
          class="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-start justify-between"
        >
          <div>
            <h2 class="text-lg font-semibold text-gray-800">{{ list.name }}</h2>
            <span
              v-if="list.category"
              class="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full px-2 py-0.5"
            >
              {{ list.category }}
            </span>
            <p class="text-xs text-gray-400 mt-2">
              {{ new Date(list.createdAt).toLocaleString('de-AT') }}
            </p>
          </div>
          <button
            @click="store.deleteList(list._id, list._rev)"
            class="text-gray-400 hover:text-red-500 transition-colors ml-4 mt-1"
            title="Liste löschen"
          >
            ✕
          </button>
        </div>
      </div>
    </main>

    <!-- Modal -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-bold text-gray-800 mb-4">Neue Liste erstellen</h2>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="z.B. Wocheneinkauf"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
            <input
              v-model="category"
              type="text"
              placeholder="z.B. Lebensmittel"
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
              {{ submitting ? 'Erstelle...' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
