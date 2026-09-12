import { test, expect } from '../support/fixtures.js';

test.describe('Task management', () => {
  test('create a task and retain it after reload @smoke', async ({ board, account, page }) => {
    await test.step('Create task through UI', () => board.add('Review release checklist'));
    await test.step('Verify persisted API state', async () => {
      const response = await account.api.get('/api/tasks');
      expect(await response.json()).toMatchObject({ tasks: [{ title: 'Review release checklist', done: false }] });
    });
    await page.reload();
    await expect(board.row('Review release checklist')).toBeVisible();
  });

  test('edit an existing task', async ({ seedTask, board, page }) => {
    await seedTask('Draft release notes');
    await page.reload();
    await board.rename('Draft release notes', 'Publish release notes');
    await page.reload();
    await expect(board.row('Publish release notes')).toBeVisible();
    await expect(board.row('Draft release notes')).toHaveCount(0);
  });

  test('completion and filters reflect the task state @smoke', async ({ seedTask, board, page }) => {
    await seedTask('Run regression');
    await seedTask('Review findings');
    await page.reload();
    await board.row('Run regression').getByRole('checkbox').check();
    await expect(page.locator('#doneCount')).toHaveText('1');
    await board.filter('Completed');
    await expect(board.row('Run regression')).toBeVisible();
    await expect(board.row('Review findings')).toHaveCount(0);
    await board.filter('Active');
    await expect(board.row('Review findings')).toBeVisible();
    await expect(board.row('Run regression')).toHaveCount(0);
  });

  test('a completed task can be reopened', async ({ seedTask, board, page }) => {
    await seedTask('Check deployment', true);
    await page.reload();
    await board.row('Check deployment').getByRole('checkbox').uncheck();
    await expect(page.locator('#doneCount')).toHaveText('0');
    await board.filter('Active');
    await expect(board.row('Check deployment')).toBeVisible();
  });

  test('delete a task and verify it stays deleted', async ({ seedTask, board, page, account }) => {
    await seedTask('Temporary task');
    await page.reload();
    await board.row('Temporary task').getByRole('button', { name: 'Delete' }).click();
    await expect(board.row('Temporary task')).toHaveCount(0);
    await page.reload();
    await expect(page.getByText('No tasks in this view.', { exact: true })).toBeVisible();
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
  });

  test('whitespace-only titles are rejected without creating a task', async ({ board, page, account }) => {
    await page.getByRole('textbox', { name: 'New task' }).fill('   ');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('alert').filter({ visible: true })).toHaveText('Title must contain 1–120 characters.');
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
  });

  test('HTML-like text is rendered as text', async ({ board, page }) => {
    const title = '<img src=x onerror="window.compromised=true">';
    await board.add(title);
    await expect(board.row(title).locator('img')).toHaveCount(0);
    expect(await page.evaluate(() => 'compromised' in window)).toBe(false);
  });

  test('cancel editing leaves the original title unchanged', async ({ seedTask, board, page }) => {
    await seedTask('Original title');
    await page.reload();
    await board.row('Original title').getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Task title', { exact: true }).fill('Unsaved title');
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(board.row('Original title')).toBeVisible();
    await expect(board.row('Unsaved title')).toHaveCount(0);
  });

  test('failed save reports an error without losing the entered title', async ({ board, page, account }) => {
    await page.route('**/api/tasks', route => route.request().method() === 'POST'
      ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'Service temporarily unavailable. Please retry.' }) })
      : route.continue());
    await page.getByRole('textbox', { name: 'New task' }).fill('Recoverable task');
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await expect(page.getByRole('alert').filter({ visible: true })).toHaveText('Service temporarily unavailable. Please retry.');
    await expect(page.getByRole('textbox', { name: 'New task' })).toHaveValue('Recoverable task');
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
  });
});
