import { test, expect } from '../support/fixtures.js';
import { randomUUID } from 'node:crypto';

test.describe('API contract and access boundaries', () => {
  test('health endpoint identifies the target @smoke', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok', app: 'tasklane' });
  });

  test('anonymous requests cannot read or create tasks', async ({ request }) => {
    expect((await request.get('/api/tasks')).status()).toBe(401);
    expect((await request.post('/api/tasks', { data: { title: 'Unauthorized' } })).status()).toBe(401);
  });

  test('task lifecycle preserves the API contract @smoke', async ({ account }) => {
    const created = await account.api.post('/api/tasks', { data: { title: '  API lifecycle  ' } });
    expect(created.status()).toBe(201);
    const task = await created.json();
    expect(task).toEqual({ id: expect.any(String), title: 'API lifecycle', done: false });
    const updated = await account.api.patch(`/api/tasks/${task.id}`, { data: { title: 'Updated', done: true } });
    expect(updated.status()).toBe(200);
    expect(await updated.json()).toEqual({ id: task.id, title: 'Updated', done: true });
    expect((await account.api.delete(`/api/tasks/${task.id}`)).status()).toBe(200);
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
  });

  for (const [label, title] of [['empty', ''], ['whitespace', '   '], ['too long', 'x'.repeat(121)], ['non-string', 42]] as const) {
    test(`rejects ${label} task title`, async ({ account }) => {
      const response = await account.api.post('/api/tasks', { data: { title } });
      expect(response.status()).toBe(400);
      expect(await response.json()).toEqual({ error: 'Title must contain 1–120 characters.' });
      expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
    });
  }

  test('accepts maximum-length title', async ({ account }) => {
    const response = await account.api.post('/api/tasks', { data: { title: 'x'.repeat(120) } });
    expect(response.status()).toBe(201);
    expect((await response.json()).title).toHaveLength(120);
  });

  test('invalid update is atomic', async ({ account, seedTask }) => {
    const task = await seedTask('Do not change');
    const response = await account.api.patch(`/api/tasks/${task.id}`, { data: { title: 'Changed', done: 'yes' } });
    expect(response.status()).toBe(400);
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [task] });
  });

  test('another user cannot list, edit or delete owned tasks', async ({ account, seedTask, playwright, baseURL }) => {
    const task = await seedTask('Private task');
    const other = await playwright.request.newContext({ baseURL });
    const credentials = { email: `other-${randomUUID()}@example.test`, password: 'Portfolio-only-123!' };
    try {
      expect((await other.post('/api/register', { data: credentials })).status()).toBe(201);
      expect((await other.post('/api/login', { data: credentials })).status()).toBe(200);
      expect(await (await other.get('/api/tasks')).json()).toEqual({ tasks: [] });
      expect((await other.patch(`/api/tasks/${task.id}`, { data: { done: true } })).status()).toBe(404);
      expect((await other.delete(`/api/tasks/${task.id}`)).status()).toBe(404);
      expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [task] });
    } finally {
      await other.delete('/api/account');
      await other.dispose();
    }
  });

  test('malformed JSON returns a controlled error', async ({ account }) => {
    const response = await account.api.post('/api/tasks', { data: '{broken', headers: { 'Content-Type': 'application/json' } });
    expect(response.status()).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid request body.' });
  });

  test('logout invalidates the session', async ({ account }) => {
    expect((await account.api.post('/api/logout')).status()).toBe(200);
    expect((await account.api.get('/api/tasks')).status()).toBe(401);
  });

  test('account cleanup revokes session and permits clean re-registration', async ({ account, seedTask }) => {
    await seedTask('Remove with account');
    expect((await account.api.delete('/api/account')).status()).toBe(200);
    expect((await account.api.get('/api/tasks')).status()).toBe(401);
    const credentials = { email: account.email, password: account.password };
    expect((await account.api.post('/api/register', { data: credentials })).status()).toBe(201);
    expect((await account.api.post('/api/login', { data: credentials })).status()).toBe(200);
    expect(await (await account.api.get('/api/tasks')).json()).toEqual({ tasks: [] });
  });
});
