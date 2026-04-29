import { test, expect } from "@playwright/test";
import { mockExternalApis } from "./mocks";

test.describe("Authenticated Pages", () => {
  test.beforeEach(async ({ context, page }) => {
    // 1. Mock external APIs
    await mockExternalApis(page);

    // 2. Mock Authentication by setting the recme_user_id cookie
    await context.addCookies([
      {
        name: "recme_user_id",
        value: "mock-user-123",
        domain: "localhost",
        path: "/",
      },
    ]);

    // 3. Mock the profile API if the page fetches it
    await page.route("**/api/user/profile", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "mock-user-123",
          display_name: "Mock User",
          email: "mock@example.com",
          avatar_url: "https://picsum.photos/100",
          is_pro: false,
        }),
      });
    });
  });

  test("profile page is accessible when logged in", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL("/profile");
    
    // Verify user info is displayed
    const heading = page.getByRole("heading", { name: /profile/i });
    await expect(heading).toBeVisible();
  });

  test("personalize page is accessible when logged in", async ({ page }) => {
    await page.goto("/personalize");
    await expect(page).toHaveURL("/personalize");
    
    // Verify personalization interface is present
    const sectionTitle = page.getByText(/your vibe/i);
    await expect(sectionTitle).toBeVisible();
  });
});
