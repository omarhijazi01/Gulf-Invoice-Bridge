from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.integration import router as integration_router
from app.api.routes.invoices import router as invoice_router
from app.core.config import settings
from app.core.cors import configure_cors
from app.core.errors import register_errors
from app.core.logging import configure_logging
from app.db.session import Base, SessionLocal, engine
from app.services.demo_seed import seed_portfolio_demo
from app.services.recovery import recover_interrupted


@asynccontextmanager
async def lifespan(app):
    configure_logging()
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        recover_interrupted(db)
        if settings.auto_seed_demo:
            seed_portfolio_demo(db)
    yield


app = FastAPI(title="Gulf Invoice Bridge", version="1.0.0", lifespan=lifespan)
configure_cors(app)
register_errors(app)
app.include_router(invoice_router)
app.include_router(integration_router)
app.include_router(dashboard_router)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok"}
