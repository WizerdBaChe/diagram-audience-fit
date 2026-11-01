# Changelog

Versions are git tags; each GitHub release attaches a zip built from that tag.

## v1.0.1 — 2026-11-01

Documentation only; nothing under `reference-impl/` or `verify/` changed.

- README rebuilt as an overview: hero image (engineering audit vs owner view), a picture grid of the
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
