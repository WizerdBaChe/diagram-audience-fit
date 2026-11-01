// tools/archdiag/topology.mjs — topology-readability WARNINGS (2026-10-19; T5 2026-10-21).
//
// Why: the geometry asserts (asserts.mjs, selfcheck.mjs #1-#10) prove a
// drawing is not BROKEN; none of them proves it SHOWS the topology. A layout
// that stacks every node in one column and routes every edge along one side
// trunk passes all of them trivially (zero overlaps, zero crossings, grid
// clean). Field case: an outside fork of this pack shipped 22 of 36 views in
// that shape (proposal 提案單_架構圖拓撲退化檢查_20261019.md).
//
// Severity: readability is NOT determinable from geometry, so every check
// here is downgrade-and-forward — a WARN naming the measured value and the
// threshold, never a build FAIL (gate-design: rule only on what you can
// determine). build() logs and returns them; the CLI exits 1 on any WARN
// (afgate convention: 1 = WARN only, 2 = broken/calibration failure).
//
// One core over a neutral shape, two adapters: fromViews() for the archdiag
// model (build time) and fromHtml() for an emitted page — archdiag's own
// markup or the foreign `svg[data-scene]` dialect — so the artifact face
// reads the bytes a reader gets.
//
// CLI:  node topology.mjs <page.html ...>     node topology.mjs --selftest

import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

export const TOPO = {
  minNodes: 5,        // T1: a single line of fewer nodes is just a small figure
  trunkShare: 0.5,    // T2: share of a view's edges riding one collinear run
  trunkMinEdges: 4,   // T2: 2-3 edges on one run is a deliberate bundle
  listMinNodes: 3,    // T3: boxes in one line with no edge at all
  gridMinNodes: 6,    // T5: boxes in a 2D grid with no edge at all (2026-10-21, V1b case)
};
// T4: containment drawn as an arrow (edge label). Model face only — an
// emitted page does not tie pill text to its edge.
export const CONTAIN_LABEL = /^\s*(包含|含有|contains?|has[- ]part|part[- ]of)\s*$/i;
// Views skipped by declaration, reported as the declined pile (never silent).
export const SKIP_VIEW = /legend|圖例/i;

const r = (n) => Math.round(n);

// every node's [lo, hi] interval along an axis shares one common point
function oneLine(nodes, lo, len) {
  const maxLo = Math.max(...nodes.map((n) => n[lo]));
  const minHi = Math.min(...nodes.map((n) => n[lo] + n[len]));
  return maxLo < minHi;
}

// T2 helper: largest set of distinct edges chained by collinear overlap
function largestRun(edges) {
  const runs = new Map(); // 'v|x' or 'h|y' -> [{e, a, b}]
  edges.forEach((e, i) => {
    const p = e.pts || [];
    for (let k = 1; k < p.length; k++) {
      const [x1, y1] = p[k - 1], [x2, y2] = p[k];
      let key, a, b;
      if (r(x1) === r(x2) && r(y1) !== r(y2)) { key = `v|${r(x1)}`; a = Math.min(y1, y2); b = Math.max(y1, y2); }
      else if (r(y1) === r(y2) && r(x1) !== r(x2)) { key = `h|${r(y1)}`; a = Math.min(x1, x2); b = Math.max(x1, x2); }
      else continue;
      if (!runs.has(key)) runs.set(key, []);
      runs.get(key).push({ e: i, a, b });
    }
  });
  let best = { size: 0, at: '' };
  for (const [key, segs] of runs) {
    segs.sort((s, t) => s.a - t.a);
    let group = new Set(), hi = -Infinity;
    const flush = () => { if (group.size > best.size) best = { size: group.size, at: key }; };
    for (const s of segs) {
      if (s.a < hi - 1) { group.add(s.e); hi = Math.max(hi, s.b); } // overlap > 1px
      else { flush(); group = new Set([s.e]); hi = s.b; }
    }
    flush();
  }
  return best;
}

