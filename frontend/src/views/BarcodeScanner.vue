<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

const emit = defineEmits(['scanned', 'close'])

const videoRef = ref(null)
const statusMessage = ref('Kamera wird gestartet...')
const error = ref(null)
const manualBarcode = ref('')
const manualLoading = ref(false)
let reader = null

onMounted(async () => {
  reader = new BrowserMultiFormatReader()
  try {
    await reader.decodeFromVideoDevice(undefined, videoRef.value, async (result, err) => {
      if (result) {
        const barcode = result.getText()
        statusMessage.value = 'Barcode erkannt, Produkt wird gesucht...'
        const name = await lookupProduct(barcode)
        emit('scanned', name || barcode)
      }
      if (err && err.name !== 'NotFoundException') {
        error.value = err.message
      }
    })
    statusMessage.value = 'Barcode ins Bild halten...'
  } catch (e) {
    error.value = 'Kamera konnte nicht gestartet werden: ' + e.message
  }
})

async function lookupProduct(barcode) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status === 1) {
      return data.product.product_name_de || data.product.product_name || null
    }
  } catch {
    // ignore network errors
  }
  return null
}

async function submitManual() {
  const barcode = manualBarcode.value.trim()
  if (!barcode) return
  manualLoading.value = true
  const name = await lookupProduct(barcode)
  manualLoading.value = false
  emit('scanned', name || barcode)
}

function stopScanner() {
  BrowserMultiFormatReader.releaseAllStreams()
  reader = null
  emit('close')
}

onUnmounted(() => {
  BrowserMultiFormatReader.releaseAllStreams()
})
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
    <div class="relative w-full max-w-md mx-4">
      <div class="bg-black rounded-2xl overflow-hidden relative">
        <video ref="videoRef" class="w-full" style="aspect-ratio: 4/3; object-fit: cover" />
        <!-- Viewfinder overlay -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="border-2 border-white/60 rounded-lg w-56 h-36"></div>
        </div>
      </div>
      <p v-if="error" class="text-red-400 text-sm text-center mt-3">{{ error }}</p>
      <p v-else class="text-white/70 text-sm text-center mt-3">{{ statusMessage }}</p>

      <!-- Manual entry -->
      <form @submit.prevent="submitManual" class="mt-4 flex gap-2">
        <input
          v-model="manualBarcode"
          type="text"
          placeholder="Barcode manuell eingeben..."
          class="flex-1 rounded-xl px-3 py-2 text-sm bg-white/10 text-white placeholder-white/40 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="submit"
          :disabled="!manualBarcode.trim() || manualLoading"
          class="bg-white/20 hover:bg-white/30 disabled:opacity-40 text-white rounded-xl px-4 py-2 text-sm font-medium transition-colors"
        >
          {{ manualLoading ? '...' : 'OK' }}
        </button>
      </form>

      <button
        @click="stopScanner"
        class="mt-3 w-full bg-white/20 hover:bg-white/30 text-white rounded-xl py-3 font-medium transition-colors"
      >
        Abbrechen
      </button>
    </div>
  </div>
</template>
