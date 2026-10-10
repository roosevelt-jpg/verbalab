import { expect, test } from '@playwright/test';

/**
 * Sign-in → translate happy path (ARCHITECTURE / ENGINEERING).
 * Skips unless a real Clerk test user is configured — we do not fake auth.
 *
 * Required:
 * E2E_CLERK_USER_EMAIL
 * E2E_CLERK_USER_PASSWORD
 * Plus Clerk keys on the running web app and Google MT (or fixture) on the API.
 */
const email = process.env.E2E_CLERK_USER_EMAIL?.trim();
const password = process.env.E2E_CLERK_USER_PASSWORD?.trim();
const clerkLive = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim());

test('sign-in then translate', async ({ page }) => {
  test.skip(
    !email || !password || !clerkLive,
    'Set E2E_CLERK_USER_EMAIL, E2E_CLERK_USER_PASSWORD, and Clerk publishable key to run',
  );

  await page.goto('/sign-in');

  const emailBox = page.getByLabel(/email/i).first();
  await emailBox.waitFor({ state: 'visible', timeout: 30_000 });
  await emailBox.fill(email!);

  const continueBtn = page.getByRole('button', { name: /continue/i }).first();
  if (await continueBtn.isVisible()) {
    await continueBtn.click();
  }

  const passwordBox = page.getByLabel(/password/i).first();
  await passwordBox.waitFor({ state: 'visible', timeout: 30_000 });
  await passwordBox.fill(password!);

  await page.getByRole('button', { name: /continue|sign in/i }).first().click();

  await page.waitForURL(/\/(translate|$)/, { timeout: 60_000 });
  await page.goto('/translate');
  await expect(page.getByRole('heading', { name: 'Translate' })).toBeVisible({ timeout: 30_000 });

  await page.getByTestId('translate-input').fill('Hello');
  await page.getByTestId('translate-submit').click();

  await expect(page.getByTestId('translate-result')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('translate-result')).not.toHaveText(/^$/);
});
