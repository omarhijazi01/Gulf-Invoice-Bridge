from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.session import Base, make_engine
from app.models.invoice import Invoice
from app.services.demo_seed import DEMO_RECORDS, seed_portfolio_demo


def test_demo_seed_is_complete_and_idempotent(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "upload_dir", tmp_path / "uploads")
    engine = make_engine(f"sqlite:///{tmp_path}/seed.db")
    Base.metadata.create_all(engine)
    Session = sessionmaker(engine, expire_on_commit=False)
    with Session() as db:
        assert seed_portfolio_demo(db) == len(DEMO_RECORDS)
        assert seed_portfolio_demo(db) == 0
        invoices = list(db.scalars(select(Invoice)))
        assert len(invoices) == len(DEMO_RECORDS)
        assert {invoice.status for invoice in invoices} >= {
            "INTEGRATED",
            "APPROVED",
            "VALIDATED",
            "REVIEW_REQUIRED",
            "INTEGRATION_FAILED",
        }
        assert sum(len(invoice.integration_logs) for invoice in invoices) == 4
        assert all((settings.upload_dir / invoice.storage_key).exists() for invoice in invoices)
