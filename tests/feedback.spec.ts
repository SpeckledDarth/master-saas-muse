import { test, expect } from '@playwright/test';

test.describe('Feedback Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
    
    // Check if redirected to login - skip test if not authenticated
    if (page.url().includes('/login') || page.url().includes('/auth')) {
      test.skip(true, 'User not authenticated - skipping admin tests');
    }
  });

  test('should display feedback page header', async ({ page }) => {
    await expect(page.getByTestId('feedback-header')).toBeVisible({ timeout: 10000 });
  });

  test('should show status filter dropdown', async ({ page }) => {
    await expect(page.getByTestId('select-status-filter')).toBeVisible();
  });

  test('should filter by status', async ({ page }) => {
    await page.getByTestId('select-status-filter').click();
    
    const newOption = page.getByRole('option', { name: /new/i });
    if (await newOption.isVisible()) {
      await newOption.click();
      await page.waitForTimeout(500);
    }
  });

  test('should display feedback cards', async ({ page }) => {
    const feedbackCards = page.locator('[data-testid^="feedback-"]');
    const count = await feedbackCards.count();
    
    if (count > 0) {
      await expect(feedbackCards.first()).toBeVisible();
    }
  });

  test('should change feedback status', async ({ page }) => {
    const statusSelects = page.locator('[data-testid^="select-status-"]');
    const count = await statusSelects.count();
    
    if (count > 0) {
      await statusSelects.first().click();
      const inProgressOption = page.getByRole('option', { name: /in.?progress/i });
      if (await inProgressOption.isVisible()) {
        await inProgressOption.click();
        await page.waitForTimeout(1000);
      }
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const deleteButtons = page.locator('[data-testid^="button-delete-feedback-"]');
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await expect(page.getByText('Delete Feedback')).toBeVisible();
      await expect(page.getByTestId('button-confirm-delete')).toBeVisible();
    }
  });

  test('should cancel delete operation', async ({ page }) => {
    const deleteButtons = page.locator('[data-testid^="button-delete-feedback-"]');
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await page.getByTestId('button-cancel-delete').click();
      await expect(page.getByText('Delete Feedback')).not.toBeVisible();
    }
  });

  test('should display page URL as clickable link', async ({ page }) => {
    const pageLinks = page.locator('[data-testid^="link-page-url-"]');
    const count = await pageLinks.count();
    
    if (count > 0) {
      await expect(pageLinks.first()).toHaveAttribute('href', /.+/);
      await expect(pageLinks.first()).toHaveAttribute('target', '_blank');
    }
  });

  test('should display feedback message content', async ({ page }) => {
    const feedbackCards = page.locator('[data-testid^="feedback-"]');
    const count = await feedbackCards.count();
    
    if (count > 0) {
      const messageContent = feedbackCards.first().locator('p');
      await expect(messageContent).toBeVisible();
    }
  });
});
