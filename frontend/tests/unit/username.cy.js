import { getUsername, setUsername, hasUsername } from '../../src/db/index.js'

describe('Username – Hilfsfunktionen', () => {
  beforeEach(() => {
    localStorage.removeItem('username')
  })

  it('hasUsername gibt false zurück wenn kein Username gesetzt ist', () => {
    expect(hasUsername()).to.be.false
  })

  it('getUsername gibt null zurück wenn kein Username gesetzt ist', () => {
    expect(getUsername()).to.be.null
  })

  it('setUsername speichert Username mit Suffix im Format Name#xxxx', () => {
    const result = setUsername('Max')
    expect(result).to.match(/^Max#[0-9a-f]{4}$/)
    expect(localStorage.getItem('username')).to.equal(result)
  })

  it('hasUsername gibt true zurück nach setUsername', () => {
    setUsername('Max')
    expect(hasUsername()).to.be.true
  })

  it('getUsername gibt gespeicherten Username zurück nach setUsername', () => {
    const result = setUsername('Anna')
    expect(getUsername()).to.equal(result)
  })

  it('setUsername generiert unterschiedliche Suffixe', () => {
    const results = new Set()
    for (let i = 0; i < 20; i++) {
      localStorage.removeItem('username')
      results.add(setUsername('Test'))
    }
    // With 20 random 4-hex-char suffixes, we expect at least 2 different values
    expect(results.size).to.be.greaterThan(1)
  })

  it('setUsername überschreibt vorherigen Username', () => {
    setUsername('Erster')
    const second = setUsername('Zweiter')
    expect(getUsername()).to.equal(second)
    expect(getUsername()).to.match(/^Zweiter#/)
  })

  it('Suffix hat genau 4 Hex-Zeichen', () => {
    const result = setUsername('Test')
    const suffix = result.split('#')[1]
    expect(suffix).to.have.length(4)
    expect(suffix).to.match(/^[0-9a-f]{4}$/)
  })
})
