from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.errors import DomainError
from app.models.invoice import AuditEvent, IntegrationLog, Invoice


class InvoiceRepository:
    def __init__(self, db: Session):
        self.db = db
        self.owner_id = db.info.get("owner_id")

    def owned(self, query):
        if self.owner_id is not None:
            return query.where(Invoice.owner_id == self.owner_id)
        return query

    def get(self, invoice_id):
        invoice = self.db.get(Invoice, invoice_id)
        if invoice is None or (self.owner_id is not None and invoice.owner_id != self.owner_id):
            raise DomainError("Invoice not found", 404)
        return invoice

    def all(self):
        return list(self.db.scalars(self.owned(select(Invoice)).order_by(Invoice.created_at.desc())))

    def duplicate(self, invoice):
        if not invoice.invoice_number or not invoice.supplier_name:
            return False
        return bool(
            self.db.scalar(
                select(Invoice.id)
                .where(
                    Invoice.id != invoice.id,
                    Invoice.owner_id == invoice.owner_id,
                    func.lower(Invoice.invoice_number) == invoice.invoice_number.lower(),
                    func.lower(Invoice.supplier_name) == invoice.supplier_name.lower(),
                )
                .limit(1)
            )
        )

    def logs(self):
        return list(self.db.scalars(select(IntegrationLog).join(Invoice).where(
            Invoice.owner_id == self.owner_id
        ).order_by(IntegrationLog.id.desc()))) if self.owner_id is not None else list(
            self.db.scalars(select(IntegrationLog).order_by(IntegrationLog.id.desc()))
        )

    def events(self, limit=12):
        query = select(AuditEvent).join(Invoice)
        if self.owner_id is not None:
            query = query.where(Invoice.owner_id == self.owner_id)
        return list(self.db.scalars(query.order_by(AuditEvent.id.desc()).limit(limit)))
