# Changelog

Versions are git tags; each GitHub release attaches a zip built from that tag.

## v1.3.0 — 2026-11-07

A line stays near its relation: two new clearance classes and router revision 4 by default. Fixed at
the origin and copied by the refresh script; example page bytes unchanged (A1/A2, 13 of 13 controls ok).

- **archdiag `clearance.mjs`:** L16 out-of-frame — a line with both ends in one box that runs outside
  it, or a line outside every box that moves away from its target (an edge on a directed cycle that
  heads back against the main flow is exempt); L17 detour-ratio — drawn length > 3 × the ends'
  Manhattan distance, floor 80 px. WARN only. `--selftest` 46/46.
- **Router `rev: 4` (new default):** `rev: 3` plus costs for L16/L17 and 0.5 per px beyond the ends'
  Manhattan distance; the rev-3 title-anchor guard now applies from rev 3 up. A view that overflows its
  `declaredCrossings` reports `crossing-over-declared` — no silent fallback to an older revision.
  Origin A/B over 50 views: warnings 72 → 67 (L16 8 → 2, L17 1 → 0), crossings 57 → 58, length
  −4712 px. Pages that pin an older revision keep their bytes.
- **`rev-ab.mjs` (new, origin maintenance tool):** rebuilds every build at two revisions, reports
  per-view metrics and an explained-change check (each changed edge must carry a warning class that
  explains it), and draws a red/blue overlay; `--selftest` 7/7 (origin-run, not a control here). The
  A/B harness needs `m1.mjs --list` and so runs only in the origin; the self-test needs neither. `m1.mjs` now covers every build that imports any archdiag module.
- **Skills:** audience-fit gains R15 (a line stays near its relation; the closing sweep uses
  L16/L17); diagram-authoring notation-precision §2 gains the same rule.
- **Unshipped references:** 52 → 56 (`verify/unshipped_paths.txt`; new MAINTENANCE log lines cite
  origin proposals and a hook).
- **Declared edits:** a seventh (spec §9): the maintainer's share folder in MAINTENANCE step M7.
- **Acceptance:** A14 counts 194/97 → 196/103 and A17 31/31, 134 → 46/46, 136, both from the new
  classes on a page issued before them.
- **Closed:** the v1.2.0 known gap (a line that detours outside every box raised nothing).

## v1.2.0 — 2026-11-07

Line clearance as one shared module, router revision 3 by default, and audit pages that know which
view set they were checked against. Fixed at the origin and copied by the refresh script; example
page bytes unchanged (A1/A2, 13 of 13 controls ok).

