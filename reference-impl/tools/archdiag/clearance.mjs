// tools/archdiag/clearance.mjs — clearance warnings: how close a line runs to
// things it does not belong to (2026-11-07). The ONE source for archdiag
// builds (layout.mjs L8–L13), its page CLI, and audience-fit owner-view
// sweeps (they pass their own geometry; they never keep a copy of these rules).
//
// Why: selfcheck/layout/topology all passed memory-system-audit-f1 V1 while
// the owner saw lines inside other groups' boxes, over their titles, 8px from
// each other and hugging nodes (19 hits); the owner view's own sweep passed a
// line that ran on its target's border and hooked back into it (b8). Each
// class is geometry the other checks do not measure:
//   L8  foreign-container  a line runs inside a GROUP box that holds neither
//                          of its ends; for a LANE, only a run ALONG the lane
//                          counts (crossing lanes is what lanes are for);
//                          lifelines are skipped (sequence views)
//   L9  title-crossing     a line crosses a container's title band
//   L10 near-parallel      two lines with no shared end run parallel closer
//                          than `sep` (0 px is L3 shared-track, not here)
//   L11 node-clearance     a line passes within `clear` px of a node that is
//                          not one of its ends (diamonds: bounding box)
//   L12 node-border        a line runs ON a node's border (the interior test,
//                          in-page #5, lets this through)
//   L13 own-end-hug        a middle segment runs within `clear` px of the
//                          line's own start or end node: it slides along its
//                          target or overshoots and hooks back
//   L14 gap-capacity       a gap carries more lines than its width allows:
//                          names the gap to widen (positions are inputs)
//   L15 pill-ambiguous     a label touches two or more edges' lines
//   L16 out-of-frame       leaving a box is fine; breaking what the box means
//                          is not: own-box-exit (both ends in one group/lane,
//                          the line leaves it) and out-of-frame-backtrack
//                          (outside every group/lane the line moves > 2·sep
//                          away from its target); views without groups/lanes
//                          are skipped
//   L17 detour-ratio       drawn length > 3 × the ends' Manhattan distance
//                          (distance floored at 80 px, excess > 80 px)
// L16/L17 (2026-11-07 later): a line outside every box has nothing to come
// close to, so the distance classes cannot see it. The router does not price
// them (CLEAR_COST in route.mjs), so issued routes are unchanged.
// L10 also reports two edges that meet head to tail (one enters the node the
// other leaves) on ONE track: fan-out/fan-in may bundle, opposite flow may not.
// Readability, not correctness ⇒ WARN, never FAIL (gate-design: not
// determinable as a defect for every reader).
//
// Neutral input: { id, nodes:[{id,x,y,w,h}], edges:[{id,from,to,pts}],
//   containers:[{id,x,y,w,h,title?,role?,titleBox?}], pills?:[{x,y,w,h,text?}] }.

const segsOf = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
const vert = (s) => Math.abs(s[0][0] - s[1][0]) < 0.5;
const span = (s, k) => [Math.min(s[0][k], s[1][k]), Math.max(s[0][k], s[1][k])];
const contains = (o, i) => i.x >= o.x && i.x + i.w <= o.x + o.w && i.y >= o.y && i.y + i.h <= o.y + o.h;

// length of an orthogonal segment inside rect r grown by `g` (g < 0 shrinks);
// `closed` counts a segment lying exactly on the grown border
function runIn(s, r, g, closed) {
  const x0 = r.x - g, x1 = r.x + r.w + g, y0 = r.y - g, y1 = r.y + r.h + g;
  const inn = (v, a, b) => (closed ? v >= a && v <= b : v > a && v < b);
  if (vert(s)) {
    if (!inn(s[0][0], x0, x1)) return 0;
    const [a, b] = span(s, 1);
    return Math.max(0, Math.min(b, y1) - Math.max(a, y0));
  }
  if (!inn(s[0][1], y0, y1)) return 0;
  const [a, b] = span(s, 0);
  return Math.max(0, Math.min(b, x1) - Math.max(a, x0));
}
const runOnBorder = (s, r, tol = 0.5) => {
  // length of s lying on r's outline (within tol px), within the side's extent
  if (vert(s)) {
    const x = s[0][0];
    if (Math.abs(x - r.x) > tol && Math.abs(x - (r.x + r.w)) > tol) return 0;
    const [a, b] = span(s, 1);
    return Math.max(0, Math.min(b, r.y + r.h) - Math.max(a, r.y));
  }
  const y = s[0][1];
  if (Math.abs(y - r.y) > tol && Math.abs(y - (r.y + r.h)) > tol) return 0;
  const [a, b] = span(s, 0);
  return Math.max(0, Math.min(b, r.x + r.w) - Math.max(a, r.x));
};

