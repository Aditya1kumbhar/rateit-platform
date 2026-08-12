import { test, expect } from '@playwright/test';

test.describe('Error Catching Tests', () => {
  const pagesToTest = ['/', '/discover', '/lists', '/profile', '/login'];

  for (const path of pagesToTest) {
    test(`Page ${path} should load without Next.js errors`, async ({ page }) => {
      await page.goto(path);
      
      // Check for Next.js build error or runtime error overlays
      // They usually contain "Unhandled Runtime Error" or "Failed to compile"
      const errorOverlay = page.locator('text="Unhandled Runtime Error"').first();
      await expect(errorOverlay).not.toBeVisible();

      const compileError = page.locator('text="Failed to compile"').first();
      await expect(compileError).not.toBeVisible();
    });
  }
});