- **archdiag `clearance.mjs` (new):** classes L4 and L8–L15 — a line riding a container border (L4)
  or a node border (L12), inside a foreign group box, over a container title, near a foreign node,
  parallel and too close to another line, opposite flow on a shared track, back toward its own
  endpoints, through a gap too narrow for its lines (L14), and a label that could belong to two
  lines (L15). One module feeds three callers: `layout.mjs` (`layout WARN`, every revision), the
  router's soft costs (L8–L13, `rev: 3`), and a page CLI (`node tools/archdiag/clearance.mjs
  <page.html>`, `--selftest` 31/31). WARN only.
- **Router `rev: 3` (new default):** `rev: 2` plus soft costs for L8–L13. Pages
  that pin an older revision keep their bytes. Origin A/B on one audit page, layout held fixed: 17
  clearance warnings under rev 2, 0 under rev 3.
- **View-set versioning:** `archview.viewSet` records the audit view set a page was declared against;
  an older or absent set warns at build and in the origin's freshness report until re-declared.
- **diagram-authoring:** structure, module and org-chart asks are its own (C4 with containment); a
  reader's question picks lead views (structure plus one task flow) that audience-fit redraws; audit
  builds read audited sources frozen at a commit (carrier-playbook).
- **Acceptance:** new A17 (clearance selftest, a clear page at 0, a pre-clearance page warns).
  A14's counts rise from 59/21 to 194/97 because the audit page predates the new classes.
- **Known gap, not fixed:** a line that detours outside every box raises no warning (an origin
  proposal is open).

## v1.1.0 — 2026-11-05

A default visual vocabulary for reader diagrams, field-tested on this README's own workflow figure.
Fixed at the origin and copied by the refresh script; example page bytes unchanged (A1/A2, 12 of 12
controls ok).

- **audience-fit presentational views, R14 (new):** when the original and the host page offer no
  visual vocabulary, a meaning-only default applies — one accent reading path with numbered steps and
  a step list under the figure; at most four edge kinds, each told apart by colour and line style, the
  legend listing only kinds drawn; name and role in two text registers; neighbouring nodes at least one
  node width apart and edge labels 14px clear of segment ends. Anything that encodes nothing is cut.
- **R7:** no pictures at all — no icons, logos, brand marks or pictograms, product logos included.
- **R11:** a group box is derived from its members' bounds plus one fixed pad; one nesting level.
- **README / README.en workflow figure:** the auto-laid mermaid flow is redrawn under R14
  (`docs/assets/pipeline.build.mjs`, `--lang en` for the English edition), with a seven-step list
  under it; the mermaid stays as a collapsed text edition and gains the afgate send-back edge the
  figure shows. The script asserts geometry (borders, terminal runs, edges through nodes, parallel
  gaps, spacing, chip clearance, group containment) with four known-bad controls;
  `build_assets.py --only pipeline --selftest` adds an in-browser text-fit check (a capsule's round
  ends do not count as usable width) with its own control.
- **Also refreshed from origin:** wording updates in `diagram-authoring/SKILL.md`,
  `de-ai-flavor.md`, `figure-self-read.md` and `part-principles.md` (spec §9 drive-root count 12 → 13).
- **Not shipped:** the origin's new §18 of `part-principles.md` (the owner's personal writing-voice
  notes) and the `de-ai-flavor.md` pointer to it; declared as spec §9 item 6.

## v1.0.2 — 2026-11-01

Fixes from an outside read-only review of v1.0.1, a follow-up code audit and two clean-context review
rounds. Fixed at the origin and copied by the refresh script; example page bytes unchanged (A1/A2).

- **Docs:** `docs/EVIDENCE.md` "Enforcement map" lists every method rule with the file:line that
  enforces it or "process only"; `AGENTS.md` opens with facts about the repo; `llms.txt` has a
  read-only route; README and `docs/DEVELOPER.md` route their limits to the map.
- **afgate `values`:** numbers glued to Chinese text and full-width digits are read; thousands
  separators only in groups of three; half-up rounding to 6 places; exponent digits not significant;
  dates checked on their own (a date the original lacks WARNs `unmatched-date`); a date's year explains
  a number by identity; a sign moved into words WARNs `sign-moved`; only the main text above the
  provenance marker is read, `--no-apparatus` is honoured and an early marker WARNs; overflowing
  transforms no longer crash or explain everything.
- **afgate `voice`:** a plain 8+ digit number is not a hash; upper-case hashes need 32+ characters;
  matches are ASCII-bounded so text glued to Chinese is still caught; multi-dot and Chinese file names
  are paths; URLs and library names (`Node.js`, `three.js`) are not; builder words match whole words
  and plurals.
- **afgate `scope`:** a quantifier the original uses and the reader edition drops is listed (INFO);
  hedges (不一定, 不固定, 不總是) and 所有權 are not universals.
- **afgate CLI:** exit 3 = could not run (Python older than 3.10, missing or UTF-16 file, bad
  `--allow`, usage error); 2 stays FAIL. Self-test 22 → 52 checks.
- **archdiag:** ids are HTML-escaped in attributes; the schema refuses a whitespace view id, missing
  or non-array `edges`/`containers`, null entries, non-positive container sizes and unknown sides; a
  dangling edge names itself instead of a `TypeError`; `pageHtml` checks its document fields;
  `stripOverlay` drops overlay edges; envelope `verifiedAt` must be a calendar date; `anchors` lists
  files NUL-separated with a larger buffer; `topology` CLI exits 3 when a file, page or view could not
  be measured. Flow self-test 39 → 58 cases.
- **audience-fit skill (origin update):** de-ai-flavor gains check 12 (paragraph job and lead outline);
  the claim-strength ladder is spelled as in `honest-data-readability.md`. The two writing-norm notes it
  cites are not shipped (`verify/unshipped_paths.txt`, 50 → 52).
- Known gaps that remain are listed under "Not claimed" in `docs/EVIDENCE.md`.

## v1.0.1 — 2026-11-01

Documentation only; nothing under `reference-impl/` or `verify/` changed.

- `docs/self-portrait/`: the repository drawn by its own method. `probe_refs.py` reads the references
  between the 44 shipped text files (`refs.json`); `self-audit.html` traces every edge to a file and
  line resolved at a pinned commit, with a gap report; `self-owner-view.html` is its reader edition
  (afgate 0 FAIL, WARN only; run in `afgate_run.txt`). This pair is the README hero image.
- README rebuilt as an overview: hero image (the self-portrait pair), a picture grid of the
  capabilities (tab-cycling GIF, flowchart, line hop, owner view), a mermaid flow, a reading-route table,
  author links.
- `README.en.md` English mirror with a language switch on both.
- `docs/DEVELOPER.md` takes the technical sections (structure tree, component and workflow diagrams,
  module map, environment, verify, deliberate design, limits, manual acceptance).
- `llms.txt` machine-readable index; `AGENTS.md` names it and the developer doc.
- `docs/assets/build_assets.py` regenerates every README image from the shipped example pages.

## v1.0.0 — 2026-11-01

First release as a public repository. Continues the folder-and-zip editions below; same structure,
renamed entry files (`00_先讀我.md` → `README.md`, `01_BUILD-SPEC.md` → `docs/BUILD-SPEC.md`,
`02_evidence.md` → `docs/EVIDENCE.md`) plus `AGENTS.md`.

- **Flowchart notation** in archdiag: node kinds `term` / `decision` / `note`, edge `annot`, decision
  edges anchored on diamond vertices (router clamp, build assert, in-page check #11).
- **Line hops by default**: crossings that are not joins draw a small semicircle; real joins get a
  junction dot; a bare "+" raises `layout WARN L7`. `crossingStyle: 'plain'` pins pre-hop pages.
- Audit coverage set gains a flowchart per branching or retrying procedure.
- audience-fit presentational views gain R13 (a crossing never reads as a join) and reuse the same hop
  plan for hand-drawn SVG (`hopEdges`).
- Shipped audit page re-issued with hops (sha256 `5dad793e…`); a flowchart specimen page added.
- Acceptance: new A16 (flowchart + hops); 12 machine controls, all `ok`.
- Added reference files: the example's measurement record, the vendored-code provenance analysis,
  `rules/verification-ladder.md`, the UI decision-point contract.
- `THIRD_PARTY_NOTICES.md` carries the MIT notices for vendored and adapted material.
- Five declared edits (spec §9): third-party names and ids, one session id, the drive root of the
  origin's project folder (tool project names kept), the home path, research-project origins written
  as neutral provenance.

## Earlier editions (folder + zip, not on GitHub)

- **2026-10-24** — router rev 2 default (issued pages pin rev 1), layout warnings, archview envelope,
  evidence anchors, `m1.mjs`, afgate `terms`/`sums`/`style`; controls A14, A15.
- **2026-10-19** — topology-readability warnings (`topology.mjs`); control A13.
- **2026-10-11** — first standalone edition: spec, evidence, reference implementation, controls
  A1–A5, A7, A10, A11.