// role inference for containers that do not declare one: '' title ⇒ lifeline;
// ≥3 containers tiling one row (same y,h) or one column (same x,w) ⇒ lanes;
// else group. A declared role always wins.
export function inferRoles(containers) {
  const out = new Map();
  const key = (c, a, b) => `${c[a]}|${c[b]}`;
  const rows = new Map(), cols = new Map();
  for (const c of containers) {
    if (c.role) { out.set(c.id, c.role === 'lane' ? (c.h >= c.w ? 'lane:col' : 'lane:row') : c.role); continue; }
    if (c.title === '') { out.set(c.id, 'lifeline'); continue; }
    (rows.get(key(c, 'y', 'h')) || rows.set(key(c, 'y', 'h'), []).get(key(c, 'y', 'h'))).push(c);
    (cols.get(key(c, 'x', 'w')) || cols.set(key(c, 'x', 'w'), []).get(key(c, 'x', 'w'))).push(c);
  }
  // a lane is a long strip: a row of ≥3 tall columns, or a column of ≥3 wide
  // rows. A grid of group boxes also shares y/h, so shape decides, not tiling.
  // a view with lifelines is a sequence view: its other boxes are fragment
  // frames (par/alt/loop), which messages cross by design
  const sequence = [...out.values()].includes('lifeline');
  for (const c of containers) {
    if (out.has(c.id)) continue;
    if (sequence) { out.set(c.id, 'fragment'); continue; }
    const r = rows.get(key(c, 'y', 'h')), k = cols.get(key(c, 'x', 'w'));
    if (r && r.length >= 3 && c.h >= 3 * c.w) out.set(c.id, 'lane:col');
    else if (k && k.length >= 3 && c.w >= 3 * c.h) out.set(c.id, 'lane:row');
    else out.set(c.id, 'group');
  }
  return out;
}
export const ROLES = ['group', 'lane', 'lifeline', 'fragment'];

// archdiag's title band: emit.mjs draws the title at (x+14, y+22), 12px/600
export function archdiagTitleBox(c, textW) {
  return { x: c.x, y: c.y, w: Math.min(14 + textW + 10, c.w), h: 30 };
}

