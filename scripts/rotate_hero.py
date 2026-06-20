#!/usr/bin/env python3
"""Hero Rotation - Monthly hero slide rotation for atelier-tecnoform.com

毎月1回 GitHub Actions から呼び出され、index.html の Hero スライドを
カテゴリ別プールから選び直して書き換える。

書き換え対象は以下のマーカー間のみ：
    <!-- HERO_ROTATION_START -->
    ...
    <!-- HERO_ROTATION_END -->

マーカーが見つからない場合は何もしない（事故防止）。
"""
from __future__ import annotations

import json
import sys
from datetime import date, datetime, timezone, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POOL_PATH = ROOT / "data" / "hero-pool.json"
HTML_PATH = ROOT / "index.html"
IMAGES_DIR = ROOT / "images"

MARKER_START = "<!-- HERO_ROTATION_START -->"
MARKER_END = "<!-- HERO_ROTATION_END -->"

EPOCH_DEFAULT = date(2026, 1, 1)


def jst_today() -> date:
    """JSTの今日を返す（GitHub Actions は UTC で動くため）"""
    jst = timezone(timedelta(hours=9))
    return datetime.now(jst).date()


def months_since(epoch: date, today: date) -> int:
    return (today.year - epoch.year) * 12 + (today.month - epoch.month)


def parse_epoch(pool: dict) -> date:
    raw = pool.get("_epoch", "2026-01-01")
    return datetime.strptime(raw, "%Y-%m-%d").date()


def pick_images(pool: dict, offset: int) -> list[dict]:
    picks = []
    for slot in pool["slots"]:
        imgs = slot.get("images", [])
        if not imgs:
            print(f"  ! WARN: slot '{slot['name']}' has no images, skipping",
                  file=sys.stderr)
            continue
        idx = offset % len(imgs)
        picks.append({
            "slot": slot["name"],
            "category": slot.get("category", ""),
            "image": imgs[idx],
            "index": idx,
            "total": len(imgs),
        })
    return picks


def verify_images_exist(picks: list[dict]) -> list[str]:
    """images/ に実在するか確認。存在しないものを返す。"""
    missing = []
    if not IMAGES_DIR.is_dir():
        # images/ が無いケース（ローカル実行など）はスキップ
        return missing
    for p in picks:
        if not (IMAGES_DIR / p["image"]).is_file():
            missing.append(p["image"])
    return missing


def build_slides_block(picks: list[dict]) -> str:
    """marker内に挿入する HTML を生成。インデント維持。"""
    lines = ['  <div class="hero-bg-slides">']
    for i, p in enumerate(picks):
        cls = "hero-bg-slide active" if i == 0 else "hero-bg-slide"
        lines.append(
            f'    <div class="{cls}" '
            f"style=\"background-image: url('images/{p['image']}');\"></div>"
        )
    lines.append('  </div>')
    return "\n".join(lines)


def replace_between_markers(html: str, new_block: str) -> str:
    start = html.find(MARKER_START)
    end = html.find(MARKER_END)
    if start < 0 or end < 0 or end <= start:
        raise RuntimeError(
            f"Markers not found in {HTML_PATH}. "
            f"index.html に {MARKER_START} と {MARKER_END} を入れてください。"
        )
    # マーカーは保持。間だけ置換。
    before = html[: start + len(MARKER_START)]
    after = html[end:]
    return f"{before}\n{new_block}\n  {after}"


def main() -> int:
    if not POOL_PATH.is_file():
        print(f"ERROR: pool not found: {POOL_PATH}", file=sys.stderr)
        return 2
    if not HTML_PATH.is_file():
        print(f"ERROR: index.html not found: {HTML_PATH}", file=sys.stderr)
        return 2

    pool = json.loads(POOL_PATH.read_text(encoding="utf-8"))
    epoch = parse_epoch(pool)
    today = jst_today()
    offset = months_since(epoch, today)

    print(f"# Hero Rotation")
    print(f"Date (JST): {today.isoformat()}")
    print(f"Epoch     : {epoch.isoformat()}")
    print(f"Offset    : {offset} months")
    print()

    picks = pick_images(pool, offset)
    if not picks:
        print("ERROR: no picks (all slots empty)", file=sys.stderr)
        return 3

    print("Selected slides:")
    for p in picks:
        print(f"  - [{p['slot']:20s}] {p['image']}  "
              f"({p['index']+1}/{p['total']})")
    print()

    missing = verify_images_exist(picks)
    if missing:
        print("ERROR: missing image files:", file=sys.stderr)
        for m in missing:
            print(f"  - images/{m}", file=sys.stderr)
        return 4

    html = HTML_PATH.read_text(encoding="utf-8")
    new_block = build_slides_block(picks)
    new_html = replace_between_markers(html, new_block)

    if new_html == html:
        print("No changes (already up to date).")
        return 0

    HTML_PATH.write_text(new_html, encoding="utf-8")
    print(f"Updated: {HTML_PATH}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
