#!/usr/bin/env node
// Regeneration source for mfp-audit-f3-owner-view-v3.html — the mfp F3 owner
// view, 第 3 版, drawn 2026-09-06 under the 2026-09-05 rule text as a rules
// test: presentational-view R2 (count dial: target <=18 nodes / <=24
// connectors), R5 (mapping table with a cut column), R10/R11 (snap-or-
// separate, named anchors), R12 (fixed cut order), and the carrier-playbook
// owner-view size preset (960 x 470-800; name 15 bold / role 11.5 / edge label
// 11 / status marker 12-15 bold / legend 11.5; floor 11; never squeeze type).
// Canonical: mfp-audit-f3.html @ main 96e6673 + feat/transcribe-audio,
// generated 2026-08-29. The accepted 第 2 版 (mfp-audit-f3-owner-view.html,
// 2026-08-30) is untouched; this file emits a NEW page beside it.
//
// Step 1 close-line (declared before drawing):
//   views: fig 1 system panorama (owner wording) + fig 2 simplified task
//   lifecycle (kept from v2 — same reader question 「這系統是什麼、現在健康嗎」,
//   the lifecycle is its 側態 half); carrier: self-contained HTML, owner-view
//   preset 960 x 784 / 960 x 252; budget: v2's 24 nodes -> 18 by R12 rung 3
//   merges only (節奏控制->佇列, 校正->轉錄, 模型資料夾->引擎, 下載資料夾+執行紀錄
//   ->本機資料夾, ffmpeg->yt-dlp capsule) — rungs 1-2 free space not count and
//   are not needed at this ramp; rung 4 not reached; what the source cannot
//   answer: mfp's state after 2026-08-29 (this page projects the F3 model).
//
// R6 corrections vs v2 (v2 drew three edges the canonical does not have):
//   CLI->API (canonical: CLI shares the core, no queue — l1 e2/e6/e9/e11/e13/
//   e17, l2p CLI2); queue->stack and queue->transcript (canonical: the API
//   dispatches both directly — l2p p13/p15). Drawn here as CLI->core
//   container (l3i i1/i2 aggregate) and API->stack, API->transcribe.
//
// Every node centre and edge endpoint derives from the anchor table A below
// (R11). The closing sweep (R10) runs as code over the same model, and the
// emitted page is then measured in a real browser (text bboxes vs node boxes,
// label clearance, containment) — the model sweep is the producer's own
// check; the browser pass is the gate that reads the artifact.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { a11yAsserts } from '../../tools/archdiag/asserts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'mfp-audit-f3-owner-view-v3.html');

// ---------- R2 budget (presentational-view, calibrated 2026-09-05) ----------
const BUDGET = { nodesTarget: 18, edgesTarget: 24, nodesCeil: 24, edgesCeil: 27 };
const GAP = 3;        // uniform arrow-head gap before the border it points at (R10)
const MIN_SEP = 20;   // parallel runs closer than this = the near-coincidence band (R10)

// ---------- anchors (R11) — fig 1 ----------
const A = {
  W: 240,                              // node width on every column
  C1: 200, C2: 480, C3: 760,           // column centerlines
  R0: 28, H0: 62,                      // entries
  R1: 140, H1: 54,                     // API
  R2: 244, H2: 62,                     // queue
  CT: 350, CB: 466,                    // core container top/bottom
  R3: 384, H3: 62,                     // capabilities (inside the container)
  R4: 520, H4: 54,                     // external programs (capsules) — 54 so a 15/11.5 two-line stack keeps 3px between glyph boxes (46 measured touching)
  BUS: 616, BUSX0: 100, BUSX1: 860,    // disk bus line
  R5: 644, H5: 56,                     // local folder
  LEG: 744,                            // legend swatch top
  VBH: 784,                            // viewBox height
  MID34: 492,                          // corridor between rows 3 and 4
  P_DL_BIN: 270,                       // 貼文下載 bottom port toward the yt-dlp capsule (C1+70)
  P_BIN_IN: 420,                       // capsule top port from 貼文下載 (C2-60)
  P_TR_IN: 690,                        // 轉錄 top port from the API (C3-70)
};
// ---------- anchors (R11) — fig 2 ----------
const B = {
  S1: 110, S2: 300, S3: 490, S4: 680, S5: 860, // state centerlines
  RA: 50, HA: 52, WA: 140,                    // main row
  RB: 162, HB: 54,                            // side row (54: same two-line reason as fig 1 row 4)
  P_CRASH: 334, P_RETRY: 270,                 // 探測 bottom ports (S2+34 / S2-30): crash leaves on the right so the retry return at S2-30 never crosses its corridor (v2 had this crossing)
  P_PAUSE_DN: 662, P_PAUSE_UP: 700,           // 下載中<->暫停 verticals (S4-18 / S4+20)
  Y_CRASH: 189, Y_RETRY: 232,                 // corridors (Y_CRASH = 暫停 mid = RB + HB/2)
  VBH: 252,
};

