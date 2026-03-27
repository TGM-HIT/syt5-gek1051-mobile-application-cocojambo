<template>
  <button 
    @click="triggerSync" 
    :disabled="syncStore.isSyncing || !isOnline"
    class="relative flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors border border-transparent disabled:opacity-50 overflow-hidden"
    :title="!isOnline ? 'Offline' : 'Manueller Sync'"
  >
    <!-- Spinner -->
    <svg v-if="syncStore.isSyncing" class="w-5 h-5 animate-spin text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
    <!-- Refresh Icon -->
    <svg v-else class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
    
    <!-- Mini progress bar at bottom -->
    <div v-if="syncStore.isSyncing" class="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-300" :style="{ width: syncStore.syncProgress + '%' }"></div>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useManualSyncStore } from '../../stores/manualSyncStore'
import { ManualSyncService } from '../../services/ManualSyncService'
import { remoteUrl } from '../../db/index.js'

const syncStore = useManualSyncStore()
const isOnline = ref(navigator.onLine)

// Initialize Service using the project's generic remote config
const syncService = new ManualSyncService('shopping_lists', remoteUrl)

const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

onMounted(() => {
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  window.removeEventListener('online', updateOnlineStatus)
  window.removeEventListener('offline', updateOnlineStatus)
})

const triggerSync = async () => {
    if (!isOnline.value || syncStore.isSyncing) return;

    syncStore.startSync();

    await syncService.executeManualSync(
        (progressInfo) => {
            syncStore.updateProgress(progressInfo);
        },
        (resultData) => {
            syncStore.finishSync(resultData);
        },
        (errorData) => {
            syncStore.failSync(errorData);
        }
    );
}
</script>

<style scoped>
/* Removed massive custom styling, fully delegating to tailwind */
</style>
