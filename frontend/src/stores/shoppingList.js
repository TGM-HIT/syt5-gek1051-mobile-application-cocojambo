import { defineStore } from 'pinia'
import { db, getDeviceId, generateShareCode } from '../db/index.js'

export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({
    lists: [],
  }),

  actions: {
    async loadLists() {
      const deviceId = getDeviceId()
      const result = await db.allDocs({ include_docs: true })
      this.lists = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'list')
        .filter((doc) => !doc.members || doc.members.includes(deviceId))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    async createList(name, category) {
      const deviceId = getDeviceId()
      await db.put({
        _id: Date.now().toString(),
        type: 'list',
        name,
        category,
        members: [deviceId],
        shareCode: generateShareCode(),
        createdAt: new Date().toISOString(),
      })
      await this.loadLists()
    },

    async joinList(code) {
      const deviceId = getDeviceId()
      const result = await db.allDocs({ include_docs: true })
      const list = result.rows
        .map((row) => row.doc)
        .find((doc) => doc.type === 'list' && doc.shareCode === code.toUpperCase())

      if (!list) return null

      if (!list.members) list.members = []
      if (list.members.includes(deviceId)) return list

      list.members.push(deviceId)
      await db.put(list)
      await this.loadLists()
      return list
    },

    async leaveList(id) {
      const deviceId = getDeviceId()
      const doc = await db.get(id)

      if (!doc.members) return
      doc.members = doc.members.filter((m) => m !== deviceId)

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
