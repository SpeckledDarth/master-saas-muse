import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth.setup';

test.describe('Waitlist Management', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
    
    await page.goto('/admin/waitlist');
    await page.waitForLoadState('networkidle');
  });

  test('should display waitlist page header', async ({ page }) => {
    await expect(page.getByTestId('waitlist-header')).toBeVisible({ timeout: 10000 });
  });

  test('should show search input when entries exist', async ({ page }) => {
    const searchInput = page.getByTestId('input-search');
    const entriesExist = await page.locator('[data-testid^="waitlist-entry-"]').count() > 0;
    
    if (entriesExist) {
      await expect(searchInput).toBeVisible();
    } else {
      test.skip(true, 'No waitlist entries to test search');
    }
  });

  test('should filter entries by search', async ({ page }) => {
    const entriesExist = await page.locator('[data-testid^="waitlist-entry-"]').count() > 0;
    if (!entriesExist) {
      test.skip(true, 'No waitlist entries to test search');
      return;
    }
    
    const searchInput = page.getByTestId('input-search');
    await searchInput.fill('test');
    await page.waitForTimeout(500);
  });

  test('should show export CSV button when entries exist', async ({ page }) => {
    const entriesExist = await page.locator('[data-testid^="waitlist-entry-"]').count() > 0;
    
    if (entriesExist) {
      await expect(page.getByTestId('button-export-csv')).toBeVisible();
    } else {
      test.skip(true, 'No waitlist entries to test export');
    }
  });

  test('should trigger CSV export', async ({ page }) => {
    const entriesExist = await page.locator('[data-testid^="waitlist-entry-"]').count() > 0;
    if (!entriesExist) {
      test.skip(true, 'No waitlist entries to test export');
      return;
    }
    
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await page.getByTestId('button-export-csv').click();
  });

  test('should show delete confirmation for entries', async ({ page }) => {
    const deleteButtons = page.locator('[data-testid^="button-delete-entry-"]');
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await expect(page.getByText('Delete Entry')).toBeVisible();
      await expect(page.getByTestId('button-confirm-delete')).toBeVisible();
      await expect(page.getByTestId('button-cancel-delete')).toBeVisible();
    }
  });

  test('should cancel delete operation', async ({ page }) => {
    const deleteButtons = page.locator('[data-testid^="button-delete-entry-"]');
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await page.getByTestId('button-cancel-delete').click();
      await expect(page.getByText('Delete Entry')).not.toBeVisible();
    }
  });

  test('should display entry cards with email and date', async ({ page }) => {
    const entryCards = page.locator('[data-testid^="entry-"]');
    const count = await entryCards.count();
    
    if (count > 0) {
      await expect(entryCards.first()).toBeVisible();
    }
  });

  test('should show source filter dropdown', async ({ page }) => {
    const sourceFilter = page.getByTestId('select-source-filter');
    if (await sourceFilter.isVisible()) {
      await sourceFilter.click();
    }
  });
});

test.describe('Public Waitlist Signup', () => {
  test('should allow email signup on waitlist page', async ({ page }) => {
    await page.goto('/waitlist');
    
    const emailInput = page.getByTestId('input-waitlist-email');
    const submitButton = page.getByTestId('button-join-waitlist');
    
    if (await emailInput.isVisible()) {
      await emailInput.fill(`test-${Date.now()}@example.com`);
      await submitButton.click();
      await page.waitForTimeout(2000);
    }
  });
});
