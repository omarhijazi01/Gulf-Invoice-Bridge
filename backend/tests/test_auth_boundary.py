import httpx
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings
from app.core.errors import DomainError
from app.db.session import Base, make_engine
from app.main import app
from app.models.invoice import AuditEvent, IntegrationLog, Invoice
from app.repositories.invoices import InvoiceRepository


def test_api_requires_session_when_enabled(client, monkeypatch):
    monkeypatch.setattr(settings, "auth_required", True)
    response = client.get("/api/invoices")
    assert response.status_code == 401
    assert client.get("/api/health").status_code == 200


def test_accounts_cannot_read_each_others_invoices_or_activity(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path}/isolated.db")
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        own = Invoice(
            owner_id="11111111-1111-4111-8111-111111111111",
            filename="own.pdf",
            storage_key="own.pdf",
            invoice_number="SAME",
            supplier_name="Supplier",
            events=[AuditEvent(action="UPLOADED", detail="Own event")],
            integration_logs=[IntegrationLog(attempt_number=1, result="SUCCESS", scenario="SUCCESS")],
        )
        other = Invoice(
            owner_id="22222222-2222-4222-8222-222222222222",
            filename="other.pdf",
            storage_key="other.pdf",
            invoice_number="SAME",
            supplier_name="Supplier",
            events=[AuditEvent(action="UPLOADED", detail="Other event")],
            integration_logs=[IntegrationLog(attempt_number=1, result="SUCCESS", scenario="SUCCESS")],
        )
        db.add_all([own, other])
        db.commit()
        db.info["owner_id"] = own.owner_id
        repo = InvoiceRepository(db)
        assert [item.id for item in repo.all()] == [own.id]
        assert repo.get(own.id).id == own.id
        assert not repo.duplicate(own)
        assert len(repo.logs()) == 1
        assert len(repo.events()) == 1
        try:
            repo.get(other.id)
        except DomainError as error:
            assert error.status == 404
        else:
            raise AssertionError("Another user's invoice was exposed")
    engine.dispose()


def test_authenticated_api_is_scoped_to_verified_user(tmp_path, monkeypatch):
    engine = make_engine(f"sqlite:///{tmp_path}/api-isolated.db")
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as db:
        db.add_all([
            Invoice(owner_id="11111111-1111-4111-8111-111111111111", filename="a.pdf", storage_key="a.pdf"),
            Invoice(owner_id="22222222-2222-4222-8222-222222222222", filename="b.pdf", storage_key="b.pdf"),
        ])
        db.commit()
        ids = [row.id for row in db.query(Invoice).order_by(Invoice.filename)]

    class AuthClient:
        def __init__(self, **_kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *_args):
            pass

        async def get(self, _url, headers):
            class Response:
                status_code = 200

                def json(self):
                    return {
                        "id": "11111111-1111-4111-8111-111111111111",
                        "email_confirmed_at": "2026-09-23T00:00:00Z",
                    }

            assert headers["Authorization"] == "Bearer valid"
            return Response()

    monkeypatch.setattr(httpx, "AsyncClient", AuthClient)
    monkeypatch.setattr(settings, "auth_required", True)
    monkeypatch.setattr(settings, "auto_seed_demo", False)
    monkeypatch.setattr(settings, "supabase_url", "https://example.supabase.co")
    monkeypatch.setattr(settings, "supabase_publishable_key", "public-test-key")
    monkeypatch.setattr("app.main.engine", engine)
    monkeypatch.setattr("app.main.SessionLocal", factory)
    monkeypatch.setattr("app.db.session.SessionLocal", factory)
    with TestClient(app) as client:
        headers = {"Authorization": "Bearer valid"}
        assert [row["id"] for row in client.get("/api/invoices", headers=headers).json()] == [ids[0]]
        assert client.get(f"/api/invoices/{ids[1]}", headers=headers).status_code == 404
        assert client.get(f"/api/invoices/{ids[1]}/document", headers=headers).status_code == 404
        assert client.get("/api/dashboard/stats", headers=headers).json()["total_invoices"] == 1
    engine.dispose()
