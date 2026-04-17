import { getUsername, setUsername, hasUsername, generateShareCode, renameUser } from '../../src/db/index.js'

const TEST_USERNAME = 'TestUser#abcd'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

describe('getUsername / setUsername / hasUsername', () => {
  beforeEach(() => {
    localStorage.removeItem('username')
  })

  it('hasUsername returns false when no username set', () => {
    expect(hasUsername()).to.be.false
  })

  it('hasUsername returns true after setting username', () => {
    localStorage.setItem('username', TEST_USERNAME)
    expect(hasUsername()).to.be.true
  })

  it('getUsername returns null when not set', () => {
    expect(getUsername()).to.be.null
  })

  it('getUsername returns stored username', () => {
    localStorage.setItem('username', TEST_USERNAME)
    expect(getUsername()).to.equal(TEST_USERNAME)
  })

  it('setUsername creates username with displayName#hex format', () => {
    const result = setUsername('Max')
    expect(result).to.match(/^Max#[0-9a-f]{4}$/)
    expect(localStorage.getItem('username')).to.equal(result)
  })

  it('setUsername generates different suffixes on each call', () => {
    const a = setUsername('User')
    localStorage.removeItem('username')
    const b = setUsername('User')
    expect(a).to.not.equal(b)
  })
})

describe('generateShareCode', () => {
  it('returns a 6-character string', () => {
    const code = generateShareCode()
    expect(code).to.be.a('string')
    expect(code).to.have.length(6)
  })

  it('only contains allowed characters (no O/0/I/1)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShareCode()
      expect(code).to.match(/^[A-HJ-NP-Z2-9]{6}$/)
    }
  })

  it('generates different codes', () => {
    const codes = new Set()
    for (let i = 0; i < 20; i++) {
      codes.add(generateShareCode())
    }
    expect(codes.size).to.be.greaterThan(1)
  })
})

describe('renameUser', () => {
  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
  })

  it('returns null when no username is set', () => {
    localStorage.removeItem('username')
    cy.window().then(async () => {
      const result = await renameUser('NewName')
      expect(result).to.be.null
    })
  })

  it('returns same username when display name unchanged', () => {
    cy.window().then(async () => {
      const result = await renameUser('TestUser')
      expect(result).to.equal(TEST_USERNAME)
    })
  })

  it('keeps the same suffix after rename', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      const result = await renameUser('NewName')
      expect(result).to.equal('NewName#abcd')
      expect(localStorage.getItem('username')).to.equal('NewName#abcd')
    })
  })

  it('updates list members with old username', () => {
    const list = { _id: 'l1', type: 'list', members: [TEST_USERNAME, 'other#1234'] }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([list]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      const [docs] = bulkStub.args[0]
      expect(docs).to.have.length(1)
      expect(docs[0].members).to.deep.equal(['NewName#abcd', 'other#1234'])
    })
  })

  it('updates article createdBy and hiddenBy', () => {
    const article = { _id: 'a1', type: 'article', createdBy: TEST_USERNAME, hiddenBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      const [docs] = bulkStub.args[0]
      expect(docs[0].createdBy).to.equal('NewName#abcd')
      expect(docs[0].hiddenBy).to.equal('NewName#abcd')
    })
  })

  it('updates article-patch editedBy', () => {
    const patch = { _id: 'p1', type: 'article-patch', editedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([patch]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      const [docs] = bulkStub.args[0]
      expect(docs[0].editedBy).to.equal('NewName#abcd')
    })
  })

  it('updates check-event checkedBy', () => {
    const evt = { _id: 'c1', type: 'check-event', checkedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([evt]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      const [docs] = bulkStub.args[0]
      expect(docs[0].checkedBy).to.equal('NewName#abcd')
    })
  })

  it('updates delete-intent deletedBy', () => {
    const del = { _id: 'd1', type: 'delete-intent', deletedBy: TEST_USERNAME }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([del]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      const [docs] = bulkStub.args[0]
      expect(docs[0].deletedBy).to.equal('NewName#abcd')
    })
  })

  it('does not call bulkDocs when no documents need updating', () => {
    const unrelated = { _id: 'x1', type: 'list', members: ['other#9999'] }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([unrelated]))
      const bulkStub = cy.stub(win.__db, 'bulkDocs').resolves([])
      await renameUser('NewName')
      expect(bulkStub).to.not.have.been.called
    })
  })
})
