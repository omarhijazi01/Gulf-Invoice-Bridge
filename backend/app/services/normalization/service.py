import re
from datetime import datetime
from decimal import Decimal, InvalidOperation

from app.schemas.invoice import InvoiceData


def clean_text(value):
    if value is None:
        return None
    return " ".join(str(value).split()) or None


def number(value):
    if value is None or str(value).strip() == "":
        return None
    text = str(value).strip().replace("٬", ",").replace("٫", ".")
    text = text.translate(str.maketrans("٠١٢٣٤٥٦٧٨٩", "0123456789"))
    # Explicit US grouping only; ambiguous decimal commas are not guessed.
    if "," in text:
        if not re.fullmatch(r"-?\d{1,3}(,\d{3})+(\.\d+)?", text):
            return None
        text = text.replace(",", "")
    try:
        result = Decimal(text)
        if (
            not result.is_finite()
            or abs(result) >= Decimal("100000000000000")
            or result.as_tuple().exponent < -4
        ):
            return None
        return result
    except InvalidOperation:
        return None


def date(value):
    value = clean_text(value)
    if not value:
        return None
    for pattern in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value, pattern).date().isoformat()
        except ValueError:
            continue
    return value


def normalize(raw: dict) -> InvoiceData:
    fields = {
        key: clean_text(raw.get(key))
        for key in (
            "invoice_number",
            "supplier_name",
            "supplier_tax_number",
            "customer_name",
            "customer_tax_number",
        )
    }
    fields["invoice_date"] = date(raw.get("invoice_date"))
    fields["currency"] = (clean_text(raw.get("currency")) or "").upper() or None
    for key in ("subtotal", "tax_amount", "total_amount"):
        fields[key] = number(raw.get(key))
    fields["items"] = [
        {
            "description": clean_text(item.get("description")),
            **{
                key: number(item.get(key))
                for key in ("quantity", "unit_price", "tax_rate", "total")
            },
        }
        for item in raw.get("items", [])
    ]
    return InvoiceData.model_validate(fields)
