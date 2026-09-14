from sqlalchemy import select

from app.models.invoice import Invoice
from app.services.workflow import transition


def recover_interrupted(db):
    """Single-process startup recovery. Stable idempotency keys make retries safe."""
    for invoice in db.scalars(
        select(Invoice).where(Invoice.status.in_(["EXTRACTING", "INTEGRATING"]))
    ):
        if invoice.status == "EXTRACTING":
            invoice.last_error = "Extraction interrupted by application restart. Retry extraction."
            transition(invoice, "UPLOADED", invoice.last_error)
        else:
            invoice.last_error = (
                "Integration interrupted. Delivery is unknown; retry uses the same idempotency key."
            )
            for attempt in invoice.integration_logs:
                if attempt.result == "PENDING":
                    attempt.result = "FAILED"
                    attempt.error_message = invoice.last_error
            transition(invoice, "INTEGRATION_FAILED", invoice.last_error)
    db.commit()
