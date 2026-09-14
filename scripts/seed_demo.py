"""Idempotent fictional seed data created through real API workflows."""

import sys

import httpx

base = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8000"


def request(method, path, **kwargs):
    response = httpx.request(method, base + path, timeout=60, **kwargs)
    response.raise_for_status()
    return response.json()


def seed():
    existing = {i["invoice_number"]: i for i in request("GET", "/api/invoices")}
    for index, (sample, target) in enumerate(
        [
            ("clean", "INTEGRATED"),
            ("clean", "APPROVED"),
            ("review", "REVIEW_REQUIRED"),
            ("invalid", "REVIEW_REQUIRED"),
            ("clean", "INTEGRATION_FAILED"),
            ("clean", "VALIDATED"),
        ],
        1,
    ):
        number = f"SEED-2026-{index:04d}"
        if number in existing:
            current = existing[number]
            if target == "INTEGRATED" and current["status"] == "INTEGRATION_FAILED":
                current = request(
                    "POST",
                    f"/api/invoices/{current['id']}/retry-integration",
                    json={"scenario": "SUCCESS"},
                )
                assert current["status"] == "INTEGRATED", current.get("last_error")
            print(f"{number}: {current['status']} (existing)")
            continue
        invoice = request("POST", "/api/invoices/sample", json={"scenario": sample})
        prefix = f"/api/invoices/{invoice['id']}"
        invoice = request("POST", prefix + "/extract")
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
        data["invoice_number"] = number
        data["items"] = [
            {k: v for k, v in item.items() if k != "id"} for item in invoice["items"]
        ]
        request("PATCH", prefix, json=data)
        invoice = request("POST", prefix + "/validate")
        if target in ("APPROVED", "INTEGRATED", "INTEGRATION_FAILED"):
            invoice = request("POST", prefix + "/approve")
        if target in ("INTEGRATED", "INTEGRATION_FAILED"):
            invoice = request(
                "POST",
                prefix + "/integrate",
                json={"scenario": "SUCCESS" if target == "INTEGRATED" else "500"},
            )
        assert invoice["status"] == target, invoice.get("last_error")
        print(f"{number}: {invoice['status']}")


if __name__ == "__main__":
    seed()
