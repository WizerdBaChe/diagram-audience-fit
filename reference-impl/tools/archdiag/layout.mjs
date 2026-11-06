// tools/archdiag/layout.mjs — layout-legibility warnings on the routed model
// (2026-10-24). WARN only: logged by build() and returned, never thrown, and
// never written into the page, so receipts do not move.
//
// Why: the in-page §4 checks passed tg-outpost-audit-f1 with 0 diagnostics
// while the owner saw a page that reads wrong in places. Each class below is
// one the existing checks do not measure:
//   L1 pill-over-node     a pill's drawn rect overlaps a node (asserts.mjs B-1
//                         only fails a pill whose CENTRE is inside a node)
//   L2 micro-jog          a segment shorter than one grid unit: a visible kink
//                         where two anchors miss each other by a few px
//   L3 shared-track       two edges with no endpoint in common run on the same
//                         line for more than one grid unit: the reader cannot
//                         tell which arrow goes where (e.g. a write and a
//                         read-only poll merged into one line)
//   L4 on-container-edge  an edge runs on a container's dashed border
// A pill sitting on a container border is not here (lane diagrams do this by
// design). An edge passing close to a node was listed here as not determinable
// until 2026-11-07; it is now L11, a WARN (owner saw it as the defect).
// The geometry is the emitted geometry: pill rect = emit.mjs pill formula.

//   L8–L15               clearance classes, owned by clearance.mjs (one source
//                         for builds, the page CLI and owner-view sweeps)

import { cjkW, textLayout } from './emit.mjs';
import { hopPlan, bareCrossings } from './hops.mjs';
import { clearanceWarnings, archdiagTitleBox } from './clearance.mjs';
//   L5 hop-no-room        (crossingStyle 'hop' views) a crossing with no room
//                         for a hop is drawn bare — the fix is a reroute
//   L7 bare-crossing      (crossingStyle 'plain' views) a crossing drawn as a
//                         bare "+" — the pin keeps an issued receipt, the fix
//                         is a re-issue with the default hop style
//   L6 decision-text      a decision's text block (cjkW estimate) leaves the
//                         diamond: the reader sees text over the facet
//                         (estimate, not measured ⇒ WARN, never FAIL)

const segsOf = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
// AP-74 not-same-as: tools/archdiag/route.mjs::isV — this takes one segment; route's compares two points
const isV = (s) => s[0][0] === s[1][0];
// AP-74 not-same-as: tools/archdiag/hops.mjs::isH — this takes one segment; hops' compares two points
const isH = (s) => s[0][1] === s[1][1];
const len = (s) => Math.abs(s[0][0] - s[1][0]) + Math.abs(s[0][1] - s[1][1]);

