---
paths:
  - "**/figs/**"
  - "**/build_fig*.py"
  - "**/build_sec*.py"
  - "**/m3p/section2d.py"
  - "**/m3p/npr3d.py"
  - "**/m3p/annot.py"
  - "**/m3p/figaudit.py"
  - "**/docs/assets/**"
  - "**/build_assets*.py"
review-when: the harness stops rendering PNG/JPG through the Read tool (the visual channel then needs a viewer tool), or a figure generator gains a raster diff gate that names layout classes (the read then narrows to appearance only)
enforced-by: prose-only
origin: research-figure rounds 2026-09-10 and 2026-09-15 (model3d-pipeline m3p.annot / m3p.figaudit; L-044, L-095, L-096); 4x pass borrowed 2026-10-20 from wheresryan22/anatomy (locator: `<projects>\anatomy-trial\upstream`) references/verify.md (its density clause "no bare face" deliberately not borrowed: journal schematics are sparse by design); README-asset globs added 2026-11-03 (a public README pipeline diagram under docs/assets shipped squeezed arrowheads, never read at 4x because no glob matched; README assets carry no verify JSON, so their read record is the delivery note's evidence list); candidate mechanism, not built: a PostToolUse hook listing the PNGs a build_* run emitted and asking for the read record
---

# Figure self-read: a rendered figure ships with two channels of evidence

- **A rendered figure (PNG/SVG/PDF emitted by a generator, hand-drawn SVG/HTML figure pages rendered to one included) whose delivery says "pass", "clean" or "0 FAIL" carries two independent channels of evidence,** both named in the delivery or the verify record.
- **Channel 1: the instrument's verdict on the EMITTED artifact** (audit, gate, selftest with two-sided calibration), ruling only on what it can determine.
- **Channel 2: a model visual read of the raster, written as a record:** files read (absolute paths), at what size, what was seen, ending in `no defect named` or a NAMED defect class per figure. A raster nobody read is rung 0 of `rules/verification-ladder.md` whatever the audit says.
- **Neither channel substitutes for the other:** the instrument measures position and crossing to the pixel; the read finds the CLASS the instrument has no object for.
- **A read that names a class the audit did not is a gate candidate:** write it into the instrument (rule plus injected-fault control) BEFORE the figure ships, or declare the gap in the delivery.
- **Neither channel replaces the user's own appearance confirmation:** the read is the model's obligation to look first, not a licence to claim.

## How a read is done

- **One figure per Read, at its emitted size.** A contact sheet hides the px-scale defects being looked for.
- **The read has a second pass at 4x over every junction, line end and crossing** (crops of the emitted raster, or a cropped re-render at higher scale): a stroke stopping mid-face, a leader or seam ending on nothing, a joint that reads as a crossing. "It read clean at 1x" is no excuse: 1x is the scale where these classes hide.
- **Name what was compared,** in the vocabulary of the drafting standards the instrument cites (ISO 129-1, ASME Y14.5), not "looks off": every dimension's value against its own line, each extension line's origin against the feature it measures, every chain's rungs, every line against the outlines it runs near, every label against its leader's end.
- **Compare the named defects with the audit's FAIL/WARN list for the same file:** a defect seen and not listed is the finding; a defect listed and not seen is a calibration question for the instrument.
- **Write the record where the claim is:** the verify JSON beside the figure (`visual_read:` field) or the delivery note's evidence list.

## Clauses the read alone does not supply

- **A sentence that a figure SHOWS something names the view and axis where it is visible.** A multi-view figure can hold a feature in one panel and lack it in another (L-096).
- **A schematic convenience** (a hold, clamp or fixed reach point) on a computed quantity must not erase a feature the reader expects from physics; an expected feature that is physically absent is labelled on the figure.
- **An item kind a wrapper adds at runtime is outside the instrument's object vocabulary until the wrapper gates it** (a legend added around a frozen label placer). The wrapper ships its own read-back of the added kind with a two-sided control before the figure is called clean (L-095).
- **A figure is drawn from the SAME variables the gate ruled on,** never from a recomputation inside the plotting code: the plot receives the gate's own arrays and scalars, and when only the drawing is wrong the figure is regenerated from the stored result, not by a re-solve.

## Extension

- **A new figure class** (generator, style preset, artifact kind) joins by adding its glob to `paths:` and naming, in its verify record schema, the field that carries the read. A class whose figures cannot carry the record is outside the rule and says so in its generator docstring.
