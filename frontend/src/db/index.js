import PouchDB from 'pouchdb-browser'

const db = new PouchDB('shopping_lists')

const couchUser = import.meta.env.VITE_COUCHDB_USER || 'admin'
const couchPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'password'
const couchHost = import.meta.env.VITE_COUCHDB_HOST || 'localhost'
const couchPort = import.meta.env.VITE_COUCHDB_PORT || '5984'
const couchDb = import.meta.env.VITE_COUCHDB_DB || 'shopping_lists'
const remoteUrl = `http://${couchUser}:${couchPassword}@${couchHost}:${couchPort}/${couchDb}`

const syncHandler = db.sync(remoteUrl, { live: true, retry: true })

// Live changes feed — fires for both local writes and incoming replication
const changesListeners = new Set()
const changesFeed = db.changes({ since: 'now', live: true, include_docs: true })
changesFeed.on('change', (change) => {
  for (const cb of changesListeners) cb(change)
})

function onDbChange(callback) {
  changesListeners.add(callback)
  return () => changesListeners.delete(callback)
}

// Expose helpers for Cypress tests: destroy for isolation, __db for stubbing.
window.__destroyDB = () =>
  new Promise((resolve) => {
    changesFeed.cancel()
    syncHandler.on('complete', () => {
      db.destroy().then(resolve).catch(resolve)
    })
    syncHandler.cancel()
  })
window.__db = db

function getUsername() {
  return localStorage.getItem('username')
}

function setUsername(displayName) {
  const arr = new Uint8Array(2)
  crypto.getRandomValues(arr)
  const suffix = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
  const username = `${displayName}#${suffix}`
  localStorage.setItem('username', username)
  return username
}

function hasUsername() {
  return !!localStorage.getItem('username')
}

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export { db, remoteUrl, onDbChange, getUsername, setUsername, hasUsername, generateShareCode }
