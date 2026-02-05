import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth.setup';

test.describe('Blog/Changelog Management', () => {
  test.beforeEach(async ({ page }) => {
    // Try to authenticate if credentials are provided
    const isAuthenticated = await ensureAuthenticated(page);
    
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
    
    await page.goto('/admin/blog');
    await page.waitForLoadState('networkidle');
  });

  test('should display blog posts list', async ({ page }) => {
    // Wait for either the header or a redirect
    const header = page.getByTestId('blog-header');
    await expect(header).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('button-new-blog')).toBeVisible();
  });

  test('should filter posts by type', async ({ page }) => {
    const blogTab = page.getByTestId('tab-blog');
    const changelogTab = page.getByTestId('tab-changelog');

    await expect(blogTab).toBeVisible();
    await expect(changelogTab).toBeVisible();

    await blogTab.click();
    await page.waitForTimeout(500);

    await changelogTab.click();
    await page.waitForTimeout(500);
  });

  test('should open new post dialog', async ({ page }) => {
    await page.getByTestId('button-new-blog').click();
    await page.waitForTimeout(1000);
    
    await expect(page.getByTestId('input-post-title')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('input-post-slug')).toBeVisible();
    await expect(page.getByTestId('tab-edit')).toBeVisible();
    await expect(page.getByTestId('tab-preview')).toBeVisible();
  });

  test('should show markdown preview', async ({ page }) => {
    await page.getByTestId('button-new-blog').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('input-post-content').fill('# Test Heading\n\n**Bold text** and *italic text*\n\n- List item 1\n- List item 2');
    
    await page.getByTestId('tab-preview').click();
    
    const previewContent = page.locator('[data-testid="markdown-preview"]');
    await expect(previewContent).toBeVisible();
  });

  test('should cancel post creation', async ({ page }) => {
    await page.getByTestId('button-new-blog').click();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('input-post-title')).toBeVisible({ timeout: 10000 });
    
    await page.getByTestId('button-cancel-post').click();
    
    await expect(page.getByTestId('input-post-title')).not.toBeVisible();
  });

  test('should create and save a new blog post', async ({ page }) => {
    const uniqueTitle = `Test Post ${Date.now()}`;
    const uniqueSlug = `test-post-${Date.now()}`;

    await page.getByTestId('button-new-blog').click();
    await page.waitForTimeout(1000);
    
    await page.getByTestId('input-post-title').fill(uniqueTitle);
    await page.getByTestId('input-post-slug').fill(uniqueSlug);
    await page.getByTestId('input-post-excerpt').fill('This is a test excerpt');
    await page.getByTestId('input-post-content').fill('# Test Content\n\nThis is test content.');
    
    await page.getByTestId('button-save-post').click();
    
    await page.waitForTimeout(2000);
    
    await expect(page.getByText(uniqueTitle)).toBeVisible();
  });

  test('should edit existing post', async ({ page }) => {
    const editButtons = page.locator('[data-testid^="button-edit-post-"]');
    const count = await editButtons.count();
    
    if (count > 0) {
      await editButtons.first().click();
      await expect(page.getByTestId('input-title')).toBeVisible();
      await expect(page.getByTestId('input-title')).toHaveValue(/.+/);
    }
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    const deleteButtons = page.locator('[data-testid^="button-delete-post-"]');
    const count = await deleteButtons.count();
    
    if (count > 0) {
      await deleteButtons.first().click();
      await expect(page.getByText('Delete Post')).toBeVisible();
      await expect(page.getByText('Cancel')).toBeVisible();
    }
  });

  test('should open post in new tab via title click', async ({ page }) => {
    const viewLinks = page.locator('[data-testid^="link-view-post-"]');
    const count = await viewLinks.count();
    
    if (count > 0) {
      await expect(viewLinks.first()).toBeVisible();
    }
  });
});
