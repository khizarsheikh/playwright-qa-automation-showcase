# Presenting the project

## A two-minute spoken walkthrough

**0:00–0:20 — Context**  
“This is a personal QA portfolio project. I included a small task app so anyone can reproduce the tests without depending on an external demo website.”

**0:20–0:50 — Test design**  
Show `tests/ui/tasks.spec.ts`. Explain why data setup uses the API, while user actions and assertions use the browser. Show the independent-account fixture and cleanup.

**0:50–1:15 — Real results**  
Run `npm run test:smoke` and show its results. Explain how smoke selection differs from full regression. Open the Allure report from a completed run.

**1:15–1:40 — Failure investigation**  
Show the saved deliberate failure screenshot and explain the mismatch between the expected count and the uncompleted task. Demonstrate the trace if available. Make clear this is intentional, not a real customer bug.

**1:40–2:00 — Delivery**  
Show the workflow: dependencies → regression → reports → container startup → smoke → artifacts. Say which parts have actually executed and which await GitHub publication.

## Questions to be ready for

- Why not log in through the UI before every test?
- What stops parallel tests from deleting each other's data?
- Why keep API assertions alongside selected UI flows?
- What happens when an API call fails during saving?
- How do you distinguish a real application failure from a flaky test?
- Which parts would change for a client application with persistent staging data?
- Why is the sample app not production-ready?

## Before publishing

1. Run the quick-start steps on a fresh checkout or clean dependency installation.
2. Review the source and explain each fixture in your own words.
3. Review screenshots/traces for private data; these examples use fictional accounts.
4. Choose repository visibility and an appropriate license before making the code public.
5. Push only source, lockfile, documentation and curated assets; omit caches and generated reports.
6. Run GitHub workflows and update verification notes with actual links and outcomes.
7. Add a live badge only after a successful workflow run.

The included `.webm` records the application flow without narration. Use this guide to record your own narrated testing walkthrough for Fiverr/Upwork.
