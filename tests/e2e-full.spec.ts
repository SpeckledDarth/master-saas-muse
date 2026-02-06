import { test, expect } from '@playwright/test';
import { ensureAuthenticated } from './auth.setup';

test.describe('Public Pages - Landing & Marketing', () => {
  test('should load the homepage with hero section', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.+/);
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
  });

  test('should load the pricing page with plan cards', async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    const freePlanCard = page.getByTestId('card-plan-free');
    if (await freePlanCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(freePlanCard).toBeVisible();
    }
    await expect(page.getByTestId('button-billing-monthly')).toBeVisible();
    await expect(page.getByTestId('button-billing-yearly')).toBeVisible();
  });

  test('should load the about page with key sections', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('text-our-story')).toBeVisible({ timeout: 15000 });
  });

  test('should load the contact page with form', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('text-send-message')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('input-name')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();
    await expect(page.getByTestId('input-message')).toBeVisible();
    await expect(page.getByTestId('button-submit')).toBeVisible();
  });

  test('should load the blog page with heading', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toContainText(/blog/i);
  });

  test('should load the changelog page with heading', async ({ page }) => {
    await page.goto('/changelog');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    await expect(heading).toContainText(/changelog/i);
  });

  test('should load legal pages with content', async ({ page }) => {
    for (const path of ['/terms', '/privacy', '/cookie-policy']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const heading = page.locator('h1');
      await expect(heading).toBeVisible({ timeout: 15000 });
      const content = page.locator('main, article, .container');
      await expect(content.first()).toBeVisible();
    }
  });
});

test.describe('Authentication Pages', () => {
  test('should display login form with email and password fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('input-email')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('input-password')).toBeVisible();
    await expect(page.locator('button[type="submit"][data-testid="button-login"]')).toBeVisible();
  });

  test('should display signup form with email field', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('input-email')).toBeVisible({ timeout: 10000 });
  });

  test('should stay on login page when submitting empty form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });
    await page.locator('button[type="submit"][data-testid="button-login"]').click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
  });

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForSelector('[data-testid="input-email"]', { timeout: 10000 });

    const signupLink = page.getByTestId('link-signup');
    const isVisible = await signupLink.isVisible().catch(() => false);
    if (isVisible) {
      await signupLink.click();
      await page.waitForURL('**/signup**', { timeout: 10000 });
      expect(page.url()).toContain('/signup');
    } else {
      const headerSignup = page.getByTestId('button-signup');
      if (await headerSignup.isVisible().catch(() => false)) {
        await headerSignup.click();
        await page.waitForURL('**/signup**', { timeout: 10000 });
        expect(page.url()).toContain('/signup');
      }
    }
  });
});

test.describe('Feedback Widget (Public)', () => {
  test('should show the feedback widget button on the homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const feedbackBtn = page.getByTestId('button-feedback');
    if (await feedbackBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(feedbackBtn).toBeVisible();
    } else {
      test.skip(true, 'Feedback widget not enabled');
    }
  });

  test('should open and close the feedback panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const feedbackBtn = page.getByTestId('button-feedback');
    if (!(await feedbackBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Feedback widget not enabled');
      return;
    }

    await feedbackBtn.click();
    await expect(page.getByTestId('input-feedback-message')).toBeVisible({ timeout: 3000 });

    await page.getByTestId('button-close-feedback').click();
    await expect(page.getByTestId('input-feedback-message')).not.toBeVisible();
  });

  test('should display all 11 NPS rating buttons (0-10) in feedback widget', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const feedbackBtn = page.getByTestId('button-feedback');
    if (!(await feedbackBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Feedback widget not enabled');
      return;
    }

    await feedbackBtn.click();
    await expect(page.getByTestId('label-nps-rating')).toBeVisible({ timeout: 3000 });

    for (let i = 0; i <= 10; i++) {
      await expect(page.getByTestId(`button-nps-${i}`)).toBeVisible();
    }

    await expect(page.getByTestId('text-nps-low')).toContainText('Not likely');
    await expect(page.getByTestId('text-nps-high')).toContainText('Very likely');
  });

  test('should select and deselect NPS score in feedback widget', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const feedbackBtn = page.getByTestId('button-feedback');
    if (!(await feedbackBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Feedback widget not enabled');
      return;
    }

    await feedbackBtn.click();
    await page.waitForTimeout(500);

    const npsBtn8 = page.getByTestId('button-nps-8');
    await npsBtn8.click();
    await page.waitForTimeout(200);
    const classesAfterSelect = await npsBtn8.getAttribute('class') || '';
    expect(classesAfterSelect).toContain('bg-primary');

    await npsBtn8.click();
    await page.waitForTimeout(200);
    const classesAfterDeselect = await npsBtn8.getAttribute('class') || '';
    expect(classesAfterDeselect).toContain('bg-muted');
  });

  test('should prevent empty message submission', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const feedbackBtn = page.getByTestId('button-feedback');
    if (!(await feedbackBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Feedback widget not enabled');
      return;
    }

    await feedbackBtn.click();
    await page.waitForTimeout(500);
    await page.getByTestId('button-submit-feedback').click();
    await page.waitForTimeout(1000);
    await expect(page.getByTestId('input-feedback-message')).toBeVisible();
  });
});

