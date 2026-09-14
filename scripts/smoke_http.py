"""Real HTTP acceptance check. Leaves clearly labeled demo records for inspection."""

import sys
from uuid import uuid4

import httpx

base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def request(method, path, **kwargs):
    response = httpx.request(method, base + path, timeout=60, **kwargs)
    response.raise_for_status()
    return response.json()


def run():
    invoice = request("POST", "/api/invoices/sample", json={"scenario": "review"})
    identifier = invoice["id"]
    prefix = f"/api/invoices/{identifier}"
    invoice = request("POST", prefix + "/extract")
    assert invoice["status"] == "REVIEW_REQUIRED"
    keys = [
        "invoice_number",
        "invoice_date",
        "supplier_name",
        "supplier_tax_number",
        "customer_name",
        "customer_tax_number",
        "currency",
        "subtotal",
        "tax_amount",
        "total_amount",
        "version",
    ]
    data = {key: invoice[key] for key in keys}
    data["invoice_number"] = f"HTTP-{uuid4().hex[:8]}"
    data["supplier_tax_number"] = "100123456700003"
    data["items"] = [
        {key: value for key, value in row.items() if key != "id"}
        for row in invoice["items"]
    ]
    request("PATCH", prefix, json=data)
    assert request("POST", prefix + "/validate")["status"] == "VALIDATED"
    assert request("POST", prefix + "/approve")["status"] == "APPROVED"
    for index, scenario in enumerate(["401", "400", "500", "TIMEOUT", "SUCCESS"]):
        action = "/integrate" if index == 0 else "/retry-integration"
        invoice = request("POST", prefix + action, json={"scenario": scenario})
        assert invoice["status"] == (
            "INTEGRATED" if scenario == "SUCCESS" else "INTEGRATION_FAILED"
        ), invoice
    assert len(invoice["integration_logs"]) == 5
    assert invoice["integration_logs"][-1]["http_status"] == 200
    print(
        f"PASS: upload → extract → review → validate → approve → 401/400/500/timeout → retry → {invoice['erp_reference']}"
    )
    print(f"Invoice: {identifier}; attempts: 5; persisted HTTP 200 SUCCESS")


if __name__ == "__main__":
    run()
