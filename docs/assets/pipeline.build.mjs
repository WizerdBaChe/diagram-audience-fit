#!/usr/bin/env node
// Regeneration source for docs/assets/pipeline.zh-TW.svg — the README "運作流程" diagram.
// audience-fit A1 with no original (reader = a first-pass README visitor), drawn per
// presentational-view.md R1-R14; R14 supplies the visual vocabulary where the README's other
// images do not (one accent reading path with numbered steps, <= 4 dual-coded edge kinds,
// two text registers, spacing budget). Node and colour semantics are inherited from the
// README's existing images (R9): grey capsule = outside the drawing session, blue = step,
// amber = deliverable, pink diamond = check; red dashed = sent back.
//
//   node docs/assets/pipeline.build.mjs             build + model asserts (exit 1 on any FAIL)
//   node docs/assets/pipeline.build.mjs --selftest  known-bad controls must FAIL (exit 2 if not)
//   node docs/assets/pipeline.build.mjs --mapping   print the R5 node -> source table
//
// The PNG and the in-browser text-fit check come from build_assets.py --only pipeline.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hopEdges, DOT_R } from '../../reference-impl/tools/archdiag/hops.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// ── anchors (R11): every coordinate below derives from these ─────────────────
const W = 148, H = 64;            // standard node
const DW = 176, DH = 88;          // check (diamond)
const PITCH = 312;                // column pitch: rect gap 164, diamond gap 150, both >= W (R14 B-22)
const CAP = 180;                  // capsule width: its round ends hold no text
const X0 = 40 + CAP / 2;          // first column centre
const COL = [0, 1, 2, 3, 4].map((i) => X0 + i * PITCH);
const PAD = { x: 28, top: 64, bottom: 56 };   // one fixed group pad (R11)
const G1_TOP = 20;
const ROW1 = G1_TOP + PAD.top + DH / 2;       // row 1 centre
const G1_BOTTOM = ROW1 + DH / 2 + PAD.bottom;
const BAND = G1_BOTTOM + 26;                  // the line-wrap run between the two groups
const G2_TOP = BAND + 26;
const ROW2 = G2_TOP + PAD.top + DH / 2;
const G2_BOTTOM = ROW2 + DH / 2 + PAD.bottom;
const LANE = 28;                  // two edges leaving one side sit LANE either side of centre
const ARC = 26;                   // run between a check's vertex and its send-back line
const MARK = 10;                  // arrowhead length; terminal run must be >= 1.5 * MARK (R10)
const LEGEND_Y = G2_BOTTOM + 40;
const CANVAS = { w: COL[4] + 74 + PAD.x + 28, h: LEGEND_Y + 30 };

const C = {
  ink: '#1f2328', mute: '#57606a', bg: '#ffffff', groupFill: '#fafbfc', groupLine: '#d0d7de',
  accent: '#0969da', side: '#6e7781', back: '#cf222e',
  ext: ['#eef1f4', '#57606a'], step: ['#ddeafb', '#3b74c9'], out: ['#fcecc9', '#c58a16'], check: ['#fce4ee', '#bf1f5a'],
};

const T = {  // zh-TW text; one term per thing with README.md (R14 B-19)
  title: '運作流程',
  g1: '① 畫圖（diagram-authoring）', g2: '② 對讀者調校（audience-fit）',
  legend: ['主路徑：照編號讀', '旁支', '不通過時退回'], pass: '通過', fail: '不通過',
};

