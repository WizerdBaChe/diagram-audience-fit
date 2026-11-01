#!/usr/bin/env node
// Regeneration source for self-audit.html — this repository drawn by its own diagram-authoring
// method and archdiag library. Re-render (repo root): node docs/self-portrait/self-audit.build.mjs
//
// Step 0 sources (every element traces to one of these):
//   PR  = docs/self-portrait/refs.json, written by probe_refs.py over reference-impl/ (imports,
//         path citations incl. Windows-style and skill-relative ones, skill-name mentions).
//         Edge evidence is LOOKED UP there by (source file, target); a miss throws.
//   SRC = the cited file and line itself (machine-form ev "reference-impl/<path> Lnn"), resolved
//         by anchors.mjs at the pinned commit below before any bytes are written.
//   VR  = verify/run_controls.py (outside the probe's scope; cited by line by hand, also resolved).
// Positions are hand-placed (they carry the column meaning); every edge path and pill anchor
// comes from route().

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../reference-impl/tools/archdiag/index.mjs';
import { table } from '../../reference-impl/tools/archdiag/tables.mjs';
import { route, applyRoutes } from '../../reference-impl/tools/archdiag/route.mjs';
import { resolveAnchors, formatFailures } from '../../reference-impl/tools/archdiag/anchors.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..');
const OUT = path.join(HERE, 'self-audit.html');
const PIN = '49001fbe4a7d36e4255e87da5486580fd68af6ca';   // v1.0.0 content of reference-impl/ and verify/
const probe = JSON.parse(fs.readFileSync(path.join(HERE, 'refs.json'), 'utf8'));
const RI = 'reference-impl/';

// Evidence lookup: the probe row for src -> dst (dst may be a folder prefix). No row, no edge.
// The cited line is the first one outside YAML frontmatter (a frontmatter hit is usually a routing
// "NOT for ..." clause); `at` picks a specific occurrence, which must be one the probe recorded.
function ref(src, dst, kind, at) {
  const rows = probe.refs.filter((r) => r.src === src && (r.dst === dst || r.dst.startsWith(dst))
    && (!kind || r.kind === kind));
  if (!rows.length) throw new Error(`no probe evidence for ${src} -> ${dst}${kind ? ` (${kind})` : ''}`);
  const r = rows.sort((a, b) => a.line - b.line)[0];
  if (at && !r.lines.includes(at)) throw new Error(`${src} -> ${dst}: line ${at} not among probe lines ${r.lines}`);
  return `${RI}${r.src} L${at || r.line} (${r.kind}${r.count > 1 ? ` ×${r.count}` : ''})`;
}
const DA = 'skills/diagram-authoring/SKILL.md';
const AF = 'skills/audience-fit/SKILL.md';
const EX = 'outputs/diagram-authoring/';
const AD = 'tools/archdiag/';

