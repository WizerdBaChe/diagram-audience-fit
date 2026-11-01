// tools/archdiag/hops.mjs — line hops and junction dots for a routed view
// (2026-10-29, notation-precision.md §2 "a crossing that remains is drawn so it
// cannot be misread as a join").
//
// SINGLE SOURCE of the crossing plan: emit.mjs draws from it, layout.mjs warns
// from it. A second computation in either place is the fork that drifts.
//
// Default ON since 2026-11-01 (owner ruling: the rule said "draw a hop" while
// the tool defaulted to bare, so every audit page after 10-29 shipped bare "+"
// crossings). A view without `crossingStyle` hops. `crossingStyle: 'plain'`
// is the receipt pin for a page issued before 2026-11-01 — the same mechanism
// as route.mjs rev 1 — and layout.mjs reports its bare crossings (L7), so the
// pin is a named debt, never a silent choice.
//
// Hand-drawn SVG (audience-fit presentational views) shares this module via
// hopEdges(): same {id, pts} orthogonal polylines, same rule, no second copy.
//
// Rules (determinable from the routed model):
//   - a crossing = a horizontal and a vertical segment of two DIFFERENT edges
//     meeting strictly inside both (the same test as in-page check #6);
//   - the HORIZONTAL segment hops, the vertical one stays continuous;
//   - a hop needs room: its centre at least HOP_R + 3 px from both ends of its
//     segment and at least 2*HOP_R + 2 px from the previous hop on that segment;
//     a crossing without room is drawn bare and reported (`hop-no-room`) — the
//     fix is a reroute, never a squeezed hop;
//   - a junction = an interior bend of one edge that lies on another edge's
//     line (a real join): drawn as a filled dot.

export const HOP_R = 5;
export const DOT_R = 3.5;

// AP-74 not-same-as: tools/archdiag/layout.mjs::isV — this compares two points; layout's takes one segment
const isV = (a, b) => a[0] === b[0];
// AP-74 not-same-as: tools/archdiag/layout.mjs::isH — this compares two points; layout's takes one segment
const isH = (a, b) => a[1] === b[1];
const between = (v, a, b, m) => v > Math.min(a, b) + m && v < Math.max(a, b) - m;
const onSeg = (p, a, b) =>
  (isV(a, b) && p[0] === a[0] && p[1] >= Math.min(a[1], b[1]) && p[1] <= Math.max(a[1], b[1])) ||
  (isH(a, b) && p[1] === a[1] && p[0] >= Math.min(a[0], b[0]) && p[0] <= Math.max(a[0], b[0]));

// The one default: an absent crossingStyle means 'hop'.
export const crossingStyleOf = (view) => (view && view.crossingStyle) || 'hop';

// Every crossing of a view, grouped per horizontal segment, regardless of style.
// => Map<`${edgeId}|${segIndex}`, { e, i, a, b, xs: [{ x, other }] }>
function crossingsBySeg(edges) {
  const perSeg = new Map();
  for (const A of edges) for (let i = 1; i < A.pts.length; i++) {
    const a = A.pts[i - 1], b = A.pts[i];
    if (!isH(a, b) || a[0] === b[0]) continue;
    for (const B of edges) {
      if (B === A) continue;
      for (let j = 1; j < B.pts.length; j++) {
        const c = B.pts[j - 1], d = B.pts[j];
        if (!isV(c, d) || c[1] === d[1]) continue;
        const x = c[0], y = a[1];
        if (between(x, a[0], b[0], 1) && between(y, c[1], d[1], 1)) {
          const key = `${A.id}|${i}`;
          if (!perSeg.has(key)) perSeg.set(key, { e: A, i, a, b, xs: [] });
          perSeg.get(key).xs.push({ x, other: B.id });
        }
      }
    }
  }
  return perSeg;
}

const drawable = (view) => (view.edges || []).filter((e) => Array.isArray(e.pts) && e.pts.length >= 2);

// Crossings a 'plain' view draws as a bare "+" (layout.mjs L7). Empty for a hop view.
// => [{ edge, other, at: [x, y] }]
export function bareCrossings(view) {
  if (!view || crossingStyleOf(view) !== 'plain') return [];
  const out = [];
  for (const s of crossingsBySeg(drawable(view)).values())
    for (const { x, other } of s.xs) out.push({ edge: s.e.id, other, at: [x, s.a[1]] });
  return out;
}

