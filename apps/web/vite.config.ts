import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  optimizeDeps: {
    include: ['maplibre-gl'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@propsphere/types': path.resolve(__dirname, '../../packages/types/src'),
      '@propsphere/utils': path.resolve(__dirname, '../../packages/utils/src'),
      '@propsphere/config': path.resolve(__dirname, '../../packages/config/src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
