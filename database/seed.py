from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.generator import generate_seed_data


def main():
    parser = argparse.ArgumentParser(description="Generate synthetic InvoiceFlow AI data.")
    parser.add_argument("--starter", action="store_true", help="Generate the smaller starter dataset")
    parser.add_argument("--full", action="store_true", help="Generate the full dataset")
    args = parser.parse_args()
    starter = args.starter or not args.full
    data = generate_seed_data(starter=starter)
    root = Path(__file__).resolve().parent
    (root / "manifest.json").write_text(json.dumps({"seed": 20261022, **data}, indent=2), encoding="utf-8")
    print(json.dumps(data, indent=2))


if __name__ == "__main__":
    main()
