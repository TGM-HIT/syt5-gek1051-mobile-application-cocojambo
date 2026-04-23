import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useNotificationSettingsStore = defineStore('notificationSettings', () => {
  const soundEnabled = ref(localStorage.getItem('notif-sound') !== 'false')
  const vibrationEnabled = ref(localStorage.getItem('notif-vibration') !== 'false')

  watch(soundEnabled, (val) => localStorage.setItem('notif-sound', val))
  watch(vibrationEnabled, (val) => localStorage.setItem('notif-vibration', val))

  function toggleSound() { soundEnabled.value = !soundEnabled.value }
  function toggleVibration() { vibrationEnabled.value = !vibrationEnabled.value }

  return { soundEnabled, vibrationEnabled, toggleSound, toggleVibration }
})
