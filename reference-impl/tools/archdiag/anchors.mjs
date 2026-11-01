// tools/archdiag/anchors.mjs — evidence-anchor resolution (re-borrow ledger
// B-10, outputs/skill-reviews/archify-graphify-reborrow-2026-10-23.md).
//
// schema.mjs only proves every node/edge HAS an `ev`; nothing proved the
// anchor points at anything. A map is worth reading instead of the code only
// while its anchors need no re-check, so a build that declares
// `archview.anchors = {root, at}` has every machine-form anchor resolved
// against that repository AT THAT COMMIT (archify's repository evidence
// passport, adapted): the path exists at `at`, and every line range lies
// inside the file as it was at `at`.
//
// Why a pinned commit and not HEAD: the result must be a pure function of the
// declaration, or M1 (rebuild = byte no-op, MAINTENANCE.md) breaks the day
// HEAD moves. Movement since the pin is reported separately as `drift` (WARN).
//
// Severity (gate-design: rule only on what is determinable):
//   anchor-missing / anchor-out-of-range / anchor-range-on-tree  → FAIL
//   non-machine part (an abbreviation such as `GL:fetch`, `CP`)   → reported, never FAIL
//   absolute path outside root                                    → reported, never FAIL
//   bare name with no directory, not at the root at the pin      → reported, never FAIL
//   path absent at the pin that git ignores (telemetry, synced)   → reported as untracked
//     (the ignore test reads the working tree's ignore rules)
//   file changed between `at` and HEAD                            → drift WARN
// Every FAIL is a diagnostic object {code, subject, evidence, supportedFixes}
// (B-1 protocol, notation-precision.md §4).

import { execFileSync } from 'node:child_process';
import path from 'node:path';

const SHA40 = /^[0-9a-f]{40}$/;
// A path token: a Windows drive path, or a token with a slash or a file
// extension — but never an abbreviation prefix such as `RD:` / `GL:`.
const ABBREV = /^[A-Z]{1,4}[A-Za-z]?:(?![\\/])/;
const RANGE_L = /^L(\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*)\b/;
const RANGE_C = /^:(\d+(?:-\d+)?(?:,\d+(?:-\d+)?)*)\b/;

function parseRanges(s) {
  return s.split(',').map((x) => x.trim()).filter(Boolean).map((x) => {
    const [a, b] = x.split(/\s*[-–]\s*/).map(Number);
    return [a, b === undefined ? a : b];
  });
}

/** Split one `ev` string into parts: {raw, path, ranges} or {raw, nonMachine:true}. */
export function parseEv(ev) {
  const out = [];
  for (const raw0 of String(ev).split(';')) {
    const raw = raw0.trim();
    if (!raw) continue;
    if (ABBREV.test(raw)) { out.push({ raw, nonMachine: true }); continue; }
    // The path is the FIRST whitespace-free token (a path with spaces is
    // written in double quotes); what follows a range is a free note
    // (`runtime-witness.json il_by_file CLAUDE.md`). Measured 2026-10-23 on
    // hook-spine / rules-skills-reach: allowing bare spaces swallowed
    // abbreviation prefixes (`MOD model-cap-mod register.ts`) into the path.
    let tok, rest;
    const q = /^"([^"]+)"(.*)$/.exec(raw);
    if (q) { tok = q[1]; rest = q[2]; } else {
      const drive = /^[A-Za-z]:[\\/]/.test(raw) ? raw.slice(0, 2) : '';
      const m = /^([^\s:]+)(.*)$/.exec(raw.slice(drive.length));
      tok = m ? drive + m[1] : '';
      rest = m ? m[2] : '';
      const looksPath = /[\\/]/.test(tok) || /\.[A-Za-z0-9]{1,6}$/.test(tok);
      if (!looksPath) { out.push({ raw, nonMachine: true }); continue; }
    }
    let ranges = [];
    const rc = RANGE_C.exec(rest);
    if (rc) { ranges = parseRanges(rc[1]); rest = rest.slice(rc[0].length); }
    const rl = RANGE_L.exec(rest.trimStart());
    if (!rc && rl) ranges = parseRanges(rl[1]);
    out.push({ raw, path: tok.replace(/\\/g, '/'), ranges });
  }
  return out;
}

function git(root, args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'buffer', stdio: ['ignore', 'pipe', 'ignore'] });
}

