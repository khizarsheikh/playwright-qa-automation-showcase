import { spawnSync } from 'node:child_process';
const result = spawnSync(process.execPath, ['node_modules/@playwright/test/cli.js', 'test', 'failure-demo.spec.ts', '--project=chromium'], {
  stdio: 'inherit', env: { ...process.env, FAILURE_DEMO: '1' }
});
// Preserve the real failure exit code. Never turn a failed test into a passing build.
process.exit(result.status ?? 1);
