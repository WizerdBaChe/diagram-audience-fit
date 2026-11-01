#!/usr/bin/env node
// Regeneration source for self-owner-view.html — the reader edition (audience-fit A1, presentational
// view) of self-audit.html. Re-render (repo root): node docs/self-portrait/self-owner-view.build.mjs
//
// Input is the structural model of self-audit.build.mjs, not prose about it. Every reader node maps
// to engineering element ids and every reader edge to the engineering edges it is composed from
// (R5 tables below); one node is reader-side only and says so: "your system" (the reader's own
// sources, which the engineering view of THIS repo has no node for). Every finding of the gap table
// keeps its number and its kind (R4). Rendered through the shared archdiag renderer (audience-fit
// SKILL.md L94-97 allows a shared tools/ renderer); crossings hop (R13). The provenance block opens
// the page (audience-fit SKILL.md L106-111).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../reference-impl/tools/archdiag/index.mjs';
import { table } from '../../reference-impl/tools/archdiag/tables.mjs';
import { route, applyRoutes } from '../../reference-impl/tools/archdiag/route.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'self-owner-view.html');
const ENG = 'docs/self-portrait/self-audit.html';
const PIN = '49001fb';  // same pin as self-audit.build.mjs
const probe = JSON.parse(fs.readFileSync(path.join(HERE, 'refs.json'), 'utf8'));
const unbound = Object.keys(probe.unbound_citations).length;

const nodes = [
  { id: 'SYS', kind: 'ext',   x: 48,  y: 120, w: 240, h: 72, t: '你的系統', l: ['程式・設定・設計文件'], ev: 'reader-side actor (no engineering node)' },
  { id: 'DRAW', kind: 'block', x: 384, y: 120, w: 272, h: 72, t: '① 畫圖的做法', l: ['先列來源，再寫模型，最後才出圖'], ev: `${ENG} DA DAR PDT` },
  { id: 'LIB', kind: 'block', x: 384, y: 296, w: 272, h: 72, t: '繪圖程式庫', l: ['排線、跳線、自我檢查'], ev: `${ENG} BLD CHK WRN EVD RT` },
  { id: 'ENGV', kind: 'store', x: 752, y: 120, w: 272, h: 72, t: '工程稽核圖＋缺口報告', l: ['每條線追得到出處'], ev: `${ENG} B1 H1` },
  { id: 'FIT', kind: 'block', x: 752, y: 296, w: 272, h: 72, t: '② 對讀者調校', l: ['只換讀者，不換發現'], ev: `${ENG} AF AFR UX` },
  { id: 'OWN', kind: 'store', x: 752, y: 472, w: 272, h: 72, t: '給擁有者看的圖', l: ['和原版成對交付'], ev: `${ENG} B2 H2` },
  { id: 'GATE', kind: 'block', x: 384, y: 472, w: 272, h: 72, t: '讀者版檢查', l: ['編造的數字會擋下；範圍、用語只提醒'], ev: `${ENG} AG` },
  { id: 'VER', kind: 'block', x: 48,  y: 472, w: 240, h: 72, t: '驗收腳本', l: ['12 項，每項正反兩面'], ev: `${ENG} VR` },
];

const edges = [
  { id: 'o1', type: 'data', from: 'SYS',  to: 'DRAW', pill: '讀取來源', ev: 'reader-side (Step 0 of DA)' },
  { id: 'o2', type: 'call', from: 'DRAW', to: 'LIB',  pill: '交給程式畫', ev: `${ENG} e3` },
  { id: 'o3', type: 'data', from: 'DRAW', to: 'ENGV', pill: '產出', ev: `${ENG} composed e3 e13 e17` },
  { id: 'o4', type: 'data', from: 'ENGV', to: 'FIT',  pill: '同一份發現', ev: `${ENG} composed e4` },
  { id: 'o5', type: 'call', from: 'FIT',  to: 'LIB',  pill: '共用跳線', ev: `${ENG} e7` },
  { id: 'o6', type: 'data', from: 'FIT',  to: 'OWN',  pill: '重畫', ev: `${ENG} composed AF e18` },
  { id: 'o7', type: 'call', from: 'FIT',  to: 'GATE', pill: '交付前檢查', ev: `${ENG} e8` },
  { id: 'o8', type: 'call', from: 'VER',  to: 'GATE', pill: '驗收', ev: `${ENG} e20` },
];

const views = [{
  id: 'own', title: '這個工具包給你什麼',
  subtitle: '兩個能力接力：先畫出追得到出處的工程圖，再把同一份發現重畫給不是作者的人看。',
  vb: [1072, 600], declaredCrossings: 0, nodes, edges,
  declared: ['驗收腳本還會重建範例、檢查程式庫，這裡只畫一條代表線（工程版有完整表）'],
}];
for (let i = 0; i < views.length; i++) {
  const r = route(views[i], { grid: 8 });
  for (const d of r.diagnostics) console.log('ROUTE ' + JSON.stringify(d));
  console.log(`route stats: ${views[i].id} ${r.stats.edges}/${r.stats.of} x${r.stats.crossings}/${r.stats.declared}`);
  views[i] = applyRoutes(views[i], r);
}

