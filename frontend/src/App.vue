<script setup>
import { RouterView } from 'vue-router'
import { useOnlineStatusStore } from './stores/onlineStatus.js'
import { useThemeStore } from './stores/theme.js'

const onlineStatusStore = useOnlineStatusStore()
onlineStatusStore.init()

const themeStore = useThemeStore()
</script>

<template>
  <div
    v-if="!onlineStatusStore.isOnline"
    class="bg-yellow-400 text-yellow-900 dark:bg-yellow-600 dark:text-yellow-100 text-sm font-medium text-center py-2 px-4"
    data-cy="offline-banner"
  >
    Offline – Änderungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.
  </div>
  <RouterView />
</template>
