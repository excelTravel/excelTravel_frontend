import { test, expect } from '@playwright/test';

// Real E2E smoke test — no mocking, hits the actual dev server and the actual backend (must be running
// at VITE_API_BASE_URL, default http://localhost:3000). Covers the golden path: OTP login, then
// confirming a couple of live, data-wired pages actually render past their loading state.
//
// Uses the backend's dev-mode OTP echo (no SMS/email provider configured locally — see backend
// CLAUDE.md "Auth — in-house OTP"): the request-code response includes `devCode` directly.
const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? 'admin@exceltravel.rw';

test('logs in with OTP and reaches a live, data-wired page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByPlaceholder('staff@exceltravel.rw')).toBeVisible();

  await page.getByPlaceholder('staff@exceltravel.rw').fill(STAFF_EMAIL);
  await page.getByRole('button', { name: 'Get Code' }).click();

  // Dev-mode shows the OTP directly in a badge next to "Enter OTP Code" — read it back instead of
  // needing a real SMS/email inbox.
  const badge = page.locator('span.text-blue-700').first();
  await expect(badge).toBeVisible({ timeout: 10_000 });
  const code = ((await badge.textContent()) ?? '').replace(/\D/g, '');
  expect(code).toHaveLength(6);

  // Filling the 6th digit auto-submits (OTPInput's onComplete calls verify() directly) — no separate
  // "Log in" click; by the time one could fire, the page has already navigated past the login form.
  const otpInputs = page.locator('input[inputmode="numeric"]');
  for (let i = 0; i < 6; i++) await otpInputs.nth(i).fill(code[i]!);

  // A real, live-data page past the shell — proves the session + the first authenticated API call
  // (GET /analytics/overview) both actually work, not just the login form.
  await expect(page).toHaveURL('/');
  await expect(page.getByText('Daily Revenue')).toBeVisible({ timeout: 15_000 });
  // The Overview page has two "Top performing routes" cards (chart + list) — either is proof enough.
  await expect(page.getByText('Top performing routes').first()).toBeVisible();

  // A second live page, reached by real in-app navigation.
  await page.getByRole('link', { name: /trips/i }).first().click();
  await expect(page).toHaveURL('/trips');
  await expect(page.getByRole('table')).toBeVisible({ timeout: 15_000 });
});
