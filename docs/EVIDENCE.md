---
layer: share-repo evidence
audience: agent (builder) and human
version: 1.0.2
---

# Evidence — what is measured, what each rule came from, which rules code enforces, what is not claimed

Dates are the origin environment's local dates. "Measured for this release" = run on 2026-11-01
against the files exactly as shipped (transcript: `verify/controls_run.txt`). "Origin record" = stated
in a shipped file, cited by path; not re-run here. Evidence rung of every control here: 0 (example
inputs, each two-sided with both asserted values printed; `rules/verification-ladder.md`).

## Measured for this release

- **M1 Regeneration.** All three example pages rebuild from `reference-impl/` byte-identical to the
  shipped files (sha256 `5dad793e…077f` audit page, `3b773da1…7e78` owner view, `2c92bacb…285c`
  flowchart specimen; full hashes in `verify/controls_run.txt`). The audit page's hash differs from the
  2026-10-24 edition (`b1377243…`) only because the origin re-issued it with line hops: pinning
  `crossingStyle: 'plain'` reproduces the old hash exactly (A16). Without `tools/archdiag` the build
  exits 1 (`ERR_MODULE_NOT_FOUND`).
- **M2 Determinism.** Two runs give the same hash; changing one node label changes it.
- **M3 Build failures on determinable defects.** Unknown `actor` → `SCHEMA FAILED`; a marker renamed
  out of `DEFS` → `DEFS FAILED`; a dangling edge target → exit 1 with a router message naming the view,
  the edge and the missing id (since v1.0.2; before, a `TypeError`).
- **M4 Contrast table.** `tokens.mjs --check`: 0 text FAIL, 1 graphics WARN (absent-edge stroke under
  the 3:1 graphics target); setting a title colour equal to a fill → exit 2.
- **M5 Router on the audit page** (`route stats` line): 5 views, every edge routed (17/17, 16/16, 14/14,
  19/19, 23/23), crossings within declared (1 of 2, 1 of 1).
- **M6 afgate.** `--selftest` calibration PASS (52 `[ok]` lines, both sides, including a check that
  `terms`, `sums`, `style` never FAIL; 30 were added in v1.0.2, one or more per fixed defect). On the shipped owner view `voice` exits 1 (WARN only, no FAIL);
  with a file path injected into a reader paragraph it exits 2.
- **M7 Screening.** Shipped text holds no personal names from the maintainer's known-names list, no
  e-mail, no home-directory or local drive paths of the maintainer's machine (the `anchors.mjs`
  self-test uses made-up ones such as `D:/w/f.py`), no session ids, no exchange-folder names. The screen
  runs with a planted positive control in the same invocation (a drive path, a home path, one listed
  name and an e-mail must all fire: 5 hits) and then reports 0 hits on the repo. The screen and its
  name list are the maintainer's and not shipped. The five declared edits are in spec §9.
- **M8 Unshipped references.** 52 origin paths are mentioned but not shipped
  (`verify/unshipped_paths.txt`, produced by `verify/list_unshipped.py`). The count is higher than the
  2026-10-24 edition's 43 because four reference files were added and they cite further records; v1.0.2
  adds two writing-norm notes the audience-fit skill now cites (de-ai-flavor check 12 states its
  three tests inline).
- **M9 Topology warnings (spec A13).** `topology.mjs --selftest` calibration PASS. Shipped audit page:
  exit 0, 0 WARN, and its build logs 0 `topology WARN`. Every node moved into one column: exit 1, 5
  `single-line` WARN. One pill renamed `包含`: 1 `contain-edge` WARN. Origin-side calibration, not
  re-runnable here: a reader's page with 36 views drew 28 WARN, on exactly its 22 one-column views and
  on none of its 13 sequence and timeline views.
- **M10 Layout warnings and router revision (spec A14).** The shipped audit build (pinned `rev: 1`)
  logs 59 `layout WARN` and still emits the A2 bytes. Switched to `rev: 2` it logs 21 and emits
  different bytes (the 2026-10-24 edition measured 18 before hops; L5/L7 are new kinds).
- **M11 Envelope and anchors (spec A15).** Both self-tests print `SELFTEST PASS`. Neither runs inside
  the three example builds (they declare no archview), so the envelope's end-to-end path is
  origin-side only. The self-portrait build (`docs/self-portrait/self-audit.build.mjs:118`) calls
  `resolveAnchors` directly and fails on any unresolved anchor.
