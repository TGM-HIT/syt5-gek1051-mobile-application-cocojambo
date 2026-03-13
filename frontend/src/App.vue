<script setup>
import { RouterView } from 'vue-router'
import { useOnlineStatusStore } from './stores/onlineStatus.js'

const onlineStatusStore = useOnlineStatusStore()
onlineStatusStore.init()
</script>

<template>
  <div
    v-if="!onlineStatusStore.isOnline"
    class="bg-yellow-400 text-yellow-900 text-sm font-medium text-center py-2 px-4"
    data-cy="offline-banner"
  >
    Offline – Änderungen werden synchronisiert, sobald die Verbindung wiederhergestellt ist.
  </div>
  <RouterView />
</template>
