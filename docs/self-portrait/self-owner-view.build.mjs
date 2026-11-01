#!/usr/bin/env node
// Regeneration source for self-owner-view.html — the reader edition (audience-fit A1, presentational
// view) of self-audit.html. Re-render (repo root): node docs/self-portrait/self-owner-view.build.mjs
//
// Input is the structural model of self-audit.build.mjs, not prose about it: every node here maps to
// its element ids (R5 table below), nothing is added that the engineering view lacks, and every
// finding of its gap table keeps its number (R4). Rendered through the shared archdiag renderer
// (audience-fit SKILL.md L94-97 allows a shared tools/ renderer); crossings hop (R13).

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../reference-impl/tools/archdiag/index.mjs';
import { table } from '../../reference-impl/tools/archdiag/tables.mjs';
import { route, applyRoutes } from '../../reference-impl/tools/archdiag/route.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'self-owner-view.html');
const ENG = 'docs/self-portrait/self-audit.html';

const nodes = [
  { id: 'SYS', kind: 'ext',   x: 48,  y: 120, w: 240, h: 72, t: '你的系統', l: ['程式・設定・設計文件'], ev: `${ENG} DA（Step 0 來源）` },
  { id: 'DRAW', kind: 'block', x: 384, y: 120, w: 272, h: 72, t: '① 畫圖的做法', l: ['先列來源，再寫模型，最後才出圖'], ev: `${ENG} DA DAR PDT` },
  { id: 'LIB', kind: 'block', x: 384, y: 296, w: 272, h: 72, t: '繪圖程式庫', l: ['排線、跳線、自我檢查'], ev: `${ENG} BLD CHK WRN EVD RT` },
  { id: 'ENGV', kind: 'store', x: 752, y: 120, w: 272, h: 72, t: '工程稽核圖＋缺口報告', l: ['每條線追得到出處'], ev: `${ENG} H1 H3` },
  { id: 'FIT', kind: 'block', x: 752, y: 296, w: 272, h: 72, t: '② 對讀者調校', l: ['只換讀者，不換發現'], ev: `${ENG} AF AFR UX` },
  { id: 'OWN', kind: 'store', x: 752, y: 472, w: 272, h: 72, t: '給擁有者看的圖', l: ['和原版成對交付'], ev: `${ENG} H2` },
  { id: 'GATE', kind: 'block', x: 384, y: 472, w: 272, h: 72, t: '讀者版檢查', l: ['數字、範圍、用語不准改輕'], ev: `${ENG} AG` },
  { id: 'VER', kind: 'block', x: 48,  y: 472, w: 240, h: 72, t: '驗收腳本', l: ['12 項，每項正反兩面'], ev: `${ENG} VR` },
];

const edges = [
  { id: 'o1', type: 'data', from: 'SYS',  to: 'DRAW', pill: '讀取來源', ev: `${ENG} DA` },
  { id: 'o2', type: 'call', from: 'DRAW', to: 'LIB',  pill: '交給程式畫', ev: `${ENG} e3` },
  { id: 'o3', type: 'data', from: 'DRAW', to: 'ENGV', pill: '產出', ev: `${ENG} e13 e17` },
  { id: 'o4', type: 'data', from: 'ENGV', to: 'FIT',  pill: '同一份發現', ev: `${ENG} e4` },
  { id: 'o5', type: 'call', from: 'FIT',  to: 'LIB',  pill: '共用跳線', ev: `${ENG} e7` },
  { id: 'o6', type: 'data', from: 'FIT',  to: 'OWN',  pill: '重畫', ev: `${ENG} e18` },
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
  ['你的系統', '（Step 0 來源，工程版以每條線的憑據呈現）', '—'],
  ['① 畫圖的做法', 'DA・DAR・PDT', '三份參照文件的名稱'],
  ['繪圖程式庫', 'BLD・CHK・WRN・EVD・RT', '五組模組的分工與 import 細節'],
  ['工程稽核圖＋缺口報告', 'B1→H1・B3→H3', '腳本檔名'],
  ['② 對讀者調校', 'AF・AFR・UX', '5 份參照與決策點契約的名稱'],
  ['給擁有者看的圖', 'B2→H2', '腳本只借 a11y 斷言的細節（見下方 G1）'],
  ['讀者版檢查', 'AG', '—'],
  ['驗收腳本', 'VR（＋驗收表 A1–A16）', '除 A10/A11 外的驗收線'],
]);
const status = table(['#', '工程版的發現（原樣保留）'], [
  ['G1', '擁有者視圖的範例不經同一套建置與頁內自檢，靠瀏覽器量測與人工驗收'],
  ['G2', '畫圖的做法沒有直接呼叫讀者版檢查；這一步只由「對讀者調校」執行'],
  ['G3', '兩個能力互相「點名」而不是引用路徑；只看路徑會漏掉這條線（探針已補）'],
  ['G4', '原檔提到 42 個沒附的路徑，只列不畫'],
  ['G5', '探針看不到只在文字裡描述的隱性依賴'],
]);

build({
  outPath: OUT, grid: 8, views, archview: false,
  doc: {
    lang: 'zh-Hant',
    title: 'diagram-audience-fit 給你什麼',
    h1: 'diagram-audience-fit 給你什麼（讀者版）',
    legendbar: '藍方塊：做事的步驟。琥珀：你拿到的成品。灰膠囊：你的系統。黑實線表示東西往下傳，灰箭頭表示呼叫。',
    footerNote: '本頁由工程版的結構模型重畫而成，建置腳本在同一個資料夾。對照表與發現表在上方，和原版成對交付。',
    pageClass: 'diagram',
  },
  sections: [
    { h2: '這張圖和工程版的對照', html: mapping },
    { h2: '工程版的發現與限制（一條不少）', html: status },
  ],
});
