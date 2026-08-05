import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Node by default: the pure-function suites need no DOM, and paying for one on
    // every file slows the run. A file that needs a DOM says so itself with
    // `// @vitest-environment jsdom` on its first line — Vitest 4 removed
    // environmentMatchGlobs, and the docblock keeps the requirement next to the
    // code that has it.
    environment: 'node',
    globals: true,
  },
})
