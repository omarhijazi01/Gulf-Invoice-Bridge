from decimal import Decimal

from sqlalchemy.orm import Session

from app.db.session import Base, make_engine
from app.models.invoice import Invoice, InvoiceItem
from app.repositories.invoices import InvoiceRepository


def test_persistence_and_exact_money(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path}/test.db")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        invoice = Invoice(
            filename="invoice.pdf",
            storage_key="safe.pdf",
            total_amount=Decimal("123456789.13"),
            items=[
                InvoiceItem(
                    description="Service", quantity=Decimal("1"), unit_price=Decimal("0.10")
                )
            ],
        )
        db.add(invoice)
        db.commit()
        identifier = invoice.id
    with Session(engine) as db:
        invoice = InvoiceRepository(db).get(identifier)
        assert invoice.total_amount == Decimal("123456789.13")
        assert invoice.items[0].unit_price == Decimal("0.10")
        assert invoice.status == "UPLOADED"
