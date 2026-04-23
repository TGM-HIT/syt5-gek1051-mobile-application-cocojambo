import { defineStore } from 'pinia'
import { db, onDbChange, getUsername } from '../db/index.js'

const DEFAULT_TAGS = [
  'Obst & Gemüse', 'Backwaren', 'Milchprodukte', 'Fleisch & Wurst',
  'Getränke', 'Tiefkühl', 'Konserven', 'Süßwaren', 'Haushalt', 'Sonstiges',
]

export const useTagStore = defineStore('tag', {
  state: () => ({
    tags: [],
    _unsubscribe: null,
    _currentListId: null,
  }),

  actions: {
    startLiveSync(listId) {
      this.stopLiveSync()
      this._currentListId = listId
      this._unsubscribe = onDbChange((change) => {
        if (change.doc?.type === 'tag' || change.deleted) {
          this.loadTags(this._currentListId)
        }
      })
    },

    stopLiveSync() {
      if (this._unsubscribe) {
        this._unsubscribe()
        this._unsubscribe = null
      }
      this._currentListId = null
    },

    async loadTags(listId) {
      const result = await db.allDocs({ include_docs: true })
      this.tags = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'tag' && doc.listId === listId)
        .sort((a, b) => a.name.localeCompare(b.name, 'de'))
    },

    async ensureDefaultTags(listId) {
      const result = await db.allDocs({ include_docs: true })
      const existing = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'tag' && doc.listId === listId)
      if (existing.length > 0) return
      const docs = DEFAULT_TAGS.map((name, i) => ({
        _id: `tag-${listId}-${Date.now()}-${i}`,
        type: 'tag',
        listId,
        name,
        createdBy: getUsername(),
        createdAt: new Date().toISOString(),
      }))
      await db.bulkDocs(docs)
      await this.loadTags(listId)
    },

    async createTag(listId, name) {
      const trimmed = name.trim()
      if (!trimmed) return
      if (this.tags.some((t) => t.name === trimmed)) return
      await db.put({
        _id: `tag-${listId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'tag',
        listId,
        name: trimmed,
        createdBy: getUsername(),
        createdAt: new Date().toISOString(),
      })
      await this.loadTags(listId)
    },

    async updateTag(listId, tagDoc, newName) {
      const trimmed = newName.trim()
      if (!trimmed || trimmed === tagDoc.name) return
      if (this.tags.some((t) => t.name === trimmed && t._id !== tagDoc._id)) return
      const oldName = tagDoc.name
      await db.put({ ...tagDoc, name: trimmed })

      const allDocs = await db.allDocs({ include_docs: true })
      const articlesToUpdate = allDocs.rows
        .map((r) => r.doc)
        .filter((doc) => doc.type === 'article' && doc.listId === listId && doc.tag === oldName)
      if (articlesToUpdate.length > 0) {
        await db.bulkDocs(articlesToUpdate.map((a) => ({ ...a, tag: trimmed })))
      }

      await this.loadTags(listId)
    },

    async deleteTag(listId, tagDoc) {
      await db.remove(tagDoc._id, tagDoc._rev)

      const allDocs = await db.allDocs({ include_docs: true })
      const articlesToUpdate = allDocs.rows
        .map((r) => r.doc)
        .filter((doc) => doc.type === 'article' && doc.listId === listId && doc.tag === tagDoc.name)
      if (articlesToUpdate.length > 0) {
        await db.bulkDocs(articlesToUpdate.map((a) => ({ ...a, tag: '' })))
      }

      await this.loadTags(listId)
    },

    tagNames() {
      return this.tags.map((t) => t.name)
    },
  },
})
