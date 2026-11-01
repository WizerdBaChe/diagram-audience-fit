"""Run the pack's machine acceptance controls on a scratch copy of reference-impl.

Usage (from the pack root):  python -X utf8 verify/run_controls.py reference-impl <new-scratch-dir>

<new-scratch-dir> must not exist or must be empty; it is created, used and deleted.
Each control prints BOTH asserted values (correct build vs mutant), not only a verdict.
Covers spec A1, A2, A3, A4, A5, A7, A10, A11, A13, A14, A15, A16; A6 needs a browser, A8/A9/A12 are review items.
Evidence rung: 0 (example controls, each two-sided with both asserted values printed).
"""
import hashlib, re, shutil, subprocess, sys, pathlib

src, work = pathlib.Path(sys.argv[1]).resolve(), pathlib.Path(sys.argv[2]).resolve()
if work.exists() and any(work.iterdir()):
    sys.exit(f"refusing: {work} exists and is not empty (it would be deleted)")
if work == src or src in work.parents or work in src.parents:
    sys.exit(f"refusing: {work} overlaps the source {src}")

EX = "outputs/diagram-authoring"
F3 = f"{EX}/mfp-audit-f3.build.mjs"
OUT = f"{EX}/mfp-audit-f3.html"
OV = f"{EX}/mfp-audit-f3-owner-view-v3.html"
AFGATE = "tools/audience-fit-gate/afgate.py"

def fresh():
    if work.exists():
        shutil.rmtree(work)
    shutil.copytree(src, work)

def run(*args):
    p = subprocess.run(list(args), cwd=work, capture_output=True, text=True, encoding="utf-8", errors="replace")
    out = p.stdout + p.stderr
    for form in {str(work), work.as_posix()}:  # keep the scratch location out of transcripts
        out = out.replace(form, "<scratch>")
    return p.returncode, out

def sha(rel, n=12):
    f = work / rel
    return hashlib.sha256(f.read_bytes()).hexdigest()[:n] if f.exists() else "missing"

def mutate(rel, old, new):
    f = work / rel
    t = f.read_text(encoding="utf-8")
    assert old in t, f"mutation anchor not found in {rel}: {old!r}"
    f.write_text(t.replace(old, new, 1), encoding="utf-8")

def first_err(out):
    for line in out.splitlines():
        if re.search(r"Error|FAILED|unknown", line):
            return line.strip()[:150]
    return out.strip().splitlines()[-1][:150] if out.strip() else ""

def verdict(ok):
    return "ok" if ok else "FAIL"

# A2 regeneration as shipped (+ router stats of the audit page), then without the library
fresh()
for b in sorted((work / EX).glob("*.build.mjs")):
    rc, out = run("node", f"{EX}/{b.name}")
    print(f"A2 built {b.name} exit={rc}")
    for line in out.splitlines():
        if line.startswith("route stats"):
            print(f"   {line.strip()}")
for h in sorted((work / EX).glob("*.html")):
    print(f"   {sha(f'{EX}/{h.name}', 64)}  {h.name}")
shutil.rmtree(work / "tools/archdiag")
rc, out = run("node", F3)
print(f"A2 without tools/archdiag exit={rc}: {first_err(out)} -> {verdict(rc != 0)}")

# A1 determinism
fresh(); run("node", F3); a = sha(OUT); run("node", F3); b = sha(OUT)
mutate(F3, "t: '使用者'", "t: '使用者X'"); run("node", F3); c = sha(OUT)
print(f"A1 run1={a} run2={b} (must equal) | label-mutant={c} (must differ) -> {verdict(a == b != c)}")

# A3 dangling edge target
fresh(); rc0, _ = run("node", F3)
mutate(F3, "from: 'USR', to: 'APP'", "from: 'USR', to: 'NOPE'"); rc1, out = run("node", F3)
print(f"A3 valid exit={rc0} | dangling-to exit={rc1}: {first_err(out)} -> {verdict(rc0 == 0 and rc1 != 0)}")

# A4 actor
fresh(); mutate(F3, "t: '使用者', ev:", "t: '使用者', actor: 'human', ev:"); rc0, _ = run("node", F3)
fresh(); mutate(F3, "t: '使用者', ev:", "t: '使用者', actor: 'robot', ev:"); rc1, out = run("node", F3)
print(f"A4 actor=human exit={rc0} | actor=robot exit={rc1}: {first_err(out)} -> {verdict(rc0 == 0 and rc1 != 0)}")

# A5 marker closure: point an edge type at a marker id that DEFS does not define
fresh(); mutate("tools/archdiag/emit.mjs", "marker: 'mOpen' }", "marker: 'mOpenGone' }"); rc1, out = run("node", F3)
print(f"A5 shipped exit=0 (see A3) | edge type -> undefined marker exit={rc1}: {first_err(out)} -> {verdict(rc1 != 0)}")

# A7 contrast
fresh(); rc0, out0 = run("node", "tools/archdiag/tokens.mjs", "--check")
mutate("tools/archdiag/emit.mjs", "title: '#0f172a'", "title: '#dbeafe'"); rc1, _ = run("node", "tools/archdiag/tokens.mjs", "--check")
print(f"A7 shipped exit={rc0} ({out0.strip().splitlines()[-1]}) | title colour = fill colour exit={rc1} -> {verdict(rc0 == 0 and rc1 == 2)}")

