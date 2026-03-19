import PouchDB from 'pouchdb-browser'

const db = new PouchDB('shopping_lists')

const remoteUrl = import.meta.env.VITE_COUCHDB_URL || 'http://admin:password@localhost:5984/shopping_lists'

const syncHandler = db.sync(remoteUrl, { live: true, retry: true })

// Expose helpers for Cypress tests: destroy for isolation, __db for stubbing.
window.__destroyDB = () =>
  new Promise((resolve) => {
    syncHandler.on('complete', () => {
      db.destroy().then(resolve).catch(resolve)
    })
    syncHandler.cancel()
  })
window.__db = db

export { db }
