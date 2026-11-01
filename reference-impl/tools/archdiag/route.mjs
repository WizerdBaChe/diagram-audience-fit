// tools/archdiag/route.mjs — S2 orthogonal edge router + pill placer.
// Scope: block-diagram views (nodes + containers with hand-authored rects).
// Node POSITIONS are never touched — they carry semantics (D-042); this
// module only computes edge paths and pill anchors. Sequence views keep
// hand-authored pts (message y-order is semantic).
//
// RouterProvider seam (swappable, named): default = 'channel' (this file).
// Named alternative — NOT built until a field trial demands it — is an
// adapted archify candidate/filter routine ('archify-adapted'); its geometry
// primitives are already vendored (./vendor/archify-geometry.mjs) and this
// router builds on them, so a swap changes provider code only, not the
// pipeline. Choose by field trial F3 (selfbuild-scope-eval §4 S2).
//
// Discipline: never silently exceed the view's declaredCrossings budget —
// when the router cannot meet it, it returns B-1 diagnostic objects
// proposing declarations/hints instead (assist-mode degradation is this same
// path: failed edges keep their hand pts if present, or are named for hand
// authoring).
//
// Determinism: fixed iteration orders, no randomness — routed output is a
// pure function of the view model (receipt-friendly, same contract as emit).
//
// Revisions (opts.rev, default 2 since 2026-10-24). A page built before that
// date pins rev: 1 in its build script so its receipt never moves (user ruling
// 2026-10-24: "enable from now on, already-issued pages stay as they are").
//   rev 1 — the original scoring and pill placer.
//   rev 2 — legibility (the layout.mjs L1-L4 classes, found on tg-outpost-audit-f1):
//     * shared track: running on, or within one grid unit of, a routed edge that
//       shares no endpoint costs more than a crossing (a merged write and read-only
//       poll is worse than one honest crossing);
//     * anchor slide: a facing side pair may move both anchors to one common
//       coordinate even when a side has other occupants, if the moved anchor stays
//       >= one grid unit from them (removes the 2px jog next to capsules);
//     * a segment shorter than one grid unit, an end segment shorter than STUB,
//       and a run on a container border cost extra;
//     * after rev-1 pill placement, a second pass moves each pill that overlaps
//       any node (its own endpoints included) to a spot clear of all of them;
//     * corridor pools hold every grid track of a free band, not only its
//       midpoint (without this, every edge through a narrow band is forced onto
//       one line and the shared-track penalty has nothing to choose from).
//
// Borrow ledger (prior-art mandate): B-r1 candidate-generation + predicate-
// filter shape and outward-stub discipline follow archify routeVia /
// sideAwareBridgeCandidates (MIT, see vendor header); B-r2 side-honoring and
// point normalization are vendored verbatim. Corridor scanning, crossing
// budget, pill placement, and B-1 output are archdiag-native.

import { cjkW, textLayout } from './emit.mjs';
import {
  segmentIntersectsRect,
  routeHonorsEndpointSides,
  normalizeRoutePoints,
  rectsOverlap,
} from './vendor/archify-geometry.mjs';

const STUB = 16;        // minimum outward stub before the first turn
const GUTTER = 16;      // corner gutter for anchor slots
const CAP_TOL = 2;      // max gap (px) between an anchor and a capsule's drawn outline
const CLEAR = 8;        // preferred clearance from non-endpoint nodes
const PAD = 2;          // pill/text separation, mirrors in-page check #1
const ALIEN_PEN = 1500; // rev 2: shared track with an unrelated edge (crossing = 1200)

// ---------- rect adapters (our {x,y,w,h} -> vendored {x,y,width,height}) ----------
const R = (n) => ({
  id: n.id, x: n.x, y: n.y, width: n.w, height: n.h,
  cx: n.x + n.w / 2, cy: n.y + n.h / 2,
  // radius of a capsule's round ends (emit.mjs draws ext as a capsule while h <= w;
  // a flowchart term is always one — asserts.mjs fails h > w)
  cap: (n.kind === 'ext' || n.kind === 'term') && n.h <= n.w ? n.h / 2 : 0,
  // a decision diamond is met only at its vertices = the side midpoints
  vertex: n.kind === 'decision',
});
const snap = (v, grid) => Math.round(v / grid) * grid;

