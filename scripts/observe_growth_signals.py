#!/usr/bin/env python3
"""Growth Observation - 月次「現在地を観測する」自動化

data/inquiries-ledger.csv・data/relationships.json・サイト本体（*.html, sitemap.xml,
images/）を読み取り、機械的に確認できる signal のみを集計する。
「露出が足りているか」「利益が伸びているか」のような主観的判断はしない
（それは人間 + 次サイクルの仮説立案の仕事）。

出力:
  1. data/growth-experiments.json に type="observation" のサイクルを1件追記
  2. 人間が読めるMarkdownレポートを標準出力（GitHub Actions が PR 本文に使う）

失敗しても index.html 等の本体ファイルは一切書き換えない（事故防止）。
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import date, datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent.parent
LEDGER_PATH = ROOT / "data" / "inquiries-ledger.csv"
RELATIONSHIPS_PATH = ROOT / "data" / "relationships.json"
EXPERIMENTS_PATH = ROOT / "data" / "growth-experiments.json"
SITEMAP_PATH = ROOT / "sitemap.xml"
IMAGES_DIR = ROOT / "images"

LIVE_PAGES = ["index.html", "lotus.html", "tokushoho.html"]
MONTHLY_CAPACITY_UNITS = 20  # LINEUP_PLAN.md: 制作能力の上限（月産）
RELATIONSHIP_STALE_DAYS = 180  # 半年接点がなければ「再接点推奨」


def jst_today() -> date:
    jst = timezone(timedelta(hours=9))
    return datetime.now(jst).date()


def git_last_commit_date(relpath: str) -> str | None:
    try:
        out = subprocess.run(
            ["git", "log", "-1", "--format=%cs", "--", relpath],
            cwd=ROOT, capture_output=True, text=True, check=True,
        ).stdout.strip()
        return out or None
    except Exception:
        return None


def days_between(d1: date, d2: date) -> int:
    return abs((d1 - d2).days)


# ---------- 1. 引き合い台帳 (inquiries-ledger.csv) ----------

def observe_inquiries() -> dict:
    if not LEDGER_PATH.is_file():
        return {"present": False, "note": "台帳ファイルが存在しません"}

    lines = LEDGER_PATH.read_text(encoding="utf-8").splitlines()
    if len(lines) < 2:
        return {"present": True, "real_entries": 0, "note": "ヘッダーのみ、記入なし"}

    header = lines[0].split(",")
    rows = [l for l in lines[1:] if l.strip()]
    real_rows = [r for r in rows if "EXAMPLE-DO-NOT-USE" not in r]

    last_date = None
    for r in real_rows:
        cell = r.split(",")[0].strip()
        try:
            d = datetime.strptime(cell, "%Y-%m-%d").date()
            if last_date is None or d > last_date:
                last_date = d
        except ValueError:
            continue

    today = jst_today()
    days_since_last = days_between(today, last_date) if last_date else None

    return {
        "present": True,
        "columns": header,
        "real_entries": len(real_rows),
        "example_row_still_present": len(real_rows) != len(rows),
        "last_entry_date": last_date.isoformat() if last_date else None,
        "days_since_last_entry": days_since_last,
        "flag_stale": (days_since_last is None) or (days_since_last > 45),
    }


# ---------- 2. 関係先台帳 (relationships.json) ----------

def observe_relationships() -> dict:
    if not RELATIONSHIPS_PATH.is_file():
        return {"present": False, "note": "関係先ファイルが存在しません"}

    data = json.loads(RELATIONSHIPS_PATH.read_text(encoding="utf-8"))
    rels = data.get("relationships", [])
    today = jst_today()

    unrecorded = []
    stale = []
    for r in rels:
        lt = r.get("last_touchpoint")
        if not lt:
            unrecorded.append(r["id"])
            continue
        try:
            d = datetime.strptime(lt, "%Y-%m-%d").date()
            if days_between(today, d) > RELATIONSHIP_STALE_DAYS:
                stale.append(r["id"])
        except ValueError:
            unrecorded.append(r["id"])

    return {
        "present": True,
        "total_relationships": len(rels),
        "high_strength_count": sum(1 for r in rels if r.get("relationship_strength") == "high"),
        "last_touchpoint_unrecorded": unrecorded,
        "last_touchpoint_stale_180d": stale,
    }


# ---------- 3. サイトの実績数 vs 制作キャパシティ ----------

def observe_works_capacity() -> dict:
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    total = len(re.findall(r'"num":\s*"[^"]+"', html))
    coming = len(re.findall(r'"coming":\s*true', html))
    live = total - coming
    return {
        "published_works": live,
        "coming_soon": coming,
        "monthly_capacity_units": MONTHLY_CAPACITY_UNITS,
        "note": "capacityはSuiren等の受注生産ラインの上限（LINEUP_PLAN.md）。B2B案件と共有のボトルネック。",
    }


# ---------- 4. コンテンツ鮮度 ----------

def observe_freshness() -> dict:
    out = {}
    for page in LIVE_PAGES:
        out[page] = git_last_commit_date(page)
    return out


# ---------- 5. SEO meta の機械チェック（存在・文字数のみ） ----------

def observe_seo() -> dict:
    results = {}
    for page in LIVE_PAGES:
        path = ROOT / page
        if not path.is_file():
            results[page] = {"exists": False}
            continue
        html = path.read_text(encoding="utf-8")
        title_m = re.search(r"<title>(.*?)</title>", html, re.S)
        desc_m = re.search(r'name="description"\s+content="([^"]*)"', html)
        title = title_m.group(1).strip() if title_m else None
        desc = desc_m.group(1).strip() if desc_m else None
        results[page] = {
            "title": title,
            "title_len": len(title) if title else 0,
            "description_present": bool(desc),
            "description_len": len(desc) if desc else 0,
            "flag_missing_description": not bool(desc),
        }
    return results


# ---------- 6. 画像リンク切れチェック ----------

def observe_broken_images() -> dict:
    missing = {}
    pattern = re.compile(r"images/([A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png|webp|svg))", re.I)
    for page in LIVE_PAGES:
        path = ROOT / page
        if not path.is_file():
            continue
        html = path.read_text(encoding="utf-8")
        refs = set(pattern.findall(html))
        page_missing = [r for r in refs if not (ROOT / "images" / r).is_file()]
        if page_missing:
            missing[page] = sorted(page_missing)
    return {"broken_image_refs": missing, "flag": bool(missing)}


# ---------- 7. sitemap.xml の鮮度チェック ----------

def observe_sitemap() -> dict:
    if not SITEMAP_PATH.is_file():
        return {"present": False}
    xml = SITEMAP_PATH.read_text(encoding="utf-8")
    entries = re.findall(r"<loc>(.*?)</loc>.*?<lastmod>(.*?)</lastmod>", xml, re.S)
    stale = []
    for loc, lastmod in entries:
        path_part = urlparse(loc).path.lstrip("/")
        page = path_part or "index.html"
        commit_date = git_last_commit_date(page)
        if commit_date and commit_date > lastmod:
            stale.append({"page": page, "sitemap_lastmod": lastmod, "actual_last_commit": commit_date})
    return {"present": True, "entries": len(entries), "stale_vs_actual_commits": stale}


def build_report(signals: dict, today: date) -> str:
    inq = signals["inquiries"]
    rel = signals["relationships"]
    cap = signals["works_capacity"]
    seo = signals["seo"]
    img = signals["broken_images"]
    sm = signals["sitemap"]

    lines = []
    lines.append(f"# 📊 月次観測レポート（{today.isoformat()}）")
    lines.append("")
    lines.append("機械的に測れる signal のみを集計しています。良し悪しの判断・次の一手は"
                  "人間（または次サイクルの仮説立案）で行ってください。")
    lines.append("")

    lines.append("## 引き合い台帳（data/inquiries-ledger.csv）")
    if inq.get("present"):
        lines.append(f"- 記録件数: {inq['real_entries']} 件")
        lines.append(f"- 最終記入日: {inq.get('last_entry_date') or '（記録なし）'}")
        if inq.get("flag_stale"):
            lines.append("- ⚠️ 45日以上、新しい記入がありません。問い合わせがなかったのか、"
                          "記入し忘れているだけなのか、確認してください。")
        if inq.get("example_row_still_present"):
            lines.append("- ℹ️ 記入例の行がまだ残っています（実データ追加後に削除でOK）。")
    else:
        lines.append("- 台帳ファイルが見つかりません。")
    lines.append("")

    lines.append("## 関係先台帳（data/relationships.json）")
    if rel.get("present"):
        lines.append(f"- 登録件数: {rel['total_relationships']}（うち重要度high: {rel['high_strength_count']}）")
        if rel["last_touchpoint_unrecorded"]:
            lines.append(f"- 最終接点日が未記入: {', '.join(rel['last_touchpoint_unrecorded'])}")
        if rel["last_touchpoint_stale_180d"]:
            lines.append(f"- ⚠️ 半年以上、接点記録の更新がない: {', '.join(rel['last_touchpoint_stale_180d'])}")
    else:
        lines.append("- 関係先ファイルが見つかりません。")
    lines.append("")

    lines.append("## 実績数とキャパシティ")
    lines.append(f"- 公開実績: {cap['published_works']} 件 / Coming Soon: {cap['coming_soon']} 件")
    lines.append(f"- 受注生産ライン月産上限: {cap['monthly_capacity_units']} 点（B2B案件と共有）")
    lines.append("")

    lines.append("## SEO（機械チェックのみ・文面の質は未評価）")
    for page, v in seo.items():
        if not v.get("exists", True):
            lines.append(f"- {page}: ファイルなし")
            continue
        flag = " ⚠️ meta descriptionなし" if v.get("flag_missing_description") else ""
        lines.append(f"- {page}: title {v['title_len']}文字 / description {v['description_len']}文字{flag}")
    lines.append("")

    if img["flag"]:
        lines.append("## ⚠️ 画像リンク切れ")
        for page, refs in img["broken_image_refs"].items():
            lines.append(f"- {page}: {', '.join(refs)}")
        lines.append("")

    if sm.get("present") and sm["stale_vs_actual_commits"]:
        lines.append("## ⚠️ sitemap.xml の lastmod が実際の更新より古い")
        for s in sm["stale_vs_actual_commits"]:
            lines.append(f"- {s['page']}: sitemap={s['sitemap_lastmod']} / 実際の最終更新={s['actual_last_commit']}")
        lines.append("")

    lines.append("---")
    lines.append("次のサイクルの仮説立案は `growth-system/GROWTH_OS.md` の手順に沿って行ってください。")
    return "\n".join(lines)


def append_to_experiments_ledger(signals: dict, today: date, cycle_id: str) -> None:
    if EXPERIMENTS_PATH.is_file():
        data = json.loads(EXPERIMENTS_PATH.read_text(encoding="utf-8"))
    else:
        data = {"_comment": "自動化利益基盤の実験台帳。10ステップループの各サイクルを記録する。", "cycles": []}

    data["cycles"].append({
        "id": cycle_id,
        "date": today.isoformat(),
        "type": "observation",
        "generated_by": "scripts/observe_growth_signals.py",
        "signals": signals,
    })
    EXPERIMENTS_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def main() -> int:
    today = jst_today()
    signals = {
        "inquiries": observe_inquiries(),
        "relationships": observe_relationships(),
        "works_capacity": observe_works_capacity(),
        "content_freshness": observe_freshness(),
        "seo": observe_seo(),
        "broken_images": observe_broken_images(),
        "sitemap": observe_sitemap(),
    }
    cycle_id = f"{today.isoformat()}-observation"
    append_to_experiments_ledger(signals, today, cycle_id)
    print(build_report(signals, today))
    return 0


if __name__ == "__main__":
    sys.exit(main())
