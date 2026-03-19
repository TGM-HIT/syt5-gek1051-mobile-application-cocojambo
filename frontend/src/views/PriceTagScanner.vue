<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { recognizePrice, extractPrices } from '../utils/ocrPrice.js'
import { useOnlineStatusStore } from '../stores/onlineStatus.js'

const props = defineProps({
  articleName: { type: String, required: true },
})

const emit = defineEmits(['scanned', 'close'])

const onlineStore = useOnlineStatusStore()
const videoRef = ref(null)
const canvasRef = ref(null)
const error = ref(null)
const loading = ref(false)
const candidates = ref([])
const selectedPrice = ref(null)
const manualPrice = ref(null)
const showResult = ref(false)
let stream = null

onMounted(async () => {
  // If offline, go straight to manual entry
  if (!onlineStore.isOnline) {
    showResult.value = true
    return
  }
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (e) {
    error.value = 'Kamera konnte nicht gestartet werden: ' + e.message
    showResult.value = true
  }
})

onUnmounted(() => {
  stopCamera()
})

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop())
    stream = null
  }
}

async function captureAndRecognize() {
  if (!videoRef.value || !canvasRef.value) return
  loading.value = true
  error.value = null

  const video = videoRef.value
  const canvas = canvasRef.value
  // Resize to max 1280px longest edge
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = video.videoWidth * scale
  canvas.height = video.videoHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

  stopCamera()

  try {
    const prices = await recognizePrice(base64)
    candidates.value = prices
    if (prices.length === 1) {
      selectedPrice.value = prices[0]
      manualPrice.value = prices[0]
    } else if (prices.length > 1) {
      selectedPrice.value = prices[0]
      manualPrice.value = prices[0]
    } else {
      manualPrice.value = null
    }
  } catch (e) {
    error.value = 'Preiserkennung fehlgeschlagen. Bitte manuell eingeben.'
    manualPrice.value = null
  }

  showResult.value = true
  loading.value = false
}

function selectCandidate(price) {
  selectedPrice.value = price
  manualPrice.value = price
}

function confirm() {
  const price = manualPrice.value
  emit('scanned', price != null && price > 0 ? price : null)
}

function close() {
  stopCamera()
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
    <!-- Camera view -->
    <div v-if="!showResult" class="relative w-full max-w-md mx-4">
      <div class="bg-black rounded-2xl overflow-hidden relative">
        <video
          ref="videoRef"
          autoplay
          playsinline
          class="w-full"
          style="aspect-ratio: 4/3; object-fit: cover"
        />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="border-2 border-white/60 rounded-lg w-56 h-36"></div>
        </div>
      </div>
      <p v-if="error" class="text-red-400 text-sm text-center mt-3">{{ error }}</p>
      <p v-else class="text-white/70 text-sm text-center mt-3">
        {{ loading ? 'Preis wird erkannt...' : 'Preisschild ins Bild halten und aufnehmen' }}
      </p>
      <button
        @click="captureAndRecognize"
        :disabled="loading"
        class="mt-3 w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
      >
        {{ loading ? 'Wird erkannt...' : 'Aufnehmen' }}
      </button>
      <button
        @click="close"
        class="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded-xl py-3 font-medium transition-colors"
      >
        Abbrechen
      </button>
    </div>

    <!-- Result / manual entry -->
    <div v-else class="w-full max-w-md mx-4 bg-white rounded-2xl shadow-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Preis für</p>
        <h2 class="text-lg font-bold text-gray-800">{{ articleName }}</h2>
      </div>

      <div class="px-5 py-4">
        <p v-if="error" class="text-sm text-red-500 mb-3">{{ error }}</p>

        <!-- Multiple candidates -->
        <div v-if="candidates.length > 1" class="mb-4">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Erkannte Preise
          </p>
          <label
            v-for="price in candidates"
            :key="price"
            class="flex items-center gap-3 py-2 cursor-pointer"
          >
            <input
              type="radio"
              :value="price"
              v-model="selectedPrice"
              @change="manualPrice = price"
              class="accent-blue-600"
            />
            <span class="text-sm text-gray-800">
              € {{ price.toFixed(2).replace('.', ',') }}
            </span>
          </label>
        </div>

        <!-- Single candidate message -->
        <p v-else-if="candidates.length === 1" class="text-sm text-green-600 mb-3">
          Preis erkannt!
        </p>

        <!-- Manual entry / correction -->
        <div>
          <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            {{ candidates.length > 0 ? 'Preis korrigieren' : 'Preis eingeben' }}
          </label>
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-500">€</span>
            <input
              v-model.number="manualPrice"
              type="number"
              min="0"
              step="0.01"
              placeholder="z.B. 2,49"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div class="px-5 pb-5 flex gap-3">
        <button
          @click="close"
          class="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Abbrechen
        </button>
        <button
          @click="confirm"
          class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors"
        >
          Übernehmen
        </button>
      </div>
    </div>

    <canvas ref="canvasRef" class="hidden" />
  </div>
</template>
