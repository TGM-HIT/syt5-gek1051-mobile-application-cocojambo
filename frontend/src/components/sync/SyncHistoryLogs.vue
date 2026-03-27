<template>
  <div class="sync-history-panel">
    <div class="panel-header" @click="toggleOpen">
      <h3>Sync Verlauf ({{ syncStore.syncLogs.length }})</h3>
      <span class="chevron" :class="{ open: isOpen }">▼</span>
    </div>
    
    <div v-if="isOpen" class="panel-content">
      <div v-if="syncStore.syncLogs.length === 0" class="empty-state">
        Keine manuellen Synchronisationen in dieser Sitzung durchgeführt.
      </div>
      
      <table v-else class="history-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Startzeit</th>
            <th>Dauer</th>
            <th>Gelesen</th>
            <th>Geschrieben</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in syncStore.syncLogs" :key="log.id" :class="log.status">
            <td>
              <span class="status-badge" :class="log.status">
                {{ log.status === 'success' ? 'Erfolg' : (log.status === 'running' ? 'Läuft...' : 'Fehler') }}
              </span>
            </td>
            <td>{{ formatTime(log.startTime) }}</td>
            <td>{{ calculateDuration(log.startTime, log.endTime) }}</td>
            <td>{{ log.pullMetrics?.docs_read || log.docsRead || 0 }}</td>
            <td>{{ log.pushMetrics?.docs_written || log.docsWritten || 0 }}</td>
            <td class="error-cell" :title="log.error">{{ log.error || '-' }}</td>
          </tr>
        </tbody>
      </table>
      
      <div class="panel-actions" v-if="syncStore.syncLogs.length > 0">
        <button @click="syncStore.clearLogs" class="clear-btn">Verlauf löschen</button>
      </div>
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
.sync-history-panel {
  margin: 20px 0;
  border: 1px solid #e1e8ed;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 4px 15px rgba(0,0,0,0.06);
  font-family: system-ui, -apple-system, sans-serif;
  overflow: hidden;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #fdfbfb;
  cursor: pointer;
  border-bottom: 1px solid transparent;
  transition: background 0.2s, background-color 0.3s ease;
}

.panel-header:hover {
  background: #f1f3f5;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.15rem;
  color: #2b2b2b;
  font-weight: 700;
}

.chevron {
  font-size: 0.9rem;
  color: #636e72;
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.chevron.open {
  transform: rotate(180deg);
}

.panel-content {
  padding: 24px;
  border-top: 1px solid #edf2f7;
  animation: slideDown 0.3s ease-out forwards;
  background: #ffffff;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.empty-state {
  text-align: center;
  color: #a0aec0;
  font-size: 0.95rem;
  padding: 30px 0;
  border: 1px dashed #e2e8f0;
  border-radius: 6px;
}

.history-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-bottom: 20px;
}

.history-table th, .history-table td {
  padding: 14px 16px;
  text-align: left;
  border-bottom: 1px solid #edf2f7;
}

.history-table th {
  background: #f7fafc;
  color: #4a5568;
  font-weight: 700;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-top: 1px solid #edf2f7;
}

.history-table th:first-child { border-top-left-radius: 6px; border-left: 1px solid #edf2f7; }
.history-table th:last-child { border-top-right-radius: 6px; border-right: 1px solid #edf2f7; }
.history-table td:first-child { border-left: 1px solid #edf2f7; }
.history-table td:last-child { border-right: 1px solid #edf2f7; }

.history-table tr:hover td {
  background: #fcfcfc;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.status-badge.success { background: #c6f6d5; color: #276749; }
.status-badge.error { background: #fed7d7; color: #9b2c2c; }
.status-badge.running { background: #feebc8; color: #c05621; }

.error-cell {
  color: #e53e3e;
  font-size: 0.85rem;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.panel-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed #e2e8f0;
}

.clear-btn {
  background: transparent;
  color: #e53e3e;
  border: 1px solid #fc8181;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
}

.clear-btn:hover {
  background: #e53e3e;
  color: #ffffff;
  box-shadow: 0 4px 10px rgba(229, 62, 62, 0.3);
}
</style>
