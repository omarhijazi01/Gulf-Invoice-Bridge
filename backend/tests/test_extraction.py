from pathlib import Path

import pytest

from app.core.errors import DomainError
from app.services.extraction.demo import DemoInvoiceExtractionService
from app.services.extraction.pdf import read_pdf

SAMPLES = Path(__file__).resolve().parents[2] / "sample-data/invoices"


@pytest.mark.parametrize("scenario", ["clean", "review", "invalid"])
def test_actual_pdf_extraction(scenario):
    result = DemoInvoiceExtractionService().extract(
        read_pdf((SAMPLES / f"{scenario}.pdf").read_bytes())
    )
    assert result.invoice_number.startswith("INV-")
    assert result.items[0].quantity == "2"
    assert result.subtotal == "1000.00"
    if scenario == "review":
        assert result.supplier_tax_number is None


@pytest.mark.parametrize("content", [b"fake", b"%PDF-broken"])
def test_rejects_invalid_pdf(content):
    with pytest.raises(DomainError):
        read_pdf(content)


def test_missing_fields_are_not_invented():
    result = DemoInvoiceExtractionService().extract("Invoice Number: 000123")
    assert result.invoice_number == "000123"
    assert result.total_amount is None
    assert result.items == []
