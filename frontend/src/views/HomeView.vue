<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingListStore } from '../stores/shoppingList.js'
import { useThemeStore } from '../stores/theme.js'

const router = useRouter()

const store = useShoppingListStore()
const themeStore = useThemeStore()

const showModal = ref(false)
const name = ref('')
const category = ref('')
const submitting = ref(false)

const showJoinModal = ref(false)
const joinCode = ref('')
const joinError = ref('')
const joining = ref(false)

const showDeleteModal = ref(false)
const listToDelete = ref(null)

onMounted(() => {
  store.loadLists()
  store.startLiveSync()
})

onUnmounted(() => {
  store.stopLiveSync()
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

function confirmDelete(list) {
  listToDelete.value = list
  showDeleteModal.value = true
}

function cancelDelete() {
  listToDelete.value = null
  showDeleteModal.value = false
}

async function executeDelete() {
  if (!listToDelete.value) return
  await store.deleteList(listToDelete.value._id, listToDelete.value._rev)
  cancelDelete()
}

function openJoinModal() {
  joinCode.value = ''
  joinError.value = ''
  showJoinModal.value = true
}

function closeJoinModal() {
  showJoinModal.value = false
}

async function submitJoin() {
  if (!joinCode.value.trim()) return
  joining.value = true
  joinError.value = ''
  const list = await store.joinList(joinCode.value.trim())
  joining.value = false
  if (list) {
    closeJoinModal()
    router.push(`/list/${list._id}`)
  } else {
    joinError.value = 'Keine Liste mit diesem Code gefunden.'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Einkaufslisten</h1>
        <div class="flex gap-2">
          <button
              @click="themeStore.toggle()"
              class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2 rounded-lg transition-colors"
              :title="themeStore.isDark ? 'Light Mode' : 'Dark Mode'"
          >
            {{ themeStore.isDark ? '☀️' : '🌙' }}
          </button>
          <button
              @click="openJoinModal"
              class="border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Liste beitreten
          </button>
          <button
              @click="openModal"
              class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            + Neue Liste erstellen
          </button>
        </div>
      </div>
    </header>

    <!-- List -->
    <main class="max-w-3xl mx-auto px-4 py-6">
      <div v-if="store.lists.length === 0" class="text-center text-gray-400 dark:text-gray-500 mt-16">
        <p class="text-lg">Noch keine Listen vorhanden.</p>
        <p class="text-sm mt-1">Erstelle deine erste Einkaufsliste!</p>
      </div>

      <div class="grid gap-4">
        <div
            v-for="list in store.lists"
            :key="list._id"
            class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 flex items-start justify-between"
        >
          <div class="flex-1 cursor-pointer" @click="router.push(`/list/${list._id}`)">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ list.name }}</h2>
            <span
                v-if="list.category"
                class="inline-block mt-1 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full px-2 py-0.5"
            >
              {{ list.category }}
            </span>
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">
              {{ new Date(list.createdAt).toLocaleString('de-AT') }}
            </p>
          </div>
          <button
              @click="confirmDelete(list)"
              class="text-gray-400 hover:text-red-500 transition-colors ml-4 mt-1"
              title="Liste löschen"
          >
            ✕
          </button>
        </div>
      </div>
    </main>

    <!-- Create Modal -->
    <div
        v-if="showModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="closeModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Neue Liste erstellen</h2>
        <form @submit.prevent="submitForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
            <input
                v-model="name"
                type="text"
                required
                placeholder="z.B. Wocheneinkauf"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kategorie</label>
            <input
                v-model="category"
                type="text"
                placeholder="z.B. Lebensmittel"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex gap-3 pt-2">
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
              {{ submitting ? 'Erstelle...' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Join Modal -->
    <div
        v-if="showJoinModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="closeJoinModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Liste beitreten</h2>
        <form @submit.prevent="submitJoin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einladungscode</label>
            <input
                v-model="joinCode"
                type="text"
                required
                maxlength="6"
                placeholder="z.B. A3X9K2"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
            />
          </div>
          <p v-if="joinError" class="text-sm text-red-500">{{ joinError }}</p>
          <div class="flex gap-3 pt-2">
            <button
                type="button"
                @click="closeJoinModal"
                class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                :disabled="joining"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
            >
              {{ joining ? 'Beitreten...' : 'Beitreten' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="cancelDelete"
    >
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div class="flex items-center gap-3 mb-3">
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Liste löschen?</h2>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Bist du sicher, dass du die Liste
          <span class="font-semibold text-gray-800 dark:text-gray-100">„{{ listToDelete?.name }}"</span>
          löschen möchtest?
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">Diese Aktion kann eventuell nicht rückgängig gemacht werden.</p>
        <div class="flex gap-3">
          <button
              @click="cancelDelete"
              class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Abbrechen
          </button>
          <button
              @click="executeDelete"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            Löschen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>