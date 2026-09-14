from datetime import datetime, timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import TypeDecorator

from app.db.session import Base


def now():
    return datetime.now(timezone.utc).isoformat()


class ExactDecimal(TypeDecorator):
    """Store decimal text in SQLite without binary float conversion."""

    impl = String(48)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return str(value) if value is not None else None

    def process_result_value(self, value, dialect):
        return Decimal(value) if value is not None else None


class Invoice(Base):
    __tablename__ = "invoices"
    id: Mapped[str] = mapped_column(primary_key=True, default=lambda: str(uuid4()))
    filename: Mapped[str]
    storage_key: Mapped[str]
    is_demo: Mapped[bool] = mapped_column(default=False)
    status: Mapped[str] = mapped_column(default="UPLOADED", index=True)
    version: Mapped[int] = mapped_column(default=1)
    invoice_number: Mapped[str | None] = mapped_column(index=True)
    invoice_date: Mapped[str | None]
    supplier_name: Mapped[str | None]
    supplier_tax_number: Mapped[str | None]
    customer_name: Mapped[str | None]
    customer_tax_number: Mapped[str | None]
    currency: Mapped[str | None]
    subtotal: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    tax_amount: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    total_amount: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    created_at: Mapped[str] = mapped_column(default=now)
    updated_at: Mapped[str] = mapped_column(default=now)
    reviewed_at: Mapped[str | None]
    approved_at: Mapped[str | None]
    erp_reference: Mapped[str | None]
    processing_ms: Mapped[int | None]
    last_error: Mapped[str | None]
    items: Mapped[list["InvoiceItem"]] = relationship(
        cascade="all, delete-orphan", order_by="InvoiceItem.id"
    )
    validation_results: Mapped[list["ValidationResult"]] = relationship(
        cascade="all, delete-orphan", order_by="ValidationResult.id"
    )
    evidence: Mapped[list["ExtractionEvidence"]] = relationship(cascade="all, delete-orphan")
    events: Mapped[list["AuditEvent"]] = relationship(
        cascade="all, delete-orphan", order_by="AuditEvent.id"
    )
    integration_logs: Mapped[list["IntegrationLog"]] = relationship(
        cascade="all, delete-orphan", order_by="IntegrationLog.id"
    )
    __mapper_args__ = {"version_id_col": version}


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), index=True)
    description: Mapped[str | None]
    quantity: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    unit_price: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    tax_rate: Mapped[Decimal | None] = mapped_column(ExactDecimal)
    total: Mapped[Decimal | None] = mapped_column(ExactDecimal)


class ValidationResult(Base):
    __tablename__ = "validation_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), index=True)
    rule: Mapped[str]
    status: Mapped[str]
    message: Mapped[str]
    severity: Mapped[str]


class ExtractionEvidence(Base):
    __tablename__ = "extraction_results"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), index=True)
    field: Mapped[str]
    raw_value: Mapped[str | None] = mapped_column(Text)
    confidence: Mapped[int | None]
    uncertain: Mapped[bool] = mapped_column(default=False)
    provider: Mapped[str]


class AuditEvent(Base):
    __tablename__ = "audit_events"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), index=True)
    timestamp: Mapped[str] = mapped_column(default=now)
    action: Mapped[str]
    detail: Mapped[str]


class IntegrationLog(Base):
    __tablename__ = "integration_logs"
    id: Mapped[int] = mapped_column(primary_key=True)
    invoice_id: Mapped[str] = mapped_column(ForeignKey("invoices.id"), index=True)
    timestamp: Mapped[str] = mapped_column(default=now)
    destination: Mapped[str] = mapped_column(default="Local ERP Simulator")
    attempt_number: Mapped[int]
    http_status: Mapped[int | None]
    duration_ms: Mapped[int] = mapped_column(default=0)
    result: Mapped[str]
    scenario: Mapped[str]
    error_message: Mapped[str | None]
    reference: Mapped[str | None]
