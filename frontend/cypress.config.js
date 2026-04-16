import { defineConfig } from 'cypress'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

function registerPlugins(on, config) {
  require('cypress-mochawesome-reporter/plugin')(on)
  require('@cypress/code-coverage/task')(on, config)
  return config
}

export default defineConfig({
  reporter: 'cypress-mochawesome-reporter',
  reporterOptions: {
    reportDir: 'cypress/reports',
    charts: true,
    reportPageTitle: 'CocoJambo Test Report',
    embeddedScreenshots: true,
    inlineAssets: true,
    saveAllAttempts: false,
  },
  e2e: {
    specPattern: 'tests/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    supportFile: 'tests/support/e2e.js',
    fixturesFolder: 'tests/fixtures',
    baseUrl: 'http://localhost:4173',
    setupNodeEvents: registerPlugins,
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
    setupNodeEvents: registerPlugins,
  },
})