const mapping = table(['這張圖上', '工程版的元素', '省略了什麼'], [
  ['你的系統', '工程版沒有這一格：它畫的是這個工具包自己；這一格代表你要畫的對象', '—'],
  ['① 畫圖的做法', 'DA・DAR・PDT', '三份參照文件的名稱'],
  ['繪圖程式庫', 'BLD・CHK・WRN・EVD・RT', '五組模組的分工與 import 細節；流程圖記號的示範頁（B3→H3）是記號樣本，未單畫'],
  ['工程稽核圖＋缺口報告', 'B1→H1', '腳本檔名'],
  ['② 對讀者調校', 'AF・AFR・UX', '5 份參照與決策點契約的名稱'],
  ['給擁有者看的圖', 'B2→H2', '腳本只借無障礙（a11y）斷言的細節（見下方 G1）'],
  ['讀者版檢查', 'AG', '—'],
  ['驗收腳本', 'VR（＋驗收表 A1–A16）', '除 A10/A11 外的驗收線'],
]);
const lines = table(['這張圖上的線', '工程版的線', '怎麼對應'], [
  ['你的系統 → 畫圖的做法', '—', '讀者這邊才有的線：做法第 0 步「先列來源」讀的是你的系統'],
  ['畫圖的做法 → 繪圖程式庫', 'e3', '同一條'],
  ['畫圖的做法 → 工程稽核圖', 'e3＋e13＋e17', '合併：做法用程式庫畫，稽核頁腳本呼叫 build()，再寫出頁面'],
  ['工程稽核圖 → 對讀者調校', 'e4', '合併：工程版是「畫圖的做法把讀者版交給對讀者調校」，這裡把起點畫成它交出的成品'],
  ['對讀者調校 → 繪圖程式庫', 'e7', '同一條'],
  ['對讀者調校 → 給擁有者看的圖', 'AF＋e18', '合併：對讀者調校的重畫規則，加上擁有者視圖腳本寫出頁面'],
  ['對讀者調校 → 讀者版檢查', 'e8', '同一條'],
  ['驗收腳本 → 讀者版檢查', 'e20', '同一條'],
]);
const status = table(['#', '種類', '工程版的發現（改寫成白話，種類照原樣）'], [
  ['G1', '發現', '擁有者視圖的範例不經同一套建置與頁內自檢：它是手畫的圖，只借了無障礙（a11y）斷言；靠瀏覽器量測與人工驗收'],
  ['G2', '發現', '畫圖的做法沒有提到讀者版檢查；在兩個能力之中，只有「對讀者調校」會呼叫它（驗收腳本也會跑它）'],
  ['G3', '探針限制（已補）', '兩個能力互相「點名」而不是引用路徑；只看路徑會漏掉這條線，所以探針另外掃能力的名稱'],
  ['G4', '範圍外', `原檔裡有 ${unbound} 個路徑字串對不到這個工具包裡的檔案：多數是沒附的其他能力、規則、紀錄，也含範例佔位字與被截斷的字串；只列不畫`],
  ['G5', '探針限制', '探針只認匯入、路徑字串與能力名稱；名稱出現只代表「提到」，不代表呼叫；只在文字裡描述的隱性依賴看不到'],
]);
const scope = table(['範圍', '狀態'], [
  ['兩個能力、繪圖程式庫、讀者版檢查、範例頁', '畫了'],
  ['驗收腳本', '畫一條代表線'],
  ['說明文件與擁有者視圖的截圖', '排除：說明文件不是能力的一部分；截圖是擁有者視圖頁的畫面'],
]);

const provenance = `<b>這是讀者版。</b>原版：<a href="self-audit.html">工程版自畫像</a>（同一份發現，每條線附出處）。`
  + `讀者：不是作者的人。基準：commit <code>${PIN}</code> 的內容，2026-11-01 產出；工程版重新產生後，本頁要跟著改版。<br>`
  + '圖例：藍方塊是做事的步驟，琥珀是你拿到的成品，灰膠囊是你的系統；黑實線表示東西往下傳，灰箭頭表示呼叫。';

build({
  outPath: OUT, grid: 8, views, archview: false,
  doc: {
    lang: 'zh-Hant',
    title: 'diagram-audience-fit 給你什麼',
    h1: 'diagram-audience-fit 給你什麼（讀者版）',
    legendbar: provenance,
    footerNote: '本頁由工程版的結構模型重畫而成，建置腳本在同一個資料夾。和原版成對交付。',
    pageClass: 'diagram',
  },
  sections: [
    { h2: '方塊和工程版的對照', html: mapping },
    { h2: '線和工程版的對照', html: lines },
    { h2: '工程版的發現與限制（五條都在，改寫自工程版缺口表）', html: status },
    { h2: '畫了什麼、沒畫什麼', html: scope },
  ],
});
