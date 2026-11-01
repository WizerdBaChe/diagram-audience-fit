# archdiag — shared library for audit-drawing deliverables

Single-source framework for the diagram-authoring skill's precision SVG/HTML
deliverables (C4 / statechart / DFD / sequence audit view-sets). Extracted
2026-08-29 as **S1** of
`outputs/diagram-authoring/selfbuild-scope-eval-2026-08-28.md` from the union
of `dit-audit-f1.build.mjs` v1.1 and `prism-audit-f2.build.mjs`.

**Why it exists**: per-file copies of the assert/self-check framework drifted
within ONE day (F1 v1.1 carried check #8, the frozen F2 script did not —
false-confidence risk). This library is the single source; the drift class is
dead only while the invariants below hold.

## Invariants (properties of the asset)

- `selfcheck.mjs` is the ONLY source of the in-page §4 check script. A build
  script that embeds its own copy of any check reintroduces the drift defect.
- `pageHtml` is deterministic: identical input (views + doc strings + notes)
  ⇒ identical bytes (receipt-friendly). Anything nondeterministic (dates,
  randomness) must come in via the input, never be generated here.
- `schema.mjs` rules only on what it can determine (types, enums, id
  resolution, declaration shape); every problem it reports is a build FAIL
  (determinable ⇒ FAIL). Semantics — aggregation, view choice, node
  positions — stay human and are never validated.
- Enum sources: node kinds derive from `FILL` keys, edge types from `EDGE`
  keys (both in `emit.mjs`). Never enumerate them a second time.
