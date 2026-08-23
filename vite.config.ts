/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Splits stable third-party deps into their own chunk, separate from app code (which changes
        // every deploy) — browsers keep this cached across releases instead of re-downloading it.
        // Route-level code (pages, Recharts, MapLibre) is already split via React.lazy in App.tsx.
        // Vite 8 (Rolldown) requires a function here — the old object-map form errors at build time.
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (/[\\/](react|react-dom|react-router-dom)[\\/]/.test(id)) return 'vendor-react';
          if (id.includes('@tanstack/react-query')) return 'vendor-query';
          if (/[\\/](i18next|react-i18next)[\\/]/.test(id)) return 'vendor-i18n';
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    // e2e/ holds Playwright specs (separate runner, separate `test()` — see playwright.config.ts);
    // without this exclude, Vitest's default *.spec.ts glob picks them up too and they collide.
    exclude: ['**/node_modules/**', '**/e2e/**'],
  },
});
