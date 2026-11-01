---
paths:
  - "**/*.{html,htm}"
  - "**/render_story.py"
  - "**/render_onepager.py"
  - "**/build_deck*.py"
  - "**/build_dossiers.py"
  - "**/build_pack.py"
  - "**/build_textbook.py"
  - "**/*shell*.html"
  - "**/*shell*.tpl"
review-when: the delivery machine's display or its scaling changes (the measured reference viewports below become wrong: re-measure, never re-infer, and the page-class widths in rules/html-page-style.md with them); a page class is added to tools/page-fill-gate/'s registry without a width allocation there. Define-before-use and hover cards rest on nothing outside the repo and do not expire
enforced-by: tools/token-key-gate/token_key_gate.py, tools/page-fill-gate/fill_gate.py
origin: user-named failure class 2026-08-31 (a research deck UAT: slide 1 used a verdict code before the reader met it, and its symbols were undefined); one-screen report 2026-08-31 (14 of 18 slides overflowed at 1280×610); key-yield 2026-10-05; failure-announces-itself moved from the global CLAUDE.md 2026-10-12 (WC-08; AP-56, AP-57). Siblings: html-page-style.md, html-builder-gates.md; Markdown documents: borrowed-labels.md
---

# Coded references and symbols in human-facing deliverables

- **A human-facing HTML deliverable (deck, report, dashboard-doc) contains no coded ID or symbol whose definition the reader has not been given a path to.** Layer 1 is mandatory; layers 2 and 3 whenever the document has about 5 coded IDs or more, or any symbol vocabulary.
- **Layer 1 define-before-use:** the conclusion-first cover carries a one-line legend strip of the ID families; a nomenclature slide or section (coding table, symbol diagram, operating hints) sits before content; the FIRST body mention of an ID carries an inline gloss ("P1（面內兩鏡，現行）", not bare "P1"). An ID you cannot define in one line does not appear in body text.
- **Layer 2 registry-driven hover cards with jump and return:** a REFS/SYMS JS registry feeds a text scanner; tokens get dotted underlines, about 350 ms hover definition cards, click-to-jump to the defining slide and Backspace-return. High-frequency abbreviations are glossary-only (`n:1`) so pages do not drown in dotted noise.
- **Layer 3 global glossary overlay (G key):** the full listing including glossary-only entries, rows jumpable.
- **A focused token yields every key except its own activation keys:** tokens are `tabIndex=0`, so after a jump the keydown handler may intercept only Enter/Space there and must let Backspace, G, M and paging through. Gate: `python ~/.claude/tools/token-key-gate/token_key_gate.py run <built.html>` (`static` for shells and builders, `selftest` both directions). Copies built before the fix stay as built (user ruling 2026-10-05).
- **Do not reinvent the chrome:** AssetVault `briefing-deck-shell` (`assets/pattern-template/html-css/briefing-deck-shell/`) is the reference implementation (CSS, chrome and mechanism JS from a UAT'd research deck, sample slides, README with the measured pitfalls). Native alternative when single-file compatibility is not required: Popover API plus CSS anchor positioning.
- **Measured pitfalls:** uppercase turns µm into ΜM; hardcoded page numbers rot on slide insertion (name pages, renumber via JS); SVG label spacing needs a budget; abbreviation decoration adds noise; `focusin` does not fire in background tabs (a test artifact, not a bug).
- **Interaction chrome standard** (user-accepted 2026-08-31): ←/→ paging, M TOC, counter and progress bar, print CSS, JS-dead degradation to a scrollable document, phone-width single column, offline single file.
- **An audience-facing HTML deck** (page class `deck`, not a paper-story practice copy) also carries P1-P5 of `rules/office-deck-deliverables.md`.

## One slide is one screen

- **A slide-style HTML deliverable never presents a page whose content exceeds the viewport, and when it cannot fit one it says so rather than clip.** The root cause generalises: `max-width` on media is not a layout constraint (width alone binds; height is decoupled from the viewport).
- **Stage A (CSS):** media blocks are flex items that absorb leftover height (`flex:1 1 auto; min-height:0` on the block, `flex:0 1 auto` plus `object-fit:contain` on the image); text blocks never shrink.
- **Stage B (JS):** uniformly `transform:scale()` each page's content, floored at a legibility MIN_SCALE. **Stage C (JS):** below the floor, make that page scrollable and show a banner naming it. Each stage engages only when the previous cannot cope.
- **Guards:** media get a `min-height` floor (stage A must not shrink a figure to invisibility); strict mode sits behind a JS-added class and is off on phone-size viewports; `min-width:0` on grid/flex children so `nowrap` values cannot force a horizontal scrollbar. Reference: `briefing-deck-shell` README §版面吻合.
- **Reference viewports are measured, never guessed:** read the real geometry (`System.Windows.Forms.Screen` plus `HKCU\...\WindowMetrics\AppliedDPI`) and subtract taskbar and browser chrome (this machine: 2560×1440 at AppliedDPI 144, logical 1707×960, about 1707×830 maximised). Smaller windows are reported as advisory, not failed.

## Failure announces itself

- **A deliverable that can fail at runtime** (rendering, resource loading, async init) announces the failure: a visible error notice or a degraded fallback plus a structured console error. A silent blank screen is a defect.
- **The delivery note names the likely failure modes** and what the user would see; animation, particle and realtime-render deliverables include a toggleable FPS / object-count readout (AP-56, AP-57).
