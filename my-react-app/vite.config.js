import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
    }),
  ],
  server: {
    host: true, // Allow external connections
    port: 5173,
    strictPort: true,
    hmr: {
      // Let Vite auto-detect HMR settings from server config
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
    force: true, // Force re-optimization
    esbuildOptions: {
      jsx: 'automatic',
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'], // Ensure single instance
    preserveSymlinks: false,
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
})
