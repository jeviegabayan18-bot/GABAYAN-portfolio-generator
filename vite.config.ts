import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 4321,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 4321,
    strictPort: true,
  },
  build: {
    chunkSizeWarningLimit: 700,
  },
})
