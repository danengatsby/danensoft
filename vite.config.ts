import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '127.0.0.1', proxy: { '^/(api|admin)(/|$)': 'http://127.0.0.1:8091', '^/cont(/|$)': 'http://127.0.0.1:8091' } },
  build: { outDir: '.build/dist' },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