// ---------- fig 1 model ----------
const n1 = [
  { id: 'GUI',  kind: 'mod', cx: A.C2, y: A.R0, w: A.W, h: A.H0, name: '桌面介面（GUI）', role: '貼連結・看進度・改設定' },
  { id: 'CLI',  kind: 'mod', cx: A.C3, y: A.R0, w: A.W, h: A.H0, name: '指令列（CLI）', role: 'AI 助手也走這裡・適合批次腳本' },
  { id: 'API',  kind: 'mod', cx: A.C2, y: A.R1, w: A.W, h: A.H1, name: '服務端窗口（API）', role: '桌面介面的動作由此派工；只有下載排隊' },
  { id: 'QUE',  kind: 'mod', cx: A.C1, y: A.R2, w: A.W, h: A.H2, name: '任務佇列——系統總管', role: '唯一改任務狀態者；限速探測、逐件下載', sw: 2 },
  { id: 'DL',   kind: 'mod', cx: A.C1, y: A.R3, w: A.W, h: A.H3, name: '貼文下載', role: 'IG・Threads・YouTube・X・Bili' },
  { id: 'STK',  kind: 'mod', cx: A.C2, y: A.R3, w: A.W, h: A.H3, name: '影格截圖堆疊', role: '抽影格・疊對照圖', mark: { t: '②', c: 'open' } },
  { id: 'TRX',  kind: 'mod', cx: A.C3, y: A.R3, w: A.W, h: A.H3, name: '語音轉錄・翻譯・校正', role: '音檔→逐字稿→譯文；改一次就記住', ov: true, mark: { t: '③', c: 'ov' } },
  { id: 'CHR',  kind: 'cap', cx: A.C1, y: A.R4, w: 200, h: A.H4, name: 'Chrome', role: '只讀公開頁・絕不登入' },
  { id: 'BIN',  kind: 'cap', cx: A.C2, y: A.R4, w: A.W, h: A.H4, name: 'yt-dlp・ffmpeg', role: '抓取與格式處理；選配 gallery-dl', mark: { t: '①', c: 'bad' } },
  { id: 'ENG',  kind: 'cap', cx: A.C3, y: A.R4, w: A.W, h: A.H4, name: '本機語音引擎', role: '模型在你電腦上跑；模型檔可搬移', ov: true, mark: { t: '③', c: 'ov' } },
  { id: 'DISK', kind: 'amb', cx: A.C2, y: A.R5, w: 300, h: A.H5, name: '本機資料夾', role: '成品自動命名歸檔；失敗紀錄整包保留、可重現' },
];
const cont1 = [{ id: 'CORE', x: 56, y: A.CT, w: 848, h: A.CB - A.CT, title: '核心能力——兩個入口共用同一套本事', tx: 336, ty: A.CT + 20 }];
const byId1 = Object.fromEntries(n1.map((n) => [n.id, n]));
const L = (n) => n.cx - n.w / 2, R = (n) => n.cx + n.w / 2, T = (n) => n.y, Bt = (n) => n.y + n.h, CY = (n) => n.y + n.h / 2;
const e1 = [
  { id: 'e1',  from: 'GUI', to: 'API', pts: [[A.C2, Bt(byId1.GUI)], [A.C2, T(byId1.API) - GAP]] },
  { id: 'e2',  from: 'API', to: 'QUE', pts: [[L(byId1.API), CY(byId1.API)], [A.C1, CY(byId1.API)], [A.C1, T(byId1.QUE) - GAP]],
    label: { t: '下載任務', x: 280, y: CY(byId1.API) - 7, anchor: 'middle' } },
  { id: 'e3',  from: 'QUE', to: 'DL',  pts: [[A.C1, Bt(byId1.QUE)], [A.C1, T(byId1.DL) - GAP]] },
  { id: 'e4',  from: 'API', to: 'STK', pts: [[A.C2, Bt(byId1.API)], [A.C2, T(byId1.STK) - GAP]] },
  { id: 'e5',  from: 'API', to: 'TRX', pts: [[R(byId1.API), CY(byId1.API)], [A.P_TR_IN, CY(byId1.API)], [A.P_TR_IN, T(byId1.TRX) - GAP]] },
  { id: 'e6',  from: 'CLI', to: 'CORE', pts: [[A.C3, Bt(byId1.CLI)], [A.C3, A.CT - GAP]],
    label: { t: '同一套本事・直接呼叫・不經佇列', x: A.C3 + 8, y: 224, anchor: 'start' } },
  { id: 'e7',  from: 'DL',  to: 'CHR', pts: [[A.C1, Bt(byId1.DL)], [A.C1, T(byId1.CHR) - GAP]] },
  { id: 'e8',  from: 'DL',  to: 'BIN', pts: [[A.P_DL_BIN, Bt(byId1.DL)], [A.P_DL_BIN, A.MID34], [A.P_BIN_IN, A.MID34], [A.P_BIN_IN, T(byId1.BIN) - GAP]] },
  { id: 'e9',  from: 'STK', to: 'BIN', pts: [[A.C2, Bt(byId1.STK)], [A.C2, T(byId1.BIN) - GAP]] },
  { id: 'e10', from: 'TRX', to: 'ENG', pts: [[A.C3, Bt(byId1.TRX)], [A.C3, T(byId1.ENG) - GAP]] },
  { id: 'e11', from: 'BUS', to: 'DISK', pts: [[A.C2, A.BUS], [A.C2, T(byId1.DISK) - GAP]] },
];
const bus1 = { x0: A.BUSX0, x1: A.BUSX1, y: A.BUS, label: { t: '所有成品與紀錄都落在本機磁碟', x: A.C2, y: A.BUS - 8, anchor: 'middle' } };
const legend1 = [
  { x: 70,  kind: 'mod', t: '程式元件' },
  { x: 190, kind: 'cap', t: '外部程式' },
  { x: 310, kind: 'amb', t: '磁碟資料' },
  { x: 430, kind: 'ov',  t: '未驗收新分支（③）' },
  { x: 610, kind: 'arrow', t: '實際的呼叫／資料流向' },
];

