from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

Money = Annotated[Decimal, Field(max_digits=18, decimal_places=4, allow_inf_nan=False)]
Text = Annotated[str, Field(max_length=300)]


class ItemData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    description: Text | None = None
    quantity: Money | None = None
    unit_price: Money | None = None
    tax_rate: Money | None = None
    total: Money | None = None


class InvoiceData(BaseModel):
    model_config = ConfigDict(extra="forbid")
    invoice_number: Text | None = None
    invoice_date: Text | None = None
    supplier_name: Text | None = None
    supplier_tax_number: Text | None = None
    customer_name: Text | None = None
    customer_tax_number: Text | None = None
    currency: Text | None = None
    subtotal: Money | None = None
    tax_amount: Money | None = None
    total_amount: Money | None = None
    items: list[ItemData] = Field(default_factory=list, max_length=500)


class EditInvoice(InvoiceData):
    version: int = Field(ge=1)


class Simulation(BaseModel):
    scenario: Literal["SUCCESS", "401", "400", "500", "TIMEOUT"] = "SUCCESS"


class SampleRequest(BaseModel):
    scenario: Literal["clean", "review", "invalid"]