- Marker closure: every `EDGE[*].marker` (and `mFill` for init arrows) must
  resolve inside `DEFS` — checked at build time in `index.mjs` (the
  determinable face of in-page check #8).
- a11y contract (2026-09-05, B-3): every `svg.dia` carries `role="img"` and
  `aria-labelledby` naming its FIRST child `<title id="t-<view>">` and the
  `<desc id="d-<view>">` after it (the view's question); both ids unique in
  the page. Asserted on the EMITTED page (`asserts.mjs` `a11yAsserts`, run by
  `index.mjs` before writing) — never on the model.
- Determinable ⇒ build FAIL, measured ⇒ in-page: a check that can be decided
  from model data (grid, anchors, orthogonality, pill centre in a node,
  shared anchor) lives in `asserts.mjs` AND is repeated in-page on the bytes;
  a check that needs rendering (label bboxes, font metrics) lives in-page
  only. A new in-page check ships with M2's two-sided calibration AND a run
  over every accepted artifact — first-run red on all of them means the
  threshold is wrong (2026-09-05, MAINTENANCE.md log).
- Not determinable ⇒ WARN, never FAIL: topology readability (`topology.mjs`,
  2026-10-19) can't be decided from geometry, so it only warns. `build()`
  logs the warnings and returns them as `topology`; the emitted bytes do
  not change. The same core reads emitted pages through the CLI, including
  pages that use the foreign `svg[data-scene]` markup. A page with no markup
  it recognises is reported as NOT MEASURED; it never counts as a pass (the
  CLI exits 3 for it, for a view with no recognised nodes and for an
  unreadable file, since 2026-11-01; 3 outranks a WARN's 1, whose lines are
  still printed).

## Modules

| file | contents |
|---|---|
| `index.mjs` | `build(opts)` — schema → build-time asserts → marker closure → emit → a11y assert on the emitted page → write + sha256 receipt line. Throws on any problem (B-1-style list in the message). |
| `schema.mjs` | `validateViews(views)` structural validation (B-7); `NODE_KINDS`, `EDGE_TYPES`, `ACTORS` (optional `node.actor` = reader/executor class, same tokens as `design-axes-mount/parity_census.py` + `human`; an unknown value FAILs). |
| `asserts.mjs` | `buildAsserts(views, grid)` — grid snap, anchor-on-border, orthogonality, pill centre inside a node, shared anchor (two edges on one side, 0 < gap < grid) — pre-write, on model data; `a11yAsserts(html)` — the a11y contract, on the emitted page. |
| `selfcheck.mjs` | `inPageScript({grid, viewCount, notes})` — in-page §4 checks #1–#10 (label overlap, anchors, viewBox clip, grid, edge-through-node, crossings-vs-declared, font floor, url(#id) reference resolution, #9 label-over-node = pill centre inside a node, #10 shared-anchor) + instrument preconditions (no transform in scene; scene must render) + tab handler (the measuring pass depends on it). B-1 diagnostic objects; `window.__geometryReport` with a render `receipt` (engine, font, metric ratio). |
| `layout.mjs` | `layoutWarnings(views, grid)` — layout-legibility WARNINGS on the routed model, logged by `build()` as `layout WARN` and returned as `result.layout`; never thrown, never in page bytes. L1 `pill-over-node`: a pill's drawn rect overlaps a node (B-1 only fails a centre inside). L2 `micro-jog`: a segment shorter than one grid unit. L3 `shared-track`: two edges with no common endpoint share more than one grid unit of line. L4 `on-container-edge`: an edge runs on a container's dashed border. Calibrated 2026-10-24: tg-outpost-audit-f1 fires on each defect the owner saw; hook-spine-audit-f1 gives 0. |
| `topology.mjs` | Topology-readability WARNINGS over a neutral `{views:[{id,nodes,edges}]}` shape. T1 `single-line`: ≥5 nodes in one column/row with an edge between non-adjacent nodes. T2 `trunk`: ≥4 edges and ≥50% of a view's edges on one collinear run. T3 `no-edges`: ≥3 boxes in one line and 0 edges (a list, not a diagram). T4 `contain-edge`: an edge labelled as containment (model face only). T5 `grid-no-edges`: ≥6 boxes in a 2D layout and 0 edges (T3's 2D twin; the relations belong in a matrix view, e.g. the interception-chain registration matrix in `view-integrity-checks.md` §4). Adapters: `fromViews` (build time), `fromHtml` (archdiag markup or `svg[data-scene]`). CLI `node topology.mjs <page.html…>` exits 1 on any WARN, 3 when a page is not measured or unreadable; `--selftest` runs the two-sided calibration (exit 2 on failure). Views whose id matches `legend` are skipped and listed. |
| `hops.mjs` | Line hops and junction dots (2026-10-29, notation-precision §2). `hopPlan(view)` → `{hops, dots, problems}` — the SINGLE source both `emit.mjs` (draws) and `layout.mjs` (L5 `hop-no-room`, L7 `bare-crossing` WARN) read. Default since 2026-11-01: a view without `crossingStyle` hops; `'plain'` (per view, or `build({ crossingStyle: 'plain' })` per page) is the receipt pin of a page issued before that, and L7 names its bare crossings. `hopEdges(edges)` gives hand-drawn SVG (audience-fit views) the same plan. The horizontal segment hops (radius `HOP_R` 5), the vertical stays continuous; an interior bend lying on another edge's line gets a junction dot. `data-pts` stays the orthogonal polyline, so every in-page check reads the same geometry. |
| `flow-selftest.mjs` | Two-sided calibration for flowchart kinds (`term`/`decision`/`note`, edge `annot`), decision-vertex anchoring (router clamp, build assert, in-page check #11 emitted only on pages that draw a decision) and hops. `node flow-selftest.mjs` → exit 0 / 2. Reference specimen: `outputs/diagram-authoring/flowchart-notation-demo.html`. |
| `tokens.mjs` | Style-token table + WCAG contrast check DERIVED from `emit.mjs` (`node tokens.mjs` prints the README table; `--check` exits 2 on a text/fill pair under AA 4.5:1). Roles, not hex, are the contract. |
| `emit.mjs` | `FILL/STROKE/OVL/EDGE` styling, `esc/cjkW`, `nodeSvg/viewSvg` (ov overlay + 未驗收 badge, absent ✕ edges, multi-inits, lifeline containers), `DEFS`, `pageHtml`. |
| `tables.mjs` | `table(headers, rows)` HTML table emitter. |
| `route.mjs` | S2 — `route(view, {provider, grid, rev})` orthogonal edge router. **`rev` defaults to 2 since 2026-10-24** (owner ruling: new drawings get it, issued pages stay): every grid track of a free band, a shared track with an unrelated edge costs more than a crossing, generalized anchor slide, short-end/border penalties, a second pill pass off every node. Pages issued before that date pin `rev: 1` in their build script. Expect a rev-2 view to need its `declaredCrossings` raised (a merged line becomes an honest crossing) and, on dense views, a hand `pillAt` where it reports `pill-unplaced`. Router edge-routing: + pill placer behind the `RouterProvider` seam (default `'channel'`); `applyRoutes(view, result)` splices results back. Node positions are inputs, never outputs (D-042). Never silently exceeds `declaredCrossings` — returns B-1 diagnostics proposing declarations/hints instead; a failed edge is named for hand authoring (assist-mode degradation is the same path). Named alternative provider `'archify-adapted'` is spec'd, not built — one interface, one implementation until field trial F3 demands the second. |
| `envelope.mjs` | archview profile of snapshot-envelope/1: `validateDeclaration(decl)`, `writeEnvelope({outPath, decl, changed, …})` (called by `build()`; idempotent), `viewId`/`envelopePath`; `--selftest` two-sided controls. |
| `anchors.mjs` | B-10 (re-borrow ledger 2026-10-23) — `parseEv(ev)`, `resolveAnchors(views, {root, at})`: every machine-form `ev` part resolved against the audited repo AT the pinned commit (path exists; every range inside the file). FAIL codes `anchor-missing` / `anchor-out-of-range` / `anchor-range-on-tree` as B-1 diagnostic objects; abbreviations (`GL:`, `REG …`), URLs, bare names that exist somewhere in the tree, git-ignored paths and paths outside root are REPORTED, never failed. Drift since the pin (`git diff at HEAD`) is a WARN. `--selftest` two-sided over a temp repo. |
| `delta.mjs` | S3 — `diffViews(base, head)` model differ (added/removed/changed, geometry / semantic / provenance (`ev`, B-11) classes with `factChanged`/`provenanceOnly`/`geometryOnly` totals, absent edges counted apart, overlay suggestions); `stripOverlay(views)` recovers a base model from an overlay-flagged one; `deltaTableRows`/`deltaMarkdown` emitters. Replaces F2's measured ~12-min hand B-9 procedure. |
| `vendor/archify-geometry.mjs` | Geometry primitives vendored verbatim from tt-a1i/archify (MIT, clone `12106be` 2026-08-28; consent 2026-08-29 eval §8 Q3). Upstream rect shape `{x,y,width,height}` — adapt at call sites, never edit in place. |

## build() contract

```js
import { build } from '../../tools/archdiag/index.mjs';
import { table } from '../../tools/archdiag/tables.mjs';

build({
  outPath,            // absolute output path
  grid: 8,            // grid unit (asserts + in-page GRIDU)
  doc: { lang, title, h1, legendbar, footerNote, pageClass },  // trusted raw text/HTML;
  // pageClass → <html data-page-class>, default 'diagram' (rules/deliverable-doc-refs.md)
  views,              // the structural model (IS the diagram; SVG is a projection)
  sections: [{ h2, html }],  // tables between the panes and the geo report
  selfcheckNotes: { precond2, check8 },  // OPTIONAL provenance comments —
  // artifact content, not logic. F1 passes its v1.1 history verbatim to stay
  // byte-identical; omit for new artifacts (generic defaults).
  archview: {         // audit views: what this view covers + when it was last
    covers: { subsystems: ['hook-guards'], projects: [], partial: [] },
    verifiedAt: '2026-10-21',   // the day the drawing was checked against the system
    rung: 'R2',                 // R0 re-stamp | R1 delta re-verify | R2 full audit
    // maxVerifyAgeDays: 60, title, retired: true   (optional)
    // anchors: { root: '~/.claude', at: '<40-hex sha>' }  (optional, B-10:
    //   resolve every machine-form ev at that commit; a miss FAILs the build)
  },                  // false = not an audit view (no envelope); omitted = keep an existing envelope
});
// => { html, bytes, sha256, topology, envelope, anchors }  (also written to outPath + receipt line logged)
```

**archview envelope** (`envelope.mjs`, 2026-10-21): every audit view carries
`archview-<page>.snapshot.json` beside its page — the HOME of its coverage
declaration, tracked in git (`.gitignore` exception). system-hmi reads it for
`archviews.coverage` / `archviews.freshness` (profile:
`tools/system-hmi/SNAPSHOT-ENVELOPE.md` §4). Invariants: a malformed
declaration fails the build before any bytes are written; an unchanged page
with an unchanged declaration leaves the envelope byte-identical (M1 stays a
no-op); a rebuild never moves `verified_at` — only a new `verifiedAt` does,
because a rebuild proves nothing about the system. A build with no
declaration and no envelope logs `archview WARN undeclared`. Calibration:
`node envelope.mjs --selftest` (run by system-hmi `controls.py`).

**Evidence anchors** (`anchors.mjs`, 2026-10-23, B-10): a declaration with
`anchors: {root, at}` resolves every machine-form `ev` at the pinned commit
before any bytes are written; the envelope's `archview.anchors` records
`{root, at, resolved, non_machine, untracked, outside_root}`. Pinning instead
of reading HEAD keeps the verdict a pure function of the declaration (M1);
re-verifying a view moves `at` together with `verifiedAt`. Machine form = a
repo-relative path (quoted if it holds spaces), then ` L32-38` or `:55,115`,
then free text. Calibration on real artifacts (2026-10-23): rules-skills-reach
103/154 resolved, 0 FAIL, mutants 103/103 path + 71/71 range caught;
hook-spine 4/237 resolved, its abbreviation anchors declined (233).

View-model strings are escaped; `doc` strings and `sections[].html` are
trusted raw (legendbar carries markup by design).

## Extraction acceptance (2026-08-29, S1)

- F1 v1.1 regenerated through the library **byte-identical**: sha256
  `172fda6b…54e` unchanged, first run — receipt unchanged, no version bump.
- F2 regenerated as v1.1 (sha256 `dea22b65…bde`): diff-scope audit proved
  every change ∈ {script upgraded to union (== F1's accepted script with two
  provenance comments genericized), footer v1.1 sentence, 40 non-ov node-rect
  `" />"`→`"/>"` normalizations}; layout geometry untouched.
- In-page self-check PASS on both (headless DOM read); view stats equal the
  frozen values. Positive control: renaming `#mOpen` out of DEFS produced
  exactly 30 `dangling-reference` diagnostics (the counted references) and
  restoring produced 0 — the instrument discriminates in both directions.
- Union checklist verified mechanically at extraction: all 10 diagnostic
  codes present; the five shared blocks (helpers, DEFS, CSS, table helper,
  build-time asserts) were byte-identical across F1/F2 before extraction —
  the only drift was the self-check set, as diagnosed.

## S2 acceptance (2026-08-29, automated half)

Re-routed F2's l2b view from its model minus pts/pillAt through the
`'channel'` provider: 15/15 edges routed, 0 through-node, crossings 0/0
(= declared budget), every pill placed, ~35 ms; candidate page built through
the full pipeline and the in-page §4 run PASSED with 0 diagnostics (real
getBBox, 1128 label pairs). Bend total 15 = the hand layout's 15 (two edges
beat the hand route by one bend; one spread-slot edge pays two). elkjs
targeted search (kickoff pre-work): ELK's edge-routing-only mode exists as
the libavoid module; the elkjs-side wrapper is third-party
`@mr_mint/elkjs-libavoid` 0.5.x (wasm) — not a mature thin-wrap fit for this
zero-dependency, byte-deterministic pipeline, so the self-built provider
stands (eval §7(c) condition not met).

## F3 field acceptance (2026-08-29) — S1+S2 joint, COMPLETE

Fresh target (media-fetch-pipeline, user-chosen) drawn end-to-end through the
library + `'channel'` router: 5 views, 79 nodes + 8 containers / 89 edges,
node positions hand-authored, every edge path and pill anchor machine-routed.
Measured vs the F1/F2 baselines (pre-registered:
`outputs/diagram-authoring/mfp-audit-f3-measurement.md`):

- corridor hand-fixes **0** (F1: 4, F2: 5) — target met; pill fixes 0;
  router diagnostics → declarations 0.
- §4 fail rounds: build 1 (model typo, caught by B-7 schema) + render **0**
  (first-pass PASS, 0 diagnostics, 4,748 label pairs).
- crossings within declared budgets everywhere (tsm 1/2, txd 1/1, rest 0/0);
  ~35–60 ms per view.
- delta.mjs field use: `stripOverlay(txd)` = main state, cross-checked
  against `git ls-tree main`; +11 nodes/+19 edges/+1 absent, 0 spurious.
- **User visual gate PASSED** (2026-08-29), incl. machine-corridor
  aesthetics — `'channel'` is the standing provider; eval §7(b)/(c) overturn
  conditions both closed. `'archify-adapted'` stays spec'd-not-built (build
  trigger: a field round where `'channel'` misses its targets).