export function clearanceWarnings(view, opts = {}) {
  // distances are reading distances in drawing units, not grid multiples: a
  // 20-grid page is not allowed to hug nodes more closely than an 8-grid one,
  // nor required to keep twice the distance
  const clear = opts.clear ?? 8;               // L11/L13 distance
  const sep = opts.sep ?? 16;                  // L10 distance
  const minRun = opts.minRun ?? 8;             // shortest run that counts
  const detourRatio = opts.detourRatio ?? 3;   // L17 length / end distance
  const detourFloor = opts.detourFloor ?? 80;  // L17 end distance floor and minimum excess
  const backtrack = opts.backtrack ?? 2 * sep; // L16 px moved away from the target outside the frame
  const focus = opts.focus;                    // router: only warnings that involve this edge
  const W = [];
  const add = (code, message) => W.push({ code, view: view.id, message });
  const nodes = view.nodes || [], conts = view.containers || [];
  const edges = (view.edges || []).filter((e) => Array.isArray(e.pts) && e.pts.length >= 2);
  const roles = inferRoles(conts);
  const rect = Object.fromEntries([...nodes, ...conts].map((r) => [r.id, r]));
  const ownedBy = (end, c) => end === c.id || (rect[end] && rect[end] !== c && contains(c, rect[end]));

  for (const e of edges) {
    if (focus && e.id !== focus) continue;
    const ss = segsOf(e.pts);
    // L8
    for (const c of conts) {
      const role = roles.get(c.id);
      if (role === 'lifeline' || role === 'fragment' || ownedBy(e.from, c) || ownedBy(e.to, c)) continue;
      let run = 0;
      for (const s of ss) {
        if (role === 'lane:col' && !vert(s)) continue;    // crossing a column lane is fine
        if (role === 'lane:row' && vert(s)) continue;
        run += runIn(s, c, -1, false);
      }
      if (run > minRun) add('L8', `foreign-container ${e.id} (${e.from}→${e.to}) runs ${Math.round(run)}px inside ${c.id}${role.startsWith('lane') ? ' along the lane' : ''}`);
    }
    // L4 (moved here from layout.mjs 2026-11-07 so owner sweeps get it too):
    // a line on a container's dashed border merges with the border
    for (const c of conts) {
      let run = 0;
      for (const s of ss) run += runOnBorder(s, c, 2);
      if (run > 2 * minRun) add('L4', `on-container-edge ${e.id} runs ${Math.round(run)}px on the border of ${c.id}`);
    }
    // L9
    for (const c of conts) {
      if (roles.get(c.id) === 'lifeline' || !c.titleBox) continue;
      let run = 0;
      for (const s of ss) run += runIn(s, c.titleBox, 0, false);
      if (run > 0) add('L9', `title-crossing ${e.id} crosses the title of ${c.id} (${Math.round(run)}px)`);
    }
    // L11 / L12 (foreign nodes)
    for (const n of nodes) {
      if (n.id === e.from || n.id === e.to) continue;
      let border = 0, near = 0;
      for (const s of ss) { border += runOnBorder(s, n); near += runIn(s, n, clear, true); }
      if (border > 0) add('L12', `node-border ${e.id} runs ${Math.round(border)}px on the border of ${n.id}`);
      else if (near > 0) add('L11', `node-clearance ${e.id} passes within ${clear}px of ${n.id}`);
    }
    // L13 (own ends, middle segments only)
    for (const end of [e.from, e.to]) {
      const n = rect[end];
      if (!n || !nodes.includes(n) || ss.length < 3) continue;
      let run = 0;
      for (const s of ss.slice(1, -1)) run += runIn(s, n, clear, true);
      if (run > 0) add('L13', `own-end-hug ${e.id} runs ${Math.round(run)}px within ${clear}px of its own end ${end}`);
    }
  }
  // L16 / L17: how far a line itself wanders, which the distance classes above
  // cannot see (a line outside every box has nothing to come close to)
  const frameConts = conts.filter((c) => /^(group|lane)/.test(roles.get(c.id)));
  const frame = frameConts.length && {
    x: Math.min(...frameConts.map((c) => c.x)), y: Math.min(...frameConts.map((c) => c.y)),
  };
  if (frame) {
    frame.w = Math.max(...frameConts.map((c) => c.x + c.w)) - frame.x;
    frame.h = Math.max(...frameConts.map((c) => c.y + c.h)) - frame.y;
  }
  const inFrame = (p) => p[0] >= frame.x - 0.5 && p[0] <= frame.x + frame.w + 0.5 && p[1] >= frame.y - 0.5 && p[1] <= frame.y + frame.h + 0.5;
  const segLen = (s) => Math.abs(s[1][0] - s[0][0]) + Math.abs(s[1][1] - s[0][1]);
  // main flow: column lanes run top-down, row lanes left-right; otherwise a
  // per-edge vote (a sum of displacements is dominated by the long return
  // edges it is meant to find)
  const cen = (id) => rect[id] && [rect[id].x + rect[id].w / 2, rect[id].y + rect[id].h / 2];
  // `links` = every edge of the view as {from,to}, routed or not: the router
  // passes it so the loop and flow tests see the whole graph mid-routing
  const links = opts.links || edges;
  let fx = 0, fy = 0;
  // (row strips are as often layers crossed top-down as lanes run left-right,
  // so only column lanes fix the axis)
  if ([...roles.values()].includes('lane:col')) fy = 1;
  else for (const e of links) {
    const s = cen(e.from), t = cen(e.to);
    if (s && t) { fx += Math.sign(t[0] - s[0]); fy += Math.sign(t[1] - s[1]); }
  }
  // a return edge closes a loop: its target reaches its source along the
  // arrows (a forward edge, or any edge of an acyclic dependency or data
  // view, never qualifies), AND the target lies before the source
  const succ = new Map();
  for (const e of links) (succ.get(e.from) || succ.set(e.from, []).get(e.from)).push(e.to);
  const reaches = (from, to) => {
    const seen = new Set([from]), stack = [from];
    while (stack.length) for (const n of succ.get(stack.pop()) || []) {
      if (n === to) return true;
      if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    return false;
  };
  const isReturn = (e) => {
    const s = rect[e.from], t = cen(e.to);
    if (!s || !t || !reaches(e.to, e.from)) return false;
    // the target must lie wholly before the source's leading side, not merely level with it
    if (Math.abs(fy) >= Math.abs(fx)) return fy >= 0 ? t[1] < s.y : t[1] > s.y + s.h;
    return fx >= 0 ? t[0] < s.x : t[0] > s.x + s.w;
  };
  for (const e of edges) {
    if (focus && e.id !== focus) continue;
    const ss = segsOf(e.pts), a = e.pts[0], b = e.pts[e.pts.length - 1];
    // L16 out-of-frame (user ruling 2026-11-07): leaving a box is not the
    // defect; a box means "these belong together", so a line leaving one
    // reads as an outward link. Two shapes break that reading:
    //  own-box exit: both ends sit in one group/lane, the line leaves it
    //  backtrack:    outside the frame of all groups/lanes, the line moves
    //                AWAY from its target by more than `backtrack` px (a run
    //                along the outside toward the target is a margin route)
    // Covering other content is L8/L9/L11/L12/L15's.
    const own = frameConts.filter((c) => contains(c, { x: a[0], y: a[1], w: 0, h: 0 }) && contains(c, { x: b[0], y: b[1], w: 0, h: 0 }));
    for (const c of own) {
      let out = 0;
      for (const s of ss) out += segLen(s) - runIn(s, c, 0.5, true);
      if (out > minRun) add('L16', `own-box-exit ${e.id} (${e.from}→${e.to}) has both ends in ${c.id} but runs ${Math.round(out)}px outside it — it reads as a link out of ${c.id}`);
    }
    // a return edge (its target lies before its source along the view's main
    // flow) is a loop back; a loop round the outside is the flowchart
    // convention for it (owner-accepted 「接回工作」, memory-system owner view
    // b8), so only forward edges are held to the backtrack test
    if (frame && inFrame(a) && inFrame(b) && !isReturn(e)) {
      let away = 0;
      const dist = (p) => Math.abs(b[0] - p[0]) + Math.abs(b[1] - p[1]);
      for (const s of ss) if (segLen(s) - runIn(s, frame, 0.5, true) > 0.5) away += Math.max(0, dist(s[1]) - dist(s[0]));
      if (away > backtrack) add('L16', `out-of-frame-backtrack ${e.id} (${e.from}→${e.to}) moves ${Math.round(away)}px away from its target outside every group/lane — a detour round the drawing`);
    }
    // L17 detour-ratio: drawn length against the Manhattan distance of its
    // ends; a floor keeps a short hop between neighbours from reading as a detour
    const len = ss.reduce((t, s) => t + segLen(s), 0);
    const direct = Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1]);
    const ratio = len / Math.max(direct, detourFloor);
    if (ratio > detourRatio && len - direct > detourFloor) add('L17', `detour-ratio ${e.id} (${e.from}→${e.to}) is ${Math.round(len)}px long for ends ${Math.round(direct)}px apart (×${ratio.toFixed(1)}, want ≤ ${detourRatio})`);
  }
  // L10
  for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
    const a = edges[i], b = edges[j];
    if (focus && a.id !== focus && b.id !== focus) continue;
    // fan-out (same start) and fan-in (same end) may bundle on purpose; a pair
    // that meets head to tail (one enters the node the other leaves) may not:
    // on one track the arrowhead reads as both lines' direction
    // (a fan bundles by merging, d = 0; side by side at 0 < d < sep it crowds
    // like any other pair)
    const fan = a.from === b.from || a.to === b.to;
    const chain = !fan && [a.from, a.to].some((x) => x === b.from || x === b.to);
    let worst = null;
    for (const s of segsOf(a.pts)) for (const t of segsOf(b.pts)) {
      if (vert(s) !== vert(t)) continue;
      const k = vert(s) ? 0 : 1, o = vert(s) ? 1 : 0;
      const d = Math.abs(s[0][k] - t[0][k]);
      if ((d === 0 && !chain) || d >= sep) continue;
      const [a0, a1] = span(s, o), [b0, b1] = span(t, o);
      const ov = Math.min(a1, b1) - Math.max(a0, b0);
      if (ov > minRun && (!worst || ov > worst.ov)) worst = { d, ov };
      // head-to-tail pair on one line with a short gap: drawn, it reads as
      // one line passing the node (the gap hides under the anchors)
      // short (< 2·sep), or lying alongside the common node's side: both stubs
      // turn into that node, so the gap hides behind it and reads as one line
      else if (chain && d === 0 && ov <= 0 && !worst) {
        const g0 = Math.min(a1, b1), g1 = Math.max(a0, b0);
        const common = [a.from, a.to].find((x) => x === b.from || x === b.to);
        const n = rect[common];
        const along = n && (o === 1 ? [n.y, n.y + n.h] : [n.x, n.x + n.w]);
        const across = n && (o === 1 ? [n.x, n.x + n.w] : [n.y, n.y + n.h]);
        // a line through the node (in one side, out the opposite) is plain flow
        const through = across && s[0][k] > across[0] && s[0][k] < across[1];
        if (!through && (-ov < 2 * sep || (along && g0 >= along[0] - sep && g1 <= along[1] + sep))) worst = { d, ov: 0, gap: -ov };
      }
    }
    if (worst) add('L10', worst.gap !== undefined
      ? `opposite-flow ${a.id} (${a.from}→${a.to}) and ${b.id} (${b.from}→${b.to}) continue each other on one line with a ${worst.gap}px gap — it reads as one line through the node`
      : worst.d === 0
      ? `opposite-flow ${a.id} (${a.from}→${a.to}) and ${b.id} (${b.from}→${b.to}) share ${Math.round(worst.ov)}px of one line through their common node — the arrow reads as both directions`
      : `near-parallel ${a.id} and ${b.id} run ${worst.d}px apart for ${Math.round(worst.ov)}px (want ≥ ${sep}px)`);
  }
  // L15 pill-ambiguous: a label touches the lines of two or more edges, so the
  // reader cannot tell which line it names (a pill on a crossing or a trunk)
  for (const p of view.pills || []) {
    if (focus) break;
    const hit = new Set();
    for (const e of edges) for (const s of segsOf(e.pts)) if (runIn(s, p, 0, true) > 0) hit.add(e.id);
    if (hit.size >= 2) add('L15', `pill-ambiguous label at (${Math.round(p.x + p.w / 2)},${Math.round(p.y + p.h / 2)})${p.text ? ` 「${p.text}」` : ''} touches ${[...hit].join(', ')}`);
  }
  // L14 gap-capacity: a free band between two walls (node sides, group box
  // borders) carries k lines side by side and is narrower than they need
  // (2·clear + (k−1)·sep). Positions are the author's input: this names the
  // gap to widen. Sequence views are skipped (messages run between lifelines).
  if (!focus && ![...roles.values()].includes('lifeline')) {
    const walls = [...nodes.map((n) => ({ ...n, wall: 'node' })), ...conts.filter((c) => roles.get(c.id) === 'group').flatMap((c) => [
      { id: c.id, x: c.x, y: c.y, w: 0, h: c.h }, { id: c.id, x: c.x + c.w, y: c.y, w: 0, h: c.h },
      { id: c.id, x: c.x, y: c.y, w: c.w, h: 0 }, { id: c.id, x: c.x, y: c.y + c.h, w: c.w, h: 0 }])];
    const bands = new Map();
    for (const e of edges) for (const s of segsOf(e.pts)) {
      const v = vert(s), k = v ? 0 : 1, o = v ? 1 : 0, at = s[0][k];
      const [s0, s1] = span(s, o);
      if (s1 - s0 <= minRun) continue;
      let lo = -Infinity, hi = Infinity, loId = 'edge', hiId = 'edge';
      for (const r of walls) {
        const r0 = v ? r.y : r.x, r1 = v ? r.y + r.h : r.x + r.w;
        if (Math.min(r1, s1) - Math.max(r0, s0) <= 0) continue;
        const near = v ? r.x + r.w : r.y + r.h, far = v ? r.x : r.y;
        if (near <= at - 0.5 && near > lo) { lo = near; loId = r.id; }
        if (far >= at + 0.5 && far < hi) { hi = far; hiId = r.id; }
      }
      if (!Number.isFinite(lo) || !Number.isFinite(hi)) continue;
      const key = `${v ? 'x' : 'y'}|${lo}|${hi}`;
      if (!bands.has(key)) bands.set(key, { v, lo, hi, loId, hiId, segs: [] });
      bands.get(key).segs.push({ e: e.id, s0, s1 });
    }
    for (const b of bands.values()) {
      let k = 0;
      for (const s of b.segs) {
        const ids = new Set(b.segs.filter((t) => Math.min(t.s1, s.s1) - Math.max(t.s0, s.s0) > minRun).map((t) => t.e));
        k = Math.max(k, ids.size);
      }
      const need = 2 * clear + (k - 1) * sep, width = b.hi - b.lo;
      if (width < need) add('L14', `gap-capacity ${b.v ? 'vertical' : 'horizontal'} gap ${b.loId}|${b.hiId} (${b.v ? 'x' : 'y'} ${b.lo}–${b.hi}) is ${width}px for ${k} line(s); needs ≥ ${need}px — widen it`);
    }
  }
  return W;
}

