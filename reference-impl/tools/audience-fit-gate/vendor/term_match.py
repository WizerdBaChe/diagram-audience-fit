"""term_match -- find registry terms in running text as TOKENS, never as substrings.

One rule, three properties:
  1. Left to right, the LONGEST key matching at a position wins (a regex alternation
     sorted by length, stable for equal lengths).
  2. A match touching an ASCII word character ([A-Za-z0-9_]) is skipped WHOLE and no
     shorter key is retried at that position (so `NA` is not found in `DNA`).
     bound="edge" applies this test only on a side where the KEY's own edge character
     is an ASCII word character: CJK written flush against Latin text (API一定,
     S7每次) is then still found, while `every` is still not found in `everyone`.
     Matching is case-sensitive: lower-case both sides first if case must not matter.
     bound="all" (the default) is research-site-shell CONTRACT SH-18 exactly.
  3. A BLOCK term takes part in matching, so it shields the shorter keys inside it
     (電晶體 shields 體效應), but is never reported as a token.

String matching cannot decide polysemy (會產生電流 vs the term 產生; 我從不同意 vs
從不同角度): a caller that needs it decides above this layer.

API
  match_text(text, keys, bound="all") -> [(start, end, key)]   every match incl. blocks
  tokens(text, keys, blocks=(), bound="all") -> [key]          matches minus blocks, text order
  segments(text, keys, blocks=(), bound="all") -> [[text, key|None]]   the text cut as shown
  python term_match.py --selftest                               term_cases.json, both modes
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

BOUND = re.compile(r"[A-Za-z0-9_]")
CASES = Path(__file__).resolve().parent / "term_cases.json"

_cache: dict[tuple, re.Pattern | None] = {}


def _pattern(keys) -> re.Pattern | None:
    sig = tuple(keys)                        # materialised once: a generator argument is read one time
    if sig not in _cache:
        if len(_cache) >= 64:                # a registry that changes often must not grow the cache forever
            _cache.clear()
        live = (k for k in sig if k)         # an empty key would match everywhere at zero width
        ordered = sorted(dict.fromkeys(live), key=len, reverse=True)   # stable, like Array.prototype.sort
        _cache[sig] = re.compile("(" + "|".join(re.escape(k) for k in ordered) + ")") if ordered else None
    return _cache[sig]


def match_text(text: str, keys, bound: str = "all") -> list[tuple[int, int, str]]:
    """Longest key first at each position, left to right; a match rejected by the
    ASCII-word bound is skipped WHOLE: no shorter key is retried at that position,
    and scanning resumes after it, so a shorter key starting inside that span is
    not found either (SH-18: research-site-shell's JS twin does the same)."""
    if bound not in ("all", "edge"):
        raise ValueError(f"bound must be 'all' or 'edge', not {bound!r}")
    rx = _pattern(keys)
    if rx is None:
        return []
    out = []
    for m in rx.finditer(text):
        s, e, k = m.start(), m.end(), m.group(0)
        left = s > 0 and BOUND.match(text[s - 1]) and (bound == "all" or BOUND.match(k[0]))
        right = e < len(text) and BOUND.match(text[e]) and (bound == "all" or BOUND.match(k[-1]))
        if left or right:
            continue
        out.append((s, e, k))
    return out


def tokens(text: str, keys, blocks=(), bound: str = "all") -> list[str]:
    blocks = set(blocks)
    keys = [*keys, *blocks]                  # a block must take part in matching to shield anything
    return [k for _, _, k in match_text(text, keys, bound) if k not in blocks]


def segments(text: str, keys, blocks=(), bound: str = "all") -> list[list]:
    out, last = [], 0
    blocks = set(blocks)
    keys = [*keys, *blocks]                  # same rule as tokens(): a block listed only in blocks still shields
    for s, e, k in match_text(text, keys, bound):
        if k in blocks:
            continue
        if s > last:
            out.append([text[last:s], None])
        out.append([k, k])
        last = e
    if last < len(text) or not out:
        out.append([text[last:], None])
    return out


def run_cases(path: Path = CASES, impl=None) -> list[str]:
    """-> failures. Each case: keys, text, optional blocks and bound, expect = segments."""
    seg_fn = impl or segments
    bad = []
    for c in json.loads(path.read_text(encoding="utf-8"))["cases"]:
        args = (c["text"], c["keys"], set(c.get("blocks", [])))
        # a case without `bound` goes through the DEFAULT argument, so the default itself is pinned
        got = seg_fn(*args, c["bound"]) if "bound" in c else seg_fn(*args)
        if got != c["expect"]:
            bad.append(f"{c['id']}: got {got}, want {c['expect']}")
    return bad


if __name__ == "__main__":
    if sys.argv[1:] == ["--selftest"]:
        if not CASES.exists():   # a consumer copy: the cases stay in the vault (role test is not installed)
            print("term_match: UNVERIFIED (term_cases.json is not beside this file; run it in AssetVault)")
            sys.exit(2)                      # non-zero: a CI that reads only the exit code must not pass an unrun check
        fails = run_cases()
        for f in fails:
            print("FAIL", f)
        n = len(json.loads(CASES.read_text(encoding="utf-8"))["cases"])
        print(f"term_match: {'OK' if not fails else f'{len(fails)} FAIL'} ({n} cases)")
        sys.exit(1 if fails else 0)
    print(__doc__)
