# Article Prices & Price Tag Scanning

## Overview

Add price tracking to shopping list articles with two input methods: manual entry and OCR-based price tag scanning via Google Cloud Vision. Includes price history tracking and per-list totals.

## Data Model

Three new fields on article documents in PouchDB:

```js
{
  // existing fields: _id, type, listId, name, quantity, unit, note, checked, hidden, createdAt
  price: 2.49,                // number | null — current price in EUR
  barcode: '9001234567890',   // string | null — EAN from barcode scanner
  priceHistory: [             // array — past price entries
    { price: 2.29, scannedAt: '2026-03-10T14:30:00.000Z' },
    { price: 2.49, scannedAt: '2026-03-19T09:15:00.000Z' },
  ]
}
```

Rules:
- `price` is always the latest/current price.
- A new `priceHistory` entry is added only when the new price differs from the current price.
- Prices are stored as numbers, always EUR, formatted as `€ X,XX` (comma decimal) in the UI.
- `barcode` is stored for product re-identification.
- `priceHistory` defaults to an empty array.
- `price` and `barcode` default to `null`.

## Price Tag Scanning Flow

1. User taps camera icon button on an article in the list.
2. `PriceTagScanner.vue` opens as a full-screen camera modal.
3. User points camera at the shelf price tag and taps a capture button.
4. Captured image is sent to Google Cloud Vision API (`TEXT_DETECTION`).
5. Returned text is parsed for Austrian price patterns (see OCR Price Extraction).
6. Extracted price is shown in a confirmation popup: "Milch — € 2,49. Übernehmen?"
7. User can confirm or manually correct the price.
8. On confirm: `price` is updated, old price is pushed to `priceHistory`, article is saved.
9. If OCR fails or finds no price, user can enter the price manually.

## OCR Price Extraction

New utility: `src/utils/ocrPrice.js`

**API integration:**
- Google Cloud Vision REST API: `POST https://vision.googleapis.com/v1/images:annotate`
- Feature: `TEXT_DETECTION`
- API key from environment variable `VITE_GOOGLE_VISION_API_KEY`
- Image sent as base64-encoded JPEG from canvas capture

**Price regex patterns** (Austrian/German format):
- `€ 2,49` or `€2,49`
- `2,49 €` or `2,49€`
- `EUR 2,49`
- `2.49` (dot decimal fallback)

**Extraction logic:**
1. Find all price-pattern matches in OCR text.
2. If exactly one match: return it.
3. If multiple matches: return all candidates, let user choose/confirm.
4. If no matches: prompt manual entry.

## Barcode Scanner Changes

The existing `BarcodeScanner.vue` is extended:
- Confirmation popup gets a new optional price input field (numeric, `€`).
- `scanned` event emits `{ name, barcode, price }` instead of just the product name.
- `ArticleListView.onBarcodeScanned()` passes `barcode` and `price` through to `createArticle()`.
- No automatic price lookup from barcode — prices vary by store.

## UI Changes

### Article list items
- Price displayed after quantity/unit: `Milch · 2 l · € 2,49`
- Camera icon button for price tag scanning (alongside edit/hide buttons)
- Price trend indicator: **↑** (red) if latest price > previous, **↓** (green) if lower, nothing if no history or first entry

### List total
- Sticky footer bar at bottom of article list: `Gesamt: € 23,47`
- Calculated as `sum(price × quantity)` for all visible, non-hidden articles that have a price
- Articles without a price are excluded from the total

### Create/Edit modal
- New optional field "Preis (€)" after the unit field
- Numeric input, `step="0.01"`, placeholder `z.B. 2,49`

### Price history
- Tapping the price on an article expands a small section showing past prices with dates
- Format: `10.03.2026: € 2,29`

### Price tag scanner modal (`PriceTagScanner.vue`)
- Full-screen camera view with capture button
- After capture: shows extracted price with confirm/edit option
- Visual style consistent with existing `BarcodeScanner.vue`

## Store Changes

`src/stores/article.js`:

- `createArticle(listId, name, quantity, unit, note, price, barcode)` — accepts optional `price` and `barcode` params, defaults to `null`. Initializes `priceHistory` as `[]`.
- `updateArticle(listId, article)` — no change needed, already saves the full document.
- **New action:** `updatePrice(listId, article, newPrice)` — if `newPrice` differs from `article.price`, pushes `{ price: article.price, scannedAt: new Date().toISOString() }` to `priceHistory`, sets `article.price = newPrice`, then saves.

## File Changes

| File | Type | Description |
|------|------|-------------|
| `src/stores/article.js` | Modified | Add `price`, `barcode`, `priceHistory` to create; new `updatePrice` action |
| `src/db/seedData.js` | Modified | Add `price`, `barcode`, `priceHistory` fields to seed articles |
| `src/views/ArticleListView.vue` | Modified | Price display, total footer, camera button, price history, price in create/edit modals |
| `src/views/BarcodeScanner.vue` | Modified | Optional price input in confirmation popup; emit `{ name, barcode, price }` |
| `src/views/PriceTagScanner.vue` | New | Camera capture, Google Vision API call, price confirmation/edit |
| `src/utils/ocrPrice.js` | New | Google Vision API call + Austrian price regex extraction |
| `tests/unit/article.store.cy.js` | Modified | Tests for `updatePrice` action and price history logic |
| `tests/unit/ArticleListView.cy.js` | Modified | Tests for price display, total calculation, scanner trigger |

**No changes to:** router, db/index.js, App.vue, HomeView.vue, nginx.conf, Dockerfile

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_VISION_API_KEY` | Google Cloud Vision API key for OCR price tag scanning |
