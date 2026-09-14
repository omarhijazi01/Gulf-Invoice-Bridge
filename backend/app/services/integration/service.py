from time import perf_counter

from app.core.errors import DomainError
from app.integrations.base import ConnectorError
from app.models.invoice import IntegrationLog
from app.repositories.invoices import InvoiceRepository
from app.services.integration.payload import transform
from app.services.validation.rules import validate
from app.services.workflow import audit, require_state, transition


class IntegrationService:
    def __init__(self, db, connector):
        self.db = db
        self.repo = InvoiceRepository(db)
        self.connector = connector

    def integrate(self, identifier, scenario, retry=False):
        invoice = self.repo.get(identifier)
        require_state(invoice, "INTEGRATION_FAILED" if retry else "APPROVED")
        if any(r.status != "PASS" for r in validate(invoice, self.repo.duplicate(invoice))):
            raise DomainError("Invoice no longer passes validation. Integration blocked.")
        payload = transform(invoice)
        if retry:
            audit(invoice, "RETRY", "Manual integration retry requested")
        transition(invoice, "INTEGRATING", "ERP request started")
        log = IntegrationLog(
            attempt_number=len(invoice.integration_logs) + 1, result="PENDING", scenario=scenario
        )
        invoice.integration_logs.append(log)
        self.db.commit()  # Claim state and persist attempt before external side effects.
        start = perf_counter()
        try:
            receipt = self.connector.send(payload, scenario)
            invoice.erp_reference = receipt.reference
            invoice.last_error = None
            log.result, log.http_status, log.reference = "SUCCESS", 200, receipt.reference
            transition(invoice, "INTEGRATED", f"ERP accepted invoice: {receipt.reference}")
        except ConnectorError as exc:
            log.result, log.http_status, log.error_message = "FAILED", exc.http_status, exc.message
            invoice.last_error = exc.message
            transition(invoice, "INTEGRATION_FAILED", exc.message)
        log.duration_ms = round((perf_counter() - start) * 1000)
        self.db.commit()
        return invoice
