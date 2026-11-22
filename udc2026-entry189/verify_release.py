#!/usr/bin/env python3
"""Offline UDC189 release gate. No network, uploads, deployments or external packages.

Usage: python3 udc2026-entry189/verify_release.py udc2026-entry189/index.html
Exit 0 only when embedded CSV, public ZIP and 9-ward summary agree.
"""
import base64
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import sys
import zipfile

NAMES = {
    "KOBE_9_WARDS_2025_2026.csv",
    "KOBE_DATA_DICTIONARY_JP.csv",
    "SOURCE_AND_METHODS_JP.txt",
}
WARDS = {"東灘区", "灘区", "中央区", "兵庫区", "北区", "長田区", "須磨区", "垂水区", "西区"}
# Freeze of the 9-ward public population CSV, checked against 4 official CSV files.
EXPECTED_CSV_SHA256 = "a34ae3f6d293122e83548708f6aa09ff63e4b80cbf07ffe917d5a6bec44ec858"
TOTALS = {"population_delta": -5576, "households_delta": 5160,
          "single_person_delta": 8815, "other_households_delta": -3655}
HEADERS = [
    "ward", "jis_code", "registered_population_2025_09",
    "registered_population_2026_09", "population_delta", "households_2025_09",
    "households_2026_09", "households_delta",
    "single_person_households_2025_09", "single_person_households_2026_09",
    "single_person_delta", "single_person_share_2025_pct",
    "single_person_share_2026_pct", "single_person_share_delta_pp",
    "other_households_delta",
]


def verify(path):
    data = Path(path).read_bytes()
    html = data.decode("utf-8-sig")
    def require(ok, detail):
        if not ok:
            raise ValueError(detail)

    ward_match = re.search(r"const wardcsv=(\[.*?\]);const sort=", html, re.S)
    require(ward_match is not None, "wardcsv JSON is absent or changed")
    rows = json.loads(ward_match.group(1))
    require(len(rows) == 9 and {r["ward"] for r in rows} == WARDS, "ward coverage invalid")
    require(all(list(r) == HEADERS for r in rows), "15-column schema/order changed")
    require(len({r["jis_code"] for r in rows}) == 9, "duplicate ward JIS code")
    for r in rows:
        def num(k): return int(r[k])
        require(num("registered_population_2026_09")-num("registered_population_2025_09") == num("population_delta"), r["ward"]+": population delta")
        require(num("households_2026_09")-num("households_2025_09") == num("households_delta"), r["ward"]+": household delta")
        require(num("single_person_households_2026_09")-num("single_person_households_2025_09") == num("single_person_delta"), r["ward"]+": single delta")
        require(num("households_delta")-num("single_person_delta") == num("other_households_delta"), r["ward"]+": other delta")
    for key, value in TOTALS.items():
        require(sum(int(r[key]) for r in rows) == value, "total mismatch: "+key)

    anchor = re.search(r'<a\b[^>]*\bid="dataPack"[^>]*\bhref="data:application/zip;base64,([^\"]+)"', html, re.S)
    require(anchor is not None, "ZIP data link missing")
    raw_zip = base64.b64decode(anchor.group(1), validate=True)
    with zipfile.ZipFile(io.BytesIO(raw_zip)) as z:
        require(set(z.namelist()) == NAMES and len(z.namelist()) == 3, "ZIP file list changed or private data included")
        require(z.testzip() is None, "ZIP CRC mismatch")
        csv_bytes = z.read("KOBE_9_WARDS_2025_2026.csv")
        dictionary = z.read("KOBE_DATA_DICTIONARY_JP.csv")
        source = z.read("SOURCE_AND_METHODS_JP.txt")
    require(dictionary and source and "神戸市" in source.decode("utf-8-sig"), "source/dictionary missing")
    require(hashlib.sha256(csv_bytes).hexdigest() == EXPECTED_CSV_SHA256,
            "public CSV byte hash differs from the officially checked freeze")
    require(source == Path(path).with_name("SOURCE_AND_METHODS_JP.txt").read_bytes(),
            "ZIP source note and published standalone source note differ")
    require(not re.search(rb"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", dictionary + b"\n" + source),
            "email address found in ZIP supporting documents")
    header = list(rows[0])
    output = io.StringIO(newline="")
    writer = csv.writer(output, lineterminator="\r\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(header)
    writer.writerows([[str(r[k]) for k in header] for r in rows])
    expected_csv = b"\xef\xbb\xbf" + output.getvalue().encode("utf-8")
    require(csv_bytes == expected_csv, "ZIP CSV differs from HTML dataset or browser export contract")
    require("const content='\ufeff'+fields.join(',')+'\\r\\n'" in html and
            "+'\\r\\n';const blob=" in html, "browser CSV export CRLF contract changed; manual check required")
    require('id="csvW"' in html and 'id="sort"' in html, "download/sort controls missing")
    require(not re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", html), "email address in public page")
    return {"status": "PASS", "ward_count": 9, "column_count": len(HEADERS),
            "totals": TOTALS, "zip_members": sorted(NAMES),
            "html_sha256": hashlib.sha256(data).hexdigest(),
            "embedded_csv_sha256": hashlib.sha256(csv_bytes).hexdigest(),
            "zip_sha256": hashlib.sha256(raw_zip).hexdigest(),
            "limitation": "Static source check only; does not prove live HTTPS, browser clicks, licenses or official submission."}


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2:
            raise ValueError("provide path to index.html")
        print(json.dumps(verify(sys.argv[1]), ensure_ascii=False, indent=2))
    except (OSError, ValueError, KeyError, IndexError, zipfile.BadZipFile, json.JSONDecodeError) as e:
        print(json.dumps({"status": "FAIL", "error": str(e)}, ensure_ascii=False), file=sys.stderr)
        sys.exit(1)
