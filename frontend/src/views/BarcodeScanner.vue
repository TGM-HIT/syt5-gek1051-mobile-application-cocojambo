<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

const emit = defineEmits(['scanned', 'close'])

const videoRef = ref(null)
const statusMessage = ref('Kamera wird gestartet...')
const error = ref(null)
const manualBarcode = ref('')
const manualLoading = ref(false)
const nutritionData = ref(null)
let didScan = false
let reader = null

onMounted(async () => {
  reader = new BrowserMultiFormatReader()
  try {
    await reader.decodeFromVideoDevice(undefined, videoRef.value, async (result, err) => {
      if (result && !didScan) {
        didScan = true
        BrowserMultiFormatReader.releaseAllStreams()
        statusMessage.value = 'Barcode erkannt, Produkt wird gesucht...'
        nutritionData.value = await lookupProduct(result.getText())
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
      const p = data.product
      const n = p.nutriments || {}
      return {
        name: p.product_name_de || p.product_name || barcode,
        per100g: [
          { label: 'Energie', value: n['energy-kcal_100g'] ?? null, unit: 'kcal' },
          { label: 'Fett', value: n['fat_100g'] ?? null, unit: 'g' },
          { label: 'davon gesättigte Fettsäuren', value: n['saturated-fat_100g'] ?? null, unit: 'g' },
          { label: 'Kohlenhydrate', value: n['carbohydrates_100g'] ?? null, unit: 'g' },
          { label: 'davon Zucker', value: n['sugars_100g'] ?? null, unit: 'g' },
          { label: 'Ballaststoffe', value: n['fiber_100g'] ?? null, unit: 'g' },
          { label: 'Eiweiß', value: n['proteins_100g'] ?? null, unit: 'g' },
          { label: 'Salz', value: n['salt_100g'] ?? null, unit: 'g' },
        ].filter((row) => row.value !== null),
      }
    }
  } catch {
    // ignore network errors
  }
  return { name: barcode, per100g: [] }
}

async function submitManual() {
  const barcode = manualBarcode.value.trim()
  if (!barcode) return
  manualLoading.value = true
  BrowserMultiFormatReader.releaseAllStreams()
  nutritionData.value = await lookupProduct(barcode)
  manualLoading.value = false
}

function confirmAdd() {
  emit('scanned', nutritionData.value.name)
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
    <!-- Camera view -->
    <div v-if="!nutritionData" class="relative w-full max-w-md mx-4">
      <div class="bg-black rounded-2xl overflow-hidden relative">
        <video ref="videoRef" class="w-full" style="aspect-ratio: 4/3; object-fit: cover" />
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

    <!-- Nutrition popup -->
    <div v-else class="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Produkt</p>
        <h2 class="text-lg font-bold text-gray-800">{{ nutritionData.name }}</h2>
      </div>

      <div class="px-5 py-4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
          Nährwerte pro 100 g
        </p>
        <div v-if="nutritionData.per100g.length > 0" class="divide-y divide-gray-100">
          <div
            v-for="row in nutritionData.per100g"
            :key="row.label"
            class="flex justify-between py-2 text-sm"
          >
            <span class="text-gray-600">{{ row.label }}</span>
            <span class="font-medium text-gray-800">{{ row.value }} {{ row.unit }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-gray-400 text-center py-2">
          Keine Nährwertangaben verfügbar.
        </p>
      </div>

      <div class="px-5 pb-5 flex gap-3">
        <button
          @click="stopScanner"
          class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          @click="confirmAdd"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Zur Liste hinzufügen
        </button>
      </div>
    </div>
  </div>
</template>
