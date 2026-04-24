import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      '@': ['src'],
      '@components': ['src/components'],
      '@assets': ['src/assets'],
      '@api': ['src/api'],
      '@utils': ['src/utils'],
      '@hooks': ['src/hooks'],
      '@services': ['src/services'],
      '@pages': ['src/pages'],
      '@styles': ['src/styles'],
      '@constants': ['src/constants'],
      '@types': ['src/types']
    }
  },
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/api': 'http://localhost:8888'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*'
      ]
    }
  }
})
