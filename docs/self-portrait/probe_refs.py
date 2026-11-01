"""Step 0 source probe for the self-portrait: who references whom inside reference-impl/.

    python -X utf8 docs/self-portrait/probe_refs.py            # from the repo root

Reads every shipped text file under reference-impl/ and records each reference to another
shipped file: JS/Python imports, and path citations in Markdown/code (skills/..., tools/...,
rules/..., references/..., outputs/...). Output: docs/self-portrait/refs.json, one row per
(source file, target file) with the first line number and the count. The diagram's edges cite
these rows; nothing in the diagram comes from the folder layout alone.
Stdlib only. Never follows links (reference-impl/ holds plain files).
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
ROOT = REPO / "reference-impl"
OUT = Path(__file__).with_name("refs.json")
TEXT = {".md", ".mjs", ".js", ".py", ".json", ".txt"}
IMPORT_JS = re.compile(r"""(?:from|import)\s*\(?\s*['"](\.{1,2}/[^'"]+)['"]""")
IMPORT_PY = re.compile(r"^\s*(?:from|import)\s+([A-Za-z_][\w.]*)", re.M)
CITE = re.compile(r"(?<![\w/.-])((?:~/\.claude/)?(?:skills|tools|rules|references|outputs)/[\w./-]+)")


def files() -> list[Path]:
    out = []
    for d, dirs, names in os.walk(ROOT, followlinks=False):
        dirs[:] = [x for x in dirs if not os.path.islink(os.path.join(d, x))]
        out += [Path(d) / n for n in names if Path(n).suffix in TEXT]
    return sorted(out)


SKILLS = ("diagram-authoring", "audience-fit", "ux-walkthrough", "product-design-thinking")
NAME = re.compile(r"(?<![\w/-])(" + "|".join(SKILLS) + r")(?![\w-])")


def resolve_cite(raw: str, shipped: set[str], src: str = "") -> str | None:
    p = raw.removeprefix("~/.claude/").rstrip(".,;:)`'\"")
    cands = [p]
    parts = src.split("/")
    if parts[0] == "skills" and len(parts) > 2:  # a skill cites its own references/ relative to itself
        cands.insert(0, f"skills/{parts[1]}/{p}")
    for cand in [c for x in cands for c in (x, x.rstrip("/"))]:
        if cand in shipped:
            return cand
        if any(s.startswith(cand.rstrip("/") + "/") for s in shipped):  # a folder citation
            return cand.rstrip("/") + "/"
    return None


def main() -> None:
    fl = files()
    shipped = {f.relative_to(ROOT).as_posix() for f in fl}
    rows: dict[tuple[str, str, str], dict] = {}
    unresolved: dict[str, int] = {}
    for f in fl:
        rel = f.relative_to(ROOT).as_posix()
        text = f.read_text(encoding="utf-8", errors="replace")
        hits = []
        if f.suffix in {".mjs", ".js"}:
            for m in IMPORT_JS.finditer(text):
                tgt = (f.parent / m.group(1)).resolve().relative_to(ROOT.resolve()).as_posix()
                hits.append(("import", tgt, m.start()))
        if f.suffix == ".py":
            for m in IMPORT_PY.finditer(text):
                mod = m.group(1).split(".")[0]
                cand = (f.parent / f"{mod}.py").relative_to(ROOT).as_posix()
                cand2 = (f.parent / "vendor" / f"{mod}.py").relative_to(ROOT).as_posix()
                for c in (cand, cand2):
                    if c in shipped and c != rel:
                        hits.append(("import", c, m.start()))
        cite_text = text.replace("\\", "/")  # Windows-style citations (tools\x\y.py) are citations too
        for m in CITE.finditer(cite_text):
            tgt = resolve_cite(m.group(1), shipped, rel)
            if tgt is None:
                key = m.group(1).removeprefix("~/.claude/").rstrip(".,;:)`'\"")
                unresolved[key] = unresolved.get(key, 0) + 1
            elif tgt != rel:
                hits.append(("cite", tgt, m.start()))
        if rel.startswith("skills/"):  # skills hand work to each other by NAME, not by path
            own = rel.split("/")[1]
            for m in NAME.finditer(text):
                if m.group(1) != own:
                    hits.append(("name", f"skills/{m.group(1)}/", m.start()))
        for kind, tgt, pos in hits:
            line = text.count("\n", 0, pos) + 1
            k = (rel, tgt, kind)
            if k not in rows:
                rows[k] = {"src": rel, "dst": tgt, "kind": kind, "line": line, "count": 0}
            rows[k]["count"] += 1
    data = {
        "root": "reference-impl",
        "files": len(fl),
        "refs": sorted(rows.values(), key=lambda r: (r["src"], r["dst"], r["kind"])),
        "unresolved_citations": dict(sorted(unresolved.items())),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(fl)} files, {len(rows)} references, {len(unresolved)} citations to unshipped paths -> {OUT.name}")


if __name__ == "__main__":
    main()