const SIDE_NORMAL = { left: [-1, 0], right: [1, 0], top: [0, -1], bottom: [0, 1] };

function sidePoint(rect, side, coord) {
  // coord = position along the side (y for left/right, x for top/bottom)
  switch (side) {
    case 'left': return [rect.x, coord];
    case 'right': return [rect.x + rect.width, coord];
    case 'top': return [coord, rect.y];
    case 'bottom': return [coord, rect.y + rect.height];
    default: throw new Error('unknown side ' + side);
  }
}

function dominantSides(from, to) {
  // Gap-based, not centre-based: pick the axis on which the rects are
  // actually separated (a wide container's centre is meaningless for
  // direction — first run mis-sided every node→container edge, 3 bends
  // where the hand layout had 0).
  const xGap = Math.max(to.x - (from.x + from.width), from.x - (to.x + to.width));
  const yGap = Math.max(to.y - (from.y + from.height), from.y - (to.y + to.height));
  if (xGap < 0 && yGap < 0) {
    const dx = to.cx - from.cx, dy = to.cy - from.cy;
    if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['right', 'left'] : ['left', 'right'];
    return dy >= 0 ? ['bottom', 'top'] : ['top', 'bottom'];
  }
  if (xGap >= yGap) return to.cx >= from.cx ? ['right', 'left'] : ['left', 'right'];
  return to.cy >= from.cy ? ['bottom', 'top'] : ['top', 'bottom'];
}

const clampNum = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Slot bounds along a side (corner-guttered), shared by slotting and the
// off-plan re-anchoring in bestRoute.
function sideRange(rect, side) {
  const horiz = side === 'top' || side === 'bottom';
  const len = horiz ? rect.width : rect.height;
  const base = horiz ? rect.x : rect.y;
  if (rect.vertex) return [base + len / 2, base + len / 2];
  if (rect.cap) {
    // Capsule: keep anchors where the drawn outline lies within CAP_TOL of the bbox
    // side, so an arrow never ends in the air beside a round end.
    const band = Math.sqrt(rect.cap * rect.cap - (rect.cap - CAP_TOL) ** 2);
    if (2 * rect.cap >= len) return [base + len / 2 - band, base + len / 2 + band];
    return [base + rect.cap - band, base + len - rect.cap + band];
  }
  const g = Math.min(GUTTER, len / 4);
  return [base + g, base + len - g];
}

// Anchor for a side chosen outside the plan: project the far end so a facing
// pair yields a straight segment when geometry allows it.
function projectedAnchor(rect, side, other, grid) {
  const [lo, hi] = sideRange(rect, side);
  const coord = (side === 'left' || side === 'right') ? other.cy : other.cx;
  return sidePoint(rect, side, clampNum(snap(clampNum(coord, lo, hi), grid), lo, hi));
}

const ALL_SIDES = ['right', 'left', 'bottom', 'top'];

// ---------- geometry helpers on orthogonal segments ----------
// AP-74 not-same-as: tools/archdiag/layout.mjs::isV — this compares two points; layout's takes one segment
const isV = (a, b) => a[0] === b[0];
function segs(pts) {
  const out = [];
  for (let i = 1; i < pts.length; i++) out.push([pts[i - 1], pts[i]]);
  return out;
}
// interior orthogonal crossing, mirrors the in-page check #6 (+/-1 shrink)
function segsCross(s, t) {
  const sv = isV(s[0], s[1]), tv = isV(t[0], t[1]);
  if (sv === tv) return null;
  const [vv, hh] = sv ? [s, t] : [t, s];
  const x = vv[0][0], y = hh[0][1];
  if (x > Math.min(hh[0][0], hh[1][0]) + 1 && x < Math.max(hh[0][0], hh[1][0]) - 1 &&
      y > Math.min(vv[0][1], vv[1][1]) + 1 && y < Math.max(vv[0][1], vv[1][1]) - 1) return [x, y];
  return null;
}
// collinear same-axis overlap length (visually merged corridors)
function segsOverlapRun(s, t) {
  const sv = isV(s[0], s[1]), tv = isV(t[0], t[1]);
  if (sv !== tv) return 0;
  if (sv) {
    if (s[0][0] !== t[0][0]) return 0;
    const lo = Math.max(Math.min(s[0][1], s[1][1]), Math.min(t[0][1], t[1][1]));
    const hi = Math.min(Math.max(s[0][1], s[1][1]), Math.max(t[0][1], t[1][1]));
    return Math.max(0, hi - lo);
  }
  if (s[0][1] !== t[0][1]) return 0;
  const lo = Math.max(Math.min(s[0][0], s[1][0]), Math.min(t[0][0], t[1][0]));
  const hi = Math.min(Math.max(s[0][0], s[1][0]), Math.max(t[0][0], t[1][0]));
  return Math.max(0, hi - lo);
}

