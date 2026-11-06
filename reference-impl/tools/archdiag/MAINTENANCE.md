# archdiag — instrument maintenance (環境級維護/檢查)

> status: active maintenance doc | born 2026-08-29 (F3 close-out, user directive) | consumer: any session editing this library or auditing the environment
> 導讀（中文）：本檔是儀器的維護契約——「必備 (mandatory)」是事件驅動的硬性步驟，漏做即儀器漂移；「參考 (reference)」是做法備忘。環境級掃描入口在 `ops/references/integrity-sweep.md` check 27。

The library's receipts make frozen deliverables byte-verifiable; the price is
that ANY silent change to emitted bytes is instrument drift. Every item below
is a property of these assets, event-triggered — not a schedule.

## Mandatory (必備) — event-driven, hard requirements

- **M1 — Receipt regression after ANY edit under `tools/archdiag/`.**
  Regenerate every committed deliverable and require a byte-level no-op:

  ```git bash
  node ~/.claude/tools/archdiag/m1.mjs --restore
  ```

  Must exit 0 (every folder `ok`). The folder list is derived, not kept by
  hand: every folder an archview envelope's `output` names (system-hmi
  discovery, so out-of-tree pages such as tg-outpost are included) plus
  `outputs/diagram-authoring/`. It compares bytes before vs after the run,
  and `--restore` writes the pre-run bytes back, so another repository is
  never left modified. Exit 2 = a build failed, or discovery failed and
  only the floor folder was checked (not a full M1). Any diff = receipts of ACCEPTED artifacts changed →
  either revert the library edit, or it is a version bump under the
  post-acceptance protocol (D-043: report + user-ruled bump; never silent).
  Motivating case: the eol hazard (commit 6fbe14c) — a CRLF checkout would
  have changed every emitted byte with all tests green.

- **M2 — Two-sided calibration after ANY `selfcheck.mjs` edit.** Break one
  known instance (e.g. rename a marker out of DEFS → expect exactly the
  counted `dangling-reference` diagnostics) and restore (→ expect 0). A
  check-set edit shipped without firing its positive control is the
  first-run-green failure class (a checker that has never gone red is
  uncalibrated).

- **M3 — LF pin for every NEW receipt asset, the day it is born.** Any new
  `*.build.mjs` / emitted `*.html` outside the pinned globs must join the
  `.gitattributes` `text eol=lf` block. Template literals inherit SOURCE file
  endings; an unpinned receipt asset corrupts on the next CRLF checkout.

- **M4 — Router acceptance after ANY `route.mjs` / provider edit.** Re-run
  the S2 acceptance (l2b re-route: 15/15 edges, 0 through-node, crossings
  0/0, bend total 15) and M1. Determinism is part of the contract: same model
  ⇒ same routed pts (no randomness, fixed iteration orders).

- **M5 — Enums stay derived.** `NODE_KINDS`/`EDGE_TYPES` derive from
  `emit.mjs` FILL/EDGE keys (schema.mjs imports them). Never enumerate them a
  second time anywhere — a second list is a fork that drifts. Same property
  for the palette (2026-09-05): README's style-token table is the OUTPUT of
  `node tools/archdiag/tokens.mjs` — after any FILL/STROKE/OVL/EDGE edit,
  regenerate it and run `tokens.mjs --check` (text/fill AA 4.5:1 = FAIL;
  edge-vs-page 3:1 = WARN) before M1.

- **M6 — Font-substitution sweep after ANY `emit.mjs` layout edit or
  `selfcheck.mjs` #1 edit (born 2026-09-02, external validation intake).**
  `getBBox()` height includes leading and varies by family (~7% between
  Segoe UI and Noto Sans TC); a PASS measured under one font is a
  source-environment fact, not a portability claim — an external macOS run
  reported 44 `label-overlap` on the same bytes this machine passed. Serve
  every committed deliverable (R1), then in-page force
  `text{font-family:<F>!important}` for each of Segoe UI / Noto Sans TC /
  Microsoft JhengHei / Yu Gothic / Arial, re-run the pair scan with the
  shipped PAD, and require 0 under all five. Noto Sans TC is the tallest
  metric available locally and reproduced the macOS count exactly (44,
  per-view 9/9/7/8/11) — it is the local proxy for the CJK fallback class.
  Do NOT widen PAD or exempt title/subtitle pairs to pass this sweep (user
  ruling 2026-09-02, Q2): fix the layout so the gap has headroom. The
  `receipt` block in `window.__geometryReport` records which font actually
  measured (see selfcheck.mjs) — a report without it is not comparable
  across environments.

- **M7 — A new router rev ships with an A/B record (born 2026-11-07, rev 4).**
  M1 only proves issued pages kept their pinned bytes; it is blind to what a
  new rev does to drawings. Before the default `rev` changes:

  ```git bash
  node ~/.claude/tools/archdiag/rev-ab.mjs --old <cur> --new <next> --out <scratch dir> --codes <codes the new rev prices>
  ```

  Every UNEXPLAINED edge is either a bug (rev 4's lost title-anchor guard:
  7 views) or a deliberate general cost term, and the latter's views go to a
  blind review (unlabeled pairs, own key written first) before the owner
  rules. Excluded builds are named with their error. "M1 is green, the old
  pages did not move" is the excuse this answers: the new rev's drawings are
  the ones no check has seen.
  The same change is not done until its rule reaches the readers: the line
  rules in `skills/diagram-authoring/references/notation-precision.md` §2,
  the R-list in `skills/audience-fit/references/presentational-view.md`, and
  the public pack (its next release). "The tool already enforces it" is no answer: a
  skill reader draws by hand from the list (rev 4 shipped without both lists;
  the owner caught it, 2026-11-07).

## Reference (參考) — procedures

- **R1 — Render-verify recipe**: serve the folder
  (`python -m http.server <port> --bind 127.0.0.1` from a copy dir), navigate
  with playwright-headless (`file://` is blocked), read
  `window.__geometryReport` (`{pass, diagnostics, stats}` — measuring pass
  runs once on load, all panes). Expect one favicon-404 console line from the
  bare server. Screenshots: bare filenames land in the session cwd and only
  the allowed roots are writable — write there, then move
  (carrier-playbook, measured 2026-08-27).

- **R2 — Provider swap (`'archify-adapted'`)**: requires a fresh archify
  clone (scratchpad clones evaporate; the durable copy is only
  `vendor/archify-geometry.mjs`). Build behind the `providers{}` seam; accept
  via the same S2 suite plus an F3-class field round. Trigger to build it at
  all: a field round where `'channel'` fails its targets (eval §7(b)) — do
  not build it speculatively (one interface, one implementation).

