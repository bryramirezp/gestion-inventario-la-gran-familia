import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
      'Cross-Origin-Opener-Policy': 'same-origin',
    },
  },
  base: './',
  plugins: [
    react(),
    // Bundle analyzer for development
    process.env.NODE_ENV === 'development' && {
      name: 'bundle-analyzer',
      generateBundle() {
        console.log('📦 Bundle analysis available at build time');
      },
    },
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // Disable manual chunking to avoid circular dependency issues with Recharts
        // This will bundle everything together but avoid the initialization error
      },
      external: [],
    },
    // Enable source maps for better debugging
    sourcemap: true,
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'recharts',
    ],
    force: true,
  },
});
