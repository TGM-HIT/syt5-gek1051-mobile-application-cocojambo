import { db } from './index.js'
import { seedLists, seedArticles } from './seedData.js'

const SEED_MARKER = 'seed-v2'

export { seedLists, seedArticles }

export async function seedDatabase() {
  // Skip seeding during Cypress E2E tests so clearPouchDB produces a truly empty DB
  if (window.Cypress) return

  try {
    await db.get(SEED_MARKER)
    return // already seeded
  } catch {
    // not seeded yet, continue
  }

  for (const doc of [...seedLists, ...seedArticles]) {
    try {
      await db.put(doc)
    } catch (e) {
      if (e.status !== 409) throw e // ignore conflicts (doc already exists)
    }
  }

  await db.put({ _id: SEED_MARKER, type: 'seed-marker' })
  console.log('[seed] Dummy-Daten erfolgreich eingefügt.')
}
