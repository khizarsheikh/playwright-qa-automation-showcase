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
- Firefox was downloaded locally, but its launch stalled in the restricted Windows environment. That attempt was stopped. Firefox later passed as part of the Linux cross-browser GitHub Actions job.
- Allure output is cleaned before regeneration so pages from old results cannot survive into the latest report. The generation script verifies a nonempty summary and HTML entry point.
- The local browser binaries live under `.local/browsers`. In this workspace, set `PLAYWRIGHT_BROWSERS_PATH` as shown in the README before running browser tests.

## GitHub Actions verification

Workflow run [34702139179](https://github.com/khizarsheikh/playwright-qa-automation-showcase/actions/runs/34702139179) completed successfully on **12 September 2026**.

| Job | Duration | Verified behavior |
| --- | ---: | --- |
| `regression` | 1m 23s | Locked dependency installation, Chromium and Firefox installation, type checking, cross-browser regression, Allure generation and artifact upload |
| `container-smoke` | 57s | Docker image build, disposable container startup, readiness check, smoke tests against the container, report/log upload and container removal |

Artifacts `regression-evidence` and `container-smoke-evidence` were uploaded by the successful run with a 14-day retention period.

The first run reported deprecation warnings because `actions/checkout@v4`, `actions/setup-node@v4`, and `actions/upload-artifact@v4` use a Node.js 20 action runtime. The workflows were subsequently updated to Node.js 24-compatible major releases. A new CI run must verify that maintenance change.

## Not yet verified

1. **Updated action releases:** the next workflow run must pass after the Node.js 24 action upgrades.
2. **Remote staging:** only an independently started local target and the disposable CI container were verified; no persistent public deployment was created.

The default suite and Allure report pass locally. Cross-browser regression and disposable Docker deployment checks pass in GitHub Actions.
