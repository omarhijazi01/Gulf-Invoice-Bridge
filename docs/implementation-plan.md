# Implementation and verification plan

1. Scaffold React/Vite and FastAPI; verify health, tests and dev servers.
2. Persist relational invoices, items, validation results, extraction evidence, audit events and integration attempts in SQLite; test round trips.
3. Enforce workflow states with guarded operations; test invalid transitions.
4. Extract actual text PDFs through demo and optional OpenAI providers; test supported and rejected documents.
5. Normalize dates, whitespace, currency and Decimal values; test inputs.
6. Apply deterministic financial, required-field and duplicate rules; test each category.
7. Run an independent HTTP ERP simulator with persistence, idempotency, controlled failures and manual retry; test requests and logs.
8. Build connected UI pages and reusable components; test critical controls.
9. Exercise the full workflow through real local HTTP services and a browser.
10. Run tests, lint, type checks, build, responsive review and documentation audit.

Each stage is checked before dependent work proceeds. Docker launch and live OpenAI extraction require runtimes/credentials unavailable in this environment; record these limits explicitly.

## Completion record

The implementation and local verification stages are complete. See [verification.md](verification.md) for exact executed test/build results, fixes, real HTTP receipts, browser observations and the explicit Docker/OpenAI limitations. The September 15 continuation preserved the existing architecture and runtime records.
