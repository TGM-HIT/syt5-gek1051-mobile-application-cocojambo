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
  ]
}

export const seedArticles = [
  // Wocheneinkauf
  { _id: 'seed-article-1',  type: 'article', listId: 'seed-list-1', name: 'Milch',        quantity: 2,   unit: 'l',   checked: false, hidden: false, createdAt: '2024-01-10T08:01:00.000Z' },
  { _id: 'seed-article-2',  type: 'article', listId: 'seed-list-1', name: 'Brot',         quantity: 1,   unit: '',    checked: true,  hidden: false, createdAt: '2024-01-10T08:02:00.000Z' },
  { _id: 'seed-article-3',  type: 'article', listId: 'seed-list-1', name: 'Butter',       quantity: 250, unit: 'g',   checked: false, hidden: false, createdAt: '2024-01-10T08:03:00.000Z' },
  { _id: 'seed-article-4',  type: 'article', listId: 'seed-list-1', name: 'Eier',         quantity: 10,  unit: 'St',  checked: false, hidden: false, createdAt: '2024-01-10T08:04:00.000Z' },
  { _id: 'seed-article-5',  type: 'article', listId: 'seed-list-1', name: 'Äpfel',        quantity: 1,   unit: 'kg',  checked: false, hidden: false, createdAt: '2024-01-10T08:05:00.000Z' },
  { _id: 'seed-article-6',  type: 'article', listId: 'seed-list-1', name: 'Joghurt',      quantity: 3,   unit: 'St',  checked: false, hidden: true,  createdAt: '2024-01-10T08:06:00.000Z' },
  { _id: 'seed-article-7',  type: 'article', listId: 'seed-list-1', name: 'Käse',         quantity: 200, unit: 'g',   checked: false, hidden: true,  createdAt: '2024-01-10T08:07:00.000Z' },

  // Baumarkt
  { _id: 'seed-article-8',  type: 'article', listId: 'seed-list-2', name: 'Schrauben',    quantity: 50,  unit: 'St',  checked: false, hidden: false, createdAt: '2024-01-12T10:01:00.000Z' },
  { _id: 'seed-article-9',  type: 'article', listId: 'seed-list-2', name: 'Dübel',        quantity: 20,  unit: 'St',  checked: true,  hidden: false, createdAt: '2024-01-12T10:02:00.000Z' },
  { _id: 'seed-article-10', type: 'article', listId: 'seed-list-2', name: 'Farbe weiß',   quantity: 2,   unit: 'l',   checked: false, hidden: false, createdAt: '2024-01-12T10:03:00.000Z' },
  { _id: 'seed-article-11', type: 'article', listId: 'seed-list-2', name: 'Pinsel',       quantity: 2,   unit: 'St',  checked: false, hidden: false, createdAt: '2024-01-12T10:04:00.000Z' },

  // Apotheke
  { _id: 'seed-article-12', type: 'article', listId: 'seed-list-3', name: 'Ibuprofen',    quantity: 1,   unit: 'Pkg', checked: false, hidden: false, createdAt: '2024-01-15T09:01:00.000Z' },
  { _id: 'seed-article-13', type: 'article', listId: 'seed-list-3', name: 'Pflaster',     quantity: 1,   unit: 'Pkg', checked: false, hidden: false, createdAt: '2024-01-15T09:02:00.000Z' },
  { _id: 'seed-article-14', type: 'article', listId: 'seed-list-3', name: 'Milch (H-Milch)', quantity: 6, unit: 'St', checked: false, hidden: false, createdAt: '2024-01-15T09:03:00.000Z' },
  { _id: 'seed-article-15', type: 'article', listId: 'seed-list-3', name: 'Vitamin C',    quantity: 1,   unit: 'Pkg', checked: false, hidden: true,  createdAt: '2024-01-15T09:04:00.000Z' },
]
