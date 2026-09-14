from io import BytesIO

from pypdf import PdfReader

from app.core.errors import DomainError


def read_pdf(data: bytes) -> str:
    if not data.startswith(b"%PDF-"):
        raise DomainError("File content is not a PDF.", 422)
    try:
        reader = PdfReader(BytesIO(data), strict=True)
        if reader.is_encrypted:
            raise DomainError("Password-protected PDFs are not supported.", 422)
        if not 1 <= len(reader.pages) <= 30:
            raise DomainError("PDF must contain between 1 and 30 pages.", 422)
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except DomainError:
        raise
    except Exception as exc:
        raise DomainError("PDF could not be read. Upload a valid, unencrypted PDF.", 422) from exc
    if len(text) > 100_000:
        raise DomainError("PDF text exceeds the 100,000 character limit.", 422)
    return text
