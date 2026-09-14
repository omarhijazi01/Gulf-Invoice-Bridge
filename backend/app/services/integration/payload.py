from app.schemas.erp import ERPPayload, Party
from app.schemas.invoice import ItemData
from app.services.workflow import require_state


def transform(invoice):
    require_state(invoice, "APPROVED", "INTEGRATING", "INTEGRATED", "INTEGRATION_FAILED")
    return ERPPayload(
        source_id=invoice.id,
        invoice_number=invoice.invoice_number,
        invoice_date=invoice.invoice_date,
        supplier=Party(name=invoice.supplier_name, tax_number=invoice.supplier_tax_number),
        customer=Party(name=invoice.customer_name, tax_number=invoice.customer_tax_number),
        currency=invoice.currency,
        subtotal=invoice.subtotal,
        tax=invoice.tax_amount,
        total=invoice.total_amount,
        items=[
            ItemData(**{key: getattr(item, key) for key in ItemData.model_fields})
            for item in invoice.items
        ],
    )
