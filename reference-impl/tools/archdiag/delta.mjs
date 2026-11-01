// tools/archdiag/delta.mjs — S3 model delta differ (B-9 automation).
// Diffs two view-model arrays (same schema version) by element identity
// (viewId + nodeId/containerId/edgeId) and reports added / removed / changed
// elements plus overlay-flag suggestions. Replaces the ~12-min/round hand
// procedure measured in F2 (the hand table is the claim; this output is the
// evidence — audit discipline applies to our own tooling, so disagreements
// are listed for adjudication, never silently reconciled).
//
// Change classification: 'geometry' (x/y/w/h, pts, pillAt — a re-layout) vs
// 'semantic' (t, l, pill, kind, type, from/to, ov, declarations — the model
// itself moved) vs 'provenance' (ev — the evidence anchor moved, the claim did
// not; re-borrow ledger B-11, after archify's architecture-delta, which counts
// fact and provenance changes apart). A line shift in an anchored file must not
// read as "the model changed". Neither a geometry-only nor a provenance-only
// change suggests an overlay.
//
// Determinism: pure function of the two inputs; fixed orders (input order of
// the head model wins for reporting).

const GEO_NODE = ['x', 'y', 'w', 'h'];
const SEM_NODE = ['kind', 't', 'l', 'ov'];
const PROV = ['ev'];
const GEO_EDGE = ['pts', 'pillAt'];
const SEM_EDGE = ['type', 'from', 'to', 'pill', 'fromSide', 'toSide', 'fromComp', 'selfLoop'];

const J = (v) => JSON.stringify(v === undefined ? null : v);

function diffFields(a, b, geoKeys, semKeys, provKeys = []) {
  const geometry = geoKeys.filter((k) => J(a[k]) !== J(b[k]));
  const semantic = semKeys.filter((k) => J(a[k]) !== J(b[k]));
  const provenance = provKeys.filter((k) => J(a[k]) !== J(b[k]));
  return { geometry, semantic, provenance };
}

function indexBy(list) {
  return new Map((list || []).map((el) => [el.id, el]));
}

function diffCollection(baseList, headList, geoKeys, semKeys, provKeys) {
  const base = indexBy(baseList), head = indexBy(headList);
  const added = [], removed = [], changed = [];
  for (const el of headList || []) {
    if (!base.has(el.id)) { added.push(el); continue; }
    const { geometry, semantic, provenance } = diffFields(base.get(el.id), el, geoKeys, semKeys, provKeys);
    if (geometry.length || semantic.length || provenance.length) changed.push({ id: el.id, geometry, semantic, provenance });
  }
  for (const el of baseList || []) if (!head.has(el.id)) removed.push(el);
  return { added, removed, changed };
}

export function diffViews(baseViews, headViews) {
  const base = indexBy(baseViews), head = indexBy(headViews);
  const views = [];
  for (const hv of headViews) {
    const bv = base.get(hv.id);
    if (!bv) { views.push({ id: hv.id, viewAdded: true }); continue; }
    const nodes = diffCollection(bv.nodes, hv.nodes, GEO_NODE, SEM_NODE, PROV);
    const containers = diffCollection(bv.containers, hv.containers, [...GEO_NODE, 'title'], []);
    const edges = diffCollection(bv.edges, hv.edges, GEO_EDGE, SEM_EDGE, PROV);
    // absent-type edges are contractual NON-dependencies — count them apart
    // so "+N edges" never inflates with declared non-edges (F2 B-9 rule)
    const addedEdges = edges.added.filter((e) => e.type !== 'absent');
    const addedAbsent = edges.added.filter((e) => e.type === 'absent');
    const viewMeta = ['title', 'subtitle', 'declared', 'declaredCrossings', 'vb']
      .filter((k) => J(bv[k]) !== J(hv[k]));
    views.push({
      id: hv.id,
      nodes, containers,
      edges: { ...edges, added: addedEdges, addedAbsent },
      viewMeta,
      // overlay suggestions: head-only elements that do not yet carry ov
      overlaySuggestions: [
        ...nodes.added.filter((n) => !n.ov).map((n) => ({ kind: 'node', id: n.id })),
        ...addedEdges.filter((e) => !e.ov).map((e) => ({ kind: 'edge', id: e.id })),
      ],
    });
  }
  for (const bv of baseViews) if (!head.has(bv.id)) views.push({ id: bv.id, viewRemoved: true });
  const sum = (f) => views.reduce((n, v) => n + (f(v) || 0), 0);
  return {
    views,
    totals: {
      addedNodes: sum((v) => v.nodes?.added.length),
      removedNodes: sum((v) => v.nodes?.removed.length),
      changedNodes: sum((v) => v.nodes?.changed.length),
      addedEdges: sum((v) => v.edges?.added.length),
      addedAbsent: sum((v) => v.edges?.addedAbsent.length),
      removedEdges: sum((v) => v.edges?.removed.length),
      changedEdges: sum((v) => v.edges?.changed.length),
      // fact vs provenance vs layout, counted apart (B-11): an element counts
      // once, in the strongest class it moved in (semantic > provenance > geometry)
      factChanged: sum((v) => [...(v.nodes?.changed || []), ...(v.edges?.changed || [])].filter((c) => c.semantic.length).length),
      provenanceOnly: sum((v) => [...(v.nodes?.changed || []), ...(v.edges?.changed || [])].filter((c) => !c.semantic.length && c.provenance.length).length),
      geometryOnly: sum((v) => [...(v.nodes?.changed || []), ...(v.edges?.changed || [])].filter((c) => !c.semantic.length && !c.provenance.length).length),
    },
  };
}

