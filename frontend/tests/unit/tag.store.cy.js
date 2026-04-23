import { createPinia, setActivePinia } from 'pinia'
import { useTagStore } from '../../src/stores/tag.js'

const makeAllDocsResult = (docs) => ({
  rows: docs.map((doc) => ({ doc })),
})

const LIST_ID = 'list-1'

describe('TagStore – loadTags', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('loads tags for the given listId', () => {
    const tag = { _id: 'tag-1', type: 'tag', listId: LIST_ID, name: 'Milch', createdAt: '2025-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([tag]))
      await store.loadTags(LIST_ID)
      expect(store.tags).to.have.length(1)
      expect(store.tags[0].name).to.equal('Milch')
    })
  })

  it('does not load tags from other lists', () => {
    const ownTag = { _id: 'tag-1', type: 'tag', listId: LIST_ID, name: 'Milch', createdAt: '2025-01-01T00:00:00.000Z' }
    const otherTag = { _id: 'tag-2', type: 'tag', listId: 'list-99', name: 'Brot', createdAt: '2025-01-01T00:00:00.000Z' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([ownTag, otherTag]))
      await store.loadTags(LIST_ID)
      expect(store.tags).to.have.length(1)
      expect(store.tags[0].name).to.equal('Milch')
    })
  })

  it('sorts tags alphabetically by name using German locale', () => {
    const tags = [
      { _id: 'tag-1', type: 'tag', listId: LIST_ID, name: 'Süßwaren', createdAt: '2025-01-01T00:00:00.000Z' },
      { _id: 'tag-2', type: 'tag', listId: LIST_ID, name: 'Backwaren', createdAt: '2025-01-01T00:00:00.000Z' },
      { _id: 'tag-3', type: 'tag', listId: LIST_ID, name: 'Obst', createdAt: '2025-01-01T00:00:00.000Z' },
    ]
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult(tags))
      await store.loadTags(LIST_ID)
      expect(store.tags.map((t) => t.name)).to.deep.equal(['Backwaren', 'Obst', 'Süßwaren'])
    })
  })

  it('ignores non-tag documents', () => {
    const article = { _id: 'art-1', type: 'article', listId: LIST_ID, name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      await store.loadTags(LIST_ID)
      expect(store.tags).to.have.length(0)
    })
  })

  it('returns empty array when no tags exist', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.loadTags(LIST_ID)
      expect(store.tags).to.have.length(0)
    })
  })
})

describe('TagStore – ensureDefaultTags', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('creates 10 default tags when none exist', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.ensureDefaultTags(LIST_ID)
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs).to.have.length(10)
    })
  })

  it('all default tags have the correct type and listId', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.ensureDefaultTags(LIST_ID)
      const [docs] = win.__db.bulkDocs.args[0]
      docs.forEach((doc) => {
        expect(doc.type).to.equal('tag')
        expect(doc.listId).to.equal(LIST_ID)
      })
    })
  })

  it('includes standard categories like Obst & Gemüse and Backwaren', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.ensureDefaultTags(LIST_ID)
      const [docs] = win.__db.bulkDocs.args[0]
      const names = docs.map((d) => d.name)
      expect(names).to.include('Obst & Gemüse')
      expect(names).to.include('Backwaren')
      expect(names).to.include('Milchprodukte')
    })
  })

  it('does not create tags when tags already exist', () => {
    const existingTag = { _id: 'tag-1', type: 'tag', listId: LIST_ID, name: 'Obst' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([existingTag]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.ensureDefaultTags(LIST_ID)
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })

  it('each default tag has a createdAt ISO string', () => {
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.ensureDefaultTags(LIST_ID)
      const [docs] = win.__db.bulkDocs.args[0]
      docs.forEach((doc) => {
        expect(doc.createdAt).to.be.a('string')
        expect(() => new Date(doc.createdAt)).to.not.throw()
      })
    })
  })
})

describe('TagStore – createTag', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
    cy.window().then((win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true, id: 'tag-new', rev: '1-a' })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
    })
  })

  it('creates a tag with the given name and listId', () => {
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, 'Gemüse')
      const [doc] = win.__db.put.args[0]
      expect(doc.type).to.equal('tag')
      expect(doc.name).to.equal('Gemüse')
      expect(doc.listId).to.equal(LIST_ID)
    })
  })

  it('trims whitespace from the tag name', () => {
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, '  Gemüse  ')
      const [doc] = win.__db.put.args[0]
      expect(doc.name).to.equal('Gemüse')
    })
  })

  it('sets createdAt as an ISO string', () => {
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, 'Obst')
      const [doc] = win.__db.put.args[0]
      expect(doc.createdAt).to.be.a('string')
      expect(() => new Date(doc.createdAt)).to.not.throw()
    })
  })

  it('does not create a tag with empty name', () => {
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, '')
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('does not create a tag with whitespace-only name', () => {
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, '   ')
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('does not create a duplicate tag name', () => {
    store.tags = [{ _id: 'tag-1', name: 'Gemüse', listId: LIST_ID }]
    cy.window().then(async (win) => {
      await store.createTag(LIST_ID, 'Gemüse')
      expect(win.__db.put).to.not.have.been.called
    })
  })
})

