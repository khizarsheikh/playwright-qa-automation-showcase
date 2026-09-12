# Execution verification

Verified locally on **12 September 2026**, Windows, Node.js **24.20.0**, Playwright **1.63.0**, TypeScript **7.0.2**, Allure **3.17.0**.

| Check | Observed result |
| --- | --- |
| TypeScript validation | Passed (`npm run typecheck`) |
| Default full suite | **27 passed**, 0 unexpected failures, 0 skipped, 0 flaky; 8.36 seconds |
| Coverage split | 13 API checks + 14 Chromium UI scenarios |
| Separately started local target | **5 smoke checks passed** against `BASE_URL=http://127.0.0.1:3100` |
| Deliberate failure | 1 assertion failure, exit code 1; expected completed count 1, actual 0 |
| Failure evidence | Screenshot, video and trace generated; curated screenshot and trace retained in `docs/assets` |
| Allure | Final report contains **27 passed**; rendered in Chromium with no page errors |
| Demo presentation | Welcome/task-board screenshots and silent application walkthrough recorded |

The default full run started at `2026-09-12T13:51:45.669Z`. The machine-readable evidence in `docs/evidence` records the actual counts and duration. These are execution counts, not code coverage percentages.

## Environment findings

- An initial Windows subprocess shutdown hang was resolved by starting the local HTTP server directly in global setup and closing it in teardown. The independently started `BASE_URL` path is also verified.
- Firefox was downloaded, but its launch stalled in this restricted Windows environment. That attempt was stopped; no Firefox test pass is claimed. Firefox remains available through `npm run test:cross-browser` and is configured in Linux CI.
- Allure output is cleaned before regeneration so pages from old results cannot survive into the latest report. The generation script verifies a nonempty summary and HTML entry point.
- The local browser binaries live under `.local/browsers`. In this workspace, set `PLAYWRIGHT_BROWSERS_PATH` as shown in the README before running browser tests.

## Not yet verified

1. **GitHub Actions execution:** files are prepared and syntax parsed, but the repository has not been published or run on GitHub.
2. **Docker build/container smoke:** Docker is not installed in this environment. This job must pass after publication or on a Docker-enabled machine.
3. **Firefox execution:** requires a working browser environment or the Linux CI run.
4. **Remote staging:** only an independently started local target was verified; no public deployment was created.

The default suite and Allure report pass locally. Treat the cross-browser and deployment workflows as implementation awaiting execution, not as verified delivery evidence.
