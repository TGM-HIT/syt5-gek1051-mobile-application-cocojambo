<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { recognizePrice } from '../utils/ocrPrice.js'
import { matchArticlesFromReceipt } from '../utils/receiptMatcher.js'

const props = defineProps({
  articles: { type: Array, required: true },
})

const emit = defineEmits(['matched', 'close'])

const videoRef = ref(null)
const canvasRef = ref(null)
const error = ref(null)
const loading = ref(false)
const matchedArticles = ref([])
const selectedIds = ref(new Set())
const showResults = ref(false)
const noMatchFound = ref(false)
let stream = null

onMounted(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    if (videoRef.value) {
      videoRef.value.srcObject = stream
    }
  } catch (e) {
    error.value = 'Kamera konnte nicht gestartet werden: ' + e.message
    showResults.value = true
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
  noMatchFound.value = false

  const video = videoRef.value
  const canvas = canvasRef.value
  const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight))
  canvas.width = video.videoWidth * scale
  canvas.height = video.videoHeight * scale
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]

  stopCamera()

  try {
    const receiptText = await recognizeReceiptText(base64)
    const activeArticles = props.articles.filter((a) => !a.checked && !a.hidden)
    const matches = matchArticlesFromReceipt(receiptText, activeArticles)

    matchedArticles.value = matches
    selectedIds.value = new Set(matches.map((a) => a._id))
    noMatchFound.value = matches.length === 0
  } catch (e) {
    error.value = 'Texterkennung fehlgeschlagen. Bitte erneut versuchen.'
  }

  showResults.value = true
  loading.value = false
}

async function recognizeReceiptText(imageBase64) {
  const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY
  if (!apiKey) throw new Error('VITE_GOOGLE_VISION_API_KEY is not set')

  const body = {
    requests: [{
      image: { content: imageBase64 },
      features: [{ type: 'TEXT_DETECTION' }],
    }],
  }

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )

  if (!res.ok) throw new Error(`Vision API error: ${res.status}`)

  const data = await res.json()
  return data.responses?.[0]?.fullTextAnnotation?.text || ''
}

function toggleArticle(id) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) {
    next.delete(id)
  } else {
    next.add(id)
  }
  selectedIds.value = next
}

function confirm() {
  const toCheck = matchedArticles.value.filter((a) => selectedIds.value.has(a._id))
  emit('matched', toCheck)
}

function close() {
  stopCamera()
  emit('close')
}
</script>

<template>
  <div class="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
    <!-- Camera view -->
    <div v-if="!showResults" class="relative w-full max-w-md mx-4">
      <div class="bg-black rounded-2xl overflow-hidden relative">
        <video
          ref="videoRef"
          autoplay
          playsinline
          class="w-full"
          style="aspect-ratio: 4/3; object-fit: cover"
        />
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div class="border-2 border-white/60 rounded-lg" style="width: 85%; height: 75%"></div>
        </div>
        <div class="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none">
          <span class="bg-black/50 text-white/80 text-xs px-3 py-1 rounded-full">
            Rechnung vollständig ins Bild halten
          </span>
        </div>
      </div>
      <p v-if="error" class="text-red-400 text-sm text-center mt-3">{{ error }}</p>
      <p v-else class="text-white/70 text-sm text-center mt-3">
        {{ loading ? 'Rechnung wird gelesen...' : 'Rechnung ins Bild halten und scannen' }}
      </p>
      <button
        @click="captureAndRecognize"
        :disabled="loading"
        class="mt-3 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl py-3 font-medium transition-colors"
      >
        {{ loading ? 'Wird gescannt...' : '🧾 Rechnung scannen' }}
      </button>
      <button
        @click="close"
        class="mt-2 w-full bg-white/20 hover:bg-white/30 text-white rounded-xl py-3 font-medium transition-colors"
      >
        Abbrechen
      </button>
    </div>

    <!-- Results view -->
    <div v-else class="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
      <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Erkannte Artikel</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Artikel auswählen die abgehakt werden sollen
        </p>
      </div>

      <div class="px-5 py-4 max-h-80 overflow-y-auto">
        <!-- Error state -->
        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <!-- No matches -->
        <div v-else-if="noMatchFound" class="text-center py-4">
          <p class="text-2xl mb-2">🤷</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Keine Artikel der Liste auf der Rechnung erkannt.
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Tipp: Stelle sicher, dass die Rechnung gut beleuchtet und scharf ist.
          </p>
        </div>

        <!-- Matched articles list -->
        <div v-else class="space-y-2">
          <label
            v-for="article in matchedArticles"
            :key="article._id"
            class="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors"
            :class="selectedIds.has(article._id)
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700'
              : 'bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600'"
          >
            <input
              type="checkbox"
              :checked="selectedIds.has(article._id)"
              @change="toggleArticle(article._id)"
              class="w-4 h-4 accent-green-600 flex-shrink-0"
            />
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                {{ article.name }}
              </p>
              <p v-if="article.quantity || article.unit" class="text-xs text-gray-400 dark:text-gray-500">
                {{ article.quantity }} {{ article.unit }}
              </p>
            </div>
            <span v-if="selectedIds.has(article._id)" class="text-green-500 flex-shrink-0">✓</span>
          </label>
        </div>
      </div>

      <div class="px-5 pb-5 flex gap-3 border-t border-gray-100 dark:border-gray-700 pt-4">
        <button
          @click="close"
          class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Abbrechen
        </button>
        <button
          v-if="!noMatchFound && !error"
          @click="confirm"
          :disabled="selectedIds.size === 0"
          class="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
        >
          {{ selectedIds.size }} Artikel abhaken
        </button>
      </div>
    </div>

    <canvas ref="canvasRef" class="hidden" />
  </div>
</template>