function lineCount(buf) {
  if (!buf.length) return 0;
  let n = 0;
  for (const b of buf) if (b === 10) n++;
  return buf[buf.length - 1] === 10 ? n : n + 1;
}

/** Shape checks for archview.anchors; returns a list of problems. */
export function validateAnchorDecl(a) {
  const p = [];
  if (!a || typeof a !== 'object') return ['archview.anchors must be {root, at}'];
  if (typeof a.root !== 'string' || !a.root) p.push('archview.anchors.root must be the absolute path of the audited repository');
  else if (!path.isAbsolute(a.root)) p.push('archview.anchors.root must be absolute');
  if (typeof a.at !== 'string' || !SHA40.test(a.at)) p.push('archview.anchors.at must be a full 40-hex commit sha (the pin)');
  for (const k of Object.keys(a)) if (!['root', 'at'].includes(k)) p.push(`archview.anchors.${k} is not a known key`);
  return p;
}

/**
 * Resolve every machine-form anchor of every node/edge at the pinned commit.
 * Returns {failures, nonMachine, outsideRoot, drift, resolved, total, summary}.
 * Throws only when the pin itself cannot be read (root not a repo, unknown sha).
 */
export function resolveAnchors(views, decl) {
  const root = decl.root;
  const at = decl.at;
  try { git(root, ['cat-file', '-e', `${at}^{commit}`]); } catch {
    throw new Error(`ANCHORS FAILED: ${root} has no commit ${at} (pin unreadable)`);
  }
  const rootPosix = path.resolve(root).replace(/\\/g, '/').replace(/\/+$/, '');
  const files = new Map();   // repo-relative path -> {type, lines} | null
  const look = (rel) => {
    if (files.has(rel)) return files.get(rel);
    let info = null;
    try {
      const type = git(root, ['cat-file', '-t', `${at}:${rel}`]).toString().trim();
      info = { type, lines: type === 'blob' ? lineCount(git(root, ['show', `${at}:${rel}`])) : null };
    } catch { info = null; }
    files.set(rel, info);
    return info;
  };
  let names = null;
  const basenames = () => names || (names = new Set(git(root, ['ls-tree', '-r', '--name-only', at]).toString()
    .split('\n').filter(Boolean).map((p) => p.replace(/^"|"$/g, '').split('/').pop())));
  const ignored = (rel) => {
    try { git(root, ['check-ignore', '-q', '--', rel]); return true; } catch { return false; }
  };
  const failures = [], nonMachine = [], outsideRoot = [], untracked = [];
  let resolved = 0, total = 0;
  for (const v of views || []) {
    for (const [kind, list] of [['node', v.nodes], ['edge', v.edges]]) {
      for (const el of list || []) {
        if (typeof el.ev !== 'string') continue;
        for (const part of parseEv(el.ev)) {
          total++;
          const subject = `${v.id}/${kind}:${el.id}`;
          if (part.nonMachine) { nonMachine.push({ subject, raw: part.raw }); continue; }
          let rel = part.path;
          if (/^[A-Za-z]:\//.test(rel) || rel.startsWith('/')) {
            const abs = path.resolve(rel).replace(/\\/g, '/');
            if (abs.toLowerCase().startsWith(rootPosix.toLowerCase() + '/')) rel = abs.slice(rootPosix.length + 1);
            else { outsideRoot.push({ subject, raw: part.raw }); continue; }
          }
          rel = rel.replace(/^\.\//, '');
          const info = look(rel);
          // Not at the pin, but not provably wrong either: a bare name with no
          // directory (`run-daily.ps1`) names no location, and an ignored file
          // (`telemetry/*.jsonl`) is never in any commit. Reported, never FAIL.
          // A bare name that no file in the whole tree carries is determinably
          // wrong (a typo of a root file such as `CLAUDE.md`); only a name that
          // exists SOMEWHERE is undeterminable (calibration 2026-10-23: 17 of
          // 103 path mutants escaped before this split).
          if (!info && !rel.includes('/') && basenames().has(rel)) { nonMachine.push({ subject, raw: part.raw, why: 'bare name, no directory' }); continue; }
          if (!info && ignored(rel)) { untracked.push({ subject, raw: part.raw }); continue; }
          if (!info) {
            failures.push({ code: 'anchor-missing', subject, evidence: { anchor: part.raw, path: rel, at: at.slice(0, 12) },
              supportedFixes: ['correct the path to one that exists at the pinned commit', 'move the pin (archview.anchors.at) to the commit the drawing was verified against', 'if the element has no source, tag it [assumed] and add a data-gap row'] });
            continue;
          }
          if (part.ranges.length && info.type !== 'blob') {
            failures.push({ code: 'anchor-range-on-tree', subject, evidence: { anchor: part.raw, path: rel, type: info.type },
              supportedFixes: ['point the range at a file inside that directory'] });
            continue;
          }
          const bad = part.ranges.filter(([a, b]) => a < 1 || b < a || b > info.lines);
          if (bad.length) {
            failures.push({ code: 'anchor-out-of-range', subject, evidence: { anchor: part.raw, path: rel, lines: info.lines, ranges: bad.map(([a, b]) => (a === b ? `${a}` : `${a}-${b}`)) },
              supportedFixes: [`re-read ${rel} at the pin and correct the range (file has ${info.lines} lines)`, 'move the pin if the range was taken at a later commit'] });
            continue;
          }
          resolved++;
        }
      }
    }
  }
  // Drift since the pin: informational, never part of the envelope (HEAD-dependent).
  const drift = [];
  let head = null;
  try { head = git(root, ['rev-parse', 'HEAD']).toString().trim(); } catch { /* no HEAD */ }
  if (head && head !== at) {
    for (const [rel, info] of files) {
      if (!info) continue;
      try { git(root, ['diff', '--quiet', at, head, '--', rel]); } catch { drift.push(rel); }
    }
  }
  drift.sort();
  return {
    failures, nonMachine, outsideRoot, untracked, drift, resolved, total,
    summary: { root: rootPosix, at, resolved, non_machine: nonMachine.length, untracked: untracked.length, outside_root: outsideRoot.length },
  };
}

export function formatFailures(failures) {
  return failures.map((f) => `${f.code} ${f.subject}: ${JSON.stringify(f.evidence)} — fix: ${f.supportedFixes[0]}`).join('\n- ');
}

// `node anchors.mjs --selftest` — two-sided controls over a temp git repo.
async function selftest() {
  const fs = await import('node:fs');
  const os = await import('node:os');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'anchors-st-'));
  const fails = [];
  const ok = (cond, msg) => { if (!cond) fails.push(msg); };
  const g = (...a) => execFileSync('git', ['-C', dir, ...a], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  try {
    g('init', '-q');
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'a.py'), Array.from({ length: 10 }, (_, i) => `l${i + 1}`).join('\n') + '\n');
    fs.writeFileSync(path.join(dir, '說明 檔.md'), 'x\ny\n');
    g('add', '-A');
    g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', 'pin');
    const at = g('rev-parse', 'HEAD');
    const view = (nodes, edges = []) => [{ id: 'v', nodes, edges }];
    const decl = { root: dir, at };

    // parse controls (rung 0 examples over the formats measured in the 15 builds)
    const p = parseEv('CLAUDE.md L54; tools/x.py L101-103; RD:a/b.ts:55,115; GL:fetch; src/a.py:3,5-6; GIT; D:\\w\\f.py L2');
    ok(p[0].path === 'CLAUDE.md' && p[0].ranges[0][0] === 54, 'parse "CLAUDE.md L54"');
    ok(p[1].ranges[0].join() === '101,103', 'parse "L101-103"');
    ok(p[2].nonMachine && p[3].nonMachine && p[5].nonMachine, 'abbreviations RD:/GL:/GIT are non-machine');
    ok(p[4].ranges.map((r) => r.join('-')).join() === '3-3,5-6', 'parse ":3,5-6"');
    ok(p[6].path === 'D:/w/f.py' && p[6].ranges[0][0] === 2, 'parse a drive path');

    // known-false: good anchors resolve, nothing fails
    // real formats measured on hook-spine / rules-skills-reach (2026-10-23)
    const q = parseEv('MOD model-cap-mod register.ts L84-97 (heartbeat; INV guard.writes; src/a.py il_by_file CLAUDE.md');
    ok(q[0].nonMachine && q[1].nonMachine, 'abbreviation + space prefixes are non-machine');
    ok(q[2].path === 'src/a.py' && q[2].ranges.length === 0, 'text after the path is a note, not part of it');
    ok(parseEv('"說明 檔.md" L2')[0].path === '說明 檔.md', 'a quoted path may contain spaces');

    // known-false: good anchors resolve, nothing fails
    let r = resolveAnchors(view([{ id: 'n1', ev: 'src/a.py L1-10' }, { id: 'n2', ev: '"說明 檔.md" L2' }], [{ id: 'e1', ev: 'src/a.py:4; GL:fetch' }]), decl);
    ok(r.failures.length === 0 && r.resolved === 3 && r.nonMachine.length === 1 && r.total === 4,
      `good anchors: failures=${r.failures.length} resolved=${r.resolved} nonMachine=${r.nonMachine.length} total=${r.total}`);
    // not provably wrong: bare name, ignored file -> reported, never FAIL
    fs.writeFileSync(path.join(dir, '.gitignore'), 'logs/\n');
    fs.mkdirSync(path.join(dir, 'logs'));
    fs.writeFileSync(path.join(dir, 'logs', 'x.jsonl'), '{}\n');
    r = resolveAnchors(view([{ id: 'n1', ev: 'a.py L3' }, { id: 'n2', ev: 'logs/x.jsonl' }]), decl);
    ok(r.failures.length === 0 && r.nonMachine.length === 1 && r.untracked.length === 1,
      `bare (exists deeper) + ignored reported: failures=${r.failures.length} nonMachine=${r.nonMachine.length} untracked=${r.untracked.length}`);
    // a bare name nothing in the tree carries is a determinable typo -> FAIL
    r = resolveAnchors(view([{ id: 'n1', ev: 'a.pyz L3' }]), decl);
    ok(r.failures.map((f) => f.code).join() === 'anchor-missing', `bare typo fails: ${r.failures.map((f) => f.code).join()}`);
    // known-true: missing path, range past EOF (asserted value: failure codes)
    r = resolveAnchors(view([{ id: 'n1', ev: 'src/b.py L1' }, { id: 'n2', ev: 'src/a.py L9-11' }, { id: 'n3', ev: 'src/ L2' }]), decl);
    ok(r.failures.map((f) => f.code).join() === 'anchor-missing,anchor-out-of-range,anchor-range-on-tree',
      `bad anchors: ${r.failures.map((f) => f.code).join()}`);
    ok(r.failures.every((f) => f.code && f.subject && f.evidence && f.supportedFixes.length), 'failures are diagnostic objects');
    // boundary: L10 is inside a 10-line file, L11 is not
    ok(resolveAnchors(view([{ id: 'n', ev: 'src/a.py L10' }]), decl).failures.length === 0, 'last line resolves');
    ok(resolveAnchors(view([{ id: 'n', ev: 'src/a.py L11' }]), decl).failures.length === 1, 'one past EOF fails');
    // outside root is reported, never FAIL
    r = resolveAnchors(view([{ id: 'n', ev: 'Z:/elsewhere/f.py L1' }]), decl);
    ok(r.failures.length === 0 && r.outsideRoot.length === 1, 'outside-root reported, not FAIL');
    // absolute path inside root is relativised
    r = resolveAnchors(view([{ id: 'n', ev: `${dir.replace(/\\/g, '/')}/src/a.py L2` }]), decl);
    ok(r.failures.length === 0 && r.resolved === 1, 'absolute path inside root resolves');
    // pinned, not HEAD: change the file after the pin -> still resolves at pin, drift reported
    fs.writeFileSync(path.join(dir, 'src', 'a.py'), 'short\n');
    g('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-am', 'later');
    r = resolveAnchors(view([{ id: 'n', ev: 'src/a.py L9' }]), decl);
    ok(r.failures.length === 0 && r.drift.join() === 'src/a.py', `pin holds after HEAD moves; drift=${r.drift.join()}`);
    ok(JSON.stringify(resolveAnchors(view([{ id: 'n', ev: 'src/a.py L9' }]), decl).summary) === JSON.stringify(r.summary),
      'summary is a pure function of the declaration (M1-safe)');
    // pin unreadable throws
    let threw = false;
    try { resolveAnchors(view([]), { root: dir, at: '0'.repeat(40) }); } catch { threw = true; }
    ok(threw, 'unknown pin throws');
    // declaration shape
    ok(validateAnchorDecl({ root: dir, at }).length === 0, 'good anchors declaration');
    ok(validateAnchorDecl({ root: 'rel', at: 'abc' }).length === 2, 'relative root + short sha both rejected');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  if (fails.length) { console.log('SELFTEST FAIL\n- ' + fails.join('\n- ')); process.exit(2); }
  console.log('SELFTEST PASS (anchors.mjs)');
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))
    && process.argv.includes('--selftest')) await selftest();
