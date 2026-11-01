#!/usr/bin/env python
"""afgate — the audience-fit skill's first instrument.

`skills/audience-fit` rules its companions in prose: invent nothing, let the
truth markers survive aggregation, keep the limitations in the main text, drop
the engineering voice. Every other mature skill here carries gates for its
rules; this one carried none, so a companion was accepted on the reader's
patience. Two of those rules are determinable, and this makes them so.

    voice   <companion>              the reader's text carries no builder artifact
    values  <original> <companion>   every number in the companion is accounted
                                     for by the original -- identity or a NAMED
                                     transform; an unaccounted number is invented
    limits  <original> <companion>   inventory of the original's limitation lines
                                     and which have no counterpart (REPORT only)
    scope   <companion> [<original>] lines with a universal quantifier (每篇 /
                                     一定 / 所有 / always); one the original lacks
                                     is WARN, never FAIL
    terms   <companion>              prose strings one edit away from a drawn
                                     node name (a second name for one thing); WARN
    sums    <companion>              合計/總計/total rows that differ from the
                                     sum of the rows above them; WARN
    style   <companion>              zh sentence mechanics: >50 chars, >2 的,
                                     進行X, stock phrases; WARN
    all     <original> <companion>   all seven
    --selftest                       two-sided calibration on built fixtures

Borrowed 2026-09-10 from an earlier research audience pack's gates (a
ParityGate and a record-number check). ParityGate
proper -- a copy equals its source once the allowed-to-differ fields are blanked
-- does NOT transfer: an audience-fit companion is a REWRITE, not a copy. What
transfers is its question, asked of the parts that must not change.

`values` is a SCREEN, not a proof, and says so in its own output: numbers
carrying 3+ significant digits are the certified set; 1-2 digit tokens are
counting words, thresholds and round figures whose false-accept rate is high,
and that rate is printed rather than hidden.
"""
import argparse
import html
import math
import re
import sys
import tempfile
from decimal import ROUND_HALF_UP, Decimal
from html.parser import HTMLParser
from pathlib import Path

if sys.version_info < (3, 10):  # `Path | None` annotations are evaluated at import; 3.12 is the tested version
    print(f"afgate needs Python 3.10 or newer (this is {sys.version.split()[0]})", file=sys.stderr)
    sys.exit(3)  # 3 = could not run; 2 is FAIL (README)

sys.path.insert(0, str(Path(__file__).resolve().parent / "vendor"))
# AssetVault term-match, vendored (sync). Its own `--selftest` needs term_cases.json,
# which lives only in the vault: drift is caught by AssetVault `consumers.py check`;
# this tool's selftest exercises longest-first, the edge bound and blocks.
from term_match import tokens  # noqa: E402

if __name__ == "__main__" and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # only as a program: an importer keeps its own encoding


class InputError(Exception):
    """The gate could not read its input; exit 3, never a verdict."""


def _read(path: Path) -> str:
    data = path.read_bytes()
    if b"\x00" in data:  # UTF-16 (PowerShell `>` / Out-File): decoded as UTF-8 it reads as noise and passes
        raise InputError(f"{path}: contains NUL bytes (UTF-16?); save it as UTF-8")
    return data.decode("utf-8-sig", errors="replace")


# ASCII word bounds: Python's \b treats CJK as a word character, so `\bPASS` misses 共7 PASS.
_B, _E = r"(?<![0-9A-Za-z_])", r"(?![0-9A-Za-z_])"

# ---------------------------------------------------------------- reader text
_SCRIPT = re.compile(r"<(script|style)\b.*?</\1>", re.S | re.I)
_COMMENT = re.compile(r"<!--.*?-->", re.S)
_TAG = re.compile(r"<[^>]+>")
_FENCE = re.compile(r"```.*?```", re.S)
_DATE = re.compile(_B + r"(\d{4})[-/](\d{1,2})[-/](\d{1,2})" + _E + r"|(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?")


# ． folds between any two digits (91．4 mixes widths); ， only between full-width ones,
# because between ASCII digits it is a list comma (100，200)
_FW_SEP = re.compile(r"(?<=[０-９])(，)(?=[０-９])|(?<=[0-9０-９])(．)(?=[0-9０-９])")
_FW_DIGITS = str.maketrans("０１２３４５６７８９－＋／", "0123456789-+/")


def fold_digits(text):
    """Full-width digits to ASCII (９１．４ -> 91.4, １，２３４ -> 1,234). Narrower than NFKC on
    purpose: NFKC also turns the list comma ， into ',' (100，200 read as 100200) and 10⁶ into 106."""
    text = _FW_SEP.sub(lambda m: "," if m.group(1) == "，" else ".", text)
    return text.translate(_FW_DIGITS)


def dates(text):
    """Calendar dates in `text`, normalised to (y, m, d|0), any of the two formats."""
    out = set()
    for m in _DATE.finditer(fold_digits(text)):
        g = m.groups()
        y, mo, d = (g[0], g[1], g[2]) if g[0] else (g[3], g[4], g[5] or "0")
        out.add((int(y), int(mo), int(d)))
    return out


def reader_text(path: Path) -> str:
    """What a human actually reads: no markup, no scripts, no code fences.

    An HTML page's class names, ids and data-* attributes are the builder's,
    not the reader's -- scanning them would flag every page ever built.
    """
    raw = _read(path)
    if path.suffix.lower() in (".html", ".htm", ".svg"):
        raw = _COMMENT.sub(" ", _SCRIPT.sub(" ", raw))
        raw = _TAG.sub(" ", raw)
        raw = html.unescape(raw)
    else:
        raw = _FENCE.sub(" ", raw)
    return raw


# ---------------------------------------------------------------- voice check
# Closed classes: nothing a non-builder reader can act on. FAIL.
# Every class uses ASCII bounds (_B/_E), never \b: next to CJK \b does not fire, so
# 共7 PASS, 依INV-17 and 輪run_9f3a11c2 were missed (outside review 2026-11-01).
CLOSED = [
    ("pass-count", re.compile(_B + r"\d+\s*(?:PASS|FAIL)(?:ED)?" + _E + "|" + _B + r"\d+\s*WARN" + _E
                              + "|" + _B + r"(?:PASS|FAIL)(?:ED)?\s*[:：]?\s*\d+" + _E),
     "a PASS count is not a credibility signal: it says the instrument ran, "
     "not that the claim is true"),
    ("path", re.compile(r"[A-Za-z]:\\[^\s　]{2,}|(?<![0-9A-Za-z_.])~?/[0-9A-Za-z_./-]{3,}\.[0-9A-Za-z]{1,5}" + _E
                        + r"|(?<![0-9A-Za-z_.-])(?:[A-Za-z0-9_-]{2,}(?:\.[A-Za-z0-9_-]+)*|[㐀-鿿]+)"
                        + r"\.(?:py|mjs|js|ts|json|ya?ml|toml|html|md|pptx|xlsx|csv)" + _E),
     "a file path is a builder's address; the reader has no shell"),
    # at least one hex letter so a plain 8+ digit number (tax id, phone) is not a hash; upper
    # case (Get-FileHash) needs a digit and a full digest length (32+), so AB12CD34 is not one.
    ("sha", re.compile(_B + r"(?=[0-9]*[a-f])[0-9a-f]{8,64}" + _E
                       + "|" + _B + r"(?=[0-9A-F]*[A-F])(?=[A-F]*[0-9])[0-9A-F]{32,64}" + _E),
     "a hash identifies a build, not a fact the reader can check"),
    ("run-id", re.compile(_B + r"RUN\s*=|" + _B + r"run[-_][0-9a-z]{4,}" + _E, re.I),
     "a run id belongs in the verify record, never on the reader's page"),
    # public standards (ISO-100, RFC-793, IEC-61000) share the shape and are not gate ids
    ("gate-id", re.compile(_B + r"INV-?\d+" + _E + "|" + _B + r"(?!(?:ISO|RFC|IEC|EN|USB|ANSI)-)[A-Z]{1,3}-\d{2,3}" + _E
                           + "|" + _B + r"[SVGT]\d{1,2}\s+(?:PASS|FAIL|WARN)" + _E),
     "gate and invariant ids are the builder's vocabulary"),
]
_URL = re.compile(r"https?://[!-~]+")  # ASCII only: a URL glued to Chinese text ends there
_JS_PRODUCT = re.compile(r"(?:[A-Z][a-z0-9]*|three|d3|p5)\.js")  # Node.js, three.js, d3.js: names, not files
# Open class: register, not fact. WARN -- a power_user audience legitimately
# reads some of these, so the reader profile decides.
BUILDER_WORDS = ["stdout", "stderr", "traceback", "regex", "schema", "subprocess",
                 "venv", "worktree", "commit", "branch", "repo", "hook", "gate",
                 "exit code", "sha256", "CLI", "stack trace", "閘", "建置腳本"]