// ---------- corridor scan (free bands across NODE projections; containers
// ---------- are not obstacles — edges may cross layer/lane borders) ----------
function freeBandMids(rects, axis, lo, hi, grid) {
  const iv = rects
    .map((r) => (axis === 'y' ? [r.y, r.y + r.height] : [r.x, r.x + r.width]))
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [a, b] of iv) {
    const last = merged.at(-1);
    if (last && a <= last[1] + 4) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  const out = [];
  let cur = lo;
  const push = (a, b) => {
    if (b - a >= 2 * CLEAR) {
      out.push(snap((a + b) / 2, grid));
      if (b - a >= 6 * CLEAR) { out.push(snap(a + CLEAR, grid)); out.push(snap(b - CLEAR, grid)); }
    }
  };
  for (const [a, b] of merged) { push(cur, a); cur = Math.max(cur, b); }
  push(cur, hi);
  return [...new Set(out)].filter((v) => v >= lo && v <= hi).sort((a, b) => a - b);
}

// rev 2: every grid-snapped track in each free band (CLEAR from its edges), so
// edges through one narrow band can run on parallel tracks instead of the one
// midpoint (the canonical "nudging" step of orthogonal connector routers).
function freeBandTracks(rects, axis, lo, hi, grid) {
  const iv = rects
    .map((r) => (axis === 'y' ? [r.y, r.y + r.height] : [r.x, r.x + r.width]))
    .sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [a, b] of iv) {
    const last = merged.at(-1);
    if (last && a <= last[1] + 4) last[1] = Math.max(last[1], b);
    else merged.push([a, b]);
  }
  const out = [];
  let cur = lo;
  const push = (a, b) => {
    if (b - a < 2 * CLEAR) return;
    for (let v = Math.ceil((a + CLEAR) / grid) * grid; v <= b - CLEAR; v += grid) out.push(v);
    out.push(snap((a + b) / 2, grid));
  };
  for (const [a, b] of merged) { push(cur, a); cur = Math.max(cur, b); }
  push(cur, hi);
  return [...new Set(out)].filter((v) => v >= lo && v <= hi).sort((a, b) => a - b);
}

// ---------- text-bbox estimation (offline mirror of the in-page labels;
// ---------- the real arbiter stays the in-page §4 run with getBBox) ----------
function estimateTextRects(view) {
  const out = [];
  const add = (x, y, w, h) => out.push({ x, y, width: w, height: h });
  for (const n of view.nodes) {
    // placement comes from emit.mjs textLayout — never a literal here
    // (2026-09-02: a stale 38 let the router place two pills into the
    // subtitle's real rect after the emitter moved to 41).
    const t = textLayout(n);
    const left = (w) => (t.anchor === 'middle' ? t.x - w / 2 : t.x);
    const tw = cjkW(n.t, t.titleSize);
    add(left(tw), t.titleY - 13, tw, 16);
    (n.l || []).forEach((ln, i) => {
      const lw = cjkW(ln, 11);
      add(left(lw), t.subY[i] - 11, lw, 14);
    });
    if (n.ov) { const bw = cjkW('未驗收', 11); add(n.x + n.w - 8 - bw, n.y + n.h - 19, bw, 14); }
  }
  for (const c of view.containers || []) {
    if (c.title) add(c.x + 14, c.y + 10, cjkW(c.title, 12), 15);
  }
  return out;
}

