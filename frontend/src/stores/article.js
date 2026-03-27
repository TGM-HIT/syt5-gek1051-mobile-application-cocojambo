import { defineStore } from 'pinia'
import { db, onDbChange, getUsername } from '../db/index.js'

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
        if (change.doc && (change.doc.type === 'article' || change.doc.type === 'check-event' || change.deleted)) {
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

      const articleDocs = all
        .filter((doc) => doc.type === 'article' && doc.listId === listId)
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      this.articles = articleDocs.filter((doc) => !doc.hidden)
      this.hiddenArticles = articleDocs.filter((doc) => doc.hidden)

      const eventsByArticle = {}
      all
        .filter((doc) => doc.type === 'check-event' && doc.listId === listId)
        .sort((a, b) => new Date(a.checkedAt) - new Date(b.checkedAt))
        .forEach((event) => {
          if (!eventsByArticle[event.articleId]) eventsByArticle[event.articleId] = []
          eventsByArticle[event.articleId].push(event)
        })
      this.checkEvents = eventsByArticle
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
        createdBy: getUsername(),
        createdAt: new Date().toISOString(),
      })
      await this.loadArticles(listId)
    },

    async updateArticle(listId, article) {
      await db.put(article)
      await this.loadArticles(listId)
    },

    async toggleChecked(listId, article) {
      const newChecked = !article.checked
      await db.put({ ...article, checked: newChecked })
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
