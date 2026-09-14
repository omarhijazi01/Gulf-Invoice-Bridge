import logging

from app.core.errors import DomainError
from app.models.invoice import AuditEvent, now

TRANSITIONS = {
    "UPLOADED": {"EXTRACTING"},
    "EXTRACTING": {"EXTRACTED", "UPLOADED"},
    "EXTRACTED": {"EXTRACTED", "VALIDATED", "REVIEW_REQUIRED"},
    "REVIEW_REQUIRED": {"EXTRACTED", "VALIDATED", "REVIEW_REQUIRED"},
    "VALIDATED": {"EXTRACTED", "VALIDATED", "REVIEW_REQUIRED", "APPROVED"},
    "APPROVED": {"INTEGRATING"},
    "INTEGRATING": {"INTEGRATED", "INTEGRATION_FAILED"},
    "INTEGRATION_FAILED": {"INTEGRATING"},
    "INTEGRATED": set(),
}


def require_state(invoice, *allowed):
    if invoice.status not in allowed:
        raise DomainError(f"Action unavailable while invoice is {invoice.status}.")


def audit(invoice, action, detail):
    invoice.events.append(AuditEvent(action=action, detail=detail))
    invoice.updated_at = now()
    logging.getLogger("bridge").info("%s invoice_id=%s", action, invoice.id)


def transition(invoice, target, detail):
    if target not in TRANSITIONS.get(invoice.status, set()):
        raise DomainError(f"Invalid transition: {invoice.status} → {target}")
    invoice.status = target
    audit(invoice, target, detail)
