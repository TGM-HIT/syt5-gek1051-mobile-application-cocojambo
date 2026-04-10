import { defineStore } from 'pinia'
import { db, onRemoteChange, getUsername } from '../db/index.js'

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

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    _unsubscribe: null,
    _idCounter: 0,
  }),

  actions: {
    init() {
      if (this._unsubscribe) return
      this._unsubscribe = onRemoteChange(async (doc) => {
        // Article added by someone else
        if (
          doc.type === 'article' &&
          !doc._deleted &&
          doc._rev && doc._rev.startsWith('1-') &&
          doc.createdBy && doc.createdBy !== getUsername()
        ) {
          const user = doc.createdBy.split('#')[0]
          this._push(`${user} hat "${doc.name}" hinzugefügt`, 'add', formatTime(doc.createdAt), doc.listId)
        }

        // Article hidden by someone else
        if (
          doc.type === 'article' &&
          doc.hidden === true &&
          doc._rev && !doc._rev.startsWith('1-') &&
          doc.hiddenBy && doc.hiddenBy !== getUsername()
        ) {
          const user = doc.hiddenBy.split('#')[0]
          this._push(`${user} hat "${doc.name}" ausgeblendet`, 'hide', formatTime(doc.hiddenAt), doc.listId)
        }

        // Article checked by someone else
        if (
          doc.type === 'check-event' &&
          doc.checkedBy && doc.checkedBy !== getUsername()
        ) {
          const user = doc.checkedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" abgehakt`, 'check', formatTime(doc.checkedAt), doc.listId)
        }

        // Article updated by someone else
        if (
          doc.type === 'article-patch' &&
          doc.editedBy && doc.editedBy !== getUsername()
        ) {
          const user = doc.editedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" bearbeitet`, 'update', formatTime(doc.editedAt), doc.listId)
        }

        // Article deleted by someone else
        if (
          doc.type === 'delete-intent' &&
          doc.deletedBy && doc.deletedBy !== getUsername()
        ) {
          const user = doc.deletedBy.split('#')[0]
          const name = await resolveName(doc.articleName, doc.articleId)
          this._push(`${user} hat "${name}" gelöscht`, 'delete', formatTime(doc.deletedAt), doc.listId)
        }
      })
    },

    _push(message, type, time, listId) {
      const id = ++this._idCounter
      this.notifications.push({ id, message, type, time, listId })
      setTimeout(() => this.dismiss(id), 3000)
    },

    dismiss(id) {
      this.notifications = this.notifications.filter((n) => n.id !== id)
    },

    destroy() {
      if (this._unsubscribe) {
        this._unsubscribe()
        this._unsubscribe = null
      }
    },
  },
})
