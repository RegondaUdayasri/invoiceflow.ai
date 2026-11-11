CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    vendor_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    tax_id TEXT,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    po_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'OPEN',
    order_date TEXT,
    total_amount NUMERIC(18,2),
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    po_id TEXT,
    invoice_number TEXT NOT NULL,
    invoice_date TEXT,
    due_date TEXT,
    currency TEXT,
    subtotal NUMERIC(18,2),
    tax_amount NUMERIC(18,2),
    total NUMERIC(18,2),
    status TEXT,
    payment_ready INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);

CREATE TABLE IF NOT EXISTS invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    po_line_id TEXT,
    sku TEXT,
    description TEXT,
    quantity INTEGER,
    unit_price NUMERIC(18,2),
    tax_rate NUMERIC(18,4),
    subtotal NUMERIC(18,2),
    tax_amount NUMERIC(18,2),
    total NUMERIC(18,2)
);

CREATE TABLE IF NOT EXISTS invoice_exceptions (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    vendor_id TEXT,
    exception_type TEXT,
    severity TEXT,
    description TEXT,
    expected_value TEXT,
    actual_value TEXT,
    assigned_analyst TEXT,
    resolution_status TEXT,
    created_at TEXT,
    resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS approvals (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    approver TEXT,
    decision TEXT,
    status TEXT,
    comments TEXT,
    created_at TEXT
);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    payment_reference TEXT,
    amount NUMERIC(18,2),
    due_date TEXT,
    payment_status TEXT,
    created_at TEXT
);
