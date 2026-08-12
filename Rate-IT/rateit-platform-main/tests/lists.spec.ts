import { test, expect } from '@playwright/test';

test.describe('Lists Tests', () => {
  test('Guest is redirected to login when trying to create a list', async ({ page }) => {
    // Go to lists page
    await page.goto('/lists');
    
    // Check page loaded
    await expect(page.getByRole('heading', { name: 'Personal Collections' })).toBeVisible();

    // Click 'Create List' (top right button or empty state button)
    const createButton = page.getByRole('button', { name: /Create.*List/ }).first();
    await createButton.click();

    // Because we are not logged in, we should be redirected to login
    await expect(page).toHaveURL(/.*\/login\?reason=create_list/);
  });

  // Example of what an authenticated test would look like
  // test('Authenticated user can create a list', async ({ page }) => {
  //   // Requires setting up a logged-in state before this test.
  // });
});
