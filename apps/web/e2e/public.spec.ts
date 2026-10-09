import { expect, test } from '@playwright/test';

test.describe('Public console surfaces', () => {
  test('setup page explains required keys when Clerk is missing', async ({ page }) => {
    await page.goto('/setup');
    // With Clerk configured, /setup redirects home; without it, show the key checklist.
    if (page.url().includes('/setup')) {
      await expect(page.getByRole('heading', { name: 'Set up Lugemi' })).toBeVisible();
      await expect(page.getByText('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')).toBeVisible();
    } else {
      await expect(page).not.toHaveURL(/\/setup/);
    }
  });

  test('docs page loads OpenAPI marketing surface', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'Lugemi API' })).toBeVisible();
    const translateCard = page.locator('.vl-endpoint-card').first();
    await expect(translateCard).toContainText('POST');
    await expect(translateCard).toContainText('/v1/translate');
    await expect(page.getByRole('link', { name: 'API reference' }).first()).toBeVisible();
  });

  test('coverage page is reachable', async ({ page }) => {
    await page.goto('/coverage');
    await expect(page.getByRole('heading', { name: /coverage/i })).toBeVisible();
  });

  test('web health endpoint is ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.ok()).toBeTruthy();
    expect(await res.json()).toMatchObject({ status: 'ok', service: 'lugemi-web' });
  });
});
