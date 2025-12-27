import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Allow external connections
    port: 5173,
    strictPort: true,
    hmr: {
      // Let Vite auto-detect HMR settings from server config
    },
  },
})
