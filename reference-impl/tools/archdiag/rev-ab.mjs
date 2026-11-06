#!/usr/bin/env node
// tools/archdiag/rev-ab.mjs — router revision A/B kit (MAINTENANCE.md "Router revisions").
//
// Why: M1 proves issued pages keep their bytes (they pin their rev); it cannot
// show what a NEW router rev does to the drawings. Rev 4 (2026-11-07) shipped a
// side effect (the rev-3 title-anchor guard read `rev !== 3`) that only this
// comparison caught: 7 views moved with nothing in the new rules to explain it.
//
// What it does: every archdiag build M1 knows (same folder discovery: m1.mjs
// --list) whose route() calls can be rewritten is rebuilt twice, every route()
// forced to --old and to --new, into copies beside the original (builds import
// relatively). Then, per view:
//   * metrics: crossings, length, bends, warnings by code, changed edge ids;
//   * explained-change check: each edge the new rev moves must carry one of
//     --codes in the OLD render (direct) or sit in a view that has such an edge
//     (ripple). Anything else is UNEXPLAINED: a side effect of the rev bump.
//     It rules on whether a move is explained, never on better/worse (that is
//     a blind review or the owner's look);
//   * overlay PNG per changed view: old-only ink red, new-only ink blue, the
//     rest faded grey (computed in a canvas, no alpha channel needed). An
//     unchanged view comes out blank.
// Every file the copies write is moved into --out; a tracked file touched in a
// build folder aborts the run (exit 2) and is named.
//
// Usage:
//   node tools/archdiag/rev-ab.mjs --old 3 --new 4 --out <dir> [--codes L16,L17] [--no-overlay]
//   node tools/archdiag/rev-ab.mjs --selftest
// Exit: 0 every move explained; 1 some UNEXPLAINED; 2 harness abort / bad args /
// selftest fail; 3 nothing measured. A build that fails at either rev is listed
// as excluded and does not change the exit code.

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { clearanceWarnings, viewsFromHtml } from './clearance.mjs';
import { cjkW } from './emit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PW = path.resolve(HERE, '..', 'ui-shot', 'node_modules', 'playwright', 'index.mjs');
const TAG = '_revab-';