// shape: { views: [{ id, nodes: [{id,x,y,w,h}], edges: [{id,from,to,pts,label?}] }] }
export function topologyWarnings(shape, t = TOPO) {
  const warnings = [], metrics = [], skipped = [], unmeasured = [];
  for (const v of shape.views) {
    if (SKIP_VIEW.test(v.id)) { skipped.push(v.id); continue; }
    // no node the adapter recognises (hand-drawn markup): declined, not passed
    if (!v.nodes.length) { unmeasured.push(v.id); continue; }
    const nodes = v.nodes, edges = v.edges;
    const W = (code, value, threshold, message) => warnings.push({ code, view: v.id, value, threshold, message });
    const col = nodes.length > 1 && oneLine(nodes, 'x', 'w');
    const row = nodes.length > 1 && oneLine(nodes, 'y', 'h');
    const line = col ? 'column' : row ? 'row' : null;
    let skip = 0;
    if (line) {
      const order = [...nodes].sort((a, b) => (col ? a.y - b.y : a.x - b.x)).map((n) => n.id);
      const idx = Object.fromEntries(order.map((id, i) => [id, i]));
      skip = edges.filter((e) => idx[e.from] !== undefined && idx[e.to] !== undefined && Math.abs(idx[e.from] - idx[e.to]) > 1).length;
    }
    const run = largestRun(edges);
    const contain = edges.filter((e) => e.label && CONTAIN_LABEL.test(e.label)).length;
    metrics.push({ view: v.id, nodes: nodes.length, edges: edges.length, line: line || 'none', skipEdges: skip, largestRun: run.size, contain });
    // T1 single line + skip edges: nodes stacked in one column/row while edges
    // join non-adjacent nodes — every such edge must detour around the stack.
    if (line && nodes.length >= t.minNodes && skip > 0)
      W('single-line', { line, nodes: nodes.length, skipEdges: skip }, `nodes >= ${t.minNodes} in one ${line} with any non-adjacent edge`,
        `all ${nodes.length} nodes sit in one ${line}; ${skip} edge(s) join non-adjacent nodes and must detour — place nodes in 2D`);
    // T2 trunk: one collinear run carries most edges, so endpoints are unreadable.
    if (edges.length && run.size >= t.trunkMinEdges && run.size / edges.length >= t.trunkShare)
      W('trunk', { run: run.size, edges: edges.length, at: run.at }, `>= ${t.trunkMinEdges} edges and >= ${t.trunkShare * 100}% on one run`,
        `${run.size} of ${edges.length} edges share one collinear run (${run.at}); readers cannot tell which edge goes where`);
    // T3 list drawn as a diagram: boxes in one line and no edge at all.
    if (line && nodes.length >= t.listMinNodes && edges.length === 0)
      W('no-edges', { line, nodes: nodes.length }, `>= ${t.listMinNodes} nodes in one ${line}, 0 edges`,
        `${nodes.length} boxes in one ${line} with no edge — this is a list; use a table, or slice by flow so the edges stay inside`);
    // T5 grid drawn as a diagram: T3's 2D twin. Field case: hook-spine audit V1b,
    // 30 boxes in two columns and 0 edges, passed T3 because it is not one line.
    // The relations live in a matrix, so the view should be the matrix.
    if (!line && nodes.length >= t.gridMinNodes && edges.length === 0)
      W('grid-no-edges', { nodes: nodes.length }, `>= ${t.gridMinNodes} nodes in a 2D layout, 0 edges`,
        `${nodes.length} boxes laid out in 2D with no edge — the relations are not on the canvas; use a matrix/table view (e.g. an interception-chain registration matrix) and keep the boxes as an index`);
    // T4 containment drawn as an arrow.
    if (contain)
      W('contain-edge', { edges: contain }, 'any edge labelled as containment',
        `${contain} edge(s) labelled as containment — draw the parent as a container with the parts inside`);
  }
  return { warnings, metrics, skipped, unmeasured };
}

// ---- adapters ----

