"""Regenerate the README images from the shipped example pages.

Maintainer tool, not part of the capability: needs Python Playwright with Chromium
(`pip install playwright && playwright install chromium`) and ffmpeg on PATH for the GIF.

    python -X utf8 docs/assets/build_assets.py            # from the repo root

Inputs  : reference-impl/outputs/diagram-authoring/*.html (the shipped example pages)
Inputs also: docs/self-portrait/self-audit.html + self-owner-view.html (the hero pair)
Outputs : docs/assets/hero.zh-TW.png, hero.en.png, audit-tabs.gif, line-hop.png,
          flowchart.png, owner-view.png, pipeline.zh-TW.png + pipeline.en.png (from the SVGs; run
          node docs/assets/pipeline.build.mjs [--lang en] first; --only pipeline [--selftest] renders just them)
Output bytes are not claimed to be deterministic (browser font rendering); the pages are.
"""
from __future__ import annotations

import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parents[2]
PAGES = REPO / "reference-impl" / "outputs" / "diagram-authoring"
OUT = REPO / "docs" / "assets"

AUDIT = PAGES / "mfp-audit-f3.html"
OWNER = PAGES / "mfp-audit-f3-owner-view-v3.html"
FLOW = PAGES / "flowchart-notation-demo.html"
SELF_ENG = REPO / "docs" / "self-portrait" / "self-audit.html"
SELF_OWN = REPO / "docs" / "self-portrait" / "self-owner-view.html"

HERO_TEXT = {
    "zh-TW": {
        "lang": "zh-Hant",
        "title": "這個 repo 用自己的方法畫自己：一張給作者驗，一張給讀者看",
        "left": "① 工程版（diagram-authoring）",
        "left_sub": "20 條線各追到檔案與行號；39 處出處在固定版本上逐一核對過才出圖 · 附缺口報告",
        "right": "② 讀者版（audience-fit）",
        "right_sub": "同一份模型重畫成 8 個節點；五條發現全數保留、改寫成白話，讀者版檢查 0 FAIL",
        "arrow": "重畫，不加註",
    },
    "en": {
        "lang": "en",
        "title": "This repo drawn by its own method: one view to verify, one to read",
        "left": "① Engineering view (diagram-authoring)",
        "left_sub": "20 edges, each traced to a file and line; 39 citations resolved at a pinned commit before rendering · gap report attached",
        "right": "② Reader view (audience-fit)",
        "right_sub": "Same model redrawn as 8 nodes; all five findings kept, reworded in plain words; reader-edition gate 0 FAIL",
        "arrow": "redraw, don't annotate",
    },
}

HERO_HTML = """<!doctype html><html lang="{lang}"><meta charset="utf-8"><style>
:root{{--ink:#1f2328;--mute:#57606a;--line:#d0d7de;--bg:#ffffff;--accent:#0969da}}
*{{box-sizing:border-box;margin:0}}
body{{width:1600px;height:700px;background:var(--bg);color:var(--ink);
 font-family:"Segoe UI","Microsoft JhengHei","Noto Sans TC",sans-serif;padding:36px 40px}}
h1{{font-size:30px;font-weight:650;letter-spacing:.2px;margin-bottom:24px}}
.row{{display:grid;grid-template-columns:1fr 92px 1fr;gap:0;align-items:stretch;height:570px}}
.card{{border:1px solid var(--line);border-radius:12px;overflow:hidden;display:flex;flex-direction:column}}
.cap{{padding:12px 16px;border-bottom:1px solid var(--line);background:#f6f8fa}}
.cap b{{font-size:20px}} .cap span{{display:block;font-size:14.5px;color:var(--mute);margin-top:3px}}
.shot{{flex:1;min-height:0;background:#fff;display:flex;align-items:center;justify-content:center;padding:8px}}
.shot img{{max-width:100%;max-height:100%;object-fit:contain}}
.mid{{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--accent)}}
.mid svg{{width:60px;height:36px}} .mid small{{font-size:13px;text-align:center;line-height:1.3;color:var(--mute)}}
</style><body><h1>{title}</h1><div class="row">
<div class="card"><div class="cap"><b>{left}</b><span>{left_sub}</span></div>
<div class="shot"><img src="{audit_png}"></div></div>
<div class="mid"><svg viewBox="0 0 60 36"><path d="M2 18h48M38 6l14 12-14 12" fill="none"
 stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
<small>{arrow}</small></div>
<div class="card"><div class="cap"><b>{right}</b><span>{right_sub}</span></div>
<div class="shot"><img src="{owner_png}"></div></div>
</div></body></html>"""


