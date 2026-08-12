import { test, expect } from '@playwright/test';

test.describe('Auth Tests', () => {
  test('Login page displays email and phone options', async ({ page }) => {
    await page.goto('/login');
    
    // Check that we see the email form by default
    await expect(page.getByRole('button', { name: 'Email Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Phone OTP' })).toBeVisible();

    // Check email inputs are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Switch to Phone OTP
    await page.getByRole('button', { name: 'Phone OTP' }).click();

    // Check phone input is visible
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send Verification Code' })).toBeVisible();
  });
});
