import httpx
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker
from test_invoice_api import make_sample

from app.db.session import make_engine
from app.erp.database import ERPBase, get_erp_db
from app.erp.main import app as erp_app
from app.integrations.mock_erp import MockERPConnector, get_connector
from app.main import app


@pytest.fixture
def erp(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path}/erp.db")
    ERPBase.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)

    def dependency():
        with factory() as db:
            yield db

    erp_app.dependency_overrides[get_erp_db] = dependency
    with TestClient(erp_app) as client:
        yield client
    erp_app.dependency_overrides.clear()
    engine.dispose()


@pytest.mark.parametrize("scenario", ["SUCCESS", "401", "400", "500", "TIMEOUT"])
def test_connector_failure_and_retry(client, erp, monkeypatch, scenario):
    # Actual HTTP connector serialization against the independent ASGI simulator.
    # Real sockets are additionally exercised by scripts/smoke_http.py.
    original = httpx.Client

    class HTTPBoundary:
        def __init__(self, **kwargs):
            pass

        def __enter__(self):
            return self

        def __exit__(self, *args):
            pass

        def post(self, url, **kwargs):
            if kwargs["headers"]["X-Simulation-Scenario"] == "TIMEOUT":
                raise httpx.ReadTimeout("timeout")
            return erp.post("/api/mock-erp/invoices", **kwargs)

    identifier = make_sample(client)
    client.post(f"/api/invoices/{identifier}/extract")
    assert client.post(f"/api/invoices/{identifier}/integrate", json={}).status_code == 409
    client.post(f"/api/invoices/{identifier}/approve")
    payload = client.get(f"/api/invoices/{identifier}/payload").json()
    assert payload["total"] == "1150.00"
    monkeypatch.setattr(httpx, "Client", HTTPBoundary)
    app.dependency_overrides[get_connector] = lambda: MockERPConnector()
    response = client.post(f"/api/invoices/{identifier}/integrate", json={"scenario": scenario})
    assert response.status_code == 200, response.text
    invoice = response.json()
    if scenario == "SUCCESS":
        assert invoice["status"] == "INTEGRATED"
    else:
        assert invoice["status"] == "INTEGRATION_FAILED"
        assert invoice["integration_logs"][0]["http_status"] == (
            None if scenario == "TIMEOUT" else int(scenario)
        )
        invoice = client.post(
            f"/api/invoices/{identifier}/retry-integration", json={"scenario": "SUCCESS"}
        ).json()
        assert invoice["status"] == "INTEGRATED"
        assert len(invoice["integration_logs"]) == 2
    monkeypatch.setattr(httpx, "Client", original)
    duplicate = erp.post(
        "/api/mock-erp/invoices", json=payload, headers={"Idempotency-Key": identifier}
    )
    assert duplicate.json()["reference"] == invoice["erp_reference"]
    assert len(erp.get("/api/mock-erp/invoices").json()) == 1
    assert client.post(f"/api/invoices/{identifier}/retry-integration", json={}).status_code == 409
