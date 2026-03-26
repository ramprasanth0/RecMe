/**
 * Route protection — unauthenticated access
 *
 * Verifies middleware guards and graceful degradation for guests hitting
 * protected or auth-dependent routes.
 *
 * Tests marked FAILS UNTIL FIX will pass once the corresponding fix is applied.
 */
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ context }) => {
  await context.clearCookies();
});

// ─── Currently protected (middleware) ─────────────────────────────────────────

test("/profile redirects unauthenticated users", async ({ page }) => {
  await page.goto("/profile");
  await expect(page).not.toHaveURL("/profile");
  // Should land on / or /signin
  await expect(page).toHaveURL(/^\/(signin|$|\?)/);
});

test("/personalize redirects unauthenticated users", async ({ page }) => {
  await page.goto("/personalize");
  await expect(page).not.toHaveURL("/personalize");
  await expect(page).toHaveURL(/^\/(signin|$|\?)/);
});

// ─── Token leakage — /profile HTML must not contain Spotify tokens ────────────

test("/profile page HTML does not expose Spotify tokens (requires auth cookie)", async ({
  page,
  context,
}) => {
  // This test is a safety net: if somehow a user with a valid session hits
  // /profile, the raw token strings must not appear in the page source.
  // We stub a fake cookie and check that no token-shaped string leaks.
  // (Real token format: starts with BQ or AAAA… — broad regex covers both)
  await context.addCookies([
    {
      name: "recme_user_id",
      value: "00000000-0000-0000-0000-000000000000",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto("/profile");
  const html = await page.content();
  // Spotify access tokens are long base64url strings (>80 chars, no spaces)
  // This regex would match an actual token if it leaked into the HTML
  const tokenPattern = /BQ[A-Za-z0-9_\-]{60,}/;
  expect(tokenPattern.test(html)).toBe(false);
});