## Style tokens (generated — `node tools/archdiag/tokens.mjs`; never hand-edit)

Roles, not hex, are the contract (B-6 of the 2026-09-05 diagram-design borrow
review: the token STRUCTURE was borrowed, the external palette was not). The
hex values below are read from `emit.mjs` by `tokens.mjs`; the table is its
output on 2026-09-05 — regenerate and diff before committing a palette edit.

| role | meaning | fill | stroke | title text (AA ≥ 4.5) | secondary text |
|---|---|---|---|---|---|
| block | module / component (block) | `#dbeafe` | `#2563eb` | 14.63 | 8.49 |
| ext | external actor / system (capsule) | `#e2e8f0` | `#64748b` | 14.48 | 8.4 |
| store | data store | `#fef3c7` | `#b45309` | 16.03 | 9.3 |
| state | state (statechart) | `#dcfce7` | `#16a34a` | 16.26 | 9.43 |
| proc | process (same colour as block: it IS a block in a DFD) | `#dbeafe` | `#2563eb` | 14.63 | 8.49 |
| port | port / boundary interface | `#ede9fe` | `#7c3aed` | 15.04 | 8.72 |
| ov (overlay) | branch-only / 未驗收 (dashed border + badge) | `#ffedd5` | `#ea580c` | 15.58 | 4.52 |
| pill | edge label | `#ffffff` | `#cbd5e1` | 10.35 | — |
| container | composite boundary / lifeline | `#f8fafc` | `#94a3b8` | 7.24 | — |

