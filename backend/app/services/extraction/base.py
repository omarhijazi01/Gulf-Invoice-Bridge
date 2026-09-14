from abc import ABC, abstractmethod

from pydantic import BaseModel, ConfigDict, Field


class RawItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: str | None
    quantity: str | None
    unit_price: str | None
    tax_rate: str | None
    total: str | None


class FieldConfidence(BaseModel):
    model_config = ConfigDict(extra="forbid")
    field: str
    confidence: int | None = Field(ge=0, le=100)
    uncertain: bool


class ExtractionResult(BaseModel):
    model_config = ConfigDict(extra="forbid")
    invoice_number: str | None
    invoice_date: str | None
    supplier_name: str | None
    supplier_tax_number: str | None
    customer_name: str | None
    customer_tax_number: str | None
    currency: str | None
    subtotal: str | None
    tax_amount: str | None
    total_amount: str | None
    items: list[RawItem]
    confidence: list[FieldConfidence]


class InvoiceExtractionService(ABC):
    name: str

    @abstractmethod
    def extract(self, text: str) -> ExtractionResult:
        raise NotImplementedError
