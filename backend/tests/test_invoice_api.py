from app.core.config import settings


def make_sample(client, name="clean"):
    response = client.post("/api/invoices/sample", json={"scenario": name})
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_upload_extract_approve(client):
    identifier = make_sample(client)
    assert client.post(f"/api/invoices/{identifier}/approve").status_code == 409
    response = client.post(f"/api/invoices/{identifier}/extract")
    assert response.status_code == 200, response.text
    assert response.json()["status"] == "VALIDATED"
    assert client.post(f"/api/invoices/{identifier}/approve").json()["status"] == "APPROVED"
    assert client.post(f"/api/invoices/{identifier}/extract").status_code == 409


def test_review_correction_and_duplicate(client):
    identifier = make_sample(client, "review")
    invoice = client.post(f"/api/invoices/{identifier}/extract").json()
    assert invoice["status"] == "REVIEW_REQUIRED"
    from app.schemas.invoice import InvoiceData

    payload = {key: invoice[key] for key in InvoiceData.model_fields if key != "items"}
    payload["items"] = [{k: v for k, v in item.items() if k != "id"} for item in invoice["items"]]
    payload.update(version=invoice["version"], supplier_tax_number="100123456700003")
    assert client.patch(f"/api/invoices/{identifier}", json=payload).json()["status"] == "EXTRACTED"
    assert client.post(f"/api/invoices/{identifier}/approve").status_code == 409
    assert client.post(f"/api/invoices/{identifier}/validate").json()["status"] == "VALIDATED"
    assert client.post(f"/api/invoices/{identifier}/approve").json()["status"] == "APPROVED"
    second = make_sample(client, "review")
    duplicate = client.post(f"/api/invoices/{second}/extract").json()
    assert any(
        r["rule"] == "duplicate" and r["status"] == "ERROR" for r in duplicate["validation_results"]
    )


def test_upload_validation(client):
    assert (
        client.post(
            "/api/invoices/upload", files={"file": ("fake.pdf", b"not pdf", "application/pdf")}
        ).status_code
        == 422
    )
    data = (settings.sample_dir / "clean.pdf").read_bytes()
    response = client.post(
        "/api/invoices/upload", files={"file": ("../../clean.pdf", data, "application/pdf")}
    )
    assert response.status_code == 201
    assert response.json()["filename"] == "clean.pdf"
    assert "storage_key" not in response.json()
    assert client.get("/api/invoices/missing").status_code == 404


def test_stale_edit_and_repeat_edit(client):
    from app.schemas.invoice import InvoiceData

    identifier = make_sample(client)
    invoice = client.post(f"/api/invoices/{identifier}/extract").json()
    data = {key: invoice[key] for key in InvoiceData.model_fields if key != "items"}
    data["items"] = [{k: v for k, v in item.items() if k != "id"} for item in invoice["items"]]
    data["version"] = invoice["version"]
    updated = client.patch(f"/api/invoices/{identifier}", json=data)
    assert updated.status_code == 200
    assert client.patch(f"/api/invoices/{identifier}", json=data).status_code == 409
    data["version"] = updated.json()["version"]
    assert client.patch(f"/api/invoices/{identifier}", json=data).status_code == 200


def test_oversized_and_scanned_upload(client):
    from io import BytesIO

    from pypdf import PdfWriter

    oversized = client.post(
        "/api/invoices/upload",
        files={"file": ("huge.pdf", b"%PDF-" + b"x" * (10 * 1024 * 1024), "application/pdf")},
    )
    assert oversized.status_code == 413
    writer = PdfWriter()
    writer.add_blank_page(width=100, height=100)
    buffer = BytesIO()
    writer.write(buffer)
    response = client.post(
        "/api/invoices/upload", files={"file": ("scan.pdf", buffer.getvalue(), "application/pdf")}
    )
    assert response.status_code == 201
    identifier = response.json()["id"]
    assert client.post(f"/api/invoices/{identifier}/extract").status_code == 422
    assert client.get(f"/api/invoices/{identifier}").json()["status"] == "UPLOADED"