// kind: ext | step | out | check.  src = what each node depicts (R5, A1 with no original).
const nodes = [
  { id: 'SRC', kind: 'ext', col: 0, row: 1, w: CAP, name: '來源', role: '程式・設定・設計文件',
    src: 'README.md L99 node S; diagram-authoring/SKILL.md L38 Step 0' },
  { id: 'MOD', kind: 'step', col: 1, row: 1, name: '文字模型', role: '節點表・邊表・狀態表',
    src: 'README.md L99 node M; diagram-authoring/SKILL.md L97 Step 2' },
  { id: 'CHK', kind: 'check', col: 2, row: 1, name: '結構檢查',
    src: 'README.md L100-101 node G', cut: 'role 「schema・斷言」 -> step list sentence ② (no room in a diamond)' },
  { id: 'REN', kind: 'step', col: 3, row: 1, name: '渲染', role: '路由・跳線・頁內自檢',
    src: 'README.md L102 node R; diagram-authoring/SKILL.md L115 Step 5' },
  { id: 'AUD', kind: 'out', col: 4, row: 1, name: '工程稽核頁', role: '＋缺口報告',
    src: 'README.md L103 node P' },
  { id: 'REV', kind: 'ext', col: 4, row: 2, w: CAP, name: '另一個乾淨脈絡', role: '審缺口表',
    src: 'README.md L104 node V; diagram-authoring/SKILL.md L131' },
  { id: 'FIT', kind: 'step', col: 1, row: 2, name: 'audience-fit', role: '重畫給讀者',
    src: 'README.md L105 node A' },
  { id: 'GATE', kind: 'check', col: 2, row: 2, name: 'afgate 檢查',
    src: 'README.md L106 node K; audience-fit/SKILL.md L216 Gate', cut: 'role 「數字・範圍・用語」 -> step list sentence ⑥' },
  { id: 'OWN', kind: 'out', col: 3, row: 2, name: '擁有者視圖', role: '與原版成對交付',
    src: 'README.md L107 node O' },
];
const groups = [
  { id: 'G1', label: T.g1, contains: ['MOD', 'CHK', 'REN', 'AUD'] },
  { id: 'G2', label: T.g2, contains: ['FIT', 'GATE', 'OWN'] },
];

function geom(n) {
  const cx = X0 + n.col * PITCH, cy = n.row === 1 ? ROW1 : ROW2;
  const w = n.kind === 'check' ? DW : (n.w || W), h = n.kind === 'check' ? DH : H;
  return { ...n, cx, cy, w, h, l: cx - w / 2, r: cx + w / 2, t: cy - h / 2, b: cy + h / 2 };
}

// kind: main (accent, numbered) | side | back.  Points are the orthogonal polyline, tip last.
function edgesOf(N) {
  const n = (id) => N[id];
  return [
    { id: 'e1', kind: 'main', step: 1, from: 'SRC', to: 'MOD', pts: [[n('SRC').r, ROW1], [n('MOD').l, ROW1]], src: 'README.md L99 S-->M' },
    { id: 'e2', kind: 'main', step: 2, from: 'MOD', to: 'CHK', pts: [[n('MOD').r, ROW1], [n('CHK').l, ROW1]], src: 'README.md L100 M-->G' },
    { id: 'e3', kind: 'main', step: 3, text: T.pass, from: 'CHK', to: 'REN', pts: [[n('CHK').r, ROW1], [n('REN').l, ROW1]], src: 'README.md L102 G--通過-->R' },
    { id: 'b1', kind: 'back', text: T.fail, from: 'CHK', to: 'MOD',
      pts: [[n('CHK').cx, n('CHK').t], [n('CHK').cx, n('CHK').t - ARC], [n('MOD').cx, n('CHK').t - ARC], [n('MOD').cx, n('MOD').t]], src: 'README.md L101 G--不通過-->M' },
    { id: 'e4', kind: 'main', step: 4, from: 'REN', to: 'AUD', pts: [[n('REN').r, ROW1], [n('AUD').l, ROW1]], src: 'README.md L103 R-->P' },
    { id: 's1', kind: 'side', from: 'AUD', to: 'REV',
      pts: [[n('AUD').cx + LANE, n('AUD').b], [n('AUD').cx + LANE, n('REV').t]], src: 'README.md L104 P-->V' },
    { id: 'e5', kind: 'main', step: 5, from: 'AUD', to: 'FIT',
      pts: [[n('AUD').cx - LANE, n('AUD').b], [n('AUD').cx - LANE, BAND], [n('FIT').cx, BAND], [n('FIT').cx, n('FIT').t]], src: 'README.md L105 P-->A' },
    { id: 'e6', kind: 'main', step: 6, from: 'FIT', to: 'GATE', pts: [[n('FIT').r, ROW2], [n('GATE').l, ROW2]], src: 'README.md L106 A-->K' },
    { id: 'e7', kind: 'main', step: 7, text: T.pass, from: 'GATE', to: 'OWN', pts: [[n('GATE').r, ROW2], [n('OWN').l, ROW2]], src: 'README.md L107 K-->O' },
    { id: 'b2', kind: 'back', text: T.fail, from: 'GATE', to: 'FIT',
      pts: [[n('GATE').cx, n('GATE').b], [n('GATE').cx, n('GATE').b + ARC], [n('FIT').cx, n('GATE').b + ARC], [n('FIT').cx, n('FIT').b]],
      src: 'audience-fit/SKILL.md L216 Gate (run before delivery; a FAIL is fixed in the companion) — not in README L97-108' },
  ];
}

