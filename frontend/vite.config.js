import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { VitePWA } from 'vite-plugin-pwa'
import istanbul from 'vite-plugin-istanbul'

const coverage = process.env.COVERAGE === 'true'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    nodePolyfills(),
    VitePWA({ registerType: 'autoUpdate' }),
    ...(coverage
      ? [
          istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'tests/'],
            extension: ['.js', '.vue'],
            requireEnv: false,
          }),
        ]
      : []),
  ],
  server: {
    host: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
