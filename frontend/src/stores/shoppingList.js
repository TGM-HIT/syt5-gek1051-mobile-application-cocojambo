import { defineStore } from 'pinia'
import { db, remoteUrl, onDbChange, getUsername, generateShareCode } from '../db/index.js'

export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({
    lists: [],
    _unsubscribe: null,
  }),

  actions: {
    startLiveSync() {
      this.stopLiveSync()
      this._unsubscribe = onDbChange((change) => {
        if (change.doc && (change.doc.type === 'list' || change.deleted)) {
          this.loadLists()
        }
      })
    },

    stopLiveSync() {
      if (this._unsubscribe) {
        this._unsubscribe()
        this._unsubscribe = null
      }
    },

    async loadLists() {
      const username = getUsername()
      const result = await db.allDocs({ include_docs: true })
      this.lists = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'list')
        .filter((doc) => !doc.members || doc.members.includes(username))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    async createList(name, category) {
      const username = getUsername()
      await db.put({
        _id: Date.now().toString(),
        type: 'list',
        name,
        category,
        members: [username],
        shareCode: generateShareCode(),
        createdAt: new Date().toISOString(),
      })
      await this.loadLists()
    },

    async joinList(code) {
      const username = getUsername()
      const findInDocs = async () => {
        const result = await db.allDocs({ include_docs: true })
        return result.rows
          .map((row) => row.doc)
          .find((doc) => doc.type === 'list' && doc.shareCode === code.toUpperCase())
      }

      let list = await findInDocs()
      if (!list) {
        await db.replicate.from(remoteUrl, { live: false })
        list = await findInDocs()
      }

      if (!list) return null

      if (!list.members) list.members = []
      if (list.members.includes(username)) return list

      list.members.push(username)
      await db.put(list)
      await this.loadLists()
      return list
    },

    async leaveList(id) {
      const username = getUsername()
      const doc = await db.get(id)

      if (!doc.members) return
      doc.members = doc.members.filter((m) => m !== username)

      if (doc.members.length === 0) {
        // Last member leaving — delete list and all its articles
        const all = await db.allDocs({ include_docs: true })
        const toDelete = all.rows
          .map((row) => row.doc)
          .filter((d) => d._id === id || (d.type === 'article' && d.listId === id))
          .map((d) => ({ ...d, _deleted: true }))
        await db.bulkDocs(toDelete)
      } else {
        await db.put(doc)
      }

      await this.loadLists()
    },

    async deleteList(id, rev) {
      await db.remove(id, rev)
      await this.loadLists()
    },
  },
})
