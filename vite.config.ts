import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

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
    // Bundle analyzer - generates stats.html in dist folder after build
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst' | 'treemap' | 'network'
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Manual chunking strategy for better code splitting
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM together
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // Recharts (large library, separate chunk)
            if (id.includes('recharts')) {
              return 'vendor-charts';
            }
            // ExcelJS (large library, separate chunk, lazy loaded)
            if (id.includes('exceljs')) {
              return 'vendor-excel';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            // DOMPurify
            if (id.includes('dompurify')) {
              return 'vendor-dom';
            }
            // Other node_modules
            return 'vendor';
          }
          // Page chunks - group by feature area
          if (id.includes('/pages/')) {
            // Dashboard and analytics
            if (id.includes('/dashboard/') || id.includes('/donors/DonorAnalysis')) {
              return 'pages-dashboard';
            }
            // Inventory management
            if (id.includes('/products/') || id.includes('/warehouses/') || id.includes('/donations/')) {
              return 'pages-inventory';
            }
            // Admin pages
            if (id.includes('/categories/') || id.includes('/brands/') || id.includes('/users/')) {
              return 'pages-admin';
            }
            // Kitchen pages
            if (id.includes('/kitchen/')) {
              return 'pages-kitchen';
            }
            // Reports
            if (id.includes('/reports/')) {
              return 'pages-reports';
            }
            // Auth and landing
            if (id.includes('/auth/') || id.includes('/landing/') || id.includes('/profile/')) {
              return 'pages-auth';
            }
          }
        },
      },
      external: [],
    },
    // Enable source maps for better debugging (only in development)
    sourcemap: process.env.NODE_ENV === 'development',
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 500, // Reduced from 1000 to catch larger chunks earlier
    // Minification settings - use esbuild for faster builds (default)
    // Terser is slower but provides better compression, use only if needed
    minify: process.env.NODE_ENV === 'production' ? 'esbuild' : false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/presentation': path.resolve(__dirname, './src/presentation'),
      '@/domain': path.resolve(__dirname, './src/domain'),
      '@/data': path.resolve(__dirname, './src/data'),
      '@/infrastructure': path.resolve(__dirname, './src/infrastructure'),
      '@/shared': path.resolve(__dirname, './src/shared'),
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
