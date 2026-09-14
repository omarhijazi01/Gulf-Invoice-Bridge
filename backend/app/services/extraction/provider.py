from app.core.config import settings
from app.core.errors import DomainError
from app.services.extraction.demo import DemoInvoiceExtractionService
from app.services.extraction.openai_provider import OpenAIInvoiceExtractionService


def get_provider():
    if settings.ai_provider == "demo":
        return DemoInvoiceExtractionService()
    if settings.ai_provider == "openai":
        return OpenAIInvoiceExtractionService()
    raise DomainError("Unknown AI_PROVIDER configuration.", 503)
