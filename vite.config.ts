import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Base path for GitHub Pages project sites (https://<user>.github.io/<repo>/).
// Set VITE_BASE_PATH="/<repo-name>/" as an env var when building for GitHub Pages.
// Leave unset (defaults to "/") for local dev, a custom domain, or a user/org page.
const basePath = process.env.VITE_BASE_PATH || '/'

export default defineConfig({
  base: basePath,
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
})
