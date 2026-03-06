import { defineStore } from 'pinia'

export const useOnlineStatusStore = defineStore('onlineStatus', {
  state: () => ({
    isOnline: navigator.onLine,
  }),

  actions: {
    init() {
      window.addEventListener('online', () => {
        this.isOnline = true
      })
      window.addEventListener('offline', () => {
        this.isOnline = false
      })
    },
  },
})
