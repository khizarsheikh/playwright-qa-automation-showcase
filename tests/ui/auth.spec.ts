import { test, expect } from '../support/fixtures.js';

test.describe('Authentication', () => {
  test('a new visitor can create a demo account', async ({ page, account }) => {
    // Reuse the fixture's unique identity and automatic cleanup, but register via UI.
    expect((await account.api.delete('/api/account')).status()).toBe(200);
    await page.goto('/');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible();
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  });

  test('valid credentials open the workspace @smoke', async ({ page, account }) => {
    await test.step('Sign in through the UI', async () => {
      await page.goto('/');
      await page.getByLabel('Email address').fill(account.email);
      await page.getByLabel('Password', { exact: true }).fill(account.password);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    });
    await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeVisible();
    await expect(page.getByText(account.email, { exact: true })).toBeVisible();
  });

  test('incorrect password shows an actionable error', async ({ page, account }) => {
    await page.goto('/');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert').filter({ visible: true })).toHaveText('Invalid email or password.');
    await expect(page.getByRole('heading', { name: 'Make room for progress.' })).toBeHidden();
  });

  test('sign out prevents access after reloading', async ({ board, page }) => {
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Sign in', exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Welcome to Tasklane' })).toBeVisible();
    expect((await page.request.get('/api/tasks')).status()).toBe(401);
  });

  test('existing account cannot be registered twice', async ({ account, page }) => {
    await page.goto('/');
    await page.getByLabel('Email address').fill(account.email);
    await page.getByLabel('Password', { exact: true }).fill(account.password);
    await page.getByRole('button', { name: 'Create demo account' }).click();
    await expect(page.getByRole('alert').filter({ visible: true })).toHaveText('Account already exists.');
  });
});
