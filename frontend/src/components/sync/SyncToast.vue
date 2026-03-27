<template>
  <Transition name="toast">
    <div v-if="show" class="fixed bottom-6 right-6 z-[100] max-w-sm w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-4 pr-5 flex gap-3 pointer-events-auto">
      
      <!-- Status Icon -->
      <div class="flex-shrink-0 mt-0.5">
        <svg v-if="currentLog?.status === 'success'" class="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else-if="currentLog?.status === 'error'" class="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <svg v-else class="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
           <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
           <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Content -->
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100">
          {{ headline }}
        </h4>
        
        <p v-if="currentLog?.status === 'success'" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Dauer: {{ calculateDuration(currentLog.startTime, currentLog.endTime) }} &bull; Aktualisiert: {{ (currentLog.pullMetrics?.docs_read || 0) + (currentLog.pushMetrics?.docs_written || 0) }} Einträge
        </p>
        
        <p v-else-if="currentLog?.status === 'error'" class="text-xs text-red-500 mt-1 line-clamp-2">
          {{ currentLog.error }}
        </p>
        
        <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Bitte warten, Daten werden ausgetauscht...
        </p>
      </div>
      
      <!-- Close button -->
      <button @click="close" class="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
      
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useManualSyncStore } from '../../stores/manualSyncStore'

const syncStore = useManualSyncStore()
const show = ref(false)
let hideTimeout = null

// We observe the start of a sync and the latest historical syncs to trigger the toast
const currentLog = computed(() => {
    if (syncStore.isSyncing && syncStore.currentSyncDetails) {
        return syncStore.currentSyncDetails
    }
    return syncStore.syncLogs[0] || null
})

const headline = computed(() => {
    if (currentLog.value?.status === 'success') return 'Synchronisation erfolgreich'
    if (currentLog.value?.status === 'error') return 'Sync fehlgeschlagen'
    return 'Synchronisiere...'
})

watch(() => currentLog.value, (newLog) => {
    if (newLog) {
        show.value = true;
        if (hideTimeout) clearTimeout(hideTimeout)
        
        // Auto-hide after 5 seconds if it reached a final state (success/error)
        if (newLog.status !== 'running') {
            hideTimeout = setTimeout(() => {
                show.value = false
            }, 6000)
        }
    }
}, { deep: true })

const close = () => {
    show.value = false
    if (hideTimeout) clearTimeout(hideTimeout)
}

const calculateDuration = (start, end) => {
    if (!start || !end) return '-'
    const ms = new Date(end) - new Date(start)
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
}
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}
</style>
