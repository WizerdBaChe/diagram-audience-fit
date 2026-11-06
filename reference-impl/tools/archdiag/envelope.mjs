// tools/archdiag/envelope.mjs — the archview profile of snapshot-envelope/1.
// An audit view declares which subsystems/projects it covers and when its
// content was last VERIFIED; system-hmi (emitters/archviews.py) reads these
// declarations for archviews.coverage and archviews.freshness.
// Contract: tools/system-hmi/SNAPSHOT-ENVELOPE.md §4 (archview profile).
//
// Why verifiedAt and not ran_at: rebuilding a page (a library receipt
// regression rebuilt every page on 2026-10-19) proves nothing about whether
// the drawing still matches the system. So the envelope sets
// watched_by: archviews.freshness and the age is judged on verified_at.
//
// Why no rewrite when nothing changed: M1 receipt regression re-runs every
// build and must leave the tree clean. An unchanged page with an unchanged
// declaration leaves its envelope byte-identical (ran_at is informational
// only under watched_by).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateAnchorDecl } from './anchors.mjs';

export const ENVELOPE = 'snapshot-envelope/1';
export const PROFILE = 'archview/1';
export const WATCHER = 'archviews.freshness';
export const DEFAULT_MAX_VERIFY_AGE_DAYS = 60;   // initial value, proposal 2026-10-21 §4 (B2 calibrates)
const RUNGS = ['R0', 'R1', 'R2'];
const SLUG = /^[a-z0-9][a-z0-9-]*$/;
const AWARE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

// The audit view set's version has ONE copy: the `audit-view-set: N` line of
// representation-models.md. A page records the version its coverage
// declaration was checked against (archview.viewSet); older or absent warns at
// build and in archviews.freshness until the declaration is re-run.
export const VIEW_SET_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)),
  '../../skills/product-design-thinking/references/representation-models.md');
const VIEW_SET_LINE = /^audit-view-set:\s*(\d+)\s*$/m;

/** Current view-set version, or null when the defining file cannot be read. */
export function currentViewSet(file = VIEW_SET_FILE) {
  try {
    const m = VIEW_SET_LINE.exec(fs.readFileSync(file, 'utf8'));
    return m ? Number(m[1]) : null;
  } catch { return null; }
}

/** A warning line when a stored block's view_set is behind `current`; null when current or unknown. */
export function viewSetNotice(av, current = currentViewSet()) {
  if (!current || !av) return null;
  const v = av.view_set;
  if (Number.isInteger(v) && v >= current) return null;
  return `archview WARN view-set: coverage declared against view set ${Number.isInteger(v) ? v : '1 (unrecorded)'}, `
    + `current is ${current} — re-run the coverage declaration (SKILL.md "Coverage declaration"), `
    + `then pass archview.viewSet: ${current}. A rebuild alone does not clear this.`;
}

export function viewId(outPath) {
  const base = path.basename(outPath).replace(/\.html?$/i, '').toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  return 'archview-' + base.replace(/^-+|-+$/g, '');
}

export function envelopePath(outPath) {
  return path.join(path.dirname(path.resolve(outPath)), viewId(outPath) + '.snapshot.json');
}

// A bare date means local midnight +08:00 (this machine); stored aware.
function awareStamp(s) {
  if (DAY.test(s)) return s + 'T00:00:00+08:00';
  return s;
}

// 2026-13-45 matches DAY; a round trip through Date.UTC tells a real date from a shaped one
function realDate(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d;
}

/** Determinable shape checks on a declaration; returns a list of problems. */
export function validateDeclaration(d) {
  const p = [];
  if (!d || typeof d !== 'object') return ['archview must be an object or false'];
  const c = d.covers;
  if (!c || typeof c !== 'object') p.push('archview.covers must be {subsystems:[], projects:[], partial:[]}');
  else {
    for (const k of ['subsystems', 'projects', 'partial']) {
      if (c[k] !== undefined && !(Array.isArray(c[k]) && c[k].every((x) => typeof x === 'string' && x)))
        p.push(`archview.covers.${k} must be a list of non-empty strings`);
    }
    const named = [...(c.subsystems || []), ...(c.projects || [])];
    if (!named.length && !d.retired) p.push('archview.covers names nothing (a view that covers nothing is not an archview)');
    for (const x of c.partial || []) if (!named.includes(x)) p.push(`archview.covers.partial names ${x}, which covers does not list`);
    for (const k of Object.keys(c)) if (!['subsystems', 'projects', 'partial'].includes(k)) p.push(`archview.covers.${k} is not a known key`);
  }
  if (typeof d.verifiedAt !== 'string' || !(DAY.test(d.verifiedAt) || AWARE.test(d.verifiedAt)))
    p.push('archview.verifiedAt must be YYYY-MM-DD or an aware ISO-8601 stamp');
  else if (!realDate(d.verifiedAt.slice(0, 10))) p.push(`archview.verifiedAt ${d.verifiedAt} is not a calendar date`);
  if (d.rung !== undefined && !RUNGS.includes(d.rung)) p.push(`archview.rung must be one of ${RUNGS.join('/')}`);
  if (d.maxVerifyAgeDays !== undefined && !(Number.isFinite(d.maxVerifyAgeDays) && d.maxVerifyAgeDays > 0))
    p.push('archview.maxVerifyAgeDays must be a positive number');
  if (d.title !== undefined && (typeof d.title !== 'string' || !d.title)) p.push('archview.title must be a non-empty string');
  if (d.anchors !== undefined) p.push(...validateAnchorDecl(d.anchors));
  if (d.viewSet !== undefined) {
    const cur = currentViewSet();
    if (!(Number.isInteger(d.viewSet) && d.viewSet >= 1)) p.push('archview.viewSet must be a positive integer');
    else if (cur && d.viewSet > cur) p.push(`archview.viewSet ${d.viewSet} does not exist (current view set is ${cur})`);
  }
  return p;
}