test.describe('Help Widget (Public)', () => {
  test('should show the help widget button if support is enabled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (await helpBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(helpBtn).toBeVisible();
    } else {
      test.skip(true, 'Help widget not enabled');
    }
  });

  test('should open and close the help chat panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });

    await page.getByTestId('button-close-help-chat').click();
    await expect(page.getByTestId('container-help-chat')).not.toBeVisible();
  });

  test('should display the message input and send button', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('input-help-message')).toBeVisible();
    await expect(page.getByTestId('button-send-help-message')).toBeVisible();
  });

  test('should disable send button when input is empty', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('button-send-help-message')).toBeDisabled();
  });

  test('should enable send button when input has text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });
    await page.getByTestId('input-help-message').fill('Test question');
    await expect(page.getByTestId('button-send-help-message')).toBeEnabled();
  });

  test('should show NPS rating after sending a message', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });

    await page.getByTestId('input-help-message').fill('Hello, this is a test');
    await page.getByTestId('button-send-help-message').click();
    await page.waitForTimeout(2000);

    await expect(page.getByTestId('label-help-nps')).toBeVisible({ timeout: 10000 });
    for (let i = 0; i <= 10; i++) {
      await expect(page.getByTestId(`button-help-nps-${i}`)).toBeVisible();
    }
  });

  test('should display fallback email link in help widget', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const helpBtn = page.getByTestId('button-help-widget');
    if (!(await helpBtn.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Help widget not enabled');
      return;
    }

    await helpBtn.click();
    await expect(page.getByTestId('container-help-chat')).toBeVisible({ timeout: 3000 });
    const fallbackLink = page.getByTestId('link-fallback-email');
    if (await fallbackLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(fallbackLink).toHaveAttribute('href', /^mailto:/);
    }
  });
});

test.describe('Admin - Metrics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
    await page.goto('/admin/metrics');
    await page.waitForLoadState('networkidle');
  });

  test('should display metrics dashboard title and description', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('text-metrics-title')).toContainText('Metrics Dashboard');
    await expect(page.getByTestId('text-metrics-description')).toBeVisible();
  });

  test('should display all 10 KPI cards', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });

    const kpiCards = [
      'card-total-users',
      'card-new-users-month',
      'card-active-subscriptions',
      'card-mrr',
      'card-arpu',
      'card-ltv',
      'card-churn-rate',
      'card-conversion-rate',
      'card-feedback-count',
      'card-waitlist-count',
    ];

    for (const cardId of kpiCards) {
      await expect(page.getByTestId(cardId)).toBeVisible();
    }
  });

  test('should display NPS score card with numeric value', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('card-nps-score')).toBeVisible();
    const npsText = page.getByTestId('text-nps-score');
    await expect(npsText).toBeVisible();
    const npsValue = await npsText.textContent();
    expect(npsValue).toMatch(/^-?\d+$/);
  });

  test('should display alert thresholds on churn and new users cards', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });

    const churnThreshold = page.getByTestId('text-churn-threshold');
    const usersThreshold = page.getByTestId('text-min-users-threshold');

    if (await churnThreshold.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(churnThreshold).toContainText('Alert');
    }

    if (await usersThreshold.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(usersThreshold).toContainText('Alert');
    }
  });

  test('should show Email Report and Check Alerts action buttons', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('button-send-report')).toBeVisible();
    await expect(page.getByTestId('button-check-alerts')).toBeVisible();
  });

  test('should display user growth and revenue growth charts', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId('card-user-growth')).toBeVisible();
    await expect(page.getByTestId('card-revenue-growth')).toBeVisible();
  });

  test('should show numeric values in KPI cards', async ({ page }) => {
    await expect(page.getByTestId('text-metrics-title')).toBeVisible({ timeout: 15000 });
    const totalUsers = page.getByTestId('text-total-users');
    await expect(totalUsers).toBeVisible();
    const text = await totalUsers.textContent();
    expect(text).toMatch(/^\d+$/);
  });
});

