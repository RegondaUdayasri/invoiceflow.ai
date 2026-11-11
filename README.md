# InvoiceFlow AI

This project is a lightweight but functional Accounts Payable automation prototype implementing the required workflows for invoice intake, matching, exceptions, approvals, dashboard reporting, and seeded synthetic data.

## Features

- FastAPI backend with SQLite persistence.
- Deterministic synthetic data generation with a fixed seed.
- Invoice PDF extraction and manual review fallback.
- Three-way matching with explainable checks.
- Exception queue, approval and payment workflow.
- Executive dashboard and analytics.
- Demo authentication and audit logging.

## Backend setup

```bash
cd backend
python -m venv .venv
. .venv/Scripts/activate  # Windows PowerShell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Frontend setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Database generation commands
python -m pip install -r requirements.txt

```bash
cd database
python seed.py --starter
python seed.py --full
```

## Test command

```bash
cd backend
. .venv/Scripts/activate
pytest -q
```

## Default demo user

- Username: demo@invoiceflow.ai
- Role: Operations Analyst
