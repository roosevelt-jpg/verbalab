import { expect, test } from '@playwright/test';

test.describe('Public console surfaces', () => {
  test('setup page explains required keys when Clerk is missing', async ({ page }) => {
    await page.goto('/setup');
    await expect(page.getByRole('heading', { name: 'Set up Lugemi' })).toBeVisible();
    await expect(page.getByText('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY')).toBeVisible();
  });

  test('docs page loads OpenAPI marketing surface', async ({ page }) => {
    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'Lugemi API' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'POST /v1/translate' })).toBeVisible();
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
