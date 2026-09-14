import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm.exc import StaleDataError

logger = logging.getLogger("bridge")


class DomainError(Exception):
    def __init__(self, message: str, status: int = 409):
        self.message = message
        self.status = status


def register_errors(app):
    @app.exception_handler(StaleDataError)
    async def concurrent_edit(_: Request, exc: StaleDataError):
        return JSONResponse(
            status_code=409,
            content={
                "error": {"message": "Invoice changed during this request. Refresh and try again."}
            },
        )

    @app.exception_handler(DomainError)
    async def domain_error(_: Request, exc: DomainError):
        return JSONResponse(status_code=exc.status, content={"error": {"message": exc.message}})

    @app.exception_handler(RequestValidationError)
    async def input_error(_: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": {
                    "message": "Invalid request data",
                    "fields": [".".join(map(str, e["loc"])) for e in exc.errors()],
                }
            },
        )

    @app.exception_handler(SQLAlchemyError)
    async def database_error(_: Request, exc: SQLAlchemyError):
        logger.exception("database_error", exc_info=exc)
        return JSONResponse(
            status_code=503,
            content={"error": {"message": "Database operation failed. Please try again."}},
        )

    @app.exception_handler(Exception)
    async def unexpected(_: Request, exc: Exception):
        logger.exception("unexpected_error", exc_info=exc)
        return JSONResponse(
            status_code=500, content={"error": {"message": "An unexpected error occurred."}}
        )
