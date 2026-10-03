import { test, expect } from '@playwright/test';

test('User can log in successfully', async ({ page }) => {
  // 1. Automatically log browser console and network errors to the CI terminal
  page.on('console', msg => {
    if (msg.type() === 'error') console.log(`BROWSER ERROR: ${msg.text()}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`API FAILED: \({response.url()} returned\){response.status()}`);
    }
  });

  await page.goto('/login');
  
  await page.fill('input[type="email"]', 'admin@company.com');
  await page.fill('input[type="password"]', 'admin123');
  
  await page.click('button[type="submit"]');

  await expect(page.locator('body')).toContainText('Projects', { timeout: 15000 });
});