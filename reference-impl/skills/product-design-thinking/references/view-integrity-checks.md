# View integrity & correspondence checks (per-view soundness instrument)

Sibling of `representation-models.md`: that file picks WHICH view answers the
question; this file decides whether a chosen view is SOUND — internally
complete, and consistent with the other views of the same design. Selection
there, soundness here; neither file duplicates the other. Rendering precision
and carriers (SVG/HTML/PPTX syntax-level rules) belong to the
`diagram-authoring` skill, never to this file.

Three moments load this file, with different consequences per defect:

| Moment | Consumer | A defect becomes |
|---|---|---|
| Design (製作時) | product-design-thinking Verification gate (`document-ladder.md` §3) | BLOCK when it is a model defect admitting no correct implementation (SKILL.md gate c); otherwise should-fix / user-ruling-required |
| Audit (體檢) | code-review-deep-checklist Mode B view audit (`project-review.md`) | `review.arch.view-*` finding in findings.json |
| Drawing (繪製) | diagram-authoring Step 2 (structural model before rendering) | gap-report row — rendering may proceed only with the hole visible, never smoothed over |

Principle shared by all three: **the structural text model (state table,
node/edge list, participant list) is the checkable artifact; the picture is a
projection of it.** Run these checks on the text model — a rendered image
cannot be grepped, diffed, or counted.

## 1. Per-view integrity checks

### FSM / statechart（狀態驗整）
- **State×event matrix**: every (state, event) cell is one of transition /
  explicitly-ignored / explicitly-illegal. Unmarked cells ARE the finding —
  the standard way an FSM looks complete while undefined transitions hide.
- Initial state and terminal states named; every state reachable from the
  initial state; every non-terminal state has an exit (a trap state is
  declared, never accidental).
- Every waiting/async state has a timeout or cancel transition.
- The machine has a state for its own apparatus failing to start (substrate
  liveness — the class in `code-review-deep-checklist/references/single-review.md`
  §10: worker, subprocess, browser capability, remote service).
- Guard-dense transitions (≥3 interacting conditions) route to a decision
  table (pairing rule, `representation-models.md`); the table is then checked
  by its own section below.
- Statechart extras: history-state semantics stated in prose; no transition
  crosses parallel-region boundaries without a named event; composite states
  declare entry/exit actions or state "none".

### Block / component / C4 — incl. exploded product architectures（接口相容）
- Every block carries an owner/responsibility one-liner; a block that cannot
  be given one is two blocks, or none.
- Every edge has a direction and a contract type (data / control / power /
  optical / RF / mechanical / thermal …); a mixed-type edge is split. A
  legend is mandatory the moment a second node or edge type appears.
- No orphan blocks (zero edges), no phantom edges (an endpoint that is not a
  block). Every interface named on an edge has a contract row somewhere
  (schema / API / signal spec) — checked again in §2.2.
- **Boundary reconciliation across hierarchy levels**: a child diagram's
  external ports reconcile 1:1 with its parent block's ports — nothing
  appears or vanishes between levels. This is THE check for exploded /
  drill-down architectures.
- The dependency/layering direction rule is stated once per figure
  ("arrows point downward only"); a violation is a finding, not a style nit.
- **Readers found ⊆ readers drawn** (audit of an existing system): for every
  shared resource drawn as a block, the readers an environment grep finds are
  a subset of the edges drawn into it; each missing one is a `reality-gap`
  row (§3).

### Data-flow / pipeline
- Every store has ≥1 writer and ≥1 reader; every process has ≥1 input and
  ≥1 output; external entities touch the boundary only.
- The ≥1-reader check counts only what is drawn; on an existing system it is
  completed by **readers found by grep ⊆ readers drawn** (same rule as the
  block view above → `reality-gap`).
- Error / reject / overflow flows are drawn, not implied.

### Sequence
- Every request has a paired response, an explicit fire-and-forget marker,
  or a timeout path; every cross-boundary call shows its failure alternative
  (alt frame, or a pointer to the retry statechart).
