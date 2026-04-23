<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingListStore } from '../stores/shoppingList.js'
import { useThemeStore } from '../stores/theme.js'
import { useNotificationSettingsStore } from '../stores/notificationSettings.js'
import { getUsername, renameUser } from '../db/index.js'
import QrScanner from './QrScanner.vue'

const router = useRouter()

const store = useShoppingListStore()
const themeStore = useThemeStore()
const notifSettings = useNotificationSettingsStore()

const showModal = ref(false)
const name = ref('')
const category = ref('')
const submitting = ref(false)

const showJoinModal = ref(false)
const joinCode = ref('')
const joinError = ref('')
const joining = ref(false)
const showQrScanner = ref(false)

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

function onQrScanned(code) {
  showQrScanner.value = false
  joinCode.value = code
  submitJoin()
}

// Rename username
const currentUsername = ref(getUsername())
const currentDisplayName = computed(() => currentUsername.value?.split('#')[0] ?? '')

const showRenameModal = ref(false)
const renameInput = ref('')
const renameError = ref('')
const renaming = ref(false)

function openRenameModal() {
  renameInput.value = currentDisplayName.value
  renameError.value = ''
  showRenameModal.value = true
}

function closeRenameModal() {
  showRenameModal.value = false
}

async function submitRename() {
  const name = renameInput.value.trim()
  if (!name) return
  if (name.includes('#')) {
    renameError.value = 'Der Name darf kein # enthalten.'
    return
  }
  renaming.value = true
  renameError.value = ''
  const newUsername = await renameUser(name)
  currentUsername.value = newUsername
  renaming.value = false
  closeRenameModal()
  store.loadLists()
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <header class="bg-white dark:bg-gray-800 shadow-sm safe-top">
      <div class="max-w-3xl mx-auto px-4 pt-4 pb-5 space-y-3">
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold text-gray-800 dark:text-gray-100">Einkaufslisten</h1>
          <div class="flex items-center gap-2">
            <button
                @click="openRenameModal"
                class="flex items-center gap-1.5 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-2.5 rounded-lg transition-colors text-sm"
                title="Benutzername ändern"
                data-cy="rename-username-btn"
            >
              <span class="font-medium">{{ currentDisplayName }}</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828A2 2 0 0110 16.414H8v-2a2 2 0 01.586-1.414z" />
              </svg>
            </button>
            <button
                @click="notifSettings.toggleSound()"
                class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-lg transition-colors"
                :class="{ 'opacity-40': !notifSettings.soundEnabled }"
                :title="notifSettings.soundEnabled ? 'Ton aus' : 'Ton ein'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path v-if="notifSettings.soundEnabled" stroke-linecap="round" stroke-linejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
              </svg>
            </button>
            <button
                @click="notifSettings.toggleVibration()"
                class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-lg transition-colors"
                :class="{ 'opacity-40': !notifSettings.vibrationEnabled }"
                :title="notifSettings.vibrationEnabled ? 'Vibration aus' : 'Vibration ein'"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 4h8a1 1 0 011 1v14a1 1 0 01-1 1H8a1 1 0 01-1-1V5a1 1 0 011-1zM4 8v8M20 8v8M1 10v4M23 10v4" />
              </svg>
            </button>
            <button
                @click="themeStore.toggle()"
                class="border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 font-medium px-3 py-2.5 rounded-lg transition-colors"
                :title="themeStore.isDark ? 'Light Mode' : 'Dark Mode'"
            >
              {{ themeStore.isDark ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
        <div class="flex gap-2">
          <button
              @click="openJoinModal"
              class="flex-1 border border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-medium py-2.5 rounded-lg transition-colors"
          >
            Liste beitreten
          </button>
          <button
              @click="openModal"
              class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            + Neue Liste
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
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
        @click.self="closeModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md sm:mx-4 px-6 pt-6 pb-8">
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
              {{ submitting ? 'Erstelle...' : 'Erstellen' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Join Modal -->
    <div
        v-if="showJoinModal"
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
        @click.self="closeJoinModal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 px-6 pt-6 pb-8">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Liste beitreten</h2>
        <form @submit.prevent="submitJoin" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Einladungscode</label>
            <div class="flex gap-2">
              <input
                  v-model="joinCode"
                  type="text"
                  required
                  maxlength="6"
                  placeholder="z.B. A3X9K2"
                  class="flex-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm text-center tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg"
              />
              <button
                  type="button"
                  @click="showQrScanner = true"
                  class="shrink-0 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg px-3 transition-colors"
                  title="QR-Code scannen"
                  data-cy="qr-scan-btn"
              >
                📷
              </button>
            </div>
          </div>
          <p v-if="joinError" class="text-sm text-red-500">{{ joinError }}</p>
          <div class="flex gap-3 pt-4">
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

    <!-- Rename Username Modal -->
    <div
        v-if="showRenameModal"
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
        @click.self="closeRenameModal"
        data-cy="rename-modal"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 px-6 pt-6 pb-8">
        <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Benutzername ändern</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Dein Name wird in allen geteilten Listen aktualisiert.</p>
        <form @submit.prevent="submitRename" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Neuer Benutzername *</label>
            <input
                v-model="renameInput"
                type="text"
                required
                placeholder="z.B. Max"
                class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-cy="rename-input"
            />
          </div>
          <p v-if="renameError" class="text-sm text-red-500">{{ renameError }}</p>
          <div class="flex gap-3 pt-2">
            <button
                type="button"
                @click="closeRenameModal"
                class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Abbrechen
            </button>
            <button
                type="submit"
                :disabled="renaming"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg py-2 text-sm font-medium transition-colors"
                data-cy="rename-submit"
            >
              {{ renaming ? 'Speichern...' : 'Speichern' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50"
        @click.self="cancelDelete"
    >
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm sm:mx-4 px-6 pt-6 pb-8">
        <div class="flex items-center gap-3 mb-3">
          <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Liste löschen?</h2>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Bist du sicher, dass du die Liste
          <span class="font-semibold text-gray-800 dark:text-gray-100">„{{ listToDelete?.name }}"</span>
          löschen möchtest?
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 mb-6">Diese Aktion kann eventuell nicht rückgängig gemacht werden.</p>
        <div class="flex gap-3 pt-2">
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

    <QrScanner
      v-if="showQrScanner"
      @scanned="onQrScanned"
      @close="showQrScanner = false"
    />
  </div>
</template>