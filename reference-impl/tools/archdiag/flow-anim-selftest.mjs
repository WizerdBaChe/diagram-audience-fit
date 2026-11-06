#!/usr/bin/env node
// Two-sided calibration for opt-in animated flow. Exit 0 = pass, 2 = failed.
// Usage: node tools/archdiag/flow-anim-selftest.mjs
import { build } from './index.mjs';
import { EDGE } from './emit.mjs';

let failed = 0;
const ok = (name, cond, got) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  got: ' + JSON.stringify(got)}`);
  if (!cond) failed++;
};
const node = (id, x, y) => ({ id, kind: 'proc', x, y, w: 48, h: 32, t: id, ev: 'selftest' });
const edge = (id, from, to, pts, type = 'trans') => ({ id, type, from, to, pts, ev: 'selftest' });
const v = { id: 'v', title: 'v', subtitle: 'v?', declared: ['selftest'], vb: [400, 512], declaredCrossings: 1,
  nodes: [node('a1', 40, 184), node('a2', 312, 184), node('b1', 176, 40), node('b2', 176, 328),
    node('c1', 40, 360), node('c2', 312, 360), node('d1', 40, 440), node('d2', 312, 440)],
  edges: [edge('A', 'a1', 'a2', [[88, 200], [312, 200]]), edge('B', 'b1', 'b2', [[200, 72], [200, 328]]),
    edge('C', 'c1', 'c2', [[88, 376], [312, 376]], 'absent'), edge('D', 'd1', 'd2', [[88, 456], [312, 456]], 'annot')] };
const base = { outPath: 'unused.html', write: false, archview: false, doc: { title: 't', h1: 'h', legendbar: '', footerNote: '' }, views: [v], sections: [] };
const run = (patch = {}) => build({ ...base, ...patch });
const staticPaths = (html) => [...html.matchAll(/<path\b[^>]*\bclass="edge"[^>]*\/>/g)].map((m) => m[0]);
const overlays = (html) => [...html.matchAll(/<path\b[^>]*\bclass="flow-anim"[^>]*\/>/g)].map((m) => m[0]);
const attr = (tag, name) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];
const hasCount = (html, n) => overlays(html).length === n;
const flowCssValid = (html) => {
  const rule = html.match(/\.flow-anim\s*\{([^}]*)\}/)?.[1] || '';
  const dash = rule.match(/\bstroke-dasharray\s*:\s*([^;}]*)/)?.[1];
  const values = dash?.trim().split(/[\s,]+/).map(Number) || [];
  const period = values.reduce((a, b) => a + b, 0) * (values.length % 2 ? 2 : 1);
  const frames = html.match(/@keyframes\s+archdiag-flow\s*\{\s*to\s*\{([^}]*)\}\s*\}/)?.[1] || '';
  const offset = Number(frames.match(/\bstroke-dashoffset\s*:\s*(-?\d+(?:\.\d+)?)\s*;/)?.[1]);
  return /(?:^|;)\s*animation\s*:\s*[^;}]*\barchdiag-flow\b/.test(rule)
    && values.length > 0 && values.every((n) => Number.isFinite(n) && n >= 0)
    && period > 0 && offset < 0 && Number.isInteger(-offset / period);
};
const off = run(), offFalse = run({ animateFlow: false }), on = run({ animateFlow: true }), again = run({ animateFlow: true });
const paths = staticPaths(on.html), animated = overlays(on.html);
ok('off: no flow-anim substring', !off.html.includes('flow-anim'), 'found flow-anim');
ok('off: omitted and false have identical sha256', off.sha256 === offFalse.sha256, [off.sha256, offFalse.sha256]);
ok('on: exactly two eligible edges have overlays', hasCount(on.html, 2), animated.length);
ok('control: counting detects a missing overlay', !hasCount(on.html.replace(animated[0], ''), 2), overlays(on.html.replace(animated[0], '')).length);
ok('on: overlays follow their static paths and have matching d including hop',
  paths.slice(0, 2).every((p, i) => on.html.includes(p + '\n' + animated[i]) && attr(p, 'd') === attr(animated[i], 'd'))
  && / A5 /.test(attr(animated[0], 'd') || ''), animated);