export function fromViews(views) {
  return {
    views: views.map((v) => ({
      id: v.id,
      nodes: v.nodes.map(({ id, x, y, w, h }) => ({ id, x, y, w, h })),
      edges: v.edges.map((e) => ({ id: e.id, from: e.from, to: e.to, pts: e.pts || [], label: e.pill })),
    })),
  };
}

const attrs = (s) => Object.fromEntries([...s.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]));
const nums = (s) => (s.match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
const pairs = (a) => { const p = []; for (let i = 0; i + 1 < a.length; i += 2) p.push([a[i], a[i + 1]]); return p; };

export function fromHtml(html) {
  const views = [];
  for (const m of html.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)) {
    const a = attrs(m[1]);
    const id = a['data-view'] || a['data-scene'];
    if (!id) continue; // not a diagram svg (icons, markers)
    const body = m[2], nodes = [], edges = [];
    for (const t of body.matchAll(/<(g|rect|path|polyline)\b([^>]*)>/g)) {
      const k = t[1], at = attrs(t[2]);
      if (k === 'g' && /\bnode\b/.test(at.class || '') && at['data-id'])
        nodes.push({ id: at['data-id'], x: +at['data-x'], y: +at['data-y'], w: +at['data-w'], h: +at['data-h'] });
      else if (k === 'rect' && at['data-node'] && at['data-id'])
        nodes.push({ id: at['data-id'], x: +at.x, y: +at.y, w: +at.width, h: +at.height });
      else if ((k === 'path' || k === 'polyline') && at['data-from'] && at['data-to'])
        edges.push({ id: at['data-edge'] || `${at['data-from']}>${at['data-to']}`, from: at['data-from'], to: at['data-to'],
          pts: pairs(nums(k === 'path' ? at.d : at.points)) });
    }
    views.push({ id, nodes, edges });
  }
  return { views };
}

// ---- calibration: every check fires on a known-true and stays silent on a known-false ----

