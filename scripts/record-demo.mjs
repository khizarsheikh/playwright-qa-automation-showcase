import { chromium, request } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { startServer } from '../app/server.mjs';

// Start the local target unless an existing deployment was explicitly selected.
const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const server = process.env.BASE_URL ? undefined : await startServer(3000, '127.0.0.1');
const destination = 'docs/assets';
await mkdir(destination, { recursive: true });
const api = await request.newContext({ baseURL });
const credentials = { email: `walkthrough-${randomUUID()}@example.test`, password: 'Portfolio-only-123!' };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, recordVideo: { dir: 'test-results/walkthrough', size: { width: 1440, height: 1000 } } });
const page = await context.newPage();
const pause = () => page.waitForTimeout(1_200); // Pacing for a human walkthrough, never used in tests.
try {
  await page.goto(baseURL);
  await page.getByRole('heading', { name: 'Welcome to Tasklane' }).waitFor();
  await page.screenshot({ path: `${destination}/welcome.png`, fullPage: true });
  const registered = await api.post('/api/register', { data: credentials });
  if (registered.status() !== 201) throw new Error('Could not create walkthrough account');
  await page.getByLabel('Email address').fill(credentials.email);
  await page.getByLabel('Password', { exact: true }).fill(credentials.password);
  await pause();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.getByRole('heading', { name: 'Make room for progress.' }).waitFor();
  for (const title of ['Run automated regression', 'Review failure evidence', 'Verify staging deployment']) {
    await page.getByRole('textbox', { name: 'New task' }).fill(title);
    await page.getByRole('button', { name: 'Add task', exact: true }).click();
    await page.getByText(title, { exact: true }).waitFor();
    await pause();
  }
  await page.getByRole('checkbox', { name: 'Complete Run automated regression', exact: true }).check();
  await page.locator('#doneCount').filter({ hasText: '1' }).waitFor();
  await page.screenshot({ path: `${destination}/task-board.png`, fullPage: true });
  await pause();
  await page.getByLabel('Show', { exact: true }).selectOption('Completed');
  await pause();
  await page.getByLabel('Show', { exact: true }).selectOption('All');
  const row = page.getByTestId('task-row').filter({ hasText: 'Review failure evidence' });
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Task title', { exact: true }).fill('Share the regression report');
  await pause();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Share the regression report', { exact: true }).waitFor();
  await pause();
} finally {
  const video = page.video();
  await context.close();
  if (video) await video.saveAs(`${destination}/walkthrough.webm`);
  await browser.close();
  const login = await api.post('/api/login', { data: credentials });
  if (login.ok()) await api.delete('/api/account');
  await api.dispose();
  if (server) {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}
console.log('Saved screenshots and walkthrough in docs/assets');
