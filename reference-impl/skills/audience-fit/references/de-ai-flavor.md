# De-AI-flavor rules (borrowed, adapted)

> Loaded by audience-fit when the produced text reads AI-flavored, or the
> user says 「AI味」「太像 AI 寫的」. Borrow ledger per the prior-art borrow
> mandate: source is **Nanako0129/sepia** (MIT License, © 2026 Nanako Tsai,
> https://github.com/Nanako0129/sepia) — professional-pass rules extracted
> and adapted 2026-08-30. Fiction/narrative passes were NOT borrowed; this
> environment produces professional documents and UI text only.

## Borrow ledger

| # | Borrowed rule | Adaptation here |
|---|---|---|
| B-1 | Aim at the band, not the opposite pole: human writing is moderate, not the inverse of AI patterns; forced casualness is a new fingerprint | Applies unchanged, and to zh-TW output too |
| B-2 | Select, don't accumulate: 3–5 targeted interventions per document; fix only what a check flagged | Caps every audience-fit rewrite pass |
| B-3 | Deletion > addition (sepia's measured human-editor ratio 74 replace / 18 delete / 8 insert) | Default bias for Mode A rewrites |
| B-4 | Sample the venue first: read 2–3 recent human artifacts from the same venue and match register/length/formatting — "half of measured AI-ness is register mismatch" | Venue = the project's existing accepted docs, or the user's own corrections (e.g. the MFP UAT copy round) |
| B-5 | Never invent specifics (brands, dates, quotes, numbers) | Reinforces the honesty guardrails; a translation pass adds ZERO new facts |
| B-6 | Whitelist before flagging: formulaic containers (changelog sections, RFC/spec headings), formal register in formal venues, enumerated lists, terse replies are NOT slop | Extended: this environment's 「中文名稱 (English name)」 convention and YAML blocks in guides are whitelisted |
| B-7 | Run checks one at a time, sequentially; one isolated hit means little, clusters demand rewrite | Verdict scale kept: clean / isolated hits / cluster |
| B-8 | Four operations — write / review / refactor / recreate | Mapped to audience-fit modes: A≈refactor-or-recreate (into a NEW file), B≈refactor, C≈review |

## The professional-text checks (run in order, one at a time)

1. **Support-desk formality** — greetings, apologies, offers to help
   further. Colleagues skip this.
2. **Padding density** — statements adding zero information; long
   explanations of simple facts.
3. **Reader-irrelevant content** — background the reader already has,
   restated questions, scope tours.
4. **Missing judgment** — comparisons without a recommendation, reviews
   without a verdict, postmortems that dodge naming the mistake. (Absent
   subjectivity is a measured slop dimension.)
5. **Vague or invented specifics** — missing versions/paths/commands where
   the venue expects them; confidently wrong facts are the top-tier tell.
6. **Formatting flags** — bold headings substituting for prose; emoji
   decoration (copy in the author's own voice: mood emoji such as 🫠 are
   allowed, pointer/icon emoji are not); lists of exactly three; identical section lengths; a heading
   restated by its own first sentence.
7. **Conclusion bloat** — "in conclusion/總結來說" sections; generic future
   outlook (「我們會持續改進」).
8. **Template recycling** — the same sentence frame reused across items.
9. **Rhythmic uniformity** — every paragraph and sentence the same length;
   real prose varies depth strategically.
10. **Unsayable fluency** — grammatical but fails reading aloud.
11. **zh-TW sentence mechanics** — a sentence over ~50 characters; more
    than two 「的」 in one sentence; a nominalised verb (「進行檢查」「做出
    決定」 → 「檢查」「決定」); a number without its bound (「超過 3 次」
    「不超過 1 秒」); a stock phrase where a concrete result belongs
    (「賦能」「全方位」「至關重要」). Source: tt-a1i/archify
    `explainer-authoring.md` (MIT, zh-CN original adapted to zh-TW;
    re-borrow ledger B-16). Length and 「的」 counts are countable, so a gate
    may WARN on them; whether the sentence reads well stays a judgment.

12. **Paragraph job and lead outline** — a paragraph with two jobs or none;
    lead sentences that, read in order, do not tell the argument; a
    connective that names no real relation (decorative 因此／此外 between
    paragraphs that are only adjacent). Definitions:
    `~/.claude/references/writing-norms/paragraph-plan.md` §1–§2. Judgment
    only, never a count. A hit is one of the pass's 3–5 interventions (B-2),
    not a licence to re-plan every paragraph.

Weight by shape: long-form (reports, postmortems) → checks 2/3/4/9/12 first;
short replies and UI strings → checks 5/1 first.

## Report format (Mode C, or the self-check before delivering A/B)

Document type · venue sampled (B-4) · checks failed with quoted evidence ·
checks passed · verdict: clean / isolated hits (fix in place) / cluster
(recreate under B-8).
