from decimal import Decimal

from app.models.invoice import Invoice, InvoiceItem
from app.services.validation.rules import validate


def clean_invoice():
    return Invoice(
        filename="x",
        storage_key="x",
        invoice_number="A",
        invoice_date="2026-09-13",
        supplier_name="Dune LLC",
        customer_name="Oasis LLC",
        supplier_tax_number="123",
        customer_tax_number="456",
        currency="AED",
        subtotal=Decimal("1000"),
        tax_amount=Decimal("50"),
        total_amount=Decimal("1050"),
        items=[
            InvoiceItem(
                description="Service",
                quantity=Decimal("2"),
                unit_price=Decimal("500"),
                tax_rate=Decimal("5"),
                total=Decimal("1000"),
            )
        ],
    )


def test_clean_and_duplicate():
    invoice = clean_invoice()
    assert all(r.status == "PASS" for r in validate(invoice))
    assert any(r.rule == "duplicate" and r.status == "ERROR" for r in validate(invoice, True))


def test_financial_rules():
    invoice = clean_invoice()
    invoice.subtotal = Decimal("900")
    invoice.tax_amount = Decimal("49")
    invoice.total_amount = Decimal("1051")
    errors = {r.rule for r in validate(invoice) if r.status == "ERROR"}
    assert {"subtotal_consistency", "tax_consistency", "total_consistency"} <= errors


def test_missing_and_negative_fields():
    invoice = clean_invoice()
    invoice.supplier_tax_number = None
    invoice.items[0].quantity = Decimal("-1")
    invoice.invoice_date = "invalid"
    invoice.currency = "USD"
    results = {r.rule: r.status for r in validate(invoice)}
    assert results["supplier_tax_number"] == "WARNING"
    assert results["item_1_values"] == results["invoice_date"] == results["currency"] == "ERROR"


def test_decimal_rounding():
    invoice = clean_invoice()
    invoice.items[0].quantity = Decimal("3")
    invoice.items[0].unit_price = Decimal("0.10")
    invoice.items[0].total = invoice.subtotal = Decimal("0.30")
    invoice.tax_amount = Decimal("0.02")
    invoice.total_amount = Decimal("0.32")
    assert all(r.status == "PASS" for r in validate(invoice))


def test_large_valid_inputs_report_mismatch_without_decimal_overflow():
    invoice = clean_invoice()
    invoice.items[0].quantity = Decimal("99999999999999")
    invoice.items[0].unit_price = Decimal("99999999999999")
    results = validate(invoice)
    assert any(r.rule == "item_1_total" and r.status == "ERROR" for r in results)
    assert any(r.rule == "subtotal_consistency" and r.status == "ERROR" for r in results)