# ASCII words match whole (repo is not report, gate is not aggregate); CJK ones as substrings
_BUILDER_RE = {w: re.compile(_B + re.escape(w) + r"(?:e?s)?" + _E, re.I) if w.isascii() else re.compile(re.escape(w))
               for w in BUILDER_WORDS}


# audience-fit MANDATES two builder-addressed regions inside a reader-facing
# companion: the provenance block (canonical link, audience, as-of anchor) and,
# for an A1 re-render, the aggregation mapping table. A path or a sha there is
# addressed to the auditor who must trace the companion back, not to the reader
# -- measured 2026-09-10, when this gate's first run against an ACCEPTED owner
# view (ccfg-retrieval-audit-f1-owner-view.html, user gate PASS 2026-08-31)
# raised 6 FAILs, every one of them inside those two regions.
APPARATUS = re.compile(r"工程正本|聚合對照|前後對照|出處與基準|provenance|canonical original",
                       re.I)


def check_voice(companion: Path, quiet=False, apparatus=APPARATUS):
    text = reader_text(companion)
    # zone split: the delivery apparatus begins at the first line that names it.
    # Content predicate, so the boundary moves with the document; both zone sizes
    # are printed, because a reader paragraph that drifts below the marker would
    # otherwise be exempted silently.
    split = _zone_split(text, apparatus)
    findings = _early_marker(text, split)
    urls = [m.span() for m in _URL.finditer(text)]
    for name, pat, why in CLOSED:
        for m in pat.finditer(text):
            if name == "path" and (any(a <= m.start() < b for a, b in urls) or _JS_PRODUCT.fullmatch(m.group(0))):
                continue  # a link the reader can open, or a product name, is not a builder's path
            line = text.count("\n", 0, m.start()) + 1
            in_apparatus = m.start() >= split
            findings.append(dict(
                verdict="INFO" if in_apparatus else "FAIL", cls=name,
                hit=m.group(0)[:60], line=line,
                why=("delivery apparatus zone — audience-fit mandates the provenance "
                     "block and the 對照 table; this is addressed to the auditor")
                if in_apparatus else why))
    main_text = text[:split]          # the apparatus zone speaks to the auditor
    for w in BUILDER_WORDS:
        n = len(_BUILDER_RE[w].findall(main_text))
        if n:
            findings.append(dict(verdict="WARN", cls="builder-word", hit=w, line=0,
                                 why=f"appears {n}x in the reader's main text; keep only "
                                     f"if the declared audience is power_user or maintainer"))
    if not quiet:
        _print(companion, findings,
               f"{split} chars of reader main text, {len(text) - split} chars of delivery "
               f"apparatus (provenance + 對照); only the main text can close as FAIL")
    return findings


# --------------------------------------------------------------- value check
# The lookbehind excludes ASCII letters, underscore, '.' and any digit, so v2, x86,
# H2O and the tail of 1.5 are not numbers. It does NOT exclude CJK: Python's \w
# counts CJK as word characters, so the earlier (?<![\w.]) skipped every number
# glued to Chinese text (高33.6% unseen, 約1,234 read as 234; outside review 2026-11-01).
# Thousands separators only in groups of three, so a list 12,15,18 is three numbers.
_NUM = re.compile(r"(?<![A-Za-z_.])(?<!\d)[-+]?(?:\d{1,3}(?:,\d{3})+(?!\d)|\d+)(?:\.\d+)?(?:[eE][-+]?\d+)?")


def numbers(text):
    """(value, token, line) for every number; full-width digits (９１．４％, １，２３４) are read
    as their ASCII equivalents (fold_digits), dates are checked separately by dates()."""
    out = []
    scan = _DATE.sub(" ", fold_digits(text))  # lines counted in the scanned text
    for m in _NUM.finditer(scan):
        tok = m.group(0).replace(",", "")
        try:
            val = float(tok)
        except ValueError:
            continue
        if math.isfinite(val):  # 12e45678 is an id, not a number
            out.append((val, m.group(0), scan.count("\n", 0, m.start()) + 1))
    return out


def sigdigits(tok: str) -> int:
    mant = re.split(r"[eE]", tok)[0]  # exponent digits are not significant: 1.5e-3 has 2
    d = re.sub(r"[^\d]", "", mant).lstrip("0")
    return len(d.rstrip("0")) if "." not in mant else len(d)


TRANSFORMS = [
    ("identity", lambda o: o),
    ("×100 (成百分比)", lambda o: o * 100),
    ("(x−1)×100 (相對變化百分比)", lambda o: (o - 1) * 100),
    ("(1−x)×100 (相對減少百分比)", lambda o: (1 - o) * 100),
    ("1/x", lambda o: 1 / o if o else None),
    ("×1000 / ÷1000 (單位換算)", lambda o: o * 1000),
    ("÷1000", lambda o: o / 1000),
    ("10·log10 (dB)", lambda o: 10 * math.log10(o) if o > 0 else None),
    ("20·log10 (dB)", lambda o: 20 * math.log10(o) if o > 0 else None),
    ("10^(x/10) (dB→比值)", lambda o: 10 ** (o / 10) if abs(o) < 300 else None),
]


def accounted(c_val, c_tok, pool):
    """Is this companion number explained by an original one? Return the reason."""
    for name, f in TRANSFORMS:
        for o_val, o_tok, _ in pool:
            try:
                got = f(o_val)
            except (ValueError, ZeroDivisionError, OverflowError):
                got = None
            if got is None or not math.isfinite(got):  # 1e307 x 100 = inf would "explain" anything
                continue
            if got == c_val or (got and abs(got - c_val) <= max(abs(got), abs(c_val)) * 1e-9):
                return f"{name} of {o_tok}"
            # the companion may legitimately round: 33.55 -> "33.6%". Half-up, as people round
            # (Python's round() is half-even: 812.5 -> 812, so 813 used to FAIL), up to 6 places.
            if abs(got) >= 1e15:  # 10^(250/10) = 1e25 needs >28 digits at 6dp; no reader rounds that
                continue
            for places in range(0, 7):
                q = Decimal(repr(got)).quantize(Decimal(1).scaleb(-places), rounding=ROUND_HALF_UP)
                if float(q) == c_val:
                    return f"{name} of {o_tok}, rounded to {places}dp"
    # identity up to sign: -12.5% written as 降低 12.5% moves the sign into a word
    for o_val, o_tok, _ in pool:
        if o_val and abs(o_val) == abs(c_val):
            return f"magnitude of {o_tok} (sign moved into words: check the direction word)"
    return None


