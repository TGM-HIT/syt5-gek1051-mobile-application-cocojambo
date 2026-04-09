import { getUsername } from './index.js'

export function getSeedLists() {
  const username = getUsername()
  return [
    {
      _id: 'seed-list-1',
      type: 'list',
      name: 'Wocheneinkauf',
      category: 'Lebensmittel',
      members: [username],
      shareCode: 'WCH3NK',
      createdAt: '2024-01-10T08:00:00.000Z',
    },
    {
      _id: 'seed-list-2',
      type: 'list',
      name: 'Baumarkt',
      category: 'Haushalt',
      members: [username],
      shareCode: 'BAU4MK',
      createdAt: '2024-01-12T10:00:00.000Z',
    },
    {
      _id: 'seed-list-3',
      type: 'list',
      name: 'Apotheke',
      category: 'Gesundheit',
      members: [username],
      shareCode: 'APT3KE',
      createdAt: '2024-01-15T09:00:00.000Z',
    },
    {
      _id: 'seed-list-spar',
      type: 'list',
      name: 'SPAR Preisliste',
      category: 'Preisvergleich',
      members: [username],
      shareCode: 'SPR4LT',
      createdAt: '2024-02-01T08:00:00.000Z',
    },
    {
      _id: 'seed-list-billa',
      type: 'list',
      name: 'Billa Preisliste',
      category: 'Preisvergleich',
      members: [username],
      shareCode: 'BLL4PL',
      createdAt: '2024-02-01T09:00:00.000Z',
    },
    {
      _id: 'seed-list-hofer',
      type: 'list',
      name: 'Hofer Preisliste',
      category: 'Preisvergleich',
      members: [username],
      shareCode: 'HFR4PL',
      createdAt: '2024-02-01T10:00:00.000Z',
    },
    {
      _id: 'seed-list-lidl',
      type: 'list',
      name: 'Lidl Preisliste',
      category: 'Preisvergleich',
      members: [username],
      shareCode: 'LDL4PL',
      createdAt: '2024-02-01T11:00:00.000Z',
    },
  ]
}