def shot(browser, page_path: Path, dest: Path, clip=None, full=False, scale=2, before=None):
    pg = browser.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=scale)
    pg.goto(page_path.as_uri())
    pg.wait_for_timeout(700)
    if before:
        before(pg)
    pg.screenshot(path=str(dest), clip=clip, full_page=full)
    pg.close()


# from pipeline.build.mjs [--lang en]; each with the known-bad control: a role line too long for its node
PIPE = {"zh-TW": ("與原版成對交付</text>", "與原版成對交付並且再加長很多字</text>"),
        "en": ("shipped as a pair</text>", "shipped as a pair with a much longer role line</text>")}

# In-browser text fit (font metrics need the renderer that makes the PNG): every node text inside its
# node (a diamond's text inside the diamond), every chip text inside its chip, every group label clear
# of nodes, edges and chips. Returns a list of failures.
FIT_JS = """() => {
  const fail = [], box = (el) => el.getBBox(), inset = 4;
  const nodes = {}; document.querySelectorAll('[data-node]').forEach(n => nodes[n.dataset.node] = n);
  for (const t of document.querySelectorAll('[data-name],[data-role]')) {
    const id = t.dataset.name || t.dataset.role, n = nodes[id], b = box(t), r = box(n);
    if (n.tagName === 'path') {
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2, hw = r.width / 2, hh = r.height / 2;
      for (const [x, y] of [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]])
        if (Math.abs(x - cx) / hw + Math.abs(y - cy) / hh > 1) { fail.push(id + ': text leaves the diamond'); break; }
    } else {
      // a capsule's round ends are not usable width: keep text inside its straight run plus a quarter of each end
      const rx = Number(n.getAttribute('rx')) || 0, side = Math.max(inset, rx > 12 ? rx * 0.75 : inset);
      if (b.x < r.x + side || b.x + b.width > r.x + r.width - side || b.y < r.y || b.y + b.height > r.y + r.height)
        fail.push(id + ': text ' + Math.round(b.width) + 'px does not fit ' + Math.round(r.width - 2 * side) + 'px usable width');
    }
  }
  for (const g of document.querySelectorAll('[data-chip]')) {
    const [rect, ...rest] = g.children, r = box(rect);
    for (const t of rest) if (t.tagName === 'text') { const b = box(t);
      if (b.x < r.x + 2 || b.x + b.width > r.x + r.width - 2) fail.push(g.dataset.chip + ': chip text overflows'); }
  }
  const hit = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  for (const l of document.querySelectorAll('[data-label]')) {
    const b = box(l);
    for (const o of document.querySelectorAll('[data-node],[data-chip]')) if (hit(b, box(o))) fail.push(l.dataset.label + ' label touches ' + (o.dataset.node || o.dataset.chip));
    for (const e of document.querySelectorAll('[data-edge]')) {  // per segment: a path's bbox is not its ink
      const p = e.dataset.pts.split(' ').map(s => s.split(',').map(Number));
      for (let i = 1; i < p.length; i++) {
        const s = { x: Math.min(p[i-1][0], p[i][0]) - 2, y: Math.min(p[i-1][1], p[i][1]) - 2,
                    width: Math.abs(p[i][0] - p[i-1][0]) + 4, height: Math.abs(p[i][1] - p[i-1][1]) + 4 };
        if (hit(b, s)) { fail.push(l.dataset.label + ' label touches ' + e.dataset.edge); break; }
      }
    }
  }
  return fail;
}"""


def pipeline(browser, tmp: Path, selftest: bool = False) -> int:
    bad = 0
    for lang, (anchor, longer) in PIPE.items():
        svg = (OUT / f"pipeline.{lang}.svg").read_text(encoding="utf-8")
        cases = [(f"{lang} built", svg, True)]
        if selftest:
            assert svg.count(anchor) == 1, f"{lang}: control anchor not found once"
            cases.append((f"{lang} control: long role", svg.replace(anchor, longer), False))
        bad += _pipeline_cases(browser, tmp, lang, cases)
    return bad