// Strip the branch overlay to recover the base model: the documented F2
// workflow half ("the model table IS the delta source") — removes ov nodes,
// drops edges that lose an endpoint, clears remaining ov flags.
export function stripOverlay(views) {
  return views.map((v) => {
    const keptIds = new Set([
      ...v.nodes.filter((n) => !n.ov).map((n) => n.id),
      ...(v.containers || []).map((c) => c.id),
    ]);
    return {
      ...v,
      nodes: v.nodes.filter((n) => !n.ov).map(({ ov, ...n }) => n),
      edges: v.edges.filter((e) => keptIds.has(e.from) && keptIds.has(e.to)),
    };
  });
}

// ---------- emitters ----------
const ids = (list) => list.map((el) => el.id).join('、') || '—';

// Rows for tables.table(): one line per delta class per view, B-9 shape.
export function deltaTableRows(delta) {
  const rows = [];
  for (const v of delta.views) {
    if (v.viewAdded) { rows.push([v.id, 'view added', '—']); continue; }
    if (v.viewRemoved) { rows.push([v.id, 'view removed', '—']); continue; }
    if (v.nodes.added.length) rows.push([v.id, `nodes +${v.nodes.added.length}`, ids(v.nodes.added)]);
    if (v.nodes.removed.length) rows.push([v.id, `nodes -${v.nodes.removed.length}`, ids(v.nodes.removed)]);
    for (const c of v.nodes.changed) rows.push([v.id, `node changed (${[...c.semantic, ...c.provenance.map((p) => p + '†'), ...c.geometry.map((g) => g + '*')].join(',')})`, c.id]);
    if (v.edges.added.length) rows.push([v.id, `edges +${v.edges.added.length}`, ids(v.edges.added)]);
    if (v.edges.addedAbsent.length) rows.push([v.id, `absent (non-dependency) +${v.edges.addedAbsent.length}`, ids(v.edges.addedAbsent)]);
    if (v.edges.removed.length) rows.push([v.id, `edges -${v.edges.removed.length}`, ids(v.edges.removed)]);
    for (const c of v.edges.changed) rows.push([v.id, `edge changed (${[...c.semantic, ...c.provenance.map((p) => p + '†'), ...c.geometry.map((g) => g + '*')].join(',')})`, c.id]);
    if (v.viewMeta.length) rows.push([v.id, `view meta changed`, v.viewMeta.join('、')]);
  }
  const t = delta.totals;
  // The provenance clause appears only when a provenance change exists, so a
  // delta without one emits the same bytes as before B-11 (M1).
  const prov = t.provenanceOnly ? `; provenance-only ~${t.provenanceOnly}` : '';
  const note = t.provenanceOnly ? 'geometry-only changes are marked with *, provenance (evidence anchor) with †' : 'geometry-only changes are marked with *';
  rows.push(['Σ', `nodes +${t.addedNodes}/-${t.removedNodes}/~${t.changedNodes}; edges +${t.addedEdges}/-${t.removedEdges}/~${t.changedEdges}; absent +${t.addedAbsent}${prov}`, note]);
  return rows;
}

export function deltaMarkdown(delta) {
  const lines = ['| view | delta | elements |', '|---|---|---|'];
  for (const r of deltaTableRows(delta)) lines.push(`| ${r[0]} | ${r[1]} | ${r[2]} |`);
  return lines.join('\n');
}