// ---------- fig 2 model (v2 geometry, re-derived from anchors; sizes on the ramp) ----------
const n2 = [
  { id: 'PARSED',      kind: 'st', cx: B.S1, y: B.RA, w: B.WA, h: B.HA, name: '收單',   role: '解析你貼的連結' },
  { id: 'PROBING',     kind: 'st', cx: B.S2, y: B.RA, w: B.WA, h: B.HA, name: '探測',   role: '查這則能拿到什麼' },
  { id: 'READY',       kind: 'st', cx: B.S3, y: B.RA, w: B.WA, h: B.HA, name: '就緒',   role: '清單擺好等你' },
  { id: 'DOWNLOADING', kind: 'st', cx: B.S4, y: B.RA, w: B.WA, h: B.HA, name: '下載中', role: '一次一件' },
  { id: 'COMPLETED',   kind: 'st', cx: B.S5, y: B.RA, w: B.WA, h: B.HA, name: '完成',   role: '檔案進資料夾', sw: 2.6 },
  { id: 'PAUSED',      kind: 'st', cx: B.S4, y: B.RB, w: B.WA, h: B.HB, name: '暫停',   role: '可續傳' },
  { id: 'ENDS',        kind: 'st', cx: 866,  y: B.RB, w: 160,  h: B.HB, name: '失敗・取消・過期', role: '任一步出錯落到這' },
];
const byId2 = Object.fromEntries(n2.map((n) => [n.id, n]));
const e2s = [
  { id: 't1', from: 'PARSED',      to: 'PROBING',     pts: [[R(byId2.PARSED), CY(byId2.PARSED)], [L(byId2.PROBING) - GAP, CY(byId2.PARSED)]] },
  { id: 't3', from: 'PROBING',     to: 'READY',       pts: [[R(byId2.PROBING), CY(byId2.PROBING)], [L(byId2.READY) - GAP, CY(byId2.PROBING)]] },
  { id: 't6', from: 'READY',       to: 'DOWNLOADING', pts: [[R(byId2.READY), CY(byId2.READY)], [L(byId2.DOWNLOADING) - GAP, CY(byId2.READY)]] },
  { id: 't10', from: 'DOWNLOADING', to: 'COMPLETED',  pts: [[R(byId2.DOWNLOADING), CY(byId2.DOWNLOADING)], [L(byId2.COMPLETED) - GAP, CY(byId2.DOWNLOADING)]] },
  { id: 't11', from: 'DOWNLOADING', to: 'PAUSED',     pts: [[B.P_PAUSE_DN, Bt(byId2.DOWNLOADING)], [B.P_PAUSE_DN, T(byId2.PAUSED) - GAP]] },
  { id: 't13', from: 'PAUSED',     to: 'DOWNLOADING', pts: [[B.P_PAUSE_UP, T(byId2.PAUSED)], [B.P_PAUSE_UP, Bt(byId2.DOWNLOADING) + GAP]] },
  { id: 't5',  from: 'PROBING',    to: 'PAUSED', dashed: true,
    pts: [[B.P_CRASH, Bt(byId2.PROBING)], [B.P_CRASH, B.Y_CRASH], [L(byId2.PAUSED) - GAP, B.Y_CRASH]],
    label: { t: '當機重啟的安全落點——進行中的任務不會遺失', x: B.P_CRASH + 18, y: B.Y_CRASH - 7, anchor: 'start' } },
  { id: 'retry', from: 'ENDS',     to: 'PROBING',
    pts: [[866, Bt(byId2.ENDS)], [866, B.Y_RETRY], [B.P_RETRY, B.Y_RETRY], [B.P_RETRY, Bt(byId2.PROBING) + GAP]],
    label: { t: '重試——一律重新探測，保證拿到新鮮清單', x: 500, y: B.Y_RETRY - 6, anchor: 'middle' } },
];

// ---------- text width estimate (author-side R3 check; the browser measures for real) ----------
const RAMP = { t: 15, s: 11.5, lab: 11, mk: 14, lg: 11.5, ct: 12 };
function est(s, px, bold = false) {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0);
    if (c >= 0x2E80 || c === 0x30FB || c === 0x2192 || c === 0x2014) w += 1.0;
    else if (/[A-Z]/.test(ch)) w += 0.66;
    else if (/[a-z]/.test(ch)) w += 0.56;
    else if (/[0-9]/.test(ch)) w += 0.56;
    else if (ch === ' ') w += 0.28;
    else w += 0.36;
  }
  return w * px * (bold ? 1.04 : 1);
}
function innerW(n) { return n.kind === 'cap' ? n.w - 2 * (n.h / 2) - 4 : n.w - 16; }