function groupBox(g, N) {
  const m = g.contains.map((id) => N[id]);
  return { ...g, l: Math.min(...m.map((x) => x.l)) - PAD.x, r: Math.max(...m.map((x) => x.r)) + PAD.x,
    t: Math.min(...m.map((x) => x.t)) - PAD.top, b: Math.max(...m.map((x) => x.b)) + PAD.bottom };
}

// chip geometry: number disc 22, optional text at 14px (CJK ~14px a char), pads 8
const textW = (s) => [...s].reduce((a, ch) => a + (/[⺀-￿]/.test(ch) ? 14 : 7.6), 0);
function chipOf(e) {
  const segs = e.pts.slice(1).map((q, i) => [e.pts[i], q]);
  const [a, b] = segs.reduce((best, s) => (len(s) > len(best) ? s : best));  // longest segment
  const w = e.kind === 'main' ? (e.text ? 22 + 6 + textW(e.text) + 10 : 22) : textW(e.text) + 20;
  const x = (a[0] + b[0]) / 2, y = (a[1] + b[1]) / 2;
  return { x, y, w, h: 22, seg: [a, b], l: x - w / 2, r: x + w / 2, t: y - 11, b: y + 11 };
}
const len = ([a, b]) => Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);

// ── model asserts (determinable from the model: FAIL) ─────────────────────────
function asserts(N, E, G) {
  const fail = [];
  const nodesL = Object.values(N);
  const inside = (p, r, m = 0) => p[0] > r.l - m && p[0] < r.r + m && p[1] > r.t - m && p[1] < r.b + m;
  const onBorder = (p, n) => {
    if (n.kind === 'check') return [[n.l, n.cy], [n.r, n.cy], [n.cx, n.t], [n.cx, n.b]].some((v) => v[0] === p[0] && v[1] === p[1]);
    const onX = p[0] >= n.l && p[0] <= n.r, onY = p[1] >= n.t && p[1] <= n.b;
    return (onX && (p[1] === n.t || p[1] === n.b)) || (onY && (p[0] === n.l || p[0] === n.r));
  };
  for (const e of E) {
    const segs = e.pts.slice(1).map((q, i) => [e.pts[i], q]);
    for (const [a, b] of segs) if (a[0] !== b[0] && a[1] !== b[1]) fail.push(`${e.id}: diagonal segment (R10)`);
    if (!onBorder(e.pts[0], N[e.from])) fail.push(`${e.id}: start not on ${e.from}'s border`);
    if (!onBorder(e.pts.at(-1), N[e.to])) fail.push(`${e.id}: tip not on ${e.to}'s border`);
    if (len(segs.at(-1)) < 1.5 * MARK) fail.push(`${e.id}: terminal run ${len(segs.at(-1))} < ${1.5 * MARK} (squeezed head, R10)`);
    for (const [a, b] of segs) for (const n of nodesL) {
      if (n.id === e.from || n.id === e.to) continue;
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const hit = a[0] === b[0]
        ? a[0] > n.l && a[0] < n.r && Math.max(a[1], b[1]) > n.t && Math.min(a[1], b[1]) < n.b
        : a[1] > n.t && a[1] < n.b && Math.max(a[0], b[0]) > n.l && Math.min(a[0], b[0]) < n.r;
      if (hit || inside(mid, n)) fail.push(`${e.id}: runs through ${n.id}`);
    }
    if (e.kind === 'main' || e.text) {
      const c = chipOf(e), [a, b] = c.seg;
      const lo = a[0] === b[0] ? Math.min(a[1], b[1]) : Math.min(a[0], b[0]);
      const hi = a[0] === b[0] ? Math.max(a[1], b[1]) : Math.max(a[0], b[0]);
      const cl = a[0] === b[0] ? c.t : c.l, ch = a[0] === b[0] ? c.b : c.r;
      if (cl - lo < 14 || hi - ch < 14) fail.push(`${e.id}: chip clearance ${Math.min(cl - lo, hi - ch)} < 14 (R14 B-22)`);
      for (const n of nodesL) if (c.l < n.r && c.r > n.l && c.t < n.b && c.b > n.t) fail.push(`${e.id}: chip on ${n.id}`);
    }
  }
  // parallel runs of different edges: shared or >= 20 apart (R10)
  for (const A of E) for (const B of E) {
    if (A.id >= B.id) continue;
    const sa = A.pts.slice(1).map((q, i) => [A.pts[i], q]), sb = B.pts.slice(1).map((q, i) => [B.pts[i], q]);
    for (const [a, b] of sa) for (const [c, d] of sb) {
      const bothV = a[0] === b[0] && c[0] === d[0], bothH = a[1] === b[1] && c[1] === d[1];
      if (!bothV && !bothH) continue;
      const gap = bothV ? Math.abs(a[0] - c[0]) : Math.abs(a[1] - c[1]);
      const [p1, p2] = bothV ? [[a[1], b[1]], [c[1], d[1]]] : [[a[0], b[0]], [c[0], d[0]]];
      const overlap = Math.min(Math.max(...p1), Math.max(...p2)) - Math.max(Math.min(...p1), Math.min(...p2));
      if (overlap > 0 && gap > 0 && gap < 20) fail.push(`${A.id}/${B.id}: parallel ${gap}px apart (R10)`);
    }
  }
  // spacing budget: neighbours on one row at least one standard node width apart (R14 B-22)
  for (const a of nodesL) for (const b of nodesL) {
    if (a.id >= b.id || a.row !== b.row) continue;
    if (Math.abs(a.col - b.col) !== 1) continue;
    const gap = Math.max(a.l, b.l) - Math.min(a.r, b.r);
    if (gap < W) fail.push(`${a.id}/${b.id}: gap ${gap} < ${W} (R14 B-22)`);
  }
  // groups: disjoint; no foreign node inside; edges keep >= 20 from a border they run along (R10)
  for (const g of G) for (const n of nodesL) {
    const inBox = n.l < g.r && n.r > g.l && n.t < g.b && n.b > g.t;
    if (inBox && !g.contains.includes(n.id)) fail.push(`${n.id} sits inside ${g.id} without being in it`);
  }
  if (G[0].b >= G[1].t && G[0].l < G[1].r && G[0].r > G[1].l) fail.push('G1 and G2 overlap');
  for (const e of E) for (const g of G) {
    const segs = e.pts.slice(1).map((q, i) => [e.pts[i], q]);
    for (const [a, b] of segs) {
      if (a[1] === b[1] && Math.min(a[0], b[0]) < g.r && Math.max(a[0], b[0]) > g.l)
        for (const y of [g.t, g.b]) if (Math.abs(a[1] - y) < 20) fail.push(`${e.id}: runs ${Math.abs(a[1] - y)}px from ${g.id}'s border`);
    }
  }
  const hp = hopEdges(E);
  for (const p of hp.problems) fail.push(`hop problem: ${JSON.stringify(p)}`);
  return { fail, hops: hp };
}