def check_values(original: Path, companion: Path, allow=None, quiet=False, apparatus=APPARATUS):
    otext = reader_text(original)
    full = reader_text(companion)
    split = _zone_split(full, apparatus)
    ctext = full[:split]  # the provenance block addresses the auditor
    pool = numbers(otext)
    # dates leave the number scan, so their years come back, by identity only: 2026年度 is
    # explained by 2026-08-01, but 202600 (2026 x 100) is not
    years = {float(d[0]) for d in dates(otext)}
    comp = numbers(ctext)
    bad = [p for p in (allow or []) if "=" not in p]
    if bad:
        raise InputError(f"--allow takes VALUE=REASON, got {bad[0]!r}")
    allow = dict(p.split("=", 1) for p in (allow or []))
    findings, certified, uncertified, by_transform = _early_marker(full, split), 0, 0, 0
    # dates are taken out of the number scan, so they get their own identity check
    odates = dates(otext)
    for d in sorted(dates(ctext) - odates):
        # a month-only date (day 0) matches any day of that month in the original
        if d[2] == 0 and any(o[:2] == d[:2] for o in odates):
            continue
        # WARN, not FAIL: audience-fit mandates an as-of anchor (「2026-11-01 產出」) that the
        # original need not carry, and it may sit in the main text (measured on the self-portrait pair)
        findings.append(dict(verdict="WARN", cls="unmatched-date", hit="-".join(map(str, d)), line=0,
                             why="no date in the canonical original matches this one (formats are "
                                 "normalised: 2026-08-01 = 2026/8/1 = 2026年8月1日); fine for an as-of "
                                 "anchor, otherwise a changed date"))

    for val, tok, line in comp:
        sd = sigdigits(tok)
        if sd >= 3:
            certified += 1
        else:
            uncertified += 1
            continue                      # 1-2 digits: not certified, see the ruler
        if tok in allow:
            findings.append(dict(verdict="INFO", cls="allowed", hit=tok, line=line,
                                 why=f"ALLOW: {allow[tok]}"))
            continue
        why = "identity of a date's year" if val in years else accounted(val, tok, pool)
        if why is None:
            findings.append(dict(verdict="FAIL", cls="invented", hit=tok, line=line,
                                 why="no number in the canonical original explains this, "
                                     "under identity or any named transform"))
        elif not why.startswith("identity"):
            by_transform += 1
            if why.startswith("magnitude"):
                findings.append(dict(verdict="WARN", cls="sign-moved", hit=tok, line=line, why=why))
    ruler = (f"{len(comp)} numbers in the reader's text: {certified} certified "
             f"(3+ significant digits, {by_transform} via a named transform), "
             f"{uncertified} NOT certified (1-2 digits: counting words, thresholds, "
             f"round figures) — stated, not hidden. This is a SCREEN, not a proof. "
             f"Read {split} of {len(full)} characters (below that: provenance apparatus).")
    if not quiet:
        _print(companion, findings, ruler)
    return findings


# --------------------------------------------------------------- limits check
LIMIT_WORDS = ["限制", "未驗", "未測", "假設", "不確定", "尚未", "無法", "僅適用",
               "caveat", "limitation", "unverified", "untested", "assumption",
               "not covered", "known issue"]


def check_limits(original: Path, companion: Path, quiet=False):
    """REPORT ONLY. Whether a limitation survived a rewrite is a reading, not a
    match: this lists what the original said and lets the human rule."""
    otext, ctext = reader_text(original), reader_text(companion)
    clow = ctext.lower()
    findings = []
    for raw in otext.splitlines():
        line = raw.strip()
        if not line or not any(w.lower() in line.lower() for w in LIMIT_WORDS):
            continue
        marker = next(w for w in LIMIT_WORDS if w.lower() in line.lower())
        findings.append(dict(
            verdict="INFO" if marker.lower() in clow else "UNDET",
            cls="limitation", hit=line[:90], line=0,
            why=("a line with the same marker exists in the companion — a human "
                 "decides whether it is the same limitation")
            if marker.lower() in clow else
            f"no line in the companion carries '{marker}' — dropped, or reworded?"))
    if not quiet:
        n_missing = sum(1 for f in findings if f["verdict"] == "UNDET")
        _print(companion, findings,
               f"{len(findings)} limitation lines in the original, {n_missing} with no "
               f"lexical counterpart. This check RULES ON NOTHING — audience-fit keeps "
               f"limitations in the main text, and only a reader can say whether a "
               f"reworded one still says it.")
    return findings


# ---------------------------------------------------------------- scope check
# A report most easily turns "some" into "all" (borrowed 2026-10-11 from a
# counterpart's recon playbook, its pit 7:
# words like 每篇 / 一定 / 固定 send you back to the raw data to count the
# proportion). Whether the proportion holds is a reading of the data, so this
# check lists, and rules only on what it can see: a universal the companion
# ADDS over the original.
# Matched as TOKENS with AssetVault term-match (vendor/term_match.py): longest key
# first, and a BLOCK term shields the shorter keys inside it. bound="edge": an
# ASCII-word neighbour rejects a match only on a side where the key itself ends in
# an ASCII word character, so CJK flush against Latin text (API一定, S7每次) is
# read while Everyone still does not hide every.
# "Is this quantifier in the original" is then a token test, never a substring
# test: 一定程度 in the original no longer hides a new 一定, nor Everyone a new
# every. Polysemy stays undecidable by string (我從不同意 is shielded with
# 從不同角度); this check is a screen, so that miss is named, not fixed.
UNIVERSAL_KEYS = ("每篇", "每則", "每次", "每一篇", "每一則", "每一次", "每一個", "每一位",
                  "每個", "一定", "固定", "全部", "所有", "總是", "永遠", "從不", "從來沒有",
                  "一律", "必定", "必然", "無一例外", "always", "every", "never", "all of",
                  "without exception")
# 不一定 / 不固定 / 不總是 are hedges and 所有權 is ownership: blocked like 一定程度 (2026-11-01)
UNIVERSAL_BLOCKS = frozenset({"一定程度", "從不同", "從不確定", "從不斷", "不一定", "不固定", "不總是", "所有權"})
_UNIVERSAL_ALL = UNIVERSAL_KEYS + tuple(sorted(UNIVERSAL_BLOCKS))


def universal_tokens(text: str) -> list[str]:
    """Universal quantifiers in `text` (lower-cased), block terms dropped, text order."""
    return tokens(text.lower(), _UNIVERSAL_ALL, UNIVERSAL_BLOCKS, bound="edge")


def check_scope(companion: Path, original: Path | None = None, quiet=False):
    """List every line carrying a universal quantifier. With an original: one
    whose quantifier the original never uses is NEW -> WARN; otherwise INFO.
    Without one: UNDET, a list for the human pass. Never FAIL."""
    oset = set(universal_tokens(reader_text(original))) if original else None
    findings = []
    for no, raw in enumerate(reader_text(companion).splitlines(), 1):
        line = raw.strip()
        words = set(universal_tokens(line))
        if not words:
            continue
        if oset is None:
            verdict, why = "UNDET", "universal claim: count the proportion in the raw data"
        else:
            new = sorted(words - oset)
            verdict = "WARN" if new else "INFO"
            why = (f"'{'/'.join(new)}' is not in the original — a rewrite widened the "
                   f"claim, or it needs its own count") if new else \
                  "the original uses the same quantifier — check it was not widened"
        findings.append(dict(verdict=verdict, cls="universal", hit=line[:90], line=no, why=why))
    if oset:
        # The other direction: a quantifier the original uses that the reader edition never
        # does. A narrowed claim (所有 -> 部分) or a moved limit shows here; a rewrite that
        # legitimately drops a sentence also does, so it is WARN, never FAIL.
        # INFO, never WARN: a redraw aggregates and drops sentences, so on a real pair (the
        # self-portrait: 全部/固定/每個) a WARN fired on every page; listed for the human pass.
        cset = set(universal_tokens(reader_text(companion)))
        for w in sorted(oset - cset):
            latin = w.isascii()
            findings.append(dict(verdict="INFO", cls="dropped-universal", hit=w, line=0,
                                 why=f"the original says '{w}' and the reader edition never does — "
                                     f"check the claim was not narrowed or softened"
                                     + (" (an English key: a translated rewrite drops it legitimately)"
                                        if latin else "")))
    if not quiet:
        _print(companion, findings,
               f"{len(findings)} findings on universal quantifiers (每篇/一定/固定/所有/"
               f"always…). This is a SCREEN: it never rules on whether the claim holds, "
               f"only on whether a quantifier was added or dropped.")
    return findings


