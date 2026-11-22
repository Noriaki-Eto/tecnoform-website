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

    # Fail if HTML cards or summary labels drift from the frozen 9-ward data.
    card_pat = (r'<article class="row" data-order="(\d+)" data-other="(-?\d+)" '
                r'data-pop="(-?\d+)" data-share="([\d.]+)" data-single="(-?\d+)">'
                r'(.+?)</article>')
    cards = re.findall(card_pat, html, re.S)
    require(len(cards) == 9, "visible ward-card count invalid")
    fields = [
        ("single_person_delta", "1人世帯"),
        ("other_households_delta", "2人以上"),
        ("population_delta", "人口"),
    ]
    for index, (order, other, pop, share, single, markup) in enumerate(cards):
        row = rows[index]
        require(int(order) == index, "visual ward order differs from CSV order")
        name = re.search(r'<div class="wardname">([^<]+)</div>', markup)
        require(name is not None and name.group(1) == row["ward"], "visible ward name mismatch")
        for displayed, field in [(other, "other_households_delta"),
                                 (pop, "population_delta"),
                                 (share, "single_person_share_delta_pp"),
                                 (single, "single_person_delta")]:
            require(float(displayed) == float(row[field]), row["ward"]+": sort data mismatch")
        visible = re.findall(
            r'<div class="v (plus|minus)">([+-][\d,]+)<small>([^<]+)</small></div>',
            markup)
        require(len(visible) == 3, row["ward"]+": visible metrics missing")
        for (css, value, label), (field, expected_label) in zip(visible, fields):
            actual = int(value.replace(",", ""))
            require(actual == int(row[field]) and label == expected_label and
                    css == ("plus" if actual >= 0 else "minus"),
                    row["ward"]+": visible metric mismatch: "+field)
        percent = re.search(
            r'<div class="share">1人世帯比率 <strong>([+-][\d.]+)pt</strong>',
            markup)
        require(percent is not None and
                abs(float(percent.group(1)) - float(row["single_person_share_delta_pp"])) < 0.0051,
                row["ward"]+": visible share label mismatch")

    summary = re.findall(
        r'<div class="summary"><div class="label">([^<]+)</div>'
        r'<div class="big (plus|minus)">([−+][\d,]+)</div>', html)
    require(len(summary) == 4, "visible citywide summary count invalid")
    summary_fields = [
        ("登録人口の増減", "population_delta"),
        ("総世帯数の増減", "households_delta"),
        ("1人世帯の増減", "single_person_delta"),
        ("2人以上世帯の増減", "other_households_delta"),
    ]
    for (label, css, visual), (expected_label, field) in zip(summary, summary_fields):
        value = int(visual.replace("−", "-").replace(",", ""))
        require(label == expected_label and value == TOTALS[field] and
                css == ("plus" if value >= 0 else "minus"),
                "visible citywide summary differs from 9-ward total: "+field)

    # Match the front-page editorial highlight to the actual highest-ranked wards.
    # This covers the two prominent insights outside the 9 ward cards.
    # value-case highest-value claims: changes here must remain data-backed.
    case = re.search(r'<div class="value-grid">(.+?)</div>\s*<p class="value-caption">', html, re.S)
    require(case is not None, "value-case highlight section absent")
    number_top = max(rows, key=lambda r: int(r["single_person_delta"]))
    share_top = max(rows, key=lambda r: float(r["single_person_share_delta_pp"]))
    number_claim = re.search(
        r'1人世帯の増加数が最大</div><strong>([^<]+)</strong>'
        r'<div class="big [^"]+">(\+[\d,]+)\s*<span[^>]*>世帯</span>',
        case.group(1))
    share_claim = re.search(
        r'1人世帯の構成比上昇が最大</div><strong>([^<]+)</strong>'
        r'<div class="big [^"]+">(\+[\d.]+)\s*<span[^>]*>pt</span>',
        case.group(1))
    require(number_claim is not None and share_claim is not None,
            "highlighted comparisons missing or mislabelled")
    require(number_claim.group(1) == number_top["ward"] and
            int(number_claim.group(2).replace(",", "")) == int(number_top["single_person_delta"]),
            "largest single-person household gain claim differs from 9-ward data")
    require(share_claim.group(1) == share_top["ward"] and
            abs(float(share_claim.group(2)) - float(share_top["single_person_share_delta_pp"])) <= 0.0051,
            "largest single-person share increase claim differs from 9-ward data")

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
    require(csv_bytes == Path(path).with_name("KOBE_9_WARDS_2025_2026.csv").read_bytes(),
            "ZIP population CSV and standalone public CSV differ")
    require(dictionary == Path(path).with_name("KOBE_DATA_DICTIONARY_JP.csv").read_bytes(),
            "ZIP dictionary CSV and standalone public dictionary differ")
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
    # Prevent accidental release of the separately frozen R43 terrain sample or
    # private entry metadata. This is a known-marker safeguard, not a rights clearance.
    private_markers = (
        b"KOBE_GSI_THREE_TRANSECTS_SOURCE_R41.csv",
        b"longitude_deg,latitude_deg,sample_index,elevation_m",
        b"ENTRY_FIELDS_PRIVATE.json",
        b"canonical_R43/",
    )
    for label, payload in (("HTML", data), ("public population CSV", csv_bytes),
                           ("public dictionary", dictionary), ("public source note", source)):
        require(not any(marker in payload for marker in private_markers),
                "frozen private terrain or entry metadata marker in "+label)
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
