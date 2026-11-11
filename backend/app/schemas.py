from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class VendorCreate(BaseModel):
    name: str
    vendor_code: str
    status: str = "ACTIVE"
    tax_id: Optional[str] = None


class VendorOut(VendorCreate):
    id: str
    created_at: datetime
    updated_at: datetime


class InvoiceLineIn(BaseModel):
    description: str
    sku: str
    quantity: float
    unit_price: float
    tax_rate: float = 0.0
    tax_amount: float = 0.0
    subtotal: float = 0.0
    total: float = 0.0


class InvoiceUploadRequest(BaseModel):
    vendor_name: str
    invoice_number: str
    invoice_date: str
    due_date: Optional[str] = None
    po_number: Optional[str] = None
    currency: str = "USD"
    lines: List[InvoiceLineIn] = Field(default_factory=list)


class InvoiceExtractResult(BaseModel):
    document_name: str
    extracted: Dict[str, Any]
    confidence: float
    status: str = "EXTRACTED"


class InvoiceOut(BaseModel):
    id: str
    vendor_id: Optional[str]
    vendor_name: Optional[str]
    invoice_number: str
    invoice_date: str
    due_date: Optional[str]
    po_number: Optional[str]
    currency: str
    subtotal: float
    tax_amount: float
    total: float
    status: str
    payment_ready: bool = False
    created_at: datetime


class MatchResultOut(BaseModel):
    invoice_id: str
    match_status: str
    checks: Dict[str, str]
    exceptions: List[str]
    payment_ready: bool
    explained: str


class ExceptionOut(BaseModel):
    id: str
    invoice_id: str
    vendor: str
    exception_type: str
    severity: str
    description: str
    expected_value: str
    actual_value: str
    assigned_analyst: Optional[str]
    resolution_status: str
    created_at: datetime


class ApprovalOut(BaseModel):
    id: str
    invoice_id: str
    approver: str
    decision: str
    status: str
    comments: Optional[str]
    created_at: datetime


class PaymentOut(BaseModel):
    id: str
    invoice_id: str
    payment_reference: str
    amount: float
    due_date: str
    payment_status: str
    created_at: datetime


class DashboardSummary(BaseModel):
    total_invoices: int
    matched: int
    exceptions: int
    pending_approvals: int
    payment_ready: int
    total_invoice_value: float


class DemoLoginRequest(BaseModel):
    role: str = "Operations Analyst"
