import { test, expect } from "@playwright/test";
import { mockExternalApis } from "./mocks";

test.describe("Music Card Interactions", () => {
  test.beforeEach(async ({ page }) => {
    // Mock external APIs to ensure consistent test data and no network dependencies
    await mockExternalApis(page);
    // Navigate to landing page where music cards are displayed
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("music cards show the new quad-action hover state", async ({ page }) => {
    // Wait for the page to settle
    await page.waitForTimeout(2000);
    
    // Wait for at least one card to be present
    const card = page.getByTestId('music-recommendation-card').first();
    await expect(card).toBeVisible({ timeout: 15000 });
    
    // Hover over the card (auto-scrolls)
    await card.hover();

    // Verify center play button exists and is visible
    const playButton = card.locator('button[title="Play"]');
    await expect(playButton).toBeVisible();

    // Verify top-right external link exists
    const externalLink = card.locator('a[title="Open in Spotify"]');
    await expect(externalLink).toBeVisible();

    // Verify bottom-left save button exists
    const saveButton = card.locator('button[title="Save to recommendations"]');
    await expect(saveButton).toBeVisible();

    // Verify bottom-right queue button exists
    const queueButton = card.locator('button[title="Add to Queue"]');
    await expect(queueButton).toBeVisible();
  });

  test("trending song cards show the new centered layout", async ({ page }) => {
    // Wait for trending songs to load (iTunes API)
    const trendingCard = page.getByTestId('trending-song-card').first();
    await expect(trendingCard).toBeVisible({ timeout: 15000 });
    
    // Hover (auto-scrolls)
    await trendingCard.hover();

    // Verify center play button
    const playButton = trendingCard.locator('button[title="Play"]');
    await expect(playButton).toBeVisible();

    // Verify top-right external link
    const externalLink = trendingCard.locator('a[title="Open in Spotify"]');
    await expect(externalLink).toBeVisible();

    // Verify bottom-right queue button
    const queueButton = trendingCard.locator('button[title="Add to Queue"]');
    await expect(queueButton).toBeVisible();
  });
});
