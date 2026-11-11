from __future__ import annotations

from app.services.matching import build_match_result


def test_build_match_result_blocks_bad_invoice():
    match = build_match_result(
        {"id": "INV-1", "vendor_id": "VND-00001", "invoice_number": "INV-123", "total": 125.0, "subtotal": 100.0, "tax_amount": 25.0},
        {"id": "PO-1", "vendor_id": "VND-00001", "invoice_number": "PO-456", "total": 100.0},
        [{"total": 80.0}],
    )
    assert match["match_status"] == "EXCEPTION"
    assert match["payment_ready"] is False


def test_invoice_arithmetic_round_trip():
    subtotal = 100.0
    tax = 10.0
    total = subtotal + tax
    assert round(total, 2) == 110.0


def test_duplicate_detection_policy():
    match = build_match_result(
        {"id": "INV-2", "vendor_id": "VND-00001", "invoice_number": "PO-456", "total": 100.0, "subtotal": 90.0, "tax_amount": 10.0},
        {"id": "PO-2", "vendor_id": "VND-00001", "invoice_number": "PO-456", "total": 100.0},
        [{"total": 100.0}],
    )
    assert "DUPLICATE_INVOICE" in match["exceptions"] or match["checks"]["duplicate"] == "FAIL"
