from fastapi import APIRouter, Depends

from app.api.routes.invoices import DB
from app.core.config import settings
from app.core.errors import DomainError
from app.integrations.mock_erp import get_connector
from app.repositories.invoices import InvoiceRepository
from app.schemas.invoice import Simulation
from app.schemas.views import columns, invoice_view
from app.services.integration.payload import transform
from app.services.integration.service import IntegrationService

router = APIRouter(prefix="/api", tags=["Integration"])


@router.get("/invoices/{identifier}/payload")
def payload(identifier: str, db: DB):
    return transform(InvoiceRepository(db).get(identifier)).model_dump(mode="json")


@router.post("/invoices/{identifier}/integrate")
def integrate(identifier: str, body: Simulation, db: DB, connector=Depends(get_connector)):
    if body.scenario != "SUCCESS" and not settings.demo_mode:
        raise DomainError("Simulation requires demo mode.", 403)
    return invoice_view(IntegrationService(db, connector).integrate(identifier, body.scenario))


@router.post("/invoices/{identifier}/retry-integration")
def retry(identifier: str, body: Simulation, db: DB, connector=Depends(get_connector)):
    if body.scenario != "SUCCESS" and not settings.demo_mode:
        raise DomainError("Simulation requires demo mode.", 403)
    return invoice_view(
        IntegrationService(db, connector).integrate(identifier, body.scenario, True)
    )


@router.get("/integration/logs")
def logs(db: DB):
    return [columns(log) for log in InvoiceRepository(db).logs()]
