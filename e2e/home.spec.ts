import { test, expect } from "@playwright/test";

test("home page renders the navigation shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/AR Campus Navigation/);
  await expect(page.locator("main")).toBeVisible({ timeout: 30_000 });
});
