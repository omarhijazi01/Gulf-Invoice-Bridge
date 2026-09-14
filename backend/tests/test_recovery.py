from sqlalchemy.orm import Session

from app.db.session import Base, make_engine
from app.models.invoice import IntegrationLog, Invoice
from app.services.recovery import recover_interrupted


def test_interrupted_requests_are_recoverable(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path}/recovery.db")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        extracting = Invoice(filename="a.pdf", storage_key="a", status="EXTRACTING")
        integrating = Invoice(
            filename="b.pdf",
            storage_key="b",
            status="INTEGRATING",
            integration_logs=[
                IntegrationLog(attempt_number=1, result="PENDING", scenario="SUCCESS")
            ],
        )
        db.add_all([extracting, integrating])
        db.commit()
        recover_interrupted(db)
        assert extracting.status == "UPLOADED"
        assert integrating.status == "INTEGRATION_FAILED"
        assert integrating.integration_logs[0].result == "FAILED"
        assert "unknown" in integrating.last_error
