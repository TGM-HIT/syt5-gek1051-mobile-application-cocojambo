import { defineConfig } from 'cypress'
import codeCoverage from '@cypress/code-coverage/task.js'

export default defineConfig({
  e2e: {
    specPattern: 'tests/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    supportFile: 'tests/support/e2e.js',
    fixturesFolder: 'tests/fixtures',
    baseUrl: 'http://localhost:4173',
    setupNodeEvents(on, config) {
      codeCoverage(on, config)
      return config
    },
  },
  component: {
    specPattern: 'tests/unit/**/*.{cy,spec}.{js,ts,jsx,tsx}',
    supportFile: 'tests/support/component.js',
    indexHtmlFile: 'tests/support/component-index.html',
    fixturesFolder: 'tests/fixtures',
    devServer: {
      framework: 'vue',
      bundler: 'vite',
    },
    setupNodeEvents(on, config) {
      codeCoverage(on, config)
      return config
    },
  },
})
