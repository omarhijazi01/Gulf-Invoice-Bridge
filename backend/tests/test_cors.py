import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.core.cors import configure_cors


@pytest.mark.parametrize("value", [None, ""])
def test_local_defaults(monkeypatch, value):
    if value is None:
        monkeypatch.delenv("CORS_ORIGINS", raising=False)
    else:
        monkeypatch.setenv("CORS_ORIGINS", value)
    assert Settings().cors_origins == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_configured_origins_and_preflight(monkeypatch):
    monkeypatch.setenv(
        "CORS_ORIGINS",
        " https://frontend.example.test/, http://localhost:5173, ",
    )
    configuration = Settings()
    assert configuration.cors_origins == [
        "https://frontend.example.test",
        "http://localhost:5173",
    ]
    app = FastAPI()
    configure_cors(app, configuration)
    with TestClient(app) as client:
        for origin in configuration.cors_origins:
            for method in ["GET", "POST", "PATCH"]:
                response = client.options(
                    "/api/invoices",
                    headers={
                        "Origin": origin,
                        "Access-Control-Request-Method": method,
                        "Access-Control-Request-Headers": "content-type",
                    },
                )
                assert response.status_code == 200
                assert response.headers["access-control-allow-origin"] == origin
                assert "access-control-allow-credentials" not in response.headers
        response = client.options(
            "/api/invoices",
            headers={
                "Origin": "https://untrusted.example.test",
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 400
        assert "access-control-allow-origin" not in response.headers


def test_wildcard_rejected(monkeypatch):
    monkeypatch.setenv("CORS_ORIGINS", "*")
    with pytest.raises(ValueError, match="explicit origins"):
        Settings()


def test_main_app_cors_is_installed(client):
    response = client.get("/api/health", headers={"Origin": "http://localhost:5173"})
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"