// ---------- page CLI: node clearance.mjs <page.html…> | --selftest ----------
// Reads archdiag markup (g.node data-*, path[data-edge][data-pts], rect.comp)
// and the owner-view measurement face (rect[data-node], polyline[data-edge],
// rect[data-group] with optional data-title-w). Exit 0 clean, 1 any WARN,
// 3 a page with no recognised view (NOT MEASURED never counts as a pass).
const attr = (tag, k) => { const m = tag.match(new RegExp(`\\s${k}="([^"]*)"`)); return m ? m[1] : null; };
export function viewsFromHtml(html, cjkW) {
  const views = [];
  for (const m of html.matchAll(/<svg[^>]*class="dia"[^>]*data-view="([^"]+)"[^>]*>([\s\S]*?)<\/svg>/g)) {
    const svg = m[2];
    const nodes = [], edges = [], containers = [];
    for (const t of svg.matchAll(/<g class="node"[^>]*>/g))
      nodes.push({ id: attr(t[0], 'data-id'), x: +attr(t[0], 'data-x'), y: +attr(t[0], 'data-y'), w: +attr(t[0], 'data-w'), h: +attr(t[0], 'data-h') });
    for (const t of svg.matchAll(/<rect data-node="[^"]*"[^>]*>/g))
      nodes.push({ id: attr(t[0], 'data-id'), x: +attr(t[0], 'x'), y: +attr(t[0], 'y'), w: +attr(t[0], 'width'), h: +attr(t[0], 'height') });
    for (const t of svg.matchAll(/<path[^>]*data-edge="[^"]*"[^>]*>/g)) {
      const p = (attr(t[0], 'data-pts') || '').split(',').map(Number), pts = [];
      for (let i = 0; i + 1 < p.length; i += 2) pts.push([p[i], p[i + 1]]);
      edges.push({ id: attr(t[0], 'data-edge'), from: attr(t[0], 'data-from'), to: attr(t[0], 'data-to'), pts });
    }
    for (const t of svg.matchAll(/<polyline data-edge="[^"]*"[^>]*>/g)) {
      const pts = attr(t[0], 'points').trim().split(/\s+/).map((q) => q.split(',').map(Number));
      edges.push({ id: attr(t[0], 'data-edge'), from: attr(t[0], 'data-from'), to: attr(t[0], 'data-to'), pts });
    }
    for (const t of svg.matchAll(/<rect[^>]*class="comp"[^>]*>(?:\s*<text[^>]*>([^<]*)<\/text>)?/g)) {
      const c = { id: attr(t[0], 'data-id'), x: +attr(t[0], 'data-x'), y: +attr(t[0], 'data-y'), w: +attr(t[0], 'data-w'), h: +attr(t[0], 'data-h'), title: t[1] || '' };
      if (c.title) c.titleBox = archdiagTitleBox(c, cjkW(c.title, 12));
      containers.push(c);
    }
    for (const t of svg.matchAll(/<rect data-group="[^"]*"[^>]*>/g)) {
      const c = { id: attr(t[0], 'data-group'), x: +attr(t[0], 'x'), y: +attr(t[0], 'y'), w: +attr(t[0], 'width'), h: +attr(t[0], 'height'), role: attr(t[0], 'data-role') || undefined, title: 'x' };
      const tw = attr(t[0], 'data-title-w');
      if (tw) c.titleBox = { x: c.x, y: c.y, w: Math.min(+tw, c.w), h: 30 };
      containers.push(c);
    }
    const pills = [...svg.matchAll(/<rect class="pillbg"[^>]*>/g)].map((t) => ({ x: +attr(t[0], 'x'), y: +attr(t[0], 'y'), w: +attr(t[0], 'width'), h: +attr(t[0], 'height') }));
    views.push({ id: m[1], nodes, edges, containers, pills });
  }
  return views;
}

