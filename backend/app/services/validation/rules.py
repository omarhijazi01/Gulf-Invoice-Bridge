from datetime import date
from decimal import ROUND_HALF_UP, Decimal, localcontext

from app.models.invoice import ValidationResult

CENT = Decimal("0.01")


def money(value):
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def validate(invoice, duplicate=False):
    # Allowed quantity/price inputs can multiply beyond Decimal's default
    # 28-digit precision; keep intermediate products and sums exact.
    with localcontext() as context:
        context.prec = 50
        return _validate(invoice, duplicate)


def _validate(invoice, duplicate=False):
    results = []

    def check(rule, passed, success, failure, warning=False):
        status = "PASS" if passed else "WARNING" if warning else "ERROR"
        results.append(
            ValidationResult(
                rule=rule,
                status=status,
                message=success if passed else failure,
                severity="INFO" if passed else status,
            )
        )

    for field in ("invoice_number", "supplier_name", "customer_name"):
        label = field.replace("_", " ").capitalize()
        check(field, bool(getattr(invoice, field)), f"{label} present", f"{label} is required")
    try:
        date.fromisoformat(invoice.invoice_date or "")
        valid_date = True
    except ValueError:
        valid_date = False
    check("invoice_date", valid_date, "Invoice date is valid", "A valid invoice date is required")
    check(
        "currency",
        invoice.currency in ("SAR", "AED"),
        "Currency supported",
        "Currency must be SAR or AED",
    )
    check(
        "duplicate",
        not duplicate,
        "No duplicate supplier invoice",
        "Invoice number already exists for this supplier",
    )
    for field in ("supplier_tax_number", "customer_tax_number"):
        value = getattr(invoice, field)
        check(
            field,
            bool(value),
            f"{field.replace('_', ' ').capitalize()} present",
            f"{field.replace('_', ' ').capitalize()} is missing",
            True,
        )
    check("items", bool(invoice.items), "Line items present", "At least one line item is required")
    calculable = bool(invoice.items)
    subtotal, tax = Decimal("0"), Decimal("0")
    for i, item in enumerate(invoice.items, 1):
        prefix = f"Line {i}"
        check(
            f"item_{i}_description",
            bool(item.description),
            f"{prefix}: description present",
            f"{prefix}: description required",
        )
        valid = all(
            value is not None
            for value in (item.quantity, item.unit_price, item.tax_rate, item.total)
        )
        if valid:
            valid = (
                item.quantity > 0
                and item.unit_price > 0
                and 0 <= item.tax_rate <= 100
                and item.total >= 0
            )
        check(
            f"item_{i}_values",
            valid,
            f"{prefix}: quantity, price and tax rate valid",
            f"{prefix}: require positive quantity/price, nonnegative total and tax rate 0–100",
        )
        calculable = calculable and valid
        if valid:
            net = money(item.quantity * item.unit_price)
            check(
                f"item_{i}_total",
                abs(net - item.total) <= CENT,
                f"{prefix}: net total matches quantity × price",
                f"{prefix}: net total should be {net}",
            )
            subtotal += net
            tax += money(net * item.tax_rate / Decimal("100"))
    for field in ("subtotal", "tax_amount", "total_amount"):
        value = getattr(invoice, field)
        check(
            f"{field}_present",
            value is not None and value >= 0,
            f"{field.replace('_', ' ').capitalize()} is nonnegative",
            f"{field.replace('_', ' ').capitalize()} is required and must be nonnegative",
        )
    if calculable:
        check(
            "subtotal_consistency",
            invoice.subtotal is not None and abs(invoice.subtotal - subtotal) <= CENT,
            "Subtotal matches line items",
            f"Subtotal should be {subtotal}",
        )
        check(
            "tax_consistency",
            invoice.tax_amount is not None and abs(invoice.tax_amount - tax) <= CENT,
            "Tax matches line calculations",
            f"Tax amount should be {tax}",
        )
    if all(
        getattr(invoice, field) is not None for field in ("subtotal", "tax_amount", "total_amount")
    ):
        expected = money(invoice.subtotal + invoice.tax_amount)
        check(
            "total_consistency",
            abs(invoice.total_amount - expected) <= CENT,
            "Total equals subtotal + tax",
            f"Total should be {expected}",
        )
    # Confidence does not validate truth; unresolved uncertainty requires human review.
    if invoice.evidence and not invoice.reviewed_at:
        uncertain = [
            e.field
            for e in invoice.evidence
            if e.uncertain or (e.confidence is not None and e.confidence < 80)
        ]
        if uncertain:
            check(
                "extraction_uncertainty",
                False,
                "",
                "Review uncertain extraction fields: " + ", ".join(uncertain),
                True,
            )
    return results
