import { expect, test } from '@playwright/test';

test.describe('Lugemi Branded Auth Pages', () => {
  test('sign-in renders Lugemi-styled form without Clerk watermark', async ({ page }) => {
    await page.goto('/sign-in');

    // Header and brand titles
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.locator('.auth-shell__brand-name')).toContainText('Lugemi');

    // Lugemi custom form elements
    await expect(page.locator('form.lugemi-auth-form')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button.lugemi-auth-submit-btn')).toBeVisible();

    // Verify Clerk card chrome and "Secured by clerk" footer are absent
    await expect(page.locator('.cl-card')).toHaveCount(0);
    await expect(page.locator('.cl-footer')).toHaveCount(0);
    await expect(page.getByText('Secured by clerk', { exact: false })).toHaveCount(0);
  });

  test('sign-up renders Lugemi-styled form with first name, last name, and onboarding progress', async ({ page }) => {
    await page.goto('/sign-up');

    // Header and brand titles
    await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
    await expect(page.locator('.auth-shell__brand-name')).toContainText('Lugemi');

    // Onboarding progress steps
    const steps = page.locator('.auth-shell__steps li');
    await expect(steps.first()).toHaveText('Account');
    await expect(steps.first()).toHaveClass(/is-active/);

    // Form fields
    await expect(page.locator('form.lugemi-auth-form')).toBeVisible();
    await expect(page.locator('input#first-name')).toBeVisible();
    await expect(page.locator('input#last-name')).toBeVisible();
    await expect(page.locator('input#email')).toBeVisible();
    await expect(page.locator('input#password')).toBeVisible();
    await expect(page.locator('button.lugemi-auth-submit-btn')).toBeVisible();

    // Verify Clerk card chrome and "Secured by clerk" footer are absent
    await expect(page.locator('.cl-card')).toHaveCount(0);
    await expect(page.locator('.cl-footer')).toHaveCount(0);
    await expect(page.getByText('Secured by clerk', { exact: false })).toHaveCount(0);
  });
});
