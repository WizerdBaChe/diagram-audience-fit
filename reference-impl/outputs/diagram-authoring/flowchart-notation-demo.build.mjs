#!/usr/bin/env node
// Regeneration source for flowchart-notation-demo.html — the reference
// specimen of notation-precision.md §2 (line hop) and §3 Flowchart, drawn
// through archdiag. Topic: diagram-authoring's own Step 0-6 delivery loop
// (skills/diagram-authoring/SKILL.md), so every element traces to that file.
// Re-render: node flowchart-notation-demo.build.mjs

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../tools/archdiag/index.mjs';
import { table } from '../../tools/archdiag/tables.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'flowchart-notation-demo.html');
const SK = 'skills/diagram-authoring/SKILL.md';

const nodes = [
  { id: 'S',  kind: 'term',     x: 240, y: 24,  w: 240, h: 48,  t: '收到繪圖需求', ev: `${SK} Step 0` },
  { id: 'P1', kind: 'proc',     x: 240, y: 112, w: 240, h: 56,  t: '1  列出來源資料', l: ['每個節點都要能追到來源'], ev: `${SK} Step 0` },
  { id: 'P2', kind: 'proc',     x: 240, y: 208, w: 240, h: 56,  t: '2  先寫文字模型', l: ['節點表、邊表、狀態表'], ev: `${SK} Step 2` },
  { id: 'D1', kind: 'decision', x: 248, y: 304, w: 224, h: 112, t: '來源撐得住嗎？', ev: `${SK} Step 0` },
  { id: 'P3', kind: 'proc',     x: 240, y: 464, w: 240, h: 56,  t: '3  渲染並跑幾何自檢', l: ['notation-precision §4'], ev: `${SK} Step 4` },
  { id: 'D2', kind: 'decision', x: 264, y: 560, w: 192, h: 96,  t: '自檢 PASS？', ev: `${SK} Step 5` },
  { id: 'E',  kind: 'term',     x: 240, y: 704, w: 240, h: 48,  t: '交付圖＋缺口報告', ev: `${SK} Step 6` },
  { id: 'SD', kind: 'proc',     x: 656, y: 336, w: 160, h: 48,  t: '補資料或縮小範圍', ev: `${SK} Step 0` },
  { id: 'N1', kind: 'note',     x: 16,  y: 344, w: 112, h: 32,  t: '撐不住的寫進缺口', ev: `${SK} Step 2` },
];

const edges = [
  { id: 'f1', type: 'trans', from: 'S',  to: 'P1', pts: [[360, 72], [360, 112]], ev: `${SK} Step 0` },
  { id: 'f2', type: 'trans', from: 'P1', to: 'P2', pts: [[360, 168], [360, 208]], ev: `${SK} Step 2` },
  { id: 'f3', type: 'trans', from: 'P2', to: 'D1', pts: [[360, 264], [360, 304]], ev: `${SK} Step 2` },
  { id: 'f4', type: 'trans', from: 'D1', to: 'P3', pts: [[360, 416], [360, 464]], pill: '是', pillAt: [384, 440], ev: `${SK} Step 4` },
  { id: 'f5', type: 'trans', from: 'D1', to: 'SD', pts: [[472, 360], [656, 360]], pill: '否', pillAt: [528, 344], ev: `${SK} Step 0` },
  { id: 'f6', type: 'trans', from: 'P3', to: 'D2', pts: [[360, 520], [360, 560]], ev: `${SK} Step 5` },
  { id: 'f7', type: 'trans', from: 'D2', to: 'E',  pts: [[360, 656], [360, 704]], pill: '是', pillAt: [384, 680], ev: `${SK} Step 6` },
  { id: 'b1', type: 'warn',  from: 'D2', to: 'P2', pts: [[456, 608], [600, 608], [600, 236], [480, 236]], pill: '否：回第 2 步', pillAt: [600, 520], ev: `${SK} Step 5` },
  { id: 'b2', type: 'warn',  from: 'SD', to: 'P1', pts: [[736, 336], [736, 140], [480, 140]], pill: '補完回第 1 步', pillAt: [736, 240], ev: `${SK} Step 0` },
  { id: 'a1', type: 'annot', from: 'N1', to: 'D1', pts: [[128, 360], [248, 360]], ev: `${SK} Step 2` },
];

const views = [{
  id: 'flow', title: '繪圖交付流程（示範：流程圖符號＋跳線）',
  subtitle: '交一張圖之前要走哪幾步、哪一步沒過要退回哪裡？',
  declared: ['主流程由上往下', '紅色虛線＝未通過退回', '細虛線＝旁註，不是步驟', '1 處交叉以跳線畫出'],
  vb: [840, 776], declaredCrossings: 1, crossingStyle: 'hop', nodes, edges,
}];

const legend = [
  ['膠囊形', '起點／終點 (terminator)', 'term'],
  ['方框', '步驟 (process)', 'proc'],
  ['菱形', '判斷 (decision)：線只從四個頂點進出，每個出口標條件', 'decision'],
  ['無框文字＋細虛線', '旁註 (annotation)：說明，不是步驟', 'note + annot'],
  ['紅色虛線箭頭', '未通過退回 (loop-back)：顏色＋虛線雙重標示', 'warn'],
  ['線上的小半圓', '跳線 (line hop)：兩條線只是經過、沒有相接；水平的那條跳', "crossingStyle: 'hop'"],
  ['實心圓點', '接點 (junction)：線真的接在一起（本圖沒有）', '自動產生'],
];

build({
  outPath: OUT, grid: 8, views, archview: false,
  doc: {
    title: '流程圖符號示範', h1: '流程圖符號示範：判斷菱形、退回線、旁註、跳線',
    legendbar: '圖例見下表。規則出處：skills/diagram-authoring/references/notation-precision.md §2（跳線）、§3 Flowchart。',
    footerNote: '本頁由 flowchart-notation-demo.build.mjs 產生，是 archdiag 流程圖符號的參考樣本；M1 回歸會重建它。',
    pageClass: 'diagram',
  },
  sections: [{ h2: '圖例', html: table(['畫法', '意思', 'archdiag 寫法'], legend) }],
});
