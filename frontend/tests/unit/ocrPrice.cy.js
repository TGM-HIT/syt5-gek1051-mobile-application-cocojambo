import { extractPrices } from '../../src/utils/ocrPrice.js'

describe('extractPrices', () => {
  it('extracts € prefix with comma decimal', () => {
    expect(extractPrices('€ 2,49')).to.deep.equal([2.49])
  })

  it('extracts € prefix without space', () => {
    expect(extractPrices('€2,49')).to.deep.equal([2.49])
  })

  it('extracts € suffix with comma decimal', () => {
    expect(extractPrices('2,49 €')).to.deep.equal([2.49])
  })

  it('extracts € suffix without space', () => {
    expect(extractPrices('2,49€')).to.deep.equal([2.49])
  })

  it('extracts EUR prefix', () => {
    expect(extractPrices('EUR 3,99')).to.deep.equal([3.99])
  })

  it('falls back to dot decimal when no currency match', () => {
    expect(extractPrices('price is 2.49 today')).to.deep.equal([2.49])
  })

  it('prefers currency matches over dot decimal', () => {
    expect(extractPrices('€ 2,49 weight 1.5 kg')).to.deep.equal([2.49])
  })

  it('extracts multiple prices', () => {
    const result = extractPrices('€ 2,49 / kg\n€ 1,25 / Stk')
    expect(result).to.deep.equal([2.49, 1.25])
  })

  it('filters out prices below 0.01', () => {
    expect(extractPrices('€ 0,00')).to.deep.equal([])
  })

  it('filters out prices above 999.99', () => {
    expect(extractPrices('€ 1234,56')).to.deep.equal([])
  })

  it('returns empty array for no matches', () => {
    expect(extractPrices('no prices here')).to.deep.equal([])
  })

  it('handles real Austrian price tag text', () => {
    const text = 'SPAR\nVollmilch 3,5%\n1l\n€ 1,49\nAktion gültig bis 25.03.'
    expect(extractPrices(text)).to.deep.equal([1.49])
  })
})