describe('TagStore – updateTag', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('updates the tag name in the database', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'OldName' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.updateTag(LIST_ID, tagDoc, 'NewName')
      const [doc] = win.__db.put.args[0]
      expect(doc.name).to.equal('NewName')
      expect(doc._id).to.equal('tag-1')
    })
  })

  it('does not update when new name is identical to current name', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'SameName' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.updateTag(LIST_ID, tagDoc, 'SameName')
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('does not update when new name is empty', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'SomeName' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.updateTag(LIST_ID, tagDoc, '')
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('does not update when new name conflicts with another existing tag', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'TagA' }
    const otherTag = { _id: 'tag-2', _rev: '1-b', type: 'tag', listId: LIST_ID, name: 'TagB' }
    store.tags = [tagDoc, otherTag]
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.updateTag(LIST_ID, tagDoc, 'TagB')
      expect(win.__db.put).to.not.have.been.called
    })
  })

  it('cascades rename to articles with the old tag name', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'OldTag' }
    const articleWithTag = { _id: 'art-1', _rev: '1-a', type: 'article', listId: LIST_ID, tag: 'OldTag', name: 'Apfel' }
    const articleOtherTag = { _id: 'art-2', _rev: '1-b', type: 'article', listId: LIST_ID, tag: 'Milch', name: 'Butter' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([tagDoc, articleWithTag, articleOtherTag]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.updateTag(LIST_ID, tagDoc, 'NewTag')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs).to.have.length(1)
      expect(docs[0].tag).to.equal('NewTag')
      expect(docs[0]._id).to.equal('art-1')
    })
  })

  it('does not cascade to articles from other lists', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'OldTag' }
    const ownArticle = { _id: 'art-1', _rev: '1-a', type: 'article', listId: LIST_ID, tag: 'OldTag', name: 'Apfel' }
    const foreignArticle = { _id: 'art-2', _rev: '1-b', type: 'article', listId: 'list-99', tag: 'OldTag', name: 'Brot' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([tagDoc, ownArticle, foreignArticle]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.updateTag(LIST_ID, tagDoc, 'NewTag')
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs).to.have.length(1)
      expect(docs[0]._id).to.equal('art-1')
    })
  })

  it('does not call bulkDocs when no articles use the old tag', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'UnusedTag' }
    const article = { _id: 'art-1', _rev: '1-a', type: 'article', listId: LIST_ID, tag: 'OtherTag', name: 'Milch' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'put').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([article]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.updateTag(LIST_ID, tagDoc, 'NewTag')
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})

describe('TagStore – deleteTag', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('removes the tag document via db.remove', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'Obst' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([]))
      await store.deleteTag(LIST_ID, tagDoc)
      expect(win.__db.remove).to.have.been.calledWith('tag-1', '1-a')
    })
  })

  it('clears the tag field on articles that used the deleted tag', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'Obst' }
    const articleWithTag = { _id: 'art-1', _rev: '1-a', type: 'article', listId: LIST_ID, tag: 'Obst', name: 'Apfel' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([articleWithTag]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.deleteTag(LIST_ID, tagDoc)
      const [docs] = win.__db.bulkDocs.args[0]
      expect(docs[0].tag).to.equal('')
      expect(docs[0]._id).to.equal('art-1')
    })
  })

  it('does not modify articles with a different tag', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'Obst' }
    const otherArticle = { _id: 'art-1', _rev: '1-a', type: 'article', listId: LIST_ID, tag: 'Milch', name: 'Butter' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([otherArticle]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.deleteTag(LIST_ID, tagDoc)
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })

  it('does not clear tags on articles from other lists', () => {
    const tagDoc = { _id: 'tag-1', _rev: '1-a', type: 'tag', listId: LIST_ID, name: 'Obst' }
    const foreignArticle = { _id: 'art-2', _rev: '1-b', type: 'article', listId: 'list-99', tag: 'Obst', name: 'Apfel' }
    cy.window().then(async (win) => {
      cy.stub(win.__db, 'remove').resolves({ ok: true })
      cy.stub(win.__db, 'allDocs').resolves(makeAllDocsResult([foreignArticle]))
      cy.stub(win.__db, 'bulkDocs').resolves([])
      await store.deleteTag(LIST_ID, tagDoc)
      expect(win.__db.bulkDocs).to.not.have.been.called
    })
  })
})

describe('TagStore – tagNames', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('returns empty array when no tags are loaded', () => {
    expect(store.tagNames()).to.deep.equal([])
  })

  it('returns names of all loaded tags in order', () => {
    store.tags = [
      { _id: '1', name: 'Obst', listId: LIST_ID },
      { _id: '2', name: 'Milch', listId: LIST_ID },
    ]
    expect(store.tagNames()).to.deep.equal(['Obst', 'Milch'])
  })

  it('reflects updates when tags state changes', () => {
    store.tags = [{ _id: '1', name: 'Brot', listId: LIST_ID }]
    expect(store.tagNames()).to.deep.equal(['Brot'])
    store.tags = []
    expect(store.tagNames()).to.deep.equal([])
  })
})

describe('TagStore – stopLiveSync', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useTagStore()
  })

  it('resets _currentListId to null', () => {
    store._currentListId = LIST_ID
    store.stopLiveSync()
    expect(store._currentListId).to.be.null
  })

  it('is safe to call when no sync is active', () => {
    expect(() => store.stopLiveSync()).to.not.throw()
    expect(store._currentListId).to.be.null
  })
})