function selftest() {
  const box = (id, x, y) => ({ id, x, y, w: 160, h: 56 });
  const stack = ['a', 'b', 'c', 'd', 'e'].map((id, i) => box(id, 16, 16 + i * 88));
  const grid2d = [box('a', 16, 16), box('b', 256, 16), box('c', 496, 16), box('d', 16, 160), box('e', 256, 160)];
  const grid6 = [...grid2d, box('f', 496, 160)];
  const side = (f, t, i) => ({ id: `${f}${t}`, from: f, to: t, pts: [[176, 30 + i], [216, 30 + i], [216, 300 + i], [176, 300 + i]] });
  const cases = [
    ['single-line', true, { id: 'p1', nodes: stack, edges: [{ id: 'ac', from: 'a', to: 'c', pts: [[176, 44], [216, 44], [216, 220], [176, 220]] }] }],
    ['single-line', false, { id: 'n1', nodes: stack, edges: [{ id: 'ab', from: 'a', to: 'b', pts: [[96, 72], [96, 104]] }] }],   // a vertical chain is fine
    ['single-line', false, { id: 'n1b', nodes: grid2d, edges: [{ id: 'ac', from: 'a', to: 'c', pts: [[176, 44], [496, 44]] }] }],
    ['trunk', true, { id: 'p2', nodes: grid2d, edges: ['ab', 'ac', 'ad', 'ae'].map((s, i) => side(s[0], s[1], i * 0)) }],
    ['trunk', false, { id: 'n2', nodes: grid2d, edges: [side('a', 'b', 0), side('a', 'c', 0), { id: 'de', from: 'd', to: 'e', pts: [[176, 188], [256, 188]] }, { id: 'be', from: 'b', to: 'e', pts: [[336, 72], [336, 160]] }] }],
    ['no-edges', true, { id: 'p3', nodes: stack, edges: [] }],
    ['no-edges', false, { id: 'n3', nodes: grid2d, edges: [] }],
    ['no-edges', false, { id: 'legend-x', nodes: stack, edges: [] }], // declared skip
    ['grid-no-edges', true, { id: 'p5', nodes: grid6, edges: [] }],
    ['grid-no-edges', false, { id: 'n5', nodes: grid2d, edges: [] }],            // 5 < gridMinNodes
    ['grid-no-edges', false, { id: 'n5b', nodes: grid6, edges: [{ id: 'ab', from: 'a', to: 'b', pts: [[176, 44], [256, 44]] }] }],
    ['grid-no-edges', false, { id: 'n5c', nodes: [...stack, box('f', 16, 456)], edges: [] }], // one line: T3's case, not T5's
    ['grid-no-edges', false, { id: 'legend-g', nodes: grid6, edges: [] }],       // declared skip
    ['contain-edge', true, { id: 'p4', nodes: grid2d, edges: [{ id: 'ab', from: 'a', to: 'b', pts: [[176, 44], [256, 44]], label: '包含' }] }],
    ['contain-edge', false, { id: 'n4', nodes: grid2d, edges: [{ id: 'ab', from: 'a', to: 'b', pts: [[176, 44], [256, 44]], label: '包含檔案清單' }] }],
  ];
  let ok = true;
  for (const [code, must, view] of cases) {
    const fired = topologyWarnings({ views: [view] }).warnings.some((w) => w.code === code);
    const pass = fired === must;
    ok &&= pass;
    console.log(`${pass ? 'ok  ' : 'FAIL'} ${code.padEnd(12)} ${must ? 'must fire' : 'must not'} -> ${fired ? 'fired' : 'silent'} (${view.id})`);
  }
  // HTML adapter: both dialects parse to the same shape
  const a = fromHtml('<svg class="dia" data-view="v"><g class="node" data-id="a" data-x="16" data-y="16" data-w="160" data-h="56"></g><path d="M176 44 L256 44" class="edge" data-edge="e1" data-from="a" data-to="b"/></svg>');
  const b = fromHtml('<svg data-scene="v"><rect data-node="1" data-id="a" x="16" y="16" width="160" height="56"/><polyline data-from="a" data-to="b" points="176,44 256,44"/></svg>');
  const same = JSON.stringify(a.views[0].nodes) === JSON.stringify(b.views[0].nodes) && JSON.stringify(a.views[0].edges[0].pts) === JSON.stringify(b.views[0].edges[0].pts);
  ok &&= same;
  console.log(`${same ? 'ok  ' : 'FAIL'} adapters     archdiag and data-scene markup parse alike`);
  console.log(`calibration: ${ok ? 'PASS' : 'FAIL'}`);
  return ok ? 0 : 2;
}

function cli(argv) {
  if (argv[0] === '--selftest') return selftest();
  if (!argv.length) { console.error('usage: node topology.mjs <page.html ...> | --selftest'); return 2; }
  let any = false;
  for (const f of argv) {
    const shape = fromHtml(fs.readFileSync(f, 'utf8'));
    const { warnings, metrics, skipped, unmeasured } = topologyWarnings(shape);
    console.log(`== ${f}`);
    if (!shape.views.length) console.log('   NOT MEASURED: no <svg data-view|data-scene> in this page (hand-drawn markup is declined, not passed)');
    if (unmeasured.length) console.log(`   NOT MEASURED: ${unmeasured.join(', ')} (no recognised node markup)`);
    for (const m of metrics)
      console.log(`   ${m.view}: nodes=${m.nodes} edges=${m.edges} line=${m.line} skipEdges=${m.skipEdges} largestRun=${m.largestRun}`);
    for (const w of warnings) console.log(`WARN ${w.code} ${w.view}: ${w.message} [value ${JSON.stringify(w.value)}; threshold ${w.threshold}]`);
    console.log(`   ${metrics.length} view(s), ${warnings.length} warning(s); skipped by declaration: ${skipped.join(', ') || 'none'}`);
    any ||= warnings.length > 0;
  }
  return any ? 1 : 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])) process.exitCode = cli(process.argv.slice(2));
