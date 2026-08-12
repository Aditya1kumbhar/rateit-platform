import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('Bottom navigation routes to correct pages', async ({ page }) => {
    // Start at home page
    await page.goto('/');
    
    // Check we are at home (Hero section)
    await expect(page.getByRole('heading', { name: 'RateIT', exact: true })).toBeVisible();

    // Click Browse as Guest to see bottom navigation
    await page.getByRole('button', { name: 'Browse as Guest' }).click();

    // Click Discover
    await page.getByText('Discover', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/discover/);
    
    // Click Lists
    await page.getByText('Lists', { exact: true }).click();
    await expect(page).toHaveURL(/.*\/lists/);

    // Click Home from Lists
    await page.getByText('Home', { exact: true }).click();
    await expect(page).toHaveURL(/.*\//);

    // Click Profile (may redirect to login if unauthenticated)
    await page.getByText('Profile', { exact: true }).click();
  });
});
