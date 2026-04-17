import { createPinia, setActivePinia } from 'pinia'
import { useNotificationStore } from '../../src/stores/notification.js'

const TEST_USERNAME = 'TestUser#abcd'

describe('NotificationStore', () => {
  let store

  beforeEach(() => {
    localStorage.setItem('username', TEST_USERNAME)
    setActivePinia(createPinia())
    store = useNotificationStore()
  })

  afterEach(() => {
    store.destroy()
  })

  describe('_push and dismiss', () => {
    it('adds a notification with incrementing id', () => {
      store._push('Test message', 'add', '10:30', 'list-1')
      expect(store.notifications).to.have.length(1)
      expect(store.notifications[0]).to.deep.include({
        id: 1,
        message: 'Test message',
        type: 'add',
        time: '10:30',
        listId: 'list-1',
      })
    })

    it('increments id for each notification', () => {
      store._push('First', 'add', '10:00', 'l1')
      store._push('Second', 'check', '10:01', 'l2')
      expect(store.notifications[0].id).to.equal(1)
      expect(store.notifications[1].id).to.equal(2)
    })

    it('dismiss removes notification by id', () => {
      store._push('A', 'add', '10:00', 'l1')
      store._push('B', 'check', '10:01', 'l2')
      store.dismiss(1)
      expect(store.notifications).to.have.length(1)
      expect(store.notifications[0].message).to.equal('B')
    })

    it('dismiss is a no-op for unknown id', () => {
      store._push('A', 'add', '10:00', 'l1')
      store.dismiss(999)
      expect(store.notifications).to.have.length(1)
    })

    it('auto-dismisses after 3 seconds', () => {
      store._push('Temp', 'add', '10:00', 'l1')
      expect(store.notifications).to.have.length(1)
      cy.wait(3100).then(() => {
        expect(store.notifications).to.have.length(0)
      })
    })
  })

  describe('init', () => {
    it('does not double-subscribe when called twice', () => {
      store.init()
      const unsub = store._unsubscribe
      store.init()
      expect(store._unsubscribe).to.equal(unsub)
    })
  })

  describe('destroy', () => {
    it('clears the unsubscribe callback', () => {
      store.init()
      expect(store._unsubscribe).to.not.be.null
      store.destroy()
      expect(store._unsubscribe).to.be.null
    })

    it('is safe to call when not initialized', () => {
      expect(() => store.destroy()).to.not.throw()
    })
  })
})