def _pipeline_cases(browser, tmp: Path, lang: str, cases) -> int:
    bad = 0
    for name, text, expect_clean in cases:
        page_file = tmp / "pipeline.html"
        page_file.write_text(f"<!doctype html><meta charset=utf-8><body style='margin:0'>{text}</body>", encoding="utf-8")
        pg = browser.new_page(viewport={"width": 1800, "height": 700}, device_scale_factor=2)
        pg.goto(page_file.as_uri())
        pg.wait_for_timeout(300)
        fails = pg.evaluate(FIT_JS)
        if expect_clean:
            pg.locator("svg").screenshot(path=str(OUT / f"pipeline.{lang}.png"))
        pg.close()
        ok = (not fails) if expect_clean else bool(fails)
        print(f"{'ok' if ok else 'BAD'}  {name}: {len(fails)} text-fit FAIL" + "".join(f"\n  {f}" for f in fails))
        bad += not ok
    return bad


def build(tmp: Path) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as p:
        b = p.chromium.launch()
        # Hero = the self-portrait pair (this repo drawn by its own method). Diagram regions
        # measured on those pages at 1440 px viewport width.
        audit_png = tmp / "audit.png"
        shot(b, SELF_ENG, audit_png, clip={"x": 150, "y": 228, "width": 1140, "height": 646})
        owner_png = tmp / "owner.png"
        shot(b, SELF_OWN, owner_png, clip={"x": 140, "y": 300, "width": 1160, "height": 530})
        for key, t in HERO_TEXT.items():
            html = tmp / f"hero.{key}.html"
            html.write_text(HERO_HTML.format(audit_png=audit_png.as_uri(), owner_png=owner_png.as_uri(), **t),
                            encoding="utf-8")
            pg = b.new_page(viewport={"width": 1600, "height": 700}, device_scale_factor=1)
            pg.goto(html.as_uri())
            pg.wait_for_timeout(300)
            pg.screenshot(path=str(OUT / f"hero.{key}.png"))
            pg.close()

        shot(b, OWNER, OUT / "owner-view.png", full=True, scale=1)
        shot(b, FLOW, OUT / "flowchart.png", clip={"x": 340, "y": 170, "width": 760, "height": 680}, scale=1)
        # The one hop on the flowchart page sits where the 'no' branch crosses the dashed back-edge.
        shot(b, FLOW, OUT / "line-hop.png", clip={"x": 760, "y": 420, "width": 260, "height": 130}, scale=3)

        # Tab-cycling animation of the five audit views.
        frames = tmp / "frames"
        frames.mkdir()
        pg = b.new_page(viewport={"width": 1440, "height": 900}, device_scale_factor=1)
        pg.goto(AUDIT.as_uri())
        pg.wait_for_timeout(700)
        tabs = pg.locator("button").filter(has_not_text="PASS")
        n = min(tabs.count(), 5)
        for i in range(n):
            tabs.nth(i).click()
            pg.wait_for_timeout(500)
            pg.screenshot(path=str(frames / f"f{i:02d}.png"), clip={"x": 0, "y": 80, "width": 1440, "height": 800})
        pg.close()
        b.close()

    ffmpeg = shutil.which("ffmpeg")
    if not ffmpeg:
        print("ffmpeg not found: audit-tabs.gif skipped", file=sys.stderr)
        return
    vf = "fps=10,scale=960:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=96[p];[b][p]paletteuse=dither=none"
    subprocess.run([ffmpeg, "-y", "-loglevel", "error", "-framerate", "0.5", "-i", str(frames / "f%02d.png"),
                    "-vf", vf, "-loop", "0", str(OUT / "audit-tabs.gif")], check=True)


if __name__ == "__main__":
    if "--only" in sys.argv and sys.argv[sys.argv.index("--only") + 1] == "pipeline":
        # node docs/assets/pipeline.build.mjs first; --selftest adds the known-bad text-fit control
        with tempfile.TemporaryDirectory() as d, sync_playwright() as p:
            b = p.chromium.launch()
            code = pipeline(b, Path(d), selftest="--selftest" in sys.argv)
            b.close()
        sys.exit(2 if code else 0)
    with tempfile.TemporaryDirectory() as d:
        build(Path(d))
        with sync_playwright() as p:
            b = p.chromium.launch()
            pipeline(b, Path(d))
            b.close()
    for f in sorted(OUT.glob("*.*")):
        if f.suffix in {".png", ".gif"}:
            print(f"{f.name}\t{f.stat().st_size // 1024} KB")
