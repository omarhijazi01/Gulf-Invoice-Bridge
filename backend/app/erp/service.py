import json
from time import perf_counter

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError

from app.core.errors import DomainError
from app.erp.database import ReceivedInvoice
from app.schemas.erp import ERPReceipt


def receive(db, payload):
    start = perf_counter()
    existing = db.scalar(
        select(ReceivedInvoice).where(ReceivedInvoice.source_id == payload.source_id)
    )
    if existing is None:
        existing = ReceivedInvoice(
            source_id=payload.source_id,
            invoice_number=payload.invoice_number,
            payload=payload.model_dump_json(),
        )
        db.add(existing)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            existing = db.scalar(
                select(ReceivedInvoice).where(ReceivedInvoice.source_id == payload.source_id)
            )
            if existing is None:
                raise
    if json.loads(existing.payload) != payload.model_dump(mode="json"):
        raise DomainError("Idempotency key was already used with a different payload.", 409)
    return ERPReceipt(
        status="SUCCESS",
        reference=f"ERP-{existing.timestamp[:4]}-{existing.id:05d}",
        timestamp=existing.timestamp,
        processing_time=round((perf_counter() - start) * 1000),
    )


def records(db):
    return [
        record(row)
        for row in db.scalars(select(ReceivedInvoice).order_by(ReceivedInvoice.id.desc()))
    ]


def record(row):
    return {
        "id": row.id,
        "reference": f"ERP-{row.timestamp[:4]}-{row.id:05d}",
        "timestamp": row.timestamp,
        "payload": json.loads(row.payload),
    }


def get(db, identifier):
    row = db.get(ReceivedInvoice, identifier)
    if row is None:
        raise DomainError("ERP invoice not found.", 404)
    return record(row)
