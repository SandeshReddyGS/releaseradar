import { test, expect } from '@playwright/test';

test('User can log in successfully', async ({ page }) => {
  await page.goto('http://localhost:5000/login'); // Change to your frontend URL
  await page.fill('input[type="email"]', 'admin@company.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  // Assuming successful login redirects to a dashboard with this text
  await expect(page.locator('body')).toContainText('Projects'); 
});