# API contracts

Invoice API defaults to `http://127.0.0.1:8000`. OpenAPI is at `/openapi.json`, interactive documentation at `/docs`. JSON bodies use decimal **strings**; response monetary values remain strings.

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/invoices/upload` | Multipart field `file`; returns 201 with an UPLOADED invoice |
| POST | `/api/invoices/sample` | `{ "scenario": "clean" / "review" / "invalid" }`; demo only |
| GET | `/api/invoices` | Invoice summaries and current rule results |
| GET | `/api/invoices/{id}` | Full fields, items, evidence, history and logs |
| GET | `/api/invoices/{id}/document` | Source PDF, resolved from a generated storage key |
| POST | `/api/invoices/{id}/extract` | Extract, normalize and validate; only UPLOADED |
| PATCH | `/api/invoices/{id}` | Complete editable field set plus current `version`; invalidates validation |
| POST | `/api/invoices/{id}/validate` | Persist deterministic results |
| POST | `/api/invoices/{id}/approve` | Explicit approval; only VALIDATED, rechecks rules |
| GET | `/api/invoices/{id}/payload` | Approved immutable ERP contract |
| POST | `/api/invoices/{id}/integrate` | `{ "scenario": "SUCCESS" }`; only APPROVED |
| POST | `/api/invoices/{id}/retry-integration` | Same body; only INTEGRATION_FAILED |
| GET | `/api/integration/logs` | Every attempt, newest first |
| GET | `/api/dashboard/stats` | Database-derived counts, rates, activity and performance |
| GET | `/api/system` | Runtime configuration and live local health |
| GET | `/api/health` | API liveness |

Integrate/retry accept `SUCCESS`, `401`, `400`, `500`, `TIMEOUT`. The invoice API returns HTTP 200 for a successfully *recorded attempt*, even when delivery failed. Inspect the returned invoice state and its `integration_logs[].http_status` for the remote outcome. Invalid workflow calls return 409. Invalid input returns 422, missing invoices 404, oversized files 413, disabled demo actions 403, and database unavailability 503.

Error envelope:

```json
{"error":{"message":"Action unavailable while invoice is UPLOADED."}}
```

Correction example (PATCH uses a complete document edit, not arbitrary property mutation):

```json
{
  "version": 4,
  "invoice_number": "INV-AE-2086",
  "invoice_date": "2026-09-13",
  "supplier_name": "Dune Harbor Trading LLC",
  "supplier_tax_number": "100123456700003",
  "customer_name": "Oasis Systems LLC",
  "customer_tax_number": "100987654300003",
  "currency": "AED",
  "subtotal": "1000.00",
  "tax_amount": "50.00",
  "total_amount": "1050.00",
  "items": [{"description":"Operations support","quantity":"2","unit_price":"500.00","tax_rate":"5","total":"1000.00"}]
}
```

The model excludes status, reference and approval timestamps from writable fields. Tax IDs are strings to preserve their exact digits. Status transitions cannot be bypassed with PATCH.

## Independent ERP simulator

Default base: `http://127.0.0.1:8001`.

- `POST /api/mock-erp/invoices`: `ERPPayload`, required `Idempotency-Key` matching `source_id`, optional `X-Simulation-Scenario`.
- `GET /api/mock-erp/invoices`: persisted received records.
- `GET /api/mock-erp/invoices/{integer_id}`: one received record.
- `GET /health`: simulator liveness.

Successful receipt:

```json
{"status":"SUCCESS","reference":"ERP-2026-00001","timestamp":"2026-09-14T12:00:00+00:00","processing_time":4}
```

References use receipt year and a database sequence. A matching duplicate source ID returns the original receipt; a different payload with the same key returns 409. The TIMEOUT scenario waits longer than the connector timeout and does not persist an invoice. Failures are explicitly labeled SIMULATION.
