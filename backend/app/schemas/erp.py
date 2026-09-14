from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.invoice import ItemData


class Party(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=300)
    tax_number: str | None


class ERPPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")
    document_type: Literal["invoice"] = "invoice"
    source_id: str
    invoice_number: str
    invoice_date: date
    supplier: Party
    customer: Party
    currency: Literal["SAR", "AED"]
    subtotal: Decimal = Field(ge=0, allow_inf_nan=False)
    tax: Decimal = Field(ge=0, allow_inf_nan=False)
    total: Decimal = Field(ge=0, allow_inf_nan=False)
    items: list[ItemData] = Field(min_length=1)


class ERPReceipt(BaseModel):
    status: Literal["SUCCESS"]
    reference: str = Field(pattern=r"^ERP-\d{4}-\d{5,}$")
    timestamp: str
    processing_time: int = Field(ge=0)
