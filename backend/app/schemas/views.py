from decimal import Decimal

from sqlalchemy.inspection import inspect


def columns(obj, exclude=()):
    return {
        column.key: str(value) if isinstance(value := getattr(obj, column.key), Decimal) else value
        for column in inspect(type(obj)).columns
        if column.key not in exclude
    }


def invoice_view(invoice, detail=True):
    data = columns(invoice, ("storage_key",))
    data["validation_results"] = [
        columns(r, ("id", "invoice_id")) for r in invoice.validation_results
    ]
    if detail:
        for name in ("items", "evidence", "events", "integration_logs"):
            data[name] = [columns(row, ("invoice_id",)) for row in getattr(invoice, name)]
    return data
