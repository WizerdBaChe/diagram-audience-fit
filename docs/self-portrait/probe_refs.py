"""Step 0 source probe for the self-portrait: who references whom inside reference-impl/.

    python -X utf8 docs/self-portrait/probe_refs.py            # from the repo root

Reads every shipped text file under reference-impl/ and records each reference to another
shipped file (any type, pages and images included): JS/Python imports, path citations in
Markdown/code (skills/..., tools/..., rules/..., references/..., outputs/...; Windows-style and
skill-relative ones too), and, inside skills/, mentions of another skill by name.
Output: docs/self-portrait/refs.json, one row per (source file, target, kind) with every line
number, the first line outside YAML frontmatter (`line`), and the count. The diagram's edges cite
these rows; nothing in the diagram comes from the folder layout alone.

What a row is NOT: a name row is a mention, including "NOT for ... (-> x)" routing lines, so it
proves the two files talk about each other, not that one calls the other. Citations the probe
cannot bind to a shipped file (other skills, rules, records, and placeholders such as tools/x.py
or truncated tokens) are counted in `unbound_citations`, never drawn.
Stdlib only. Junctions and symlinks are never entered or read; any found is listed in `links`.
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
IMPORT_PY = re.compile(r"^\s*(?:from\s+(\.*[A-Za-z_][\w.]*|\.+)\s+import|import\s+([A-Za-z_][\w.]*))", re.M)
CITE = re.compile(r"(?<![\w/.-])((?:~/\.claude/)?(?:skills|tools|rules|references|outputs)/[\w./-]+)")
SKILLS = ("diagram-authoring", "audience-fit", "ux-walkthrough", "product-design-thinking")
NAME = re.compile(r"(?<![\w/-])(" + "|".join(SKILLS) + r")(?![\w-])")
REPARSE = 0x400  # FILE_ATTRIBUTE_REPARSE_POINT: os.walk(followlinks=False) still enters NTFS junctions


def is_link(p: str) -> bool:
    st = os.lstat(p)
    return os.path.islink(p) or bool(getattr(st, "st_file_attributes", 0) & REPARSE)


def walk() -> tuple[list[Path], list[str]]:
    out, links = [], []
    for d, dirs, names in os.walk(ROOT, followlinks=False):
        keep = []
        for x in dirs:
            p = os.path.join(d, x)
            (links.append(f"reparse-point {Path(p).relative_to(ROOT).as_posix()} -> {os.path.realpath(p)}")
             if is_link(p) else keep.append(x))
        dirs[:] = keep
        for n in names:
            p = os.path.join(d, n)
            if is_link(p):
                links.append(f"reparse-point {Path(p).relative_to(ROOT).as_posix()} -> {os.path.realpath(p)}")
            else:
                out.append(Path(p))
    return sorted(out), links


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


def frontmatter_end(text: str) -> int:
    """Last line number of a leading YAML frontmatter block, 0 if none."""
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return 0
    for i, l in enumerate(lines[1:], start=2):
        if l.strip() == "---":
            return i
    return 0


def main() -> None:
    every, links = walk()
    shipped = {f.relative_to(ROOT).as_posix() for f in every}
    fl = [f for f in every if f.suffix in TEXT]
    rows: dict[tuple[str, str, str], dict] = {}
    unbound: dict[str, int] = {}
    for f in fl:
        rel = f.relative_to(ROOT).as_posix()
        text = f.read_text(encoding="utf-8", errors="replace")
        fm = frontmatter_end(text) if f.suffix == ".md" else 0
        hits = []
        if f.suffix in {".mjs", ".js"}:
            for m in IMPORT_JS.finditer(text):
                try:
                    tgt = (f.parent / m.group(1)).resolve().relative_to(ROOT.resolve()).as_posix()
                except ValueError:  # an import that leaves reference-impl/
                    continue
                if tgt in shipped:
                    hits.append(("import", tgt, m.start()))
        if f.suffix == ".py":
            for m in IMPORT_PY.finditer(text):
                mod = (m.group(1) or m.group(2) or "").lstrip(".").split(".")[0]
                if not mod:
                    continue
                for c in (f.parent / f"{mod}.py", f.parent / "vendor" / f"{mod}.py"):
                    c = c.relative_to(ROOT).as_posix()
                    if c in shipped and c != rel:
                        hits.append(("import", c, m.start()))
        slashed = text.replace("\\", "/")  # Windows-style citations (tools\x\y.py) are paths too
        for m in CITE.finditer(slashed):
            tgt = resolve_cite(m.group(1), shipped, rel)
            if tgt is None:
                key = m.group(1).removeprefix("~/.claude/").rstrip(".,;:)`'\"")
                unbound[key] = unbound.get(key, 0) + 1
            elif tgt != rel:
                hits.append(("cite", tgt, m.start()))
        if rel.startswith("skills/"):  # skills hand work to each other by NAME, not by path
            own = rel.split("/")[1]
            for m in NAME.finditer(slashed):
                if m.group(1) != own:
                    hits.append(("name", f"skills/{m.group(1)}/", m.start()))
        for kind, tgt, pos in hits:
            line = text.count("\n", 0, pos) + 1
            r = rows.setdefault((rel, tgt, kind), {"src": rel, "dst": tgt, "kind": kind, "line": 0,
                                                    "lines": [], "in_frontmatter": [], "count": 0})
            r["count"] += 1
            r["lines"].append(line)
            if line <= fm:
                r["in_frontmatter"].append(line)
    for r in rows.values():
        body = [l for l in r["lines"] if l not in r["in_frontmatter"]]
        r["line"] = (body or r["lines"])[0]
    data = {
        "root": "reference-impl",
        "files": len(fl),
        "shipped_files": len(shipped),
        "links": links,
        "refs": sorted(rows.values(), key=lambda r: (r["src"], r["dst"], r["kind"])),
        "unbound_citations": dict(sorted(unbound.items())),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(fl)} text files of {len(shipped)} shipped, {len(rows)} references, "
          f"{len(unbound)} unbound citations, {len(links)} links skipped -> {OUT.name}")


if __name__ == "__main__":
    main()
