from __future__ import annotations

import json
from datetime import datetime, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any, Dict

from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import (
    Approval,
    AuditLog,
    GoodsReceipt,
    GoodsReceiptLine,
    Invoice,
    InvoiceException,
    InvoiceLine,
    InvoiceMatchResult,
    Payment,
    PurchaseOrder,
    PurchaseOrderLine,
    Vendor,
)
from app.database import Base

SEED = 20261022


def generate_seed_data(starter: bool = True) -> Dict[str, Any]:
    session = SessionLocal()
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        vendors = []
        for idx in range(1, 11 if starter else 31):
            vendor = Vendor(
                id=f"VND-{idx:05d}",
                vendor_code=f"V{idx:05d}",
                name=f"Vendor {idx}",
                status="ACTIVE" if idx % 5 else "INACTIVE",
                tax_id=f"TAX{idx:05d}",
            )
            session.add(vendor)
            vendors.append(vendor)
        session.commit()

        pos = []
        for idx in range(1, 25 if starter else 120):
            vendor = vendors[idx % len(vendors)]
            po = PurchaseOrder(
                id=f"PO-2026-{idx:06d}",
                vendor_id=vendor.id,
                po_number=f"PO-{idx:06d}",
                status="OPEN",
                order_date=(datetime(2026, 1, 1) + timedelta(days=idx * 3)).date(),
                total_amount=Decimal("0.00"),
            )
            session.add(po)
            session.flush()
            total = Decimal("0.00")
            for line_no in range(1, 4):
                unit = Decimal(str(20 + (idx * line_no) % 40))
                qty = 10 + line_no * 5
                line_total = Decimal(qty) * unit
                total += line_total
                session.add(PurchaseOrderLine(
                    id=f"POL-{po.id}-{line_no:02d}",
                    po_id=po.id,
                    line_number=line_no,
                    sku=f"SKU-{line_no}",
                    description=f"PO Item {line_no}",
                    quantity=qty,
                    unit_price=unit,
                    total_amount=line_total,
                ))
            po.total_amount = total
            pos.append(po)
        session.commit()

        receipts = []
        for idx in range(1, 20 if starter else 100):
            po = pos[idx % len(pos)]
            receipt = GoodsReceipt(
                id=f"GRN-2026-{idx:06d}",
                vendor_id=po.vendor_id,
                po_id=po.id,
                receipt_number=f"GRN-{idx:06d}",
                receipt_date=(datetime(2026, 1, 1) + timedelta(days=idx * 2)).date(),
                total_amount=Decimal("0.00"),
            )
            session.add(receipt)
            session.flush()
            total = Decimal("0.00")
            for line_no in range(1, 3):
                qty = 5 + idx % 20
                unit = Decimal(str(18 + line_no * 7))
                total += Decimal(qty) * unit
                session.add(GoodsReceiptLine(
                    id=f"GRL-{receipt.id}-{line_no:02d}",
                    receipt_id=receipt.id,
                    po_line_id=f"POL-{po.id}-{line_no:02d}",
                    sku=f"SKU-{line_no}",
                    description=f"Receipt Item {line_no}",
                    quantity=qty,
                    unit_price=unit,
                    total_amount=Decimal(qty) * unit,
                ))
            receipt.total_amount = total
            receipts.append(receipt)
        session.commit()

        invoices = []
        for idx in range(1, 30 if starter else 150):
            vendor = vendors[idx % len(vendors)]
            po = pos[idx % len(pos)]
            subtotal = Decimal(str(300 + idx * 25))
            tax = subtotal * Decimal("0.10")
            total = subtotal + tax
            invoice = Invoice(
                id=f"INV-{vendor.id}-{datetime.now().year}-{idx:06d}",
                vendor_id=vendor.id,
                po_id=po.id,
                invoice_number=f"INV-{idx:06d}",
                invoice_date=(datetime(2026,1,1) + timedelta(days=idx*2)).date(),
                due_date=(datetime(2026,1,1) + timedelta(days=idx*2+14)).date(),
                currency="USD",
                subtotal=subtotal,
                tax_amount=tax,
                total=total,
                status="MATCHED",
                payment_ready=False,
            )
            session.add(invoice)
            session.flush()
            for line_no in range(1, 3):
                qty = 5 + idx % 10
                unit = Decimal(str(30 + idx % 20))
                line_total = Decimal(qty) * unit
                session.add(InvoiceLine(
                    id=f"INVL-{invoice.id}-{line_no:02d}",
                    invoice_id=invoice.id,
                    po_line_id=f"POL-{po.id}-{line_no:02d}",
                    sku=f"SKU-{line_no}",
                    description=f"Billed Item {line_no}",
                    quantity=qty,
                    unit_price=unit,
                    tax_rate=Decimal("0.10"),
                    subtotal=line_total,
                    tax_amount=line_total * Decimal("0.10"),
                    total=line_total * Decimal("1.10"),
                ))
            invoices.append(invoice)
            session.add(InvoiceMatchResult(
                invoice_id=invoice.id,
                match_status="MATCHED",
                checks='{"vendor":"PASS","duplicate":"PASS","po":"PASS","quantity":"PASS","price":"PASS","tax":"PASS","arithmetic":"PASS"}',
                exceptions='[]',
                payment_ready=False,
                explanation="System validated the invoice against matching rules.",
            ))
        session.commit()

        for idx in range(1, 6):
            invoice = invoices[idx % len(invoices)]
            session.add(InvoiceException(
                id=f"EXC-{idx:05d}",
                invoice_id=invoice.id,
                vendor_id=invoice.vendor_id,
                exception_type="PRICE_VARIANCE",
                severity="MEDIUM",
                description="Invoice price exceeds PO tolerance.",
                expected_value="Within 1% tolerance",
                actual_value="Variation detected",
                assigned_analyst="Finance Analyst",
                resolution_status="OPEN",
            ))
        session.commit()

        for idx in range(1, 5):
            invoice = invoices[idx % len(invoices)]
            session.add(Approval(
                id=f"APR-{idx:05d}",
                invoice_id=invoice.id,
                approver="Approver Team",
                decision="APPROVED",
                status="APPROVED",
                comments="Approved based on matched evidence.",
            ))
            session.add(Payment(
                id=f"PYM-{idx:05d}",
                invoice_id=invoice.id,
                payment_reference=f"PMT-{idx:05d}",
                amount=invoice.total,
                due_date=invoice.due_date,
                payment_status="READY",
            ))
        session.commit()

        session.add(AuditLog(
            id="AUD-00001",
            actor="System",
            action="INITIALIZE",
            entity="DATABASE",
            entity_id="SYSTEM",
            previous_state="NEW",
            new_state="READY",
            reason="Database initialized for InvoiceFlow AI.",
        ))
        session.commit()

        data = {
            "seed": SEED,
            "starter": starter,
            "vendors": session.query(Vendor).count(),
            "purchase_orders": session.query(PurchaseOrder).count(),
            "purchase_order_lines": session.query(PurchaseOrderLine).count(),
            "goods_receipts": session.query(GoodsReceipt).count(),
            "goods_receipt_lines": session.query(GoodsReceiptLine).count(),
            "invoices": session.query(Invoice).count(),
            "invoice_lines": session.query(InvoiceLine).count(),
            "exceptions": session.query(InvoiceException).count(),
            "payments": session.query(Payment).count(),
            "approvals": session.query(Approval).count(),
            "generated_at": datetime.utcnow().isoformat(),
        }
        manifest_path = Path(__file__).resolve().parents[3] / "database" / "manifest.json"
        manifest_path.parent.mkdir(parents=True, exist_ok=True)
        manifest_path.write_text(json.dumps({"seed": SEED, "dataset_scale": "starter" if starter else "full", **data}, indent=2), encoding="utf-8")
        return data
    finally:
        session.close()
