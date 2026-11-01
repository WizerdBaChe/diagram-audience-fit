---
paths:
  - "**/*pptx*.py"
  - "**/*.pptx"
  - "**/draw_*.py"
  - "**/build_fig*.py"
  - "**/specs_*.py"
  - "**/instruments/assembly_figure/**"
review-when: a generator gains a real obstacle-aware router (orthogonal or spline leaders around every drawn object), after which tier C becomes the instrument's default and §2 rows 1-2 shrink to its gate; or the user reclassifies a deck class in rules/office-deck-deliverables.md
enforced-by: prose-only
origin: user ruling 2026-09-15 on a research figure round (a crowded three-view figure, three layout patches and a 22-figure rebuild after each): 確保資料重要層級，要優先提供以及和其他元素一起搭配展示的保持不動，線段改由曲線或多直角折線來達成；嘗試無效且各種解法都試過也達到一定數量（要明定）就停止重試並選擇表示呈現問題. Builds on ops/30-judgment.md R4, L-044, L-095; loosens no gate tolerance (references/claude-config-decisions.md D-053): a stop DECLARES a defect, it never re-measures it away
---

# Layout convergence: fixed tiers, flexible routing, a counted stop

- **A layout conflict is resolved C then B then D; tier A is never on the list.** A fix that moves a tier-A object to clear a label is the named defect this rule exists for.

| tier | objects | on conflict |
|---|---|---|
| **A fixed** | drawing and data geometry and its scale; title; primary values; elements presented TOGETHER (a view and its legend band, a figure and its table) | never moved, resized or reordered to make room |
| **B banded** | labels, dimension texts | move only inside their own band (above / below / side lane), never into tier A |
| **C routed** | leaders, connector lines | reshape freely: orthogonal or curved route around obstacles, any length, any number of bends |
| **D degradable** | secondary text, basis notes, long explanations | shorten ONCE, then move to a callout number (①) with a key, to speaker notes, or to the foot note |

## Futile loops and their replacement (§2; a new loop joins only with its measured instance)

| # | futile loop | replacement |
|---|---|---|
| 1 | nudging label positions or row caps to clear a leader | route the leader (tier C) first, then band move, then callout number |
| 2 | fitting a key or legend beside a labelled drawing | key in its own band outside the view (tier A pair with the view) |
| 3 | 0.5 pt font steps or box widening for text in a fixed band | carrier change (`office-deck-deliverables` fixed-height band); conclusion decks: WARN |
| 4 | edge, footer-band or orphan-wrap findings on a conclusion-class deck | WARN line, no rebuild |
| 5 | rewording a label repeatedly to fit | one shortening; the rest goes to tier D |
| 6 | full rebuild of every figure to test a one-figure fix | iterate on the affected figures plus one untouched control; ONE full build at the end |
| 7 | re-reading every raster after every iteration | read only changed or flagged figures; the full read record (`figure-self-read.md`) is written once, on the final build |
| 8 | a long foreground build that times out, or a background build started before the spec edit | run long builds in the background from the start, regenerating inputs in the SAME command |
| 9 | chasing pixel parity between two emitters | parity only for overlap and wrong text; appearance differences between emitters are accepted |
| 10 | adjusting a gate threshold until the finding disappears | forbidden (D-053): fix by the tiers or stop by the counted stop |

## The counted stop (per symptom, per deliverable)

- **A cycle is one layout change for one symptom followed by a rebuild and verification;** a diagnostic that changes nothing is not a cycle. Two findings are the same symptom when they name the same object-pair class (leader × label), wherever they relocate.

| deck / figure class | tweaks (same representation) | representation changes | cycle cap |
|---|---|---|---|
| **conclusion** (結論式) | 1 | 1 | **2** |
| **presentation** (展示用) | 2 | 2 | **4** |

- **After the tweak allowance the next cycle MUST be a representation change** (R4).
- **The cap counts BLOCKING findings only:** a conclusion-class layout finding that is non-blocking (edge, footer band, orphan wrap, aesthetics) is a WARN line and never a rebuild, so it spends no cycle (`office-deck-deliverables.md` class table).
- **At the cap, stop retrying:** ship the best attempt (fewest blocking findings, tier A intact) and declare the residue: a `WARN residual-layout <symptom> after <n> cycles` line in the build output, a verify-record row naming what was tried and, when the audience can see the defect, a one-line note in the slide notes or foot.
- **A recurring class is registered as an instrument candidate** (a router) instead of spending another cycle.
- **A blocking class still present at the cap** (overlap hiding content, wrong text, skew) is surfaced to the user in the delivery with the tried list, never retried silently.
