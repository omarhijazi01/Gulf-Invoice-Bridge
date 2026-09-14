from collections import Counter
from datetime import datetime, timezone

import httpx
from sqlalchemy import text

from app.core.config import settings
from app.repositories.invoices import InvoiceRepository
from app.schemas.views import columns


def stats(db):
    repo = InvoiceRepository(db)
    invoices, logs = repo.all(), repo.logs()
    processed = [i for i in invoices if i.validation_results]
    valid = sum(all(r.status == "PASS" for r in i.validation_results) for i in processed)
    finished = [log for log in logs if log.result != "PENDING"]
    successes = [log for log in finished if log.result == "SUCCESS"]
    today = datetime.now(timezone.utc).date().isoformat()
    status_counts = Counter(i.status for i in invoices)
    return {
        "total_invoices": len(invoices),
        "processed": len(processed),
        "validation_success_rate": round(100 * valid / len(processed), 1) if processed else 0,
        "needs_review": status_counts["REVIEW_REQUIRED"],
        "integration_success_rate": round(100 * len(successes) / len(finished), 1)
        if finished
        else 0,
        "integration_attempts": len(logs),
        "successful_attempts": len(successes),
        "average_response_ms": round(sum(log.duration_ms for log in finished) / len(finished))
        if finished
        else 0,
        "requests_today": sum(log.timestamp.startswith(today) for log in logs),
        "last_success": successes[0].timestamp if successes else None,
        "status_counts": dict(status_counts),
        "recent_activity": [columns(event) for event in repo.events()],
        "performance": [columns(log) for log in list(reversed(logs[:12]))],
    }


def system_health(db):
    db.execute(text("SELECT 1"))
    try:
        response = httpx.get(f"{settings.erp_base_url}/health", timeout=1)
        erp_online = response.status_code == 200 and response.json().get("status") == "ok"
    except (httpx.HTTPError, ValueError):
        erp_online = False
    return {
        "database": "Connected",
        "document_processing": "Ready · text PDFs",
        "extraction": "Demo parser"
        if settings.ai_provider == "demo"
        else "Configured"
        if settings.openai_api_key
        else "Missing API key",
        "validation": "Ready · deterministic",
        "erp": "Connected" if erp_online else "Offline",
        "erp_endpoint": settings.erp_base_url,
        "demo_mode": settings.demo_mode,
        "ai_provider": settings.ai_provider,
        "environment": "Local portfolio prototype",
    }