// => { hops: Map<edgeId, Map<segIndex, number[] (x, in travel order)>>, dots: [[x,y]...], problems: [...] }
export function hopPlan(view) {
  const hops = new Map();
  const dots = [];
  const problems = [];
  if (!view || crossingStyleOf(view) !== 'hop') return { hops, dots, problems };
  const edges = drawable(view);

  // 1. crossings, grouped per horizontal segment
  const perSeg = crossingsBySeg(edges);

  // 2. room check, in travel order (deterministic: edge order, then segment order)
  for (const A of edges) for (let i = 1; i < A.pts.length; i++) {
    const s = perSeg.get(`${A.id}|${i}`);
    if (!s) continue;
    const dir = s.b[0] > s.a[0] ? 1 : -1;
    const xs = [...s.xs].sort((p, q) => dir * (p.x - q.x));
    const kept = [];
    for (const { x, other } of xs) {
      const fromStart = Math.abs(x - s.a[0]), toEnd = Math.abs(s.b[0] - x);
      const prev = kept.length ? Math.abs(x - kept.at(-1)) : Infinity;
      if (fromStart < HOP_R + 3 || toEnd < HOP_R + 3 || prev < 2 * HOP_R + 2) {
        problems.push({ code: 'hop-no-room', edge: A.id, other, at: [x, s.a[1]],
          message: `crossing of ${A.id} and ${other} at (${x},${s.a[1]}) has no room for a hop (needs ${HOP_R + 3}px from a bend, ${2 * HOP_R + 2}px from the next hop) — drawn bare; reroute` });
        continue;
      }
      kept.push(x);
    }
    if (kept.length) {
      if (!hops.has(A.id)) hops.set(A.id, new Map());
      hops.get(A.id).set(i, kept);
    }
  }

  // 3. junctions: a BRANCH point of two edges that share an endpoint node —
  //    an interior bend of A lying on B where exactly one of A's two adjacent
  //    segments runs along B (A joins or leaves B's line there). Two edges
  //    with no common node never get a dot: a dot asserts a join the model
  //    does not have (2026-11-01: rev-1 pages ride unrelated edges on one
  //    track; 32 of mfp-audit-f3's 57 first-cut dots were such false joins).
  //    Edges turning together on a shared route (both segments along B) are a
  //    common corner, not a join. Edges without from/to (hand-drawn callers
  //    that omit them) skip the shared-node test.
  const related = (A, B) => A.from === undefined || B.from === undefined ||
    [A.from, A.to].some((x) => x === B.from || x === B.to);
  const runsAlong = (a, b, B) => {
    for (let j = 1; j < B.pts.length; j++) {
      const c = B.pts[j - 1], d = B.pts[j];
      if (isV(a, b) && isV(c, d) && a[0] === c[0] &&
        Math.min(Math.max(a[1], b[1]), Math.max(c[1], d[1])) - Math.max(Math.min(a[1], b[1]), Math.min(c[1], d[1])) > 0) return true;
      if (isH(a, b) && isH(c, d) && a[1] === c[1] &&
        Math.min(Math.max(a[0], b[0]), Math.max(c[0], d[0])) - Math.max(Math.min(a[0], b[0]), Math.min(c[0], d[0])) > 0) return true;
    }
    return false;
  };
  const seen = new Set();
  for (const A of edges) for (let k = 1; k < A.pts.length - 1; k++) {
    const p = A.pts[k];
    for (const B of edges) {
      if (B === A || !related(A, B)) continue;
      let hit = false;
      for (let j = 1; j < B.pts.length && !hit; j++) hit = onSeg(p, B.pts[j - 1], B.pts[j]);
      const atEnd = (q) => q[0] === p[0] && q[1] === p[1];
      const branch = runsAlong(A.pts[k - 1], p, B) !== runsAlong(p, A.pts[k + 1], B);
      if (hit && branch && !atEnd(B.pts[0]) && !atEnd(B.pts.at(-1))) {
        const key = p.join(',');
        if (!seen.has(key)) { seen.add(key); dots.push({ at: p, edge: A.id }); }
      }
    }
  }
  return { hops, dots, problems };
}

// SVG path data for one edge, with its hops. Without hops this is exactly the
// pre-hop `M x y L x y …` string.
export function hopPath(e, segHops) {
  if (!segHops || segHops.size === 0) return e.pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
  const out = ['M' + e.pts[0][0] + ' ' + e.pts[0][1]];
  for (let i = 1; i < e.pts.length; i++) {
    const a = e.pts[i - 1], b = e.pts[i];
    const xs = segHops.get(i);
    if (xs) {
      const dir = b[0] > a[0] ? 1 : -1;
      const sweep = dir > 0 ? 1 : 0; // the bump always goes UP (y decreasing)
      for (const x of xs) {
        out.push('L' + (x - dir * HOP_R) + ' ' + a[1]);
        out.push(`A${HOP_R} ${HOP_R} 0 0 ${sweep} ${x + dir * HOP_R} ${a[1]}`);
      }
    }
    out.push('L' + b[0] + ' ' + b[1]);
  }
  return out.join(' ');
}

// For hand-drawn SVG outside emit.mjs (audience-fit presentational views):
// edges = [{ id, pts: [[x,y], ...] }] orthogonal polylines in drawing order.
// => { d: Map<edgeId, pathData>, dots: [{ at: [x,y], edge }], problems: [...] }
// The caller draws each <path d> and a filled circle of radius DOT_R per dot,
// and treats every `problems` entry (hop-no-room) as a reroute to make.
// A diagonal segment is neither H nor V and is ignored here — keep edges orthogonal.
export function hopEdges(edges) {
  const plan = hopPlan({ crossingStyle: 'hop', edges });
  const d = new Map();
  for (const e of edges) if (Array.isArray(e.pts) && e.pts.length >= 2) d.set(e.id, hopPath(e, plan.hops.get(e.id)));
  return { d, dots: plan.dots, problems: plan.problems };
}
