import App from '../App.vue'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

describe('App', () => {
  it('mounts without errors', () => {
    const pinia = createPinia()
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: { template: '<div>Home</div>' } }],
    })

    // App.vue is a thin wrapper around <RouterView />.
    // Actual routing behaviour is covered by E2E tests.
    cy.mount(App, {
      global: { plugins: [pinia, router] },
    })

    cy.get('body').should('exist')
  })
})
