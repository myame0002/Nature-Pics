import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/Nature-Pics/',
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
      '/Nature-Pics/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/Nature-Pics/, ''),
      },
    },
  },
  plugins: [react()],
})
