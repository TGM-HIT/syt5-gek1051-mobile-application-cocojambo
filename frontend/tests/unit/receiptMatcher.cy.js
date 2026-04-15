import {
  normalizeForMatch,
  extractLines,
  articleMatchesReceipt,
  matchArticlesFromReceipt,
} from '../../src/utils/receiptMatcher.js'

describe('normalizeForMatch', () => {
  it('converts to lowercase', () => {
    expect(normalizeForMatch('Milch')).to.equal('milch')
  })

  it('replaces ä with ae', () => {
    expect(normalizeForMatch('Käse')).to.equal('kaese')
  })

  it('replaces ö with oe', () => {
    expect(normalizeForMatch('Öl')).to.equal('oel')
  })

  it('replaces ü with ue', () => {
    expect(normalizeForMatch('Müsli')).to.equal('muesli')
  })

  it('replaces ß with ss', () => {
    expect(normalizeForMatch('Straße')).to.equal('strasse')
  })

  it('replaces non-alphanumeric characters with spaces', () => {
    expect(normalizeForMatch('Coca-Cola')).to.equal('coca cola')
  })

  it('collapses multiple spaces', () => {
    expect(normalizeForMatch('Rote   Beete')).to.equal('rote beete')
  })

  it('trims leading and trailing whitespace', () => {
    expect(normalizeForMatch('  Milch  ')).to.equal('milch')
  })

  it('handles empty string', () => {
    expect(normalizeForMatch('')).to.equal('')
  })

  it('handles string with only special characters', () => {
    expect(normalizeForMatch('---')).to.equal('')
  })
})

describe('extractLines', () => {
  it('splits receipt text into lines', () => {
    const text = 'Milch\nBrot\nButter'
    expect(extractLines(text)).to.deep.equal(['milch', 'brot', 'butter'])
  })

  it('filters out empty lines', () => {
    const text = 'Milch\n\nBrot\n\n'
    expect(extractLines(text)).to.deep.equal(['milch', 'brot'])
  })

  it('normalizes each line', () => {
    const text = 'Bio-Milch 3,5%\nKäse 200g'
    const lines = extractLines(text)
    expect(lines[0]).to.equal('bio milch 3 5')
    expect(lines[1]).to.equal('kaese 200g')
  })

  it('returns empty array for empty text', () => {
    expect(extractLines('')).to.deep.equal([])
  })

  it('handles single line without newline', () => {
    expect(extractLines('Milch')).to.deep.equal(['milch'])
  })
})

describe('articleMatchesReceipt', () => {
  it('matches when article name appears verbatim on a line', () => {
    const lines = ['milch 1 5l', 'brot vollkorn', 'butter 250g']
    expect(articleMatchesReceipt('Milch', lines)).to.be.true
  })

  it('matches partial word if all words are present', () => {
    const lines = ['bio vollmilch 1l 1 29']
    expect(articleMatchesReceipt('Bio Vollmilch', lines)).to.be.true
  })

  it('does not match when article words are missing', () => {
    const lines = ['brot vollkorn', 'butter 250g']
    expect(articleMatchesReceipt('Milch', lines)).to.be.false
  })

  it('matches case-insensitively', () => {
    const lines = ['MILCH 1L']
    expect(articleMatchesReceipt('milch', lines)).to.be.true
  })

  it('matches with umlaut normalization', () => {
    const lines = ['kaese scheiben 200g']
    expect(articleMatchesReceipt('Käse Scheiben', lines)).to.be.true
  })

  it('ignores short words (< 3 chars) in matching', () => {
    // "Ei" is only 2 chars → would return false (no significant words)
    const lines = ['ei 10er']
    expect(articleMatchesReceipt('Ei', lines)).to.be.false
  })

  it('requires all words to be present on the same line', () => {
    const lines = ['bio milch', 'vollkorn brot']
    // "Bio Brot" — words on different lines → no match
    expect(articleMatchesReceipt('Bio Brot', lines)).to.be.false
  })

  it('returns false for empty article name', () => {
    const lines = ['milch', 'brot']
    expect(articleMatchesReceipt('', lines)).to.be.false
  })

  it('returns false for empty lines array', () => {
    expect(articleMatchesReceipt('Milch', [])).to.be.false
  })

  it('matches multi-word article names', () => {
    const lines = ['bio fair trade kaffee 500g', 'zucker 1kg']
    expect(articleMatchesReceipt('Bio Kaffee', lines)).to.be.true
  })
})

describe('matchArticlesFromReceipt', () => {
  const articles = [
    { _id: 'a1', name: 'Milch', quantity: 1, unit: 'l', checked: false, hidden: false },
    { _id: 'a2', name: 'Vollkornbrot', quantity: 1, unit: 'Stk', checked: false, hidden: false },
    { _id: 'a3', name: 'Butter', quantity: 1, unit: 'g', checked: false, hidden: false },
    { _id: 'a4', name: 'Joghurt', quantity: 2, unit: 'Stk', checked: false, hidden: false },
  ]

  it('returns articles found in receipt text', () => {
    const text = 'Milch 1l      1.09\nVollkornbrot  2.49\nTotal: 3.58'
    const result = matchArticlesFromReceipt(text, articles)
    expect(result).to.have.length(2)
    expect(result.map((a) => a._id)).to.include.members(['a1', 'a2'])
  })

  it('returns empty array when nothing matches', () => {
    const text = 'Schrauben 6mm\nNaegel 50er'
    const result = matchArticlesFromReceipt(text, articles)
    expect(result).to.deep.equal([])
  })

  it('returns all matching articles', () => {
    const text = 'Milch 1l\nVollkornbrot\nButter 250g\nJoghurt 2x'
    const result = matchArticlesFromReceipt(text, articles)
    expect(result).to.have.length(4)
  })

  it('returns empty array for empty receipt text', () => {
    const result = matchArticlesFromReceipt('', articles)
    expect(result).to.deep.equal([])
  })

  it('returns empty array for empty articles list', () => {
    const result = matchArticlesFromReceipt('Milch\nBrot', [])
    expect(result).to.deep.equal([])
  })

  it('returns empty array for null receipt text', () => {
    const result = matchArticlesFromReceipt(null, articles)
    expect(result).to.deep.equal([])
  })

  it('handles umlaut in article names', () => {
    const articlesWithUmlauts = [
      { _id: 'b1', name: 'Käse', quantity: 1, unit: 'g', checked: false, hidden: false },
    ]
    const text = 'Kaese Scheiben 200g   1.49'
    const result = matchArticlesFromReceipt(text, articlesWithUmlauts)
    expect(result).to.have.length(1)
    expect(result[0]._id).to.equal('b1')
  })

  it('is case-insensitive', () => {
    const text = 'MILCH 1L\nVOLLKORNBROT'
    const result = matchArticlesFromReceipt(text, articles)
    expect(result.map((a) => a._id)).to.include.members(['a1', 'a2'])
  })

  it('does not match articles not on receipt', () => {
    const text = 'Milch 1l\nButter 250g'
    const result = matchArticlesFromReceipt(text, articles)
    expect(result.find((a) => a._id === 'a4')).to.be.undefined
  })
})
