import { test, expect } from '../support/fixtures.js';

// Opt-in only. A deliberate wrong expectation proves failure evidence is captured.
test('intentional assertion failure for report walkthrough', async ({ board, page }) => {
  await board.add('Investigate this intentional failure');
  await test.step('Demonstrate an incorrect completion expectation', async () => {
    await expect(page.locator('#doneCount')).toHaveText('1', { timeout: 1_000 });
  });
});
