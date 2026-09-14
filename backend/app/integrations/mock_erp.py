import httpx
from pydantic import ValidationError

from app.core.config import settings
from app.integrations.base import ConnectorError, ERPConnector
from app.schemas.erp import ERPReceipt


class MockERPConnector(ERPConnector):
    def send(self, payload, scenario):
        try:
            with httpx.Client(timeout=settings.erp_timeout) as client:
                response = client.post(
                    f"{settings.erp_base_url}/api/mock-erp/invoices",
                    json=payload.model_dump(mode="json"),
                    headers={
                        "Idempotency-Key": payload.source_id,
                        "X-Simulation-Scenario": scenario,
                    },
                )
            if response.status_code != 200:
                raise ConnectorError(
                    f"Simulator returned HTTP {response.status_code}.", response.status_code
                )
            return ERPReceipt.model_validate(response.json())
        except httpx.TimeoutException as exc:
            raise ConnectorError(
                "ERP request timed out. Retry safely with the same idempotency key."
            ) from exc
        except httpx.RequestError as exc:
            raise ConnectorError("ERP simulator is unreachable. Check that it is running.") from exc
        except (ValidationError, ValueError) as exc:
            raise ConnectorError("ERP returned an invalid response.", 502) from exc


def get_connector():
    return MockERPConnector()