export const seedArticles = [
  // ── Wocheneinkauf ──
  { _id: 'seed-article-1',  type: 'article', listId: 'seed-list-1', name: 'Milch',        quantity: 2,   unit: 'l',   note: '', tag: 'Milchprodukte',    price: 1.49,  barcode: '9001234567890', priceHistory: [{ price: 1.29, setAt: '2024-01-05T10:00:00.000Z' }, { price: 1.49, setAt: '2024-01-10T08:01:00.000Z' }], checked: false, hidden: false, createdAt: '2024-01-10T08:01:00.000Z' },
  { _id: 'seed-article-2',  type: 'article', listId: 'seed-list-1', name: 'Brot',         quantity: 1,   unit: '',    note: '', tag: 'Backwaren',        price: 3.29,  barcode: null, priceHistory: [], checked: true,  hidden: false, createdAt: '2024-01-10T08:02:00.000Z' },
  { _id: 'seed-article-3',  type: 'article', listId: 'seed-list-1', name: 'Butter',       quantity: 250, unit: 'g',   note: '', tag: 'Milchprodukte',    price: 2.79,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:03:00.000Z' },
  { _id: 'seed-article-4',  type: 'article', listId: 'seed-list-1', name: 'Eier',         quantity: 10,  unit: 'St',  note: '', tag: 'Milchprodukte',    price: 3.99,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:04:00.000Z' },
  { _id: 'seed-article-5',  type: 'article', listId: 'seed-list-1', name: 'Äpfel',        quantity: 1,   unit: 'kg',  note: '', tag: 'Obst & Gemüse',    price: 2.49,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-10T08:05:00.000Z' },
  { _id: 'seed-article-6',  type: 'article', listId: 'seed-list-1', name: 'Joghurt',      quantity: 3,   unit: 'St',  note: '', tag: 'Milchprodukte',    price: 0.79,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-10T08:06:00.000Z' },
  { _id: 'seed-article-7',  type: 'article', listId: 'seed-list-1', name: 'Käse',         quantity: 200, unit: 'g',   note: '', tag: 'Milchprodukte',    price: 4.49,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-10T08:07:00.000Z' },

  // ── Baumarkt ──
  { _id: 'seed-article-8',  type: 'article', listId: 'seed-list-2', name: 'Schrauben',    quantity: 50,  unit: 'St',  note: '', price: 5.99,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:01:00.000Z' },
  { _id: 'seed-article-9',  type: 'article', listId: 'seed-list-2', name: 'Dübel',        quantity: 20,  unit: 'St',  note: '', price: 3.49,  barcode: null, priceHistory: [], checked: true,  hidden: false, createdAt: '2024-01-12T10:02:00.000Z' },
  { _id: 'seed-article-10', type: 'article', listId: 'seed-list-2', name: 'Farbe weiß',   quantity: 2,   unit: 'l',   note: '', price: 24.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:03:00.000Z' },
  { _id: 'seed-article-11', type: 'article', listId: 'seed-list-2', name: 'Pinsel',       quantity: 2,   unit: 'St',  note: '', price: null,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-12T10:04:00.000Z' },

  // ── Apotheke ──
  { _id: 'seed-article-12', type: 'article', listId: 'seed-list-3', name: 'Ibuprofen',    quantity: 1,   unit: 'Pkg', note: '', price: 6.90,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:01:00.000Z' },
  { _id: 'seed-article-13', type: 'article', listId: 'seed-list-3', name: 'Pflaster',     quantity: 1,   unit: 'Pkg', note: '', price: 3.49,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:02:00.000Z' },
  { _id: 'seed-article-14', type: 'article', listId: 'seed-list-3', name: 'Milch (H-Milch)', quantity: 6, unit: 'St', note: '', price: null,  barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-01-15T09:03:00.000Z' },
  { _id: 'seed-article-15', type: 'article', listId: 'seed-list-3', name: 'Vitamin C',    quantity: 1,   unit: 'Pkg', note: '', price: 8.99,  barcode: null, priceHistory: [], checked: false, hidden: true,  createdAt: '2024-01-15T09:04:00.000Z' },

  // ══════════════════════════════════════════════════════════════
  // SPAR Preisliste – Preise Stand März 2026
  // ══════════════════════════════════════════════════════════════
  { _id: 'seed-spar-1',  type: 'article', listId: 'seed-list-spar', name: 'Vollmilch 3,5%',         quantity: 1, unit: 'l',   note: 'SPAR Eigenmarke',         price: 1.39, barcode: '9001100102345', priceHistory: [{ price: 1.29, setAt: '2024-06-01T00:00:00.000Z' }, { price: 1.39, setAt: '2024-12-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T08:01:00.000Z' },
  { _id: 'seed-spar-2',  type: 'article', listId: 'seed-list-spar', name: 'Butter',                 quantity: 250, unit: 'g', note: 'SPAR Natur*pur',          price: 2.99, barcode: '9001100204567', priceHistory: [{ price: 2.79, setAt: '2024-06-01T00:00:00.000Z' }, { price: 2.99, setAt: '2025-01-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T08:02:00.000Z' },
  { _id: 'seed-spar-3',  type: 'article', listId: 'seed-list-spar', name: 'Eier Freiland',          quantity: 10, unit: 'St', note: 'SPAR Natur*pur Bio',       price: 4.49, barcode: '9001100306789', priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:03:00.000Z' },
  { _id: 'seed-spar-4',  type: 'article', listId: 'seed-list-spar', name: 'Toastbrot',              quantity: 1, unit: 'Pkg', note: 'SPAR Sandwich Toast',      price: 1.69, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:04:00.000Z' },
  { _id: 'seed-spar-5',  type: 'article', listId: 'seed-list-spar', name: 'Emmentaler',             quantity: 200, unit: 'g', note: 'SPAR Eigenmarke',          price: 3.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:05:00.000Z' },
  { _id: 'seed-spar-6',  type: 'article', listId: 'seed-list-spar', name: 'Spaghetti',              quantity: 500, unit: 'g', note: 'SPAR Eigenmarke',          price: 1.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:06:00.000Z' },
  { _id: 'seed-spar-7',  type: 'article', listId: 'seed-list-spar', name: 'Passierte Tomaten',      quantity: 500, unit: 'g', note: 'SPAR Eigenmarke',          price: 1.19, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:07:00.000Z' },
  { _id: 'seed-spar-8',  type: 'article', listId: 'seed-list-spar', name: 'Olivenöl extra vergine', quantity: 500, unit: 'ml', note: 'SPAR PREMIUM',            price: 6.99, barcode: null, priceHistory: [{ price: 5.99, setAt: '2024-03-01T00:00:00.000Z' }, { price: 6.99, setAt: '2024-09-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T08:08:00.000Z' },
  { _id: 'seed-spar-9',  type: 'article', listId: 'seed-list-spar', name: 'Bananen',                quantity: 1, unit: 'kg',  note: '',                         price: 1.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:09:00.000Z' },
  { _id: 'seed-spar-10', type: 'article', listId: 'seed-list-spar', name: 'Äpfel Golden Delicious', quantity: 1, unit: 'kg',  note: 'aus Österreich',           price: 2.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:10:00.000Z' },
  { _id: 'seed-spar-11', type: 'article', listId: 'seed-list-spar', name: 'Karotten',               quantity: 1, unit: 'kg',  note: 'aus Österreich',           price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:11:00.000Z' },
  { _id: 'seed-spar-12', type: 'article', listId: 'seed-list-spar', name: 'Zwiebeln',               quantity: 1, unit: 'kg',  note: '',                         price: 1.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:12:00.000Z' },
  { _id: 'seed-spar-13', type: 'article', listId: 'seed-list-spar', name: 'Kartoffeln festkochend', quantity: 2, unit: 'kg',  note: 'aus Österreich',           price: 2.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:13:00.000Z' },
  { _id: 'seed-spar-14', type: 'article', listId: 'seed-list-spar', name: 'Naturjoghurt 3,6%',      quantity: 500, unit: 'g', note: 'SPAR Natur*pur',           price: 1.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:14:00.000Z' },
  { _id: 'seed-spar-15', type: 'article', listId: 'seed-list-spar', name: 'Mineralwasser',          quantity: 6, unit: 'x 1,5l', note: 'SPAR Eigenmarke',       price: 3.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:15:00.000Z' },
  { _id: 'seed-spar-16', type: 'article', listId: 'seed-list-spar', name: 'Hühnerbrust',            quantity: 400, unit: 'g', note: 'SPAR Natur*pur',           price: 7.49, barcode: null, priceHistory: [{ price: 6.99, setAt: '2024-06-01T00:00:00.000Z' }, { price: 7.49, setAt: '2025-02-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T08:16:00.000Z' },
  { _id: 'seed-spar-17', type: 'article', listId: 'seed-list-spar', name: 'Faschiertes gemischt',   quantity: 500, unit: 'g', note: '',                         price: 5.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:17:00.000Z' },
  { _id: 'seed-spar-18', type: 'article', listId: 'seed-list-spar', name: 'Mehl glatt',             quantity: 1, unit: 'kg',  note: 'SPAR Eigenmarke',          price: 1.19, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:18:00.000Z' },
  { _id: 'seed-spar-19', type: 'article', listId: 'seed-list-spar', name: 'Zucker',                 quantity: 1, unit: 'kg',  note: 'Wiener Zucker',            price: 1.39, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:19:00.000Z' },
  { _id: 'seed-spar-20', type: 'article', listId: 'seed-list-spar', name: 'Kaffee gemahlen',        quantity: 500, unit: 'g', note: 'Julius Meinl',             price: 6.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T08:20:00.000Z' },

  // ══════════════════════════════════════════════════════════════
  // Billa Preisliste – Preise Stand März 2026
  // ══════════════════════════════════════════════════════════════
  { _id: 'seed-billa-1',  type: 'article', listId: 'seed-list-billa', name: 'Vollmilch 3,5%',         quantity: 1, unit: 'l',   note: 'Clever',                  price: 1.29, barcode: '9002200102345', priceHistory: [{ price: 1.19, setAt: '2024-06-01T00:00:00.000Z' }, { price: 1.29, setAt: '2024-12-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T09:01:00.000Z' },
  { _id: 'seed-billa-2',  type: 'article', listId: 'seed-list-billa', name: 'Butter',                 quantity: 250, unit: 'g', note: 'Clever',                  price: 2.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:02:00.000Z' },
  { _id: 'seed-billa-3',  type: 'article', listId: 'seed-list-billa', name: 'Eier Bodenhaltung',      quantity: 10, unit: 'St', note: 'Clever',                  price: 3.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:03:00.000Z' },
  { _id: 'seed-billa-4',  type: 'article', listId: 'seed-list-billa', name: 'Toastbrot',              quantity: 1, unit: 'Pkg', note: 'Ölz Buttertoast',         price: 2.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:04:00.000Z' },
  { _id: 'seed-billa-5',  type: 'article', listId: 'seed-list-billa', name: 'Gouda',                  quantity: 200, unit: 'g', note: 'Clever',                  price: 2.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:05:00.000Z' },
  { _id: 'seed-billa-6',  type: 'article', listId: 'seed-list-billa', name: 'Spaghetti',              quantity: 500, unit: 'g', note: 'Barilla',                 price: 1.99, barcode: null, priceHistory: [{ price: 1.79, setAt: '2024-06-01T00:00:00.000Z' }, { price: 1.99, setAt: '2025-01-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T09:06:00.000Z' },
  { _id: 'seed-billa-7',  type: 'article', listId: 'seed-list-billa', name: 'Passierte Tomaten',      quantity: 500, unit: 'g', note: 'Mutti',                   price: 1.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:07:00.000Z' },
  { _id: 'seed-billa-8',  type: 'article', listId: 'seed-list-billa', name: 'Olivenöl extra vergine', quantity: 500, unit: 'ml', note: 'Bertolli',               price: 7.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:08:00.000Z' },
  { _id: 'seed-billa-9',  type: 'article', listId: 'seed-list-billa', name: 'Bananen',                quantity: 1, unit: 'kg',  note: '',                        price: 1.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:09:00.000Z' },
  { _id: 'seed-billa-10', type: 'article', listId: 'seed-list-billa', name: 'Äpfel Gala',             quantity: 1, unit: 'kg',  note: 'aus Österreich',          price: 2.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:10:00.000Z' },
  { _id: 'seed-billa-11', type: 'article', listId: 'seed-list-billa', name: 'Karotten',               quantity: 1, unit: 'kg',  note: 'aus Österreich',          price: 1.69, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:11:00.000Z' },
  { _id: 'seed-billa-12', type: 'article', listId: 'seed-list-billa', name: 'Zwiebeln',               quantity: 1, unit: 'kg',  note: '',                        price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:12:00.000Z' },
  { _id: 'seed-billa-13', type: 'article', listId: 'seed-list-billa', name: 'Kartoffeln festkochend', quantity: 2, unit: 'kg',  note: 'aus Österreich',          price: 3.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:13:00.000Z' },
  { _id: 'seed-billa-14', type: 'article', listId: 'seed-list-billa', name: 'Naturjoghurt 3,6%',      quantity: 500, unit: 'g', note: 'NÖM',                    price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:14:00.000Z' },
  { _id: 'seed-billa-15', type: 'article', listId: 'seed-list-billa', name: 'Mineralwasser',          quantity: 6, unit: 'x 1,5l', note: 'Vöslauer',            price: 4.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:15:00.000Z' },
  { _id: 'seed-billa-16', type: 'article', listId: 'seed-list-billa', name: 'Hühnerbrust',            quantity: 400, unit: 'g', note: '',                        price: 7.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:16:00.000Z' },
  { _id: 'seed-billa-17', type: 'article', listId: 'seed-list-billa', name: 'Faschiertes gemischt',   quantity: 500, unit: 'g', note: '',                        price: 5.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:17:00.000Z' },
  { _id: 'seed-billa-18', type: 'article', listId: 'seed-list-billa', name: 'Mehl glatt',             quantity: 1, unit: 'kg',  note: 'Fini\'s Feinstes',        price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:18:00.000Z' },
  { _id: 'seed-billa-19', type: 'article', listId: 'seed-list-billa', name: 'Zucker',                 quantity: 1, unit: 'kg',  note: 'Wiener Zucker',           price: 1.39, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:19:00.000Z' },
  { _id: 'seed-billa-20', type: 'article', listId: 'seed-list-billa', name: 'Kaffee gemahlen',        quantity: 500, unit: 'g', note: 'Julius Meinl Jubiläum',   price: 6.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T09:20:00.000Z' },

  // ══════════════════════════════════════════════════════════════
  // Hofer Preisliste – Preise Stand März 2026
  // ══════════════════════════════════════════════════════════════
  { _id: 'seed-hofer-1',  type: 'article', listId: 'seed-list-hofer', name: 'Vollmilch 3,5%',         quantity: 1, unit: 'l',   note: 'Milfina',                 price: 1.15, barcode: '9003300102345', priceHistory: [{ price: 1.09, setAt: '2024-06-01T00:00:00.000Z' }, { price: 1.15, setAt: '2024-12-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T10:01:00.000Z' },
  { _id: 'seed-hofer-2',  type: 'article', listId: 'seed-list-hofer', name: 'Butter',                 quantity: 250, unit: 'g', note: 'Milfina',                 price: 2.39, barcode: null, priceHistory: [{ price: 2.19, setAt: '2024-06-01T00:00:00.000Z' }, { price: 2.39, setAt: '2025-01-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T10:02:00.000Z' },
  { _id: 'seed-hofer-3',  type: 'article', listId: 'seed-list-hofer', name: 'Eier Bodenhaltung',      quantity: 10, unit: 'St', note: 'Goldland',                price: 2.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:03:00.000Z' },
  { _id: 'seed-hofer-4',  type: 'article', listId: 'seed-list-hofer', name: 'Toastbrot',              quantity: 1, unit: 'Pkg', note: 'Ölz',                     price: 1.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:04:00.000Z' },
  { _id: 'seed-hofer-5',  type: 'article', listId: 'seed-list-hofer', name: 'Emmentaler',             quantity: 200, unit: 'g', note: 'Milfina',                 price: 2.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:05:00.000Z' },
  { _id: 'seed-hofer-6',  type: 'article', listId: 'seed-list-hofer', name: 'Spaghetti',              quantity: 500, unit: 'g', note: 'Cucina',                  price: 0.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:06:00.000Z' },
  { _id: 'seed-hofer-7',  type: 'article', listId: 'seed-list-hofer', name: 'Passierte Tomaten',      quantity: 500, unit: 'g', note: 'Cucina',                  price: 0.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:07:00.000Z' },
  { _id: 'seed-hofer-8',  type: 'article', listId: 'seed-list-hofer', name: 'Olivenöl extra vergine', quantity: 500, unit: 'ml', note: 'Cucina',                 price: 4.99, barcode: null, priceHistory: [{ price: 4.49, setAt: '2024-03-01T00:00:00.000Z' }, { price: 4.99, setAt: '2024-09-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T10:08:00.000Z' },
  { _id: 'seed-hofer-9',  type: 'article', listId: 'seed-list-hofer', name: 'Bananen',                quantity: 1, unit: 'kg',  note: '',                        price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:09:00.000Z' },
  { _id: 'seed-hofer-10', type: 'article', listId: 'seed-list-hofer', name: 'Äpfel Golden Delicious', quantity: 1, unit: 'kg',  note: 'aus Österreich',          price: 1.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:10:00.000Z' },
  { _id: 'seed-hofer-11', type: 'article', listId: 'seed-list-hofer', name: 'Karotten',               quantity: 1, unit: 'kg',  note: 'aus Österreich',          price: 1.19, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:11:00.000Z' },
  { _id: 'seed-hofer-12', type: 'article', listId: 'seed-list-hofer', name: 'Zwiebeln',               quantity: 1, unit: 'kg',  note: '',                        price: 0.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:12:00.000Z' },
  { _id: 'seed-hofer-13', type: 'article', listId: 'seed-list-hofer', name: 'Kartoffeln festkochend', quantity: 2, unit: 'kg',  note: 'aus Österreich',          price: 2.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:13:00.000Z' },
  { _id: 'seed-hofer-14', type: 'article', listId: 'seed-list-hofer', name: 'Naturjoghurt 3,6%',      quantity: 500, unit: 'g', note: 'Milfina',                 price: 0.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:14:00.000Z' },
  { _id: 'seed-hofer-15', type: 'article', listId: 'seed-list-hofer', name: 'Mineralwasser',          quantity: 6, unit: 'x 1,5l', note: 'Juvina',              price: 2.39, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:15:00.000Z' },
  { _id: 'seed-hofer-16', type: 'article', listId: 'seed-list-hofer', name: 'Hühnerbrust',            quantity: 400, unit: 'g', note: '',                        price: 5.99, barcode: null, priceHistory: [{ price: 5.49, setAt: '2024-06-01T00:00:00.000Z' }, { price: 5.99, setAt: '2025-02-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T10:16:00.000Z' },
  { _id: 'seed-hofer-17', type: 'article', listId: 'seed-list-hofer', name: 'Faschiertes gemischt',   quantity: 500, unit: 'g', note: '',                        price: 4.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:17:00.000Z' },
  { _id: 'seed-hofer-18', type: 'article', listId: 'seed-list-hofer', name: 'Mehl glatt',             quantity: 1, unit: 'kg',  note: 'Goldähren',               price: 0.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:18:00.000Z' },
  { _id: 'seed-hofer-19', type: 'article', listId: 'seed-list-hofer', name: 'Zucker',                 quantity: 1, unit: 'kg',  note: 'Wiener Zucker',           price: 1.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:19:00.000Z' },
  { _id: 'seed-hofer-20', type: 'article', listId: 'seed-list-hofer', name: 'Kaffee gemahlen',        quantity: 500, unit: 'g', note: 'Markus',                  price: 4.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T10:20:00.000Z' },

  // ══════════════════════════════════════════════════════════════
  // Lidl Preisliste – Preise Stand März 2026
  // ══════════════════════════════════════════════════════════════
  { _id: 'seed-lidl-1',  type: 'article', listId: 'seed-list-lidl', name: 'Vollmilch 3,5%',         quantity: 1, unit: 'l',   note: 'Milbona',                  price: 1.19, barcode: '9004400102345', priceHistory: [{ price: 1.09, setAt: '2024-06-01T00:00:00.000Z' }, { price: 1.19, setAt: '2024-12-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T11:01:00.000Z' },
  { _id: 'seed-lidl-2',  type: 'article', listId: 'seed-list-lidl', name: 'Butter',                 quantity: 250, unit: 'g', note: 'Milbona',                  price: 2.45, barcode: null, priceHistory: [{ price: 2.29, setAt: '2024-06-01T00:00:00.000Z' }, { price: 2.45, setAt: '2025-01-01T00:00:00.000Z' }], checked: false, hidden: false, createdAt: '2024-02-01T11:02:00.000Z' },
  { _id: 'seed-lidl-3',  type: 'article', listId: 'seed-list-lidl', name: 'Eier Bodenhaltung',      quantity: 10, unit: 'St', note: 'Coop',                     price: 2.89, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:03:00.000Z' },
  { _id: 'seed-lidl-4',  type: 'article', listId: 'seed-list-lidl', name: 'Toastbrot',              quantity: 1, unit: 'Pkg', note: 'Grafschafter',             price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:04:00.000Z' },
  { _id: 'seed-lidl-5',  type: 'article', listId: 'seed-list-lidl', name: 'Gouda',                  quantity: 200, unit: 'g', note: 'Milbona',                  price: 2.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:05:00.000Z' },
  { _id: 'seed-lidl-6',  type: 'article', listId: 'seed-list-lidl', name: 'Spaghetti',              quantity: 500, unit: 'g', note: 'Combino',                  price: 0.85, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:06:00.000Z' },
  { _id: 'seed-lidl-7',  type: 'article', listId: 'seed-list-lidl', name: 'Passierte Tomaten',      quantity: 500, unit: 'g', note: 'Baresa',                   price: 0.85, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:07:00.000Z' },
  { _id: 'seed-lidl-8',  type: 'article', listId: 'seed-list-lidl', name: 'Olivenöl extra vergine', quantity: 500, unit: 'ml', note: 'Primadonna',              price: 4.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:08:00.000Z' },
  { _id: 'seed-lidl-9',  type: 'article', listId: 'seed-list-lidl', name: 'Bananen',                quantity: 1, unit: 'kg',  note: '',                         price: 1.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:09:00.000Z' },
  { _id: 'seed-lidl-10', type: 'article', listId: 'seed-list-lidl', name: 'Äpfel Gala',             quantity: 1, unit: 'kg',  note: 'aus Österreich',           price: 2.19, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:10:00.000Z' },
  { _id: 'seed-lidl-11', type: 'article', listId: 'seed-list-lidl', name: 'Karotten',               quantity: 1, unit: 'kg',  note: 'aus Österreich',           price: 1.15, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:11:00.000Z' },
  { _id: 'seed-lidl-12', type: 'article', listId: 'seed-list-lidl', name: 'Zwiebeln',               quantity: 1, unit: 'kg',  note: '',                         price: 0.99, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:12:00.000Z' },
  { _id: 'seed-lidl-13', type: 'article', listId: 'seed-list-lidl', name: 'Kartoffeln festkochend', quantity: 2, unit: 'kg',  note: 'aus Österreich',           price: 2.39, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:13:00.000Z' },
  { _id: 'seed-lidl-14', type: 'article', listId: 'seed-list-lidl', name: 'Naturjoghurt 3,6%',      quantity: 500, unit: 'g', note: 'Milbona',                  price: 0.95, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:14:00.000Z' },
  { _id: 'seed-lidl-15', type: 'article', listId: 'seed-list-lidl', name: 'Mineralwasser',          quantity: 6, unit: 'x 1,5l', note: 'Saskia',               price: 2.19, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:15:00.000Z' },
  { _id: 'seed-lidl-16', type: 'article', listId: 'seed-list-lidl', name: 'Hühnerbrust',            quantity: 400, unit: 'g', note: '',                         price: 5.79, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:16:00.000Z' },
  { _id: 'seed-lidl-17', type: 'article', listId: 'seed-list-lidl', name: 'Faschiertes gemischt',   quantity: 500, unit: 'g', note: '',                         price: 4.29, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:17:00.000Z' },
  { _id: 'seed-lidl-18', type: 'article', listId: 'seed-list-lidl', name: 'Mehl glatt',             quantity: 1, unit: 'kg',  note: 'Belbake',                  price: 0.85, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:18:00.000Z' },
  { _id: 'seed-lidl-19', type: 'article', listId: 'seed-list-lidl', name: 'Zucker',                 quantity: 1, unit: 'kg',  note: 'Sweet Valley',             price: 1.25, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:19:00.000Z' },
  { _id: 'seed-lidl-20', type: 'article', listId: 'seed-list-lidl', name: 'Kaffee gemahlen',        quantity: 500, unit: 'g', note: 'Bellarom',                 price: 4.49, barcode: null, priceHistory: [], checked: false, hidden: false, createdAt: '2024-02-01T11:20:00.000Z' },
]
