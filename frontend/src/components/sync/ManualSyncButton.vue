<template>
  <div class="manual-sync-wrapper">
    <button 
      @click="triggerSync" 
      :disabled="syncStore.isSyncing || !isOnline"
      class="sync-btn"
      :class="{ 'syncing': syncStore.isSyncing, 'offline': !isOnline }"
      aria-label="Manuelle Synchronisation starten"
    >
      <span class="icon-wrapper">
        <svg v-if="syncStore.isSyncing" class="spinner" viewBox="0 0 50 50">
          <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
      </span>
      <span class="btn-text">
        {{ syncStore.isSyncing ? 'Synchronisiere...' : (isOnline ? 'Jetzt Synchronisieren' : 'Offline') }}
      </span>
    </button>
    
    <!-- Progress Bar Indicator directly beneath the button -->
    <div v-if="syncStore.isSyncing" class="progress-bar-container">
      <div class="progress-bar" :style="{ width: syncStore.syncProgress + '%' }"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useManualSyncStore } from '../../stores/manualSyncStore'
import { ManualSyncService } from '../../services/ManualSyncService'

const syncStore = useManualSyncStore()
const isOnline = ref(navigator.onLine)

// Initialize Service (pointing to default local Pouch and generic remote for Issue #22)
const syncService = new ManualSyncService('cocojambo-db', 'http://localhost:5984/cocojambo')

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
    // Basic guards
    if (!isOnline.value || syncStore.isSyncing) return;

    // Transition state
    syncStore.startSync();

    // Fire the heavy service logic
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
.manual-sync-wrapper {
  position: relative;
  display: inline-block;
  font-family: system-ui, -apple-system, sans-serif;
  margin: 10px 0;
}

.sync-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #0984e3, #6c5ce7);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 15px rgba(108, 92, 231, 0.3);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.sync-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 22px rgba(108, 92, 231, 0.5);
  background: linear-gradient(135deg, #74b9ff, #a29bfe);
}

.sync-btn:active {
  transform: translateY(1px);
  box-shadow: 0 2px 8px rgba(108, 92, 231, 0.4);
}

.sync-btn:disabled, .sync-btn.offline {
  background: #b2bec3;
  color: #636e72;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.spinner {
  animation: rotate 2s linear infinite;
  z-index: 2;
  width: 20px;
  height: 20px;
}

.spinner .path {
  stroke: #ffffff;
  stroke-linecap: round;
  animation: dash 1.5s ease-in-out infinite;
}

@keyframes rotate {
  100% { transform: rotate(360deg); }
}

@keyframes dash {
  0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
  50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
  100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
}

.progress-bar-container {
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 6px;
  background: #dfe6e9;
  border-radius: 3px;
  overflow: hidden;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.progress-bar {
  height: 100%;
  background: #00b894;
  transition: width 0.4s ease-out;
}
</style>
