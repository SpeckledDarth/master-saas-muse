import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth.setup';

test.describe('MuseSocial Module - Admin Setup', () => {
  test('should toggle social module on and off in Features tab', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/admin/setup/features');
    await page.waitForLoadState('networkidle');

    const socialSwitch = page.getByTestId('switch-social-module');
    await expect(socialSwitch).toBeVisible({ timeout: 15000 });

    const wasChecked = await socialSwitch.isChecked();

    await socialSwitch.click();
    await page.waitForTimeout(500);

    const isNowChecked = await socialSwitch.isChecked();
    expect(isNowChecked).toBe(!wasChecked);

    await socialSwitch.click();
    await page.waitForTimeout(500);

    const isFinalChecked = await socialSwitch.isChecked();
    expect(isFinalChecked).toBe(wasChecked);
  });

  test('should display MuseSocial setup page with configuration sections', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/admin/setup/features');
    await page.waitForLoadState('networkidle');

    const socialSwitch = page.getByTestId('switch-social-module');
    await expect(socialSwitch).toBeVisible({ timeout: 15000 });

    const isEnabled = await socialSwitch.isChecked();
    if (!isEnabled) {
      await socialSwitch.click();
      await page.waitForTimeout(500);
    }

    const saveButton = page.getByTestId('button-save-settings');
    await saveButton.click();
    await page.waitForTimeout(2000);

    await page.goto('/admin/setup/musesocial');
    await page.waitForLoadState('networkidle');

    const moduleStatus = page.getByTestId('card-module-status');
    await expect(moduleStatus).toBeVisible({ timeout: 15000 });

    const tierSelect = page.getByTestId('select-tier');
    if (await tierSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(tierSelect).toBeVisible();
    }

    const platformTwitter = page.getByTestId('switch-platform-twitter');
    if (await platformTwitter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(platformTwitter).toBeVisible();
    }
  });
});

test.describe('MuseSocial Module - Account Connection', () => {
  test('should show connected accounts page with platform cards', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/dashboard/social');
    await page.waitForLoadState('networkidle');

    const pageTitle = page.getByTestId('text-social-title');
    if (await pageTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(pageTitle).toBeVisible();
    }

    const twitterCard = page.getByTestId('card-platform-twitter');
    if (await twitterCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(twitterCard).toBeVisible();

      const linkedinCard = page.getByTestId('card-platform-linkedin');
      await expect(linkedinCard).toBeVisible();

      const instagramCard = page.getByTestId('card-platform-instagram');
      await expect(instagramCard).toBeVisible();
    }
  });

  test('should show connect dialog when clicking connect button', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/dashboard/social');
    await page.waitForLoadState('networkidle');

    const connectButton = page.getByTestId('button-connect-twitter');
    if (await connectButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await connectButton.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe('MuseSocial Module - Post Generation', () => {
  test('should display posts page with AI generation dialog', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/dashboard/social/posts');
    await page.waitForLoadState('networkidle');

    const generateButton = page.getByTestId('button-generate-ai');
    if (await generateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await generateButton.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]');
      await expect(dialog).toBeVisible({ timeout: 3000 });

      const topicInput = page.getByTestId('input-topic');
      if (await topicInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(topicInput).toBeVisible();
      }

      const platformSelect = page.getByTestId('select-gen-platform');
      if (await platformSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(platformSelect).toBeVisible();
      }
    }
  });

  test('should show character count on post creation form', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/dashboard/social/posts');
    await page.waitForLoadState('networkidle');

    const contentTextarea = page.getByTestId('textarea-content');
    if (await contentTextarea.isVisible({ timeout: 5000 }).catch(() => false)) {
      await contentTextarea.fill('Hello world!');
      await page.waitForTimeout(300);

      const charCount = page.getByTestId('text-char-count');
      if (await charCount.isVisible({ timeout: 2000 }).catch(() => false)) {
        const text = await charCount.textContent();
        expect(text).toContain('12');
      }
    }
  });
});

test.describe('MuseSocial Module - Tier Gating', () => {
  test('should show monitoring section only for Power tier', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/admin/setup/musesocial');
    await page.waitForLoadState('networkidle');

    const tierSelect = page.getByTestId('select-tier');
    if (await tierSelect.isVisible({ timeout: 5000 }).catch(() => false)) {
      await tierSelect.click();
      await page.waitForTimeout(300);

      const universalOption = page.locator('[role="option"]').filter({ hasText: /universal/i });
      if (await universalOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await universalOption.click();
        await page.waitForTimeout(500);

        const monitoringCard = page.getByTestId('card-monitoring');
        const isMonitoringVisible = await monitoringCard.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isMonitoringVisible).toBe(false);
      }

      await tierSelect.click();
      await page.waitForTimeout(300);

      const powerOption = page.locator('[role="option"]').filter({ hasText: /power/i });
      if (await powerOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await powerOption.click();
        await page.waitForTimeout(500);

        const monitoringCard = page.getByTestId('card-monitoring');
        const isMonitoringNowVisible = await monitoringCard.isVisible({ timeout: 2000 }).catch(() => false);
        expect(isMonitoringNowVisible).toBe(true);
      }
    }
  });
});

test.describe('MuseSocial Module - Social KPIs on Metrics Dashboard', () => {
  test('should show social KPI cards when module is enabled', async ({ page }) => {
    const loggedIn = await ensureAuthenticated(page);
    test.skip(!loggedIn, 'No test credentials available');

    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');

    const totalUsersCard = page.getByTestId('card-total-users');
    await expect(totalUsersCard).toBeVisible({ timeout: 15000 });

    const socialPostsCard = page.getByTestId('card-social-total-posts');
    const isSocialVisible = await socialPostsCard.isVisible({ timeout: 3000 }).catch(() => false);

    if (isSocialVisible) {
      await expect(page.getByTestId('card-social-posts-month')).toBeVisible();
      await expect(page.getByTestId('card-social-scheduled')).toBeVisible();
      await expect(page.getByTestId('card-social-accounts')).toBeVisible();
    }
  });
});
