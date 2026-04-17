import PouchDB from 'pouchdb-browser'

const db = new PouchDB('shopping_lists')

const couchUser = import.meta.env.VITE_COUCHDB_USER || 'admin'
const couchPassword = import.meta.env.VITE_COUCHDB_PASSWORD || 'password'
const couchHost = import.meta.env.VITE_COUCHDB_HOST || window.location.hostname
const couchPort = import.meta.env.VITE_COUCHDB_PORT || '5984'
const couchDb = import.meta.env.VITE_COUCHDB_DB || 'shopping_lists'
const remoteUrl = `http://${couchUser}:${couchPassword}@${couchHost}:${couchPort}/${couchDb}`

const syncHandler = db.sync(remoteUrl, { live: true, retry: true })

// Sync pull listeners — fires only for incoming remote changes
const syncPullListeners = new Set()
syncHandler.on('change', (info) => {
  if (info.direction === 'pull') {
    for (const doc of info.change.docs) {
      for (const cb of syncPullListeners) cb(doc)
    }
  }
})

function onRemoteChange(callback) {
  syncPullListeners.add(callback)
  return () => syncPullListeners.delete(callback)
}

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

async function renameUser(newDisplayName) {
  const oldUsername = localStorage.getItem('username')
  if (!oldUsername) return null

  const suffix = oldUsername.split('#')[1]
  const newUsername = `${newDisplayName}#${suffix}`

  if (oldUsername === newUsername) return newUsername

  const result = await db.allDocs({ include_docs: true })
  const docs = result.rows.map((row) => row.doc)

  const updated = []

  for (const doc of docs) {
    switch (doc.type) {
      case 'list':
        if (doc.members && doc.members.includes(oldUsername)) {
          updated.push({
            ...doc,
            members: doc.members.map((m) => (m === oldUsername ? newUsername : m)),
          })
        }
        break
      case 'article':
        if (doc.createdBy === oldUsername || doc.hiddenBy === oldUsername) {
          updated.push({
            ...doc,
            createdBy: doc.createdBy === oldUsername ? newUsername : doc.createdBy,
            hiddenBy: doc.hiddenBy === oldUsername ? newUsername : doc.hiddenBy,
          })
        }
        break
      case 'article-patch':
        if (doc.editedBy === oldUsername) {
          updated.push({ ...doc, editedBy: newUsername })
        }
        break
      case 'check-event':
        if (doc.checkedBy === oldUsername) {
          updated.push({ ...doc, checkedBy: newUsername })
        }
        break
      case 'delete-intent':
        if (doc.deletedBy === oldUsername) {
          updated.push({ ...doc, deletedBy: newUsername })
        }
        break
    }
  }

  if (updated.length > 0) {
    await db.bulkDocs(updated)
  }

  localStorage.setItem('username', newUsername)
  return newUsername
}

function generateShareCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export { db, remoteUrl, onDbChange, onRemoteChange, getUsername, setUsername, hasUsername, renameUser, generateShareCode }
