import { test as base, expect, type APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { TaskBoard } from '../pages/task-board.js';

export type Task = { id: string; title: string; done: boolean };
type Account = { email: string; password: string; api: APIRequestContext };
type Fixtures = {
  account: Account;
  board: TaskBoard;
  seedTask: (title: string, done?: boolean) => Promise<Task>;
};

export const test = base.extend<Fixtures>({
  account: async ({ playwright, baseURL }, use) => {
    const api = await playwright.request.newContext({ baseURL });
    const credentials = { email: `qa-${randomUUID()}@example.test`, password: 'Portfolio-only-123!' };
    try {
      const registered = await api.post('/api/register', { data: credentials });
      expect(registered.status(), 'Create unique account for this test').toBe(201);
      const login = await api.post('/api/login', { data: credentials });
      expect(login.status()).toBe(200);
      await use({ ...credentials, api });
    } finally {
      // Login again because a test may deliberately invalidate the session.
      const login = await api.post('/api/login', { data: credentials });
      if (login.ok()) {
        const cleanup = await api.delete('/api/account');
        expect(cleanup.status(), 'Delete this test account and its tasks').toBe(200);
      } else {
        // Account-deletion tests remove their own account.
        expect(login.status()).toBe(401);
      }
      await api.dispose();
    }
  },
  board: async ({ account, page }, use) => {
    // API-assisted authentication, while login itself has dedicated UI coverage.
    const storage = await account.api.storageState();
    await page.context().addCookies(storage.cookies);
    const board = new TaskBoard(page);
    await board.open();
    await use(board);
  },
  seedTask: async ({ account }, use) => {
    await use(async (title, done = false) => {
      const response = await account.api.post('/api/tasks', { data: { title } });
      expect(response.status()).toBe(201);
      const task: Task = await response.json();
      if (done) {
        const updated = await account.api.patch(`/api/tasks/${task.id}`, { data: { done } });
        expect(updated.status()).toBe(200);
        return updated.json();
      }
      return task;
    });
  }
});
export { expect };
