# Notation precision — drawing rules & geometry self-checks

Load at diagram-authoring Step 4. Theory anchor: D. Moody, "The 'Physics' of
Notations" (IEEE Trans. Software Engineering, 2009) — nine evidence-based
principles for cognitively effective visual notations; principle names appear
in parentheses so the source stays traceable (list verified by web search
2026-08-27).

## 1. Symbol discipline

- One symbol = one meaning across the WHOLE deliverable, and one meaning =
  one symbol (semiotic clarity). No symbol overload between figures of the
  same doc — if a rounded box is "state" in one figure it is not "process"
  in the next.
- A legend becomes mandatory the moment a second node or edge type exists;
  it lists every type actually used, no more. Keep distinct symbol count
  ≤ ~6 per diagram (graphic economy); over that, split the view or encode
  with labels instead of new shapes.
- Never encode by color alone — pair color with shape, line style, or an
  icon (dual coding); grayscale printing and color-vision deficiency both
  break color-only. Text labels complement, never replace, the visual
  variable.
- Distinct types differ on ≥2 visual variables (shape+color, shape+border)
  so they stay tellable at small size (perceptual discriminability, visual
  expressiveness).
- Prefer shapes that hint their meaning — cylinder = store, slotted bar =
  queue, stick figure = actor (semantic transparency) — but the hint never
  substitutes for the legend.

## 2. Layout discipline

- One axis, one meaning, stated once per figure: "time flows left→right",
  "dependencies point downward", "layers stack top→down". Never two
  meanings on one axis (cognitive fit).
- ≤ 7±2 primary elements per view level; over that, promote to a hierarchy
  level with boundary reconciliation (complexity management — the
  reconciliation CHECK lives in view-integrity-checks.md §1).
- Multi-view deliverables carry navigation cues: identical element names,
  plus a locator ("this figure zooms block X of fig. 1") (cognitive
  integration).
- Grid snap — pick one unit (8px SVG / 0.125in PPTX) for positions AND
  sizes; siblings share dimensions unless a size difference carries
  meaning.
- Orthogonal edge routing for block/architecture diagrams; crossing target
  0, declare when >3 are forced; an edge never passes THROUGH a node;
  parallel edges keep uniform spacing.
- Priority when they conflict: no overlap or collision first (two unrelated
  edges on one line, a label on a box, an edge riding a border), fewer
  crossings second. An honest crossing is the accepted price of keeping
  lines and labels apart: raise the view's `declaredCrossings` to the count
  you drew, never merge lines back or squeeze a label onto a box to get
  the number down (owner ruling 2026-10-24, router rev 2 review: offered
  "too many crossings", chose rev 2).
- **A line stays near its relation (proximity).** A group or lane box says
  its members belong together, so a line between two members that leaves
  the box reads as a link out of it, and a line that heads away from its
  target outside every box is a detour; leaving a box to reach something
  outside it is an honest outward link. Covering other content stays with
  the clearance rules above. Owner ruling 2026-11-07: 「出框的重點並不是畫面
  本身，而是是否壓住其他呈現以及是否跳脫關係」. archdiag: clearance L16
  (`own-box-exit`, `out-of-frame-backtrack` > 2·sep; a loop back to an
  earlier step against the main flow is exempt) and L17 (`detour-ratio`
  > 3 × the ends' Manhattan distance, 80 px floor) warn; router rev 4 (the
  default) prices both plus the length beyond the Manhattan distance.
  Excuse answered: "the detour avoids a crossing" — a crossing hops (next
  rule) and costs the reader a glance; a detour sends them round the
  drawing. Where only a detour fits `declaredCrossings`, declare the
  crossing.