function selftest() {
  const cases = [];
  const C = (id, x, y, w, h, extra = {}) => ({ id, x, y, w, h, title: id, ...extra });
  const N = (id, x, y, w = 80, h = 40) => ({ id, x, y, w, h });
  const base = () => ({ id: 't', containers: [C('GA', 0, 0, 300, 120), C('GB', 400, 0, 300, 120), C('GC', 0, 200, 700, 120)],
    nodes: [N('a', 20, 40), N('b', 420, 40), N('c', 20, 240), N('d', 200, 40)] });
  const run = (name, code, v, want, opts) => {
    const got = clearanceWarnings(v, opts).filter((w) => w.code === code).length;
    cases.push([name, want ? got > 0 : got === 0, got]);
  };
  // L8 group: c→b climbing through GA (bad) vs a→b along the gutter row (good)
  run('L8 fires', 'L8', { ...base(), edges: [{ id: 'x', from: 'c', to: 'b', pts: [[100, 260], [350, 260], [350, 160], [150, 160], [150, 60], [420, 60]] }] }, true);
  run('L8 quiet', 'L8', { ...base(), edges: [{ id: 'x', from: 'c', to: 'b', pts: [[100, 260], [350, 260], [350, 60], [420, 60]] }] }, false);
  // L8 lanes: crossing quiet, running along a foreign lane fires
  const grid3 = inferRoles([C('G0', 0, 0, 300, 200), C('G1', 340, 0, 300, 200), C('G2', 680, 0, 300, 200)]);
  cases.push(['roles: a row of group boxes stays groups', grid3.get('G1') === 'group', grid3.get('G1')]);
  const lanes = { id: 'l', containers: [C('L0', 0, 0, 100, 600), C('L1', 100, 0, 100, 600), C('L2', 200, 0, 100, 600)],
    nodes: [N('p', 10, 40), N('q', 210, 40), N('r', 210, 400)] };
  run('L8 lane crossing quiet', 'L8', { ...lanes, edges: [{ id: 'x', from: 'p', to: 'q', pts: [[90, 60], [210, 60]] }] }, false);
  run('L8 lane run fires', 'L8', { ...lanes, edges: [{ id: 'x', from: 'p', to: 'r', pts: [[90, 60], [150, 60], [150, 420], [210, 420]] }] }, true);
  // L9
  const tb = base(); tb.containers[1].titleBox = { x: 400, y: 0, w: 120, h: 30 };
  run('L9 fires', 'L9', { ...tb, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[60, 40], [60, 16], [460, 16], [460, 40]] }] }, true);
  run('L9 quiet', 'L9', { ...tb, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[100, 60], [420, 60]] }] }, false);
  // L10
  run('L10 fires', 'L10', { id: 'p', nodes: [N('a', 0, 0), N('b', 400, 0), N('c', 0, 200), N('e', 400, 200)], containers: [],
    edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [200, 20], [200, 100], [300, 100], [300, 20], [400, 20]] }, { id: 'y', from: 'c', to: 'e', pts: [[80, 220], [208, 220], [208, 60], [320, 60], [320, 220], [400, 220]] }] }, true);
  run('L10 quiet', 'L10', { id: 'p', nodes: [N('a', 0, 0), N('b', 400, 0), N('c', 0, 200), N('e', 400, 200)], containers: [],
    edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [200, 20], [200, 100], [300, 100], [300, 20], [400, 20]] }, { id: 'y', from: 'c', to: 'e', pts: [[80, 220], [240, 220], [240, 60], [320, 60], [320, 220], [400, 220]] }] }, false);
  // L11 / L12
  const lone = { id: 'n', containers: [], nodes: [N('a', 0, 0), N('b', 400, 0), N('m', 200, 40)] };
  run('L11 fires', 'L11', { ...lone, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [180, 20], [180, 34], [400, 34]] }] }, true);
  run('L11 quiet', 'L11', { ...lone, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [400, 20]] }] }, false);
  run('L12 fires', 'L12', { ...lone, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [140, 20], [140, 40], [400, 40]] }] }, true);
  run('L12 quiet', 'L12', { ...lone, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [400, 20]] }] }, false);
  // L13: the b8 shape (runs up the target's own left border, overshoots, hooks down)
  const hug = { id: 'h', containers: [], nodes: [N('s', 0, 400, 160, 60), N('t', 200, 100, 160, 60)] };
  run('L13 fires (b8 shape)', 'L13', { ...hug, edges: [{ id: 'x', from: 's', to: 't', pts: [[160, 420], [200, 420], [200, 80], [220, 80], [220, 100]] }] }, true);
  run('L13 quiet', 'L13', { ...hug, edges: [{ id: 'x', from: 's', to: 't', pts: [[160, 420], [180, 420], [180, 130], [200, 130]] }] }, false);
  // L10 opposite flow: in→M and M→out on one track (bad) vs fan-in on one track (allowed)
  const tri = { id: 'o', containers: [], nodes: [N('i', 0, 200), N('M', 200, 0), N('o', 400, 200), N('j', 400, 260)] };
  run('L10 opposite-flow fires', 'L10', { ...tri, edges: [{ id: 'in', from: 'i', to: 'M', pts: [[40, 200], [40, 120], [240, 120], [240, 40]] },
    { id: 'out', from: 'M', to: 'o', pts: [[240, 40], [240, 120], [440, 120], [440, 200]] }] }, true);
  // the e4/e6 shape: in enters M's left side from above, out leaves it below on the same x
  const col = (outY) => ({ id: 'k', containers: [], nodes: [N('P', 0, 0), N('M', 200, 100, 80, 80), N('Q', 0, 300)],
    edges: [{ id: 'in', from: 'P', to: 'M', pts: [[40, 40], [40, 60], [180, 60], [180, 120], [200, 120]] },
      { id: 'out', from: 'M', to: 'Q', pts: [[200, outY], [180, outY], [180, 260], [40, 260], [40, 300]] }] });
  run('L10 collinear head-to-tail fires', 'L10', col(132), true);
  run('L10 collinear head-to-tail, wide gap alongside the node, fires', 'L10', col(160), true);
  run('L10 straight flow through a node quiet', 'L10', { id: 's', containers: [], nodes: [N('A', 0, 0), N('B', 0, 100), N('C', 0, 200)],
    edges: [{ id: 'ab', from: 'A', to: 'B', pts: [[40, 40], [40, 100]] }, { id: 'bc', from: 'B', to: 'C', pts: [[40, 140], [40, 200]] }] }, false);
  run('L10 head-to-tail on separate tracks quiet', 'L10', { ...col(160), edges: [col(160).edges[0],
    { id: 'out', from: 'M', to: 'Q', pts: [[200, 160], [150, 160], [150, 260], [40, 260], [40, 300]] }] }, false);
  run('L10 fan-in side by side fires', 'L10', { ...tri, edges: [{ id: 'in', from: 'i', to: 'M', pts: [[40, 200], [40, 120], [232, 120], [232, 40]] },
    { id: 'in2', from: 'o', to: 'M', pts: [[440, 200], [440, 112], [240, 112], [240, 40]] }] }, true);
  run('L10 fan-in quiet', 'L10', { ...tri, edges: [{ id: 'in', from: 'i', to: 'M', pts: [[40, 200], [40, 120], [240, 120], [240, 40]] },
    { id: 'in2', from: 'o', to: 'M', pts: [[440, 200], [440, 120], [240, 120], [240, 40]] }] }, false);
  // L4: the b8-v2 shape, a line on a lane's outer border vs one 20px outside it
  const edgeLane = (x) => ({ id: 'e', containers: [C('L0', 20, 0, 200, 600), C('L1', 220, 0, 200, 600), C('L2', 420, 0, 200, 600)],
    nodes: [N('s', 240, 500, 160, 60), N('t', 440, 100, 160, 60)],
    edges: [{ id: 'x', from: 's', to: 't', pts: [[240, 520], [x, 520], [x, 120], [440, 120]] }] });
  run('L4 fires on a lane border', 'L4', edgeLane(20), true);
  run('L4 quiet outside the lanes', 'L4', edgeLane(0), false);
  // L15: a pill on a crossing vs a pill on its own line only
  const cross = { id: 'c', containers: [], nodes: [N('a', 0, 100), N('b', 400, 100), N('c', 200, 0, 40, 20), N('d', 200, 300, 40, 20)],
    edges: [{ id: 'h', from: 'a', to: 'b', pts: [[80, 120], [400, 120]] }, { id: 'v', from: 'c', to: 'd', pts: [[220, 20], [220, 300]] }] };
  run('L15 fires', 'L15', { ...cross, pills: [{ x: 200, y: 111, w: 40, h: 18 }] }, true);
  run('L15 quiet', 'L15', { ...cross, pills: [{ x: 300, y: 111, w: 40, h: 18 }] }, false);
  // L14: two lines through a 24px gap between nodes (need 2·8 + 16 = 32) vs a 64px gap
  const gap = (w) => ({ id: 'g', containers: [], nodes: [N('u', 0, 0, 80, 200), N('w', 80 + w, 0, 80, 200), N('a', 0, 300), N('b', 0, -100)],
    edges: [{ id: 'x', from: 'a', to: 'b', pts: [[40, 300], [40, 260], [80 + w / 2 - 4, 260], [80 + w / 2 - 4, -40], [40, -40], [40, -60]] },
      { id: 'y', from: 'b', to: 'a', pts: [[60, -60], [60, -50], [80 + w / 2 + 4, -50], [80 + w / 2 + 4, 270], [60, 270], [60, 300]] }] });
  run('L14 fires', 'L14', gap(24), true);
  run('L14 quiet', 'L14', gap(64), false);
  // L16: the V2 f4 shape (over the top of every group) and the owner-view
  // shape (past the last lane) vs the same ends routed inside the frame
  run('L16 fires over the top', 'L16', { ...base(), edges: [{ id: 'x', from: 'a', to: 'b', pts: [[60, 40], [60, -40], [460, -40], [460, 40]] }] }, true);
  run('L16 quiet inside the frame', 'L16', { ...base(), edges: [{ id: 'x', from: 'a', to: 'b', pts: [[100, 60], [420, 60]] }] }, false);
  const past = (x) => ({ id: 'p', containers: [C('L0', 0, 0, 200, 600), C('L1', 200, 0, 200, 600), C('L2', 400, 0, 200, 600)],
    nodes: [N('s', 420, 100, 160, 60), N('t', 420, 400, 160, 60)],
    edges: [{ id: 'x', from: 's', to: 't', pts: [[580, 130], [x, 130], [x, 430], [580, 430]] }] });
  run('L16 fires past the last lane', 'L16', past(640), true);
  run('L16 quiet inside the last lane', 'L16', past(592), false);
  // the e1 shape: two groups stacked, the line steps 24px out of the frame and
  // runs down the margin toward its target — a margin route, not a detour
  const stack = { id: 'm', containers: [C('GT', 40, 0, 400, 120), C('GD', 40, 200, 400, 120)], nodes: [N('s', 48, 40), N('t', 48, 240)] };
  run('L16 quiet on a forward margin run (e1 shape)', 'L16', { ...stack, edges: [{ id: 'x', from: 's', to: 't', pts: [[48, 60], [24, 60], [24, 260], [48, 260]] }] }, false);
  run('L16 fires when the margin run starts backwards', 'L16', { ...stack, edges: [{ id: 'x', from: 's', to: 't', pts: [[100, 40], [100, -40], [24, -40], [24, 260], [48, 260]] }] }, true);
  // the b7 shape: both ends in one lane, the line leaves the lane into the gutter beside it
  const lane3 = { id: 'k', containers: [C('L0', 0, 0, 200, 600), C('L1', 200, 0, 200, 600), C('L2', 400, 0, 200, 600)], nodes: [N('d', 220, 100), N('s', 220, 300)] };
  run('L16 own-box exit fires (b7 shape)', 'L16', { ...lane3, edges: [{ id: 'x', from: 'd', to: 's', pts: [[300, 120], [420, 120], [420, 320], [300, 320]] }] }, true);
  run('L16 own-box quiet when the line stays in its lane', 'L16', { ...lane3, edges: [{ id: 'x', from: 'd', to: 's', pts: [[260, 140], [260, 300]] }] }, false);
  // the b8 shape: a loop back up round the outside of column lanes
  const loopV = (withForward) => ({ id: 'b', containers: [C('L0', 40, 0, 200, 800), C('L1', 240, 0, 200, 800), C('L2', 440, 0, 200, 800)],
    nodes: [N('W', 460, 100, 160, 60), N('K', 260, 600, 160, 60)],
    edges: [...(withForward ? [{ id: 'f', from: 'W', to: 'K', pts: [[540, 160], [540, 630], [420, 630]] }] : []),
      { id: 'x', from: 'K', to: 'W', pts: [[260, 630], [20, 630], [20, 130], [460, 130]] }] });
  run('L16 quiet on a loop back round the margin (b8 shape)', 'L16', loopV(true), false);
  run('L16 fires on the same route when nothing loops back', 'L16', loopV(false), true);
  run('L16 quiet with no group or lane', 'L16', { id: 'n', containers: [], nodes: [N('a', 0, 0), N('b', 400, 0)],
    edges: [{ id: 'x', from: 'a', to: 'b', pts: [[40, 0], [40, -60], [440, -60], [440, 0]] }] }, false);
  // L17: a loop out and back vs the plain elbow between the same ends
  const pair = { id: 'r', containers: [], nodes: [N('a', 0, 0), N('b', 200, 200)] };
  run('L17 fires', 'L17', { ...pair, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [600, 20], [600, 400], [240, 400], [240, 240]] }] }, true);
  run('L17 quiet', 'L17', { ...pair, edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [240, 20], [240, 200]] }] }, false);
  // a side loop to a neighbour 40px away: ×4.5 on the raw distance, ×2.25 on the floor
  run('L17 quiet on a side loop between neighbours', 'L17', { id: 'h', containers: [], nodes: [N('a', 0, 0), N('b', 0, 50)],
    edges: [{ id: 'x', from: 'a', to: 'b', pts: [[80, 20], [150, 20], [150, 60], [80, 60]] }] }, false);
  // a self-message loops right of the last lifeline: lifelines are not a frame
  run('L16 quiet on a sequence self-message', 'L16', { id: 'q', containers: [C('LA', 0, 0, 10, 400, { title: '' }), C('LB', 200, 0, 10, 400, { title: '' })],
    nodes: [N('A', 0, 0, 10, 400), N('B', 200, 0, 10, 400)],
    edges: [{ id: 'x', from: 'B', to: 'B', pts: [[210, 100], [250, 100], [250, 130], [210, 130]] }] }, false);
  // roles
  const r = inferRoles(lanes.containers);
  cases.push(['roles: tiled columns are lanes', r.get('L1') === 'lane:col', r.get('L1')]);
  const sq = inferRoles([C('LL', 0, 0, 10, 300, { title: '' }), C('PAR', 0, 50, 400, 100, { title: 'par' })]);
  cases.push(['roles: a frame beside lifelines is a fragment', sq.get('PAR') === 'fragment', sq.get('PAR')]);
  cases.push(['roles: blank title is lifeline', inferRoles([C('X', 0, 0, 10, 10, { title: '' })]).get('X') === 'lifeline', '']);
  let bad = 0;
  for (const [name, ok, got] of cases) { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} (${got})`); }
  console.log(`clearance selftest: ${cases.length - bad}/${cases.length}`);
  return bad ? 2 : 0;
}

import { fileURLToPath } from 'node:url';
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const args = process.argv.slice(2);
  if (args.includes('--selftest')) process.exit(selftest());
  const fs = await import('node:fs');
  const { cjkW } = await import('./emit.mjs');
  let code = 0;
  for (const f of args) {
    let views;
    try { views = viewsFromHtml(fs.readFileSync(f, 'utf8'), cjkW); } catch (err) { console.log(`== ${f}\n   unreadable: ${err.message}`); code = 3; continue; }
    const measured = views.filter((v) => v.nodes.length);
    console.log(`== ${f}`);
    if (!measured.length) { console.log('   NOT MEASURED (no recognised view)'); code = 3; continue; }
    let n = 0;
    for (const v of measured) {
      const ws = clearanceWarnings(v);
      n += ws.length;
      for (const w of ws) console.log(`   ${w.code} ${w.view}: ${w.message}`);
    }
    console.log(`   ${measured.length} view(s), ${n} warning(s)`);
    if (n && code === 0) code = 1;
  }
  process.exit(code);
}