# ------------------------------------------------- shared: prose vs drawing
# Borrowed 2026-10-23 (re-borrow ledger B-14/B-15/B-16) from tt-a1i/archify
# `explainer-authoring.md` (MIT): one term per thing across prose and diagram,
# totals that add up, short plain zh sentences. All three are SCREENS: they
# WARN and never FAIL, because whether a near-name is a second name, whether a
# total row is meant as a plain sum, and whether a long sentence reads badly
# are readings, not matches.
_SVG = re.compile(r"<svg\b.*?</svg>", re.S | re.I)
_SVG_TEXT = re.compile(r"<text\b([^>]*)>(.*?)</text>", re.S | re.I)
_CJK = re.compile(r"[㐀-鿿]")
_PUNCT = re.compile(r"[\s「」『』（）()、，。：；！？“”\"'·—…／/|]")


def _zone_split(text, apparatus=APPARATUS):
    """Offset where the delivery apparatus begins (len(text) when there is none)."""
    if apparatus:
        for m in apparatus.finditer(text):
            return text.rfind("\n", 0, m.start()) + 1
    return len(text)


def _early_marker(text, split):
    """WARN when the apparatus marker sits in the first half: everything below it is exempt."""
    if split < len(text) // 2:
        return [dict(verdict="WARN", cls="apparatus-early", hit=text[split:split + 40].strip(),
                     line=text.count("\n", 0, split) + 1,
                     why=f"{100 - split * 100 // max(len(text), 1)}% of the text sits below the "
                         f"first apparatus marker and is exempt; check that line "
                         f"really starts the provenance block")]
    return []


def _split_zone(text, apparatus=APPARATUS):
    return text[:_zone_split(text, apparatus)]


def prose_text(path: Path, apparatus=APPARATUS) -> str:
    """Reader main text WITHOUT the drawing: svg blocks removed, then as reader_text."""
    raw = _read(path)
    if path.suffix.lower() in (".html", ".htm"):
        raw = _SVG.sub(" ", _COMMENT.sub(" ", _SCRIPT.sub(" ", raw)))
        raw = html.unescape(_TAG.sub(" ", raw))
    else:
        raw = _FENCE.sub(" ", raw)
    return _split_zone(raw, apparatus)


def node_labels(path: Path):
    """Node names drawn in the page's svg: `<text class="t">` when the page marks
    titles (the owner-view convention), else every short svg text."""
    if path.suffix.lower() not in (".html", ".htm", ".svg"):
        return []
    raw = _read(path)
    titled, short = [], []
    for svg in _SVG.findall(raw):
        for attrs, body in _SVG_TEXT.findall(svg):
            t = html.unescape(_TAG.sub("", body)).strip()
            if not t:
                continue
            if re.search(r"""class\s*=\s*["'](?:[^"']*\s)?t(?:\s[^"']*)?["']""", attrs):
                titled.append(t)
            elif 2 <= len(t) <= 16:
                short.append(t)
    return list(dict.fromkeys(titled or short))


def _ed1(a, b):
    """True when a and b differ by exactly one insert, delete or substitution."""
    if a == b or abs(len(a) - len(b)) > 1:
        return False
    if len(a) == len(b):
        return sum(x != y for x, y in zip(a, b)) == 1
    if len(a) > len(b):
        a, b = b, a
    for i in range(len(b)):
        if b[:i] + b[i + 1:] == a:
            return True
    return False


# ---------------------------------------------------------------- terms check
def check_terms(companion: Path, quiet=False, apparatus=APPARATUS):
    """B-14: a prose string one character away from a node label, and equal to
    no label, is a candidate SECOND NAME for that node. WARN; UNDET without a
    drawing."""
    labels = node_labels(companion)
    findings = []
    if not labels:
        findings.append(dict(verdict="UNDET", cls="term-variant", hit="(no svg node labels)", line=0,
                             why="terms compares prose with drawn node names; this file draws none"))
        if not quiet:
            _print(companion, findings, "0 node labels — nothing to compare")
        return findings
    prose = prose_text(companion, apparatus)
    label_set = set(labels)
    seen = set()
    for lab in labels:
        n = len(lab)
        if not 3 <= n <= 12:
            continue
        for size in (n - 1, n, n + 1):
            for i in range(0, max(0, len(prose) - size + 1)):
                w = prose[i:i + size]
                # punctuation inside the window is the same name quoted or
                # broken by a mark (三份「掛載檔), not a second name (2026-10-23 read)
                if w in label_set or lab in w or w in lab or w.strip() != w or _PUNCT.search(w):
                    continue
                if (w, lab) in seen or not _ed1(w, lab):
                    continue
                seen.add((w, lab))
                findings.append(dict(verdict="WARN", cls="term-variant", hit=f"{w} ≈ {lab}",
                                     line=prose.count("\n", 0, i) + 1,
                                     why="one character from a drawn node name: if it is the same "
                                         "thing, use the node's name so the reader can find it"))
    if not quiet:
        _print(companion, findings,
               f"{len(labels)} node labels, {len(findings)} prose strings one edit away. This is a "
               f"SCREEN: a near-name can be a different thing.")
    return findings


# ----------------------------------------------------------------- sums check
_TOTAL = re.compile(r"^\s*(?:合計|總計|小計|總和|共計|Σ|total|sum)" + _E, re.I)  # \b fails before CJK: 合計金額


class _TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.tables, self._row, self._cell = [], None, None

    def handle_starttag(self, tag, attrs):
        if tag == "table":
            self.tables.append([])
        elif tag == "tr" and self.tables:
            self._row = []
        elif tag in ("td", "th") and self._row is not None:
            self._cell = []

    def handle_endtag(self, tag):
        if tag in ("td", "th") and self._cell is not None:
            self._row.append("".join(self._cell).strip())
            self._cell = None
        elif tag == "tr" and self._row is not None:
            self.tables[-1].append(self._row)
            self._row = None

    def handle_data(self, data):
        if self._cell is not None:
            self._cell.append(data)


def tables_of(path: Path):
    raw = _read(path)
    if path.suffix.lower() in (".html", ".htm"):
        p = _TableParser()
        p.feed(_COMMENT.sub(" ", _SCRIPT.sub(" ", raw)))
        return [t for t in p.tables if len(t) >= 3]
    tables, cur = [], []
    for line in raw.splitlines() + [""]:
        s = line.strip()
        if s.startswith("|") and s.endswith("|"):
            # emphasis markup is not content: a bold 「**合計**」 row is still a total
            cells = [re.sub(r"\*\*|__|`", "", c).strip() for c in s.strip("|").split("|")]
            if not all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
                cur.append(cells)
        elif cur:
            if len(cur) >= 3:
                tables.append(cur)
            cur = []
    return tables


def _cell_num(cell):
    m = _NUM.search(_DATE.sub(" ", cell or ""))
    if not m:
        return None
    tok = m.group(0).replace(",", "")
    try:
        return float(tok), (len(tok.split(".")[1]) if "." in tok else 0)
    except ValueError:
        return None


def check_sums(companion: Path, quiet=False):
    """B-15: a row labelled 合計/總計/小計/total whose numeric cell differs from
    the sum of the rows above it (since the header or the previous total). WARN —
    a total row may be meant as something other than a plain sum."""
    findings, checked = [], 0
    for ti, rows in enumerate(tables_of(companion), 1):
        start = 1                                    # row 0 is the header
        for ri, row in enumerate(rows):
            if ri == 0 or not row or not _TOTAL.match(row[0]):
                continue
            block = rows[start:ri]
            start = ri + 1
            for ci in range(1, len(row)):
                tot = _cell_num(row[ci])
                vals = [_cell_num(r[ci]) if ci < len(r) else None for r in block]
                if tot is None or not vals or any(v is None for v in vals):
                    continue
                checked += 1
                s = sum(v for v, _ in vals)
                # Integer counts are exact; only decimals or percentages are
                # rounded values whose sum may drift by half a unit per row.
                dp = tot[1]
                rounded = dp > 0 or any(d for _, d in vals) or "%" in row[ci] \
                    or any("%" in (r[ci] if ci < len(r) else "") for r in block)
                tol = 0.5 * 10 ** -dp * (len(vals) + 1) if rounded else 0.0
                if abs(s - tot[0]) > tol + 1e-9:
                    head = rows[0][ci] if ci < len(rows[0]) else f"col {ci + 1}"
                    # A rate column's total row is usually a weighted mean, and a
                    # weighted mean lies between the smallest and largest row: in
                    # that range the cell cannot be ruled on (INFO). Outside it,
                    # it is neither a sum nor a mean of these rows (WARN).
                    lo, hi = min(v for v, _ in vals), max(v for v, _ in vals)
                    if "%" in row[ci] and lo - tol <= tot[0] <= hi + tol:
                        findings.append(dict(verdict="INFO", cls="sum-rate", line=0,
                                             hit=f"table {ti} 「{row[0]}」/「{head}」: {row[ci]}",
                                             why=f"not the sum ({s:g}) but inside the rows' range "
                                                 f"{lo:g}–{hi:g}: read as a weighted rate, not checked"))
                        continue
                    findings.append(dict(verdict="WARN", cls="sum", line=0,
                                         hit=f"table {ti} 「{row[0]}」/「{head}」: {row[ci]}",
                                         why=f"the {len(vals)} rows above add up to {s:g}; if the "
                                             f"row is a plain total, one of them is wrong"))
    if not quiet:
        _print(companion, findings,
               f"{checked} total cells recomputed against the rows above them. SCREEN: a total "
               f"row that is not a plain sum (an average, a subset) also warns.")
    return findings