- **A crossing that remains is drawn so it cannot be misread as a join**
  (schematic convention, IEEE 315 / IEC 60617 practice): two lines that
  merely pass each other cross with a line hop (a small semicircle on ONE of
  them); lines that are connected meet with a filled junction dot — only
  where edges that share an endpoint node split or merge, never between
  unrelated edges that happen to share a track, and never at a corner both
  turn together (a dot there asserts a join the model lacks). A bare
  "+" is not used in a new figure, joins or not (owner ruling 2026-11-01:
  the earlier "no joins ⇒ bare tolerated" allowance is withdrawn — the
  reader cannot know a figure has no joins). One hop rule per deliverable: the HORIZONTAL segment jumps,
  the vertical one stays continuous (deterministic, independent of drawing
  order). A hop needs room: radius ≈ ½ grid unit, at least one radius clear
  of a bend or another hop on the same segment; no room ⇒ reroute, never a
  squeezed hop. archdiag: hops are the DEFAULT since 2026-11-01 (a view
  needs no `crossingStyle`) — hops and junction dots are emitted from the
  routed geometry, and a hop without room is logged as `layout WARN
  hop-no-room` (L5). `crossingStyle: 'plain'` (per view, or once per page
  as `build({ crossingStyle: 'plain' })`) exists only as the receipt pin of
  a page issued before that date; every bare crossing it draws is logged as
  `layout WARN L7 bare-crossing` — named debt, cleared by a re-issue.
  Hand-drawn SVG outside archdiag uses the same plan: `hopEdges(edges)` in
  `tools/archdiag/hops.mjs` (orthogonal `{id, pts}` polylines → path data,
  junction dots, hop-no-room problems).
- Labels horizontal; never overlapping edges or other labels (asserted in
  §4); edge labels sit at the midpoint or at the owning port.
- Minimum rendered font ≥ 11px at 100% zoom for body labels; text contrast
  ≥ 4.5:1 against the actual fill behind it (WCAG AA; the archdiag palette
  is checked by `tools/archdiag/tokens.mjs --check`).
- Role type ramp — one size per text ROLE, stated once per figure and
  taken from the carrier's size preset (carrier-playbook.md §Size
  presets): audit view 13 / 11 / 11 / 12 (title / sub-line / edge pill /
  container title); presentational 15 / 11.5 / 11 / 12+ (name / role /
  edge label / status marker). A size that appears once is a mistake or a
  new role — name the role or remove the size.
- Monospace only for LITERALS the reader would type or grep — a path, a
  flag, a command, an id; a name is not a literal, and body text never
  goes mono. Evidence anchors (`ev`) are literals; node titles are not.