// `anchors` (B-10, anchors.mjs) is present only when the build declared a pin,
// so every envelope written before 2026-10-23 keeps its bytes (M1).
function block(d, anchors) {
  const c = d.covers || {};
  return {
    profile: PROFILE,
    covers: { subsystems: [...(c.subsystems || [])], projects: [...(c.projects || [])], partial: [...(c.partial || [])] },
    verified_at: awareStamp(d.verifiedAt),
    rung: d.rung || 'R2',
    max_verify_age_s: Math.round((d.maxVerifyAgeDays || DEFAULT_MAX_VERIFY_AGE_DAYS) * 86400),
    ...(anchors ? { anchors } : {}),
    ...(d.viewSet !== undefined ? { view_set: d.viewSet } : {}),
  };
}

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

/**
 * Write (or keep) the archview envelope beside outPath.
 *  decl      — the declaration ({covers, verifiedAt, rung?, maxVerifyAgeDays?, title?, retired?}),
 *              or null to refresh an existing envelope's declaration as-is.
 *  changed   — whether the page bytes changed in this run.
 *  producer  — {tool, carrier}; remedy — one command that re-runs the producer.
 * Returns {path, written: bool, reason}.
 */
export function writeEnvelope({ outPath, decl, changed, title, producer, remedy, anchors, now = new Date() }) {
  const ep = envelopePath(outPath);
  const prev = readJson(ep);
  if (!decl && !prev) return { path: ep, written: false, reason: 'undeclared' };
  let av;
  let retired;
  let ttl;
  if (decl) {
    const problems = validateDeclaration(decl);
    if (problems.length) throw new Error('ARCHVIEW FAILED:\n- ' + problems.join('\n- '));
    av = block(decl, anchors);
    retired = decl.retired === true ? true : undefined;
    ttl = decl.title || title;
  } else {
    if (!prev.archview || prev.archview.profile !== PROFILE)
      throw new Error(`ARCHVIEW FAILED: ${ep} exists but carries no ${PROFILE} block; pass archview:{...} to rebuild it`);
    av = prev.archview;
    retired = prev.retired;
    ttl = prev.title;
  }
  const notice = retired ? null : viewSetNotice(av);
  const same = prev && JSON.stringify(prev.archview) === JSON.stringify(av) && prev.retired === retired && prev.title === ttl;
  if (same && !changed) return { path: ep, written: false, reason: 'unchanged', notice };
  const stamp = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const env = {
    envelope: ENVELOPE,
    view: viewId(outPath),
    title: ttl,
    output: path.resolve(outPath).replace(/\\/g, '/'),
    producer: producer || { tool: 'tools/archdiag build()', carrier: 'manual' },
    ran_at: stamp,
    result: changed ? 'written' : 'unchanged',
    last_success_at: stamp,
    data_cut_at: av.verified_at,
    fingerprint: 'none',
    max_age_s: null,
    watched_by: WATCHER,
    ...(remedy ? { remedy } : {}),
    ...(retired ? { retired: true } : {}),
    archview: av,
  };
  if (!SLUG.test(env.view)) throw new Error(`ARCHVIEW FAILED: view id ${env.view} is not a slug`);
  const tmp = ep + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(env, null, 2) + '\n', 'utf8');
  fs.renameSync(tmp, ep);
  return { path: ep, written: true, reason: decl ? 'declared' : 'refreshed', notice };
}

