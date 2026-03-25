import { defineStore } from 'pinia'
import { db, onDbChange } from '../db/index.js'

export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: [],
    hiddenArticles: [],
    searchResults: { inCurrentList: [], inOtherLists: [], inPast: [] },
    _unsubscribe: null,
    _currentListId: null,
  }),

  actions: {
    startLiveSync(listId) {
      this.stopLiveSync()
      this._currentListId = listId
      this._unsubscribe = onDbChange((change) => {
        if (change.doc && (change.doc.type === 'article' || change.deleted)) {
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
      const all = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'article' && doc.listId === listId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      this.articles = all.filter((doc) => !doc.hidden)
      this.hiddenArticles = all.filter((doc) => doc.hidden)
    },

    async createArticle(listId, { name, quantity, unit, note, price, barcode } = {}) {
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
        createdAt: new Date().toISOString(),
      })
      await this.loadArticles(listId)
    },

    async updateArticle(listId, article) {
      await db.put(article)
      await this.loadArticles(listId)
    },

    async toggleChecked(listId, article) {
      await db.put({ ...article, checked: !article.checked })
      await this.loadArticles(listId)
    },

    async hideArticle(listId, article) {
      await db.put({ ...article, hidden: true })
      await this.loadArticles(listId)
    },

    async restoreArticle(listId, article) {
      await db.put({ ...article, hidden: false })
      await this.loadArticles(listId)
    },

    async deleteArticle(listId, id, rev) {
      await db.remove(id, rev)
      await this.loadArticles(listId)
    },

    async updatePrice(listId, article, newPrice) {
      if (article.price === newPrice) return
      const history = [...(article.priceHistory || [])]
      history.push({ price: newPrice, setAt: new Date().toISOString() })
      if (history.length > 20) history.splice(0, history.length - 20)
      await db.put({ ...article, price: newPrice, priceHistory: history })
      await this.loadArticles(listId)
    },

    async searchArticles(query, currentListId) {
      if (!query.trim()) {
        this.searchResults = { inCurrentList: [], inOtherLists: [], inPast: [] }
        return
      }
      const q = query.toLowerCase()
      const result = await db.allDocs({ include_docs: true })
      const all = result.rows
        .map((row) => row.doc)
        .filter((doc) => doc.type === 'article' && doc.name.toLowerCase().includes(q))
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
