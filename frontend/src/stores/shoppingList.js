import { defineStore } from 'pinia'
import { db } from '../db/index.js'

function getCurrentUserId() {
  return localStorage.getItem('userId') ?? 'default-user'
}

export const useShoppingListStore = defineStore('shoppingList', {
  state: () => ({
    lists: [],
  }),

  actions: {
    async loadLists() {
      const result = await db.allDocs({ include_docs: true })
      this.lists = result.rows
          .map((row) => row.doc)
          .filter((doc) => doc.type === 'list')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    },

    async createList(name, category) {
      await db.put({
        _id: Date.now().toString(),
        type: 'list',
        name,
        category,
        members: [getCurrentUserId()],
        createdAt: new Date().toISOString(),
      })
      await this.loadLists()
    },

    async deleteList(id, rev) {
      await db.remove(id, rev)
      await this.loadLists()
    },

    async leaveList(id) {
      const doc = await db.get(id)
      const userId = getCurrentUserId()
      const updatedMembers = (doc.members ?? [userId]).filter((m) => m !== userId) //PLATZHALTER!!! Falls members leer ist, wird der aktuelle User als einziger Member angenommen, damit er die Liste verlassen kann

      if (updatedMembers.length > 0) {
        await db.put({ ...doc, members: updatedMembers })
      } else {
        await db.remove(doc)
      }

      await this.loadLists()
    },
  },
})