# ---------------------------------------------------------------- style check
NOMINAL = re.compile(r"(?:進行|做出|予以|加以)(?=[一-鿿])")
STOCK = ["賦能", "全方位", "至關重要", "不可或缺", "無縫接軌", "一站式", "助力"]
SENT_MAX = 50


def check_style(companion: Path, quiet=False, apparatus=APPARATUS):
    """B-16 (de-ai-flavor check 11): zh sentence mechanics in the reader's main
    text — a sentence over ~50 characters, more than two 的, a nominalised verb
    (進行檢查 → 檢查), a stock phrase. Countable, so listed; WARN only, because
    whether the sentence reads well is a judgment."""
    text = prose_text(companion, apparatus)
    findings = []
    line = 1
    # `·` joins status fragments on owner views (本輪核對： A · B · C); each
    # fragment is its own statement (2026-10-23 read of 6 accepted views)
    for chunk in re.split(r"(?<=[。！？；\n·])", text):
        cur_line = line
        line += chunk.count("\n")
        s = chunk.strip()
        if not s or not _CJK.search(s):
            continue
        n = len(re.sub(r"\s", "", s))
        if n > SENT_MAX:
            findings.append(dict(verdict="WARN", cls="long-sentence", hit=s[:40] + "…", line=cur_line,
                                 why=f"{n} characters; split it so each sentence makes one claim"))
        if s.count("的") > 2:
            findings.append(dict(verdict="WARN", cls="de-count", hit=s[:40], line=cur_line,
                                 why=f"{s.count('的')}「的」in one sentence"))
        for m in NOMINAL.finditer(s):
            findings.append(dict(verdict="WARN", cls="nominal-verb", hit=s[m.start():m.start() + 4],
                                 line=cur_line, why="say the verb directly (進行檢查 → 檢查)"))
        for w in STOCK:
            if w in s:
                findings.append(dict(verdict="WARN", cls="stock-phrase", hit=w, line=cur_line,
                                     why="replace with the concrete result"))
    if not quiet:
        by = {}
        for f in findings:
            by[f["cls"]] = by.get(f["cls"], 0) + 1
        _print(companion, findings,
               "by class " + (", ".join(f"{k} {v}" for k, v in sorted(by.items())) or "none")
               + f". SCREEN: counts are determinable, readability is not (sentence cap {SENT_MAX}).")
    return findings


# --------------------------------------------------------------------- output
def _print(target, findings, ruler):
    print(f"target: {target.name}")
    for f in findings:
        loc = f":{f['line']}" if f["line"] else ""
        print(f"  [{f['verdict']:<5}] {f['cls']:<13} {f['hit']}{loc}\n           {f['why']}")
    counts = {k: sum(1 for f in findings if f["verdict"] == k)
              for k in ("FAIL", "WARN", "INFO", "UNDET")}
    print(f"  ruler: {ruler}")
    print(f"  {counts['FAIL']} FAIL, {counts['WARN']} WARN, {counts['INFO']} INFO, "
          f"{counts['UNDET']} UNDET\n")


# ---------------------------------------------------------------- calibration
ORIGINAL = """# ccfg retrieval audit (canonical, engineering voice)

The rewrite ratio measured 1.336 against the 2026-08-01 baseline over
tools/xi_scan.py, and the p90 latency was 812.5 ms.
Gate S7 PASS; run-id run_9f3a11c2; sha 4c1d9ba77e0f1122.
Limitation: the sampler was never run against a cold cache, so the cold path is
unverified.
Assumption: the 1310 nm figure is carried over from the earlier round.
Known issue: two of the eleven probes time out on this machine.
"""

CLEAN = """# 檢索健檢（受眾版）

比基準高 33.6%，反應時間 812.5 毫秒。
限制：冷啟動的情況沒有測過。
假設：波長數字沿用上一輪。
"""

INVENTED = """# 檢索健檢（受眾版）

比基準高 33.6%，反應時間 812.5 毫秒，命中率 91.4%。
限制：冷啟動的情況沒有測過。
"""

WIDENED = """# 檢索健檢（受眾版）

每次查詢都比基準高 33.6%，反應時間一定在 812.5 毫秒。
這個數字在一定程度上可信。
限制：冷啟動的情況沒有測過。
"""

# Token, not substring (E-1 review 2026-10-27): the original holds 一定程度 and
# Everyone, which a substring test reads as 一定 and every. Line 3 adds 一定 and
# every (WARN); line 4 is 從不同 (no quantifier); line 5 adds a real 從不 (WARN);
# line 6 adds a 固定 flush against Latin text (WARN).
SCOPE_MASK_ORIG = """# 原文

這個結果在一定程度上成立，Everyone on the team agreed.
"""

SCOPE_MASK_COMP = """# 伴讀

這個結果一定成立，every run agreed.
我們從不同角度看。
這個流程從不失敗。
這個API固定回傳空值。
"""

LEAKY = """# 檢索健檢（受眾版）

比基準高 33.6%。掃描器 tools/xi_scan.py 的 S7 PASS，run_9f3a11c2 這一輪
（sha 4c1d9ba77e0f1122）共 7 PASS。
限制：冷啟動的情況沒有測過。
"""

# Numbers glued to CJK (outside review 2026-11-01): the old lookbehind skipped them,
# so an invented 91.4 written as 命中率91.4% passed values.
GLUED_CLEAN = """# 檢索健檢（受眾版）

比基準高33.6%，反應時間812.5毫秒。
"""

GLUED_INVENTED = """# 檢索健檢（受眾版）

比基準高33.6%，命中率91.4%。
"""

# Plain 8+ digit numbers are not hashes; a hash glued to CJK still is.
VOICE_DIGITS = """# 聯絡（受眾版）

統編 12345678，電話 0223456789。
"""

VOICE_GLUED_SHA = """# 版本（受眾版）

這一版的編號是4c1d9ba77e0f1122。
"""

# Narrowing: the original's 所有 never appears in the reader edition.
SCOPE_NARROW_ORIG = """# 原文

所有測試都通過。
"""

SCOPE_NARROW_COMP = """# 伴讀

部分測試通過。
"""


TERMS_TRUE = """<html><body><svg><text class="t">任務佇列</text><text class="s">等待處理的工作</text>
<text class="t">出片工具</text></svg>
<p>新工作先放進任務隊列，再交給出片工具的排程。</p></body></html>"""

TERMS_FALSE = """<html><body><svg><text class="t">任務佇列</text><text class="t">出片工具</text></svg>
<p>新工作先放進任務佇列，再交給出片工具的排程。</p></body></html>"""

SUMS_TRUE = """| 項目 | 次數 | 說明 |
|---|---|---|
| 成功 | 3 | 正常 |
| 失敗 | 4 | 逾時 |
| **合計** | **8** | — |
"""

SUMS_FALSE = """| 項目 | 次數 | 比例 |
|---|---|---|
| 成功 | 3 | 42.9% |
| 失敗 | 4 | 57.1% |
| 合計 | 7 | 100.0% |

| 工具 | 呼叫數 | 錯誤率 |
|---|---|---|
| 甲 | 10 | 10.0% |
| 乙 | 30 | 2.0% |
| 合計 | 40 | 4.0% |
"""

