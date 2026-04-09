<script setup>
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import { useOnlineStatusStore } from './stores/onlineStatus.js'
import { useThemeStore } from './stores/theme.js'
import { useNotificationStore } from './stores/notification.js'
import { hasUsername, setUsername } from './db/index.js'
import { seedDatabase } from './db/seed.js'

const onlineStatusStore = useOnlineStatusStore()
onlineStatusStore.init()

const themeStore = useThemeStore()

const notificationStore = useNotificationStore()
notificationStore.init()

const usernameReady = ref(hasUsername())
const usernameInput = ref('')

async function submitUsername() {
  const name = usernameInput.value.trim()
  if (!name) return
  setUsername(name)
  await seedDatabase()
  usernameReady.value = true
}
</script>

<template>
  <!-- Username prompt -->
  <div
    v-if="!usernameReady"
    class="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex items-center justify-center z-50"
    data-cy="username-prompt"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">Willkommen!</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Bitte gib deinen Benutzernamen ein, um fortzufahren.</p>
      <form @submit.prevent="submitUsername" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Benutzername *</label>
          <input
            v-model="usernameInput"
            type="text"
            required
            placeholder="z.B. Max"
            class="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-cy="username-input"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          data-cy="username-submit"
        >
          Weiter
        </button>
      </form>
    </div>
  </div>

  <template v-else>
    <!-- Notification banners -->
    <TransitionGroup name="notification">
      <div
        v-for="n in notificationStore.notifications"
        :key="n.id"
        class="fixed top-0 left-0 right-0 z-[45] safe-top"
      >
        <div
          class="max-w-3xl mx-auto px-4 pt-3"
        >
          <div
            class="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3"
            @click="notificationStore.dismiss(n.id)"
          >
            <span class="text-green-500 text-lg flex-shrink-0">●</span>
            <span class="text-sm font-medium text-green-700 dark:text-green-300 flex-1">{{ n.message }}</span>
          </div>
        </div>
      </div>
    </TransitionGroup>

    <div
      v-if="!onlineStatusStore.isOnline"
      class="bg-yellow-400 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100 text-sm font-medium text-center py-2 px-4 safe-top"
      data-cy="offline-banner"
    >
      Offline – Änderungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.
    </div>
    <RouterView />
  </template>
</template>
