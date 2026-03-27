import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * State Management specifically for the Manual Sync workflow.
 * Holds active progress percentages and a historical audit trail.
 */
export const useManualSyncStore = defineStore('manualSync', () => {
    const isSyncing = ref(false);
    const syncProgress = ref(0);
    const syncLogs = ref([]); // History of manual sync operations
    const currentSyncDetails = ref(null);

    const startSync = () => {
        isSyncing.value = true;
        syncProgress.value = 10; // Start with a slight bump for immediate visual feedback
        currentSyncDetails.value = {
            id: crypto.randomUUID(),
            startTime: new Date().toISOString(),
            docsRead: 0,
            docsWritten: 0,
            status: 'running',
            error: null
        };
    };

    /**
     * @param {Object} progressData Data propagated from PouchDB changes
     */
    const updateProgress = (progressData) => {
        if (!currentSyncDetails.value) return;
        
        currentSyncDetails.value.docsRead += progressData.docsRead || 0;
        currentSyncDetails.value.docsWritten += progressData.docsWritten || 0;
        
        // Artificial progress bump up to 90%. Real 100% is only on 'complete' event.
        if (syncProgress.value < 90) {
            syncProgress.value = Math.min(syncProgress.value + Number((Math.random() * 10).toFixed(1)), 90);
        }
    };

    const finishSync = (resultData) => {
        isSyncing.value = false;
        syncProgress.value = 100;
        
        if (currentSyncDetails.value) {
            currentSyncDetails.value.status = 'success';
            currentSyncDetails.value.endTime = resultData.endTime;
            currentSyncDetails.value.pushMetrics = resultData.push;
            currentSyncDetails.value.pullMetrics = resultData.pull;
            
            // Push to audit history (prepend)
            syncLogs.value.unshift({ ...currentSyncDetails.value });
            currentSyncDetails.value = null;
        }

        // Reset progress bar after 2 seconds
        setTimeout(() => {
            if (!isSyncing.value) syncProgress.value = 0;
        }, 2000);
    };

    const failSync = (error) => {
        isSyncing.value = false;
        syncProgress.value = 0;
        const errorMessage = error.message || String(error);
        
        if (currentSyncDetails.value) {
            currentSyncDetails.value.status = 'error';
            currentSyncDetails.value.error = errorMessage;
            currentSyncDetails.value.endTime = new Date().toISOString();
            
            syncLogs.value.unshift({ ...currentSyncDetails.value });
            currentSyncDetails.value = null;
        } else {
            // Failsafe logger if it fails outside a regular cycle
            syncLogs.value.unshift({
                id: crypto.randomUUID(),
                startTime: new Date().toISOString(),
                endTime: new Date().toISOString(),
                status: 'error',
                error: errorMessage
            });
        }
    };

    const clearLogs = () => {
        syncLogs.value = [];
    };

    return {
        isSyncing,
        syncProgress,
        syncLogs,
        currentSyncDetails,
        startSync,
        updateProgress,
        finishSync,
        failSync,
        clearLogs
    };
});
