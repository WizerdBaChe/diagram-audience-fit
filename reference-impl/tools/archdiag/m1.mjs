#!/usr/bin/env node
// tools/archdiag/m1.mjs — M1 receipt regression over EVERY folder that holds an
// archdiag view, in this repository or not (MAINTENANCE.md M1).
//
// Why: the old M1 loop globbed outputs/diagram-authoring/ only, so an archdiag
// edit (be621e13, 2026-10-21) moved the accepted receipt of an out-of-tree page
// (<projects>\line-reply-agent tg-outpost-audit-f1) without anyone seeing it.
// The list of folders is not kept by hand: it is the `output` field of every
// archview envelope system-hmi discovers (tools/system-hmi/hmi/envelopes.py),
// plus outputs/diagram-authoring/ as a floor for pages that have no envelope.
//
// What it does, per folder: hash every file directly in the folder, run every
// *.build.mjs there that imports archdiag's index.mjs, hash again, and report
// each file whose bytes changed, that appeared, or that disappeared.
// The baseline is the bytes on disk before the run. So that a drifted page left
// uncommitted cannot become its own baseline, an .html or .snapshot.json that
// git already shows as modified before the run makes the result "not a full M1".
//
// Usage:
//   node tools/archdiag/m1.mjs            run and report; leaves changed files as built
//   node tools/archdiag/m1.mjs --restore  run, report, then write back the pre-run bytes of
//                                         every changed or deleted file (new files are listed, never deleted)
//   node tools/archdiag/m1.mjs --list     print the folders and build scripts, run nothing
// Exit: 0 = byte-level no-op everywhere; 1 = some bytes changed; 2 = not a full M1:
// a build failed or threw, envelope discovery failed or found malformed/duplicate
// archview envelopes, a receipt file was already uncommitted, or an unknown flag.
// Not recursive: a build writes beside its page. Symlinked files are skipped and named.
// A page whose folder holds no `<page>.build.mjs` is named as a WARN (it may be built
// by another tool, e.g. a Python generator); it does not change the exit code.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(HERE, '..', '..');
const FLOOR = path.join(HOME, 'outputs', 'diagram-authoring');
const IMPORTS_ARCHDIAG = /archdiag\/index\.mjs['"]/;
const FLAGS = new Set(['--restore', '--list', '-h', '--help']);

const argv = process.argv.slice(2);
const args = new Set(argv);
if (args.has('-h') || args.has('--help')) {
  const src = fs.readFileSync(fileURLToPath(import.meta.url), 'utf8');
  console.log(src.split('\n').filter((l) => l.startsWith('//')).map((l) => l.slice(3)).join('\n'));
  process.exit(0);
}
const unknown = argv.filter((a) => !FLAGS.has(a));
if (unknown.length) { console.log(`m1 FAIL unknown flag(s): ${unknown.join(' ')} (see --help)`); process.exit(2); }

const norm = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();

function discover() {
  const py = [
    'import sys, json',
    `sys.path.insert(0, ${JSON.stringify(path.join(HOME, 'tools', 'system-hmi'))})`,
    'from hmi import envelopes',
    'd = envelopes.discover(max_age_s=0)',
    "outs = sorted({e['output'] for e in d['envelopes'] if isinstance(e.get('archview'), dict) and e['archview'].get('profile') == 'archview/1'})",
    "bad = [str(m[0]) for m in d['malformed'] if '/archview-' in str(m[0]).replace(chr(92), '/')]",
    "dup = [v for v in d['duplicates'] if str(v).startswith('archview-')]",
    "print(json.dumps({'outputs': outs, 'malformed': bad, 'duplicates': dup}))",
  ].join('\n');
  const r = spawnSync('python', ['-X', 'utf8', '-c', py], { encoding: 'utf8', cwd: HOME });
  if (r.status !== 0) return { outputs: [], malformed: [], duplicates: [], error: (r.stderr || r.error?.message || 'python failed').trim().split('\n').pop() };
  try { return { ...JSON.parse(r.stdout.trim().split('\n').pop()), error: null }; }
  catch (e) { return { outputs: [], malformed: [], duplicates: [], error: 'unparseable discovery output: ' + e.message }; }
}

function snapshot(dir) {
  const files = new Map();
  const skipped = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.lstatSync(p);
    if (st.isSymbolicLink()) { skipped.push(name); continue; }
    if (!st.isFile()) continue;
    const buf = fs.readFileSync(p);
    files.set(name, { sha: crypto.createHash('sha256').update(buf).digest('hex'), buf });
  }
  return { files, skipped };
}

