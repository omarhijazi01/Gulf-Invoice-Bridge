from typing import Annotated

from fastapi import APIRouter, Depends, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.errors import DomainError
from app.db.session import get_db
from app.repositories.invoices import InvoiceRepository
from app.schemas.invoice import EditInvoice, SampleRequest
from app.schemas.views import invoice_view
from app.services.invoices import InvoiceService

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])
DB = Annotated[Session, Depends(get_db)]


@router.post("/upload", status_code=201)
def upload(file: UploadFile, db: DB):
    if settings.auth_required:
        raise DomainError(
            "Private PDF uploads are unavailable in this limited beta. Use fictional samples.",
            503,
        )
    data = file.file.read(settings.max_upload_bytes + 1)
    return invoice_view(InvoiceService(db).upload(file.filename, file.content_type, data))


@router.post("/sample", status_code=201)
def sample(body: SampleRequest, db: DB):
    if not settings.demo_mode:
        raise DomainError("Sample creation requires demo mode.", 403)
    path = settings.sample_dir / f"{body.scenario}.pdf"
    invoice = InvoiceService(db).upload(path.name, "application/pdf", path.read_bytes(), True)
    return invoice_view(invoice)


@router.get("")
def listing(db: DB):
    return [invoice_view(i, False) for i in InvoiceRepository(db).all()]


@router.get("/{identifier}")
def details(identifier: str, db: DB):
    return invoice_view(InvoiceRepository(db).get(identifier))


@router.get("/{identifier}/document")
def document(identifier: str, db: DB):
    invoice = InvoiceRepository(db).get(identifier)
    return FileResponse(
        settings.upload_dir / invoice.storage_key,
        media_type="application/pdf",
        filename=invoice.filename,
        content_disposition_type="inline",
        headers={"X-Content-Type-Options": "nosniff"},
    )


@router.post("/{identifier}/extract")
def extract(identifier: str, db: DB):
    return invoice_view(InvoiceService(db).extract(identifier))


@router.post("/{identifier}/validate")
def validation(identifier: str, db: DB):
    return invoice_view(InvoiceService(db).validate(identifier))


@router.patch("/{identifier}")
def edit(identifier: str, body: EditInvoice, db: DB):
    return invoice_view(InvoiceService(db).edit(identifier, body))


@router.post("/{identifier}/approve")
def approve(identifier: str, db: DB):
    return invoice_view(InvoiceService(db).approve(identifier))