ok('on: absent and annotation edges have no overlay', paths.slice(2).every((p) => !on.html.startsWith('\n<path class="flow-anim"', on.html.indexOf(p) + p.length)), paths.slice(2));
ok('on: overlays carry no edge class, geometry data or marker', animated.every((p) => !/class="edge"|data-(?:edge|pts|from|to)=|marker-end=/.test(p) && /aria-hidden="true"/.test(p)), animated);
ok('on: static edge count and data-pts unchanged', paths.length === staticPaths(off.html).length
  && paths.map((p) => attr(p, 'data-pts')).join('|') === staticPaths(off.html).map((p) => attr(p, 'data-pts')).join('|'), paths);
ok('on: reduced-motion and print hide overlays', /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{\s*\.flow-anim\s*\{\s*display:\s*none;?\s*\}\s*\}/.test(on.html)
  && /@media\s+print\s*\{\s*\.flow-anim\s*\{\s*display:\s*none;?\s*\}\s*\}/.test(on.html), 'missing hide rule');
ok('on: animation CSS has a negative whole-period offset', flowCssValid(on.html), 'invalid animation CSS');
for (const [name, mutant] of [
  ['animation rule removed', on.html.replace(/animation:\s*archdiag-flow[^;]*;/, '')],
  ['keyframes removed', on.html.replace(/@keyframes\s+archdiag-flow\s*\{\s*to\s*\{[^}]*\}\s*\}/, '')],
  ['positive offset', on.html.replace('stroke-dashoffset: -72;', 'stroke-dashoffset: 72;')],
  ['non-period offset', on.html.replace('stroke-dashoffset: -72;', 'stroke-dashoffset: -50;')],
]) ok(`control: CSS check rejects ${name}`, !flowCssValid(mutant), 'mutant accepted');
ok('on: repeated runs have identical sha256', on.sha256 === again.sha256, [on.sha256, again.sha256]);
const overridden = run({ animateFlow: true, views: [{ ...v, animateFlow: false }] });
ok('override: view false defeats page true', !overridden.html.includes('flow-anim') && overridden.sha256 === off.sha256, overridden.sha256);
const viewOn = [{ ...v, animateFlow: true }];
ok('override: view true works with omitted or false page option', hasCount(run({ views: viewOn }).html, 2)
  && hasCount(run({ animateFlow: false, views: viewOn }).html, 2), 'view true did not enable overlays');
for (const states of [[false, true], [true, false]]) {
  const html = run({ views: states.map((animateFlow, i) => ({ ...v, id: `v${i}`, animateFlow })) }).html;
  const svgs = [...html.matchAll(/<svg class="dia"[^>]*>[\s\S]*?<\/svg>/g)].map((m) => m[0]);
  ok(`mixed views ${states.join('/')}: CSS and overlays follow each view`, flowCssValid(html)
    && svgs.length === 2 && svgs.every((svg, i) => hasCount(svg, states[i] ? 2 : 0)), svgs.map((svg) => overlays(svg).length));
}
const throws = (f) => { try { f(); return false; } catch (e) { return e.message.startsWith('SCHEMA FAILED:') && /animateFlow/.test(e.message); } };
ok('schema: non-boolean page and view values throw', throws(() => run({ animateFlow: 'true' }))
  && throws(() => run({ views: [{ ...v, animateFlow: 1 }] }))
  && throws(() => run({ animateFlow: null }))
  && throws(() => run({ views: [{ ...v, animateFlow: null }] }))
  && throws(() => run({ animateFlow: true, views: [{ ...v, animateFlow: 'false' }] }))
  && throws(() => run({ animateFlow: 'true', views: [{ ...v, animateFlow: false }] })), 'invalid value accepted');
for (const type of Object.keys(EDGE)) {
  const result = run({ animateFlow: true, views: [{ ...v, edges: [{ ...v.edges[0], type }], declaredCrossings: 0 }] });
  ok(`type ${type}: expected overlay count`, hasCount(result.html, EDGE[type].marker ? 1 : 0), overlays(result.html).length);
}
console.log(failed ? `flow animation selftest: ${failed} FAILED` : 'flow animation selftest: PASS');
process.exit(failed ? 2 : 0);
