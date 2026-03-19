import { db, hasUsername } from './index.js'
import { getSeedLists, seedArticles } from './seedData.js'

const SEED_MARKER = 'seed-v3'

export { getSeedLists, seedArticles }

export async function seedDatabase() {
  // Skip seeding when Cypress E2E tests have cleared the DB
  if (localStorage.getItem('__cypress_skip_seed')) return

  // Skip seeding if no username is set yet
  if (!hasUsername()) return

  try {
    await db.get(SEED_MARKER)
    return // already seeded
  } catch {
    // not seeded yet, continue
  }

  const seedLists = getSeedLists()
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
