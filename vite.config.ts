/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    legacy()
  ],
  server: {
    port: 5173,
    strictPort: true,
    // La cookie de sesión de canchago es HttpOnly + sin CORS: este proxy hace que /api/*
    // parezca mismo origen desde el navegador, evitando el problema por completo (ver
    // spec/constitution/tech-stack.md §6 y spec/features/002-autenticacion/plan.md).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    // `yarn test:coverage` — el reporte se lee como mapa de lo que quedó sin recorrer, no como
    // una meta a maximizar (ver spec/features/013-calidad-observabilidad-lanzamiento/spec.md).
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.config.*', 'src/main.tsx', 'src/vite-env.d.ts', 'cypress/**', 'android/**', 'ios/**'],
    },
  }
})
