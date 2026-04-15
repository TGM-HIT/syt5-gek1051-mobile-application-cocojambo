import { getUsername, setUsername, hasUsername, renameUser } from '../../src/db/index.js'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

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

// ─── renameUser ──────────────────────────────────────────────────────────────

describe('renameUser – localStorage', () => {
  beforeEach(() => {
    localStorage.removeItem('username')
  })

  it('gibt null zurück wenn kein Username gesetzt ist', () => {
    cy.window().then(async () => {
      const result = await renameUser('Neu')
      expect(result).to.be.null
    })
  })

  it('behält den Suffix und ändert nur den Displaynamen', () => {
    localStorage.setItem('username', 'Alt#abcd')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      const result = await renameUser('Neu')
      expect(result).to.equal('Neu#abcd')
      expect(localStorage.getItem('username')).to.equal('Neu#abcd')
    })
  })

  it('gibt unveränderten Username zurück wenn Displayname gleich ist', () => {
    localStorage.setItem('username', 'Max#abcd')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      const result = await renameUser('Max')
      expect(result).to.equal('Max#abcd')
      expect(localStorage.getItem('username')).to.equal('Max#abcd')
    })
  })

  it('ruft bulkDocs nicht auf wenn der Name unverändert ist', () => {
    localStorage.setItem('username', 'Max#abcd')
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Max')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})

describe('renameUser – list-Dokumente', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('ersetzt alten Username in members-Array', () => {
    const listDoc = { _id: 'list-1', _rev: '1-a', type: 'list', name: 'Test', members: ['Alt#abcd', 'Other#1234'] }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([listDoc]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      const updated = docs.find((d) => d._id === 'list-1')
      expect(updated.members).to.deep.equal(['Neu#abcd', 'Other#1234'])
    })
  })

  it('berührt members anderer Benutzer nicht', () => {
    const listDoc = { _id: 'list-1', _rev: '1-a', type: 'list', name: 'Test', members: ['Alt#abcd', 'Other#1234'] }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([listDoc]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].members).to.include('Other#1234')
    })
  })

  it('ignoriert Listen in denen der alte Username nicht enthalten ist', () => {
    const foreignList = { _id: 'list-2', _rev: '1-a', type: 'list', name: 'Fremd', members: ['Other#1234'] }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([foreignList]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})

describe('renameUser – check-event-Dokumente', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('aktualisiert checkedBy', () => {
    const checkEvent = { _id: 'check-1', _rev: '1-a', type: 'check-event', checkedBy: 'Alt#abcd', articleId: 'art-1', listId: 'list-1', checkedAt: '2024-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([checkEvent]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].checkedBy).to.equal('Neu#abcd')
    })
  })

  it('ignoriert check-events von anderen Benutzern', () => {
    const otherCheck = { _id: 'check-2', _rev: '1-a', type: 'check-event', checkedBy: 'Other#1234', articleId: 'art-1', listId: 'list-1', checkedAt: '2024-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([otherCheck]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})

describe('renameUser – article-patch-Dokumente', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('aktualisiert editedBy', () => {
    const patch = { _id: 'patch-1', _rev: '1-a', type: 'article-patch', editedBy: 'Alt#abcd', articleId: 'art-1', listId: 'list-1', fields: {} }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([patch]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].editedBy).to.equal('Neu#abcd')
    })
  })
})

describe('renameUser – article-Dokumente', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('aktualisiert createdBy', () => {
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', createdBy: 'Alt#abcd', listId: 'list-1', name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].createdBy).to.equal('Neu#abcd')
    })
  })

  it('aktualisiert hiddenBy', () => {
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', createdBy: 'Other#1234', hiddenBy: 'Alt#abcd', listId: 'list-1', name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].hiddenBy).to.equal('Neu#abcd')
    })
  })

  it('lässt createdBy von anderen Benutzern unverändert wenn nur hiddenBy aktualisiert wird', () => {
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', createdBy: 'Other#1234', hiddenBy: 'Alt#abcd', listId: 'list-1', name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].createdBy).to.equal('Other#1234')
    })
  })
})

describe('renameUser – delete-intent-Dokumente', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('aktualisiert deletedBy', () => {
    const deleteIntent = { _id: 'delete-1', _rev: '1-a', type: 'delete-intent', deletedBy: 'Alt#abcd', articleId: 'art-1', listId: 'list-1', deletedAt: '2024-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([deleteIntent]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].deletedBy).to.equal('Neu#abcd')
    })
  })
})

describe('renameUser – bulkDocs-Verhalten', () => {
  beforeEach(() => {
    localStorage.setItem('username', 'Alt#abcd')
  })

  it('schreibt alle betroffenen Dokumente in einem einzigen bulkDocs-Aufruf', () => {
    const docs = [
      { _id: 'list-1', _rev: '1-a', type: 'list', members: ['Alt#abcd'] },
      { _id: 'check-1', _rev: '1-a', type: 'check-event', checkedBy: 'Alt#abcd', articleId: 'art-1', listId: 'list-1', checkedAt: '2024-01-01T00:00:00.000Z' },
      { _id: 'patch-1', _rev: '1-a', type: 'article-patch', editedBy: 'Alt#abcd', articleId: 'art-1', listId: 'list-1', fields: {} },
      { _id: 'art-1', _rev: '1-a', type: 'article', createdBy: 'Alt#abcd', listId: 'list-1', name: 'Milch' },
      { _id: 'delete-1', _rev: '1-a', type: 'delete-intent', deletedBy: 'Alt#abcd', articleId: 'art-2', listId: 'list-1', deletedAt: '2024-01-01T00:00:00.000Z' },
    ]
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult(docs))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      expect(win.__db.bulkDocs).to.have.been.calledOnce
      const [updatedDocs] = win.__db.bulkDocs.args[0]
      expect(updatedDocs).to.have.length(5)
    })
  })

  it('ruft bulkDocs nicht auf wenn keine Dokumente betroffen sind', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })

  it('ignoriert Dokumente fremder Benutzer vollständig', () => {
    const foreignDocs = [
      { _id: 'check-9', _rev: '1-a', type: 'check-event', checkedBy: 'Other#9999', articleId: 'art-1', listId: 'list-1', checkedAt: '2024-01-01T00:00:00.000Z' },
      { _id: 'art-9', _rev: '1-a', type: 'article', createdBy: 'Other#9999', listId: 'list-1', name: 'Brot' },
    ]
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult(foreignDocs))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('Neu')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})