const nodes = [
  // skills column: methods an agent reads
  { id: 'DA',  kind: 'block', x: 48,  y: 96,  w: 336, h: 72, t: 'diagram-authoring（畫圖）', l: ['Step 0–6：來源→模型→缺口→渲染→驗證'], ev: `${RI}${DA} L36` },
  { id: 'DAR', kind: 'block', x: 48,  y: 216, w: 336, h: 56, t: '記號精準度・載體手冊', l: ['notation-precision・carrier-playbook'], ev: `${RI}${DA} L105` },
  { id: 'PDT', kind: 'block', x: 48,  y: 320, w: 336, h: 56, t: '選型表・視圖健全性檢查', l: ['product-design-thinking/references'], ev: `${RI}skills/product-design-thinking/references/view-integrity-checks.md L8` },
  { id: 'AF',  kind: 'block', x: 48,  y: 456, w: 336, h: 72, t: 'audience-fit（對讀者調校）', l: ['A1 重畫・A2 摘要・B 介面文案'], ev: `${RI}${AF} L76` },
  { id: 'AFR', kind: 'block', x: 48,  y: 576, w: 336, h: 56, t: '5 份參照', l: ['presentational-view R1–R13 等'], ev: `${RI}${AF} L79` },
  { id: 'UX',  kind: 'block', x: 48,  y: 680, w: 336, h: 48, t: '決策點契約（ux-walkthrough）', ev: `${RI}skills/ux-walkthrough/references/decision-point-contract.md L1` },
  // tools column: code
  { id: 'BLD', kind: 'block', x: 480, y: 96,  w: 384, h: 72, t: 'build() ＋ 輸出', l: ['index.mjs・emit.mjs・tables.mjs'], ev: `${RI}${AD}index.mjs L1` },
  { id: 'CHK', kind: 'block', x: 480, y: 216, w: 384, h: 64, t: '結構與幾何檢查（會擋建置）', l: ['schema・asserts・selfcheck（頁內）'], ev: `${RI}${AD}schema.mjs L1` },
  { id: 'WRN', kind: 'block', x: 480, y: 328, w: 384, h: 56, t: '可讀性警告（只警告）', l: ['topology・layout'], ev: `${RI}${AD}topology.mjs L1` },
  { id: 'EVD', kind: 'block', x: 480, y: 440, w: 384, h: 56, t: '證據錨點與覆蓋宣告', l: ['anchors・envelope'], ev: `${RI}${AD}anchors.mjs L1` },
  { id: 'RT',  kind: 'block', x: 480, y: 544, w: 384, h: 64, t: '路由與跳線', l: ['route・hops・vendor/archify-geometry'], ev: `${RI}${AD}route.mjs L1` },
  { id: 'AG',  kind: 'block', x: 480, y: 664, w: 384, h: 64, t: 'afgate.py 讀者版檢查', l: ['Python 標準庫'], ev: `${RI}tools/audience-fit-gate/afgate.py L1` },
  // outputs column: build scripts and the pages they write
  { id: 'B1', kind: 'block', x: 960, y: 96,  w: 272, h: 56, t: '稽核頁建置腳本', l: ['mfp-audit-f3.build.mjs'], ev: ref(`${EX}mfp-audit-f3.build.mjs`, `${AD}index.mjs`, 'import') },
  { id: 'H1', kind: 'store', x: 960, y: 192, w: 272, h: 48, t: '工程稽核頁 .html', ev: `${RI}${EX}mfp-audit-f3.build.mjs L36` },
  { id: 'B2', kind: 'block', x: 960, y: 288, w: 272, h: 56, t: '擁有者視圖建置腳本', l: ['手畫 SVG，只借 a11y 斷言'], ev: `${RI}${EX}mfp-audit-f3-owner-view-v3.build.mjs L39` },
  { id: 'H2', kind: 'store', x: 960, y: 384, w: 272, h: 48, t: '擁有者視圖 .html', ev: `${RI}${EX}mfp-audit-f3-owner-view-v3.build.mjs L42` },
  { id: 'B3', kind: 'block', x: 960, y: 472, w: 272, h: 56, t: '流程圖示範腳本', l: ['flowchart-notation-demo.build.mjs'], ev: ref(`${EX}flowchart-notation-demo.build.mjs`, `${AD}index.mjs`, 'import') },
  { id: 'H3', kind: 'store', x: 960, y: 568, w: 272, h: 48, t: '流程圖示範 .html', ev: `${RI}${EX}flowchart-notation-demo.build.mjs L13` },
  { id: 'VR', kind: 'block', x: 960, y: 672, w: 272, h: 56, t: 'verify/run_controls.py', l: ['12 項雙向驗收'], ev: 'verify/run_controls.py L1' },
];