| edge type | meaning | stroke | dash | marker | vs page (graphics ≥ 3) |
|---|---|---|---|---|---|
| call | synchronous call / import | `#64748b` | solid | mOpen | 4.76 |
| data | data flow | `#0f172a` | solid | mFill | 17.85 |
| proto | async protocol (SSE / event) | `#0369a1` | solid | mProto | 5.93 |
| egress | leaves the process boundary | `#b91c1c` | solid | mEgr | 6.47 |
| warn | error flow (dual-coded: dashed) | `#b91c1c` | 6 4 | mEgr | 6.47 |
| trans | FSM transition | `#0f172a` | solid | mFill | 17.85 |
| eps | automatic transition | `#7c3aed` | 5 4 | mEps | 5.7 |
| absent | contractual NON-dependency (dual-coded: dotted, ✕ glyph, no arrowhead) | `#94a3b8` | 2 3 | — | 2.56 |

- **Contrast constraint**: every TEXT/fill pair ≥ 4.5:1 (WCAG AA) — `tokens.mjs
  --check` exits 2 otherwise (determinable ⇒ FAIL). The 未驗收 badge on the
  overlay fill sits at 4.52 — passing with no headroom; a badge colour edit
  re-runs the check first. Edge strokes vs the page are graphics (3:1) and
  only WARN — the consumer is the maintainer reading the output; the one
  standing WARN is the `absent` stroke at 2.56, deliberately faint for a
  NON-dependency and dual-coded (dotted + ✕ glyph, no arrowhead). Promotion
  trigger: a user report that an absent edge cannot be told from the page.
