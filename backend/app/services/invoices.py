from pathlib import Path
from time import perf_counter
from uuid import uuid4

from pydantic import ValidationError

from app.core.config import settings
from app.core.errors import DomainError
from app.models.invoice import ExtractionEvidence, Invoice, InvoiceItem, now
from app.repositories.invoices import InvoiceRepository
from app.services.extraction.pdf import read_pdf
from app.services.extraction.provider import get_provider
from app.services.normalization.service import normalize
from app.services.validation.rules import validate
from app.services.workflow import audit, require_state, transition


class InvoiceService:
    def __init__(self, db):
        self.db = db
        self.repo = InvoiceRepository(db)

    def upload(self, filename, content_type, data, is_demo=False):
        if (
            not filename
            or Path(filename).suffix.lower() != ".pdf"
            or content_type not in ("application/pdf", "application/octet-stream")
        ):
            raise DomainError("Upload a PDF file with a .pdf extension.", 422)
        if len(data) > settings.max_upload_bytes:
            raise DomainError("PDF exceeds the 10 MB size limit.", 413)
        read_pdf(data)
        settings.upload_dir.mkdir(parents=True, exist_ok=True)
        key = f"{uuid4()}.pdf"
        path = settings.upload_dir / key
        try:
            path.write_bytes(data)
            invoice = Invoice(
                owner_id=self.db.info.get("owner_id"),
                filename=Path(filename.replace("\\", "/")).name[:200],
                storage_key=key,
                is_demo=is_demo,
            )
            self.db.add(invoice)
            self.db.flush()
            audit(invoice, "UPLOADED", "Fictional sample uploaded" if is_demo else "PDF uploaded")
            self.db.commit()
            return invoice
        except Exception:
            self.db.rollback()
            path.unlink(missing_ok=True)
            raise

    def extract(self, identifier):
        invoice = self.repo.get(identifier)
        require_state(invoice, "UPLOADED")
        transition(invoice, "EXTRACTING", "Document extraction started")
        self.db.commit()
        start = perf_counter()
        try:
            text = read_pdf((settings.upload_dir / invoice.storage_key).read_bytes())
            if not text.strip():
                raise DomainError(
                    "No selectable text found. Scanned-image OCR is not supported.", 422
                )
            provider = get_provider()
            extracted = provider.extract(text)
            raw = extracted.model_dump(exclude={"confidence"})
            self.apply_data(invoice, normalize(raw))
            confidence = {c.field: c for c in extracted.confidence}
            invoice.evidence = [
                ExtractionEvidence(
                    field=field,
                    raw_value=str(value) if value is not None else None,
                    confidence=confidence[field].confidence if field in confidence else None,
                    uncertain=confidence[field].uncertain if field in confidence else True,
                    provider=provider.name,
                )
                for field, value in raw.items()
                if field != "items"
            ]
            invoice.processing_ms = round((perf_counter() - start) * 1000)
            invoice.last_error = None
            transition(
                invoice, "EXTRACTED", f"Text extracted and normalized with {provider.name} provider"
            )
            self.db.commit()
            return self.validate(identifier)
        except (DomainError, OSError, ValidationError) as exc:
            self.db.rollback()
            invoice = self.repo.get(identifier)
            message = (
                exc.message
                if isinstance(exc, DomainError)
                else "Document extraction failed or returned invalid data."
            )
            invoice.last_error = message
            transition(invoice, "UPLOADED", "Extraction failed; document may be retried")
            self.db.commit()
            raise DomainError(message, 422) from exc

    @staticmethod
    def apply_data(invoice, data):
        values = data.model_dump()
        items = values.pop("items")
        for key, value in values.items():
            setattr(invoice, key, value)
        invoice.items = [InvoiceItem(**item) for item in items]

    def edit(self, identifier, data):
        invoice = self.repo.get(identifier)
        require_state(invoice, "EXTRACTED", "REVIEW_REQUIRED", "VALIDATED")
        if invoice.version != data.version:
            raise DomainError("Invoice changed since it was opened. Refresh before saving.")
        self.apply_data(invoice, normalize(data.model_dump(exclude={"version"})))
        invoice.reviewed_at = now()
        invoice.validation_results = []
        transition(invoice, "EXTRACTED", "Human corrections saved; validation required")
        self.db.commit()
        return invoice

    def validate(self, identifier):
        invoice = self.repo.get(identifier)
        require_state(invoice, "EXTRACTED", "REVIEW_REQUIRED", "VALIDATED")
        invoice.validation_results = validate(invoice, self.repo.duplicate(invoice))
        issues = any(r.status != "PASS" for r in invoice.validation_results)
        transition(
            invoice, "REVIEW_REQUIRED" if issues else "VALIDATED", "Business validation completed"
        )
        self.db.commit()
        return invoice

    def approve(self, identifier):
        invoice = self.repo.get(identifier)
        require_state(invoice, "VALIDATED")
        self.validate(identifier)  # Re-check duplicates and current rules at approval.
        require_state(invoice, "VALIDATED")
        invoice.approved_at = now()
        transition(invoice, "APPROVED", "Human approval recorded")
        self.db.commit()
        return invoice
