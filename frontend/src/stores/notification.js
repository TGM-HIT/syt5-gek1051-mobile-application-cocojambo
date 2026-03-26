import { defineStore } from 'pinia'
import { onRemoteChange, getUsername } from '../db/index.js'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notifications: [],
    _pending: [],
    _debounceTimer: null,
    _unsubscribe: null,
    _idCounter: 0,
  }),

  actions: {
    init() {
      if (this._unsubscribe) return
      this._unsubscribe = onRemoteChange((doc) => {
        if (
          doc.type === 'article' &&
          !doc._deleted &&
          doc._rev && doc._rev.startsWith('1-') &&
          doc.createdBy && doc.createdBy !== getUsername()
        ) {
          const displayName = doc.createdBy.split('#')[0]
          this._pending.push({ name: doc.name, user: displayName })
          clearTimeout(this._debounceTimer)
          this._debounceTimer = setTimeout(() => this._flush(), 300)
        }
      })
    },

    _flush() {
      if (this._pending.length === 0) return
      const items = [...this._pending]
      this._pending = []

      let message
      if (items.length === 1) {
        message = `${items[0].user} hat "${items[0].name}" hinzugefügt`
      } else {
        const user = items[0].user
        const allSameUser = items.every((i) => i.user === user)
        if (allSameUser) {
          message = `${user} hat ${items.length} neue Artikel hinzugefügt`
        } else {
          message = `${items.length} neue Artikel hinzugefügt`
        }
      }

      const id = ++this._idCounter
      this.notifications.push({ id, message })

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
      clearTimeout(this._debounceTimer)
    },
  },
})
