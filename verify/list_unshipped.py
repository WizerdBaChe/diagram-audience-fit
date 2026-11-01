"""List origin-environment paths that shipped files mention but the pack does not contain.

Usage (from the pack root):  python -X utf8 verify/list_unshipped.py reference-impl
A path counts as shipped if it exists under reference-impl/, or relative to the citing file's
directory or one of its two parents (skill-relative references such as references/x.md or
../product-design-thinking/references/x.md).
"""
import collections, pathlib, re, sys

sys.stdout.reconfigure(newline="\n")  # LF output on every platform (the list is committed)
root = pathlib.Path(sys.argv[1])
pat = re.compile(r"(?:~/\.claude/)?((?:tools|skills|rules|references|ops|hooks|outputs|telemetry|drafts|interop)/[A-Za-z0-9_.\-/]+[A-Za-z0-9_\-])")
refs = collections.defaultdict(set)
for f in sorted(root.rglob("*")):
    if not f.is_file() or f.suffix == ".png":
        continue
    for m in pat.finditer(f.read_text(encoding="utf-8", errors="replace")):
        p = m.group(1).rstrip(".")
        bases = [root, f.parent, f.parent.parent, f.parent.parent.parent, root / "skills" / "product-design-thinking"]
        if any((d / p).exists() for d in bases):
            continue
        refs[p].add(f.relative_to(root).as_posix())

for p in sorted(refs):
    print(f"{p}\t<- {', '.join(sorted(refs[p]))}")
print(f"total: {len(refs)}")
