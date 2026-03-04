import pdfplumber
import json
import re
import sys
import os

if len(sys.argv) < 3:
    print("Usage: python extract_data.py <input_pdf> <output_json>")
    sys.exit(1)

pdf_path = sys.argv[1]
output_path = sys.argv[2]

if not os.path.exists(pdf_path):
    print(f"Error: File not found: {pdf_path}")
    sys.exit(1)

EXPECTED_HEADERS = ["DATE", "SHARE_CODE", "ISSUER_NAME", "INVESTOR_NAME", "INVESTOR_TYPE",
                    "LOCAL_FOREIGN", "NATIONALITY", "DOMICILE", "HOLDINGS_SCRIPLESS",
                    "HOLDINGS_SCRIP", "TOTAL_HOLDING_SHARES", "PERCENTAGE"]

def parse_number(s):
    """Convert formatted number string like '3.200.142.830' to integer."""
    if not s or s.strip() == '':
        return 0
    s = s.strip().replace('.', '').replace(',', '.')
    try:
        return int(float(s))
    except ValueError:
        return 0

def parse_percentage(s):
    """Convert percentage string like '41,10' to float."""
    if not s or s.strip() == '':
        return 0.0
    s = s.strip().replace(',', '.')
    try:
        return float(s)
    except ValueError:
        return 0.0

all_records = []
seen = set()

print(f"Opening PDF: {pdf_path}")
with pdfplumber.open(pdf_path) as pdf:
    total_pages = len(pdf.pages)
    print(f"Total pages: {total_pages}")
    
    for page_num, page in enumerate(pdf.pages):
        if page_num == 0:
            # Skip cover letter page
            continue
        
        tables = page.extract_tables()
        if not tables:
            continue
        
        for table in tables:
            for row in table:
                if not row or len(row) < 12:
                    continue
                
                # Skip header rows
                if row[0] == "DATE" or row[1] == "SHARE_CODE":
                    continue
                
                # Skip empty rows
                if not row[1] or not row[1].strip():
                    continue
                
                share_code = (row[1] or '').strip()
                issuer_name = (row[2] or '').strip()
                investor_name = (row[3] or '').strip()
                
                # Create unique key to avoid duplicates
                key = f"{share_code}|{investor_name}"
                if key in seen:
                    continue
                seen.add(key)
                
                record = {
                    "date": (row[0] or '').strip(),
                    "share_code": share_code,
                    "issuer_name": issuer_name,
                    "investor_name": investor_name,
                    "investor_type": (row[4] or '').strip(),
                    "local_foreign": (row[5] or '').strip(),
                    "nationality": (row[6] or '').strip(),
                    "domicile": (row[7] or '').strip(),
                    "holdings_scripless": parse_number(row[8]),
                    "holdings_scrip": parse_number(row[9]),
                    "total_holding_shares": parse_number(row[10]),
                    "percentage": parse_percentage(row[11])
                }
                all_records.append(record)
        
        if (page_num + 1) % 10 == 0 or page_num == total_pages - 1:
            print(f"  Processed page {page_num + 1}/{total_pages} - {len(all_records)} records so far")

print(f"\nTotal records extracted: {len(all_records)}")

# Save to JSON
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(all_records, f, ensure_ascii=False, indent=2)

print(f"\nData saved to: {output_path}")