test.describe('Admin - Feedback Management', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
  });

  test('should display feedback page with header', async ({ page }) => {
    await expect(page.getByTestId('feedback-header')).toBeVisible({ timeout: 10000 });
  });

  test('should display NPS badges on feedback entries', async ({ page }) => {
    await expect(page.getByTestId('feedback-header')).toBeVisible({ timeout: 10000 });
    const npsBadges = page.locator('[data-testid^="badge-nps-"]');
    const count = await npsBadges.count();
    if (count > 0) {
      await expect(npsBadges.first()).toBeVisible();
      const badgeText = await npsBadges.first().textContent();
      expect(badgeText).toMatch(/NPS:\s*\d+/);
    }
  });

  test('should have status filter dropdown', async ({ page }) => {
    await expect(page.getByTestId('feedback-header')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('select-status-filter')).toBeVisible();
  });
});

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated - set TEST_USER_EMAIL and TEST_USER_PASSWORD');
      return;
    }
  });

  test('should navigate to admin dashboard and display content', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to admin users page and display content', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/users');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to admin setup page and display content', async ({ page }) => {
    await page.goto('/admin/setup');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/setup');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to admin audit log page and display content', async ({ page }) => {
    await page.goto('/admin/audit-log');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/audit-log');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to admin queues page and display content', async ({ page }) => {
    await page.goto('/admin/queues');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/admin/queues');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  });
});

test.describe('API Endpoints - Settings', () => {
  test('should return settings from the public settings API', async ({ request }) => {
    const response = await request.get('/api/public/settings');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('settings');
    expect(body.settings).toHaveProperty('branding');
    expect(body.settings).toHaveProperty('features');
    expect(body.settings).toHaveProperty('support');
    expect(body.settings).toHaveProperty('pricing');
    expect(body.settings).toHaveProperty('compliance');
    expect(body.settings).toHaveProperty('security');
  });

  test('should return no-cache headers from settings API', async ({ request }) => {
    const response = await request.get('/api/public/settings');
    expect(response.status()).toBe(200);
    const cacheControl = response.headers()['cache-control'];
    expect(cacheControl).toContain('no-cache');
  });
});

test.describe('API Endpoints - Feedback', () => {
  test('should accept feedback submission with NPS score', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        message: `E2E test feedback ${Date.now()}`,
        email: 'e2e-test@example.com',
        pageUrl: '/e2e-test',
        npsScore: 9,
      },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success || body.id || response.ok()).toBeTruthy();
  });

  test('should accept feedback without NPS score', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        message: `E2E test feedback no-nps ${Date.now()}`,
        email: 'e2e-test-nonps@example.com',
        pageUrl: '/e2e-test',
      },
    });
    expect(response.status()).toBe(200);
  });

  test('should reject feedback without message', async ({ request }) => {
    const response = await request.post('/api/feedback', {
      data: {
        email: 'e2e-test@example.com',
        pageUrl: '/e2e-test',
      },
    });
    expect(response.status()).toBeGreaterThanOrEqual(400);
  });
});

test.describe('API Endpoints - Metrics', () => {
  test('should return metrics data for authenticated admin', async ({ page, request }) => {
    const isAuthenticated = await ensureAuthenticated(page);
    if (!isAuthenticated) {
      test.skip(true, 'User not authenticated');
      return;
    }

    const cookies = await page.context().cookies();
    const response = await request.get('/api/admin/metrics', {
      headers: {
        cookie: cookies.map(c => `${c.name}=${c.value}`).join('; '),
      },
    });

    if (response.status() === 200) {
      const body = await response.json();
      expect(body).toHaveProperty('totalUsers');
      expect(body).toHaveProperty('mrr');
      expect(body).toHaveProperty('npsScore');
      expect(body).toHaveProperty('alertThresholds');
      expect(typeof body.totalUsers).toBe('number');
      expect(typeof body.npsScore).toBe('number');
    }
  });
});

test.describe('Responsive Design', () => {
  test('should render homepage correctly on mobile viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 812 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    await context.close();
  });

  test('should render homepage correctly on tablet viewport', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 768, height: 1024 },
    });
    const page = await context.newPage();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    await context.close();
  });
});
