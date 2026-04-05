import { defineStore } from 'pinia'
import { db, onDbChange, getUsername } from '../db/index.js'

function applyPatches(base, patches) {
  if (!patches || patches.length === 0) return base
  const sorted = [...patches].sort((a, b) => new Date(a.editedAt) - new Date(b.editedAt))
  const mergedFields = sorted.reduce((acc, patch) => ({ ...acc, ...patch.fields }), {})
  const newPriceEntries = sorted
    .filter((p) => p.priceHistoryEntry)
    .map((p) => p.priceHistoryEntry)
  const priceHistory = [...(base.priceHistory || []), ...newPriceEntries]
    .sort((a, b) => new Date(a.setAt) - new Date(b.setAt))
    .slice(-20)
  return { ...base, ...mergedFields, priceHistory }
}

export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: [],
    hiddenArticles: [],
    checkEvents: {},
    searchResults: { inCurrentList: [], inOtherLists: [], inPast: [] },
    _unsubscribe: null,
    _currentListId: null,
  }),

  actions: {
    startLiveSync(listId) {
      this.stopLiveSync()
      this._currentListId = listId
      this._unsubscribe = onDbChange((change) => {
        const type = change.doc?.type
        if (
          change.deleted ||
          type === 'article' ||
          type === 'article-patch' ||
          type === 'check-event' ||
          type === 'delete-intent'
        ) {
          this.loadArticles(this._currentListId)
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

    async loadArticles(listId) {
      const result = await db.allDocs({ include_docs: true })
      const all = result.rows.map((row) => row.doc)

      const deletedIds = new Set(
        all.filter((doc) => doc.type === 'delete-intent').map((doc) => doc.articleId)
      )

      const patchesByArticle = {}
      all
        .filter((doc) => doc.type === 'article-patch')
        .forEach((patch) => {
          if (!patchesByArticle[patch.articleId]) patchesByArticle[patch.articleId] = []
          patchesByArticle[patch.articleId].push(patch)
        })

      const articleDocs = all
        .filter((doc) => doc.type === 'article' && doc.listId === listId && !deletedIds.has(doc._id))
        .map((doc) => applyPatches(doc, patchesByArticle[doc._id] || []))
        .sort((a, b) => {
          const aR = !!a.rabattfähig
          const bR = !!b.rabattfähig
          if (aR !== bR) return aR ? -1 : 1
          if (aR && bR) {
            const aP = a.price ?? -Infinity
            const bP = b.price ?? -Infinity
            if (bP !== aP) return bP - aP
          }
          return new Date(a.createdAt) - new Date(b.createdAt)
        })
      this.articles = articleDocs.filter((doc) => !doc.hidden)
      this.hiddenArticles = articleDocs.filter((doc) => doc.hidden)

      const eventsByArticle = {}
      all
        .filter((doc) => doc.type === 'check-event' && doc.listId === listId)
        .sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt))
        .forEach((event) => {
          if (!eventsByArticle[event.articleId]) eventsByArticle[event.articleId] = {}
          eventsByArticle[event.articleId][event.checkedBy] = event
        })
      for (const articleId of Object.keys(eventsByArticle)) {
        eventsByArticle[articleId] = Object.values(eventsByArticle[articleId])
          .sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt))
      }
      this.checkEvents = eventsByArticle
    },

    async createArticle(listId, { name, quantity, unit, note, price, barcode, rabattfähig } = {}) {
      await db.put({
        _id: Date.now().toString(),
        type: 'article',
        listId,
        name,
        quantity: quantity || 1,
        unit: unit || '',
        note: note || '',
        price: price ?? null,
        barcode: barcode ?? null,
        priceHistory: [],
        checked: false,
        hidden: false,
        rabattfähig: rabattfähig ?? false,
        createdBy: getUsername(),
        createdAt: new Date().toISOString(),
      })
      await this.loadArticles(listId)
    },

    async updateArticle(listId, articleId, changedFields) {
      if (Object.keys(changedFields).length === 0) return
      await db.put({
        _id: `patch-${articleId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'article-patch',
        articleId,
        listId,
        fields: changedFields,
        editedBy: getUsername(),
        editedAt: new Date().toISOString(),
      })
      await this.loadArticles(listId)
    },

    async toggleChecked(listId, article) {
      const newChecked = !article.checked
      const base = await db.get(article._id)
      await db.put({ ...base, checked: newChecked })
      if (newChecked) {
        await db.put({
          _id: `check-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          type: 'check-event',
          articleId: article._id,
          listId,
          checkedBy: getUsername(),
          checkedAt: new Date().toISOString(),
        })
      }
      await this.loadArticles(listId)
    },

    async hideArticle(listId, article) {
      const base = await db.get(article._id)
      await db.put({ ...base, hidden: true })
      await this.loadArticles(listId)
    },

    async restoreArticle(listId, article) {
      const base = await db.get(article._id)
      await db.put({ ...base, hidden: false })
      await this.loadArticles(listId)
    },

    async deleteArticle(listId, id, rev) {
      await db.put({
        _id: `delete-intent-${id}`,
        type: 'delete-intent',
        articleId: id,
        listId,
        deletedAt: new Date().toISOString(),
        deletedBy: getUsername(),
      })
      try { await db.remove(id, rev) } catch { /* rev may be stale if article was edited offline */ }
      await this.loadArticles(listId)
    },

    async updatePrice(listId, articleId, currentPrice, newPrice) {
      if (currentPrice === newPrice) return
      const now = new Date().toISOString()
      await db.put({
        _id: `patch-${articleId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        type: 'article-patch',
        articleId,
        listId,
        fields: { price: newPrice },
        priceHistoryEntry: { price: newPrice, setAt: now },
        editedBy: getUsername(),
        editedAt: now,
      })
      await this.loadArticles(listId)
    },

    async searchArticles(query, currentListId) {
      if (!query.trim()) {
        this.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [] }
        return
      }
      const q = query.toLowerCase()
      const result = await db.allDocs({ include_docs: true })
      const allDocs = result.rows.map((row) => row.doc)

      const deletedIds = new Set(
        allDocs.filter((doc) => doc.type === 'delete-intent').map((doc) => doc.articleId)
      )
      const patchesByArticle = {}
      allDocs
        .filter((doc) => doc.type === 'article-patch')
        .forEach((patch) => {
          if (!patchesByArticle[patch.articleId]) patchesByArticle[patch.articleId] = []
          patchesByArticle[patch.articleId].push(patch)
        })

      const all = allDocs
        .filter((doc) => doc.type === 'article' && !deletedIds.has(doc._id))
        .map((doc) => applyPatches(doc, patchesByArticle[doc._id] || []))
        .filter((doc) => doc.name.toLowerCase().includes(q))

      this.searchResults = {
        inCurrentList: all.filter((doc) => doc.listId === currentListId && !doc.hidden),
        inOtherLists: all.filter((doc) => doc.listId !== currentListId && !doc.hidden),
        inPast: all.filter((doc) => doc.hidden),
      }
    },

    async addFromSearch(currentListId, article) {
      await this.createArticle(currentListId, {
        name: article.name,
        quantity: article.quantity,
        unit: article.unit,
        note: article.note,
        barcode: article.barcode || null,
      })
      this.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [] }
    },
  },
})
