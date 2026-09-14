import pytest

from app.core.errors import DomainError
from app.models.invoice import Invoice
from app.services.workflow import transition


def test_guarded_workflow():
    invoice = Invoice(filename="x.pdf", storage_key="x", status="UPLOADED")
    with pytest.raises(DomainError):
        transition(invoice, "INTEGRATED", "")
    for state in [
        "EXTRACTING",
        "EXTRACTED",
        "VALIDATED",
        "APPROVED",
        "INTEGRATING",
        "INTEGRATION_FAILED",
        "INTEGRATING",
        "INTEGRATED",
    ]:
        transition(invoice, state, "test")
    with pytest.raises(DomainError):
        transition(invoice, "EXTRACTED", "")
    assert len(invoice.events) == 8
