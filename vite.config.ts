import path from "path"
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { UserConfig as VitestUserConfig } from 'vitest/config';

// Extend the Vite configuration with Vitest-specific options
const vitestConfig: VitestUserConfig['test'] = {
  globals: true,
  environment: 'jsdom',
  setupFiles: './src/tests/setup.ts',
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Business Management App',
        short_name: 'BizApp',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: '/vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @ts-ignore
  test: vitestConfig,
});