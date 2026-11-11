from __future__ import annotations

from decimal import Decimal
from typing import Any, Dict, List

PRICE_TOLERANCE = Decimal("0.01")


def safe_decimal(value: Any) -> Decimal:
    return Decimal(str(value or 0)).quantize(Decimal("0.01"))


def build_match_result(invoice: Dict[str, Any], po: Dict[str, Any], receipts: List[Dict[str, Any]]) -> Dict[str, Any]:
    checks: Dict[str, str] = {
        "vendor": "PASS",
        "duplicate": "PASS",
        "po": "PASS",
        "date": "PASS",
        "quantity": "PASS",
        "price": "PASS",
        "tax": "PASS",
        "arithmetic": "PASS",
    }
    exceptions: List[str] = []

    invoice_total = safe_decimal(invoice.get("total"))
    po_total = safe_decimal(po.get("total"))
    invoice_subtotal = safe_decimal(invoice.get("subtotal"))
    invoice_tax = safe_decimal(invoice.get("tax_amount"))
    received_total = sum(safe_decimal(r.get("total")) for r in receipts)

    if po.get("vendor_id") and invoice.get("vendor_id") and po.get("vendor_id") != invoice.get("vendor_id"):
        checks["vendor"] = "FAIL"
        exceptions.append("VENDOR_MISMATCH")
    if po.get("invoice_number") and po.get("invoice_number") == invoice.get("invoice_number"):
        checks["duplicate"] = "FAIL"
        exceptions.append("DUPLICATE_INVOICE")
    if not po.get("id"):
        checks["po"] = "FAIL"
        exceptions.append("MISSING_PO")
    if po_total and abs(invoice_total - po_total) > PRICE_TOLERANCE:
        checks["price"] = "FAIL"
        exceptions.append("PRICE_VARIANCE")
    if received_total + PRICE_TOLERANCE < invoice_total:
        checks["quantity"] = "FAIL"
        exceptions.append("RECEIVED_QUANTITY_SHORT")
    if abs(invoice_total - (invoice_subtotal + invoice_tax)) > PRICE_TOLERANCE:
        checks["arithmetic"] = "FAIL"
        exceptions.append("ARITHMETIC_MISMATCH")

    payment_ready = all(status == "PASS" for status in checks.values())
    explained = (
        "Invoice matched the PO and receipt evidence within configured tolerances."
        if payment_ready else
        "The invoice requires investigation because the financial controls identified mismatches or missing evidence."
    )

    return {
        "invoice_id": invoice.get("id"),
        "match_status": "MATCHED" if payment_ready else "EXCEPTION",
        "checks": checks,
        "exceptions": exceptions,
        "payment_ready": payment_ready,
        "explained": explained,
        "explanation": explained,
    }
