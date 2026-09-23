from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.integration import router as integration_router
from app.api.routes.invoices import router as invoice_router
from app.core.config import settings
from app.core.cors import configure_cors
from app.core.errors import register_errors
from app.core.logging import configure_logging
from app.db.session import Base, SessionLocal, engine, ensure_owner_column
from app.services.demo_seed import seed_portfolio_demo
from app.services.recovery import recover_interrupted


@asynccontextmanager
async def lifespan(app):
    configure_logging()
    Base.metadata.create_all(engine)
    ensure_owner_column()
    if settings.auth_required and (not settings.supabase_url or not settings.supabase_publishable_key):
        raise RuntimeError("Supabase Auth configuration is required when AUTH_REQUIRED=true")
    with SessionLocal() as db:
        recover_interrupted(db)
        if settings.auto_seed_demo and not settings.auth_required:
            seed_portfolio_demo(db)
    yield


app = FastAPI(title="Gulf Invoice Bridge", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def verify_session(request: Request, call_next):
    if not settings.auth_required or not request.url.path.startswith("/api/") or request.url.path == "/api/health" or request.method == "OPTIONS":
        return await call_next(request)
    bearer = request.headers.get("authorization", "")
    if not bearer.startswith("Bearer ") or not bearer[7:]:
        return JSONResponse({"error": {"message": "Sign in required."}}, status_code=401)
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(
                f"{settings.supabase_url}/auth/v1/user",
                headers={
                    "apikey": settings.supabase_publishable_key,
                    "Authorization": bearer,
                },
            )
        if response.status_code != 200:
            return JSONResponse({"error": {"message": "Session expired. Sign in again."}}, status_code=401)
        user = response.json()
        if not user.get("id") or not user.get("email_confirmed_at"):
            return JSONResponse({"error": {"message": "Verify your email before continuing."}}, status_code=403)
        request.state.user_id = user["id"]
    except (httpx.HTTPError, ValueError):
        return JSONResponse({"error": {"message": "Authentication is temporarily unavailable."}}, status_code=503)
    return await call_next(request)
configure_cors(app)
register_errors(app)
app.include_router(invoice_router)
app.include_router(integration_router)
app.include_router(dashboard_router)


@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok"}
