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
python afgate.py --selftest                      # two-sided calibration, 20 checks
```

Exit `2` = FAIL · `1` = WARN only · `0` = clean.

## What each check rules on

| check | rules | severity |
|---|---|---|
| `voice` | closed classes a non-builder reader cannot act on: a bare `<n> PASS`, a file path, a sha, a run id, a gate/invariant id | **FAIL** in the reader's main text |
| `voice` | builder vocabulary (`stdout`, `schema`, `commit`, `閘`, …) | WARN — a `power_user` audience legitimately reads some of these |
| `values` | a number in the companion that no number in the canonical original explains, under identity or a **named** transform | **FAIL** — "invent nothing", made checkable |
| `limits` | the original's limitation lines and which have no lexical counterpart | **reports, rules on nothing** |
| `scope` | a line with a universal quantifier (每篇 / 每次 / 一定 / 固定 / 所有 / 一律 / 永遠 / always / every / never) — "some" written as "all" | WARN when the original lacks that quantifier (the rewrite widened the claim); INFO when the original has it; UNDET with no original. **Never FAIL** |
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
accounted for by identity or by one of ten named transforms — the transform is
printed beside the match. `--allow VALUE=REASON` carries a legitimate exception
inline.

## Calibration

`--selftest` builds four fixtures — a canonical original plus a clean, an
invented-number and a leaky companion — and requires nine separations,
including "`limits` never returns FAIL" and "33.6% is recognised as a named
transform of 1.336". Artifact-level baseline: the three accepted owner views in
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
