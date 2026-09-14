from decimal import Decimal

import pytest

from app.services.normalization.service import normalize, number


def test_normalization():
    data = normalize(
        {
            "invoice_number": "  00012 ",
            "supplier_name": " Dune   LLC ",
            "currency": " aed ",
            "invoice_date": "13/09/2026",
            "total_amount": "1,050.10",
        }
    )
    assert data.invoice_number == "00012"
    assert data.supplier_name == "Dune LLC"
    assert data.currency == "AED"
    assert data.invoice_date == "2026-09-13"
    assert data.total_amount == Decimal("1050.10")


@pytest.mark.parametrize("value", ["NaN", "Infinity", "1,23", "bad", "1.00001"])
def test_unsafe_numbers_become_missing(value):
    assert number(value) is None


def test_arabic_number():
    assert number("١٬٠٥٠٫١٠") == Decimal("1050.10")
