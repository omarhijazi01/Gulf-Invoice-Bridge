"""Generate fictional, text-based PDFs used by the actual extraction pipeline."""

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

OUTPUT = Path(__file__).resolve().parents[1] / "sample-data" / "invoices"
SCENARIOS = {
    "clean": (
        "INV-SA-1042",
        "Najd Horizon Supplies LLC",
        "Rimal Operations LLC",
        "SAR",
        "310123456700003",
        "150.00",
        "1150.00",
    ),
    "review": (
        "INV-AE-2086",
        "Dune Harbor Trading LLC",
        "Oasis Systems LLC",
        "AED",
        "",
        "50.00",
        "1050.00",
    ),
    "invalid": (
        "INV-SA-1043",
        "Wadi Crest Services LLC",
        "Rimal Operations LLC",
        "SAR",
        "310987654300003",
        "150.00",
        "1200.00",
    ),
}


def generate():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    font_dir = Path("/usr/share/fonts/truetype/dejavu")
    pdfmetrics.registerFont(TTFont("InvoiceSans", str(font_dir / "DejaVuSans.ttf")))
    pdfmetrics.registerFont(
        TTFont("InvoiceBold", str(font_dir / "DejaVuSans-Bold.ttf"))
    )
    for name, (
        number,
        supplier,
        customer,
        currency,
        tax_id,
        tax,
        total,
    ) in SCENARIOS.items():
        pdf = canvas.Canvas(str(OUTPUT / f"{name}.pdf"), pagesize=(595, 842))
        pdf.setTitle(f"Fictional invoice - {name}")
        pdf.setFillColor(HexColor("#153d36"))
        pdf.rect(0, 720, 595, 122, fill=1, stroke=0)
        pdf.setFillColor(HexColor("#ffffff"))
        pdf.setFont("InvoiceBold", 25)
        pdf.drawString(44, 786, "INVOICE")
        pdf.setFont("InvoiceSans", 11)
        pdf.drawString(44, 755, "GULF INVOICE BRIDGE / FICTIONAL SAMPLE")
        pdf.setFillColor(HexColor("#253934"))
        lines = [
            f"Invoice Number: {number}",
            "Invoice Date: 2026-09-13",
            f"Supplier Name: {supplier}",
            f"Supplier Tax Number: {tax_id}",
            f"Customer Name: {customer}",
            "Customer Tax Number: 100987654300003",
            f"Currency: {currency}",
            "",
            "Line items: description | quantity | unit price | tax rate % | net total",
            f"Item: Operations support | 2 | 500.00 | {15 if currency == 'SAR' else 5} | 1000.00",
            "",
            "Subtotal: 1000.00",
            f"Tax Amount: {tax}",
            f"Total Amount: {total}",
        ]
        for i, line in enumerate(lines):
            pdf.setFont(
                "InvoiceBold" if line.startswith("Total Amount") else "InvoiceSans", 11
            )
            pdf.drawString(44, 677 - i * 30, line)
        pdf.setStrokeColor(HexColor("#dbe4df"))
        pdf.line(44, 160, 550, 160)
        pdf.setFont("InvoiceSans", 9)
        pdf.drawString(
            44,
            132,
            "Portfolio sample. No real customer or company data. Not a tax compliance document.",
        )
        pdf.drawString(
            44,
            112,
            "Review sample: enter fictional supplier tax number 100123456700003.",
        )
        pdf.save()


if __name__ == "__main__":
    generate()
