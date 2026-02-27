import PouchDB from 'pouchdb-browser'

const db = new PouchDB('shopping_lists')

const remoteUrl = import.meta.env.VITE_COUCHDB_URL || 'http://admin:password@localhost:5984/shopping_lists'

db.sync(remoteUrl, { live: true, retry: true })

// Expose a cleanup helper for E2E tests so Cypress can destroy the database
// cleanly (closes the connection) before reloading for test isolation.
window.__destroyDB = () => db.destroy()

export { db }
