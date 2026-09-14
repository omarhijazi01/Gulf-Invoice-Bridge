from fastapi import APIRouter

from app.api.routes.invoices import DB
from app.services.dashboard import stats, system_health

router = APIRouter(prefix="/api", tags=["Dashboard"])


@router.get("/dashboard/stats")
def dashboard(db: DB):
    return stats(db)


@router.get("/system")
def system(db: DB):
    return system_health(db)