// ---------- pure parts (selftest covers these) ----------
const segs = (p) => p.slice(1).map((q, i) => [p[i], q]);
const cross = (s, t) => {
  const sv = s[0][0] === s[1][0], tv = t[0][0] === t[1][0];
  if (sv === tv) return false;
  const [v, h] = sv ? [s, t] : [t, s];
  const inn = (a, b, c) => c > Math.min(a, b) && c < Math.max(a, b);
  return inn(h[0][0], h[1][0], v[0][0]) && inn(v[0][1], v[1][1], h[0][1]);
};
export function metrics(v) {
  let crossings = 0, length = 0, bends = 0;
  v.edges.forEach((e, i) => {
    length += segs(e.pts).reduce((t, [a, b]) => t + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);
    bends += Math.max(0, e.pts.length - 2);
    for (const f of v.edges.slice(i + 1)) for (const s of segs(e.pts)) for (const t of segs(f.pts)) if (cross(s, t)) crossings++;
  });
  const warn = {};
  for (const w of clearanceWarnings(v)) warn[w.code] = (warn[w.code] || 0) + 1;
  return { crossings, length: Math.round(length), bends, warn };
}
// old/new: views of one id. Returns [{edge, kind}] for every moved edge.
export function explain(oldV, newV, codes) {
  const flagged = new Set(clearanceWarnings(oldV).filter((w) => codes.includes(w.code))
    .map((w) => (w.message.match(/^\S+ (\S+) \(/) || [])[1]).filter(Boolean));
  const out = [];
  for (const e of oldV.edges) {
    const o = newV.edges.find((q) => q.id === e.id);
    if (o && JSON.stringify(o.pts) === JSON.stringify(e.pts)) continue;
    out.push({ edge: e.id, kind: flagged.has(e.id) ? 'direct' : flagged.size ? 'ripple' : 'UNEXPLAINED', flagged: [...flagged] });
  }
  return out;
}
// rewrite every route(x, { ... }) so its options end in `rev: R`
export function forceRev(src, R) {
  let n = 0;
  const text = src.replace(/route\(([^,()]+), \{([^{}]*)\}\)/g, (m, a, o) => {
    n++;
    const opts = o.replace(/,?\s*rev:\s*\d+\s*/g, ' ').trim().replace(/,\s*$/, '');
    return `route(${a}, { ${opts}, rev: ${R} })`;
  });
  return { text, n };
}

function selftest() {
  const box = (id, x, y) => ({ id, x, y, w: 80, h: 40 });
  const nodes = [box('A', 0, 0), box('B', 400, 0), box('C', 0, 200), box('D', 400, 200)];
  const grp = { id: 'G', x: -20, y: -40, w: 520, h: 100, title: 'g', role: 'group' };
  const base = { id: 'v', nodes, containers: [grp] };
  const straight = { id: 'e1', from: 'A', to: 'B', pts: [[80, 20], [400, 20]] };
  const outside = { id: 'e1', from: 'A', to: 'B', pts: [[40, 0], [40, -200], [440, -200], [440, 0]] }; // leaves its own group
  const cd = { id: 'e2', from: 'C', to: 'D', pts: [[80, 220], [400, 220]] };
  const cd2 = { id: 'e2', from: 'C', to: 'D', pts: [[40, 240], [40, 300], [440, 300], [440, 240]] };
  const cases = [
    ['moved edge flagged in old -> direct', explain({ ...base, edges: [outside, cd] }, { ...base, edges: [straight, cd] }, ['L16']), (r) => r.length === 1 && r[0].kind === 'direct'],
    ['other edge moved in a flagged view -> ripple', explain({ ...base, edges: [outside, cd] }, { ...base, edges: [straight, cd2] }, ['L16']), (r) => r.find((x) => x.edge === 'e2')?.kind === 'ripple'],
    ['move in a view with no flagged edge -> UNEXPLAINED', explain({ ...base, edges: [straight, cd] }, { ...base, edges: [straight, cd2] }, ['L16']), (r) => r.length === 1 && r[0].kind === 'UNEXPLAINED'],
    ['nothing moved -> empty', explain({ ...base, edges: [straight, cd] }, { ...base, edges: [straight, cd] }, ['L16']), (r) => r.length === 0],
    ['forceRev replaces a pinned rev', forceRev('route(v, { grid: 8, rev: 1 });', 4), (r) => r.n === 1 && r.text === 'route(v, { grid: 8, rev: 4 });'],
    ['forceRev appends to an unpinned call with other options', forceRev("route(views[i], { provider: 'channel', grid: 8 })", 3), (r) => r.text === "route(views[i], { provider: 'channel', grid: 8, rev: 3 })"],
    ['metrics counts one crossing', metrics({ ...base, containers: [], edges: [{ id: 'h', from: 'A', to: 'B', pts: [[0, 100], [300, 100]] }, { id: 'v', from: 'C', to: 'D', pts: [[150, 0], [150, 200]] }] }), (r) => r.crossings === 1 && r.bends === 0],
  ];
  let bad = 0;
  for (const [name, got, ok] of cases) { const pass = ok(got); if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${name}${pass ? '' : ' ' + JSON.stringify(got)}`); }
  console.log(`rev-ab selftest: ${cases.length - bad}/${cases.length}`);
  process.exit(bad ? 2 : 0);
}

// ---------- harness ----------
function arg(name, dflt) { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : dflt; }
const tracked = (dir) => spawnSync('git', ['-C', dir, 'status', '--porcelain', '--untracked-files=no', '--', '.'], { encoding: 'utf8' }).stdout;

function plan() {
  const r = spawnSync(process.execPath, [path.join(HERE, 'm1.mjs'), '--list'], { encoding: 'utf8' });
  const out = []; let dir = null;
  for (const l of r.stdout.split('\n')) {
    const d = l.match(/^ {2}(\S.*)$/), b = l.match(/^ {4}(\S+\.build\.mjs)$/);
    if (d && !b) dir = d[1].trim();
    else if (b && dir && !b[1].startsWith('_')) out.push({ dir, build: b[1] });
  }
  return out;
}

async function shoot(browser, html, view) {
  const p = await browser.newPage({ viewport: { width: 1800, height: 1200 } });
  await p.goto(pathToFileURL(html).href);
  const ok = await p.evaluate((view) => {
    const svg = document.querySelector(`svg.dia[data-view="${view}"]`);
    if (!svg) return false;
    for (let n = svg; n && n !== document.body; n = n.parentElement) { n.hidden = false; if (n.tagName !== 'svg' && getComputedStyle(n).display === 'none') n.style.display = 'block'; }
    return true;
  }, view);
  const buf = ok ? await p.locator(`svg.dia[data-view="${view}"]`).screenshot() : null;
  await p.close();
  return buf;
}
async function overlay(browser, a, b) {
  const p = await browser.newPage();
  const url = await p.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height);
    const px = (img) => { const c = new OffscreenCanvas(w, h), x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const A = px(ia), B = px(ib);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const x = c.getContext('2d'), o = x.createImageData(w, h);
    for (let i = 0; i < A.length; i += 4) {
      const la = (A[i] + A[i + 1] + A[i + 2]) / 3, lb = (B[i] + B[i + 1] + B[i + 2]) / 3;
      let rgb;
      if (lb - la > 40) rgb = [220, 40, 40];        // darker in old only
      else if (la - lb > 40) rgb = [30, 90, 230];   // darker in new only
      else rgb = [0, 1, 2].map((k) => Math.round(B[i + k] * 0.25 + 255 * 0.75));
      o.data.set([...rgb, 255], i);
    }
    x.putImageData(o, 0, 0);
    return c.toDataURL('image/png');
  }, [a.toString('base64'), b.toString('base64')]);
  await p.close();
  return Buffer.from(url.split(',')[1], 'base64');
}

async function main() {
  if (process.argv.includes('--selftest')) return selftest();
  const oldR = +arg('--old'), newR = +arg('--new'), outDir = arg('--out');
  const codes = (arg('--codes', 'L16,L17')).split(',');
  if (!oldR || !newR || !outDir) { console.log('rev-ab FAIL need --old N --new N --out <dir> (see header)'); process.exit(2); }
  fs.mkdirSync(path.join(outDir, 'overlay'), { recursive: true });
  const runs = [], excluded = [];
  for (const { dir, build } of plan()) {
    const src = fs.readFileSync(path.join(dir, build), 'utf8');
    const name = build.slice(0, -'.build.mjs'.length);
    const html = {};
    for (const R of [oldR, newR]) {
      const tag = `${TAG}${name}-r${R}`;
      const { text, n } = forceRev(src, R);
      if (!n) break;
      const body = text.split(`'${name}.html'`).join(`'${tag}.html'`).split('`${STEM}.html`').join(`\`${tag}.html\``);
      const before = tracked(dir);
      const listing = new Set(fs.readdirSync(dir));
      fs.writeFileSync(path.join(dir, tag + '.build.mjs'), body);
      const r = spawnSync(process.execPath, [tag + '.build.mjs'], { cwd: dir, encoding: 'utf8' });
      // every file the copy wrote (its own name carries the tag) moves to --out
      // copy + unlink, not rename: a build folder may sit on another drive than --out
      for (const f of fs.readdirSync(dir)) if (!listing.has(f) && f.includes(TAG.slice(1))) { fs.copyFileSync(path.join(dir, f), path.join(outDir, f)); fs.unlinkSync(path.join(dir, f)); }
      if (tracked(dir) !== before) {
        // put back only files that were clean before this build ran (never another session's edit)
        const was = new Set(before.split('\n').filter(Boolean).map((l) => l.slice(3)));
        const hit = tracked(dir).split('\n').filter(Boolean).map((l) => l.slice(3)).filter((f) => !was.has(f));
        for (const f of hit) spawnSync('git', ['-C', dir, 'checkout', '--', f]);
        console.log(`rev-ab ABORT: ${dir}/${build} at rev ${R} wrote tracked files (restored to HEAD): ${hit.join(', ')}`);
        process.exit(2);
      }
      const h = path.join(outDir, tag + '.html');
      if (r.status !== 0 || !fs.existsSync(h)) {
        const why = `${r.stderr || ''}${r.stdout || ''}`.split('\n').map((l) => l.trim()).filter((l) => /error|fail/i.test(l)).pop() || '';
        excluded.push(`${name} (rev ${R}: exit ${r.status}${why ? ' — ' + why.slice(0, 160) : ''})`);
        break;
      }
      html[R] = h;
    }
    if (html[oldR] && html[newR]) runs.push({ dir, name, html });
  }
  if (!runs.length) { console.log('rev-ab: nothing measured'); process.exit(3); }
  const report = []; let unexplained = 0;
  // overlays need playwright (this machine: tools/ui-shot; elsewhere set ARCHDIAG_PLAYWRIGHT
  // to its index.mjs); without it the run measures and checks, and says overlays were skipped
  const pw = process.env.ARCHDIAG_PLAYWRIGHT || PW;
  let browser = null;
  if (!process.argv.includes('--no-overlay')) {
    if (fs.existsSync(pw)) browser = await (await import(pathToFileURL(pw).href)).chromium.launch();
    else console.log(`rev-ab: overlays skipped — playwright not found at ${pw} (set ARCHDIAG_PLAYWRIGHT, or pass --no-overlay)`);
  }
  for (const { name, html } of runs) {
    const A = viewsFromHtml(fs.readFileSync(html[oldR], 'utf8'), cjkW).filter((v) => v.nodes.length);
    const B = viewsFromHtml(fs.readFileSync(html[newR], 'utf8'), cjkW).filter((v) => v.nodes.length);
    for (const a of A) {
      const b = B.find((x) => x.id === a.id);
      if (!b) continue;
      const moves = explain(a, b, codes);
      unexplained += moves.filter((m) => m.kind === 'UNEXPLAINED').length;
      const row = { page: name, view: a.id, edges: a.edges.length, moves, old: metrics(a), new: metrics(b) };
      if (moves.length && browser) {
        const [sa, sb] = [await shoot(browser, html[oldR], a.id), await shoot(browser, html[newR], a.id)];
        if (sa && sb) { const f = path.join(outDir, 'overlay', `${name}--${a.id}.png`); fs.writeFileSync(f, await overlay(browser, sa, sb)); row.overlay = f; }
      }
      report.push(row);
    }
  }
  if (browser) await browser.close();
  fs.writeFileSync(path.join(outDir, 'rev-ab.json'), JSON.stringify({ old: oldR, new: newR, codes, excluded, report }, null, 1));
  const sum = (k, f) => report.reduce((s, r) => s + f(r[k]), 0);
  const w = (m) => Object.values(m.warn).reduce((a, b) => a + b, 0);
  const changed = report.filter((r) => r.moves.length);
  console.log(`rev-ab rev ${oldR} -> ${newR}: ${report.length} views, ${changed.length} changed, ${sum('moves', (m) => m.length)} of ${report.reduce((s, r) => s + r.edges, 0)} edges moved`);
  for (const k of ['crossings', 'length', 'bends']) console.log(`  ${k}: ${sum('old', (m) => m[k])} -> ${sum('new', (m) => m[k])}`);
  console.log(`  warnings: ${sum('old', w)} -> ${sum('new', w)}`);
  for (const r of changed) for (const m of r.moves) console.log(`  ${r.page}/${r.view} ${m.edge}: ${m.kind}`);
  for (const x of excluded) console.log(`  excluded (build fails): ${x}`);
  console.log(`rev-ab: UNEXPLAINED ${unexplained}; report ${path.join(outDir, 'rev-ab.json')}`);
  process.exit(unexplained ? 1 : 0);
}
await main();
