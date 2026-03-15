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
    include: ['react', 'react-dom', 'react-dom/client', 'react-router-dom', 'react-helmet-async', 'sockjs-client/dist/sockjs', '@stomp/stompjs', 'lucide-react', 'three'],
    noDiscovery: true,
    esbuildOptions: {
      jsx: 'automatic',
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx',
      },
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
