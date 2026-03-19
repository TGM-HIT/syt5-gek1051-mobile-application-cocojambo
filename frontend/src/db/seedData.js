export const seedLists = [
  {
    _id: 'seed-list-1',
    type: 'list',
    name: 'Wocheneinkauf',
    category: 'Lebensmittel',
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    _id: 'seed-list-2',
    type: 'list',
    name: 'Baumarkt',
    category: 'Haushalt',
    createdAt: '2024-01-12T10:00:00.000Z',
  },
  {
    _id: 'seed-list-3',
    type: 'list',
    name: 'Apotheke',
    category: 'Gesundheit',
    createdAt: '2024-01-15T09:00:00.000Z',
  },
]

export const seedArticles = [
  // Wocheneinkauf
  { _id: 'seed-article-1',  type: 'article', listId: 'seed-list-1', name: 'Milch',        quantity: 2,   unit: 'l',   note: '', price: 1.49,  barcode: '9001234567890', priceHistory: [{ price: 1.29, setAt: '2024-01-05T10:00:00.000Z' }, { price: 1.49, setAt: '2024-01-10T08:01:00.000Z' }], checked: false, hidden: false, createdAt: '2024-01-10T08:01:00.000Z' },
  { _id: 'seed-article-2',  type: 'article', listId: 'seed-list-1', name: 'Brot',         quantity: 1,   unit: '',    note: '', price: 3.29,  barcode: null, priceHistory: [], checked: true,  hidden: false, createdAt: '2024-01-10T08:02:00.000Z' },
  { _id: 'seed-article-3',  type: 'article', listId: 'seed-list-1', name: 'Butter',       quantity: 250, unit: 'g',   note: '', price: 2.79,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:03:00.000Z' },
  { _id: 'seed-article-4',  type: 'article', listId: 'seed-list-1', name: 'Eier',         quantity: 10,  unit: 'St',  note: '', price: 3.99,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:04:00.000Z' },
  { _id: 'seed-article-5',  type: 'article', listId: 'seed-list-1', name: 'Äpfel',        quantity: 1,   unit: 'kg',  note: '', price: 2.49,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:05:00.000Z' },
  { _id: 'seed-article-6',  type: 'article', listId: 'seed-list-1', name: 'Joghurt',      quantity: 3,   unit: 'St',  note: '', price: 0.79,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-10T08:06:00.000Z' },
  { _id: 'seed-article-7',  type: 'article', listId: 'seed-list-1', name: 'Käse',         quantity: 200, unit: 'g',   note: '', price: 4.49,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-10T08:07:00.000Z' },

  // Baumarkt
  { _id: 'seed-article-8',  type: 'article', listId: 'seed-list-2', name: 'Schrauben',    quantity: 50,  unit: 'St',  note: '', price: 5.99,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:01:00.000Z' },
  { _id: 'seed-article-9',  type: 'article', listId: 'seed-list-2', name: 'Dübel',        quantity: 20,  unit: 'St',  note: '', price: 3.49,  barcode: null, priceHistory: [], checked: true,  hidden: false, createdAt: '2024-01-12T10:02:00.000Z' },
  { _id: 'seed-article-10', type: 'article', listId: 'seed-list-2', name: 'Farbe weiß',   quantity: 2,   unit: 'l',   note: '', price: 24.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:03:00.000Z' },
  { _id: 'seed-article-11', type: 'article', listId: 'seed-list-2', name: 'Pinsel',       quantity: 2,   unit: 'St',  note: '', price: null,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:04:00.000Z' },

  // Apotheke
  { _id: 'seed-article-12', type: 'article', listId: 'seed-list-3', name: 'Ibuprofen',    quantity: 1,   unit: 'Pkg', note: '', price: 6.90,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:01:00.000Z' },
  { _id: 'seed-article-13', type: 'article', listId: 'seed-list-3', name: 'Pflaster',     quantity: 1,   unit: 'Pkg', note: '', price: 3.49,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:02:00.000Z' },
  { _id: 'seed-article-14', type: 'article', listId: 'seed-list-3', name: 'Milch (H-Milch)', quantity: 6, unit: 'St', note: '', price: null,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:03:00.000Z' },
  { _id: 'seed-article-15', type: 'article', listId: 'seed-list-3', name: 'Vitamin C',    quantity: 1,   unit: 'Pkg', note: '', price: 8.99,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-15T09:04:00.000Z' },
]