function gitDirty(dir) {
  const r = spawnSync('git', ['-C', dir, 'status', '--porcelain', '--', '.'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return r.stdout.split('\n').filter(Boolean);
}

const disc = discover();
let incomplete = 0;
if (disc.error) { incomplete++; console.log(`m1 WARN discovery failed (${disc.error}); checking the floor folder only — not a full M1`); }
for (const m of disc.malformed) { incomplete++; console.log(`m1 WARN malformed archview envelope (its page is not covered): ${m}`); }
for (const v of disc.duplicates) { incomplete++; console.log(`m1 WARN duplicate archview envelopes for ${v} (system-hmi drops both; its page is not covered)`); }

const dirs = new Map([[norm(FLOOR), FLOOR]]);
for (const o of disc.outputs) {
  const d = path.dirname(path.resolve(o));
  if (fs.existsSync(d)) dirs.set(norm(d), d);
  else { incomplete++; console.log(`m1 WARN envelope names a folder that does not exist: ${o}`); }
}

const plan = [...dirs.values()].sort().map((dir) => ({
  dir,
  builds: fs.readdirSync(dir).filter((n) => n.endsWith('.build.mjs'))
    .filter((n) => IMPORTS_ARCHDIAG.test(fs.readFileSync(path.join(dir, n), 'utf8'))).sort(),
}));

for (const o of disc.outputs) {
  const stem = path.basename(o).replace(/\.html?$/i, '');
  if (!fs.existsSync(path.join(path.dirname(path.resolve(o)), stem + '.build.mjs')))
    console.log(`m1 WARN no ${stem}.build.mjs beside ${o}: M1 does not rebuild this page (built by another tool?)`);
}

console.log(`m1: ${disc.outputs.length} archview envelope(s) -> ${plan.length} folder(s), ${plan.reduce((n, p) => n + p.builds.length, 0)} build(s)`);
if (args.has('--list')) {
  for (const p of plan) console.log(`  ${p.dir.replace(/\\/g, '/')}\n    ${p.builds.join('\n    ') || '(no archdiag build script)'}`);
  process.exit(incomplete ? 2 : 0);
}

let changedTotal = 0;
let failed = 0;
for (const { dir, builds } of plan) {
  const shown = dir.replace(/\\/g, '/');
  let before = null;
  try {
    const dirty = gitDirty(dir);
    const dirtyReceipts = (dirty || []).filter((l) => /\.(html?|snapshot\.json)"?$/i.test(l));
    if (dirtyReceipts.length) {
      incomplete++;
      console.log(`m1 WARN ${shown}: receipt file(s) already uncommitted, so their baseline is not the accepted bytes:`);
      for (const l of dirtyReceipts) console.log(`  ${l}`);
    }
    before = snapshot(dir);
    for (const b of builds) {
      const r = spawnSync(process.execPath, [path.join(dir, b)], { cwd: dir, encoding: 'utf8' });
      if (r.status !== 0) {
        failed++;
        console.log(`BUILD FAILED: ${shown}/${b}\n  ${(r.stderr || r.error?.message || '').trim().split('\n').slice(-3).join('\n  ')}`);
      }
    }
    const after = snapshot(dir);
    const changed = [];
    const added = [];
    const removed = [];
    for (const [name, a] of after.files) {
      const b = before.files.get(name);
      if (!b) added.push(name);
      else if (b.sha !== a.sha) changed.push(name);
    }
    for (const name of before.files.keys()) if (!after.files.has(name)) removed.push(name);
    const n = changed.length + added.length + removed.length;
    changedTotal += n;
    const note = dirty === null ? 'not a git folder' : dirty.length ? `${dirty.length} uncommitted path(s) before the run` : 'git-clean before the run';
    console.log(`${n ? 'DIFF' : 'ok  '} ${shown}: ${builds.length} build(s), ${changed.length} changed, ${added.length} new, ${removed.length} deleted; ${note}`);
    for (const x of changed) console.log(`  changed: ${x}`);
    for (const x of added) console.log(`  new:     ${x}`);
    for (const x of removed) console.log(`  deleted: ${x}`);
    for (const x of after.skipped) console.log(`  skipped symlink: ${x}`);
    if (args.has('--restore')) {
      const back = [...changed, ...removed];
      for (const x of back) fs.writeFileSync(path.join(dir, x), before.files.get(x).buf);
      if (back.length) console.log(`  restored ${back.length} file(s) to their pre-run bytes${added.length ? '; new files left in place (never deleted)' : ''}`);
    }
  } catch (e) {
    failed++;
    console.log(`m1 FAIL ${shown}: ${e.message}`);
    if (args.has('--restore') && before) {
      // Best effort: put back every file whose bytes are known, then report.
      for (const [name, f] of before.files) {
        try {
          const p = path.join(dir, name);
          if (!fs.existsSync(p) || crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex') !== f.sha) fs.writeFileSync(p, f.buf);
        } catch (e2) { console.log(`  could not restore ${name}: ${e2.message}`); }
      }
    }
  }
}

if (failed || incomplete) process.exit(2);
process.exit(changedTotal ? 1 : 0);
