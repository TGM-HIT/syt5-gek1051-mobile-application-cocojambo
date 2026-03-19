export function extractPrices(text) {
  // Regex declared inside function to avoid /g lastIndex state bugs
  const CURRENCY_PATTERN = /(?:€\s?|EUR\s?)(\d{1,3},\d{2})|(\d{1,3},\d{2})\s?€/g
  const DOT_DECIMAL_PATTERN = /(?<!\d)(\d{1,3}\.\d{2})(?!\d)/g

  const prices = []

  // First try currency-symbol patterns
  let match
  while ((match = CURRENCY_PATTERN.exec(text)) !== null) {
    const raw = match[1] || match[2]
    const value = parseFloat(raw.replace(',', '.'))
    if (value >= 0.01 && value <= 999.99) prices.push(value)
  }

  // Fall back to dot decimal only if no currency matches found
  if (prices.length === 0) {
    while ((match = DOT_DECIMAL_PATTERN.exec(text)) !== null) {
      const value = parseFloat(match[1])
      if (value >= 0.01 && value <= 999.99) prices.push(value)
    }
  }

  return prices
}

export async function recognizePrice(imageBase64) {
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
  const text = data.responses?.[0]?.fullTextAnnotation?.text || ''
  return extractPrices(text)
}
