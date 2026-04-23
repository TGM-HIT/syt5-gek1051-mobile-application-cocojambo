import { defineStore } from 'pinia'
import { db, onRemoteChange, getUsername } from '../db/index.js'
import { useNotificationSettingsStore } from './notificationSettings.js'

const notificationAudio = typeof Audio !== 'undefined' ? new Audio('/sounds/notification.mp3') : null

const HISTORY_KEY = 'notification-history'
const HISTORY_LIMIT = 100
const TOAST_DURATION_MS = 6000

function formatTime(isoString) {
  const d = isoString ? new Date(isoString) : new Date()
  return d.toLocaleTimeString('de-AT', { hour: '2-digit', minute: '2-digit' })
}

async function resolveName(articleName, articleId) {
  if (articleName) return articleName
  try {
    const doc = await db.get(articleId)
    return doc.name
  } catch {
    return 'Artikel'
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // storage full or unavailable — ignore
  }
}

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    history: loadHistory(),
    _unsubscribe: null,
    _idCounter: 0,
  }),

  actions: {
    init() {
      if (this._unsubscribe) return
      this._unsubscribe = onRemoteChange(async (doc) => {
        if (
          doc.type === 'article' &&
          !doc._deleted &&
          doc._rev && doc._rev.startsWith('1-') &&
          doc.createdBy && doc.createdBy !== getUsername()
        ) {
          const user = doc.createdBy.split('#')[0]
          this._push(`${user} hat "${doc.name}" hinzugefügt`, 'add', doc.createdAt, doc.listId)
        }

        if (
          doc.type === 'article' &&
          doc.hidden === true &&
          doc._rev && !doc._rev.startsWith('1-') &&
          doc.hiddenBy && doc.hiddenBy !== getUsername()
        ) {
          const user = doc.hiddenBy.split('#')[0]
          this._push(`${user} hat "${doc.name}" ausgeblendet`, 'hide', doc.hiddenAt, doc.listId)
        }

        if (
          doc.type === 'check-event' &&
          doc.checkedBy && doc.checkedBy !== getUsername()
        ) {
          const user = doc.checkedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" abgehakt`, 'check', doc.checkedAt, doc.listId)
        }

        if (
          doc.type === 'article-patch' &&
          doc.editedBy && doc.editedBy !== getUsername()
        ) {
          const user = doc.editedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" bearbeitet`, 'update', doc.editedAt, doc.listId)
        }

        if (
          doc.type === 'delete-intent' &&
          doc.deletedBy && doc.deletedBy !== getUsername()
        ) {
          const user = doc.deletedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" gelöscht`, 'delete', doc.deletedAt, doc.listId)
        }
      })
    },

    _push(message, type, timestamp, listId) {
      const id = ++this._idCounter
      const iso = timestamp || new Date().toISOString()
      const entry = { id, message, type, time: formatTime(iso), timestamp: iso, listId }

      // Dedupe: if the most recent history entry is identical (same message + listId
      // within the last 10s), skip. Guards against duplicate emission from PouchDB.
      const last = this.history[0]
      if (
        last &&
        last.message === entry.message &&
        last.listId === entry.listId &&
        Math.abs(new Date(last.timestamp) - new Date(iso)) < 10_000
      ) {
        return
      }

      this.notifications.push(entry)
      this.history.unshift(entry)
      if (this.history.length > HISTORY_LIMIT) {
        this.history.length = HISTORY_LIMIT
      }
      saveHistory(this.history)

      setTimeout(() => this.dismiss(id), TOAST_DURATION_MS)

      const settings = useNotificationSettingsStore()
      if (settings.vibrationEnabled && 'vibrate' in navigator) {
        navigator.vibrate(200)
      }
      if (settings.soundEnabled && notificationAudio) {
        notificationAudio.currentTime = 0
        notificationAudio.play().catch(() => {})
      }
    },

    dismiss(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },

    clearHistory(listId) {
      if (listId) {
        this.history = this.history.filter((n) => n.listId !== listId)
      } else {
        this.history = []
      }
      saveHistory(this.history)
    },

    destroy() {
      if (this._unsubscribe) {
        this._unsubscribe()
        this._unsubscribe = null
      }
    },
  },
})