// ── emit ──────────────────────────────────────────────────────────────────────
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const FONT = `font-family="'Segoe UI','Microsoft JhengHei','Noto Sans TC',sans-serif"`;

function emit(N, E, G, hp) {
  const o = [];
  o.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" width="${CANVAS.w}" height="${CANVAS.h}" role="img" aria-labelledby="t d" ${FONT}>`);
  o.push(`<title id="t">${esc(T.title)}</title>`);
  o.push(`<desc id="d">${esc(E.filter((e) => e.kind === 'main').map((e) => `${e.step}. ${N[e.from].name} → ${N[e.to].name}`).join('；'))}</desc>`);
  o.push(`<defs>${['main', 'side', 'back'].map((k) => `<marker id="m-${k}" viewBox="0 0 10 8" refX="10" refY="4" markerWidth="${MARK}" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto"><path d="M0 0L10 4L0 8z" fill="${{ main: C.accent, side: C.side, back: C.back }[k]}"/></marker>`).join('')}</defs>`);
  o.push(`<rect width="100%" height="100%" fill="${C.bg}"/>`);
  for (const g of G) {
    o.push(`<rect data-group="${g.id}" x="${g.l}" y="${g.t}" width="${g.r - g.l}" height="${g.b - g.t}" rx="10" fill="${C.groupFill}" stroke="${C.groupLine}" stroke-width="1.25"/>`);
    o.push(`<text data-label="${g.id}" x="${g.r - 16}" y="${g.t + 26}" text-anchor="end" font-size="15" font-weight="600" fill="${C.mute}">${esc(g.label)}</text>`);
  }
  const style = { main: `stroke="${C.accent}" stroke-width="2.25"`, side: `stroke="${C.side}" stroke-width="1.5"`, back: `stroke="${C.back}" stroke-width="1.5" stroke-dasharray="6 4"` };
  for (const e of E) o.push(`<path data-edge="${e.id}" data-kind="${e.kind}" data-pts="${e.pts.map((p) => p.join(',')).join(' ')}" d="${hp.d.get(e.id)}" fill="none" ${style[e.kind]} marker-end="url(#m-${e.kind})"/>`);
  for (const d of hp.dots) o.push(`<circle cx="${d.at[0]}" cy="${d.at[1]}" r="${DOT_R}" fill="${C.ink}"/>`);
  for (const n of Object.values(N)) {
    const [fill, stroke] = C[n.kind];
    if (n.kind === 'check') {
      o.push(`<path data-node="${n.id}" d="M${n.cx} ${n.t}L${n.r} ${n.cy}L${n.cx} ${n.b}L${n.l} ${n.cy}z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
      o.push(`<text data-name="${n.id}" x="${n.cx}" y="${n.cy + 6}" text-anchor="middle" font-size="18" font-weight="600" fill="${C.ink}">${esc(n.name)}</text>`);
      continue;
    }
    const rx = n.kind === 'ext' ? n.h / 2 : 8;
    o.push(`<rect data-node="${n.id}" x="${n.l}" y="${n.t}" width="${n.w}" height="${n.h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
    o.push(`<text data-name="${n.id}" x="${n.cx}" y="${n.cy - 4}" text-anchor="middle" font-size="18" font-weight="600" fill="${C.ink}">${esc(n.name)}</text>`);
    o.push(`<text data-role="${n.id}" x="${n.cx}" y="${n.cy + 19}" text-anchor="middle" font-size="13" fill="${C.mute}">${esc(n.role)}</text>`);
  }
  for (const e of E) {
    if (!(e.kind === 'main' || e.text)) continue;
    const c = chipOf(e);
    if (e.kind === 'main') {
      o.push(`<g data-chip="${e.id}"><rect x="${c.l}" y="${c.t}" width="${c.w}" height="${c.h}" rx="11" fill="#ffffff" stroke="${C.accent}" stroke-width="1"/>`);
      o.push(`<circle cx="${c.l + 11}" cy="${c.y}" r="11" fill="${C.accent}"/><text x="${c.l + 11}" y="${c.y + 4.5}" text-anchor="middle" font-size="13" font-weight="700" fill="#ffffff">${e.step}</text>`);
      if (e.text) o.push(`<text x="${c.l + 28}" y="${c.y + 5}" font-size="14" fill="${C.accent}">${esc(e.text)}</text>`);
      o.push('</g>');
    } else {
      o.push(`<g data-chip="${e.id}"><rect x="${c.l}" y="${c.t}" width="${c.w}" height="${c.h}" rx="11" fill="#ffffff" stroke="${C.back}" stroke-width="1"/><text x="${c.x}" y="${c.y + 5}" text-anchor="middle" font-size="14" fill="${C.back}">${esc(e.text)}</text></g>`);
    }
  }
  // legend: only the kinds drawn (R14 B-20)
  const kinds = ['main', 'side', 'back'].filter((k) => E.some((e) => e.kind === k));
  let lx = Object.values(N)[0].l;
  for (const k of kinds) {
    const label = T.legend[['main', 'side', 'back'].indexOf(k)];
    o.push(`<path data-legend="${k}" d="M${lx} ${LEGEND_Y}L${lx + 36} ${LEGEND_Y}" fill="none" ${style[k]} marker-end="url(#m-${k})"/>`);
    o.push(`<text x="${lx + 46}" y="${LEGEND_Y + 5}" font-size="14" fill="${C.mute}">${esc(label)}</text>`);
    lx += 46 + textW(label) + 40;
  }
  o.push('</svg>');
  return o.join('\n') + '\n';
}

function model(mutate) {
  const N = Object.fromEntries(nodes.map((n) => [n.id, geom(mutate?.node?.(n) ?? n)]));
  let E = edgesOf(N);
  if (mutate?.edges) E = mutate.edges(E, N);
  const G = groups.map((g) => groupBox(g, N));
  return { N, E, G };
}

const arg = process.argv[2];
if (arg === '--mapping') {
  console.log('| node | depicts (source) | cut |\n|---|---|---|');
  for (const n of nodes) console.log(`| ${n.name} | ${n.src} | ${n.cut || '—'} |`);
  const { N, E } = model();
  console.log('\n| edge | from → to | source |\n|---|---|---|');
  for (const e of E) console.log(`| ${e.id}${e.step ? ` (${e.step})` : ''} | ${N[e.from].name} → ${N[e.to].name} | ${e.src} |`);
} else if (arg === '--selftest') {
  // known-bad controls: each must produce at least one FAIL naming its class
  const controls = [
    ['near-coincident neighbour (gap < W)', { node: (n) => (n.id === 'REN' ? { ...n, col: 2.6 } : n) }, /gap .* < 148|runs through|chip/],
    ['squeezed arrowhead', { edges: (E) => E.map((e) => (e.id === 'b1' ? { ...e, pts: e.pts.map((p, i) => (i === 3 ? [p[0], e.pts[2][1] + 8] : p)) } : e)) }, /terminal run|tip not on/],
    ['edge through a node', { edges: (E, N) => E.map((e) => (e.id === 'e1' ? { ...e, pts: [[N.SRC.r, ROW1], [N.CHK.l, ROW1]], to: 'CHK' } : e)) }, /runs through MOD/],
    ['parallel runs 6px apart', { edges: (E) => E.map((e) => (e.id === 's1' ? { ...e, pts: e.pts.map((p) => [p[0] - 2 * LANE + 6, p[1]]) } : e)) }, /parallel 6px|start not on|tip not on/],
  ];
  let bad = 0;
  for (const [name, m, re] of controls) {
    const { N, E, G } = model(m);
    const { fail } = asserts(N, E, G);
    const ok = fail.some((f) => re.test(f));
    console.log(`${ok ? 'fires' : 'SILENT'}  ${name}${ok ? '' : `  (got: ${fail.join('; ') || 'nothing'})`}`);
    if (!ok) bad++;
  }
  const clean = asserts(...Object.values(model()));
  console.log(`${clean.fail.length ? 'FALSE ALARM' : 'quiet'}  known-good model (${clean.fail.length} FAIL)`);
  process.exit(bad || clean.fail.length ? 2 : 0);
} else {
  const { N, E, G } = model();
  const { fail, hops } = asserts(N, E, G);
  for (const f of fail) console.log(`FAIL ${f}`);
  const out = path.join(HERE, 'pipeline.zh-TW.svg');
  fs.writeFileSync(out, emit(N, E, G, hops));
  console.log(`${fail.length} FAIL · ${Object.keys(N).length} nodes · ${E.length} edges · ${hops.dots.length} dots · canvas ${CANVAS.w}x${CANVAS.h} -> ${path.relative(process.cwd(), out)}`);
  process.exit(fail.length ? 1 : 0);
}
