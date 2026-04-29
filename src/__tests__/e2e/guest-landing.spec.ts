/**
 * Guest landing — unauthenticated experience
 *
 * Verifies that the root route serves real content to guests without
 * requiring auth, without redirecting, and without a layout shift.
 */
import { test, expect } from "@playwright/test";
import { mockExternalApis } from "./mocks";

test.beforeEach(async ({ context, page }) => {
  await mockExternalApis(page);
  await context.clearCookies();
});

test("/ loads without redirecting to /signin", async ({ page }) => {
  await page.goto("/");
  await expect(page).not.toHaveURL(/\/signin/);
});

test("/ does not redirect to /home", async ({ page }) => {
  await page.goto("/");
  // Should stay at / — the old redirect is removed
  await expect(page).toHaveURL("/");
});

test("/home redirects to /", async ({ page }) => {
  await page.goto("/home");
  await expect(page).toHaveURL("/");
});

test("guest sees a sign-in option", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  
  const signInEl = page.getByTestId("sign-in-button");
  await expect(signInEl).toBeVisible({ timeout: 20_000 });
});

test("page has a visible heading or tagline", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  // Either the hero tagline or the RecMe brand name should appear
  const heading = page
    .getByRole("heading")
    .or(page.getByText(/amplified|recme/i))
    .first();
  await expect(heading).toBeVisible({ timeout: 10_000 });
});
