import { defineConfig, devices } from '@playwright/test';

// Minimal E2E setup: one project (Chromium), against the real dev server + real backend (no mocking —
// that's what src/test/msw covers). `reuseExistingServer` so `npm run test:e2e` works whether or not
// you already have `npm run dev` running.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30_000,
  },
});
