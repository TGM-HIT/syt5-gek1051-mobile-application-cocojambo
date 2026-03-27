import PouchDB from 'pouchdb-browser';

/**
 * Service specifically built to handle manually triggered synchronization.
 * Unlike background live syncs, this provides granular progress events 
 * designed to be consumed by UI loading bars or manual audit logs.
 */
export class ManualSyncService {
    /**
     * @param {string} localDbName 
     * @param {string} remoteDbUrl 
     */
    constructor(localDbName, remoteDbUrl) {
        this.localDbName = localDbName;
        this.remoteDbUrl = remoteDbUrl;
    }

    /**
     * Executes a one-off bi-directional sync and provides progress streams.
     * @param {Function} onProgress 
     * @param {Function} onComplete 
     * @param {Function} onError 
     * @returns {Promise<void>}
     */
    async executeManualSync(onProgress, onComplete, onError) {
        if (!navigator.onLine) {
            if (onError) onError(new Error("Keine Internetverbindung vorhanden. Manueller Sync abgebrochen."));
            return;
        }

        try {
            const localDb = new PouchDB(this.localDbName);
            const remoteDb = new PouchDB(this.remoteDbUrl);

            // Using single one-off sync instead of live/retry to fail fast for manual user action
            localDb.sync(remoteDb, {
                live: false,
                retry: false 
            })
            .on('change', (info) => {
                if (onProgress) {
                    onProgress({
                        phase: 'change',
                        direction: info.direction,
                        docsRead: info.change.docs_read || 0,
                        docsWritten: info.change.docs_written || 0,
                        errors: info.change.errors || []
                    });
                }
            })
            .on('complete', (info) => {
                if (onComplete) {
                    onComplete({
                        status: 'success',
                        push: info.push,
                        pull: info.pull,
                        startTime: info.start_time,
                        endTime: new Date().toISOString()
                    });
                }
            })
            .on('error', (err) => {
                if (onError) onError(err);
            })
            .on('denied', (err) => {
                if (onError) onError(new Error("Replikation wurde verweigert (Permissions/Auth)."));
            });

        } catch (error) {
            console.error('[ManualSyncService] Execution Error:', error);
            if (onError) onError(error);
        }
    }
}
