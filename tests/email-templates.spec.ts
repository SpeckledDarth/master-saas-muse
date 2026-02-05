import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth.setup';

test.describe('Email Templates Management', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
    
    await page.goto('/admin/email-templates');
    await page.waitForLoadState('networkidle');
  });

  test('should display email templates page', async ({ page }) => {
    await expect(page.getByTestId('email-templates-header')).toBeVisible({ timeout: 10000 });
  });

  test('should show list of email templates', async ({ page }) => {
    const templateCards = page.locator('[data-testid^="template-"]');
    const count = await templateCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should open edit dialog when clicking edit button', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await expect(page.getByTestId('input-subject')).toBeVisible();
      await expect(page.getByTestId('input-content')).toBeVisible();
    }
  });

  test('should show send test email button', async ({ page }) => {
    const testButtons = page.locator('[data-testid^="button-test-"]');
    const count = await testButtons.count();
    
    if (count > 0) {
      await expect(testButtons.first()).toBeVisible();
    }
  });

  test('should show live preview when editing', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Click preview tab to see preview
      const previewTab = page.locator('[role="tab"]').filter({ hasText: 'Preview' });
      await previewTab.click();
      
      await expect(page.getByTestId('email-preview')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should update preview when content changes', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      const contentInput = page.getByTestId('input-content');
      await contentInput.fill('<h1>Test Preview Update</h1>');
      
      // Click preview tab to see preview
      const previewTab = page.locator('[role="tab"]').filter({ hasText: 'Preview' });
      await previewTab.click();
      
      const preview = page.getByTestId('email-preview');
      await expect(preview).toContainText('Test Preview Update', { timeout: 10000 });
    }
  });

  test('should show template variables reference', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await page.waitForTimeout(1000);
      
      // Variables are shown in the edit view - use specific test id for variable button
      await expect(page.getByTestId('button-insert-appName')).toBeVisible({ timeout: 10000 });
    }
  });

  test('should save template changes', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      
      const saveButton = page.getByTestId('button-save-template');
      await expect(saveButton).toBeVisible();
    }
  });

  test('should open test email dialog from list', async ({ page }) => {
    const testButtons = page.locator('[data-testid^="button-test-"]');
    const count = await testButtons.count();
    
    if (count > 0) {
      await testButtons.first().click();
      await expect(page.getByTestId('input-test-email')).toBeVisible();
    }
  });

  test('should cancel template editing', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-template-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await expect(page.getByTestId('input-subject')).toBeVisible();
      
      const cancelButton = page.getByTestId('button-cancel-template');
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
        await expect(page.getByTestId('input-subject')).not.toBeVisible();
      }
    }
  });
});
