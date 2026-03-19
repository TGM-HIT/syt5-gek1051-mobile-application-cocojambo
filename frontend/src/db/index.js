import PouchDB from 'pouchdb-browser'

const db = new PouchDB('shopping_lists')

const couchUser = import.meta.env.VITE_COUCHDB_USER || 'admin'
const couchPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'password'
const couchHost = import.meta.env.VITE_COUCHDB_HOST || 'localhost'
const couchPort = import.meta.env.VITE_COUCHDB_PORT || '5984'
const couchDb = import.meta.env.VITE_COUCHDB_DB || 'shopping_lists'
const remoteUrl = `http://${couchUser}:${couchPassword}@${couchHost}:${couchPort}/${couchDb}`

db.sync(remoteUrl, { live: true, retry: true })

// Expose helpers for Cypress tests: destroy for isolation, __db for stubbing.
window.__destroyDB = () => db.destroy()
window.__db = db

function getDeviceId() {
  let id = localStorage.getItem('deviceId')
  if (!id) {
    const arr = new Uint8Array(16)
    crypto.getRandomValues(arr)
    id = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('')
    localStorage.setItem('deviceId', id)
  }
  return id
}

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export { db, getDeviceId, generateShareCode }
