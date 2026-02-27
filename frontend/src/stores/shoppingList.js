import { defineStore } from 'pinia'
import { db } from '../db/index.js'

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
        createdAt: new Date().toISOString(),
      })
      await this.loadLists()
    },

    async deleteList(id, rev) {
      await db.remove(id, rev)
      await this.loadLists()
    },
  },
})
