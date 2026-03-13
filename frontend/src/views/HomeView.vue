<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShoppingListStore } from '../stores/shoppingList.js'

const router = useRouter()

const store = useShoppingListStore()

const showModal = ref(false)
const name = ref('')
const category = ref('')
const submitting = ref(false)

const showDeleteModal = ref(false)
const listToDelete = ref(null)

// Sub-issue #59: Verlassen-Modal
const showLeaveModal = ref(false)
const listToLeave = ref(null)

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

// Sub-issue #59: "Liste verlassen" – Bestätigungsabfrage öffnen
function confirmLeave(list) {
  listToLeave.value = list
  showLeaveModal.value = true
}

function cancelLeave() {
  listToLeave.value = null
  showLeaveModal.value = false
}

// Sub-issue #59 + #60: Nach Bestätigung → leaveList Action aufrufen
async function executeLeave() {
  if (!listToLeave.value) return
  await store.leaveList(listToLeave.value._id)
  cancelLeave()
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
          <div class="flex-1 cursor-pointer" @click="router.push(`/list/${list._id}`)">
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

          <!-- Aktionsbuttons -->
          <div class="flex items-center gap-2 ml-4 mt-1">
            <!-- Sub-issue #59: "Liste verlassen"-Button -->
            <button
                @click="confirmLeave(list)"
                class="text-gray-400 hover:text-orange-500 transition-colors text-sm font-medium"
                title="Liste verlassen"
                data-cy="leave-list-button"
            >
              Verlassen
            </button>

            <!-- Bestehender Löschen-Button -->
            <button
                @click="confirmDelete(list)"
                class="text-gray-400 hover:text-red-500 transition-colors"
                title="Liste löschen"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Create Modal -->
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

    <!-- Delete Confirmation Modal -->
    <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="cancelDelete"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <div class="flex items-center gap-3 mb-3">
          <h2 class="text-lg font-bold text-gray-800">Liste löschen?</h2>
        </div>
        <p class="text-sm text-gray-600 mb-1">
          Bist du sicher, dass du die Liste
          <span class="font-semibold text-gray-800">„{{ listToDelete?.name }}"</span>
          löschen möchtest?
        </p>
        <p class="text-xs text-gray-400 mb-6">Diese Aktion kann eventuell nicht rückgängig gemacht werden.</p>
        <div class="flex gap-3">
          <button
              @click="cancelDelete"
              class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
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

    <!-- Sub-issue #59: Verlassen-Bestätigungsmodal -->
    <div
        v-if="showLeaveModal"
        class="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        @click.self="cancelLeave"
        data-cy="leave-confirm-modal"
    >
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-3">Liste verlassen?</h2>
        <p class="text-sm text-gray-600 mb-1">
          Möchtest du die Liste
          <span class="font-semibold text-gray-800">„{{ listToLeave?.name }}"</span>
          wirklich verlassen?
        </p>
        <p class="text-xs text-gray-400 mb-6">
          Die Liste verschwindet aus deiner Übersicht. Wenn du die letzte Person bist, wird die Liste gelöscht.
        </p>
        <div class="flex gap-3">
          <button
              @click="cancelLeave"
              class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Abbrechen
          </button>
          <button
              @click="executeLeave"
              class="flex-1 bg-orange-500 hover:bg-orange-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
              data-cy="leave-confirm-button"
          >
            Verlassen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>