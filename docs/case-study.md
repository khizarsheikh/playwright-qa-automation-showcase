# Client-facing portfolio case study

**Project:** Automated regression and deployment checks for a task-management application  
**Type:** Personal demonstration project, not client work  
**Stack:** TypeScript, Playwright, Allure 3, GitHub Actions, Node.js, Docker configuration

## Problem

A software team needs repeatable checks for login, task creation, editing, completion and deletion. It also needs readable failure evidence and a way to verify that a newly deployed version still supports key workflows.

## Solution

Built a controlled sample application and a layered UI/API automation suite. The framework uses per-test accounts, API-assisted setup, reusable page interactions, separate smoke selection, failure attachments, and CI artifact collection. A container-based workflow models deployment followed by smoke checks.

## Evidence

See `verification.md` for measured local results and checks that still require execution after GitHub publication. Screenshots and the walkthrough show the actual demo; the intentional failure example explains how to diagnose a failed assertion.

No claims of client revenue, saved staff hours, reduced production defects, or production deployment are made.

## Services this demonstrates

- Set up or extend a Playwright UI/API suite.
- Automate agreed regression scenarios.
- Integrate tests into an existing GitHub Actions pipeline.
- Add Allure reports and useful failure attachments.
- Add smoke checks after an existing staging deployment.

## Example first engagement

Automate five agreed user journeys for one application, connect them to one existing CI pipeline, and deliver reports, setup instructions and a handover. Quote test-data dependencies, environment access, browser coverage and maintenance separately.
