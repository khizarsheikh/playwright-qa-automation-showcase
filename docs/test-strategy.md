# Test strategy

## Objective

Detect regressions in account access and task management, and produce enough evidence to investigate failures without blindly rerunning the suite.

## Coverage map

| Risk | Verification | Layer |
| --- | --- | --- |
| User cannot enter workspace | Registration and valid login | UI |
| Invalid credentials accepted | Wrong-password error and hidden workspace | UI |
| Logout leaves access active | Reload after logout; API session invalidation | UI + API |
| Tasks disappear or changes are lost | Create/edit/delete, reload and API state assertions | UI + API |
| Completion filters show wrong tasks | Complete, reopen, Active and Completed views | UI |
| Bad input changes stored state | Empty/whitespace/non-string/length validation; atomic invalid update | API + UI |
| One user accesses another's tasks | Separate API context attempts list, edit and delete | API |
| Task text executes markup | HTML-like input rendered as text | UI |
| Save failure loses user input | Controlled 503 response with retained input | UI |
| Bad request crashes API | Malformed JSON yields controlled 400 response | API |
| Test data leaks between runs | Unique identity per test, account deletion and session revocation | Fixtures + API |

## Suite structure

- **Smoke:** health, API task lifecycle, UI login, create/reload, and completion/filtering.
- **Regression:** the complete API suite plus all normal UI scenarios on Chromium. `test:cross-browser` adds Firefox and is used by Linux CI.
- **Failure demonstration:** opt-in wrong assertion, excluded from normal suites; must return nonzero.

The UI failure-response test mocks only the intended 503 response. Other normal UI tests use the real local API. Do not describe the mocked test as evidence of a real infrastructure outage.

## Data and isolation

Each test receives a randomly named `@example.test` account. API contexts and browser contexts are independent. The `board` fixture imports only that test's session cookie. No shared storage-state file or global reset endpoint is used. API setup is used when login is not the behavior under test.

Fixture teardown logs in again if needed, deletes the account and its tasks, and disposes the API context. The API account-deletion test also verifies data does not survive re-registration. If a process is forcibly terminated, teardown may not run; the ephemeral server clears leftover data on restart.

## Synchronization and diagnosis

Tests use role/label locators, a task-row test ID, and Playwright's retrying assertions. There are no fixed sleeps in the test suite. The recording script uses deliberate pauses only for presentation pacing.

Local retries are disabled. CI allows one retry to expose transient failures in reports, not to hide them; inspect retry history. Trace, screenshot and video are retained on failure. Explicit steps describe major operations in reports.

## Acceptance criteria

1. Type checking succeeds.
2. All normal API and UI tests pass locally in Chromium. Firefox needs a separate successful cross-browser run; a local browser-launch limitation is recorded separately.
3. Smoke tests pass against an independently started app with `BASE_URL`.
4. The deliberate assertion failure exits nonzero and produces inspectable evidence.
5. Allure generates an HTML report from real results.
6. After publication, verify both GitHub jobs, uploaded artifacts, and manual staging behavior if a staging environment is available.

Items dependent on GitHub/Docker are tracked separately in `verification.md`; they must not be inferred from local success.
