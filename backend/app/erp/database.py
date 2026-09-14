from sqlalchemy import Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

from app.core.config import settings
from app.db.session import make_engine
from app.models.invoice import now


class ERPBase(DeclarativeBase):
    pass


class ReceivedInvoice(ERPBase):
    __tablename__ = "received_invoices"
    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[str] = mapped_column(unique=True)
    invoice_number: Mapped[str]
    payload: Mapped[str] = mapped_column(Text)
    timestamp: Mapped[str] = mapped_column(default=now)


engine = make_engine(settings.erp_database_url)
ERPSession = sessionmaker(engine, expire_on_commit=False)


def get_erp_db():
    with ERPSession() as db:
        yield db
