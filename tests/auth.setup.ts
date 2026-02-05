import { test as setup, expect, Page } from '@playwright/test';

export async function login(page: Page): Promise<boolean> {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  
  if (!email || !password) {
    console.log('No credentials provided');
    return false;
  }
  
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  // Check if already logged in (redirected away from login)
  if (!page.url().includes('/login')) {
    console.log('Already logged in');
    return true;
  }
  
  // Wait for the login form to be ready
  await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
  
  // Fill in login form using the exact data-testid attributes
  await page.getByTestId('input-email').fill(email);
  await page.getByTestId('input-password').fill(password);
  
  // Click the submit button (not the header link)
  await page.locator('button[type="submit"][data-testid="button-login"]').click();
  
  // Wait for navigation after login
  await page.waitForTimeout(5000);
  await page.waitForLoadState('networkidle');
  
  // Check if login was successful (not on login page anymore)
  const currentUrl = page.url();
  const success = !currentUrl.includes('/login');
  
  if (!success) {
    // Check for error message
    const errorText = await page.getByTestId('text-error').textContent().catch(() => null);
    console.log('Login failed:', errorText || 'Unknown error');
  }
  
  return success;
}

export async function ensureAuthenticated(page: Page): Promise<boolean> {
  // First check if we have credentials
  if (!process.env.TEST_USER_EMAIL || !process.env.TEST_USER_PASSWORD) {
    return false;
  }
  
  // Try to access an admin page
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  
  // If redirected to login, try to log in
  if (page.url().includes('/login') || page.url().includes('/auth')) {
    return await login(page);
  }
  
  return true;
}
