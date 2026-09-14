import re

from app.services.extraction.base import ExtractionResult, InvoiceExtractionService


class DemoInvoiceExtractionService(InvoiceExtractionService):
    """Deterministic label parser, not an AI model. Confidence is illustrative."""

    name = "demo"

    def extract(self, text):
        fields = {}
        for field in ExtractionResult.model_fields:
            if field in ("items", "confidence"):
                continue
            label = field.replace("_", " ")
            match = re.search(rf"^{label}:[ \t]*([^\n]*)$", text, re.I | re.M)
            fields[field] = match.group(1).strip() or None if match else None
        items = []
        for match in re.finditer(r"^Item:[ \t]*(.+)$", text, re.M):
            parts = [value.strip() or None for value in match.group(1).split("|")]
            if len(parts) == 5:
                items.append(
                    dict(zip(("description", "quantity", "unit_price", "tax_rate", "total"), parts))
                )
        return ExtractionResult(
            **fields,
            items=items,
            confidence=[
                {"field": key, "confidence": 98 if value else 0, "uncertain": not bool(value)}
                for key, value in fields.items()
            ],
        )
