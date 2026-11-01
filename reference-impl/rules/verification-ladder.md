---
paths:
  - "**/tests/**"
  - "**/test_*.py"
  - "**/*_test.py"
  - "**/conftest.py"
  - "**/verify*.py"
  - "**/*gate*.py"
  - "**/*.lean"
  - "**/*.test.{ts,tsx,js,jsx}"
  - "**/verify/**"
review-when: Hypothesis is absent from the interpreter that runs a project's suite (rung 2 then needs a venv or falls to rung 1); a project adopts a framework that owns property testing (schemathesis, fast-check), after which the numbering stays and the tool column changes
enforced-by: prose-only
origin: Lean 4 evaluation and spike 2026-09-06 (outputs/lean4-*-2026-09-06.md); replaces the ai-coding-guardrails §2 wording; control clauses from L-062, L-097 and the research rounds of 2026-09-13 to 2026-09-16 (measurements in ops/references/rule-narratives-2026-10-12.md); the record and reader-read properties are in rules/verification-record.md; the non-mechanical-product clause is user ruling X3 2026-10-27 (outputs/feedback-criteria-grouping-20261026/篩選稿_排他性與生成力_20261027.md)
---

# Verification ladder: an invariant names the rung of evidence it carries

- **A test suite, gate or invariant claim states which rung of evidence it carries, and a rung is never claimed above what the domain allows or below what it demands.** The rung is written where the claim is (test name or docstring, the gate's status line, the INV-n `verified-by:` field); a rung claimed in prose only is rung 0.

| rung | evidence | the right stop when | must ship with |
|---|---|---|---|
| 0 | example tests | a scenario, never a property | n/a |
| 1 | exhaustive enumeration (`parametrize` over the whole domain) | the domain is FINITE (enum, transition table, small product): the exhaustive tests ARE the proof | the enumeration derived from the table, not hand-listed |
| 2 | property-based test (Hypothesis) | the DEFAULT for a pure function over an infinite domain; the property is named in the test name, generators encode boundary structure (neighbours of a value, not uniform noise) | a known-true positive: a mutant or historic bug the property fails on |
| 3 | concolic search (CrossHair) | rung 2 passes but a counterexample is suspected AND the function is analysable (no `unicodedata`, no subprocess) | the same positive caught in SYMBOLIC mode; a CONFIRMED the positive did not pass through is a verdict about the tool's model (measured on `re` newline semantics); "not analysable / timeout" is recorded, never read as verified |
| 4 | proof of a mirrored model plus differential test (Lean 4, `tools/lean-verify/`) | a universal statement ("for every input", a named INV-n) is itself the deliverable | gates A (no `sorry`), C (`#print axioms` allowlist), D (Python vs model on hand and random fixtures), with a sorry-mutant and a semantics-mutant control |
| 5 | verified core replaces the implementation | correctness-critical and performance allows | no live instance |

- **A finite state machine stops at rung 1:** the exhaustive test of every legal and illegal edge is the proof (instance: media-fetch-pipeline `test_queue.py`).
- **Rung 2 is the first rung whose evidence is about ALL inputs;** rung 4 is for when "holds for every path, not every generated path" is what the design document must say, otherwise it is a 3.1 GB toolchain restating a test.
- **Every rung of 2 or above runs its known-true positive in the same invocation as the real check** (two-sided calibration).
- **A control is proven by the ASSERTED VALUE differing between the correct and the defective build:** record both values, not the verdict flip (L-062). A control whose record carries only PASS/FAIL is rung 0 about itself.
- **When the real input already FAILS an assertion, its known-true side is a REPAIRED input, never a mutant:** perturbing an already-False assertion reads as "fired" while discriminating nothing. State the pair by VERDICT: one input must return True, one False.
- **A control set of fixed size while the artifact grows is an anecdote:** generate controls FROM the artifact (mutate every passing sentence or object it carries and require all caught).
- **A control's MUTATION MAGNITUDE comes from the data too:** the mutated run must move the asserted value, never a number that merely looks reasonable. Tell: the mutated run returns the same value as the unmutated one and the test passes anyway.
- **A gate that declines to rule publishes its declined pile and reads it BY HAND once,** then reports both counts side by side forever (4 verdicts without their 30 declines reads as coverage).
- **Two independent passes over one deliverable report their OVERLAP;** high overlap is the signal to drop one, and it is not knowable without the comparison.
- **A gate comparing a result with a reference THROUGH an estimator** (fit, slope, window average, quadrature) first runs that estimator on the reference's own samples at the gate's grid, and it must return the reference inside tolerance; a ruler that fails is a defect of the spec, and the gate does not run (L-097).
- **A non-mechanical product (creative, design or judgement output) whose quality no instrument can rule on is verified by a named human or designer review (for rendered output, the user), and its record says so:** the missing automation is the nature of that check, not a defect, and is never discounted as low value. Only its data path (files present, format, render runs) is automated.
- **Live instances:** rung 2 `tools/cross-index/tests/test_glob_properties.py`; rung 4 `tools/lean-verify/verify.py`.
