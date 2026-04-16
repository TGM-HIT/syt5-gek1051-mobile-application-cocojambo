/**
 * Utility for matching shopping list article names against OCR-extracted receipt text.
 * User Story #33: Rechnung einscannen und Produkte abhaken
 */

/**
 * Normalizes a string for fuzzy matching:
 * - lowercase
 * - German umlauts → ASCII equivalents
 * - non-alphanumeric characters → spaces
 * - collapse whitespace
 */
export function normalizeForMatch(str) {
  return str
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extracts all text lines from a receipt OCR string.
 * Returns an array of normalized, non-empty lines.
 */
export function extractLines(receiptText) {
  return receiptText
    .split('\n')
    .map(normalizeForMatch)
    .filter(Boolean)
}

/**
 * Determines whether an article name matches a receipt line.
 * Strategy: every significant word (length >= 3) of the article name
 * must appear in at least one receipt line.
 *
 * @param {string} articleName
 * @param {string[]} normalizedLines - already-normalized receipt lines
 * @returns {boolean}
 */
export function articleMatchesReceipt(articleName, lines) {
  const normalized = normalizeForMatch(articleName)
  const words = normalized.split(' ').filter((w) => w.length >= 3)

  if (words.length === 0) return false

  return lines.some((line) => {
    const normalizedLine = normalizeForMatch(line)
    return words.every((word) => normalizedLine.includes(word))
  })
}

/**
 * Matches a list of articles against receipt OCR text.
 * Returns articles whose names were found in the receipt.
 *
 * @param {string} receiptText - raw OCR text from the receipt
 * @param {Array<{name: string, [key: string]: any}>} articles
 * @returns {Array} articles that matched
 */
export function matchArticlesFromReceipt(receiptText, articles) {
  if (!receiptText || !articles || articles.length === 0) return []

  const lines = extractLines(receiptText)
  if (lines.length === 0) return []

  return articles.filter((a) => articleMatchesReceipt(a.name, lines))
}