- **R3 — Delta discipline**: diff UNROUTED models (`pts` are geometry noise);
  `stripOverlay` recovers a base only when overlay flags are the delta axis —
  cross-check the stripped base against an independent fact (F3 used
  `git ls-tree` of the target's main branch) before trusting the table.

- **R4 — Environment-level check classes this arc surfaced** (apply to any
  instrument, not just archdiag):
  - *Receipt regression* — frozen-artifact byte-stability is silent-failure
    class; executable home: integrity-sweep check 27.
  - *Trigger-carrying metrics* — a recorded trigger condition living only in
    a dated report rots; land it in an executable home
    (code-review-deep-checklist Mode B, Trend-framing rule, 2026-08-29).
  - *UAT debt visibility* — machine-green/human-unverified surfaces
    accumulate silently; count unrun manual gates at checkpoint time and say
    the number out loud (the F3 target had six).

## Log — 2026-09-05: checks #9/#10 + a11y contract; receipts re-issued (diagram-design borrow review P-2)

- **Changed**: `selfcheck.mjs` gained #9 `label-over-node` (a pill's CENTRE inside
  a node) and #10 `shared-anchor` (two different edges' anchors on one border
  side with 0 < gap < grid; gap 0 = deliberate bundle). `asserts.mjs` gained the
  build-time faces of both (pill centre on `pillAt`; shared anchor on model pts)
  and `a11yAsserts(html)` — `role="img"` + `aria-labelledby` → first-child
  `<title id="t-<view>">` + `<desc id="d-<view>">`, ids unique, read from the
  EMITTED page. `emit.mjs` emits the title/desc pair per `svg.dia`; `index.mjs`
  throws `A11Y FAILED` before writing. Record + ledger: `outputs/skill-reviews/
  diagram-design-borrow-review-2026-09-05.md` §六 B-1/B-2/B-3.
- **M2 calibration, both ways**: build-time 20/20 controls (scratch script —
  gap = grid → 0, gap 0 → 0, gap 4 → exactly 1 naming both edges; pill centre
  in corridor / on the border → 0, inside → 1 naming edge + node; a11y clean
  page → 0, and no-role / title-not-first / duplicate id / labelledby mismatch
  / empty title / no svg each → its named problem; `data-id` is not an id).
  In-page (headless Chromium, a same-origin harness of 1400×900 iframes): the
  7 accepted artifacts PASS with 0 diagnostics; a synthetic positive page fires
  exactly `label-over-node` + `shared-anchor`; its negative twin and a clean
  `build()` page PASS.
- **Threshold decision (ledger, model, reversible)**: the first form of #9
  (pill bbox ∩ node rect) fired 70× across all 7 accepted artifacts — depth
  3–18 px, every pill centre OUTSIDE the node — i.e. border straddles the
  user's visual gates had already accepted, while #1 already forbids a pill
  over node text. The reader-visible defect that remains is a label attributed
  to the wrong object, so the rule is: centre inside ⇒ error. A checker that
  fails every accepted artifact on first run is the instrument's threshold
  being wrong, not seven accepted deliverables being wrong.
- **M6 not triggered**: no layout edit in `emit.mjs` (title/desc do not
  render), #1 untouched; #9's centre is font-immune by construction
  (`text-anchor="middle"` at `pillAt`), #10 reads model pts.
