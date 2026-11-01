#!/usr/bin/env node
// tools/archdiag/flow-selftest.mjs — two-sided calibration for the flowchart
// notation and line hops (2026-10-29). Every check runs on a known-defective
// input (it must fire) AND a known-clean one (it must stay silent); each case
// asserts on the VALUE the defect changes, never on a pass/fail label alone.
// Usage: node tools/archdiag/flow-selftest.mjs   (exit 0 = all pass, 2 = a case failed)

import { hopPlan, hopPath, hopEdges, bareCrossings, HOP_R } from './hops.mjs';
import { buildAsserts } from './asserts.mjs';
import { validateViews } from './schema.mjs';
import { layoutWarnings } from './layout.mjs';
import { inPageScript } from './selfcheck.mjs';
import { viewSvg, pageHtml } from './emit.mjs';
import { route, applyRoutes } from './route.mjs';

let failed = 0;
const ok = (name, cond, got) => {
  console.log(`${cond ? 'ok  ' : 'FAIL'} ${name}${cond ? '' : '  got: ' + JSON.stringify(got)}`);
  if (!cond) failed++;
};

const node = (id, kind, x, y, w, h, extra = {}) => ({ id, kind, x, y, w, h, t: id, ev: 'selftest', ...extra });
const edge = (id, from, to, pts, extra = {}) => ({ id, type: 'trans', from, to, pts, ev: 'selftest', ...extra });
const view = (nodes, edges, extra = {}) => ({ id: 'v', title: 'v', subtitle: 'v?', declared: ['selftest'], vb: [400, 400], nodes, edges, ...extra });

// ---- crossing fixture: A runs horizontally at y=200, B vertically at x=200
const crossNodes = [node('a1', 'proc', 40, 184, 48, 32), node('a2', 'proc', 312, 184, 48, 32),
  node('b1', 'proc', 176, 40, 48, 32), node('b2', 'proc', 176, 328, 48, 32)];
const crossEdges = [edge('A', 'a1', 'a2', [[88, 200], [312, 200]]), edge('B', 'b1', 'b2', [[200, 72], [200, 328]])];

