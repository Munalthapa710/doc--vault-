import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          charts: ['recharts'],
          table: ['@tanstack/react-table'],
          query: ['@tanstack/react-query'],
          forms: ['react-hook-form', '@hookform/resolvers', 'zod'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', 'axios', 'lucide-react', 'clsx', 'react-hot-toast']
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