STYLE_TRUE = """這是一個為了讓所有的使用者都能夠在不同的情境之下順利完成他們的工作而設計出來的非常複雜的流程說明文字。
我們會進行檢查。
這套工具全方位賦能團隊。
"""

STYLE_FALSE = """先檢查設定，再開始轉錄。
轉錄完成後，結果存在輸出資料夾。
"""


def _tmpfile(tmp: Path, name: str, body: str) -> Path:
    p = tmp / name
    p.write_text(body, encoding="utf-8")
    return p


def selftest():
    tmp = Path(tempfile.mkdtemp(prefix="afgate-cal-"))
    files = {}
    for name, body in (("original.md", ORIGINAL), ("clean.md", CLEAN),
                       ("invented.md", INVENTED), ("leaky.md", LEAKY),
                       ("widened.md", WIDENED), ("scope_mask_orig.md", SCOPE_MASK_ORIG),
                       ("scope_mask_comp.md", SCOPE_MASK_COMP), ("terms_true.html", TERMS_TRUE),
                       ("terms_false.html", TERMS_FALSE), ("sums_true.md", SUMS_TRUE),
                       ("sums_false.md", SUMS_FALSE), ("style_true.md", STYLE_TRUE),
                       ("style_false.md", STYLE_FALSE), ("glued_clean.md", GLUED_CLEAN),
                       ("glued_invented.md", GLUED_INVENTED), ("voice_digits.md", VOICE_DIGITS),
                       ("voice_glued_sha.md", VOICE_GLUED_SHA), ("narrow_orig.md", SCOPE_NARROW_ORIG),
                       ("narrow_comp.md", SCOPE_NARROW_COMP)):
        p = tmp / name
        p.write_text(body, encoding="utf-8")
        files[name] = p
    print(f"calibration fixtures: {tmp}\n")

    results = {}
    results["values/known-false"] = check_values(files["original.md"], files["clean.md"], quiet=True)
    results["values/known-true"] = check_values(files["original.md"], files["invented.md"], quiet=True)
    results["voice/known-false"] = check_voice(files["clean.md"], quiet=True)
    results["voice/known-true"] = check_voice(files["leaky.md"], quiet=True)
    lim = check_limits(files["original.md"], files["invented.md"], quiet=True)
    scope_true = check_scope(files["widened.md"], files["original.md"], quiet=True)
    scope_false = check_scope(files["clean.md"], files["original.md"], quiet=True)
    scope_solo = check_scope(files["widened.md"], quiet=True)
    scope_mask = check_scope(files["scope_mask_comp.md"], files["scope_mask_orig.md"], quiet=True)
    mask_warn = {f["line"]: f["why"] for f in scope_mask if f["verdict"] == "WARN"}
    # Token values for every shape of a CJK key flush against an ASCII word
    # character (letter before, digit before, letter after, underscore after),
    # plus mixed order: each differs from what the bare SH-18 bound returns ([]).
    flush = {"API一定": ["一定"], "S7每次": ["每次"], "固定API": ["固定"], "一定_x": ["一定"],
             "every 一定 never": ["every", "一定", "never"], "Everyone": []}
    flush_got = {t: universal_tokens(t) for t in flush}
    terms_true = check_terms(files["terms_true.html"], quiet=True)
    terms_false = check_terms(files["terms_false.html"], quiet=True)
    terms_none = check_terms(files["clean.md"], quiet=True)
    sums_true = check_sums(files["sums_true.md"], quiet=True)
    sums_false = check_sums(files["sums_false.md"], quiet=True)
    style_true = check_style(files["style_true.md"], quiet=True)
    style_false = check_style(files["style_false.md"], quiet=True)
    new_checks = terms_true + terms_false + terms_none + sums_true + sums_false + style_true + style_false
    glued_tokens = [t for _, t, _ in numbers("高33.6%，約1,234 筆，第2輪，v2 與 x86 不算")]
    glued_clean = check_values(files["original.md"], files["glued_clean.md"], quiet=True)
    glued_inv = check_values(files["original.md"], files["glued_invented.md"], quiet=True)
    voice_digits = check_voice(files["voice_digits.md"], quiet=True)
    voice_glued = check_voice(files["voice_glued_sha.md"], quiet=True)
    narrow = check_scope(files["narrow_comp.md"], files["narrow_orig.md"], quiet=True)
    # second audit round (2026-11-01): each case has its known-true and known-false side
    extra = {
        "date_orig.md": "# 原文\n\n基準日 2026-08-01，樣本 1,234 筆。\n",
        "date_same.md": "# 伴讀\n\n基準日是2026年8月1日（2026/8/1）。\n",
        "date_changed.md": "# 伴讀\n\n基準日是 2026-08-10。\n",
        "app_late.md": CLEAN + "\n## 出處與基準\n工程正本 report 20261101，sha 4c1d9ba77e0f1122。\n",
        "app_early.md": "# 檢索健檢\n\n出處與基準：見下方。\n" + "比基準高 33.6%，反應時間 812.5 毫秒。\n" * 5,
        "words_false.md": "# 報告\n\nThe report on aggregate clicks is short.\n",
        "words_true.md": "# 報告\n\nThe repo gate failed.\n",
        "sums_cjk.md": "| 項目 | 金額 |\n|---|---|\n| 甲 | 3 |\n| 乙 | 4 |\n| 合計金額 | 8 |\n",
        "sums_bom.md": "﻿| 項目 | 金額 |\n|---|---|\n| 甲 | 3 |\n| 乙 | 4 |\n| 合計 | 8 |\n",
    }
    for name, body in extra.items():
        (tmp / name).write_text(body, encoding="utf-8")
        files[name] = tmp / name
    (tmp / "utf16.md").write_bytes("# x\n比基準高 91.4%\n".encode("utf-16"))
    pats = {n: p for n, p, _ in CLOSED}
    voice_hits = {t: bool(pats[c].search(t)) for c, t in [
        ("pass-count", "共7 PASS"), ("pass-count", "12 PASSED"), ("gate-id", "依INV-17"),
        ("run-id", "輪run_9f3a11c2"), ("sha", "4C1D9BA77E0F1122AB34CD56EF7890AB"), ("sha", "AB12CD34"),
        ("gate-id", "ISO-100"), ("sha", "FACADEBEEF"), ("pass-count", "PASSPORT 12")]}
    path_skip = check_voice(_tmpfile(tmp, "paths.md",
                                     "# x\n\n見 https://github.com/x/y/README.md 與 Node.js 文件。\n"), quiet=True)
    path_hit = check_voice(_tmpfile(tmp, "paths2.md", "# x\n\n請執行afgate.py。\n"), quiet=True)
    date_same = check_values(files["date_orig.md"], files["date_same.md"], quiet=True)
    date_chg = check_values(files["date_orig.md"], files["date_changed.md"], quiet=True)
    app_late = check_values(files["original.md"], files["app_late.md"], quiet=True)
    app_late_v = check_voice(files["app_late.md"], quiet=True)
    app_early_v = check_voice(files["app_early.md"], quiet=True)
    words_f = check_voice(files["words_false.md"], quiet=True)
    words_t = check_voice(files["words_true.md"], quiet=True)
    sums_cjk = check_sums(files["sums_cjk.md"], quiet=True)
    sums_bom = check_sums(files["sums_bom.md"], quiet=True)
    try:
        _read(tmp / "utf16.md")
        utf16 = "read"
    except InputError:
        utf16 = "refused"
    import subprocess
    me = [sys.executable, "-X", "utf8", str(Path(__file__).resolve())]
    rc = {k: subprocess.run(me + args, capture_output=True).returncode for k, args in {
        "missing file": ["voice", str(tmp / "nope.md")],
        "--allow without =": ["values", str(files["original.md"]), str(files["clean.md"]), "--allow", "91.4"],
        "unknown mode": ["bogus"],
        "utf-16 file": ["voice", str(tmp / "utf16.md")],
        "clean voice": ["voice", str(files["clean.md"])]}.items()}

    def fails(k):
        return [f for f in results[k] if f["verdict"] == "FAIL"]

    big_o = _tmpfile(tmp, "big_orig.md", "# 原文\n\n延遲 250 ms。\n")
    big_c = _tmpfile(tmp, "big_comp.md", "# 伴讀\n\n延遲 250 毫秒，命中率 91.4%。\n")
    try:
        big = [f["cls"] for f in check_values(big_o, big_c, quiet=True) if f["verdict"] == "FAIL"]
    except Exception as e:  # the Decimal overflow raised here before the fix
        big = [type(e).__name__]
    early_c = _tmpfile(tmp, "early_comp.md", "# 伴讀\n\n資料 provenance 很重要。\n\n比基準高 33.6%。\n"
                                            "命中率 91.4%。\n第三行。\n第四行。\n第五行。\n")
    early_on = check_values(files["original.md"], early_c, quiet=True)
    early_off = check_values(files["original.md"], early_c, quiet=True, apparatus=None)
    nums = lambda t: [v for v, _, _ in numbers(t)]
    year_o = _tmpfile(tmp, "year_orig.md", "# 原文\n\n上線日 2026-08-01。\n")
    year_c = _tmpfile(tmp, "year_comp.md", "# 伴讀\n\n於2026年度上線。\n")
    year_v = check_values(year_o, year_c, quiet=True)
    sign_o = _tmpfile(tmp, "sign_orig.md", "# 原文\n\n延遲變化 -12.5%。\n")
    sign_c = _tmpfile(tmp, "sign_comp.md", "# 伴讀\n\n延遲變慢 12.5%。\n")
    sign_v = check_values(sign_o, sign_c, quiet=True)
    url_glued = check_voice(_tmpfile(tmp, "url_glued.md", "# x\n\n見 https://x.com/a請執行run.py。\n"), quiet=True)
    lib_js = check_voice(_tmpfile(tmp, "lib_js.md", "# x\n\n圖用 three.js 與 d3.js 畫。\n"), quiet=True)
    plural = check_voice(_tmpfile(tmp, "plural.md", "# x\n\n這些 hooks 會自動跑。\n"), quiet=True)

    checks = [
        ("values known-false stays clean (33.6% is a named transform of 1.336)",
         not fails("values/known-false")),
        ("values known-true caught (91.4 explained by nothing)",
         any(f["hit"].startswith("91.4") for f in fails("values/known-true"))),
        ("voice known-false stays clean", not fails("voice/known-false")),
        ("voice known-true caught: path", any(f["cls"] == "path" for f in fails("voice/known-true"))),
        ("voice known-true caught: sha", any(f["cls"] == "sha" for f in fails("voice/known-true"))),
        ("voice known-true caught: run-id", any(f["cls"] == "run-id" for f in fails("voice/known-true"))),
        ("voice known-true caught: PASS count",
         any(f["cls"] == "pass-count" for f in fails("voice/known-true"))),
        ("limits rules on nothing (no FAIL ever)",
         not [f for f in lim if f["verdict"] == "FAIL"]),
        ("limits reports the dropped 假設 line",
         any(f["verdict"] == "UNDET" for f in lim)),
        ("scope known-true caught: 每次 + 一定 added over the original (1 line)",
         [f["line"] for f in scope_true if f["verdict"] == "WARN"] == [3]),
        ("scope known-false stays quiet (clean companion, and 一定程度 is not a universal); the "
         "original's English 'never' translated away is INFO only",
         [(f["verdict"], f["hit"]) for f in scope_false] == [("INFO", "never")]
         and not [f for f in scope_true if f["line"] == 4]),
        ("scope reads tokens, not substrings: 一定程度/Everyone in the original do not hide a new "
         "一定/every; 從不同 is no quantifier; a real 從不 is; 固定 flush after API is (WARN lines [3, 5, 6])",
         sorted(mask_warn) == [3, 5, 6] and "'every/一定'" in mask_warn[3]
         and not [f for f in scope_mask if f["line"] == 4]),
        ("scope tokens: CJK keys flush against letters/digits/underscore on either side are "
         "read, Latin keys keep the ASCII bound, text order kept",
         flush_got == flush),
        ("scope rules on nothing without an original (UNDET only, never FAIL)",
         scope_solo and all(f["verdict"] == "UNDET" for f in scope_solo)),
        ("terms known-true caught: 任務隊列 ≈ 任務佇列 (exactly 1 WARN)",
         [f["hit"] for f in terms_true if f["verdict"] == "WARN"] == ["任務隊列 ≈ 任務佇列"]),
        ("terms known-false quiet (exact names; 出片工具的 is the name plus a particle)",
         not [f for f in terms_false if f["verdict"] == "WARN"]),
        ("terms without a drawing is UNDET, never WARN",
         terms_none and all(f["verdict"] == "UNDET" for f in terms_none)),
        ("sums known-true caught: 3 + 4 written as **8** in a bold total row (1 WARN, 說明 skipped)",
         len([f for f in sums_true if f["verdict"] == "WARN"]) == 1),
        ("sums known-false quiet (7 and 100.0% within rounding; weighted rate 4.0% is INFO only)",
         not [f for f in sums_false if f["verdict"] == "WARN"]
         and [f["cls"] for f in sums_false] == ["sum-rate"]),
        ("style known-true caught: long sentence, 的 count, 進行, stock phrases",
         {f["cls"] for f in style_true} == {"long-sentence", "de-count", "nominal-verb", "stock-phrase"}),
        ("style known-false quiet", not style_false),
        ("the three new checks never FAIL", not [f for f in new_checks if f["verdict"] == "FAIL"]),
        ("values reads numbers glued to CJK, whole: tokens are 33.6, 1,234, 2 (v2/x86 are not numbers)",
         glued_tokens == ["33.6", "1,234", "2"]),
        ("values glued known-false stays clean (高33.6%, 812.5毫秒 explained by the original)",
         not [f for f in glued_clean if f["verdict"] == "FAIL"]),
        ("values glued known-true caught (命中率91.4% explained by nothing)",
         [f["hit"] for f in glued_inv if f["verdict"] == "FAIL"] == ["91.4"]),
        ("voice: a plain 8+ digit number (統編, 電話) is not a hash",
         not [f for f in voice_digits if f["cls"] == "sha"]),
        ("voice: a hash glued to CJK is still caught",
         [f["hit"] for f in voice_glued if f["cls"] == "sha" and f["verdict"] == "FAIL"] == ["4c1d9ba77e0f1122"]),
        ("scope narrowing: the original's 所有 missing from the reader edition is listed (INFO), never FAIL",
         [(f["verdict"], f["hit"]) for f in narrow if f["cls"] == "dropped-universal"] == [("INFO", "所有")]
         and not [f for f in narrow if f["verdict"] == "FAIL"]),
        ("values: full-width digits read as ASCII (９１．４％ -> 91.4, １，２３４ -> 1,234)",
         [t for _, t, _ in numbers("命中率９１．４％，共１，２３４筆")] == ["91.4", "1,234"]),
        ("values: a list 12,15,18 is three numbers, 1,234 is one",
         [t for _, t, _ in numbers("12,15,18 與 1,234")] == ["12", "15", "18", "1,234"]),
        ("values: exponent digits are not significant (1.5e-3 -> 2); 12e45678 is not a number",
         sigdigits("1.5e-3") == 2 and numbers("編號 12e45678") == []),
        ("values: half-up rounding (812.5 -> 813 accounted; 814 not)",
         accounted(813.0, "813", [(812.5, "812.5", 1)]) is not None
         and accounted(814.0, "814", [(812.5, "812.5", 1)]) is None),
        ("values: sign moved into words (-12.5% -> 降低 12.5%) is explained by magnitude, not FAIL",
         (accounted(12.5, "12.5", [(-12.5, "-12.5", 1)]) or "").startswith("magnitude")),
        ("values: one date in three formats matches; a changed date WARNs unmatched-date (never FAIL)",
         dates("於2026-08-01，2026年8月1日，2026/8/1") == {(2026, 8, 1)}
         and not [f for f in date_same if f["verdict"] in ("FAIL", "WARN")]
         and [f["hit"] for f in date_chg if f["verdict"] == "WARN"] == ["2026-8-10"]
         and not [f for f in date_chg if f["verdict"] == "FAIL"]),
        ("values: numbers in the provenance block are not the reader's (no FAIL); voice keeps its sha as INFO",
         not [f for f in app_late if f["verdict"] == "FAIL"]
         and [f["verdict"] for f in app_late_v if f["cls"] == "sha"] == ["INFO"]),
        ("voice: CJK-glued PASS / INV / run id, PASSED, upper-case digest caught; AB12CD34, ISO-100, FACADEBEEF, "
         "PASSPORT 12 not",
         voice_hits == {"共7 PASS": True, "12 PASSED": True, "依INV-17": True, "輪run_9f3a11c2": True,
                        "4C1D9BA77E0F1122AB34CD56EF7890AB": True, "AB12CD34": False,
                        "ISO-100": False, "FACADEBEEF": False, "PASSPORT 12": False}),
        ("voice: a URL and Node.js are not paths; afgate.py glued to CJK is",
         not [f for f in path_skip if f["cls"] == "path"]
         and [f["hit"] for f in path_hit if f["cls"] == "path"] == ["afgate.py"]),
        ("voice: an apparatus marker in the first half WARNs apparatus-early; a late one does not",
         [f["cls"] for f in app_early_v if f["verdict"] == "WARN"].count("apparatus-early") == 1
         and not [f for f in app_late_v if f["cls"] == "apparatus-early"]),
        ("voice: builder words match whole (report/aggregate/click quiet; repo + gate WARN)",
         not [f for f in words_f if f["cls"] == "builder-word"]
         and sorted(f["hit"] for f in words_t if f["cls"] == "builder-word") == ["gate", "repo"]),
        ("scope: hedges 不一定/不固定/不總是 and 所有權 are not universals",
         universal_tokens("不一定 不固定 不總是 所有權") == [] and universal_tokens("一定 所有") == ["一定", "所有"]),
        ("sums: 合計金額 is a total row; a BOM before the table does not hide it (1 WARN each)",
         len([f for f in sums_cjk if f["verdict"] == "WARN"]) == 1
         and len([f for f in sums_bom if f["verdict"] == "WARN"]) == 1),
        ("input: a UTF-16 file is refused, not read as noise", utf16 == "refused"),
        ("exit codes: missing file, bad --allow, unknown mode, UTF-16 -> 3; clean voice -> 0",
         rc == {"missing file": 3, "--allow without =": 3, "unknown mode": 3, "utf-16 file": 3, "clean voice": 0}),
        ("values: an original value >= 220 (dB transform -> 1e25) does not crash; the invented 91.4 FAILs",
         big == ["invented"]),
        ("values: an early marker WARNs apparatus-early; --no-apparatus reads below it and FAILs 91.4",
         [f["cls"] for f in early_on if f["verdict"] == "WARN"] == ["apparatus-early"]
         and [f["hit"] for f in early_off if f["verdict"] == "FAIL"] == ["91.4"]),
        ("numbers: 100，200，300 is three numbers, １，２３４ is 1234, 10⁶ is not 106, 1,2345 keeps its 5",
         nums("100，200，300") == [100, 200, 300] and nums("１，２３４") == [1234]
         and nums("10⁶") == [10] and 1234 not in nums("1,2345")),
        ("values: 2026年度 is explained by the original's 2026-08-01 (year pooled)",
         not [f for f in year_v if f["verdict"] == "FAIL"]),
        ("values: a sign moved into words WARNs sign-moved (a direction word is a human call)",
         [f["cls"] for f in sign_v if f["verdict"] == "WARN"] == ["sign-moved"]),
        ("voice: vite.config.ts and 報告.md are paths; run.py after a glued URL is not hidden",
         bool(pats["path"].search("見vite.config.ts")) and bool(pats["path"].search("見 報告.md"))
         and any(f["cls"] == "path" and f["verdict"] == "FAIL" for f in url_glued)),
        ("voice: three.js / d3.js are library names, not paths; plural hooks is builder vocabulary",
         not [f for f in lib_js if f["cls"] == "path"]
         and any(f["verdict"] == "WARN" and "hook" in f["hit"].lower() for f in plural)),
        ("values: an overflowed transform (1e307 x 100 = inf) explains nothing; a year matches by identity only",
         accounted(91.4, "91.4", [(1e307, "1e307", 1)]) is None
         and not [f for f in year_v if f["verdict"] == "FAIL"]
         and [f["hit"] for f in check_values(year_o, _tmpfile(tmp, "year_x100.md", "# b\n\n共202600筆。\n"), quiet=True)
              if f["verdict"] == "FAIL"] == ["202600"]),
        ("numbers: a mixed-width decimal 91．4 is one number", nums("命中率91．4%") == [91.4]),
    ]
    for label, ok in checks:
        print(f"  [{'ok ' if ok else 'BAD'}] {label}")
    good = all(ok for _, ok in checks)
    print("\ncalibration:", "PASS — every check separated its known-true from its known-false input"
          if good else "BROKEN — this gate may not rule on a real companion")
    return 0 if good else 2


