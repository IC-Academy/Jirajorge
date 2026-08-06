import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Base path para GitHub Pages (project site del repositorio IC-Academy/Jirajorge,
// publicado en https://ic-academy.github.io/Jirajorge/). Respeta mayusculas y
// minusculas exactas: GitHub Pages distingue el nombre de la ruta.
// Se puede sobreescribir con la variable de entorno VITE_BASE_PATH (por ejemplo
// VITE_BASE_PATH=/ para servir en la raiz de un dominio propio), pero el valor por
// defecto ya es el definitivo para este repositorio.
const basePath = process.env.VITE_BASE_PATH || '/Jirajorge/'

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