# A10 afgate calibration
fresh(); rc0, out0 = run(sys.executable, "-X", "utf8", AFGATE, "--selftest")
cal = [l for l in out0.splitlines() if "calibration" in l]
nok = sum(l.lstrip().startswith("[ok") for l in out0.splitlines())
nbad = sum(l.lstrip().startswith("[") and not l.lstrip().startswith("[ok") for l in out0.splitlines())
print(f"A10 selftest exit={rc0} ok-lines={nok} other-lines={nbad}: {cal[-1].strip() if cal else out0.strip()[-150:]} "
      f"-> {verdict(rc0 == 0 and nok > 0 and nbad == 0)}")

# A11 voice on the shipped owner view, then with a file path injected into a reader paragraph
rc0, _ = run(sys.executable, "-X", "utf8", AFGATE, "voice", OV)
t = (work / OV).read_text(encoding="utf-8")
m = re.search(r"<p[ >][^>]*>|<p>", t)
assert m, "no <p> in owner view"
(work / OV).write_text(t[:m.end()] + "見 tools/archdiag/emit.mjs。" + t[m.end():], encoding="utf-8")
rc1, _ = run(sys.executable, "-X", "utf8", AFGATE, "voice", OV)
print(f"A11 shipped owner view exit={rc0} (1 = WARN only) | path-injected exit={rc1} -> {verdict(rc0 != 2 and rc1 == 2)}")

# A13 topology warnings: selftest, shipped page and build silent / one-column page and containment pill fire
TOPO = "tools/archdiag/topology.mjs"
fresh(); rcs, outs = run("node", TOPO, "--selftest")
cal = [l for l in outs.splitlines() if l.startswith("calibration")]
rc0, out0 = run("node", TOPO, OUT)
w0 = sum(l.startswith("WARN") for l in out0.splitlines())
rcb, outb = run("node", F3)
b0 = outb.count("topology WARN")
t = (work / OUT).read_text(encoding="utf-8")
t = re.sub(r'(<g class="node" data-id="[^"]*") data-x="\d+"( data-y="\d+") data-w="\d+"', r'\1 data-x="48"\2 data-w="160"', t)
(work / OUT).write_text(t, encoding="utf-8")
rc1, out1 = run("node", TOPO, OUT)
w1 = [l.split()[1] for l in out1.splitlines() if l.startswith("WARN")]
fresh(); mutate(F3, "pill: '操作'", "pill: '包含'"); _, outp = run("node", F3)
bp = outp.count("topology WARN contain-edge")
print(f"A13 selftest exit={rcs} ({cal[-1] if cal else '?'}) | shipped page exit={rc0} WARN={w0}, build WARN={b0} | "
      f"one-column page exit={rc1} WARN={len(w1)} single-line={w1.count('single-line')} | pill->包含 contain-edge={bp} "
      f"-> {verdict(rcs == 0 and rc0 == 0 and w0 == 0 and b0 == 0 and rc1 == 1 and w1.count('single-line') > 0 and bp > 0)}")

# A14 layout warnings (layout.mjs): WARN only, page bytes untouched; the router revision moves the count
fresh(); rc0, out0 = run("node", F3); l0 = out0.count("layout WARN"); s0 = sha(OUT)
mutate(F3, "{ grid: 8, rev: 1 }", "{ grid: 8, rev: 2 }"); rc1, out1 = run("node", F3); l1 = out1.count("layout WARN"); s1 = sha(OUT)
print(f"A14 rev1 exit={rc0} layout WARN={l0} sha={s0} | rev2 exit={rc1} layout WARN={l1} sha={s1} "
      f"-> {verdict(rc0 == 0 and l0 > 0 and rc1 == 0 and l1 != l0 and s0 != s1)}")

# A15 archview envelope and evidence-anchor self-tests (two-sided inside each module)
fresh(); res = []
for m in ("envelope", "anchors"):
    rc, out = run("node", f"tools/archdiag/{m}.mjs", "--selftest")
    res.append((m, rc, out.strip().splitlines()[-1] if out.strip() else ""))
print("A15 " + " | ".join(f"{m} exit={rc}: {last}" for m, rc, last in res) + f" -> {verdict(all(rc == 0 for _, rc, _ in res))}")

# A16 flowchart kinds + line hops: selftest, then the audit page with hops (default) vs pinned plain crossings
fresh(); rcf, outf = run("node", "tools/archdiag/flow-selftest.mjs")
nok = sum(l.startswith("ok") for l in outf.splitlines())
rc0, out0 = run("node", F3); h0 = out0.count("layout WARN L7"); s0 = sha(OUT)
mutate(F3, "build({", "build({ crossingStyle: 'plain',"); rc1, out1 = run("node", F3); h1 = out1.count("layout WARN L7"); s1 = sha(OUT)
print(f"A16 flow-selftest exit={rcf} ok-cases={nok} | hops (shipped) exit={rc0} bare-crossing={h0} sha={s0} | "
      f"plain pin exit={rc1} bare-crossing={h1} sha={s1} -> {verdict(rcf == 0 and rc0 == 0 and h0 == 0 and rc1 == 0 and h1 > 0 and s0 != s1)}")
shutil.rmtree(work)
