import time
from contextlib import asynccontextmanager
from typing import Annotated, Literal

from fastapi import Depends, FastAPI, Header
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError, register_errors
from app.erp import service
from app.erp.database import ERPBase, engine, get_erp_db
from app.schemas.erp import ERPPayload


@asynccontextmanager
async def lifespan(app):
    ERPBase.metadata.create_all(engine)
    yield


app = FastAPI(title="Gulf Invoice Bridge — Independent Local ERP Simulator", lifespan=lifespan)
register_errors(app)
DB = Annotated[Session, Depends(get_erp_db)]


@app.get("/health")
def health():
    return {"status": "ok", "environment": "LOCAL SIMULATOR"}


@app.post("/api/mock-erp/invoices")
def receive(
    payload: ERPPayload,
    db: DB,
    idempotency_key: Annotated[str, Header()],
    x_simulation_scenario: Annotated[
        Literal["SUCCESS", "401", "400", "500", "TIMEOUT"], Header()
    ] = "SUCCESS",
):
    if idempotency_key != payload.source_id:
        raise DomainError("Idempotency key must match source_id.", 400)
    if x_simulation_scenario != "SUCCESS" and not settings.demo_mode:
        raise DomainError("Failure simulation requires DEMO_MODE.", 403)
    if x_simulation_scenario in ("401", "400", "500"):
        raise DomainError(f"SIMULATION: HTTP {x_simulation_scenario}", int(x_simulation_scenario))
    if x_simulation_scenario == "TIMEOUT":
        time.sleep(settings.erp_timeout + 1)
        raise DomainError("SIMULATION: timeout; invoice was not persisted.", 504)
    return service.receive(db, payload)


@app.get("/api/mock-erp/invoices")
def listing(db: DB):
    return service.records(db)


@app.get("/api/mock-erp/invoices/{identifier}")
def details(identifier: int, db: DB):
    return service.get(db, identifier)
