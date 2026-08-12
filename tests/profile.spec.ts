import { test, expect } from '@playwright/test';

test.describe('Profile Tests', () => {
  test('Unauthenticated user navigating to profile gets redirected to login', async ({ page }) => {
    await page.goto('/profile');
    
    // Check redirection to login page with reason=profile
    await expect(page).toHaveURL(/.*\/login\?reason=profile/);
  });
});