// ---------- closing sweep as code (R10/R11 checklist) ----------
function sweep(tag, nodes, edges, conts, extraRects = []) {
  const P = [];
  const rect = (n) => ({ x: L(n), y: T(n), w: n.w, h: n.h });
  const rects = Object.fromEntries(nodes.map((n) => [n.id, rect(n)]));
  for (const c of conts) rects[c.id] = { x: c.x, y: c.y, w: c.w, h: c.h };
  const onBorder = (p, r) => {
    const [x, y] = p;
    const onV = (Math.abs(x - r.x) < 0.5 || Math.abs(x - (r.x + r.w)) < 0.5) && y >= r.y - 0.5 && y <= r.y + r.h + 0.5;
    const onH = (Math.abs(y - r.y) < 0.5 || Math.abs(y - (r.y + r.h)) < 0.5) && x >= r.x - 0.5 && x <= r.x + r.w + 0.5;
    return onV || onH;
  };
  const segs = [];
  for (const e of edges) {
    for (let i = 1; i < e.pts.length; i++) {
      const [x0, y0] = e.pts[i - 1], [x1, y1] = e.pts[i];
      const dx = x1 - x0, dy = y1 - y0;
      let kind;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) { P.push(`${tag}/${e.id} seg ${i} has zero length`); continue; }
      if (Math.abs(dx) < 0.5) kind = 'V'; else if (Math.abs(dy) < 0.5) kind = 'H';
      else {
        const ang = Math.atan2(Math.abs(dy), Math.abs(dx)) * 180 / Math.PI;
        if (ang < 30 || ang > 60) P.push(`${tag}/${e.id} seg ${i} is almost-straight (${ang.toFixed(1)}°) — R10 band`);
        kind = 'D';
      }
      segs.push({ e: e.id, i, x0, y0, x1, y1, kind });
    }
    // tails on the from-border (BUS = the bus line), heads a uniform GAP before the to-border
    const tail = e.pts[0], head = e.pts[e.pts.length - 1];
    if (e.from === 'BUS') { if (Math.abs(tail[1] - bus1.y) > 0.5) P.push(`${tag}/${e.id} tail not on the bus line`); }
    else if (!rects[e.from] || !onBorder(tail, rects[e.from])) P.push(`${tag}/${e.id} tail (${tail}) not on ${e.from}'s border`);
    const prev = e.pts[e.pts.length - 2];
    const ux = Math.sign(head[0] - prev[0]), uy = Math.sign(head[1] - prev[1]);
    const tip = [head[0] + ux * GAP, head[1] + uy * GAP];
    if (!rects[e.to] || !onBorder(tip, rects[e.to])) P.push(`${tag}/${e.id} head+GAP (${tip}) not on ${e.to}'s border — gap must be exactly ${GAP}`);
  }
  // parallel pairs: bundled (identical line) or >= MIN_SEP apart; identical lines are not declared here -> FAIL
  const overlap1 = (a0, a1, b0, b1) => Math.min(Math.max(a0, a1), Math.max(b0, b1)) - Math.max(Math.min(a0, a1), Math.min(b0, b1));
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) {
    const a = segs[i], b = segs[j];
    if (a.kind !== b.kind || a.kind === 'D') continue;
    if (a.kind === 'V' && Math.abs(a.x0 - b.x0) < MIN_SEP && overlap1(a.y0, a.y1, b.y0, b.y1) > 0)
      P.push(`${tag}/${a.e}~${b.e} parallel verticals ${Math.abs(a.x0 - b.x0)}px apart (x=${a.x0}/${b.x0})`);
    if (a.kind === 'H' && Math.abs(a.y0 - b.y0) < MIN_SEP && overlap1(a.x0, a.x1, b.x0, b.x1) > 0)
      P.push(`${tag}/${a.e}~${b.e} parallel horizontals ${Math.abs(a.y0 - b.y0)}px apart (y=${a.y0}/${b.y0})`);
  }
  // crossings between different edges (declared 0 on both figures)
  const cross = (a, b) => {
    const d = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
    const p1 = [a.x0, a.y0], p2 = [a.x1, a.y1], p3 = [b.x0, b.y0], p4 = [b.x1, b.y1];
    const d1 = d(p3, p4, p1), d2 = d(p3, p4, p2), d3 = d(p1, p2, p3), d4 = d(p1, p2, p4);
    return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
  };
  for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++)
    if (segs[i].e !== segs[j].e && cross(segs[i], segs[j])) P.push(`${tag}/${segs[i].e}×${segs[j].e} segments cross`);
  // segments through a node they do not touch
  for (const s of segs) for (const n of nodes) {
    if (s.e && edges.find((e) => e.id === s.e && (e.from === n.id || e.to === n.id))) continue;
    const r = rects[n.id];
    const xmin = Math.min(s.x0, s.x1), xmax = Math.max(s.x0, s.x1), ymin = Math.min(s.y0, s.y1), ymax = Math.max(s.y0, s.y1);
    if (xmax > r.x + 0.5 && xmin < r.x + r.w - 0.5 && ymax > r.y + 0.5 && ymin < r.y + r.h - 0.5) P.push(`${tag}/${s.e} passes through node ${n.id}`);
  }
  // node boxes: no overlap, neighbours >= MIN_SEP apart
  const all = nodes.map((n) => ({ id: n.id, ...rect(n) })).concat(extraRects);
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    const gx = Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w), gy = Math.max(a.y, b.y) - Math.min(a.y + a.h, b.y + b.h);
    if (gx < 0 && gy < 0) P.push(`${tag}/${a.id}∩${b.id} boxes overlap`);
    else if (Math.max(gx, gy) < MIN_SEP) P.push(`${tag}/${a.id}~${b.id} boxes only ${Math.max(gx, gy)}px apart`);
  }
  // author-side text fit (estimate; the browser pass measures glyphs)
  for (const n of nodes) {
    const iw = innerW(n);
    const wn = est(n.name, RAMP.t, true), wr = n.role ? est(n.role, RAMP.s) : 0;
    if (wn > iw) P.push(`${tag}/${n.id} name est ${wn.toFixed(0)}px > inner ${iw}px`);
    if (wr > iw) P.push(`${tag}/${n.id} role est ${wr.toFixed(0)}px > inner ${iw}px`);
  }
  return P;
}

// ---------- counts (R2) ----------
const nodesTotal = n1.length + n2.length, edgesTotal = e1.length + e2s.length;
const labelsTotal = e1.filter((e) => e.label).length + 1 + e2s.filter((e) => e.label).length;
console.log(`R2 count dial: ${nodesTotal} nodes / ${edgesTotal} connectors / ${labelsTotal} edge labels (target ${BUDGET.nodesTarget}/${BUDGET.edgesTarget}, ceiling ${BUDGET.nodesCeil}/${BUDGET.edgesCeil}); containers 1; fig1 ${n1.length}+${e1.length}, fig2 ${n2.length}+${e2s.length}`);
if (nodesTotal > BUDGET.nodesCeil || edgesTotal > BUDGET.edgesCeil) throw new Error('over the R2 ceiling — cut per R12, do not squeeze');
if (nodesTotal > BUDGET.nodesTarget || edgesTotal > BUDGET.edgesTarget) console.log('  WARN over the R2 target (under the ceiling)');

