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
  priceHistory: [             // array — past price entries, ordered chronologically
    { price: 2.29, setAt: '2026-03-10T14:30:00.000Z' },
    { price: 2.49, setAt: '2026-03-19T09:15:00.000Z' },
  ]
}
```

Rules:
- `price` is always the latest/current price.
- When a new price is set, a `priceHistory` entry is created with the **new** price and the timestamp when it was observed (`setAt`). An entry is only added when the new price differs from the current price.
- Prices are stored as numbers, always EUR, formatted as `€ X,XX` (comma decimal) in the UI.
- `barcode` is stored for product re-identification.
- `priceHistory` defaults to an empty array. Capped at 20 entries (oldest are pruned).
- `price` and `barcode` default to `null`.

## Price Tag Scanning Flow

1. User taps camera icon button on an article in the list.
2. `PriceTagScanner.vue` opens as a full-screen camera modal.
3. User points camera at the shelf price tag and taps a capture button.
4. **Offline check:** if the device is offline, skip the API call and go directly to manual entry (step 7).
5. Captured image is resized to max 1280px longest edge, encoded as JPEG (quality 0.8), and sent to Google Cloud Vision API (`TEXT_DETECTION`).
6. Returned text is parsed for Austrian price patterns (see OCR Price Extraction).
7. Extracted price is shown in a confirmation popup: "Milch — € 2,49. Übernehmen?" User can confirm or manually correct the price. If no price was extracted, the field is empty for manual entry.
8. On confirm: `updatePrice(listId, article, newPrice)` is called which handles history.
9. If the API call fails, fall back to manual entry.

## OCR Price Extraction

New utility: `src/utils/ocrPrice.js`

**API integration:**
- Google Cloud Vision REST API: `POST https://vision.googleapis.com/v1/images:annotate`
- Feature: `TEXT_DETECTION`
- API key from environment variable `VITE_GOOGLE_VISION_API_KEY`
- Image sent as base64-encoded JPEG from canvas capture (max 1280px, quality 0.8)
- **Security:** The API key is embedded in the client bundle (`VITE_` prefix). It must have HTTP referrer restrictions configured in Google Cloud Console.

**Price regex patterns** (Austrian/German format):
- `€ 2,49` or `€2,49`
- `2,49 €` or `2,49€`
- `EUR 2,49`
- `2.49` (dot decimal fallback — only used if no currency-symbol match found)

**Extraction logic:**
1. Find all price-pattern matches in OCR text.
2. Filter to reasonable range: `0.01 – 999.99`.
3. If exactly one match: return it.
4. If multiple matches: return all candidates for user selection (radio buttons in the confirmation popup).
5. If no matches: prompt manual entry.

## Barcode Scanner Changes

The existing `BarcodeScanner.vue` is extended:

**`lookupProduct` return shape changes** from `{ name, per100g }` to `{ name, barcode, per100g }` — the raw barcode string is included in the result.

**Confirmation popup** gets a new optional price input field (numeric, `€`) below the nutrition info.

**`scanned` event** changes from emitting a plain string (`name`) to emitting an object: `{ name, barcode, price }`. `price` is `null` if the user doesn't enter one.

**`ArticleListView.onBarcodeScanned`** must be updated to destructure the new payload:
```js
// Before: onBarcodeScanned(value) { newName.value = value }
// After:  onBarcodeScanned({ name, barcode, price }) { newName.value = name; newBarcode.value = barcode; newPrice.value = price }
```

No automatic price lookup from barcode — prices vary by store.

## UI Changes

### Article list items
- Price displayed after quantity/unit: `Milch · 2 l · € 2,49`
- Camera icon button for price tag scanning (alongside edit/hide buttons)
- Price trend indicator: **↑** (red) if latest price > previous, **↓** (green) if lower, nothing if no history or first entry

### List total
- Sticky footer bar at bottom of article list: `Gesamt: € 23,47`
- Calculated as `sum(price × quantity)` for all visible, non-hidden, **unchecked** articles that have a price
- Checked (already purchased) articles are excluded — the total shows what's left to buy
- Articles without a price are excluded from the total

### Create/Edit modal
- New optional field "Preis (€)" after the unit field
- Numeric input, `step="0.01"`, placeholder `z.B. 2,49`

### Price history
- Tapping the price on an article expands a small section showing past prices with dates
- Format: `10.03.2026: € 2,29`
- Shows most recent 20 entries

### Price tag scanner modal (`PriceTagScanner.vue`)
- Full-screen camera view with capture button
- After capture: shows extracted price with confirm/edit option
- If multiple prices detected: radio button selection
- Visual style consistent with existing `BarcodeScanner.vue`

## Store Changes

`src/stores/article.js`:

Refactor `createArticle` to use an options object instead of positional parameters:

```js
// Before: createArticle(listId, name, quantity, unit, note)
// After:  createArticle(listId, { name, quantity, unit, note, price, barcode })
```

This avoids a fragile 7-parameter signature. All existing call sites (`submitCreate` in ArticleListView, `addFromSearch` in the store) must be updated.

- `createArticle(listId, { name, quantity, unit, note, price, barcode })` — `price` and `barcode` default to `null`. Initializes `priceHistory` as `[]`. Also sets `hidden: false` explicitly.
- `updateArticle(listId, article)` — no change needed, already saves the full document.
- `addFromSearch(currentListId, article)` — updated to pass `barcode` through to `createArticle`. Price is **not** copied (prices vary by store).
- **New action:** `updatePrice(listId, article, newPrice)` — if `newPrice` differs from `article.price`: pushes `{ price: newPrice, setAt: new Date().toISOString() }` to `priceHistory` (pruned to last 20 entries), sets `article.price = newPrice`, then saves.

## File Changes

| File | Type | Description |
|------|------|-------------|
| `src/stores/article.js` | Modified | Refactor `createArticle` to options object; add `price`, `barcode`, `priceHistory`; update `addFromSearch`; new `updatePrice` action |
| `src/db/seedData.js` | Modified | Add `price`, `barcode`, `priceHistory`, `note` fields to seed articles |
| `src/views/ArticleListView.vue` | Modified | Price display, total footer, camera button, price history, price in create/edit modals, update `onBarcodeScanned` handler |
| `src/views/BarcodeScanner.vue` | Modified | Include barcode in `lookupProduct` result; optional price input in confirmation popup; emit `{ name, barcode, price }` |
| `src/views/PriceTagScanner.vue` | New | Camera capture, Google Vision API call, price confirmation/edit, offline fallback |
| `src/utils/ocrPrice.js` | New | Google Vision API call + Austrian price regex extraction + range filtering |
| `tests/unit/article.store.cy.js` | Modified | Tests for `updatePrice` action, price history logic, options object API |
| `tests/unit/ArticleListView.cy.js` | Modified | Tests for price display, total calculation, scanner trigger |
| `tests/unit/ocrPrice.cy.js` | New | Tests for price regex patterns, multi-match, edge cases, range filtering |

**No changes to:** router, db/index.js, App.vue, HomeView.vue, nginx.conf, Dockerfile

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VITE_GOOGLE_VISION_API_KEY` | Google Cloud Vision API key for OCR price tag scanning. Must have HTTP referrer restrictions in Google Cloud Console. |
