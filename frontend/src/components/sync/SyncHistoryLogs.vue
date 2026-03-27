<template>
  <div class="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
    <button @click="toggleOpen" class="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors uppercase tracking-wider w-full text-left outline-none">
      <span>{{ isOpen ? '▼' : '▶' }}</span>
      Debug: Sync Verlauf ({{ syncStore.syncLogs.length }})
    </button>
    
    <div v-if="isOpen" class="mt-4 text-sm text-gray-700 dark:text-gray-300">
      <div v-if="syncStore.syncLogs.length === 0" class="italic text-gray-400">
        Bisher keine manuellen Synchronisationen.
      </div>
      
      <div v-else class="space-y-2">
         <div v-for="log in syncStore.syncLogs" :key="log.id" class="flex flex-col gap-1 bg-white dark:bg-gray-800 p-3 text-xs rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
           <div class="flex justify-between items-start">
             <div>
               <span :class="{'text-green-600': log.status==='success', 'text-red-600': log.status==='error', 'text-orange-600': log.status==='running'}" class="font-bold mr-2 uppercase">
                 {{ log.status }}
               </span>
               <span class="text-gray-500">{{ formatTime(log.startTime) }}</span>
             </div>
             <div class="text-gray-400 font-mono">{{ calculateDuration(log.startTime, log.endTime) }}</div>
           </div>
           
           <div class="mt-1 text-gray-500">
             Gelesen: <b>{{ log.pullMetrics?.docs_read || log.docsRead || 0 }}</b> | 
             Geschrieben: <b>{{ log.pushMetrics?.docs_written || log.docsWritten || 0 }}</b>
           </div>
           
           <div v-if="log.error" class="text-red-500 mt-1.5 break-words bg-red-50 dark:bg-red-900/10 p-1.5 rounded">
             {{ log.error }}
           </div>
         </div>
      </div>
      <button v-if="syncStore.syncLogs.length > 0" @click="syncStore.clearLogs" class="mt-4 text-xs font-medium text-red-500 hover:text-red-700 transition-colors">
        Verlauf leeren
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useManualSyncStore } from '../../stores/manualSyncStore'

const syncStore = useManualSyncStore()
const isOpen = ref(false)

const toggleOpen = () => {
    isOpen.value = !isOpen.value
}

const formatTime = (isoString) => {
    if (!isoString) return '-'
    const date = new Date(isoString)
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

const calculateDuration = (start, end) => {
    if (!start || !end) return '-'
    const ms = new Date(end) - new Date(start)
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
}
</script>

<style scoped>
/* Switched to Tailwind for minimal look */
</style>