const problems = [
  ...sweep('fig1', n1, e1, cont1),
  ...sweep('fig2', n2, e2s, []),
];
// container must enclose exactly the row-3 capabilities with >= 16px inset, and nothing else
for (const n of n1) {
  const c = cont1[0], inside = L(n) >= c.x + 16 && R(n) <= c.x + c.w - 16 && T(n) >= c.y + 16 && Bt(n) <= c.y + c.h - 16;
  const shouldBe = ['DL', 'STK', 'TRX'].includes(n.id);
  if (inside !== shouldBe) problems.push(`fig1/${n.id} container membership wrong (inside=${inside})`);
}
// free-label clearance (estimate) vs every node box and every segment
{
  const labels = [...e1.filter((e) => e.label).map((e) => ({ ...e.label, tag: 'fig1', nodes: n1, edges: e1 })), { ...bus1.label, tag: 'fig1', nodes: n1, edges: e1 },
    ...e2s.filter((e) => e.label).map((e) => ({ ...e.label, tag: 'fig2', nodes: n2, edges: e2s }))];
  for (const lb of labels) {
    const w = est(lb.t, RAMP.lab), x0 = lb.anchor === 'middle' ? lb.x - w / 2 : lb.anchor === 'end' ? lb.x - w : lb.x;
    const box = { x: x0 - 4, y: lb.y - RAMP.lab - 4, w: w + 8, h: RAMP.lab + 8 };
    for (const n of lb.nodes) {
      const r = { x: L(n), y: T(n), w: n.w, h: n.h };
      if (box.x < r.x + r.w && box.x + box.w > r.x && box.y < r.y + r.h && box.y + box.h > r.y) problems.push(`${lb.tag} label「${lb.t}」overlaps node ${n.id}`);
    }
    for (const e of lb.edges) for (let i = 1; i < e.pts.length; i++) {
      const [ax, ay] = e.pts[i - 1], [bx, by] = e.pts[i];
      const xmin = Math.min(ax, bx), xmax = Math.max(ax, bx), ymin = Math.min(ay, by), ymax = Math.max(ay, by);
      if (xmax >= box.x && xmin <= box.x + box.w && ymax >= box.y && ymin <= box.y + box.h) problems.push(`${lb.tag} label「${lb.t}」touches edge ${e.id} (clearance < 4px)`);
    }
    if (box.x < 0 || box.x + box.w > 960) problems.push(`${lb.tag} label「${lb.t}」leaves the canvas`);
  }
}
if (problems.length) { console.error('R10/R11 SWEEP FAILED:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log('R10/R11 sweep: 0 problems (segments axis/elbow/diagonal, tails on borders, heads at GAP ' + GAP + ', parallels >= ' + MIN_SEP + 'px, 0 crossings, boxes >= ' + MIN_SEP + 'px, text estimates fit)');

// ---------- emit ----------
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FILL = { mod: ['var(--mod-f)', 'var(--mod-s)'], cap: ['var(--cap-f)', 'var(--cap-s)'], amb: ['var(--amb-f)', 'var(--amb-s)'], st: ['var(--st-f)', 'var(--st-s)'] };
function node(n) {
  const [f, s] = FILL[n.kind];
  const rx = n.kind === 'cap' ? n.h / 2 : n.kind === 'st' ? 14 : 4;
  const stroke = n.ov ? 'var(--ov)' : s, dash = n.ov ? ' stroke-dasharray="5 3"' : '';
  // baselines by node height: 15px name box ~ baseline-14.5..+4, 11.5px role box ~ baseline-11..+3 -> >= 3px apart
  const nameY = n.h >= 62 ? 26 : 22;
  const roleY = n.h >= 62 ? 46 : n.h >= 56 ? 41 : 40;
  let out = `<rect data-node="${n.id}" x="${L(n)}" y="${T(n)}" width="${n.w}" height="${n.h}" rx="${rx}" fill="${f}" stroke="${stroke}" stroke-width="${n.sw || 1.5}"${dash}/>\n`;
  out += `<text data-in="${n.id}" x="${n.cx}" y="${T(n) + nameY}" text-anchor="middle" class="t">${esc(n.name)}</text>\n`;
  if (n.role) out += `<text data-in="${n.id}" x="${n.cx}" y="${T(n) + roleY}" text-anchor="middle" class="s">${esc(n.role)}</text>\n`;
  if (n.mark) {
    const mx = n.kind === 'cap' ? R(n) - 26 : R(n) - 22, my = n.kind === 'cap' ? T(n) + 17 : T(n) + 18;
    out += `<text data-in="${n.id}" data-mark="1" x="${mx}" y="${my}" text-anchor="middle" class="mk" fill="var(--${n.mark.c})">${n.mark.t}</text>\n`;
  }
  return out;
}
function edge(e, marker) {
  const d = e.pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ',' + p[1]).join(' ');
  const dash = e.dashed ? ' stroke-dasharray="5 4"' : '';
  let out = `<path data-edge="${e.id}" d="${d}" stroke="var(--edge)" stroke-width="1.6" fill="none"${dash} marker-end="url(#${marker})"/>\n`;
  if (e.label) out += `<text data-free="1" x="${e.label.x}" y="${e.label.y}" text-anchor="${e.label.anchor}" class="lab">${esc(e.label.t)}</text>\n`;
  return out;
}
function svgOpen(id, w, h, title, desc) {
  return `<svg class="dia" data-view="${id}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="t-${id} d-${id}">\n<title id="t-${id}">${esc(title)}</title>\n<desc id="d-${id}">${esc(desc)}</desc>\n<g class="scene">\n`;
}
const marker = (id) => `<defs><marker id="${id}" markerWidth="9" markerHeight="8" refX="7.5" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="var(--edge)"/></marker></defs>\n`;

let fig1 = svgOpen('sys', 960, A.VBH, 'mfp 系統架構節點圖（擁有者視圖，第 3 版）', '兩個入口（桌面介面、指令列）共用一套核心能力：貼文下載、影格截圖堆疊、語音轉錄；下載經任務佇列排程，外部程式 Chrome、yt-dlp、ffmpeg、本機語音引擎；所有成品落在本機資料夾。') + marker('ar');
fig1 += `<!-- layout anchors (R11): ${JSON.stringify(A)} — every node centre and edge endpoint derives from these; edit a column, never a box -->\n`;
for (const c of cont1) {
  fig1 += `<rect data-container="${c.id}" x="${c.x}" y="${c.y}" width="${c.w}" height="${c.h}" rx="8" fill="none" stroke="var(--cap-s)" stroke-width="1.2" stroke-dasharray="6 4"/>\n`;
  fig1 += `<text data-free="1" x="${c.tx}" y="${c.ty}" text-anchor="middle" class="ct">${esc(c.title)}</text>\n`;
}
for (const n of n1) fig1 += node(n);
for (const e of e1) fig1 += edge(e, 'ar');
fig1 += `<line data-bus="1" x1="${bus1.x0}" y1="${bus1.y}" x2="${bus1.x1}" y2="${bus1.y}" stroke="var(--rule)" stroke-width="1.2"/>\n`;
fig1 += `<text data-free="1" x="${bus1.label.x}" y="${bus1.label.y}" text-anchor="middle" class="lab">${esc(bus1.label.t)}</text>\n`;
for (const g of legend1) {
  if (g.kind === 'arrow') fig1 += `<path d="M${g.x},${A.LEG + 8} L${g.x + 30},${A.LEG + 8}" stroke="var(--edge)" stroke-width="1.5" fill="none" marker-end="url(#ar)"/><text data-legend="1" x="${g.x + 38}" y="${A.LEG + 13}" class="lg">${esc(g.t)}</text>\n`;
  else {
    const [f, s] = g.kind === 'ov' ? ['var(--ov-f)', 'var(--ov)'] : FILL[g.kind];
    const rx = g.kind === 'cap' ? 8 : 3, dash = g.kind === 'ov' ? ' stroke-dasharray="4 3"' : '';
    fig1 += `<rect data-legend="1" x="${g.x}" y="${A.LEG}" width="26" height="16" rx="${rx}" fill="${f}" stroke="${s}" stroke-width="1.3"${dash}/><text data-legend="1" x="${g.x + 34}" y="${A.LEG + 13}" class="lg">${esc(g.t)}</text>\n`;
  }
}
fig1 += '</g>\n</svg>';

let fig2 = svgOpen('life', 960, B.VBH, '任務狀態簡化流程圖', '主線 收單→探測→就緒→下載中→完成；側態 暫停（可續傳）與 失敗・取消・過期；當機重啟落在暫停；重試一律回到探測。') + marker('ar2');
fig2 += `<!-- layout anchors (R11): ${JSON.stringify(B)} -->\n`;
for (const n of n2) fig2 += node(n);
for (const e of e2s) fig2 += edge(e, 'ar2');
fig2 += '</g>\n</svg>';

const mapRows = [
  ['桌面介面（GUI）', 'V1 APP（Electron＋React 六層）；V2 EM／RND／GUARD（loopback guard）', '—（回推的 SSE 事件 e4/p5 未畫：與操作邊同一對節點的反向流）'],
  ['指令列（CLI）', 'V1 CLI＋AGT（AI agent 讀 SKILL.md，e2）；V2 CLI2（同核心、無 queue）；MISC3（agent、brief 等）', '梯級 3：「AI 助手接口」（第 2 版獨立節點）併入本節點角色列。更正：第 2 版把它們畫成接 API——正本裡 AI 助手接 CLI（e2），CLI 直接呼叫核心（本頁指向虛線框＝V3 i1/i2 兩條邊的聚合）'],
  ['服務端窗口（API）', 'V2 API（routes ×5＋platform_gate）＋EVB（SSE）；V3 APP3／RTS3', '—（下載走 p6→queue；截圖 p13、轉錄 p15 直接派工——第 2 版誤畫成經佇列，本版更正）'],
  ['任務佇列——系統總管', 'V2 QUE（owner loop 單一寫者，D-42）＋WKP／WKT 兩條 worker lane；V3 QUE3', '梯級 3：「節奏控制」（第 2 版獨立節點；BUD3 budget governor＋probe/transfer 雙 lane，D-34/D-36）併入本節點角色列'],
  ['貼文下載', 'V3 PIP3＋adapters（BAS3／INS3 instagram ×5／YTD3）＋DL3＋INP3（inputs/naming）', '—（平台頁面 V1 PLT 以角色列的平台清單承載；媒體 CDN V1 CDN 未畫節點——第 2 版同）'],
  ['影格截圖堆疊 ②', 'V3 ST3（fan-in 4）＋routes_stack＋V2 SJ stack_jobs', '—（②＝缺口 G1 拆分觸發＋G6 --json 裁決）'],
  ['語音轉錄・翻譯・校正 ③', 'V5 TR5／TRL5／COR5／QUAL5／RUNS5／RTT5／RTA5／ASRM5／GLS5／RF5（branch，未驗收）', '梯級 3：「校正・詞彙表」（第 2 版獨立節點）併入；未驗收標記依 R4 合併保留（③）'],
  ['Chrome', 'V1 CHR／V2 CHR2（共享 session probe，不登入 D-2）', '—'],
  ['yt-dlp・ffmpeg ①', 'V1 BIN／V2 YD2＋FF2（gallery-dl 選配，doctor 四項之三）', '梯級 3：「ffmpeg」（第 2 版獨立節點）併入 yt-dlp 膠囊；①（G2 AI 配音軌缺陷）隨併。ffmpeg 亦供截圖使用，故截圖→本節點的邊保留（p14）'],
  ['本機語音引擎 ③', 'V1 VENV／V2 PY2（.asr-venv）＋V5 RUNNER5 asr/ 三腳本', '梯級 3：「模型資料夾」（V1 MH，第 2 版獨立節點）併入角色列；Hugging Face Hub（V1 HUB，模型下載來源）未畫節點——第 2 版同'],
  ['本機資料夾', 'V1 OUT／V2 OUT2（輸出根）＋V5 RF5（run folder）＋D-79 日誌（每日精簡＋錯誤整包）', '梯級 3：「下載資料夾」「執行紀錄」（第 2 版兩節點）併為一節點。匯流線＝e16/e17/p12/p16/d21 五條落地邊的聚合'],
  ['核心能力（虛線框）', 'V3 LD（領域服務）＋LT（文字子系統）兩層；V2 declared「CLI 對外 spawn 面與 serve 相同」', '—（框非節點；本版新增，用來承載指令列「直接呼叫、不經佇列」這一條邊）'],
  ['④ 自我健檢', 'V3 DOC3：doctor＋capabilities', '未畫節點（第 2 版同；以注記承載）'],
  ['圖 2 全部狀態與箭頭', 'LEGAL_TRANSITIONS 白名單的投影：主線 PARSED→PROBING→READY→DOWNLOADING→COMPLETED；側態 PAUSED／EXPIRED／FAILED／CANCELLED；崩潰恢復落 PAUSED（RESTART_RECOVERY）；重試一律回 PROBING（INV-5）', '「失敗・取消・過期」三態合一（第 2 版同）；未畫：7 條 →取消、就緒→過期、暫停→過期、就緒→重探、下載中→暫停以外的崩潰徑——完整集合由正本轉移矩陣承載'],
];
const mapTable = '<table><thead><tr><th>本頁節點</th><th>正本元素（憑據見正本聚合表）</th><th>裁切（R12 梯級）／未畫</th></tr></thead><tbody>'
  + mapRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('\n') + '</tbody></table>';

const html = `<!doctype html>
<html lang="zh-Hant" data-page-class="diagram">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>mfp 系統全貌 · 擁有者視圖 v3</title>
<style>
:root{
  --bg:#F6F5F2; --ink:#1C1B18; --muted:#6B675E; --rule:#DED9CF;
  --serif:"Source Serif 4","Songti TC",Georgia,serif;
  --sans:ui-sans-serif,system-ui,"Segoe UI","Microsoft JhengHei",sans-serif;
  --mono:ui-monospace,Consolas,monospace;
  /* diagram vocabulary inherited from the canonical audit page (R9) */
  --mod-f:#EAF1F9; --mod-s:#2E5FA3;          /* 藍＝程式元件 */
  --cap-f:#EDECE8; --cap-s:#6E6A61;          /* 灰膠囊＝外部程式 */
  --amb-f:#F7EDD8; --amb-s:#8A5A12;          /* 琥珀＝磁碟資料 */
  --st-f:#E9F3EC;  --st-s:#1E6B4F;           /* 綠＝任務狀態 */
  --ov:#C2620E;    --ov-f:#C2620E0D;         /* 橘虛框＝未驗收 */
  --edge:#4A4640; --bad:#9C3A22; --open:#3D5691;
}
@media (prefers-color-scheme:dark){
  :root{
    --bg:#14130F; --ink:#E8E5DE; --muted:#9A958A; --rule:#33302A;
    --mod-f:#1C2735; --mod-s:#7FA8E0;
    --cap-f:#242320; --cap-s:#8F8A80;
    --amb-f:#2C2415; --amb-s:#D9A24C;
    --st-f:#182A20;  --st-s:#5BBD93;
    --ov:#E0873B;    --ov-f:#E0873B12;
    --edge:#A49E93; --bad:#E07B5F; --open:#8FA3D9;
  }
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--serif);
  font-size:16.5px;line-height:1.75;-webkit-font-smoothing:antialiased}
/* diagram page class: the SVG scales to a centred container that is a share of the viewport
   (72vw, floored at the viewBox width, clamped at 1280) — never a fixed left-anchored cap */
main.wrap{width:min(100% - 44px, clamp(960px, 72vw, 1280px));margin:0 auto;padding:52px 0 90px}
h1{font-family:var(--sans);font-size:1.7rem;line-height:1.3;margin:0;letter-spacing:-.01em}
.sub{color:var(--muted);margin:6px 0 0}
.health{font-family:var(--sans);font-size:.9rem;margin:14px 0 0;padding:9px 0;
  border-top:1px solid var(--rule);border-bottom:1px solid var(--rule)}
.health i{font-style:normal;font-weight:700}
.health .ok{color:var(--st-s)} .health .bad{color:var(--bad)}
.health .open{color:var(--open)} .health .ov{color:var(--ov)}
figure{margin:30px 0 0}
figure svg{width:100%;height:auto;display:block}
figcaption{font-family:var(--sans);font-size:.82rem;color:var(--muted);margin-top:8px;line-height:1.6}
.notes{margin:14px 0 0;padding-left:0;list-style:none;display:grid;
  grid-template-columns:repeat(auto-fit,minmax(30ch,1fr));gap:.4em 2.4em}
.notes li{margin:0}
.notes b{font-family:var(--sans)}
.notes .m1{color:var(--bad)} .notes .m2{color:var(--open)}
.notes .m3{color:var(--ov)}
h2{font-family:var(--sans);font-size:1.15rem;margin:2.4em 0 .2em}
.prov{margin:34px 0 0;font-family:var(--sans);font-size:.8rem;color:var(--muted);
  line-height:1.65;border-top:1px solid var(--rule);padding-top:14px}
.prov a{color:inherit}
details{margin-top:8px}
summary{cursor:pointer;font-weight:600;color:var(--ink);font-size:.82rem}
table{border-collapse:collapse;width:100%;font-size:.8rem;margin-top:8px}
th,td{text-align:left;padding:5px 10px 5px 0;border-bottom:1px solid var(--rule);vertical-align:top}
th{font-size:.72rem;color:var(--muted);letter-spacing:.05em}
code{font-family:var(--mono);font-size:.92em}
/* svg type ramp — the owner-view size preset (carrier-playbook §Size presets); no inline sizes anywhere */
svg text{font-family:var(--sans);fill:var(--ink)}
svg .t{font-size:${RAMP.t}px;font-weight:700}
svg .s{font-size:${RAMP.s}px;fill:var(--muted);font-weight:400}
svg .lab{font-size:${RAMP.lab}px;fill:var(--muted)}
svg .mk{font-size:${RAMP.mk}px;font-weight:700}
svg .lg{font-size:${RAMP.lg}px;fill:var(--muted)}
svg .ct{font-size:${RAMP.ct}px;font-weight:700;fill:var(--muted)}
</style>
</head>
<body>
<main class="wrap" data-page-root>

<h1>media-fetch-pipeline（mfp）系統全貌</h1>
<p class="sub">一台電腦上的媒體收藏工具：貼上公開貼文連結 → 自動抓取影音 → 整理進你的資料夾</p>
<p class="health">本輪核對：<i class="ok">圖與程式一致（5 項全中）</i>　·　<i class="bad">已知缺陷 1（見 ①）</i>　·　<i class="open">等你裁決 2（見 ②）</i>　·　<i class="ov">語音新分支未驗收（見 ③）</i></p>

<figure>
${fig1}
<figcaption>圖 1──mfp 架構（擁有者視圖，第 3 版）：節點為聚合後的能力群，每條箭頭都對應正本裡實際存在的呼叫或資料流；顏色語意沿用工程正本。虛線框＝共用的核心能力——指令列的箭頭指向框，表示它直接呼叫框內任何一項、不經佇列；桌面介面則經服務端窗口派工，其中只有下載排隊。</figcaption>
</figure>

<ul class="notes">
<li><b class="m1">①　已知缺陷（未修）</b>：下載多語言 YouTube 影片時，可能選中 AI 配音軌而非原聲。成因已確認、修正未排上；修好前請抽聽開頭確認。</li>
<li><b class="m2">②　等你裁決（2 件）</b>：影格截圖堆疊已達到你當年設的拆分門檻（被 4 個模組使用）；另有 CLI 教學要不要納入 <code>--json</code> 用法。</li>
<li><b class="m3">③　橘色虛框＝未合併的新分支</b>：機器測試全綠，但 6 份人工驗收清單一份未跑——跑完才算可用。</li>
<li><b>④　自我健檢</b>：系統內建 doctor，會確認外部程式那一排是否裝齊可用（圖中未畫節點）。</li>
</ul>

<h2>一個任務的一生</h2>
<figure>
${fig2}
<figcaption>圖 2──任務狀態的簡化投影：只畫主線與安全側態。完整的合法轉移白名單（含此處略去的邊）由工程正本的轉移矩陣承載，以正本為準。</figcaption>
</figure>

<div class="prov">
受眾：擁有者／一般使用者（同規格受眾版 owner-view，<b>第 3 版</b>）。第 3 版＝用 2026-09-05 的新條文重畫：節點／連線預算（目標 ≤ 18 節點／≤ 24 連線，本頁 ${nodesTotal}／${edgesTotal}）、固定裁切順序（每一刀列在下表「裁切」欄）、字級階梯不縮字（960 寬預設；名稱 15、角色 11.5、標籤 11，最小 11）。第 2 版（2026-08-30，24 節點）保留於 <a href="mfp-audit-f3-owner-view.html"><code>mfp-audit-f3-owner-view.html</code></a> 供並排對照。<br>
工程正本：<a href="mfp-audit-f3.html"><code>mfp-audit-f3.html</code></a>——完整性主張（轉移矩陣、漂移表、缺口表、幾何自檢）由正本承載，本頁不承載、也不取代。<br>
基準：main <code>96e6673</code>＋feat/transcribe-audio（領先 70 commits 未合併）；正本產出 2026-08-29，本頁 2026-09-06。本頁投影的是正本當日的模型，<b>不是 mfp 今日的狀態</b>；正本重生後本頁需同步改版。<br>
更正：第 2 版畫了三條正本沒有的邊——指令列→服務端窗口、任務佇列→影格截圖、任務佇列→語音轉錄。正本裡指令列直接用同一套核心、不經佇列（V1 e2/e6/e9/e11/e13/e17；V2 CLI2），截圖與轉錄由服務端窗口直接派工（V2 p13/p15）。本版依此重畫。
<details><summary>聚合對照（本頁節點 → 正本元素 → 裁切）</summary>
${mapTable}
</details>
</div>

</main>
</body>
</html>
`;

// ---------- gates on the emitted text ----------
const a11y = a11yAsserts(html);
if (a11y.length) { console.error('A11Y FAILED:\n  ' + a11y.join('\n  ')); process.exit(1); }
if (/font-size\s*[:=]/.test(html.replace(/<style>[\s\S]*?<\/style>/, ''))) { console.error('inline font-size found outside the ramp'); process.exit(1); }
const sizes = [...html.matchAll(/svg \.\w+\{font-size:([\d.]+)px/g)].map((m) => +m[1]);
if (sizes.some((s) => s < 11)) { console.error('ramp below the 11px floor: ' + sizes); process.exit(1); }
fs.writeFileSync(OUT, html);
const sha = crypto.createHash('sha256').update(html).digest('hex');
console.log(`wrote ${path.basename(OUT)} (${html.length} bytes) sha256 ${sha}`);
console.log(`a11y: 2 svg.dia with title/desc; ramp px ${sizes.join('/')} (floor 11)`);
