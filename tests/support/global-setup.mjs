import { rm } from 'node:fs/promises';
import { startServer } from '../../app/server.mjs';

export default async function globalSetup() {
  // Allure appends results; this directory contains only generated test evidence.
  await rm(new URL('../../allure-results', import.meta.url), { recursive: true, force: true });
  if (process.env.BASE_URL) return;
  // In-process lifecycle avoids Windows shell process-tree shutdown dependencies.
  // A busy port fails explicitly: never silently test a different application.
  const server = await startServer(3000, '127.0.0.1');
  return async () => {
    server.closeAllConnections();
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  };
}