// `node envelope.mjs --selftest` — two-sided controls over a temp folder;
// run by tools/system-hmi/controls.py (archviews: envelope writer selftest).
async function selftest() {
  const os = await import('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archview-st-'));
  const out = path.join(dir, 'Fx Audit F1.html');
  const fails = [];
  const ok = (cond, msg) => { if (!cond) fails.push(msg); };
  const good = { covers: { subsystems: ['sa'] }, verifiedAt: '2026-10-01' };
  try {
    ok(viewId(out) === 'archview-fx-audit-f1', `viewId slug: ${viewId(out)}`);
    ok(validateDeclaration(good).length === 0, 'good declaration validates');
    for (const [bad, needle] of [[{ covers: {}, verifiedAt: '2026-10-01' }, 'names nothing'],
      [{ covers: { subsystems: ['sa'] }, verifiedAt: '2026-10-01T00:00:00' }, 'verifiedAt'],
      [{ covers: { subsystems: ['sa'], partial: ['sb'] }, verifiedAt: '2026-10-01' }, 'partial'],
      [{ covers: { subsystems: ['sa'], other: [] }, verifiedAt: '2026-10-01' }, 'not a known key'],
      [{ covers: { subsystems: ['sa'] }, verifiedAt: '2026-10-01', rung: 'R9' }, 'rung']])
      ok(validateDeclaration(bad).some((p) => p.includes(needle)), `bad declaration must name "${needle}"`);
    let r = writeEnvelope({ outPath: out, decl: null, changed: true });
    ok(!r.written && r.reason === 'undeclared', 'no declaration + no envelope -> nothing written');
    r = writeEnvelope({ outPath: out, decl: good, changed: true, title: 'fx' });
    ok(r.written, 'first declared write');
    const first = fs.readFileSync(r.path, 'utf8');
    const env = JSON.parse(first);
    ok(env.watched_by === WATCHER && env.max_age_s === null && env.archview.verified_at === '2026-10-01T00:00:00+08:00',
      'envelope hands judgement to archviews.freshness and stores an aware verified_at');
    r = writeEnvelope({ outPath: out, decl: good, changed: false, title: 'fx', now: new Date(Date.now() + 9e6) });
    ok(!r.written && fs.readFileSync(r.path, 'utf8') === first, 'same page + same declaration -> byte-identical (M1 no-op)');
    r = writeEnvelope({ outPath: out, decl: null, changed: true, now: new Date(Date.now() + 9e6) });
    const refreshed = JSON.parse(fs.readFileSync(r.path, 'utf8'));
    ok(r.written && JSON.stringify(refreshed.archview) === JSON.stringify(env.archview) && refreshed.ran_at !== env.ran_at,
      'rebuild without a declaration keeps the declaration and refreshes the run record');
    r = writeEnvelope({ outPath: out, decl: { ...good, verifiedAt: '2026-10-20' }, changed: false, title: 'fx' });
    ok(r.written && JSON.parse(fs.readFileSync(r.path, 'utf8')).archview.verified_at.startsWith('2026-10-20'),
      'a new verifiedAt rewrites the envelope (re-verification is recorded)');
    let threw = false;
    try { writeEnvelope({ outPath: out, decl: { covers: {} , verifiedAt: 'x' }, changed: true }); } catch { threw = true; }
    ok(threw, 'malformed declaration throws before writing');
    // view-set versioning (2026-11-06): positive controls warn, negative stays silent
    const cur = currentViewSet();
    ok(Number.isInteger(cur) && cur >= 2, `representation-models.md carries audit-view-set >= 2 (read ${cur})`);
    const vsFile = path.join(dir, 'vs.md');
    fs.writeFileSync(vsFile, 'x\n\naudit-view-set: 7\n', 'utf8');
    ok(currentViewSet(vsFile) === 7 && currentViewSet(path.join(dir, 'none.md')) === null, 'version line parsed; unreadable -> null');
    ok(viewSetNotice({ profile: PROFILE }, 2) !== null, 'positive control: no view_set recorded -> warns');
    ok(viewSetNotice({ view_set: 1 }, 2) !== null, 'positive control: older view_set -> warns');
    ok(viewSetNotice({ view_set: 2 }, 2) === null, 'negative control: current view_set -> silent');
    ok(viewSetNotice({}, null) === null, 'unknown current set -> no claim');
    ok(validateDeclaration({ ...good, viewSet: cur + 50 }).some((p) => p.includes('does not exist')), 'future viewSet is a declaration defect');
    ok(validateDeclaration({ ...good, viewSet: 0 }).some((p) => p.includes('positive integer')), 'viewSet 0 rejected');
    const out2 = path.join(dir, 'vs audit.html');
    r = writeEnvelope({ outPath: out2, decl: good, changed: true, title: 'fx' });
    ok(!('view_set' in JSON.parse(fs.readFileSync(r.path, 'utf8')).archview) && r.notice, 'no viewSet -> no key (M1 bytes) and a notice');
    r = writeEnvelope({ outPath: out2, decl: { ...good, viewSet: cur }, changed: false, title: 'fx' });
    ok(r.written && JSON.parse(fs.readFileSync(r.path, 'utf8')).archview.view_set === cur && r.notice === null,
      're-declared at the current set -> stored and silent');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (fails.length) { console.log('SELFTEST FAIL\n- ' + fails.join('\n- ')); process.exit(2); }
  console.log('SELFTEST PASS (envelope.mjs)');
}

// fileURLToPath decodes %20 and non-ASCII; the raw URL pathname never matched such a path (false green)
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))
    && process.argv.includes('--selftest')) await selftest();
