# audience-fit-gate

The `audience-fit` skill's first instrument. Two of its prose rules are
determinable; this makes them so, and refuses to pretend about the third.

```powershell
python afgate.py voice  <companion>              # no builder artifact in the reader's text
python afgate.py values <original> <companion>   # every number accounted for by the original
python afgate.py limits <original> <companion>   # inventory of the original's limitations (REPORT)
python afgate.py scope  <companion> [<original>] # universal quantifiers: added over the original = WARN
python afgate.py terms  <companion>              # prose near-names of the drawing's node labels (WARN)
python afgate.py sums   <companion>              # table total rows recomputed (WARN)
python afgate.py style  <companion>              # zh-TW sentence mechanics (WARN)
python afgate.py all    <original> <companion>
python afgate.py --selftest                      # two-sided calibration, 52 checks
```

Exit `2` = FAIL · `1` = WARN only · `0` = clean · `3` = could not run (Python older than 3.10;
3.12 is the tested version).

## What each check rules on

| check | rules | severity |
|---|---|---|
| `voice` | closed classes a non-builder reader cannot act on: a bare `<n> PASS`, a file path, a sha, a run id, a gate/invariant id | **FAIL** in the reader's main text. A sha needs at least one a-f letter, so a plain 8+ digit number (tax id, phone) is not one; an upper-case hash (Get-FileHash) needs 32+ characters, so an 8-character id like `AB12CD34` is not one (a shorter upper-case hash is then missed); a sha glued to Chinese text is still read (2026-11-01) |
| `voice` | builder vocabulary (`stdout`, `schema`, `commit`, `閘`, …) | WARN — a `power_user` audience legitimately reads some of these |
| `values` | a number in the companion that no number in the canonical original explains, under identity or a **named** transform | **FAIL** — "invent nothing", made checkable. A number glued to Chinese text (`高33.6%`, `約1,234`) is read whole (before 2026-11-01 it was skipped or cut) |
| `limits` | the original's limitation lines and which have no lexical counterpart | **reports, rules on nothing** |
| `scope` | a line with a universal quantifier (每篇 / 每次 / 一定 / 固定 / 所有 / 一律 / 永遠 / always / every / never) — "some" written as "all" | WARN when the original lacks that quantifier (the rewrite widened the claim); INFO when the original has it; UNDET with no original. The other direction (2026-11-01): a quantifier the original uses and the reader edition never does is listed as INFO `dropped-universal` (所有 → 部分 may be a narrowed claim); INFO because a redraw aggregates and drops sentences, so a WARN fired on every real pair. Document-level, so it cannot point at the line; narrowing stays a human reading. **Never FAIL** |
| `terms` | a prose string one edit away from a node label of the page's own drawing (`任務隊列` vs the drawn `任務佇列`): one thing, two names | WARN; UNDET when the page has no drawing. **Never FAIL** — a near-name can be a different thing |
| `sums` | a table row labelled 合計 / 總計 / 小計 / total whose cell differs from the sum of the rows above it (integers exact; decimals and % within half a unit per row) | WARN; a % total inside the rows' range is a weighted rate → INFO, not checked. **Never FAIL** — a total row may be a subset |
| `style` | zh-TW sentence mechanics: a sentence over 50 characters, more than two 的, a nominalising verb (進行 / 做出 / 予以 / 加以 + noun), a stock phrase (賦能, 全方位, 至關重要 …) | WARN. **Never FAIL** — style is a reading aid, not a defect class |

`terms`, `sums` and `style` (added 2026-10-23) are borrowed from archify's
explainer-authoring skill (MIT; re-borrow ledger B-14 / B-15 / B-16 in
`outputs/skill-reviews/archify-graphify-reborrow-2026-10-23.md`): one name per
thing, recompute every derived number before delivery, Chinese sentence
mechanics. They are screens, so they WARN and never FAIL.

`scope` (added 2026-10-11, borrowed from a counterpart's recon playbook,
its pit 7) is a screen for reports that
SUMMARISE DATA (posts, corpora, runs): each hit sends you back to the raw data
to count the proportion. First run, declined pile read by hand: the six
accepted owner views in `outputs/diagram-authoring/` gave 24 single-file hits,
all mechanism guarantees ("每次開場都在", "重試一律重新探測") and 0 data
over-generalisations — on a design document the single-file list is mostly
noise; the two-file WARN (a quantifier the original never used) is the useful
signal. `一定程度` is excluded ("to a degree", not "always").

## Two scope facts, both measured

