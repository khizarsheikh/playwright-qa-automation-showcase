import { rm, readdir, readFile, access } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const results = new URL('allure-results/', root);
const output = new URL('allure-report/', root);
const files = await readdir(results);
if (!files.some(file => file.endsWith('-result.json'))) throw new Error('No Allure test results found. Run tests first.');
// Fixed repository-owned output path; remove stale report pages before generation.
await rm(output, { recursive: true, force: true });
const result = spawnSync(process.execPath, ['node_modules/allure/cli.js', 'generate', './allure-results'], {
  cwd: fileURLToPath(root), stdio: 'inherit'
});
if (result.status !== 0) process.exit(result.status ?? 1);
await access(new URL('index.html', output));
let summary;
for (const candidate of ['summary.json', 'awesome/summary.json']) {
  try { summary = JSON.parse(await readFile(new URL(candidate, output), 'utf8')); break; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (!summary?.stats?.total) throw new Error('Report generation did not produce a nonempty summary.');
console.log(`Allure report verified: ${summary.stats.total} tests; status: ${summary.status}.`);