- **M1**: `archdiag-capability-set-v1.html` (not on the library) byte-identical.
  The 7 library artifacts changed bytes by exactly the a11y pair + the in-page
  script — pre-ruled (R-2, record §七 P-2: "a11y 屬性會改 bytes，需重發收據並
  記錄"). Footers untouched; nothing drawn changed. Receipts re-issued:

| artifact | sha256 before (HEAD e14fcb0) | sha256 after | bytes |
|---|---|---|---|
| ccfg-retrieval-audit-f1 | 4d508771e7c459e4268d2b54aa25e62f34535001cb4ab9ee120b6be17ed05759 | a36eb29f4315acb27cffcae44db5284f39b7aa8d99e83a6d2ec11c45a5901d43 | 42687 → 46813 |
| claude-home-audit-f1 | 50d4a666341fec2fb35de9b56c523620259c7f0f56bfbbb9e21a6cd809f85c50 | 944d30aba588ec1cc1e1c8028cd035bf3219515f7a9a04ee47941d746f35ec2f | 117065 → 122096 |
| dit-audit-f1 | 426bd3e3395180a6ce61dc32e6f144b9a013005ea57f436530d98c7f0942ecee | 785be979bc597835041cee412069c20203a2a60a140e0ab34e3cb28404be9165 | 66789 → 71502 |
| mfp-audit-f3 | d676d054025dde30b4dcb40b9076da64564a5292951e961d7e91a487e5bddad8 | 5f5d40d4c1d097971a8632c005a2b11bb4dbb091b75570ddbcea8cd2127b91a5 | 101296 → 106393 |
| mfp-audit-f4 | 90ae1f0596e76e36ee7845e7dd449c1bd3d47c0f30850a9ff2453e5cca4e439c | cc4e4f8d5618771cd96b8e7d77f638898439423d68826a51eb5cb1b57fe0d155 | 40583 → 44530 |
| mfp-audit-f5 | 44349d17bf6d1e877278c14ee59e175b78ea21a702f36cc47a8bb60ca6a63464 | 9bdabd423e007bc8e72f9b81a46f4ebb1b67114cdd2b3ac05f18d8b4e9a7cbce | 67800 → 72655 |
| prism-audit-f2 | 558c035dfc74d6eb448c77a4d07b7981579c635c8569d06d9c452b4947b7791c | 421a75e502447dae452bdecef595a71be9aef91e621dbf3febecd4169430c787 | 76705 → 81752 |

- **R1 addendum**: to read every artifact's report in one evaluate, serve a
  copy dir holding the pages plus a harness page that loads them in
  same-origin 1400×900 iframes and collects `contentWindow.__geometryReport`
  once all are ready (the pattern used above).

## Log — 2026-09-07: the palette's other half stops being a transcription

`tokens.mjs` claimed in its own header to be DERIVED from `emit.mjs` (M5: the
palette is never listed a second time). It was — for `FILL`, `STROKE`, `OVL`
and `EDGE`. Its `TEXT` and `SURFACE` tables were a hand copy carrying a
`grep-verified 2026-09-05` receipt, so `--check` graded seven foreground and
surface values against a snapshot of themselves.

- **How it was found**: writing the acceptance item for the share copy, not by
  reading. The first control reached for — mutate the node title colour in
  `emit.mjs`, expect red — came back **0 fail, exit 0**. A second control on
  `FILL.block` turned it red as expected. One instrument, two halves, only one
  of them wired.
- **Fix**: `emit.mjs` now defines and exports `TEXT` (title / sub / container /
  badge) and `SURFACE` (pill + stroke, container + stroke, page) and uses them
  at every emission site; `tokens.mjs` imports them and states no colour of its
  own. Both controls now fire: title colour → 7 fail / exit 2, `FILL.block` →
  2 fail / exit 2.
- **M1 — receipts**: one emitted byte changed, `background: #fff` →
  `background: #ffffff`, because the page background is now written from
  `SURFACE.page` (it has to be: it is the surface every edge stroke is graded
  against, and a gate may not read a copy of its own subject). Same class as
  the 2026-09-05 a11y change and the same R-2 ruling applies — **the 7 library
  artifacts' receipts are due for re-issue**; nothing drawn changed. Not done
  in this session: the build scripts live in the deliverable tree, not here.
  **DONE 2026-09-08** (commit 53e8e38): all nine build scripts re-ran clean and
  the diff was exactly seven files × one line, every one of them the predicted
  `background: #fff` → `background: #ffffff`. The prediction landing byte-exact
  a day later is the evidence that nothing else drifted in between — which is
  the only reason a receipt is worth carrying.
- **Generalised**: a file whose header says "derived from X" is making a claim,
  and the only thing that tests it is a control that changes X. This one was
  half-true for two days inside the file that exists to enforce M5.

## Log — 2026-10-10: `<html>` declares its page class; receipts re-issued

- **Changed**: `pageHtml` emits `data-page-class="${esc(doc.pageClass || 'diagram')}"`
  on `<html>`. The global width rule (`rules/deliverable-doc-refs.md`) requires
  every human-facing page to declare its class; without it `page-fill-gate`
  only inferred one. Found as gap G7 while building `mvlab-sync-audit-f1.html`
  (gated then with `--class diagram` as a workaround). `doc.pageClass` is the
  override and, unlike the other `doc` strings, is escaped (it lands in an
  attribute).
- **Controls**: default → `diagram`; `pageClass: 'showcase'` → `showcase`; a
  value carrying `"` → `&quot;` (attribute stays closed).
- **M1**: baseline on HEAD e6f4df7 before the edit was a byte no-op. After it,
  8 of 11 builds changed by exactly one line each, `<html lang="zh-Hant">` →
  `<html lang="zh-Hant" data-page-class="diagram">` (+26 bytes); nothing drawn
  changed. Unchanged: the two owner-view builds (they already write their own
  `<html data-page-class="diagram" …>`) and `archdiag-capability-set-v1` (not
  on the library). In-page §4: 8/8 PASS, 0 diagnostics. `fill_gate.py`
  without `--class`: 24/24 rows PASS, class read from the page, controls fired.
  `tokens.mjs --check`: 0 fail (the `edge absent` 3:1 WARN predates this).
  M6 not triggered (no layout change). Receipts re-issued (bump requested by
  the user in the task that ordered this edit):

| artifact | sha256 before (HEAD e6f4df7) | sha256 after | bytes |
|---|---|---|---|
| ccfg-retrieval-audit-f1 | 86ec94cc182811986af9a24bc8e686d436cd1ec36d9a848ec799f502da9710e7 | 86dadcf18eb60144fdb2fc1654c1122a88d7a518355ce8375d0323bf1600785c | 46816 → 46842 |
| claude-home-audit-f1 | 8e4b8e5243053d0ac869ecbe4eac5d7259827634b1782d6148e0eb9029a6c9ee | 91d6ac1fd5a302169c3d16ac5d54a37d7a929a24080447a30cbb5d6e3604e1d8 | 122099 → 122125 |
| dit-audit-f1 | a8e853acbd40c4d4442db87400bb839057935a15a71a610c7ef69dcb180ec550 | 2323386159170ba83431f582cbd3c7380eed86e19c487d69f9ed46a1de6089c1 | 71505 → 71531 |
| mfp-audit-f3 | b91d482f2856fea69d8fd7d8ce41b05d87a1b886a009afc043b0b45eda62513c | fe3aec3ea50fab0c192a5e8d50b3b3c0182e0ea201f1bc4d91ba6c740dc37482 | 106396 → 106422 |
| mfp-audit-f4 | 06a6de500d7d1783f670ee59b19e0309b4ce433ae8a6ee0b9e458417900a114c | 12d6da1cc173414eb66716ac1165e9c6899b18cd60265fd2ff67e20e34c6d21a | 44533 → 44559 |
| mfp-audit-f5 | da6af25577118fe8c66417ad16192797334204d8dd5950ab3246a17e304e0b94 | 7d1d4fe194c6f80e9b964d91f72412dbec5efda0447194d274661db67c83caa9 | 72658 → 72684 |
| mvlab-sync-audit-f1 | 945bb5c3d7ba655782b7402c5fa529d14b3cf80bdecac6b1acf926cf94c777a1 | 27756eed580e1f04b7c4a073f4427a99a4e669a00f16c50fc4eaaed31477fc6c | 38477 → 38503 |
| prism-audit-f2 | 8119aa8c529b6b4089213bd39ac7d81ef047e2c2f221831ef132529a939a9e72 | 2c04e6d0d8a7865186d8bb4ffe104a9118904dabdd657726f6d073ae39354930 | 81755 → 81781 |

- **capability-set**: `archdiag-capability-set-v1` writes its own page instead
  of calling `pageHtml`, so the library fix did not reach it; its build script
  got the same attribute by hand (user ruling, same day). Rebuilt diff = the
  one `<html>` line; in-page §4 PASS 0 diagnostics; `fill_gate.py` 3/3 PASS as
  `diagram`. Receipt `0a3c67de9faf18700cff570a93ddced40a65fe0180ac9c6ef9e6b01a110eba6a`
  → `5fdd1dc70ad1b6abb5b5cc720f6161f73f27baea86d7126d2842f3f3701c2bea`
  (32868 → 32894 bytes). Now all 11 built pages declare a class. Dated measurement records under
  `outputs/diagram-authoring/*-measurement.md` keep their historical receipts.

## Log — 2026-10-19: topology-readability warnings (`topology.mjs`)

- **Why**: an outside fork of the share pack (a reader's engineering v4)
  shipped 22 of 36 views as one column of nodes plus one side trunk carrying
  every edge. That shape passes every §4 geometry check trivially. The checks
  prove a drawing is not broken; none of them proves it shows the topology.
  Proposal: `outputs/diagram-layout-degeneracy-20261019/提案單_架構圖拓撲退化檢查_20261019.md`.
- **Changed**: new `topology.mjs` (checks T1–T4, adapters, CLI, `--selftest`).
  `index.mjs` logs the warnings and returns `topology`. Severity is WARN only,
  because readability is not determinable from geometry.
- **Deviation from the proposal**: proposal T3 was the drawn-vs-table-only edge
  ratio. That needs the page's own edge tables, which are a dialect of one
  page, so it is not built. The determinable half ships instead: boxes in one
  line with 0 edges. The ratio stays in that reply's `measure_v4.py`.
- **Not in-page**: the in-page `geoStatus` reports geometry FAILs, and a
  readability WARN there would read as a broken page to an owner. The model
  face (build) and the artifact face (CLI on the bytes) cover both sides.
- **Calibration**: `--selftest` 10 cases (each check fires on a known-true
  and stays silent on a known-false, incl. a vertical chain that must NOT
  fire T1 and a `legend` view that is skipped) + adapter parity → PASS.
  Positive on real bytes: v4 → 28 WARN on exactly its 22 single-line views,
  0 on its 12 sequences and timeline. Negative: 20 accepted pages → 33
  views measured, 0 WARN, 10 NOT MEASURED (hand-drawn owner views / pages
  without `data-view`). f3 margins: largest run 8/23 (txd, 35% < 50%).
- **M1**: 13 builds rebuilt with the hook → 13/13 byte-identical, 0
  topology WARN (warnings never touch the emitted bytes).

## Log — 2026-10-21: archview envelopes (`envelope.mjs`)

- **Why**: no machine knew which audit views exist, what they cover, or when
  they were last checked against the system, so staleness was remembered or
  missed. Proposal (B0+B1 ruled, B2 deferred):
  `outputs/archview-coverage-20261021/提案單_架構圖覆蓋盤點與過期管控_20261021.md`.
- **Changed**: new `envelope.mjs`; `build()` takes `archview` (validated
  before writing), writes/keeps the envelope, returns it. Emitted page bytes
  are untouched. 12 pre-existing views backfilled by
  `outputs/archview-coverage-20261021/backfill-envelopes.mjs` without editing
  any frozen build script (Prism F2 marked retired).
- **Calibration**: `--selftest` both sides; mutant negative control (rewrite
  on every run) fails the M1 no-op case, exit 2.
- **M1**: 10 `build()` scripts here + `tg-outpost-audit-f1` rebuilt → 0 html
  diff, 0 envelope diff.
- **Known limit**: a hand-built page outside `build()` (owner views, the
  capability set, facet-layer's Python builder) gets an envelope only by hand
  or backfill; HMI cannot find an audit page that has none.

## Log — 2026-10-23: evidence anchors resolved at a pin (`anchors.mjs`, B-10) + provenance delta class (B-11)

- **Why**: `schema.mjs` only proved every element HAS an `ev`; nothing proved it
  points at anything, so a reader of the model had to re-check every edge —
  which is what a map exists to save. Source: re-borrow ledger B-10/B-11
  (`outputs/skill-reviews/archify-graphify-reborrow-2026-10-23.md`, archify's
  repository evidence passport and architecture-delta).
- **Changed**: new `anchors.mjs`; `build()` resolves anchors when
  `archview.anchors = {root, at}` is declared (FAIL before writing on
  `anchor-missing` / `anchor-out-of-range` / `anchor-range-on-tree`), logs drift
  since the pin as WARN, and the envelope's archview block gains `anchors`
  (only when declared — older envelopes keep their bytes). `delta.mjs` moves
  `ev` from `semantic` to a new `provenance` class (`†` in rows) and adds
  `factChanged` / `provenanceOnly` / `geometryOnly` totals; the Σ row text
  changes only when a provenance change exists.
- **Calibration (real artifacts, pinned at their verification commits)**:
  rules-skills-reach-audit-f1 @f0b34edd — 103/154 resolved, 0 FAIL; declined
  pile read by hand: 42 URLs + 2 `OBS`, 7 git-ignored paths (telemetry,
  `skills/synced`). Generated controls: every resolved part mutated — path
  103/103 caught, range 71/71 caught. hook-spine-audit-f1 @cc546040 — 4/237
  resolved, 0 FAIL, 233 declined (abbreviations `REG`/`INV`/`DOC`/`SG`/`GL`/`NB`
  … against its own legend — that page predates machine-form anchors in
  practice); mutants 4/4 + 3/3. Two parser defects were found by this run and
  fixed before ship: bare spaces swallowed abbreviation prefixes into the path
  (now: a path is one token, quoted if it holds spaces), and a typo of a
  root-level file (`CLAUDE.md`) was declined instead of failed (now: a bare
  name no file in the tree carries FAILs; 17 escaped mutants → 0).
- **B-11 controls (old vs new on the same input, asserted value recorded)**:
  ev-only node change — old `semantic=["ev"]`, new `semantic=[]` +
  `provenance=["ev"]`; retitle and move — rows identical old vs new.
- **M1**: 15 builds → 15/15 html byte-identical. Two envelopes
  (hook-spine, rules-skills-reach) rewrite `ran_at` + path fields on EVERY run,
  identically on the pre-edit baseline: their build scripts call `build()`
  twice per run (a topology learning pass, then the real one), so the first
  pass always sees "changed". Pre-existing, not from this edit; left for its
  own ruling because the fix touches frozen build scripts.
- **M2/M4/M6 not triggered** (no `selfcheck.mjs`, `route.mjs` or layout edit).
- **Out-of-tree M1 (after merge, 2026-10-24)**: `<projects>\line-reply-agent\docs\architecture\tg-outpost-audit-f1.build.mjs`
  rebuilds with 13 changed lines of edge routes (e1, e3, e8, e14, e18 …).
  - Not from this round: archdiag at 2d22ecfe (before it) and at 8c62383f (after it) emit the same bytes (sha256 562393ef…).
  - Bisected to be621e13 (2026-10-21, capsule anchors on the drawn outline). The archdiag tree at its parent reproduces the committed page exactly (89c7d553…, LF).
  - So the 2026-10-21 fix moved this accepted page's receipt. Its M1 rebuilt only the in-tree pages, because the M1 loop above globs `outputs/diagram-authoring/` only.
  - The rebuild was reverted (the other repo is left as committed). Bumping the receipt is a user ruling under D-043.
  - Layer gap: M1 has no list of out-of-tree `build()` callers. The archview envelopes discovered by system-hmi are that list (the `output` field).

## Log — 2026-10-24: M1 reaches out-of-tree pages (`m1.mjs`); learning passes write nothing

Proposal `outputs/archdiag-m1-reach-20261024/提案單_收據回歸涵蓋庫外圖面_20261024.md` (甲, 乙), user ruling 2026-10-24.

- **甲 — `m1.mjs`**: the M1 folder list is the `output` folder of every archview
  envelope system-hmi discovers, plus `outputs/diagram-authoring/` as a floor.
  Compares bytes before vs after per folder; `--restore` writes pre-run bytes back.
  Positive control: on the first run it reported `DIFF` for
  `<projects>/line-reply-agent/docs/architecture` (the known be621e13 drift), which
  the old in-tree loop could not see. Integrity sweep check 27 now calls it too.
- **乙 — `build({write:false})`**: runs every check and returns html/topology,
  writes neither page nor envelope. hook-spine and rules-skills-reach use it for
  their topology learning pass. Controls: old build → M1 rewrote 2 envelopes;
  new build → 0 changed. (`archview:false` alone would not do: the learning pass
  still wrote the page, so the real pass always saw "changed".)
- **tg-outpost receipt bump (D-043, user-ruled)**: rebuilt with current archdiag,
  89c7d553… → 562393ef… (87,514 bytes), committed in that repo as c5ea6cc.
  The same sha the pre-edit library emitted, so `write:false` changed no bytes there.
- **M1 after all three**: 2 folders, 12 builds, 0 changed, exit 0. Envelope selftest
  PASS; system-hmi `archviews:` controls PASS.
- **Review follow-up (same day, non-author code-reviewer)**: m1.mjs could report a
  false clean. Fixed: malformed or duplicate archview envelopes, a missing envelope
  folder, an already-uncommitted receipt, and unknown flags now exit 2. Deleted files
  are reported and restored. A thrown error restores the folder and exits 2. A page
  with no `<page>.build.mjs` beside it is a WARN (today: facet-layer-arch-v1, a
  Python generator). Controls: normal → 0; `--restor` → 2; one byte appended to
  tg-outpost html → WARN + DIFF, restored, exit 2; a bogus
  `archview-zz-control.snapshot.json` → WARN, exit 2. The delete and throw paths
  have no control run.

## Log — 2026-10-24: layout-legibility warnings (`layout.mjs`)

- **Trigger**: the owner looked at the re-issued tg-outpost page and said it has the
  same small problems as before. The in-page §4 run on it: PASS, 0 diagnostics
  (headless Chrome 155, 1920×1080). So the defects sit in classes no check measures.
- **Added**: L1 pill-over-node, L2 micro-jog, L3 shared-track (no common endpoint),
  L4 on-container-edge. WARN only, build console + return value; no page bytes.
- **Controls**: tg-outpost → 17 warnings (map: 4 L1, 2 L2, 6 L3, 2 L4; life: 3 L1),
  and each matches a spot in the owner's screenshot. hook-spine-audit-f1 → 0.
- **Spread** (unique warnings per page): ccfg 16, claude-home 55, dit 11, mfp-f3 59,
  mfp-f4 5, mfp-f5 14, mvlab 15, prism 13, rules-skills-reach 20; hook-spine,
  shared-design-layer, the owner views and capability-set 0. All 9 router users carry them.
- **Root cause, not fixed here**: `route.mjs` scores a shared track at 300 vs 1200 per
  crossing and has no nudging pass that separates coincident segments of unrelated
  edges. Its pill placer avoids text and pills, not node rects. Changing either moves
  the receipts of 9 accepted pages, so it is a separate ruling.
- **M1**: 2 folders, 12 builds, 0 changed, exit 0.

## Log — 2026-10-24: router rev 2 becomes the default; issued pages pin rev 1

Owner ruling 2026-10-24: "同意『從現在開始啟用』，已經出的就算了" — new drawings get the
legibility router, already-issued pages (tg-outpost included) are not redrawn.

- **Change**: `route()` takes `rev` (default 2). The 8 issued router users pin `rev: 1`
  (7 here + tg-outpost in line-reply-agent). The rev-1 code path is unchanged.
- **Root cause found on the way**: the corridor pool held one midpoint per free band,
  so every edge through a narrow band was forced onto one line; a penalty alone could
  not move them (first rev-2 try: tg-outpost L3 e4~e10 stayed). rev 2 offers every
  grid track in the band (the "nudging" step of standard orthogonal routers).
- **Tried and reverted**: dropping border tracks from the pool (left some edges with no
  route); placing pills "clear of all nodes" first (took slots later pills needed).
- **Evidence, 8 router models rev 1 → rev 2** (harness: flip the pin, build, restore):
  layout warnings 221 → 42 (L2/L3/L4 → 0; L1 pills that still touch a node remain).
  Cost: crossings over the declared budget +26 in total (mfp-f3 view 1 → 14,
  claude-home 3 → 8); ccfg and claude-home stop at `pill-unplaced` (assist mode:
  hand-author one `pillAt`). Not a regression for issued pages: they stay on rev 1.
- **M4 (S2 acceptance, prism-audit-f2 l2b re-route)**: rev 1 = baseline exactly
  (15/15, crossings 0/0, bends 15, pills 15/15, 34 ms); rev 2 = same, one warning
  fewer, 130 ms.
- **M1**: 12 builds, 0 changed, exit 0.
- **visual_review: accepted (owner, 2026-10-24)** — after comparing the tg-outpost map
  rev 1 vs rev 2 images: "rev 2 reads better than rev 1; keep it as the default".
  The other option offered was "too many crossings; lower the shared-track penalty",
  so the ruling covers the trade itself: extra crossings are accepted to keep lines
  and labels from overlapping, and a rev-2 view raises `declaredCrossings` instead
  of trading back. Written into the drawing rule in
  `skills/diagram-authoring/references/notation-precision.md` (2026-10-24).

## Log — 2026-10-25: first field use of rev 2 default and `archview.anchors` (A3 memory-compaction-audit-f1)

- **Page**: `outputs/diagram-authoring/memory-compaction-audit-f1.html` (6ff3ac24), 4 views
  (statechart `life`, seqView pair `seqok`/`seqfail`, statechart `memrec`), envelope
  `covers: memory`, R2.
- **Router rev 2 (default, not pinned)**: topology 0 WARN; layout L1 pill warnings went to 0
  by shortening three pills and widening column spacing, with no hand `pillAt`. Crossings
  declared at their measured values: life 1/1, memrec 0/0.
- **In-page §4**: one `viewbox-clip` on `seqfail` (a self-loop pill on the right-most lane
  reached x 1447 in a 1440 viewBox) → viewBox widened to 1520; pass at 1920×1080. seqView
  does not reserve right-side room for a last-lane self-loop pill. Size `vb` to
  `x0 + dx*(lanes-1) + ~180` when the last lane carries a self-loop.
- **anchors (B-10)**: 93 resolved at pin 4ad2d0a4, 23 non-machine, 0 untracked, 0 outside root,
  0 FAIL. The 23 are platform-doc URLs that the handoff requires as citations. A dot-file
  needs a `./` prefix (`./.gitignore`) to count as machine-form.
- **M1**: 15 envelopes → 13 builds, 0 changed, exit 0 (the facet-layer WARN predates this).
- **Learning pass**: `build({write:false})` via `--dry`; rebuild after commit is a byte no-op.

## Log — 2026-10-29: flowchart notation and line hops (`hops.mjs`, `flow-selftest.mjs`)

- **Why**: diagram-authoring had a "fewer crossings" rule but no rule for HOW a remaining
  crossing is drawn (a bare "+" reads as a join), and no flowchart symbol set (no diamond, no
  terminator). Gap found against a reader-facing flowchart series the owner pointed at.
- **Changed**: node kinds `term` (capsule, h ≤ w), `decision` (diamond inscribed in its bbox;
  w/h multiples of 2·grid; edges only at the 4 vertices), `note` (text, no outline); edge
  `annot` (dotted, no arrowhead). Router: decision side range = its midpoint, term capsule like
  ext. `textLayout(n)` in emit.mjs is now the single source of node text placement for the
  emitter and the router estimate (old kinds: identical numbers). Layout WARN L5 `hop-no-room`,
  L6 `decision-text` (cjkW estimate ⇒ WARN). In-page check #11 `decision-off-vertex`, emitted
  only into pages that draw a decision.
- **Byte discipline**: hops are opt-in (`crossingStyle: 'hop'`) and check #11 is gated, so no
  issued page moves. M1: 13 builds, 0 changed (rules-skills-reach-audit-f1 fails to build
  before AND after this change: its anchor `hooks/instructions_loaded_logger.py L137-202` is
  past that file's 160 lines — pre-existing, not touched here).
- **Calibration**: `flow-selftest.mjs` 30 cases, defective + clean input each. Mutants on a
  copy: router vertex clamp removed → the router case FAILs (it first PASSED on an aligned
  fixture that could not tell; fixture skewed); decision assert disabled → 1 FAIL; hop sweep
  flipped → 3 FAIL. In-page on the specimen (headless Chromium via tools/ui-shot): PASS,
  crossings 1/1, hop on `f5`; mutant with `f5` moved 16px off the vertex → exactly one
  `decision-off-vertex`. fill_gate PASS at 3 viewports. tokens `--check` 0 fail.
- **Learned on the render**: a hop drawn on a dotted `annot` line is invisible at reading size;
  the specimen was re-laid out so a solid line hops, and notation-precision §3 now says an
  annotation joiner crosses nothing.

## Log — 2026-11-01: hops by default, L7 bare-crossing, `hopEdges()`

- **Why**: the 10-29 rule said "draw a remaining crossing as a hop" while the tool defaulted
  to bare. Every audit page built after that (claude-home, feedback-pool, memory-compaction-f2,
  snapshots …) shipped bare "+" crossings and nothing warned. Owner ruling: fix all three
  (default, flowchart in the audit view set, audience-fit rule).
- **Changed**: `crossingStyleOf()` — absent ⇒ `'hop'`. `build({ crossingStyle })` sets a
  page-level default for views that set none. `bareCrossings()` + layout WARN L7. `hopEdges()`
  for hand-drawn SVG. 19 issued build scripts here + tg-outpost-audit-f1 (line-reply-agent
  31dcf9b) pin `'plain'`.
- **Byte discipline**: M1 with the pins: 0 page bytes changed by this work. Without the pins
  26 + 2 files changed (hops and junction dots), which is why the pin exists. Two pre-existing
  non-hop drifts surfaced and were left: system-hmi-audit-f1 build throws its own tripwire
  (`lock.py` now uses O_EXCL, c6a369a3 → "redo G-H2"); health-checks-audit-f1 gap table cites
  L540-544 where the source now sits at L550-554.
- **Calibration**: flow-selftest PASS with 8 new cases. Mutants on a copy: default back to
  `'plain'` → 4 FAIL; L7 line removed → the L7 case FAILs.
- **Same day, re-issue (owner: 「都改吧，不要跳警告了」)**: pins reverted, every page rebuilt
  with hops. The first re-issue exposed false junction dots: rev-1 pages ride unrelated edges
  on one track, and 32 of mfp-audit-f3's 57 dots joined edges with no common node. Junctions
  now require a shared endpoint node AND a branch (exactly one adjacent segment runs along
  the other edge). After: every dot on every page is a related-edge branch; 0 L5, 0 L7;
  in-page geometry PASS on all 14 rebuilt pages. Mutants: related test removed → 1 FAIL;
  branch test removed → 1 FAIL. system-hmi-audit-f1 still cannot build (its own tripwire).

## Log — 2026-11-07: clearance classes (`clearance.mjs`, layout L8–L13)

- **Why**: the owner saw memory-system-audit-f1 V1 lines inside other groups' boxes, over
  their titles, 8 px apart and on node borders while selfcheck, layout and topology all
  passed; the owner view's own sweep passed b8, a line on its target's border that hooked
  back into it. Router: containers were never obstacles and an edge's own ends never cost.
- **Changed**: new `clearance.mjs` (six classes, container roles, page CLI, selftest);
  `layout.mjs` calls it; `schema.mjs` validates an optional `container.role`.
- **Calibration**: `--selftest` 18 cases, each class fired and quiet. Mutants on a copy:
  L13 body removed → the b8-shape case FAILs (17/18, exit 2); the lane-axis filter removed →
  the lane-crossing case FAILs. Pages: memory-system-audit-f1 fires 17 (V1 12), its owner
  view fires only b8, flowchart-notation-demo 0. Across all 33 pages: 7 measured clean,
  18 warn, 8 NOT MEASURED (hand-drawn markup). First-run false positives fixed before
  logging: a row of group boxes read as lanes (shape test added), grid-scaled distances
  (fixed reading distances now), sequence `par` frames (fragment role).
- **M1**: 20 builds, receipts unmoved by this change. health-checks-audit-f1 moved because
  its build reads `hooks/ops_health_nudge.py` line numbers live (pre-existing source drift,
  restored, not committed); system-hmi-audit-f1 still cannot build (its own tripwire).

## Log — 2026-11-07 (later): L4 shared, L10 extended, L14/L15, router rev 3, L6 widened

- **Why**: the first clearance pass caught the owner-reported lines but the router still
  produced them, and the owner sweep kept its own copy of the parallel/through-node checks.
- **Changed**: `clearance.mjs` takes L4 from `layout.mjs`; L10 now flags fans side by side
  (only d = 0 merges are exempt) and opposite flow (head-to-tail on one track, or collinear
  with a gap < 2·sep or lying beside the shared node); L14 `gap-capacity`; L15
  `pill-ambiguous`. `route.mjs` rev 3 (default) prices each clearance class, keeps top
  anchors right of a container title, spreads tight anchor slots and moves pills off
  foreign lines. Seven issued build scripts pin `rev: 2`. L6 `node-text` covers every node
  kind except decision/note. The owner-view sweep of memory-system-audit-f1 calls
  `clearanceWarnings` (sep 20) instead of its own checks.
- **Calibration**: selftest 31/31. Mutants on a copy, each FAILs the selftest: fan skip
  restored, `through` test removed, L14 body removed, L15 body removed, L4 body removed,
  L13 body removed. A/B on memory-system-audit-f1 with layout unchanged: rev 2 → 17
  warnings, rev 3 → 0. After redraw: both memory-system pages 0 (owner sweep 0,
  SWEEP_MUTANT still FAILs); flowchart-notation-demo 0. All 33 pages: 8 clean, 16 warn
  (issued, not redrawn), 9 NOT MEASURED. L15 review: sampled hits sit on a track shared by
  two unrelated edges (claude-home dfa d2/a4 at y = 208) — true ambiguity, rule kept.
- **M1**: receipts move only for the two memory-system pages; health-checks-audit-f1 drift
  and the system-hmi-audit-f1 tripwire are pre-existing, as above.

## Log — 2026-11-07 (final acceptance): monitoring-audit-f1 pair, frozen source reads

- **Frozen reads**: system-hmi-audit-f1 and health-checks-audit-f1 builds now read their
  sources with `git show <SRC_AT>:path` (02ea9708 / 9e21f1aa) instead of the live tree,
  which closes the M1 drift and tripwire named above (9ac9198e; rule in
  diagram-authoring carrier-playbook, 39cb74ba). M1 after the round: 22 builds, 0 changed.
- **Field use**: monitoring-audit-f1 (precise, viewSet 2, anchors 84/84 at 39cb74ba) and
  its owner view: clearance 0, topology 0, layout WARN 0, owner sweep 0 with SWEEP_MUTANT
  FAIL, fill gate PASS, afgate 0 WARN. User visual gate PASS 2026-11-07.
- **Gap found, left open**: a route that detours outside every lane or group (over the
  top of the drawing, past the last lane) passes clearance, layout and topology with 0
  warnings; caught by eye twice. Feedback row e637d843; proposal
  `outputs/archdiag-detour-check-20261107/提案單_路線繞行檢查_20261107.md` (L16
  out-of-frame, L17 detour ratio).

## Log — 2026-11-07 (later): L16 out-of-frame, L17 detour ratio

- **Why**: the gap above. User ruling 2026-11-07: 「前者開工」 on the proposal (now spent).
- **Changed**: `clearance.mjs` L16 (frame = bounding box of the view's group/lane
  containers; lifelines and fragments are not a frame; a view without groups/lanes is
  skipped) and L17 (length / max(Manhattan distance of the ends, 80) > 3, and excess
  > 80 px). WARN only, through `layout.mjs` and the page CLI. `route.mjs` does not price
  them, so no route moves.
- **Known-bad controls (real history, replayed from the 2026-11-06 session's edits)**:
  monitoring-audit-f1 at its 17:00 state: f4 fires L16 (447 px outside) and L17 (×3.6);
  owner view at its 17:09 state: b2 「判決記為部分」 fires L16 + L17 (×3.5), b7 「是」
  fires L16. The fixed states give neither on those edges.
- **Calibration**: selftest 40/40. Mutants on a copy, each FAILs the selftest: L16 body
  removed, L17 body removed, L17 floor removed, L16 role filter removed. L17 threshold
  sweep over 80 measured views: ratio 2 → 7 hits, 2.5 → 2, 3 → 1, 4 → 0; 3 keeps both
  known-bads (×3.5, ×3.6). Pages: 26 measured, 7 gain L16 (14 edges, all margin runs
  8–32 px outside the frame, incl. monitoring-audit-f1 V1 e1/e20, which the owner
  accepted), 1 gains L17 (claude-home-audit-f1 lc t2, ×3.9). Issued pages keep their
  warnings, not redrawn.
- **M1**: 22 builds, 0 changed.
- **Open**: whether a tight margin run (e1/e20 shape) is a defect is the owner's visual
  call; if not, L16 needs a reach test (how far along the frame the run goes, or ratio),
  not a distance threshold — the f4 known-bad was also only 8 px outside.

## Log — 2026-11-07 (L16 redefined by owner ruling)

- **Ruling** (owner, same day, option 乙): 「出框的重點並不是畫面本身，而是是否壓住其他呈現
  以及是否跳脫關係（同框代表相關模組，合理的出框應視為對外連結）」. Leaving a box is not
  the defect; breaking what the box means is. Covering other content stays with
  L8/L9/L11/L12/L15.
- **Changed**: L16 now fires on `own-box-exit` (both ends in one group/lane, the line
  leaves it) or `out-of-frame-backtrack` (outside the frame of every group/lane the line
  moves more than 2·sep = 32 px away from its target). A forward margin run no longer
  fires. L17 unchanged.
- **Known-bad controls (replayed)**: f4 → backtrack 632 px (+ L17 ×3.6); b2 → own-box-exit
  L3 + backtrack 260 px (+ L17 ×3.5); b7 「是」 → own-box-exit L4 (L17 alone missed it,
  ×1.7). monitoring-audit-f1 e1/e20 (owner-accepted margin runs, away 24 / 0 px): quiet.
- **Pages**: 14 → 6 L16 hits on issued pages; each was looked at on a screenshot and is a
  detour or own-box exit (claude-home a2 over the top across a title; memory-system e9,
  f15; mfp-f3 i14 backtracks; mfp-f3 p13, mvlab w13 leave their own group and run over a
  pill). Issued pages keep their warnings.
- **Calibration**: selftest 44/44. Mutants, each FAILs: own-box removed, backtrack
  removed, direction test removed (any exit counts → the e1-shape case fires), L17 body,
  L17 floor, role filter.
- **Router**: the score already has a proximity term (length 0.5/px, 40/bend), but one
  crossing (1200) buys ~2400 px of detour, and L16/L17 are not priced; that is how f4 was
  produced. Pricing them is a new router rev (issued routes would move): proposal
  `outputs/archdiag-detour-check-20261107/提案單_路由就近原則_20261107.md`.

## Log — 2026-11-07 (late): router rev 4 (proximity)

- **Ruling**: owner 「開始rev4，記得做對照測試…並且要派工做盲測以及和你對答案」 on the
  proposal above (now spent). Default rev 3 → 4; every issued page pins its rev (the four
  that used the default now say `rev: 3`), M1 0 changed.
- **Changed** (`route.mjs`): L16 `own-box-exit` 1000, `out-of-frame-backtrack` 1300 and
  L17 1300 priced (`REV4_COST`); the router passes every edge's from/to as `links` so the
  return-edge exemption sees cycles. Detour term `DETOUR_W` 0.5/px on length beyond the
  ends' Manhattan distance (a long loop could otherwise outbid one L10, 600: mvlab w14 went
  from 568 px to 1952 px at ratio 2.7, under L17). L16 return-edge exemption (clearance):
  an edge on a directed cycle whose target lies before the source's leading side along the
  main flow (column lanes ⇒ top-down, else a per-edge sign vote) — the owner-praised b8
  「接回工作」 stays quiet.
- **Bug caught by the explained-change check**: the rev-3 title-anchor guard read
  `rev !== 3`, so rev 4 dropped it and lines entered groups through their titles (7 views
  moved with no L16/L17 to explain them). Now `rev < 3`. Check (scratch,
  `explain_check.mjs`): every edge rev 4 moves must carry a rev-3 L16/L17 (direct) or sit in
  a view that has one (ripple); positive control = the bug build (11 UNEXPLAINED), negative
  = the fixed build (0). The detour term is a general cost, so it trips the check by design
  (17 lines in memory-compaction life, mfp tsm, tg-outpost): those went to blind round 2.
- **A/B** (50 views of 18 issued models, every route forced to rev 3 vs rev 4; ccfg-retrieval
  and claude-home excluded: their builds fail at both revs): 7 views / 32 of 716 edges move;
  warnings 72 → 67 (L16 8 → 2, L17 1 → 0, L9 2 → 1, L10 18 → 16; L11 23 → 25, L8 0 → 1,
  L12 0 → 1, L14 2 → 3); crossings 57 → 58; length −4712 px; bends 645 → 635. Known-bads
  replayed: f4, b2, b7 — rev 3 fires, rev 4 quiet.
- **Blind test** (sonnet reviewers, unlabeled pairs, my key written first): round 1 (13 pairs,
  pre-fix) 3 reviewers; round 2 (4 pairs, rev 4 with vs without the detour term) 3 reviewers:
  with wins mvlab 4/4, life 4/4, tsm 3/4, tg-outpost 2/2 split; round 3 (rev 3 vs final rev 4)
  2 reviewers: known-bad f4 and owner b2/b7 rev 4 unanimous, mvlab 1/1 split. Disputed:
  mvlab map, tg-outpost map, mfp-f5 gfs — referred to the owner.
- **Overlay**: a red/blue diff of two renders (no alpha: per-pixel darker-in-old / darker-
  in-new masks over a faded copy) shows only what moved; an unchanged view comes out blank.

## Log — 2026-11-07 (close): `rev-ab.mjs` kit (M7), M1 widened, rev 4 vs crossing budgets

- **Ruling**: owner 「選rev4，然後把提案單做掉，補進去當維護工具」 — the three split
  drawings (mvlab, tg-outpost, mfp-f5 gfs) keep rev 4; the scratch A/B scripts become
  `rev-ab.mjs` (proposal `outputs/archdiag-rev-ab-20261107/提案單_路由改版對照工具_20261107.md`).
- **Controls**: rev 3→4 reproduces the scratch record (50 views, 7 changed, 32/716 edges,
  17 UNEXPLAINED from the detour term); rev 4→4 gives 0. Selftest 7/7.
- **M1 widened**: builds were selected by an `index.mjs` import, so 7 owner-view builds
  (importing `route.mjs`/`emit.mjs` directly) were never rebuilt. Now any archdiag module.
  The first widened run found memory-compaction-audit-f2-owner-view stale (its source was
  re-issued with hops after it was built); rebuilt, provenance hash line only.
- **Rev 4 vs declared crossings**: newly in the A/B set, mfp-audit-f4 (pins rev 1) fails at
  rev 4: in `afm` the only in-budget routes leave their own box, and L16 pricing buys 3
  undeclared crossings (`crossing-over-declared`, error). Tried and dropped: (a) dropping
  only the detour term in the repair pass, (b) the same for the whole view, (c) falling
  back to rev 3 when over budget — (c) restored the owner-rejected f4 detour behind a WARN.
  Kept: rev 4 reports the overrun (the router never exceeds SILENTLY); the author declares
  the crossing or adds side hints, as rev 2 already expected. mfp-audit-f3 `l2p` (3 vs 1
  declared at rev 4) is in the same class; its build does not stop on diagnostics.

## Review-when

- A text or surface colour is added to `emit.mjs` → add it to `TEXT`/`SURFACE`
  rather than inline, or `tokens.mjs` silently stops covering it. The tell is a
  hex literal appearing in `nodeSvg`/`viewSvg`/the page CSS again (2026-09-07).
- Playwright/headless-Chrome version change on this machine → `getBBox` font
  metrics may shift §4 label measurements: re-run the in-page check on
  F1/F2/F3 (report stays PASS/FAIL on the same bytes; receipts themselves are
  render-independent).
- Node major upgrade → M1 (emission is pure text; receipts should hold — the
  check is cheap, run it rather than assuming).