const edges = [
  { id: 'e1',  type: 'call', from: 'DA',  to: 'DAR', pill: '引用', ev: ref(DA, 'skills/diagram-authoring/references/notation-precision.md') },
  { id: 'e2',  type: 'call', from: 'DA',  to: 'PDT', pill: '選圖種', ev: ref(DA, 'skills/product-design-thinking/', 'name') },
  { id: 'e3',  type: 'call', from: 'DA',  to: 'BLD', pill: '用程式庫畫', ev: ref(DA, AD) },
  { id: 'e4',  type: 'data', from: 'DA',  to: 'AF',  pill: '讀者版交給', ev: ref(DA, 'skills/audience-fit/', 'name', 201) },
  { id: 'e5',  type: 'call', from: 'AF',  to: 'AFR', pill: '重畫規則', ev: ref(AF, 'skills/audience-fit/references/presentational-view.md') },
  { id: 'e6',  type: 'call', from: 'AFR', to: 'UX',  pill: '狀態規則', ev: ref('skills/audience-fit/references/ui-copy-stance.md', 'skills/ux-walkthrough/references/decision-point-contract.md') },
  { id: 'e7',  type: 'call', from: 'AF',  to: 'RT',  pill: 'hopEdges 跳線', ev: ref(AF, `${AD}hops.mjs`) },
  { id: 'e8',  type: 'call', from: 'AF',  to: 'AG',  pill: '跑檢查', ev: ref(AF, 'tools/audience-fit-gate/afgate.py') },
  { id: 'e9',  type: 'call', from: 'BLD', to: 'CHK', pill: 'import', ev: ref(`${AD}index.mjs`, `${AD}schema.mjs`, 'import') },
  { id: 'e10', type: 'call', from: 'BLD', to: 'WRN', pill: 'import', ev: ref(`${AD}index.mjs`, `${AD}topology.mjs`, 'import') },
  { id: 'e11', type: 'call', from: 'BLD', to: 'EVD', pill: 'import', ev: ref(`${AD}index.mjs`, `${AD}anchors.mjs`, 'import') },
  { id: 'e12', type: 'call', from: 'BLD', to: 'RT',  pill: '畫跳線', ev: ref(`${AD}emit.mjs`, `${AD}hops.mjs`, 'import') },
  { id: 'e13', type: 'call', from: 'B1',  to: 'BLD', pill: 'build()', ev: ref(`${EX}mfp-audit-f3.build.mjs`, `${AD}index.mjs`, 'import') },
  { id: 'e14', type: 'call', from: 'B1',  to: 'RT',  pill: 'route()', ev: ref(`${EX}mfp-audit-f3.build.mjs`, `${AD}route.mjs`, 'import') },
  { id: 'e15', type: 'call', from: 'B2',  to: 'CHK', pill: 'a11yAsserts', ev: ref(`${EX}mfp-audit-f3-owner-view-v3.build.mjs`, `${AD}asserts.mjs`, 'import') },
  { id: 'e16', type: 'call', from: 'B3',  to: 'BLD', pill: 'build()', ev: ref(`${EX}flowchart-notation-demo.build.mjs`, `${AD}index.mjs`, 'import') },
  { id: 'e17', type: 'data', from: 'B1',  to: 'H1',  pill: '產生', ev: `${RI}${EX}mfp-audit-f3.build.mjs L36` },
  { id: 'e18', type: 'data', from: 'B2',  to: 'H2',  pill: '產生', ev: `${RI}${EX}mfp-audit-f3-owner-view-v3.build.mjs L42` },
  { id: 'e19', type: 'data', from: 'B3',  to: 'H3',  pill: '產生', ev: `${RI}${EX}flowchart-notation-demo.build.mjs L13` },
  { id: 'e20', type: 'call', from: 'VR',  to: 'AG',  pill: 'A10・A11', ev: 'verify/run_controls.py L94' },
];

const views = [{
  id: 'self', title: '這個 repo 的組成與呼叫關係',
  subtitle: '問題：兩個 skill 怎麼分工、各自呼叫哪段程式、範例頁從哪裡來？每條線都追到檔案與行號（探針 probe_refs.py 實讀，不是看資料夾猜的）。',
  vb: [1280, 768], declaredCrossings: 3,
  containers: [
    { id: 'CS', x: 24,  y: 56, w: 384, h: 696, title: '做法 skills（agent 讀）' },
    { id: 'CT', x: 456, y: 56, w: 432, h: 696, title: '程式 tools' },
    { id: 'CO', x: 936, y: 56, w: 320, h: 584, title: '範例 outputs（腳本 → 頁面）' },
  ],
  nodes, edges,
  declared: [
    'verify/run_controls.py 還重建全部範例並對 sha256（A1/A2）、跑 archdiag 各自我校準（A13–A16）：只畫一條代表線，其餘見下表',
    'rules/ 與 references/design-axes/ 的 5 份通則被參照檔引用，未單畫（聚合在各 skill 方塊）',
  ],
}];

for (let i = 0; i < views.length; i++) {
  const r = route(views[i], { grid: 8 });
  if (r.diagnostics.length) for (const d of r.diagnostics) console.log('ROUTE ' + JSON.stringify(d));
  console.log(`route stats: ${views[i].id} ${r.stats.edges}/${r.stats.of} x${r.stats.crossings}/${r.stats.declared}`);
  views[i] = applyRoutes(views[i], r);
}

// Fabrication firewall: every machine-form ev must exist at the pinned commit (a miss throws).
const anchors = resolveAnchors(views, { root: REPO, at: PIN });
if (anchors.failures.length) throw new Error('ANCHORS FAILED:\n- ' + formatFailures(anchors.failures));
console.log(`anchors: ${anchors.resolved}/${anchors.total} resolved at ${PIN.slice(0, 12)}`);

