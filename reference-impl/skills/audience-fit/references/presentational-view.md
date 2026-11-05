# Presentational view — the A1 rendering profile

> Loaded by audience-fit Mode A1 (same-spec audience re-render). Born from
> round-1 G-6 (2026-08-30); rewritten the same day after G-7 — the first
> A1 render copied the WRONG feature of its archetype and was rejected.

## What the archetypes teach — and what they must not

The user-supplied examples (a paper's classification figure; a public
"Life OS"-style architecture map) teach exactly one thing: **turning
concrete program behaviour into few, reader-named, truthful nodes** —
每個節點是讀者語言的名字＋一行角色，元素數量極少，內容全部為真。

They are NOT layout templates. Copying the layered card-grid produced
「完全平級」rows that read as grade-classification — a summary table, and
harder to read than a diagram (user rejection, 2026-08-30). Re-analyse
layout per artifact; never transplant it.

## Rules

- **R1 One page, one reader question** — usually 「這系統是什麼、現在
  健康嗎」. Anything answering a different question goes elsewhere.
- **R2 Nodes AND edges — a diagram, not a card grid — on a counted
  budget.** An architecture view keeps node 感: boxes joined by drawn
  flows, where every arrow states a real call/feed relationship and
  position encodes flow in one consistent direction. A layout where
  adjacency substitutes for connection is a table wearing a diagram's
  clothes. Aggregate the engineering model to capability-level nodes, then
  draw the edges that actually exist between them. Two dials, declared
  before drawing (diagram-authoring Step 1 close-line):
  - *Count dial* — the ladder is calibrated from the accepted A1 renders,
    not borrowed: 「全景」 one page = the standing tier — the four accepted
    owner views (ccfg / claude-home / mfp-f3 / mfp-f5, 2026-08-30 … 09-05)
    hold 11–24 named nodes, 12–27 connectors, 4–14 edge labels; target
    ≤ 18 nodes / ≤ 24 connectors, hard ceiling 24 / 27 (the largest
    accepted, mfp-f3, sits there and reads as the limit, not the norm).
    「精簡」 inset / slide panel = ≤ 9 nodes [assumed — no accepted
    instance yet; calibrate at the first one]. Over the ceiling → cut in
    the R12 order, never squeeze type (R3) or spacing (R10).
  - *Wording dial* — who reads: 「owner」 = 白話名稱 + one-line role, no
    file names or paths (R3 as written); 「operator／同事」 = the same, plus
    the canonical name in parentheses on at most one line per node. The
    dial changes text, never the node set.
- **R3 Author-controlled text.** Node text = 白話名稱 (+ English term
  where needed) + at most one sub-line role. Line breaks are chosen by
  the author — fixed canvas / explicit tspans — never left to auto-wrap:
  meaningless CJK mid-word breaks are a named defect. No file names, no
  module paths, no evidence codes.
- **R4 Status is first-class and honest**: 未驗收 / 已知缺陷 / 等裁決 as
  markers anchored ON the affected nodes (footnote style ①② with a
  caption list is fine). Truth markers may MERGE under aggregation, never
  disappear — an aggregated node is as unverified as its most-unverified
  member. **A marker carried by most nodes is not a marker**: when one
  status value covers the majority of the view's nodes, it no longer
  discriminates — mark only the exceptions and state the common status
  once in the caption ("all other nodes: 未驗收"). If the common status
  conflates two axes (built? vs. verified this run?), split the axes
  before choosing what counts as an exception. *detect:* count nodes per
  status value before rendering; any value on > 50 % of nodes → render it
  as the caption default, not as per-node markers. Second incident
  (external, 2026-10-04): an outside reader's AI cloned the layered
  card-grid template rejected at the top of this file; 70–72 % of nodes on
  each page carried the same 「部分／半套」 label and the reader could find
  nothing to stop on (analysis kept locally, not shipped).
- **R5 Aggregation carries its mapping**: a collapsed table (node →
  canonical elements → **cut**: what R12 removed at which rung, or 「—」)
  lives in the page. The presentational view carries NO completeness
  claim — the canonical model does; the footer says so. The cut column is
  how a reader learns what the page does not show without opening the
  canonical page.
- **R6 Flows show the happy path plus NAMED side-states.** Never draw a
  transition or edge the system does not have; simplification is
  omission, never invention (whitelist truth).
- **R7 No imported chrome, and no pictures at all.** No icons, logos,
  brand marks or pictograms on nodes or groups, no decorative metrics,
  and no SaaS/Tailwind card aesthetic — uniform rounded-corner cards in
  soft-bordered grids are a named user rejection. A node is identified by
  its text and its relations; meaning is carried by edges, position and
  words. The reference look is the plainness of a paper figure. Excuse
  answered: "a product logo is identity, not decoration" — the reader
  finds a node by its name, and a picture spends the attention the
  relations need (owner ruling 2026-11-05).
- **R8 Carrier parity**: same carrier as the original (HTML → HTML,
  PPTX → PPTX); the reader gets the same KIND of artifact.
- **R9 Visual venue sampling** (B-4 applied to the visual register):
  before importing any external style, inherit the CANONICAL artifact's
  already-accepted visual vocabulary — its color and shape semantics,
  simplified (e.g. keep 藍＝模組/膠囊＝外部/琥珀＝資料/綠＝狀態/橘虛框＝
  未驗收 from the source audit page). The canonical is usually the one
  visual venue the user has already accepted.