- Participants are a subset of the component view; a participant with no
  home block is a correspondence break (§2.2).
- The diagram declares WHICH scenario it is (success / timeout / retry …) —
  a sequence diagram is one scenario, never the behavior space.

### Activity / BPMN
- Every decision node covers its condition space (explicit else branch);
  every fork has a join or a declared divergence; when more than one
  responsible party exists, every action sits in an owner swimlane.

### Timing
- Every constraint carries units and tolerance; the clock/reference edge is
  named. No unit, no constraint.

### Petri slice
- The slice names its question (deadlock? starvation? reachability?) and its
  initial marking; resource tokens are conserved (taken = returned on every
  path) or the leak is the finding.

### Decision table（邏輯自洽 at rule level）
- Condition coverage is arithmetic: 2^n combinations enumerated, collapsed
  by explicit ranges/don't-cares, plus an else row. Conflicting rules (same
  conditions, different outcomes) are findings; each rule points to the
  INV-n or test that covers it.

## 2. Cross-view correspondence（邏輯自洽 across views — 一份設計多重投影）

Anchor: ISO/IEC/IEEE 42010:2022 correspondence rules — named relations
(consistency, traceability, refinement) that architecture-description
elements must keep across views. Operationalized as four checks on the SET:

1. **Name identity**: an element shared by two views uses the identical
   glossary name (PIM glossary rule). Near-miss names ("JobRunner" vs
   "RunnerJob") are treated as two elements until proven one — and the proof
   is a rename, not a mental note.
2. **Existence mapping**: every sequence participant exists in the component
   view; every FSM event appears in ≥1 sequence/activity (or is marked
   internal); every interface on a block edge has a contract row; every
   state a sequence note mentions exists in the statechart.
3. **Refinement consistency**: child views reconcile to parent boundaries
   (§1 block check); a PSM-level view never contradicts the PIM-level view
   it refines — a contradiction is a Verification-gate BLOCK, not a note.
4. **Coverage vs the tier's required view set**（架構完整性）: every member
   of the tier's default view set (`representation-models.md`) exists, and
   every lifecycle entity / critical path has its view. A missing member is
   a view gap, not a rendering backlog item.

## 3. Gap report（缺口表 — the deliverable that makes holes visible)

Every audit / reconstruction pass over an existing system emits a gap table.
Minimum fields (record type registered in `ops/rules-usage-dict.md` §7):

| Field | Content |
|---|---|
| `view` | which view/diagram the row belongs to |
| `element` | node / edge / state / cell affected (glossary name) |
| `defect` | `integrity` (a §1 check failed) · `correspondence` (a §2 check failed) · `view-missing` (§2.4) · `data-gap` (source data cannot answer what the view requires) · `reality-gap` (the environment has it, the source and the drawing do not) |
| `severity` | consumer's own scale (BLOCK/should-fix/… at design; findings.json levels at audit; open/assumed at drawing) |
| `basis` | `user-data` · `code` · `env-grep` · `assumed` — what the row's judgment rests on |
| `reviewer` | audit drawings only: who checked the gap table — never the session that drew it alone (diagram-authoring Step 5) |
| `verifier` | per row: `builder-verified` (the builder re-read the anchor sentence by sentence) · `reviewer-verified` · `located` (anchor found, content not re-read — an inventory or subagent claim) · `refuted` (re-read and rejected; the row moves to a not-adopted list with the reason). A row's weight for routing and checks is read from this field, never from `severity` alone |

The reviewer's return carries `unsigned: [row ids or claims]` — what it was
asked to cover and did not check. `unsigned: none` is written explicitly; a
missing list reads as "everything unsigned".

`data-gap` is the class that makes this instrument useful on real systems —
reconstructing a full product architecture (e.g. a CPO 共封裝光學 stack) from
partial data: when the data cannot say what a port connects to or which event
exits a state, the diagram shows the hole explicitly (dashed element + gap
row). Smoothing it over with an invented connection is fabrication — the one
unforgivable move; a diagram's job on real systems is to EXPOSE the hole.

