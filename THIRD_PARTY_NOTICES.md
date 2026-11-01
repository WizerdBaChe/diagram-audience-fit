# Third-party notices

Licences below were checked against each upstream repository on 2026-11-01.

## archify (geometry primitives, checks and rules)

- **Code, verbatim:** `reference-impl/tools/archdiag/vendor/archify-geometry.mjs` contains functions
  cut from [tt-a1i/archify](https://github.com/tt-a1i/archify), `renderers/shared/geometry.mjs`, at
  commit `12106be58b34f94b108ab30f6ac0eb37c16a8f71` (2026-08-28).
- **Adapted (rewritten, attributed in place):** the afgate `terms` / `sums` / `style` screens
  (`tools/audience-fit-gate/afgate.py`, its README), the anchor idea in `tools/archdiag/anchors.mjs`,
  and rules cited in `skills/diagram-authoring/references/{notation-precision,carrier-playbook}.md`,
  `skills/audience-fit/references/{de-ai-flavor,project-info-for-general-readers}.md` and
  `tools/archdiag/{README,MAINTENANCE}.md`. Read at commits `12106be` (2026-08-28) and `25cf370`
  (v3.2.0, 2026-10-19); every borrow is dated 2026-10-24 or earlier.
- **Licence:** MIT at both borrowed commits (text below). Upstream adopted Apache-2.0 on 2026-10-25
  (commit `9c306ee8`), stating that historical MIT grants are preserved; nothing here was taken from
  the Apache-2.0 versions.
- What was borrowed and why: `reference-impl/outputs/skill-reviews/archify-integration-analysis-2026-08-28.md`.

```
MIT License

Copyright (c) 2026 tt-a1i (Archify)
Copyright (c) 2025 Cocoon AI (original "architecture-diagram-generator")

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The upstream copyright lines are as recorded in the vendored file's header; the full upstream text is
the `LICENSE` file at the upstream repository root.

## sepia (editing rules, adapted)

`reference-impl/skills/audience-fit/references/de-ai-flavor.md` extracts and adapts
professional-pass rules from [Nanako0129/sepia](https://github.com/Nanako0129/sepia)
(MIT License, Copyright (c) 2026 Nanako Tsai), 2026-08-30. Its borrow table (B-1 …) lists what was
taken and what was not. The MIT permission notice above applies to that material under its own
copyright line.

## diagram-design (structure of checks and colour roles, adapted)

[cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) (MIT License,
Copyright (c) 2025 Cathryn Lavery), read at commit `4451ead` (2026-09-02). Borrowed as structure, not
code or values: the a11y SVG contract and checks #9/#10 (`tools/archdiag/{asserts,selfcheck}.mjs`),
semantic colour roles in `tools/archdiag/tokens.mjs` (its palette was not taken), and rules cited in
`carrier-playbook.md` and `presentational-view.md`. The MIT permission notice above applies under its
copyright line.

## anatomy (figure-review pass, adapted)

[wheresryan22/anatomy](https://github.com/wheresryan22/anatomy) (MIT License, Copyright (c) 2026
Ryan), `references/verify.md`, read 2026-10-20: the "4x pass" in `rules/figure-self-read.md` is
adapted from it (its density clause was deliberately not borrowed). The MIT permission notice above
applies under its copyright line.

## graphify (two ideas, no text or code)

`skills/diagram-authoring/SKILL.md` restates two principles read in graphify (v0.9.94, commit
`c588b72`, 2026-10-22) in its own words: an uncertain edge is not drawn (fail-closed), and a partial
read is recorded, never reported as read. Attributed in place; no graphify text or code is included.
