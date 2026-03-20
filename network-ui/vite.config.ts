import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Порт API-сервера
const API_PORT = process.env.API_PORT || '3006';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    host: true,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: true,
        secure: false
      },
    },
  },
})
