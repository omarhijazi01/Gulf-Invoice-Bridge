from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models.invoice import AuditEvent, IntegrationLog, Invoice


class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db

    def get(self, invoice_id):
        invoice = self.db.get(Invoice, invoice_id)
        if invoice is None:
            raise DomainError("Invoice not found", 404)
        return invoice

    def all(self):
        return list(self.db.scalars(select(Invoice).order_by(Invoice.created_at.desc())))

    def duplicate(self, invoice):
        if not invoice.invoice_number or not invoice.supplier_name:
            return False
        return bool(
            self.db.scalar(
                select(Invoice.id)
                .where(
                    Invoice.id != invoice.id,
                    func.lower(Invoice.invoice_number) == invoice.invoice_number.lower(),
                    func.lower(Invoice.supplier_name) == invoice.supplier_name.lower(),
                )
                .limit(1)
            )
        )

    def logs(self):
        return list(self.db.scalars(select(IntegrationLog).order_by(IntegrationLog.id.desc())))

    def events(self, limit=12):
        return list(self.db.scalars(select(AuditEvent).order_by(AuditEvent.id.desc()).limit(limit)))