**The delivery apparatus is not the reader's text.** audience-fit *mandates* a
provenance block (canonical link, audience, as-of anchor) and, for an A1
re-render, the aggregation mapping table. Both legitimately carry paths, shas
and lesson ids — they address the auditor who must trace the companion back.
The gate's first run against an already-accepted owner view
(`ccfg-retrieval-audit-f1-owner-view.html`, user gate PASS 2026-08-31) raised
6 FAILs, every one inside those two regions. So `voice` splits the text at the
first line naming the apparatus, closes only over the main text, and **prints
both zone sizes** — a reader paragraph that drifts below the marker would
otherwise be exempted silently. `--no-apparatus` disables the split.

**`values` is a SCREEN, not a proof, and says so in its own output.** Only
tokens with 3+ significant digits are certified; 1–2 digit tokens are counting
words, thresholds and round figures, and the output states how many fell in
each class rather than hiding the weaker half. audience-fit *transforms*
numbers on purpose (`1.336×` becomes `比基準高 33.6%`), so a companion number is
accounted for by identity or by one of nine named transforms — the transform is
printed beside the match. `--allow VALUE=REASON` carries a legitimate exception
inline.

Since 2026-11-01 (an outside read-only review and a follow-up audit): numbers
glued to Chinese text and full-width forms (`９１．４％`) are read; thousands
separators only in groups of three (`12,15,18` is three numbers); rounding is
half-up to 6 places (`812.5` → `813`); a sign moved into words (`-12.5%` →
`降低 12.5%`) is WARN `sign-moved`, because only a human can check the direction word; dates are checked on their own
(`2026-08-01` = `2026/8/1` = `2026年8月1日`; a date the original lacks WARNs
`unmatched-date`, not FAIL, because the mandated as-of anchor may sit in the
main text; the years of the original's dates count as numbers, so `2026年度` is
explained by `2026-08-01`); and `values`, like `voice`, reads only the companion's main
text above the provenance marker, prints how many characters it read, and honours
`--no-apparatus`. Both WARN `apparatus-early` when that marker sits in the first half
of the text, because everything below it is exempt (counted once under `all`). Only
full-width digits and `－＋／` are folded, not the whole NFKC set: `．` between two
digits of any width becomes a decimal point, `，` only between full-width digits, so
`100，200，300` stays three numbers and `10⁶` is not read as 106. A date's year
explains a number by identity only (`202600` is not `2026 × 100`), and a transform
that overflows explains nothing. Exit 3 means the gate could not run (missing file, UTF-16 input, bad
`--allow`, usage error).

## Calibration

`--selftest` builds its fixtures (a canonical original plus clean, invented-number,
leaky, widened, narrowed, glued, dated and table companions) and requires 52
separations, each with a known-true and a known-false side, including "`limits`
never returns FAIL", "33.6% is recognised as a named transform of 1.336" and the
exit codes of the CLI. Artifact-level baseline: the three accepted owner views in
`outputs/diagram-authoring/` return 0 FAIL.

Calibration of the three screens (2026-10-23/24), on real files, with the declined pile read by hand:

- **`terms`** — 6 accepted owner views: 1 WARN (`關係畫 ≈ 關係圖`, a false positive: 畫 is the verb).
  Two false positives from the first run are now excluded: windows containing punctuation (`三份「掛載檔`),
  and windows that are the label plus a particle.
- **`style`** — same 6 views: 0–8 long sentences per page, 0–3 heavy-的 sentences, 1 nominalising verb.
  `·`-joined status fragments split as sentences, so a status strip no longer reads as one 200-character sentence.
- **`sums`** — the 6 views carry no total rows, so it was field-tested on two reports that do:
  `outputs/shell-command-error-audit-2026-08-18.md` and `outputs/proposal-record-type-20261014/10-inventory.md`.
  That run found two defects in the first build, both fixed:
  - A bold `**合計**` row was not recognised: 0 of its 8 cells were checked.
  - A rate column (`錯誤率 5.7%`, a weighted mean) raised a false WARN.
  - Controls generated from those two tables (every integer total cell +1) are caught 2/10 by the first build and 10/10 now.

Artifact baseline: 0 WARN on both reports, plus 1 INFO for the rate cell.

Borrowed 2026-09-10 from the gates of an earlier research audience pack
(a ParityGate and a record-number check).
ParityGate proper does not transfer — an audience-fit companion is a rewrite,
not a copy — but its question does, asked of the parts that must not change.

Review-when: audience-fit stops mandating the provenance block or the
aggregation table (the apparatus zone then has no basis), or a companion class
appears whose numbers are legitimately new (then `values` needs a declared
source beyond the original).

**If `values` ever false-accepts a number a human then catches, that is not just
a bug here — it is the firing trigger for the NumberRef extraction**
(`outputs/numberref-extraction-deferred-2026-09-10.md`, deferred 2026-09-10 for
want of a second customer). This check matches value to value across two prose
documents; the deferred one resolves a value to the FIELD that produced it, and
a false accept is the evidence that the screen is not enough. Record the case in
that file before fixing anything here.
