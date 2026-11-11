from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, Column, Date, DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Role(Base):
    __tablename__ = "roles"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    role_id = Column(String, ForeignKey("roles.id"))
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True)
    vendor_code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    status = Column(String, default="ACTIVE")
    tax_id = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    purchase_orders = relationship("PurchaseOrder", back_populates="vendor")
    goods_receipts = relationship("GoodsReceipt", back_populates="vendor")
    invoices = relationship("Invoice", back_populates="vendor")


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(String, primary_key=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    po_number = Column(String, unique=True, nullable=False)
    status = Column(String, default="OPEN")
    order_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="purchase_orders")
    lines = relationship("PurchaseOrderLine", back_populates="purchase_order")
    invoices = relationship("Invoice", back_populates="po")
    receipts = relationship("GoodsReceipt", back_populates="po")


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"
    id = Column(String, primary_key=True)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=False)
    line_number = Column(Integer, nullable=False)
    sku = Column(String, nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(18, 2), default=Decimal("0.00"))
    total_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    purchase_order = relationship("PurchaseOrder", back_populates="lines")


class GoodsReceipt(Base):
    __tablename__ = "goods_receipts"
    id = Column(String, primary_key=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=True)
    receipt_number = Column(String, unique=True, nullable=False)
    receipt_date = Column(Date, nullable=False)
    total_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="goods_receipts")
    po = relationship("PurchaseOrder", back_populates="receipts")
    lines = relationship("GoodsReceiptLine", back_populates="receipt")


class GoodsReceiptLine(Base):
    __tablename__ = "goods_receipt_lines"
    id = Column(String, primary_key=True)
    receipt_id = Column(String, ForeignKey("goods_receipts.id"), nullable=False)
    po_line_id = Column(String, nullable=True)
    sku = Column(String, nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(18, 2), default=Decimal("0.00"))
    total_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    receipt = relationship("GoodsReceipt", back_populates="lines")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(String, primary_key=True)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=False)
    po_id = Column(String, ForeignKey("purchase_orders.id"), nullable=True)
    invoice_number = Column(String, nullable=False)
    invoice_date = Column(Date, nullable=False)
    due_date = Column(Date, nullable=True)
    currency = Column(String, default="USD")
    subtotal = Column(Numeric(18, 2), default=Decimal("0.00"))
    tax_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    total = Column(Numeric(18, 2), default=Decimal("0.00"))
    status = Column(String, default="RECEIVED")
    payment_ready = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    vendor = relationship("Vendor", back_populates="invoices")
    po = relationship("PurchaseOrder", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice")
    exceptions = relationship("InvoiceException", back_populates="invoice")
    approvals = relationship("Approval", back_populates="invoice")
    payments = relationship("Payment", back_populates="invoice")


class InvoiceLine(Base):
    __tablename__ = "invoice_lines"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    po_line_id = Column(String, nullable=True)
    sku = Column(String, nullable=False)
    description = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(18, 2), default=Decimal("0.00"))
    tax_rate = Column(Numeric(18, 4), default=Decimal("0.00"))
    subtotal = Column(Numeric(18, 2), default=Decimal("0.00"))
    tax_amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    total = Column(Numeric(18, 2), default=Decimal("0.00"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="lines")


class InvoiceDocument(Base):
    __tablename__ = "invoice_documents"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=True)
    file_name = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    extracted_text = Column(Text)
    status = Column(String, default="UPLOADED")
    created_at = Column(DateTime, default=datetime.utcnow)


class InvoiceMatchResult(Base):
    __tablename__ = "invoice_match_results"
    id = Column(Integer, primary_key=True, autoincrement=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    match_status = Column(String, default="MATCHED")
    checks = Column(Text)
    exceptions = Column(Text)
    payment_ready = Column(Boolean, default=False)
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class InvoiceException(Base):
    __tablename__ = "invoice_exceptions"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    exception_type = Column(String, nullable=False)
    severity = Column(String, default="MEDIUM")
    description = Column(Text, nullable=False)
    expected_value = Column(Text)
    actual_value = Column(Text)
    assigned_analyst = Column(String)
    resolution_status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    invoice = relationship("Invoice", back_populates="exceptions")


class ExceptionResolution(Base):
    __tablename__ = "exception_resolutions"
    id = Column(String, primary_key=True)
    exception_id = Column(String, ForeignKey("invoice_exceptions.id"), nullable=False)
    resolved_by = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class InvoiceStatusEvent(Base):
    __tablename__ = "invoice_status_events"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    previous_state = Column(String)
    new_state = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)


class Approval(Base):
    __tablename__ = "approvals"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    approver = Column(String, nullable=False)
    decision = Column(String, default="APPROVED")
    status = Column(String, default="APPROVED")
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="approvals")


class ApprovalEvent(Base):
    __tablename__ = "approval_events"
    id = Column(String, primary_key=True)
    approval_id = Column(String, ForeignKey("approvals.id"), nullable=False)
    event_type = Column(String)
    details = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class InvoiceSubmission(Base):
    __tablename__ = "invoice_submissions"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    submitted_by = Column(String, nullable=False)
    submission_status = Column(String, default="SUBMITTED")
    created_at = Column(DateTime, default=datetime.utcnow)


class Payment(Base):
    __tablename__ = "payments"
    id = Column(String, primary_key=True)
    invoice_id = Column(String, ForeignKey("invoices.id"), nullable=False)
    payment_reference = Column(String, nullable=False)
    amount = Column(Numeric(18, 2), default=Decimal("0.00"))
    due_date = Column(Date, nullable=False)
    payment_status = Column(String, default="READY")
    created_at = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")


class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True)
    actor = Column(String, nullable=False)
    action = Column(String, nullable=False)
    entity = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    previous_state = Column(String)
    new_state = Column(String)
    reason = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