- **R10 Snap or separate — the near-coincidence band is forbidden.** The
  eye reads exact coincidence as structure, clear difference as intent,
  and near-coincidence as ERROR. This governs every geometric relation,
  not just one: parallel runs are either bundled on one shared path or
  ≥ ~20px apart (measured failure: 2px, read as one smudged line);
  centers are either on the same anchor line or a whole column apart
  (measured failure: child 40px off its parent's centerline, and the two
  edges touching it turned almost-but-not-vertical); an edge is
  axis-straight, an orthogonal elbow, or clearly diagonal (≈30° or more)
  — never almost-straight; an endpoint touches the border it points at or
  keeps a uniform marker gap — never a stray 2px short; an arrowhead's tip
  IS the endpoint and its terminal run is longer than the marker (about
  1.5× its length), or the head reads squeezed against the border
  (2026-11-03, README pipeline). Both round-1
  visual defects (G-8, G-9) were instances of this one band.
- **R11 Positions derive from named anchors — no per-element numbers.**
  Declare the column centerlines, row baselines, and border ports ONCE
  (a comment block inside the artifact) and derive every node center and
  edge endpoint from them; alignment then holds by construction, and an
  edit moves a column, not a box. Hand-picked local coordinates are how
  the near-coincidence band gets entered by accident — each raw number is
  an unchecked collision bet (270/334 happened to be clean; that was
  luck, not design). A group box is derived the same way: from its
  members' bounds plus one fixed pad, never given numbers of its own;
  nest one level at most (re-borrow ledger B-23).
  Before delivery, run the closing sweep as a
  checklist, not a glance: every edge's dx/dy classified against R10's
  three allowed kinds, every parallel pair's gap, every endpoint's border
  contact, every label's clearance.
- **R12 Fixed cut order — when the R2 ceiling is exceeded, cut in this
  order and nowhere else** (borrowed as structure from diagram-design's
  degrade ladder, 2026-09-05; rungs re-derived from R3–R6): (1) role
  sub-lines on leaf nodes → (2) edge labels that carry no status and
  resolve no direction ambiguity → (3) merge sibling leaves into their
  parent (truth markers merge, R4) → (4) drop leaf nodes with one edge and
  no marker → (5) split into a second page with its own reader question
  (R1). NEVER cut: a status marker (R4), an edge between surviving nodes
  (R6), the mapping table (R5). Every cut is a row in the R5 cut column
  with its rung number; a cut nobody can find in the table is an
  invention by omission.
- **R13 A crossing never reads as a join.** Two edges that only pass
  each other cross with a line hop (small semicircle on the HORIZONTAL
  segment, the vertical stays continuous); edges that really connect meet
  at a filled junction dot; a bare "+" is not drawn. This is a reading-ease
  rule, not a precision check, so D-071 does not exempt it: a non-builder
  cannot tell "passes" from "joins" any better than a builder. Hops and
  dots come from the shared plan, never a second hand-written copy:
  `hopEdges(edges)` in `tools/archdiag/hops.mjs` takes the page's own
  `{id, pts}` orthogonal edges and returns path data, dots and
  `hop-no-room` problems; a problem is a reroute (R10 spacing), never a
  squeezed hop. A dotted remark line crosses nothing (a hop on it is
  invisible). Excuse answered: "it has only one crossing" — one misread
  join is still a wrong arrow. Owner ruling 2026-11-01.
- **R14 Default visual vocabulary — every mark carries a meaning.** R9's
  inherited vocabulary wins; this default fills the case R9 leaves empty
  (no canonical, no host-page images). Nothing is added for looks alone:
  a colour, weight or line style that encodes nothing is cut. Owner ruling
  2026-11-05; re-borrow ledger B-19–B-22.
  - *One reading path* (B-19): the one path the reader should follow takes
    the page's single accent colour and numbered steps on its edges; every
    other edge stays neutral. The accent never doubles as an R4 status
    colour. Under the canvas, a step list gives each
    number one plain sentence, opening with the node labels it joins
    (one term per thing). A page with no single path draws no accent.
  - *Few edge kinds, dual-coded* (B-20): at most four kinds (e.g. main
    path / call / event-or-async / build-and-deploy), each told apart by
    colour AND line style; the legend lists only the kinds drawn.
  - *Two text registers* (B-21): the node name and its R3 role line differ
    by weight and size (role smaller, lighter, a second face allowed), so
    name and role never read as one sentence.
  - *Spacing budget* (B-22): neighbouring nodes on one row or column sit at
    least one node width apart; an edge label fits on its segment with
    ≥ 14px clear at each end, or the nodes move (R10), never the label onto
    a node.

## Boundary (D-071, user ruling 2026-10-23)

A presentational view belongs to audience-fit, rendering included; the
skills are split by consumer and share tools. diagram-authoring serves
builder-level consumers and never gains a presentational view type. The
relation is data plus tools: this skill reads diagram-authoring's
structural model as input (R5 maps to its element ids), and past roughly
18 nodes (R-3, 2026-09-05) it may call a shared renderer under `tools/`
directly. Precision checks — completeness gates, gap tables — are NOT
applied here: a presentational view carries no completeness claim, so it
does not need the instrument that proves one; the canonical audit does.
Geometry asserts are not completeness checks and DO apply: R10/R11 and the
endpoint / edge-through-node asserts of diagram-authoring
`skills/diagram-authoring/references/notation-precision.md` §4, with a known-bad control.