// 1. hop plan — positive: a crossing in a hop view gets exactly one hop on the horizontal edge, at x=200
{
  const p = hopPlan(view(crossNodes, crossEdges, { crossingStyle: 'hop', declaredCrossings: 1 }));
  ok('hop: crossing in a hop view -> one hop on A at x=200', p.hops.get('A')?.get(1)?.join() === '200' && !p.hops.has('B'), [...p.hops]);
  ok('hop: no problems when there is room', p.problems.length === 0, p.problems);
}
// 2. hop plan — default is hop (2026-11-01); 'plain' pin draws nothing; no crossing draws nothing
{
  const dflt = hopPlan(view(crossNodes, crossEdges, { declaredCrossings: 1 }));
  ok('hop: view without crossingStyle (default) -> one hop on A', dflt.hops.get('A')?.get(1)?.join() === '200', [...dflt.hops]);
  const plain = hopPlan(view(crossNodes, crossEdges, { crossingStyle: 'plain', declaredCrossings: 1 }));
  ok('hop: plain pin -> 0 hops', plain.hops.size === 0, [...plain.hops]);
  const bare = bareCrossings(view(crossNodes, crossEdges, { crossingStyle: 'plain' }));
  ok('bare: plain pin with a crossing -> one bare crossing A×B at 200,200', bare.length === 1 && bare[0].edge === 'A' && bare[0].other === 'B' && bare[0].at.join() === '200,200', bare);
  ok('bare: default (hop) view -> none reported', bareCrossings(view(crossNodes, crossEdges, {})).length === 0, '');
  const l7 = layoutWarnings([view(crossNodes, crossEdges, { crossingStyle: 'plain', declaredCrossings: 1 })]).warnings.filter((w) => w.code === 'L7');
  ok('layout L7: plain pin with a crossing -> one WARN', l7.length === 1, l7);
  const l7c = layoutWarnings([view(crossNodes, crossEdges, { declaredCrossings: 1 })]).warnings.filter((w) => w.code === 'L7');
  ok('layout L7: default hop view -> silent', l7c.length === 0, l7c);
  const he = hopEdges(crossEdges);
  ok('hopEdges: shared helper hops A and leaves B straight', /A5 5 0 0 1 205 200/.test(he.d.get('A')) && he.d.get('B') === 'M200 72 L200 328' && he.problems.length === 0, [...he.d]);
  const apart = [edge('A', 'a1', 'a2', [[88, 200], [312, 200]]), edge('B', 'b1', 'b2', [[200, 72], [200, 150]])];
  const p = hopPlan(view(crossNodes, apart, { crossingStyle: 'hop' }));
  ok('hop: segments that do not cross -> 0 hops', p.hops.size === 0, [...p.hops]);
}
// 3. hop path — the hop arc goes UP in both travel directions; no hops = the old path string
{
  const fwd = hopPath(crossEdges[0], new Map([[1, [200]]]));
  ok('hopPath: left->right arc sweep 1 around x=200', fwd === `M88 200 L${200 - HOP_R} 200 A${HOP_R} ${HOP_R} 0 0 1 ${200 + HOP_R} 200 L312 200`, fwd);
  const back = hopPath({ pts: [[312, 200], [88, 200]] }, new Map([[1, [200]]]));
  ok('hopPath: right->left arc sweep 0 (bump still up)', back.includes(`A${HOP_R} ${HOP_R} 0 0 0 ${200 - HOP_R} 200`), back);
  ok('hopPath: no hops -> legacy M/L string', hopPath(crossEdges[0], undefined) === 'M88 200 L312 200', hopPath(crossEdges[0]));
}
// 4. hop room — positive: a crossing 4px from a bend has no room; negative covered by case 1
{
  const tight = [edge('A', 'a1', 'a2', [[88, 200], [204, 200], [204, 216], [312, 216]]), edge('B', 'b1', 'b2', [[200, 72], [200, 328]])];
  const n2 = [...crossNodes.slice(0, 1), node('a2', 'proc', 312, 200, 48, 32), ...crossNodes.slice(2)];
  const p = hopPlan(view(n2, tight, { crossingStyle: 'hop' }));
  ok('hop: crossing 4px from a bend -> hop-no-room, no hop drawn', p.problems.length === 1 && p.problems[0].code === 'hop-no-room' && !p.hops.has('A'), p);
  const w = layoutWarnings([view(n2, tight, { crossingStyle: 'hop' })]).warnings.filter((x) => x.code === 'L5');
  ok('layout L5 fires on the no-room crossing', w.length === 1, w);
  const clean = layoutWarnings([view(crossNodes, crossEdges, { crossingStyle: 'hop' })]).warnings.filter((x) => x.code === 'L5');
  ok('layout L5 silent when the hop has room', clean.length === 0, clean);
}
// 5. junction dot — positive: two edges leave one anchor and split; negative: a plain crossing is no join
{
  const jn = [node('s', 'proc', 176, 40, 48, 32), node('l', 'proc', 40, 300, 48, 32), node('r', 'proc', 312, 300, 48, 32)];
  const je = [edge('L', 's', 'l', [[200, 72], [200, 160], [64, 160], [64, 300]]), edge('R', 's', 'r', [[200, 72], [200, 160], [336, 160], [336, 300]])];
  const p = hopPlan(view(jn, je, { crossingStyle: 'hop' }));
  ok('junction: split point (200,160) gets exactly one dot', p.dots.length === 1 && p.dots[0].at.join() === '200,160', p.dots);
  // same geometry, no common node: riding one track is not a join -> no dot
  const ju = [edge('L', 's', 'l', je[0].pts), edge('R', 'x', 'r', je[1].pts)];
  const pu = hopPlan(view([...jn, node('x', 'proc', 400, 40, 48, 32)], ju, { crossingStyle: 'hop' }));
  ok('junction: unrelated edges on one track -> 0 dots', pu.dots.length === 0, pu.dots);
  // common corner: both turn together at (200,160), split only at (264,160)->down
  const jc = [edge('L', 's', 'l', [[200, 72], [200, 160], [264, 160], [264, 300]]), edge('R', 's', 'r', [[200, 72], [200, 160], [336, 160], [336, 300]])];
  const pc = hopPlan(view(jn, jc, { crossingStyle: 'hop' }));
  ok('junction: shared corner gets no dot, the split does', pc.dots.length === 1 && pc.dots[0].at.join() === '264,160', pc.dots);
  const c = hopPlan(view(crossNodes, crossEdges, { crossingStyle: 'hop' }));
  ok('junction: a crossing is not a join -> 0 dots', c.dots.length === 0, c.dots);
  const svg = viewSvg(view(jn, je, { crossingStyle: 'hop' }));
  ok('emit: the dot is drawn as circle.junction', (svg.match(/class="junction"/g) || []).length === 1, svg.length);
}
// 6. emit — a hop view draws the arc and keeps data-pts as the orthogonal polyline (in-page checks read pts)
{
  const svg = viewSvg(view(crossNodes, crossEdges, { crossingStyle: 'hop', declaredCrossings: 1 }));
  ok('emit: hop view path contains an arc', / A5 5 0 0 1 205 200 /.test(svg), svg.slice(0, 300));
  ok('emit: data-pts unchanged by the hop', svg.includes('data-pts="88,200,312,200"'), '');
  const plainSvg = viewSvg(view(crossNodes, crossEdges, { crossingStyle: 'plain', declaredCrossings: 1 }));
  ok('emit: plain pin has no arc', !/ A5 /.test(plainSvg), '');
  const dfltSvg = viewSvg(view(crossNodes, crossEdges, { declaredCrossings: 1 }));
  ok('emit: default view draws the arc', / A5 5 0 0 1 205 200 /.test(dfltSvg), '');
}

// ---- flowchart fixture: start capsule -> decision -> yes (down) / no (right)
const fNodes = [node('st', 'term', 120, 24, 160, 48), node('q', 'decision', 120, 120, 160, 96, { t: '合適嗎？' }),
  node('yes', 'proc', 120, 264, 160, 48), node('no', 'proc', 328, 144, 64, 48)];