// collinear overlap of two axis-parallel segments within `gap` px; 0 if none
function runOverlap(s, t, gap = 0) {
  if (isV(s) && isV(t) && Math.abs(s[0][0] - t[0][0]) <= gap) {
    return Math.min(Math.max(s[0][1], s[1][1]), Math.max(t[0][1], t[1][1])) - Math.max(Math.min(s[0][1], s[1][1]), Math.min(t[0][1], t[1][1]));
  }
  if (isH(s) && isH(t) && Math.abs(s[0][1] - t[0][1]) <= gap) {
    return Math.min(Math.max(s[0][0], s[1][0]), Math.max(t[0][0], t[1][0])) - Math.max(Math.min(s[0][0], s[1][0]), Math.min(t[0][0], t[1][0]));
  }
  return 0;
}
const overlaps = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function layoutWarnings(views, grid = 8) {
  const warnings = [];
  const add = (code, view, message) => warnings.push({ code, view, message });
  for (const v of views) {
    const edges = (v.edges || []).filter((e) => Array.isArray(e.pts) && e.pts.length >= 2);
    const nodes = v.nodes || [];
    for (const e of edges) {
      if (!e.pill || !e.pillAt) continue;
      const w = Math.ceil(cjkW(e.pill, 11)) + 12;
      const r = { x: e.pillAt[0] - w / 2, y: e.pillAt[1] - 9, w, h: 18 };
      for (const n of nodes) if (overlaps(r, n)) add('L1', v.id, `pill-over-node ${e.id} 「${e.pill}」 overlaps node ${n.id}`);
    }
    for (const e of edges) for (const s of segsOf(e.pts)) {
      const L = len(s);
      if (L > 0 && L < grid) add('L2', v.id, `micro-jog ${e.id} ${L}px segment at (${s[0]})`);
    }
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const a = edges[i], b = edges[j];
      if ([a.from, a.to].some((x) => x === b.from || x === b.to)) continue;   // a shared endpoint may bundle on purpose
      let run = 0;
      for (const s of segsOf(a.pts)) for (const t of segsOf(b.pts)) run += Math.max(0, runOverlap(s, t));
      if (run > grid) add('L3', v.id, `shared-track ${a.id} (${a.from}→${a.to}) and ${b.id} (${b.from}→${b.to}) share ${run}px of line`);
    }
    // L4 on-container-edge lives in clearance.mjs since 2026-11-07 (one source
    // with owner-view sweeps); it is reported through the call below
    const conts = (v.containers || []).map((c) => (c.title ? { ...c, titleBox: archdiagTitleBox(c, cjkW(c.title, 12)) } : c));
    const pills = edges.filter((e) => e.pill && e.pillAt).map((e) => {
      const w = Math.ceil(cjkW(e.pill, 11)) + 12;
      return { x: e.pillAt[0] - w / 2, y: e.pillAt[1] - 9, w, h: 18, text: e.pill };
    });
    for (const w of clearanceWarnings({ id: v.id, nodes, edges, containers: conts, pills })) add(w.code, v.id, w.message);
    for (const p of hopPlan(v).problems) add('L5', v.id, p.message);
    for (const c of bareCrossings(v))
      add('L7', v.id, `bare-crossing ${c.edge} × ${c.other} at (${c.at}) drawn as "+" (crossingStyle 'plain') — re-issue with the default hop style`);
    // L6 for every other kind (2026-11-07): a title or sub-line wider than the
    // box runs out over its border and onto the lines leaving that side
    for (const n of nodes) {
      if (n.kind === 'decision' || n.kind === 'note' || !Number.isFinite(n.w)) continue;
      const t = textLayout(n);
      const room = t.anchor === 'middle' ? n.w - 16 : n.w - 12 - 4;
      const lines = [[n.t, t.titleSize], ...(n.l || []).map((ln) => [ln, 11])];
      for (const [ln, size] of lines) {
        if (!ln) continue;
        const w = cjkW(ln, size);
        if (w > room) { add('L6', v.id, `node-text ${n.id}: 「${ln}」 is ~${Math.round(w)}px in ${Math.round(room)}px of box — widen the node or shorten the line`); break; }
      }
    }
    for (const n of nodes) {
      if (n.kind !== 'decision') continue;
      const t = textLayout(n);
      const cx = n.x + n.w / 2, cy = n.y + n.h / 2;
      // a line box [halfW, top..bottom] fits the diamond iff every corner does: |dx|/(w/2) + |dy|/(h/2) <= 1
      const boxes = [[cjkW(n.t, t.titleSize) / 2, t.titleY - 13, t.titleY + 3],
        ...(n.l || []).map((ln, i) => [cjkW(ln, 11) / 2, t.subY[i] - 11, t.subY[i] + 3])];
      for (const [hw, top, bot] of boxes) {
        const worst = Math.max(Math.abs(top - cy), Math.abs(bot - cy));
        const f = hw / (n.w / 2) + worst / (n.h / 2);
        if (f > 1) { add('L6', v.id, `decision-text ${n.id}: text block leaves the diamond (fill ${f.toFixed(2)} > 1) — widen the node or shorten the question`); break; }
      }
    }
  }
  return { warnings };
}