// ---------- the default provider: channel router ----------
function channelRouter(view, opts = {}) {
  const grid = opts.grid || 8;
  const rev = opts.rev ?? 2;
  if (rev !== 1 && rev !== 2) throw new Error(`route(): unknown rev ${rev} (known: 1, 2)`);
  const [vbW, vbH] = view.vb;
  const nodeRects = view.nodes.map(R);
  const contRects = (view.containers || []).map(R);
  const byId = Object.fromEntries([...nodeRects, ...contRects].map((r) => [r.id, r]));
  const diagnostics = [];
  const D = (code, subject, evidence, fixes) =>
    diagnostics.push({ code, severity: 'error', subject, evidence, supportedFixes: fixes });

  // a dangling endpoint used to crash in dominantSides with a TypeError; name it instead
  for (const e of view.edges)
    for (const end of ['from', 'to'])
      if (!byId[e[end]]) throw new Error(`route(): ${view.id}/${e.id}.${end} "${e[end]}" resolves to no node/container in this view`);
  // -- phase A: side choice (hints win; else dominant axis)
  const plan = view.edges.map((e) => {
    const from = byId[e.from], to = byId[e.to];
    const [dfs, dts] = dominantSides(from, to);
    return { e, from, to, fs: e.fromSide || dfs, ts: e.toSide || dts };
  });

  // -- phase B: anchor slotting (spread edges sharing a node side; sorted by
  // the far endpoint so near-node crossings are avoided by construction)
  const groups = new Map();
  for (const p of plan) {
    for (const [end, rect, side, other] of [['from', p.from, p.fs, p.to], ['to', p.to, p.ts, p.fs && p.from]]) {
      const key = `${rect.id}|${end === 'from' ? p.fs : p.ts}`;
      if (!groups.has(key)) groups.set(key, []);
      const o = end === 'from' ? p.to : p.from;
      const along = (end === 'from' ? p.fs : p.ts);
      const sortCoord = (along === 'left' || along === 'right') ? o.cy : o.cx;
      groups.get(key).push({ p, end, sortCoord });
    }
  }
  const anchors = new Map(); // `${edgeId}|from` -> [x,y]
  for (const [key, list] of groups) {
    const cut = key.lastIndexOf('|'); // a node id may itself contain '|'; the side never does
    const nodeId = key.slice(0, cut), side = key.slice(cut + 1);
    const rect = byId[nodeId];
    list.sort((a, b) => a.sortCoord - b.sortCoord || (a.p.e.id < b.p.e.id ? -1 : 1));
    const [lo, hi] = sideRange(rect, side);
    if (list.length === 1) {
      // single occupant: project the far end for a straight-line chance
      const item = list[0];
      const other = item.end === 'from' ? item.p.to : item.p.from;
      anchors.set(`${item.p.e.id}|${item.end}`, projectedAnchor(rect, side, other, grid));
    } else {
      list.forEach((item, i) => {
        const t = (i + 1) / (list.length + 1);
        const coord = snap(lo + (hi - lo) * t, grid);
        anchors.set(`${item.p.e.id}|${item.end}`, sidePoint(rect, side, clampNum(coord, lo, hi)));
      });
    }
  }

  // -- candidate parameter pools
  const bands = rev === 2 ? freeBandTracks : freeBandMids;
  const xPool = bands(nodeRects, 'x', 8, vbW - 8, grid);
  const yPool = bands(nodeRects, 'y', 8, vbH - 8, grid);

  const obstacles = (skipA, skipB) => nodeRects.filter((r) => r.id !== skipA && r.id !== skipB);

  function throughNode(pts, obs) {
    for (const [a, b] of segs(pts)) {
      for (const r of obs) {
        if (segmentIntersectsRect({ start: a, end: b }, r, -1)) return r.id;
      }
    }
    return null;
  }
  function inBounds(pts) {
    return pts.every(([x, y]) => x >= 4 && x <= vbW - 4 && y >= 4 && y <= vbH - 4);
  }
  function tightness(pts, obs) {
    let pen = 0;
    for (const [a, b] of segs(pts)) {
      for (const r of obs) {
        if (segmentIntersectsRect({ start: a, end: b }, r, CLEAR - 1)) pen += 30;
      }
    }
    return pen;
  }
  const lengthOf = (pts) => segs(pts).reduce((s, [a, b]) => s + Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]), 0);

  // rev 2 legibility penalties (see header). `alienSegs` = segments of routed
  // edges that share no endpoint with the edge being routed.
  const contSides = contRects.flatMap((c) => [
    [[c.x, c.y], [c.x + c.width, c.y]], [[c.x, c.y + c.height], [c.x + c.width, c.y + c.height]],
    [[c.x, c.y], [c.x, c.y + c.height]], [[c.x + c.width, c.y], [c.x + c.width, c.y + c.height]]]);
  function nearRun(s, t, gap) {
    // collinear-or-parallel overlap of two orthogonal segments within `gap` px
    const sv = isV(s[0], s[1]), tv = isV(t[0], t[1]);
    if (sv !== tv) return 0;
    const k = sv ? 0 : 1, a = sv ? 1 : 0;
    if (Math.abs(s[0][k] - t[0][k]) > gap) return 0;
    const lo = Math.max(Math.min(s[0][a], s[1][a]), Math.min(t[0][a], t[1][a]));
    const hi = Math.min(Math.max(s[0][a], s[1][a]), Math.max(t[0][a], t[1][a]));
    return Math.max(0, hi - lo);
  }
  function legibility(pts, alienSegs) {
    let pen = 0;
    const ss = segs(pts);
    for (const [i, s] of ss.entries()) {
      const L = Math.abs(s[1][0] - s[0][0]) + Math.abs(s[1][1] - s[0][1]);
      if (L > 0 && L < grid) pen += 800;
      // an end segment shorter than the outward stub leaves the arrowhead no room
      else if (ss.length > 1 && (i === 0 || i === ss.length - 1) && L < STUB) pen += 800;
      for (const t of alienSegs) if (nearRun(s, t, grid - 1) > 2) pen += ALIEN_PEN;
      for (const t of contSides) if (nearRun(s, t, 2) > grid) pen += 800;
    }
    return pen;
  }
  const sharesEnd = (a, b) => a.from === b.from || a.from === b.to || a.to === b.from || a.to === b.to;

  function candidatesFor(A, B, fs, ts) {
    const out = [];
    const push = (mids) => out.push(normalizeRoutePoints([A, ...mids, B]));
    push([]);                                   // P1 straight
    push([[B[0], A[1]]]);                       // P2 elbow H-first
    push([[A[0], B[1]]]);                       // P2 elbow V-first
    const xs = [...new Set([snap((A[0] + B[0]) / 2, grid), ...xPool])];
    const ys = [...new Set([snap((A[1] + B[1]) / 2, grid), ...yPool])];
    for (const x of xs) push([[x, A[1]], [x, B[1]]]);           // P3a H-V-H
    for (const y of ys) push([[A[0], y], [B[0], y]]);           // P3b V-H-V
    // P4: one x-channel + one y-channel (wrap routes for mixed side pairs)
    const fsH = fs === 'left' || fs === 'right';
    const tsH = ts === 'left' || ts === 'right';
    if (fsH !== tsH) {
      for (const x of xs) for (const y of ys) {
        if (fsH) push([[x, A[1]], [x, y], [B[0], y]]);          // H..V..H..V? ends vertical
        else push([[A[0], y], [x, y], [x, B[1]]]);
      }
    }
    return out.filter((pts) => pts.length >= 2 && pts.every((p, i) => i === 0 || p[0] === pts[i - 1][0] || p[1] === pts[i - 1][1]));
  }

  function scoreAgainst(pts, routedSegs) {
    let crossings = 0, overlap = 0;
    for (const s of segs(pts)) {
      for (const t of routedSegs) {
        if (segsCross(s, t)) crossings++;
        overlap += segsOverlapRun(s, t) > 2 ? 1 : 0;
      }
    }
    return { crossings, overlap };
  }

  function bestRoute(p, routedSegs) {
    const A = anchors.get(`${p.e.id}|from`), B = anchors.get(`${p.e.id}|to`);
    const sidePairs = (p.e.fromSide && p.e.toSide)
      ? [[p.fs, p.ts]]
      : [[p.fs, p.ts], ...ALL_SIDES.flatMap((a) => ALL_SIDES.map((b) => [a, b]))];
    let best = null;
    const alienSegs = rev === 2
      ? [...routed.entries()].filter(([id]) => id !== p.e.id && !sharesEnd(plan.find((q) => q.e.id === id).e, p.e)).flatMap(([, r]) => segs(r.pts))
      : [];
    for (const [fs, ts] of sidePairs) {
      // re-anchor when falling back to non-planned sides (far-end projection)
      const Ax = fs === p.fs ? A : projectedAnchor(p.from, fs, p.to, grid);
      const Bx = ts === p.ts ? B : projectedAnchor(p.to, ts, p.from, grid);
      const obs = obstacles(p.e.from, p.e.to);
      const cands = candidatesFor(Ax, Bx, fs, ts);
      // slide family: when both sides are mono-occupied and facing, both
      // anchors may move to a common coordinate — the straight line the hand
      // layouts reach by aligning anchor pairs (anchors are outputs here,
      // not inputs; §4 only requires on-border endpoints)
      const groupCount = (nodeId, side) => (groups.get(`${nodeId}|${side}`) || []).length;
      const horizPair = (fs === 'right' && ts === 'left') || (fs === 'left' && ts === 'right');
      const vertPair = (fs === 'bottom' && ts === 'top') || (fs === 'top' && ts === 'bottom');
      if (rev === 2 && (horizPair || vertPair)) {
        // generalized slide: any common coordinate both sides allow, kept >= one
        // grid unit from the other anchors already slotted on either side
        const [alo, ahi] = sideRange(p.from, fs), [blo, bhi] = sideRange(p.to, ts);
        const lo = Math.max(alo, blo), hi = Math.min(ahi, bhi);
        const k = horizPair ? 1 : 0;
        const others = [[p.from.id, fs, 'from'], [p.to.id, ts, 'to']].flatMap(([nid, side, end]) =>
          (groups.get(`${nid}|${side}`) || []).filter((g) => !(g.p.e.id === p.e.id && g.end === end))
            .map((g) => (anchors.get(`${g.p.e.id}|${g.end}`) || [])[k]).filter((v) => v !== undefined));
        // clamp like rev 1: a capsule's band can be narrower than one grid unit
        const raw = [Ax[k], Bx[k], (lo + hi) / 2, lo, hi];
        const vals = lo <= hi ? [...new Set(raw.map((v) => clampNum(snap(clampNum(v, lo, hi), grid), lo, hi)))] : [];
        for (const v of vals) {
          if (others.some((o) => Math.abs(o - v) < grid)) continue;
          cands.push(normalizeRoutePoints([sidePoint(p.from, fs, v), sidePoint(p.to, ts, v)]));
        }
      } else if ((horizPair || vertPair) && groupCount(p.from.id, fs) <= 1 && groupCount(p.to.id, ts) <= 1) {
        const [alo, ahi] = sideRange(p.from, fs), [blo, bhi] = sideRange(p.to, ts);
        const lo = Math.max(alo, blo), hi = Math.min(ahi, bhi);
        if (lo <= hi) {
          const raw = [horizPair ? Ax[1] : Ax[0], horizPair ? Bx[1] : Bx[0], (lo + hi) / 2];
          const vals = [...new Set(raw.map((v) => clampNum(snap(clampNum(v, lo, hi), grid), lo, hi)))];
          for (const v of vals) cands.push(normalizeRoutePoints([sidePoint(p.from, fs, v), sidePoint(p.to, ts, v)]));
        }
      }
      for (const pts of cands) {
        if (!inBounds(pts)) continue;
        if (!routeHonorsEndpointSides(pts, fs, ts)) continue;
        if (throughNode(pts, obs)) continue;
        const { crossings, overlap } = scoreAgainst(pts, routedSegs);
        const leg = rev === 2 ? legibility(pts, alienSegs) : 0;
        const score = crossings * 1200 + overlap * 300 + (pts.length - 2) * 40 +
          lengthOf(pts) * 0.5 + tightness(pts, obs) + (fs !== p.fs || ts !== p.ts ? 25 : 0) + leg;
        if (!best || score < best.score) best = { pts, score, crossings, fs, ts, leg };
      }
      // accept the planned pair without scanning alternates only when it is
      // already clean AND simple; otherwise let the scan look for straighter
      // side choices (bends penalty decides)
      if (best && sidePairs.length > 1 && best.crossings === 0 && !best.leg && best.pts.length <= 3 && fs === p.fs && ts === p.ts) break;
    }
    return best;
  }

  // -- phase C: greedy route in input order, then improvement passes
  const routed = new Map();
  const allRoutedSegs = () => [...routed.values()].flatMap((r) => segs(r.pts));
  for (const p of plan) {
    const best = bestRoute(p, allRoutedSegs());
    if (!best) {
      D('route-not-found', { view: view.id, edge: p.e.id },
        { from: p.e.from, to: p.e.to, sides: [p.fs, p.ts] },
        ['add fromSide/toSide hints', 'hand-author pts for ' + p.e.id]);
      continue;
    }
    routed.set(p.e.id, best);
  }

  const budget = view.declaredCrossings || 0;
  const totalCrossings = () => {
    let n = 0;
    const entries = [...routed.entries()];
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        for (const s of segs(entries[i][1].pts)) for (const t of segs(entries[j][1].pts)) if (segsCross(s, t)) n++;
      }
    }
    return n;
  };
  for (let pass = 0; pass < 3 && totalCrossings() > budget; pass++) {
    // re-route the edges involved in crossings, worst first, others fixed
    const counts = new Map();
    const entries = [...routed.entries()];
    for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
      for (const s of segs(entries[i][1].pts)) for (const t of segs(entries[j][1].pts)) if (segsCross(s, t)) {
        counts.set(entries[i][0], (counts.get(entries[i][0]) || 0) + 1);
        counts.set(entries[j][0], (counts.get(entries[j][0]) || 0) + 1);
      }
    }
    const worst = [...counts.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
    let improved = false;
    for (const [edgeId] of worst) {
      const p = plan.find((q) => q.e.id === edgeId);
      const before = totalCrossings();
      const saved = routed.get(edgeId);
      routed.delete(edgeId);
      const re = bestRoute(p, allRoutedSegs());
      routed.set(edgeId, re && re.crossings <= (saved ? before : Infinity) ? re : saved);
      if (totalCrossings() < before) { improved = true; break; }
      routed.set(edgeId, saved);
    }
    if (!improved) break;
  }

  const finalCrossings = totalCrossings();
  if (finalCrossings > budget) {
    const entries = [...routed.entries()];
    for (let i = 0; i < entries.length; i++) for (let j = i + 1; j < entries.length; j++) {
      for (const s of segs(entries[i][1].pts)) for (const t of segs(entries[j][1].pts)) {
        const at = segsCross(s, t);
        if (at) D('crossing-over-declared', { view: view.id, pair: [entries[i][0], entries[j][0]] },
          { at, crossings: finalCrossings, declared: budget },
          ['declare the crossing (<=3) with its coordinates', 'add side hints to ' + entries[i][0] + ' or ' + entries[j][0], 'hand-author one of the pair']);
      }
    }
  }

  // -- phase D: pill placement (on-segment, avoiding estimated text + pills)
  const textRects = estimateTextRects(view);
  const placedPills = [];
  const pillAt = new Map();
  const pillJobs = [];
  for (const p of plan) {
    if (!p.e.pill || !routed.has(p.e.id)) continue;
    const pts = routed.get(p.e.id).pts;
    const w = Math.ceil(cjkW(p.e.pill, 11)) + 12;
    const candidates = [];
    const ss = segs(pts).map((s, i) => ({ s, i, len: Math.abs(s[1][0] - s[0][0]) + Math.abs(s[1][1] - s[0][1]) }))
      .sort((a, b) => b.len - a.len || a.i - b.i);
    // on-segment positions first; then perpendicular offsets (the hand
    // layouts used 16-24px offsets beside short corridors — e.g. F2 s1/s7
    // pills sit 16/24px off their 24px edges, flanked by node titles)
    for (const off of [0, 12, -12, 16, -16, 24, -24, 32, -32]) {
      for (const { s } of ss) for (const t of [0.5, 0.35, 0.65, 0.2, 0.8]) {
        const base = [s[0][0] + (s[1][0] - s[0][0]) * t, s[0][1] + (s[1][1] - s[0][1]) * t];
        const vertical = s[0][0] === s[1][0];
        candidates.push(vertical ? [base[0] + off, base[1]] : [base[0], base[1] + off]);
      }
    }
    let placed = null;
    // tiers: 'foreign' = clear of nodes other than the edge's endpoints,
    // 'none' = text and pills only
    for (const tier of ['foreign', 'none']) {
      for (const c of candidates) {
        const px = Math.round(c[0]), py = Math.round(c[1]);
        const rect = { x: px - w / 2, y: py - 9, width: w, height: 18 };
        if (rect.x < 4 || rect.x + w > vbW - 4 || rect.y < 4 || rect.y + 18 > vbH - 4) continue;
        if (placedPills.some((q) => rectsOverlap(rect, q, PAD))) continue;
        if (textRects.some((q) => rectsOverlap(rect, q, PAD))) continue;
        if (tier === 'foreign' && nodeRects.some((q) => q.id !== p.e.from && q.id !== p.e.to && rectsOverlap(rect, q, 0))) continue;
        placed = [px, py]; placedPills.push(rect); break;
      }
      if (placed) break;
    }
    if (!placed) {
      D('pill-unplaced', { view: view.id, edge: p.e.id }, { pill: p.e.pill, tried: candidates.length },
      ['hand-author pillAt for ' + p.e.id, 'shorten the pill text']);
    } else {
      pillAt.set(p.e.id, placed);
      pillJobs.push({ id: p.e.id, w, candidates, rect: placedPills.at(-1) });
    }
  }

  // rev 2, second pass: a pill that overlaps ANY node (its own endpoints
  // included) moves to the first candidate clear of every node, text and every
  // other placed pill. Runs after all pills are placed, so it never takes a
  // slot another pill needed (placing 'all-clear' first did, and left pills
  // unplaced on two accepted models).
  if (rev === 2) {
    for (const job of pillJobs) {
      if (!nodeRects.some((q) => rectsOverlap(job.rect, q, 0))) continue;
      const others = placedPills.filter((q) => q !== job.rect);
      for (const c of job.candidates) {
        const px = Math.round(c[0]), py = Math.round(c[1]);
        const rect = { x: px - job.w / 2, y: py - 9, width: job.w, height: 18 };
        if (rect.x < 4 || rect.x + job.w > vbW - 4 || rect.y < 4 || rect.y + 18 > vbH - 4) continue;
        if (others.some((q) => rectsOverlap(rect, q, PAD))) continue;
        if (textRects.some((q) => rectsOverlap(rect, q, PAD))) continue;
        if (nodeRects.some((q) => rectsOverlap(rect, q, 0))) continue;
        placedPills[placedPills.indexOf(job.rect)] = rect;
        job.rect = rect;
        pillAt.set(job.id, [px, py]);
        break;
      }
    }
  }

  return {
    provider: 'channel',
    edges: view.edges.map((e) => routed.has(e.id) ? {
      id: e.id,
      pts: routed.get(e.id).pts.map(([x, y]) => [Math.round(x), Math.round(y)]),
      ...(pillAt.has(e.id) ? { pillAt: pillAt.get(e.id) } : {}),
    } : { id: e.id }),
    diagnostics,
    stats: { crossings: finalCrossings, declared: budget, edges: routed.size, of: view.edges.length },
  };
}

// ---------- provider seam ----------
export const providers = { channel: channelRouter };

export function route(view, opts = {}) {
  const name = opts.provider || 'channel';
  const provider = providers[name];
  if (!provider) throw new Error(`unknown RouterProvider "${name}" (known: ${Object.keys(providers).join(', ')})`);
  return provider(view, opts);
}

// Splice a router result into a copy of the view (edges keep every semantic
// field; only pts/pillAt are replaced when the router produced them).
export function applyRoutes(view, result) {
  const byId = Object.fromEntries(result.edges.map((r) => [r.id, r]));
  return {
    ...view,
    edges: view.edges.map((e) => {
      const r = byId[e.id];
      if (!r || !r.pts) return e;
      const out = { ...e, pts: r.pts };
      if (e.pill) {
        if (r.pillAt) out.pillAt = r.pillAt;
      }
      return out;
    }),
  };
}