const fEdges = [edge('e1', 'st', 'q', [[200, 72], [200, 120]]), edge('e2', 'q', 'yes', [[200, 216], [200, 264]], { pill: '是', pillAt: [216, 240] }),
  edge('e3', 'q', 'no', [[280, 168], [328, 168]], { pill: '否', pillAt: [304, 152] })];

// 7. decision vertex — negative: the fixture's ends sit on vertices; positive: an end 16px off the vertex FAILs
{
  const clean = buildAsserts([view(fNodes, fEdges)], 8).filter((m) => /vertices|decision|term/.test(m));
  ok('assert: edges on decision vertices -> no vertex problem', clean.length === 0, clean);
  const off = fEdges.map((e) => (e.id === 'e3' ? { ...e, pts: [[280, 184], [328, 184]] } : e));
  const bad = buildAsserts([view(fNodes, off)], 8).filter((m) => /not one of its vertices/.test(m));
  ok('assert: end at (280,184) on the facet -> FAIL names e3', bad.length === 1 && bad[0].includes('e3'), bad);
}
// 8. shape sizes — decision w not a multiple of 2*grid FAILs; term h > w FAILs
{
  const odd = fNodes.map((n) => (n.id === 'q' ? { ...n, w: 168 } : n));
  ok('assert: decision w=168 -> multiple-of-16 FAIL', buildAsserts([view(odd, [])], 8).some((m) => /decision w=168/.test(m)), buildAsserts([view(odd, [])], 8));
  const tall = fNodes.map((n) => (n.id === 'st' ? { ...n, w: 40, h: 48 } : n));
  ok('assert: term h>w -> capsule FAIL', buildAsserts([view(tall, [])], 8).some((m) => /term h=48 > w=40/.test(m)), '');
  ok('assert: fixture sizes clean', !buildAsserts([view(fNodes, [])], 8).some((m) => /decision w=|term h=/.test(m)), '');
}
// 9. schema — crossingStyle enum; the new kinds and edge type are known
{
  ok('schema: crossingStyle "zigzag" -> FAIL', validateViews([view(fNodes, fEdges, { crossingStyle: 'zigzag' })]).some((m) => /crossingStyle/.test(m)), '');
  const okRun = validateViews([view([...fNodes, node('n', 'note', 8, 300, 96, 24)], [...fEdges, edge('an', 'n', 'yes', [[104, 288], [120, 288]], { type: 'annot' })], { crossingStyle: 'hop' })]);
  ok('schema: term/decision/note + annot + hop accepted', okRun.length === 0, okRun);
}
// 10. decision text — a long question in a small diamond warns (L6); the fixture does not
{
  const cramped = fNodes.map((n) => (n.id === 'q' ? { ...n, w: 96, h: 64, t: '第一句的主詞是論點嗎？' } : n));
  ok('layout L6: long question in 96x64 diamond -> WARN', layoutWarnings([view(cramped, [])]).warnings.some((w) => w.code === 'L6'), '');
  ok('layout L6: 合適嗎？ in 160x96 -> silent', !layoutWarnings([view(fNodes, [])]).warnings.some((w) => w.code === 'L6'), '');
}
// 11. in-page check #11 gating — present only in flow pages; issued-page script unchanged
{
  const base = inPageScript({ grid: 8, viewCount: 1 });
  ok('selfcheck: default script has no check #11', !base.includes('decision-off-vertex'), '');
  ok('selfcheck: flow script carries check #11', inPageScript({ grid: 8, viewCount: 1, flow: true }).includes('decision-off-vertex'), '');
  const doc = { title: 't', h1: 'h', legendbar: '', footerNote: '' };
  ok('pageHtml: a page with a decision gets check #11', pageHtml({ doc, views: [view(fNodes, fEdges)], sections: [] }).includes('decision-off-vertex'), '');
  ok('pageHtml: a page without one does not', !pageHtml({ doc, views: [view(crossNodes, crossEdges)], sections: [] }).includes('decision-off-vertex'), '');
}
// 12. router — routing to a decision anchors on its vertices (side midpoints), never along a facet
{
  // neighbours deliberately OFF the decision's axes: a router that projects the far
  // node's centre onto the facet (the pre-vertex behaviour) lands off-vertex here
  const skew = fNodes.map((n) => (n.id === 'no' ? { ...n, y: 176 } : n.id === 'yes' ? { ...n, x: 152 } : n));
  const raw = view(skew, fEdges.map(({ pts, pillAt, ...e }) => ({ ...e, pts: [[0, 0], [0, 0]] })));
  const routed = applyRoutes(raw, route(raw, { grid: 8 }));
  const probs = buildAsserts([routed], 8).filter((m) => /vertices/.test(m));
  ok('router: every routed end on the decision is a vertex', probs.length === 0, probs.concat(routed.edges.map((e) => e.id + ':' + JSON.stringify(e.pts))));
}

console.log(failed ? `flow selftest: ${failed} FAILED` : 'flow selftest: PASS');
process.exit(failed ? 2 : 0);
