"""Repeatable fictional portfolio data for ephemeral demo environments."""

from decimal import Decimal

from sqlalchemy import select

from app.core.config import settings
from app.models.invoice import AuditEvent, IntegrationLog, Invoice, InvoiceItem
from app.services.validation.rules import validate

DEMO_RECORDS = (
    (
        "SEED-2026-0001",
        "2026-09-18",
        "Najd Horizon Supplies LLC",
        "310123456700003",
        "Rimal Operations LLC",
        "100987654300003",
        "SAR",
        "Warehouse operations support",
        "2",
        "4200.00",
        "15",
        "INTEGRATED",
        "clean",
        "ERP-SA-260918-001",
        None,
        None,
    ),
    (
        "SEED-2026-0002",
        "2026-09-17",
        "Dune Harbor Trading LLC",
        "100123456700003",
        "Oasis Systems LLC",
        "100987654300003",
        "AED",
        "Network equipment maintenance",
        "4",
        "1875.00",
        "5",
        "INTEGRATED",
        "clean",
        "ERP-AE-260917-014",
        None,
        None,
    ),
    (
        "SEED-2026-0003",
        "2026-09-16",
        "Wadi Crest Services LLC",
        None,
        "Rimal Operations LLC",
        "100987654300003",
        "SAR",
        "Facilities inspection services",
        "3",
        "2400.00",
        "15",
        "REVIEW_REQUIRED",
        "review",
        None,
        None,
        None,
    ),
    (
        "SEED-2026-0004",
        "2026-09-15",
        "Pearl Coast Logistics LLC",
        "310765432100003",
        "Falcon Retail Group LLC",
        "100246813500003",
        "SAR",
        "Regional freight services",
        "5",
        "1600.00",
        "15",
        "REVIEW_REQUIRED",
        "invalid",
        None,
        "9500.00",
        None,
    ),
    (
        "SEED-2026-0005",
        "2026-09-14",
        "Emirates Vertex Solutions LLC",
        "100567890123456",
        "Oasis Systems LLC",
        "100987654300003",
        "AED",
        "Cloud operations subscription",
        "6",
        "950.00",
        "5",
        "INTEGRATION_FAILED",
        "clean",
        None,
        None,
        "ERP simulator returned HTTP 500.",
    ),
    (
        "SEED-2026-0006",
        "2026-09-13",
        "Red Sea Technical Services LLC",
        "310456789000003",
        "Falcon Retail Group LLC",
        "100246813500003",
        "SAR",
        "Point-of-sale support package",
        "12",
        "625.00",
        "15",
        "APPROVED",
        "clean",
        None,
        None,
        None,
    ),
    (
        "SEED-2026-0007",
        "2026-09-12",
        "Gulf Meridian Consulting LLC",
        "310135792400003",
        "Rimal Operations LLC",
        "100987654300003",
        "SAR",
        "Process improvement workshop",
        "2",
        "3500.00",
        "15",
        "VALIDATED",
        "clean",
        None,
        None,
        None,
    ),
    (
        "SEED-2026-0008",
        "2026-09-11",
        "Desert Gate Office Supplies LLC",
        "310864209700003",
        "Falcon Retail Group LLC",
        "100246813500003",
        "SAR",
        "Branch office consumables",
        "20",
        "185.00",
        "15",
        "INTEGRATED",
        "clean",
        "ERP-SA-260911-033",
        None,
        None,
    ),
)


def _copy_document(invoice, sample):
    target = settings.upload_dir / invoice.storage_key
    if not target.exists():
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        target.write_bytes((settings.sample_dir / f"{sample}.pdf").read_bytes())


def seed_portfolio_demo(db):
    """Add missing portfolio records without changing any existing data."""
    existing = {
        invoice.invoice_number: invoice
        for invoice in db.scalars(select(Invoice).where(Invoice.invoice_number.like("SEED-2026-%")))
    }
    created = 0
    # Insert oldest first so integer-keyed activity feeds remain newest-first.
    for record in reversed(DEMO_RECORDS):
        (
            number,
            invoice_date,
            supplier,
            supplier_tax,
            customer,
            customer_tax,
            currency,
            description,
            quantity_text,
            price_text,
            rate_text,
            status,
            sample,
            reference,
            declared_total,
            error,
        ) = record
        index = int(number.rsplit("-", 1)[-1])
        if number in existing:
            _copy_document(existing[number], sample)
            continue
        quantity, unit_price, tax_rate = map(Decimal, (quantity_text, price_text, rate_text))
        subtotal = quantity * unit_price
        tax = (subtotal * tax_rate / Decimal("100")).quantize(Decimal("0.01"))
        total = Decimal(declared_total) if declared_total else subtotal + tax
        timestamp = f"{invoice_date}T09:{index:02d}:00+00:00"
        invoice = Invoice(
            filename=f"{number}.pdf",
            storage_key=f"portfolio-demo-{index:02d}.pdf",
            is_demo=True,
            status=status,
            invoice_number=number,
            invoice_date=invoice_date,
            supplier_name=supplier,
            supplier_tax_number=supplier_tax,
            customer_name=customer,
            customer_tax_number=customer_tax,
            currency=currency,
            subtotal=subtotal,
            tax_amount=tax,
            total_amount=total,
            created_at=timestamp,
            updated_at=timestamp,
            reviewed_at=timestamp,
            approved_at=timestamp
            if status in {"APPROVED", "INTEGRATED", "INTEGRATION_FAILED"}
            else None,
            erp_reference=reference,
            processing_ms=110 + index * 17,
            last_error=error,
            items=[
                InvoiceItem(
                    description=description,
                    quantity=quantity,
                    unit_price=unit_price,
                    tax_rate=tax_rate,
                    total=subtotal,
                )
            ],
        )
        invoice.validation_results = validate(invoice)
        invoice.events = [
            AuditEvent(
                timestamp=timestamp, action="UPLOADED", detail="Fictional demo invoice uploaded"
            ),
            AuditEvent(
                timestamp=timestamp,
                action="EXTRACTED",
                detail="Demo invoice extracted and normalized",
            ),
            AuditEvent(
                timestamp=timestamp, action=status, detail="Portfolio demo scenario prepared"
            ),
        ]
        if status in {"INTEGRATED", "INTEGRATION_FAILED"}:
            success = status == "INTEGRATED"
            invoice.integration_logs = [
                IntegrationLog(
                    timestamp=timestamp,
                    destination="Mock ERP",
                    attempt_number=1,
                    http_status=200 if success else 500,
                    duration_ms=145 + index * 23,
                    result="SUCCESS" if success else "FAILED",
                    scenario="SUCCESS" if success else "500",
                    error_message=None if success else error,
                    reference=reference,
                )
            ]
        db.add(invoice)
        _copy_document(invoice, sample)
        created += 1
    db.commit()
    return created
