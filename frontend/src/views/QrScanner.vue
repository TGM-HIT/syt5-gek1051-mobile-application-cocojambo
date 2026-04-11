<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

const emit = defineEmits(['scanned', 'close'])

const videoRef = ref(null)
const statusMessage = ref('Kamera wird gestartet...')
const error = ref(null)
let didScan = false
let reader = null

const SHARE_CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

function normalize(raw) {
  const text = raw.trim().toUpperCase()
  const urlMatch = text.match(/[?&]join=([A-HJ-NP-Z2-9]{6})/i)
  if (urlMatch) return urlMatch[1].toUpperCase()
  if (SHARE_CODE_PATTERN.test(text)) return text
  return null
}

onMounted(async () => {
  reader = new BrowserMultiFormatReader()
  try {
    await reader.decodeFromVideoDevice(undefined, videoRef.value, (result, err) => {
      if (result && !didScan) {
        const code = normalize(result.getText())
        if (!code) {
          statusMessage.value = 'Kein gültiger Share-Code erkannt.'
          return
        }
        didScan = true
        BrowserMultiFormatReader.releaseAllStreams()
        emit('scanned', code)
      }
      if (err && err.name !== 'NotFoundException') {
        error.value = err.message
      }
    })
    statusMessage.value = 'QR-Code ins Bild halten...'
  } catch (e) {
    error.value = 'Kamera konnte nicht gestartet werden: ' + e.message
  }
})

onUnmounted(() => {
  BrowserMultiFormatReader.releaseAllStreams()
})

function close() {
  BrowserMultiFormatReader.releaseAllStreams()
  emit('close')
}
</script>

<template>
  <div
    class="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    data-cy="qr-scanner"
  >
    <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6">
      <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">QR-Code scannen</h2>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">{{ statusMessage }}</p>
      <div class="relative aspect-square bg-black rounded-xl overflow-hidden mb-4">
        <video ref="videoRef" class="w-full h-full object-cover" playsinline></video>
      </div>
      <p v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</p>
      <button
        @click="close"
        class="w-full border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Abbrechen
      </button>
    </div>
  </div>
</template>
