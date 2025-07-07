import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 5173,
    open: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '/CSS': resolve(__dirname, './CSS'),
      '/JS': resolve(__dirname, './JS'),
      '/HTML': resolve(__dirname, './HTML'),
      '/mockups': resolve(__dirname, './mockups')
    }
  }
}) 