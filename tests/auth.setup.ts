import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  
  await page.getByTestId('input-email').fill(process.env.TEST_USER_EMAIL || 'test@example.com');
  await page.getByTestId('input-password').fill(process.env.TEST_USER_PASSWORD || 'testpassword');
  await page.getByTestId('button-login').click();
  
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
  
  await page.context().storageState({ path: authFile });
});