const evTable = table(['線', '從 → 到', '憑據（檔案 行號，探針種類）'],
  edges.map((e) => [e.id, `${nodes.find((n) => n.id === e.from).t} → ${nodes.find((n) => n.id === e.to).t}`, e.ev]));

const verifyTable = table(['驗收', '它碰的元件', '憑據'], [
  ['A1/A2', '三支範例腳本：重建並印出 sha256（讀者拿 controls_run.txt 對照）','verify/run_controls.py L57'],
  ['A10/A11', 'afgate.py：自我校準＋檢查擁有者視圖', 'verify/run_controls.py L94'],
  ['A13', '可讀性警告（topology）', 'verify/run_controls.py L112'],
  ['A15', '證據錨點與覆蓋宣告（anchors・envelope）', 'verify/run_controls.py L137'],
  ['A16', '流程圖記號與跳線（flow-selftest）', 'verify/run_controls.py L143'],
]);

const gapTable = table(['#', '缺口／發現', '種類', '憑據'], [
  ['G1', '擁有者視圖不經 build()：它是手畫 SVG，只借 asserts.mjs 的 a11y 斷言；頁內幾何自檢不在它身上，靠瀏覽器量測與人工驗收', '發現', `${RI}${EX}mfp-audit-f3-owner-view-v3.build.mjs L39`],
  ['G2', 'diagram-authoring 的 SKILL.md 沒有提到 afgate.py；在 skill 之中只有 audience-fit 呼叫它（verify/ 的 A10/A11 也會跑它）', '發現', `${RI}${AF} L214`],
  ['G3', '兩個 skill 互相是「點名」不是「路徑引用」：只掃路徑的探針看不到這條線，所以探針另掃 skill 名稱', '探針限制（已補）', 'docs/self-portrait/probe_refs.py'],
  ['G4', `原檔裡有 ${Object.keys(probe.unbound_citations).length} 個路徑字串對不到本 repo 的檔案：多數是沒附的其他 skill、規則、紀錄（正式清單在 verify/unshipped_paths.txt），也含範例佔位字（如 tools/x.py）與被截斷的字串；只列不畫，見 refs.json 的 unbound_citations`, '範圍外', 'docs/self-portrait/refs.json'],
  ['G5', '探針只認匯入、路徑字串與 4 個 skill 名稱。名稱命中只代表「提到」（含「不歸我，轉給 X」的分流句），不代表呼叫；「讀了檔才知道」的隱性依賴（例如規格文字描述的流程）看不到', '探針限制', 'docs/self-portrait/probe_refs.py'],
]);

const coverage = table(['範圍', '狀態'], [
  [`reference-impl/ 的 ${probe.files} 個文字檔（共 ${probe.shipped_files} 個檔）`, `探針全讀：${probe.refs.length} 條引用；圖上 ${edges.length} 條線是其中的代表，聚合規則見各方塊副標`],
  ['3 個範例頁（.html）', '畫了（腳本 → 頁面）'],
  ['1 張截圖（擁有者視圖的 .png）', '排除：是擁有者視圖頁的畫面，不另畫'],
  ['verify/', '畫一條代表線，其餘在驗收表'],
  ['docs/、README、AGENTS', '排除：說明文件，不是能力的一部分'],
]);

build({
  outPath: OUT, grid: 8, views, archview: false,
  doc: {
    lang: 'zh-Hant',
    title: 'diagram-audience-fit 自畫像',
    h1: 'diagram-audience-fit 自畫像：用這個 repo 自己的方法畫自己',
    legendbar: '藍方塊＝檔案群（skill 或程式），琥珀＝產出的頁面。灰開箭頭＝引用／import，黑實線＝產生或交棒。虛線大框＝資料夾分組。交叉以跳線畫出。',
    footerNote: `再生源：docs/self-portrait/self-audit.build.mjs（節點座標人排；線與標籤位置由 route() 產生）。來源：probe_refs.py 對 reference-impl/ 的實讀結果 refs.json；圖上每條線與每個方塊的憑據在固定 commit ${PIN.slice(0, 7)} 上逐一解析過才寫出本頁；驗收表與缺口表的行號為人工核對。`,
    pageClass: 'diagram',
  },
  sections: [
    { h2: '每條線的憑據', html: evTable },
    { h2: '驗收碰到哪些元件', html: verifyTable },
    { h2: '缺口報告', html: gapTable },
    { h2: '覆蓋宣告', html: coverage },
  ],
});