- **M12 Flowchart kinds and hops (spec A16).** `flow-selftest.mjs`: 58 `ok` cases, PASS (kinds,
  decision-vertex anchoring at router, build assert and in-page check #11, hop plan, junction dots;
  since v1.0.2 also id escaping, malformed-input refusals, overlay stripping, envelope dates and the
  topology CLI's exit 3).
  Audit page as shipped: 0 `L7 bare-crossing`. Pinned plain: 2 `L7` (`tsm` t5×t7, `txd` d5×d9) and the
  old page bytes.

## Origin records behind the rules (read the cited file for the full account)

- **Environment as the audit source; `reality-gap`.** An audit of a shared design layer (2026-10-11)
  used the design document as its source and drew the three runners it named; the main loop that
  actually produced two formal videos was never drawn. → `skills/diagram-authoring/SKILL.md` Step 0;
  `view-integrity-checks.md` §3.
- **Coverage declaration.** An audit (2026-09-03) drew statecharts but no lifecycle view and said
  nothing; the next round had to rebuild that layer. → SKILL.md "Coverage declaration".
- **One library, one check script.** Per-file copies of the self-check drifted within one day. →
  `tools/archdiag/README.md` "Why it exists".
- **Re-draw, not a card grid.** An outside reader's agent cloned a layered card-grid layout that had
  already been rejected; 70–72 % of nodes per page carried the same label. →
  `skills/audience-fit/references/presentational-view.md`.
- **Crossings hop (R13, notation-precision §2).** Bare "+" crossings read as joins on dense audit
  views; hops became the default on 2026-11-01 after the issued pages were first pinned plain, then
  re-issued. → `tools/archdiag/MAINTENANCE.md` 2026-10-29 … 2026-11-01 logs.
- **Default visual vocabulary (R14, 2026-11-05).** Borrowed as concepts only (no code or text) from an
  outside architecture-diagram skill's reading-path and spacing conventions; its icons and logos were
  deliberately not taken (R7). First field test: the README workflow figure. The figure's own read
  found a defect class the first text-fit check had no object for (text on a capsule's round ends);
  the check gained that class and was confirmed to fire on the defective build before the fix. →
  `docs/assets/pipeline.build.mjs`, `docs/assets/build_assets.py`.
- **afgate apparatus split.** The first `voice` run on an accepted owner view raised 6 FAILs, all
  inside the provenance block and aggregation table the skill itself mandates; `voice` now rules only
  on the main text. → `tools/audience-fit-gate/README.md`.
- **Example measurement.** How the shipped audit page was measured and accepted at the origin. →
  `outputs/diagram-authoring/mfp-audit-f3-measurement.md`.
- **Vendored geometry.** What was borrowed from the MIT-licensed upstream and what was not. →
  `outputs/skill-reviews/archify-integration-analysis-2026-08-28.md`, `THIRD_PARTY_NOTICES.md`.

## Enforcement map — which rules a program enforces, which only the workflow asks for

A rule stated in a SKILL.md or in `docs/DEVELOPER.md` is not enforced by code unless this table says
so. "Process only" means the agent is asked to follow it and nothing in the shipped code fails when it
does not. Line numbers are at this release's commit (paths under `reference-impl/`).

| rule | enforced by | what the code checks — and what it does not |
|---|---|---|
| every node and edge carries a source (`ev`) | code: `tools/archdiag/schema.mjs:75`, `:105` (build fails) | that `ev` is a non-empty string; not that the source exists or supports the element; containers are not checked; `[assumed]` is not recognised |
| a source anchor points at a real file and line range | code, opt-in: `tools/archdiag/anchors.mjs:167`, enabled by `archview.anchors` (`index.mjs:70`) | the path exists at the pinned commit and the range is inside the file; not that the line supports the edge; the three example pages do not enable it, the self-portrait build calls `resolveAnchors` directly (`docs/self-portrait/self-audit.build.mjs:118`) |
| an untraced element is tagged `[assumed]` and gets a gap row | process only: `skills/diagram-authoring/SKILL.md:38` (Step 0) | — |
| a reference with two or more candidates draws no edge, only a gap row | process only: `skills/diagram-authoring/SKILL.md:70` | — |
| the drawing session does not sign its own gap table | process only: `skills/diagram-authoring/SKILL.md:130` | — |
| same input, same bytes | code: no clock or randomness in the page bytes, LF normalised (`tools/archdiag/index.mjs:52`), sorted iteration in the router (`route.mjs:173`, `:199`); checked by control A1 in `verify/run_controls.py`, not by the build | reproducibility; not that the drawing is correct; the sidecar envelope does carry a clock stamp (`envelope.mjs:128`) |
| sha256 receipt | code: printed to the terminal (`tools/archdiag/index.mjs:99-106`) | not written into the page; the sidecar's `fingerprint` is `none` (`envelope.mjs:139`); verifying means rebuilding and comparing |
| at most 3 declared crossings per view | code: `tools/archdiag/schema.mjs:51` (build fails) | the declared count; over 3 means split the view |
| no overlap outranks fewer crossings | code, router `rev: 2` only: `tools/archdiag/route.mjs:61` (shared-track penalty 1500 > crossing 1200) | edges without a common endpoint; the shipped audit page pins `rev: 1` (spec §3) |
| a junction dot only where two edges share an endpoint | code: `tools/archdiag/hops.mjs:123` | edges declared without `from`/`to` skip the shared-endpoint test (`hops.mjs:123-124`) |
| readability findings warn, never fail a build | code: `tools/archdiag/index.mjs:45-51` (logged, page bytes unchanged) | the standalone `topology.mjs` CLI exits 1 on any warning and 3 when a file, page or view could not be measured (`topology.mjs:233`); wiring it into CI is your call |
| a coverage declaration is present and well formed | code, shape only: `tools/archdiag/envelope.mjs:54-78` (when a page declares `archview`) | the keys, the `verifiedAt` format and that it is a calendar date; not that the coverage is complete or true |
| a reader edition invents no number | code, screen: afgate `values` (`tools/audience-fit-gate/afgate.py:279`) | only numbers with 3+ significant digits, in the main text above the provenance marker; a number explained by any original number passes, wherever it stands (`accounted()`, `:252`); a date the original lacks WARNs, never FAILs |
| a reader edition does not widen scope | code, warn: afgate `scope` (`afgate.py:401-442`) | flags a universal quantifier the original never used; a quantifier the original uses and the reader edition drops is listed as INFO, document-level; whether that is a narrowed claim is a human reading |
| a reader edition keeps every limitation | report only: afgate `limits` (`afgate.py:343`) | lists the original's limitation lines; a human rules |
| a reader edition carries no builder apparatus (paths, hashes, run ids) | code: afgate `voice` FAIL outside the provenance block (`afgate.py:172`, verdict at `:188`) | pattern match; known false positives are listed under "Not claimed" |
| a reader edition ships as a pair with its original | process only: spec A12 (review) | — |
| a reader diagram with no inherited vocabulary follows R14 (one numbered accent path, ≤ 4 dual-coded edge kinds, two text registers, gap ≥ one node width) and draws no icons (R7) | process only: `skills/audience-fit/references/presentational-view.md:143`, `:74` | the README workflow figure alone is checked by its own script: spacing and chip clearance (`docs/assets/pipeline.build.mjs:181`, `:198`), borders, terminal runs, edges through nodes, parallel gaps (`asserts()`, `:153`), text fit incl. capsule ends (`docs/assets/build_assets.py:108`); no shared tool enforces R14 on other diagrams |

## Not claimed

- Appearance: no example page in this repo was visually re-checked for this release; the origin's
  human gates applied to the originals only. The README workflow figure (zh-TW) was seen and accepted
  by the owner on 2026-11-05; its English edition was read by the model only.
- Other platforms or runtimes: only Windows 11, Node 24.22.1, Python 3.12.7 were run.
- `m1.mjs` was not run from this repo: it needs the origin's envelope discovery (not shipped).
- The in-page geometry check (spec A6) was not executed in a browser for this release.
- The example audit is of one product of the origin environment; its findings say nothing about yours.
- afgate, known and not fixed in v1.0.2 (design-level; the correctness defects an outside read-only
  review and a follow-up audit found are fixed, see `CHANGELOG.md`): fenced code in Markdown is not
  read at all; the provenance split is the first line naming a marker, so a body sentence using one
  of those words starts the exempt zone (an early marker now WARNs `apparatus-early`); `limits` has no
  marker of its own; `scope` compares quantifiers across whole files, not per claim, and takes the
  companion first; `sums` ignores colspan, nested subtotals and tolerance choice; line numbers on HTML
  input count lines of the stripped text, not of the source. Python 3.10 is the minimum the gate's
  syntax needs (older exits 3); only 3.12 was run.
- archdiag, known and not fixed in v1.0.2: `anchors.mjs` assumes
  POSIX-style paths in `ev`; README's token table and some literal hex colours are not cross-checked
  against `tokens.mjs`; `deltaMarkdown` does not escape `|` in ids; nodes may overlap (the schema checks
  sizes, not placement); the anchors self-test does not exercise the `ls-tree -z` listing or the
  enlarged output buffer.

## Decisions behind the design (keep unless the new owner decides otherwise)

1. A diagram whose source model is lost is a screenshot: regeneration source ships with every
   precision diagram.
2. Machines verify structure and geometry; a human verifies appearance; neither substitutes for the
   other.
3. A gate rules only on what it can determine; everything else is reported.
4. A reader edition changes the reader, never the findings, numbers or limits.
5. No overlap outranks fewer crossings; crossings that remain hop.