class _Parser(argparse.ArgumentParser):
    def error(self, message):  # a usage error is "could not run" (3), never FAIL (2)
        self.print_usage(sys.stderr)
        print(f"afgate: {message}", file=sys.stderr)
        sys.exit(3)


def main():
    try:
        return _main()
    except (InputError, OSError) as e:
        print(f"afgate: could not run: {e}", file=sys.stderr)
        return 3


def _main():
    ap = _Parser(description=__doc__.split("\n")[0])
    ap.add_argument("mode", nargs="?", choices=["voice", "values", "limits", "scope",
                                                "terms", "sums", "style", "all"])
    ap.add_argument("files", nargs="*", type=Path)
    ap.add_argument("--allow", action="append", metavar="VALUE=REASON",
                    help="a companion number that is legitimately not in the original; "
                         "the reason is printed beside it")
    ap.add_argument("--no-apparatus", action="store_true",
                    help="treat the whole file as the reader's main text "
                         "(no provenance/對照 zone)")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return selftest()
    if not a.mode:
        ap.error("mode required (voice | values | limits | scope | terms | sums | style | all)")

    found = []
    if a.mode == "voice":
        if len(a.files) != 1:
            ap.error("voice takes one file: the companion")
        found = check_voice(a.files[0], apparatus=None if a.no_apparatus else APPARATUS)
    elif a.mode == "scope":
        if len(a.files) not in (1, 2):
            ap.error("scope takes <companion> [<original>]")
        found = check_scope(a.files[0], a.files[1] if len(a.files) == 2 else None)
    elif a.mode in ("terms", "sums", "style"):
        if len(a.files) != 1:
            ap.error(f"{a.mode} takes one file: the companion")
        app = None if a.no_apparatus else APPARATUS
        found = (check_terms(a.files[0], apparatus=app) if a.mode == "terms"
                 else check_sums(a.files[0]) if a.mode == "sums"
                 else check_style(a.files[0], apparatus=app))
    else:
        if len(a.files) != 2:
            ap.error(f"{a.mode} takes two files: <original> <companion>")
        o, c = a.files
        if a.mode in ("values", "all"):
            found += check_values(o, c, allow=a.allow, apparatus=None if a.no_apparatus else APPARATUS)
        if a.mode in ("limits", "all"):
            found += check_limits(o, c)
        if a.mode == "all":
            found += check_scope(c, o)
            found += check_voice(c, apparatus=None if a.no_apparatus else APPARATUS)
            found += check_terms(c, apparatus=None if a.no_apparatus else APPARATUS)
            found += check_sums(c)
            found += check_style(c, apparatus=None if a.no_apparatus else APPARATUS)
            # values and voice read the same marker: count its apparatus-early WARN once
            early = [f for f in found if f["cls"] == "apparatus-early"]
            found = [f for f in found if f["cls"] != "apparatus-early"] + early[:1]
    if any(f["verdict"] == "FAIL" for f in found):
        return 2
    return 1 if any(f["verdict"] == "WARN" for f in found) else 0


if __name__ == "__main__":
    sys.exit(main())
