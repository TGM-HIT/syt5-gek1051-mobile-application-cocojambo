import { getSeedLists, seedArticles } from '../../src/db/seedData.js'

describe('getSeedLists', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'TestUser#abcd')
  })

  it('returns 7 seed lists', () => {
    const lists = getSeedLists()
    expect(lists).to.have.length(7)
  })

  it('each list has required fields', () => {
    const lists = getSeedLists()
    for (const list of lists) {
      expect(list).to.have.property('_id')
      expect(list).to.have.property('type', 'list')
      expect(list).to.have.property('name')
      expect(list).to.have.property('members')
      expect(list).to.have.property('shareCode')
      expect(list).to.have.property('createdAt')
    }
  })

  it('sets current user as member of all lists', () => {
    const lists = getSeedLists()
    for (const list of lists) {
      expect(list.members).to.include('TestUser#abcd')
    }
  })

  it('each list has a valid 6-char share code', () => {
    const lists = getSeedLists()
    for (const list of lists) {
      expect(list.shareCode).to.match(/^[A-Z0-9]{6}$/)
    }
  })

  it('includes expected list names', () => {
    const names = getSeedLists().map((l) => l.name)
    expect(names).to.include('Wocheneinkauf')
    expect(names).to.include('Baumarkt')
    expect(names).to.include('Apotheke')
    expect(names).to.include('SPAR Preisliste')
  })
})

describe('seedArticles', () => {
  it('is an array of articles', () => {
    expect(seedArticles).to.be.an('array')
    expect(seedArticles.length).to.be.greaterThan(50)
  })

  it('each article has required fields', () => {
    for (const article of seedArticles) {
      expect(article).to.have.property('_id')
      expect(article).to.have.property('type', 'article')
      expect(article).to.have.property('listId')
      expect(article).to.have.property('name')
      expect(article).to.have.property('createdAt')
    }
  })

  it('articles reference valid seed list ids', () => {
    const validListIds = new Set([
      'seed-list-1', 'seed-list-2', 'seed-list-3',
      'seed-list-spar', 'seed-list-billa', 'seed-list-hofer', 'seed-list-lidl',
    ])
    for (const article of seedArticles) {
      expect(validListIds.has(article.listId)).to.be.true
    }
  })

  it('prices are non-negative numbers or null', () => {
    for (const article of seedArticles) {
      if (article.price !== null && article.price !== undefined) {
        expect(article.price).to.be.a('number')
        expect(article.price).to.be.at.least(0)
      }
    }
  })

  it('contains articles from all 4 supermarket price lists', () => {
    const listIds = new Set(seedArticles.map((a) => a.listId))
    expect(listIds.has('seed-list-spar')).to.be.true
    expect(listIds.has('seed-list-billa')).to.be.true
    expect(listIds.has('seed-list-hofer')).to.be.true
    expect(listIds.has('seed-list-lidl')).to.be.true
  })

  it('some articles have price history', () => {
    const withHistory = seedArticles.filter((a) => a.priceHistory && a.priceHistory.length > 0)
    expect(withHistory.length).to.be.greaterThan(5)
  })
})