- **Dark inversion (rule, not built)**: a dark theme is a SECOND role→hex
  map with the same roles that passes the same check and keeps the hue
  ranks (blue module / grey external / amber store / green state / violet
  port / orange un-accepted) — it never recolors a role's meaning, and
  emitted markup never carries a hex twice. Deliverables declare
  `color-scheme: light`; build the map only when a dark deliverable is
  requested (review-when), behind the same `FILL/STROKE/EDGE` names.

## Maintenance

Event-driven ritual (receipt regression, selfcheck calibration, LF pins,
router acceptance, provider swap, token table regeneration):
[MAINTENANCE.md](MAINTENANCE.md). Environment sweep item:
`ops/references/integrity-sweep.md` check 27.

## S3 acceptance (2026-08-29)

`diffViews(stripOverlay(F2), F2)` reproduces the hand B-9 row exactly:
nodes +8 (RTE/RTA/EVD/ATL/PRS/ESV/EATL/RELP), edges +9
(r2/r3/s1/s5/s6/f8/f9/f10/f11), contractual non-edges +1 (s7), zero spurious
deltas. Calibration: four injected mutations (node removal w/ its 3 edges,
semantic retitle, geometry-only move, pill reword) each reported in the
right class, untouched views quiet — the differ demonstrably fires in both
directions.
