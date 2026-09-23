# Gulf Invoice Bridge

**AI-Powered Invoice Intelligence & Enterprise Integration Platform**

**Live application:** https://gulf-invoice-bridge.omarmaheer921.workers.dev

A local full-stack engineering portfolio product that turns invoice PDFs into validated records and delivers approved data to an independent ERP simulator.

## Business problem and solution

Unstructured invoice documents require manual entry into business systems. Gulf Invoice Bridge demonstrates a controlled pipeline: PDF extraction, structured fields, normalization, deterministic rules, human review, approval, payload transformation, HTTP delivery and persistent monitoring.

## Architecture and engineering features

React/TypeScript frontend; modular FastAPI backend; SQLAlchemy/SQLite persistence; a separate ERP process/database. Provider and connector abstractions isolate external dependencies. Explicit states, optimistic version checks, idempotent delivery and interrupted-request recovery address real integration concerns without adding infrastructure that the local workflow does not need.

## AI implementation

The optional OpenAI adapter uses a strict Pydantic response schema and preserves uncertainty. It is implemented but has not been live-tested with credentials. The default offline mode parses actual sample PDF text deterministically; its illustrative confidence display is explicitly labeled. AI output never skips business validation or human approval.

## Data engineering

Raw field evidence is preserved separately from normalized invoice columns and items. Decimal-safe rules reconcile quantities, net amounts, tax and total. Rule outcomes, human review timestamps, workflow history and delivery attempts are persisted and support dashboard metrics.

## Integration engineering

Approved invoices are transformed into a typed ERP contract. An HTTP connector communicates with the independently running simulator. All failure scenarios are labeled simulations. Stable idempotency keys, a unique remote source ID, manual retries and attempt logging demonstrate delivery control and traceability.

## Testing and technical decisions

Pytest covers actual sample parsing, normalization, business rules, relational round trips, workflow gates, HTTP contracts, failures, retries and recovery. Frontend tests cover key review controls. A real HTTP acceptance script exercises the full review/approval/failure/retry pipeline. The browser review additionally verifies the intended demonstration path. Detailed executed results are maintained in `verification.md`.

SQLite, synchronous operations and a three-process local setup keep the project understandable. No claim is made about production scale, compliance certification, commercial use, or model extraction accuracy.

## CV bullets

- Built a modular React/TypeScript and FastAPI invoice workflow with relational SQLite persistence, source-PDF extraction, human review and backend-enforced approval gates.
- Implemented Decimal-safe normalization and deterministic invoice validation, preserving extraction evidence and separating confidence estimates from business correctness.
- Developed an independent HTTP ERP simulator and connector with persistent attempt logs, idempotent delivery, controlled failures, manual retries and automated integration tests.

## Recruiter-facing description

Gulf Invoice Bridge demonstrates how document extraction, data normalization, business rules, human oversight and enterprise APIs work together. The application processes real text PDFs locally and delivers approved invoices to a separate ERP simulator, with a professional operations UI and traceable failure/retry history. It is an engineering portfolio prototype inspired by Saudi and UAE invoice workflows, not a certified e-invoicing product.

## Limitations and next steps

No OCR, authentication, production ERP connection or tax compliance engine. Optional AI needs credentials and evaluation. Future work includes OCR, versioned migrations, authenticated roles, server pagination and a legitimate ERP adapter behind the existing interface.
