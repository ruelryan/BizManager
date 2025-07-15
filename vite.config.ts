import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'BizManager - Business Management System',
        short_name: 'BizManager',
        description: 'Complete business management solution for small to medium businesses',
        theme_color: '#3B82F6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/vite.svg',
            sizes: '48x48',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ],
        categories: ['business', 'productivity', 'finance']
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  // Add fallback for SPA routing in development
  server: {
    historyApiFallback: true,
  },
  // Ensure proper build configuration for SPA
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
});