// tools/archdiag/index.mjs — build() entry point for archdiag deliverables.
// Pipeline: schema validation (B-7) → build-time geometry asserts → marker
// closure (build-time face of in-page check #8, on library-owned references)
// → deterministic page emission → write + sha256 receipt line.
// Contract: identical input (views + doc + sections + notes) => identical
// bytes (receipt-friendly). Provenance: S1 of
// outputs/diagram-authoring/selfbuild-scope-eval-2026-08-28.md.

import fs from 'node:fs';
import crypto from 'node:crypto';
import { validateViews } from './schema.mjs';
import { buildAsserts, a11yAsserts } from './asserts.mjs';
import { pageHtml, DEFS, EDGE } from './emit.mjs';
import { topologyWarnings, fromViews } from './topology.mjs';
import { layoutWarnings } from './layout.mjs';
import { validateDeclaration, writeEnvelope } from './envelope.mjs';
import { resolveAnchors, formatFailures } from './anchors.mjs';

// opts.write === false: run every check and return the result, but write
// neither the page nor its envelope. For a learning pass (e.g. collecting
// topology warnings before the real build): a learning pass that writes
// leaves a different page on disk, so the real pass always sees "changed"
// and rewrites the envelope on every M1 run (2026-10-24).
// opts.crossingStyle: page-level default for views that set none ('plain' =
// receipt pin of a page issued before 2026-11-01; absent = hops.mjs default 'hop').
export function build(opts) {
  if (opts.crossingStyle !== undefined && opts.views)
    opts = { ...opts, views: opts.views.map((v) => (v.crossingStyle ? v : { ...v, crossingStyle: opts.crossingStyle })) };
  const { outPath, grid = 8, views, write = true } = opts;
  if (!outPath) throw new Error('build(): outPath is required');
  const schemaProblems = validateViews(views);
  if (schemaProblems.length) throw new Error('SCHEMA FAILED:\n- ' + schemaProblems.join('\n- '));
  const assertProblems = buildAsserts(views, grid);
  if (assertProblems.length) throw new Error('BUILD FAILED:\n- ' + assertProblems.join('\n- '));
  // Marker closure — determinable at build time, so it FAILS here instead of
  // waiting for the in-page check (gate-severity rule: determinable => FAIL).
  for (const [type, st] of Object.entries(EDGE))
    if (st.marker && !DEFS.includes(`id="${st.marker}"`))
      throw new Error(`DEFS FAILED: edge type "${type}" references undefined marker #${st.marker}`);
  if (!DEFS.includes('id="mFill"'))
    throw new Error('DEFS FAILED: init arrows reference undefined marker #mFill');
  // Line endings are environment, not content: emission is eol-immune so
  // receipts survive a CRLF checkout/editor touching the sources (endings
  // are also pinned LF in .gitattributes — belt and braces, same property).
  // Topology readability (2026-10-19, topology.mjs): not determinable from
  // geometry, so WARN only — logged and returned, never thrown.
  const topology = topologyWarnings(fromViews(views));
  for (const w of topology.warnings) console.log(`topology WARN ${w.code} ${w.view}: ${w.message}`);
  // Layout legibility (2026-10-24, layout.mjs): WARN only, console + return value, never page bytes.
  const layout = layoutWarnings(views, grid);
  for (const w of layout.warnings) console.log(`layout WARN ${w.code} ${w.view}: ${w.message}`);
  const html = pageHtml(opts).replace(/\r\n/g, '\n');
  // a11y contract (B-3, 2026-09-05) — read from the EMITTED page, not the
  // model: role="img" + aria-labelledby → first-child <title> + <desc>, ids
  // unique. Determinable ⇒ FAIL before any bytes are written.
  const a11yProblems = a11yAsserts(html);
  if (a11yProblems.length) throw new Error('A11Y FAILED:\n- ' + a11yProblems.join('\n- '));
  // archview declaration (2026-10-21, envelope.mjs): validated BEFORE any
  // bytes are written — a malformed declaration is determinable ⇒ FAIL.
  const { archview } = opts;
  if (archview !== undefined && archview !== false) {
    const problems = validateDeclaration(archview);
    if (problems.length) throw new Error('ARCHVIEW FAILED:\n- ' + problems.join('\n- '));
  }
  // Evidence anchors (B-10, anchors.mjs): opt-in by archview.anchors {root, at}.
  // Resolved at the pinned commit, so the verdict is a pure function of the
  // declaration; an unresolvable machine-form anchor is determinable ⇒ FAIL
  // before any bytes are written. Abbreviation anchors are counted, never failed.
  let anchors = null;
  if (archview && archview.anchors) {
    anchors = resolveAnchors(views, archview.anchors);
    if (anchors.failures.length) throw new Error('ANCHORS FAILED:\n- ' + formatFailures(anchors.failures));
    console.log(`anchors: ${anchors.resolved}/${anchors.total} resolved at ${archview.anchors.at.slice(0, 12)}; `
      + `${anchors.nonMachine.length} non-machine and ${anchors.untracked.length} untracked (not determinable), ${anchors.outsideRoot.length} outside root`);
    if (anchors.drift.length)
      console.log(`anchors WARN drift: ${anchors.drift.length} anchored file(s) changed since the pin — re-verify before trusting: ${anchors.drift.slice(0, 8).join(', ')}${anchors.drift.length > 8 ? ' …' : ''}`);
  }
  if (write === false) {
    const sha256 = crypto.createHash('sha256').update(html).digest('hex');
    return { html, bytes: Buffer.byteLength(html, 'utf8'), sha256, topology, layout, envelope: null, anchors };
  }
  let before = null;
  try { before = fs.readFileSync(outPath, 'utf8'); } catch { /* first build */ }
  fs.writeFileSync(outPath, html, 'utf8');
  let envelope = null;
  if (archview !== false) {
    const script = (process.argv[1] || '').replace(/\\/g, '/');
    envelope = writeEnvelope({
      outPath, decl: archview || null, changed: before !== html, title: opts.doc && opts.doc.title,
      producer: { tool: script || 'tools/archdiag build()', carrier: 'manual' },
      remedy: script ? `node "${script}"` : undefined,
      anchors: anchors ? anchors.summary : undefined,
    });
    if (envelope.reason === 'undeclared')
      console.log('archview WARN undeclared: no envelope beside', outPath,
        '— system-hmi cannot see this view; pass archview:{covers,verifiedAt} (or archview:false for a page that is not an audit view)');
    else if (envelope.written) console.log('archview envelope', envelope.reason + ':', envelope.path);
    if (envelope.notice) console.log(envelope.notice);
  }
  const sha256 = crypto.createHash('sha256').update(html).digest('hex');
  // bytes = ENCODED length (utf8), never html.length: the string length counts
  // UTF-16 code units and understates every CJK page — measured 2026-08-31 on
  // ccfg-retrieval-audit-f1.html (37,408 "bytes" logged vs 41,328 on disk); a
  // receipt whose count cannot be checked against the file is the L-012 proxy
  // shape. sha256 was always over utf8 bytes and is unchanged.
  const bytes = Buffer.byteLength(html, 'utf8');
  console.log('written:', outPath, bytes, 'bytes; schema + build-time asserts + a11y passed; sha256', sha256);
  return { html, bytes, sha256, topology, layout, envelope, anchors };
}