`reality-gap` is the mirror class: `data-gap` is "the source cannot answer
what the view needs"; `reality-gap` is "the environment holds a reader, caller
or entry point that neither the source nor the drawing has". It is decidable:
for every store / shared-resource node, grep its path across the environment
(`~/.claude` skills, rules, hooks, ops, tools; the labs; works) and any
referrer that is not on the edge set is one row, `basis: env-grep`. For the
shared design layer the grep is `tools/design-axes-mount/parity_census.py`
(resource × reader class). Without this class an audit that takes a design
document as its source only proves the document agrees with itself (instance:
the 2026-10-11 shared-design-layer audit drew three runners and never the main
loop that made the 拾憶人 films — `references/formal-path-governance-design.md`
§5).

## 4. Interception-chain matrix（攔截鏈 — hooks, middleware, plugin chains, scheduler groups）

A system where a platform calls a SET of handlers on one event, runs them in
parallel or in order, and merges their decisions has no edges between its
handlers; a component or flow view of it is a grid of boxes (archdiag T5
`grid-no-edges` warns on exactly that). Its primary view is a matrix, emitted
as a machine artifact (`<view>.chain.json` beside the page, one object per
row) so routing, coverage and health checks read the rows, not the picture.

| Field | Content |
|---|---|
| `event` | the platform event (`PreToolUse`, `UserPromptSubmit`, a route, a cron slot) |
| `handler` | component id, the same id the registry/component view uses (§2.1 name identity) |
| `matcher` | the registration's selector, verbatim (`Bash`, `Edit\|Write`, `*`) |
| `condition` | what inside the handler decides it acts (env, path glob, text marker), with anchor |
| `decisions` | the decision values it can return (`allow`/`ask`/`deny`/`defer`/`notice`/`none`) |
| `order` | `parallel` or its position; plus `merge` once per event: the platform's merge rule (e.g. `deny > defer > ask > allow`) with its source |
| `failure` | REQUIRED: `fail-open` · `fail-closed` · `swallowed` (an error path that turns a would-be deny into allow) · `unknown` — what happens on crash or timeout |
| `failure_basis` | which layer decides `failure`: `platform` (default for non-zero exit/timeout) · `registration` (e.g. `onFailure`) · `code` (try/except shape) — all three are read; the row names the one that wins |
| `anchor` | machine-resolvable path + lines for the registration and the code (diagram-authoring Step 0) |

Integrity checks on the matrix (each a §3 gap row when it fails):
1. **Failure completeness:** every row has `failure` ≠ `unknown`, or an
   `unknown` row is a `data-gap`. A guard whose `failure` is `fail-open` or
   `swallowed` is listed in the gap report even when that is intended, so a
   stability review sees every guard that can silently stop guarding.
2. **Registration ↔ code:** every registered handler has a row and every
   handler file the registry's component globs name is registered or listed
   as unregistered (`reality-gap`).
3. **Merge stated once per event**, with its source; a handler that
   assumes another's decision (ordering dependency inside a parallel event)
   is a `correspondence` row.
4. **Field completeness:** the registration keys the matrix does not carry
   come from the Step 0 set difference, never from memory.

The flow of ONE event (trigger → parallel fan-out → merge → failure
disposition) may be drawn as a sequence beside it; box grids of handlers by
family are an index, never the primary view.

## Provenance & status

Intake 2026-08-27, second round of the representation-models intake (user
request: design-time integrity categories — 架構完整性 / 邏輯自洽 / 接口相容 /
狀態驗整 — plus an audit/drawing instrument). External anchor verified
2026-08-27 by web search: ISO/IEC/IEEE 42010:2022 correspondence concepts
(iso.org std 74393); state×event completeness and decision-table coverage
are classical FSM / decision-table practice. Review-when: if a consumer
starts needing per-notation SYNTAX or layout rules here — that detail
belongs to `diagram-authoring/references/`, not this file.