- CJK body floor by carrier: ≥ 11px on desktop HTML (measured: every
  accepted audit and owner view), ≥ 12px/pt on projected or printed
  carriers [assumed — borrowed guidance, uncalibrated until a deck render
  passes the user's gate]. Width estimates are per code point: `cjkW`
  (emit.mjs) counts a character above U+00FF as one em and anything else
  as 0.55 em — confirmed 2026-09-05; the in-page bbox is the truth, the
  estimate only places pills.

## 3. Per-notation conventions

- **Block / C4 / exploded**: ports drawn ON the boundary; when interface
  identity matters, edges attach to ports, not to arbitrary box points.
  Exploded product views: numbered callouts, ONE level of explosion per
  figure, parent silhouette/locator kept visible.
- **FSM / statechart**: initial marker + terminal ring; transition labels
  `event [guard] / action`; self-transitions loop outside the node;
  history/parallel notation only together with the prose semantics note
  (view-integrity-checks §1).
- **Sequence**: lifelines equally spaced; activation bars shown (or their
  omission declared); async vs sync arrowheads distinct — and the legend
  says so; the scenario name is in the title. In a mixed deliverable
  (sequence beside structural views) whole-deliverable symbol consistency
  (§1) outranks this notation's arrowhead convention: keep the
  deliverable's own sync/async encoding and declare the deviation in the
  legend (F2 2026-08-28).
- **DFD / pipeline**: uniform flow direction; stores/externals visually
  distinct from processes; error flows dashed AND colored (dual coded).
- **Flowchart / procedure flow** (ISO 5807 symbol set, reduced to what a
  reader needs): the view answers "what does the reader DO next, and where
  do they go when a check fails". Use it for procedures, checklists and
  decision walkthroughs; use a statechart instead when the subject is an
  entity's lifecycle (states persist, steps do not).
  - Four symbols, each once in the legend: terminator = capsule (start /
    end, exactly one start; every path reaches an end), process = rectangle
    (an action, verb-first), decision = diamond (a yes/no or n-way
    question, phrased as a question), annotation = text joined by a thin
    dotted line with no arrowhead (a remark, never a step). archdiag kinds:
    `term`, `proc`, `decision`, `note`; edge `annot` for the dotted joiner.
    An annotation joiner crosses no other line: a hop on a dotted line is
    invisible at reading size (demo page render, 2026-10-29), so place the
    note beside its target instead.
  - Edges enter and leave a diamond at its four VERTICES only (never along
    a facet); every outgoing edge of a decision is labelled with its
    condition (是／否, or the n-way value); an unlabelled decision exit is a
    defect.
  - Main flow runs in ONE direction (top→down by default), straight and
    centred; side branches leave sideways. Steps are numbered when the text
    refers to them ("回第 1 步").
  - Loop-back / rejected path (未通過退回) = the failure-path encoding of
    the deliverable (archdiag `warn`: red AND dashed — dual coded), routed
    OUTSIDE the main column so it never overlays the forward flow; its label
    says the condition ("任一條沒過").
  - Many yes/no checks in a row whose "no" only says how to repair: put the
    repair as an annotation beside each check (dashed joiner + 「否：…」)
    instead of a node per "no" — the main column stays one straight line.
  - Merges: several branches converging on one step either end on that
    step's border (bundled anchor) or meet at a junction dot before it; a
    crossing between branches follows the hop rule in §2.
  - Event-driven or multi-actor processes (start / message / timer events,
    swimlanes) are BPMN territory, not this flowchart set — name the
    notation and draw lanes as containers when that is what is asked.
- **Timing**: shared time axis with units and tick marks; every constraint
  arrow carries value + tolerance. The diagram states its evidence class ON
  the canvas: `measured` (durations from a measurement, cited) or
  `illustrative` (shape only, durations not to scale); never infer durations
  from code structure (archify timeline/waterfall `meta.evidence`, re-borrow
  ledger B-18).
- **Dense diagrams — numbered-chip labels** (adopted from field test FT-2):
  when on-canvas edge labels would collide (a §4 label assert fails, or
  clearly will), replace edge text with small numbered chips colored per
  edge type, placed at collision-free points, and carry the full contracts
  in a numbered table beside the diagram. The canvas stays clean, the
  contract stays complete, and chips stay checkable (§4).

## 4. Geometry self-checks (machine rung — run before any pixel claim)

For SVG/HTML carriers, run in-page JS (browser-pane protocol: these are DOM
reads, no screenshots involved):

- every label `getBBox()` disjoint from every other label bbox (padding ≥2px);
- every edge endpoint within ε (2px) of its declared node/port anchor;
- union of all element bboxes ⊆ viewBox (nothing clipped);
- declared grid honored: snapped x/y ≡ 0 (mod grid unit);
- no edge segment passes THROUGH a solid node it does not terminate on —
  segment×rect intersection test, containers and the edge's own endpoints
  exempt (added 2026-08-27: endpoint anchoring alone missed a pass-through
  that only the appearance rung caught — the assert set itself needs the
  calibration the §2 rule implies);
- font-size ≥ the §2 minimum; text/fill contrast ≥ 4.5:1;
- numbered chips (when used, §3) disjoint from every non-container node rect;
- every `url(#id)` reference (arrow markers above all) resolves to a defined
  element in the same document — a browser drops a dangling reference
  SILENTLY, so the symptom is a missing glyph that no geometry assert
  measures and the human gate reliably misses (F1 v1.0 2026-08-28: 56
  undefined arrowhead references passed both machine rungs AND user
  acceptance; found only when F2 reused the framework). Calibrate with a
  positive control: remove one def, the check must fire. The general move:
  a presence-of-glyph appearance property gets CONVERTED into a DOM
  reference assert whenever the carrier allows, not left to the eye.
- **topology readability (WARN, not an assert)**: every check above can pass
  on a drawing that shows no topology. The example is nodes stacked in one
  column, with every edge routed along one side trunk and numbered chips
  standing in for the lines. An outside fork shipped 22 of 36 views in that
  shape (2026-10-18). Run `tools/archdiag/topology.mjs` on the built page.
  It warns on four shapes: one line with edges between non-adjacent nodes;
  ≥50% of the edges on one collinear run; boxes in one line with no edges;
  containment drawn as an arrow. A warning is a reason to re-slice the view
  (by flow or by neighbourhood, never by node kind) or to nest it. It is
  not a layout nit to suppress.

For PPTX: shape coordinates are deterministic EMU values from the build
script — assert the same invariants on the script's data BEFORE writing the
file, then one rendered-thumbnail check for appearance.

A failed assert is a layout bug to fix, not a note to ship. These asserts
prove geometry only — the human appearance gate (SKILL.md Step 5.3) still
applies after them.

**Diagnostic output format** (B-1): failures are emitted as diagnostic
objects, not bare strings — `{code, subject, evidence, supportedFixes}`:
a stable kebab-case code (`label-overlap`, `edge-through-node`,
`anchor-off-node`, …), the exact elements affected, the measured values
proving the violation, and ≥1 concrete suggested fix with coordinates when
computable ("move label to (330,114) or dy +24"). A diagnostic the repairer
can act on without re-deriving the geometry is the point; "label overlap:
A × B" alone is not a finished diagnostic — and neither is a bare count:
a crossing check reports WHICH pair at WHICH point, never just "1 found"
(F1 2026-08-28: a count-only crossing diagnostic forced a manual hunt for
the pair).

**Instrument preconditions** (B-6; extended after field run F1 2026-08-28):
the assert set compares `getBBox()` rectangles in ONE untransformed
coordinate space — no `transform` on any element inside the asserted scene
(the pan/zoom wrapper itself exempt), or every bbox is mapped through its
CTM first. And the content must actually RENDER when measured: `getBBox()`
on `display:none` content returns zero rects, so a tabbed/multi-view
deliverable measures in a temporary all-views-rendered mode and asserts
each scene's bbox is non-zero before trusting any rectangle. Assert both
preconditions themselves: the checker's first run produced 36 false
overlaps from one transformed legend group, its second deliverable 987
from hidden tab panes — a checker wrong in bulk is an instrument fault,
not a layout fault (gate-calibration rule). Third precondition (external
validation 2026-09-02): a text `getBBox()` includes the font's leading,
and that height varies by family (~7% between Segoe UI and Noto Sans TC;
macOS CJK fallbacks sit at the tall end) — so a label-clearance PASS is a
fact about the FONT THAT MEASURED, not about the bytes. Design label
spacing with headroom (gap ≥ PAD + the metric spread, measured ≈ +1.5px),
and make the report carry a render receipt (engine, DPR, computed
font-family, and a measured bbox-height/font-size ratio as the metric
fingerprint); a PASS without the receipt is not comparable across
environments. The failure this rule closes: a 18px title→subtitle
baseline distance left 0.63px of margin under Segoe UI and passed every
local gate, then reported 44 overlaps in an external Chromium — the same
one-sided calibration class as the 56 dangling markers. Never widen the
padding or exempt "designed" pairs to make such a report pass; fix the
spacing (user ruling 2026-09-02).

**Repair order & bounded repair** (B-2): fix in this order, re-running the
asserts after every edit — (1) model/schema errors, (2) node overlap /
out-of-canvas, (3) edge-through-node + endpoint anchoring, (4) crossings,
shared corridors, route rhythm, (5) label clearances. Per diagnostic at
most 2 focused repair rounds — a diagnostic is the SAME one while its code,
subject and evidence are unchanged, so a renamed symptom does not reset the
count (archify v3 delivery contract); if two consecutive rounds do not reduce the
failure count, stop and report the unresolved diagnostics truthfully.
Never delete a semantic label (contract, direction, protocol, sync/async)
to pass a check — a label may be dropped only with an argument that both
endpoints fully imply it, stated in the delivery note.

## 5. Method walkthroughs across several slides

A mechanism taught as N steps (a paper's method, a pipeline, a training
loop), one step per slide. §1–§4 still hold per slide; these hold across
the sequence.

- **The legend is resident.** Same corner, same entries, on every step
  slide, including types a slide does not show yet (complexity management:
  the reader decodes once).
- **An object keeps its identity when its representation changes.** When a
  thing is redrawn in another form (actor icon → graph node → embedding
  column → node again), its label (v3) and its colour encoding travel with
  it, and the change happens in place or along a visible path, never as an
  unrelated new drawing on the next slide.
- **A step's output is carried into the next step, not redrawn.** The
  artefact a step produces stays on screen across the slide change and moves
  to its input slot in the next step (shrink + move); only the step title
  and subtitle change. The reader sees "this input is that output".
- **Show one, then all.** A per-element operation (neighbour aggregation,
  scoring) is first drawn for ONE element, then generalised to every
  element in a lighter weight.
- **A step title may hold several sub-claims.** The step title stays; the
  subtitle (one sentence, assertion form) changes as the slide's builds
  move to the next sub-claim.
- **A gate is a table beside the graph it changes.** Candidates as rows,
  score bars against one vertical threshold line, accepted / rejected
  labels; the accepted items are then drawn into the graph next to it.
- **Change is shown on the structure that already exists.** An improvement
  is shown by moving a boundary or recolouring cells of the matrix /
  diagram already on screen, with a small ↑ / ↓ label, not by a new chart.
- Numbers on such slides follow the number-entry review in
  `<projects>\science-explainer-lab\synthesis\playbook.md` step 7; a closing
  headline number is not a default ending.

**Continuous physical processes are not drawn with Morph.** User ruling
2026-10-20 after the Ow2010 probe: 「Morph的物理直覺確實不太好 感覺不優先採用。manim的連續動態很適合且效果好」.
Morph steps a growth in discrete stages and interpolates outlines, which
reads as shapes sliding, not a process; a front that grows, a field that
spreads or a wave that travels is rendered as a continuous clip (manim) and
embedded in the slide (python-pptx `add_movie`). Morph stays for carrying
an unchanged object to a new slot.

**PPTX mechanics.** Carry-over and identity across slides use the Morph
transition: objects with the same name on consecutive slides interpolate
position and size; to force two different objects to match (circle →
column), name both `!!<name>` in the Selection Pane, unique per slide
(Microsoft "Morph transition: Tips and tricks", checked 2026-10-20; needs
Microsoft 365 / PowerPoint 2019 or later; charts cross-fade instead of
morphing). Sub-claim subtitles, particle flows and growing bars are
in-slide builds (Fade, Wipe, Motion Path). python-pptx exposes no transition
API, so Morph is written into the slide XML as an `mc:AlternateContent` whose
Choice holds `<p159:morph option="byObject"/>` (Fade fallback); PowerPoint 16
reads it as entry effect 3954 and exports it to video (verified 2026-10-20,
`<projects>\motion-video-lab\experiments\probe-manim-morph-ow2010\`). A
freeform that changes shape between slides keeps the SAME vertex count,
order and start point on every slide (sample both edges at fixed x);
otherwise Morph pairs the wrong vertices and a wedge sweeps across the
shape mid-transition (v1 of that probe).

Source case: motion-video-lab C49 (FincGAN method film, 31 s, silent;
`cases/C49-fincgan-paper-method-silent/analysis/second-pass_2026-10-20.md`),
user ruling 2026-10-20 to file these for slides.

## Provenance

Distilled 2026-08-27 from Moody 2009 — nine principles: semiotic clarity,
perceptual discriminability, semantic transparency, complexity management,
cognitive integration, visual expressiveness, dual coding, graphic economy,
cognitive fit (verified via web search 2026-08-27) — plus standard UML/C4
drawing practice. 2026-08-28: §4 diagnostic format, instrument
preconditions, and repair order adopted from tt-a1i/archify (MIT); borrow
ledger B-1/B-2/B-6 + field evidence in
`outputs/skill-reviews/archify-integration-analysis-2026-08-28.md`.
2026-08-28 (F2 field round): §4 reference-resolution check (F1 v1.0
dangling-marker incident) and §3 sequence consistency-precedence note.
Review-when: a carrier appears whose geometry cannot be
asserted (e.g. hand-drawn import) — add its verification story there or
refuse precision claims on it.
