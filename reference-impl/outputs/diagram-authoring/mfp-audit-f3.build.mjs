#!/usr/bin/env node
// Regeneration source for mfp-audit-f3.html — F3 audit-drawing round over
// media-fetch-pipeline. Structural models below ARE the diagrams; SVGs are
// projections. Re-render: node mfp-audit-f3.build.mjs
//
// F3 is the S1+S2 joint acceptance instrument (selfbuild-scope-eval §6):
// node positions are hand-authored (semantics, D-042); EVERY edge path and
// pill anchor comes from route() with the 'channel' provider — no hand pts.
// Measurement columns vs F1/F2 baselines live in
// outputs/diagram-authoring/mfp-audit-f3-measurement.md.
//
// Branch premise (checked 2026-08-29): main @ 96e6673 (post-brief merged),
// feat/transcribe-audio 70 commits ahead, NOT merged (six UAT documents
// unrun). Branch-only elements carry the overlay style + 未驗收 badge; the
// txd view's overlay flags are the delta source (stripOverlay = main state).
//
// Step 0 sources (every element traces to one of these, or carries [assumed]):
//   SK  = ~/.claude/skills/media-fetch-pipeline/SKILL.md (CLI contract)
//   CM  = <projects>/media-fetch-pipeline/CLAUDE.md (invariants + verify)
//   GL  = references/media-fetch-pipeline-context.md (domain glossary, by term)
//   PL  = references/media-fetch-pipeline-phase-log.md (phases X/Y/Z/Z2/Z3)
//   HR  = docs/review-2026-08-27-architecture-health.md (measured import graph)
//   IP  = AST import probe run this round (scratchpad/import-probe.py, 52 modules)
//   GR  = grep of "from mfp import ..." this round (file:line anchors)
//   QP  = src/mfp/queue.py L40-160 read this round (state tables)
//   GIT = git ls-tree main vs branch + log main..branch (70 commits)
//   LS  = directory listings (src/mfp, server/, adapters/, asr/, electron/, gui/src)

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../../tools/archdiag/index.mjs';
import { table } from '../../tools/archdiag/tables.mjs';
import { route, applyRoutes } from '../../tools/archdiag/route.mjs';
import { diffViews, stripOverlay, deltaTableRows } from '../../tools/archdiag/delta.mjs';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'mfp-audit-f3.html');

// ---------- structural models: 5 views (unrouted — router fills pts/pillAt) ----------
export const views = [];

// ===== V1: C4-L1 system context =====
views.push({
  id: 'l1', title: 'C4-L1 系統情境', vb: [1280, 720], declaredCrossings: 0,
  subtitle: '問題：mfp 由哪些可執行體構成、對外碰什麼、什麼永不跨界。三條邊界不變式：不登入（D-2，Cookie 不入 carried headers）、probe 費 budget／transfer 不費（D-34）、caption 是 untrusted 資料非指令（INV-B6）。',
  nodes: [
    { id: 'USR', kind: 'ext',   x: 48,   y: 64,  w: 176, h: 56, t: '使用者', ev: 'SK/CM' },
    { id: 'AGT', kind: 'ext',   x: 48,   y: 496, w: 176, h: 56, t: 'AI agent（讀 SKILL.md）', ev: 'GL:agent surface' },
    { id: 'APP', kind: 'block', x: 336,  y: 64,  w: 256, h: 80, t: '桌面應用 Electron＋React', l: ['gui/ FSD 六層＋electron/'], ev: 'LS:gui/src,electron' },
    { id: 'SRV', kind: 'block', x: 336,  y: 240, w: 256, h: 96, t: 'mfp-sidecar.exe serve', l: ['/v1 loopback＋雙 worker 線'], ev: 'SK:392-395; LS:server/' },
    { id: 'CLI', kind: 'block', x: 336,  y: 496, w: 256, h: 80, t: 'mfp.exe CLI', l: ['verbs ×15，stdout＝機器'], ev: 'SK; CM:stdout 不變式' },
    { id: 'CHR', kind: 'ext',   x: 720,  y: 64,  w: 208, h: 64, t: 'Chrome（真瀏覽器）', l: ['取 HTML，不渲染'], ev: 'GL:script JSON' },
    { id: 'PLT', kind: 'ext',   x: 1008, y: 64,  w: 224, h: 72, t: '平台頁面', l: ['IG/Threads/YT/X/Bili'], ev: 'SK:15-18' },
    { id: 'BIN', kind: 'ext',   x: 720,  y: 208, w: 208, h: 64, t: 'yt-dlp／gallery-dl／ffmpeg', ev: 'SK:doctor; GL:version floor' },
    { id: 'CDN', kind: 'ext',   x: 1008, y: 208, w: 224, h: 64, t: '媒體 CDN', l: ['fbcdn/googlevideo/Bili 鏡像'], ev: 'GL:fetch/mirror rotation' },
    { id: 'OUT', kind: 'store', x: 1008, y: 344, w: 224, h: 64, t: '輸出根 output root', l: ['post dirs＋run folders'], ev: 'GL:post directory/分析資料夾' },
    { id: 'HUB', kind: 'ext',   x: 1008, y: 456, w: 224, h: 56, t: 'Hugging Face Hub', ev: 'PL:Y fetch_model' },
    { id: 'VENV', kind: 'ext',  x: 720,  y: 560, w: 208, h: 72, t: '引擎環境 .asr-venv', l: ['faster-whisper/CTranslate2'], ev: 'GL:engine environment' },
    { id: 'MH',  kind: 'store', x: 1008, y: 560, w: 224, h: 56, t: '模型資料夾 model home', ev: 'GL:model home' },
  ],
  edges: [
    { id: 'e1',  type: 'call',   from: 'USR', to: 'APP',  pill: '操作', ev: 'SK/CM' },
    { id: 'e2',  type: 'call',   from: 'AGT', to: 'CLI',  pill: 'verbs（--json）', ev: 'SK:33-55' },
    { id: 'e3',  type: 'call',   from: 'APP', to: 'SRV',  pill: 'spawn＋/v1', ev: 'LS:electron/sidecar.ts' },
    { id: 'e4',  type: 'proto',  from: 'SRV', to: 'APP',  pill: 'SSE 事件', ev: 'GL:coalesce_key' },
    { id: 'e5',  type: 'egress', from: 'SRV', to: 'CHR',  pill: 'probe（共享 session）', ev: 'GL:shared browser session' },
    { id: 'e6',  type: 'egress', from: 'CLI', to: 'CHR',  pill: 'probe（單次）', ev: 'GL:shared browser session' },
    { id: 'e7',  type: 'egress', from: 'CHR', to: 'PLT',  pill: '載貼文頁（費 budget）', ev: 'GL:probe/budget governor' },
    { id: 'e8',  type: 'egress', from: 'SRV', to: 'CDN',  pill: 'httpx 傳輸（不費 budget）', ev: 'GL:fetch; CM:D-34' },
    { id: 'e9',  type: 'egress', from: 'CLI', to: 'CDN',  pill: '傳輸', ev: 'GL:fetch' },
    { id: 'e10', type: 'call',   from: 'SRV', to: 'BIN',  pill: 'spawn（5 spawn sites）', ev: 'GL:spawn site' },
    { id: 'e11', type: 'call',   from: 'CLI', to: 'BIN',  pill: 'spawn', ev: 'GL:spawn site' },
    { id: 'e12', type: 'call',   from: 'SRV', to: 'VENV', pill: '辨識/翻譯 stdio JSON', ev: 'GR:routes_asr:213; PL:Y' },
    { id: 'e13', type: 'call',   from: 'CLI', to: 'VENV', pill: 'stdio JSON', ev: 'GR:cli:785' },
    { id: 'e14', type: 'egress', from: 'VENV', to: 'HUB', pill: 'fetch_model 下載', ev: 'PL:Y; LS:asr/fetch_model.py' },
    { id: 'e15', type: 'data',   from: 'VENV', to: 'MH',  pill: '載模型（依 kind）', ev: 'GL:model home/kind' },
    { id: 'e16', type: 'data',   from: 'SRV', to: 'OUT',  pill: '檔案落地', ev: 'GL:post directory' },
    { id: 'e17', type: 'data',   from: 'CLI', to: 'OUT',  pill: '檔案落地', ev: 'GL:post directory' },
  ],
  declared: [
    '不登入（D-2）：憑證/Cookie 不存在於任何邊——這是缺席宣告，不畫 absent 邊（無自然錨點）',
    'GUI 檔案顯示（reveal.ts 選取檔案）併入 e1 聚合，未單畫',
    'agent-register 寫入他人 AGENTS.md 的邊（可逆、選擇性）未畫——見缺口 G8',
    '交叉數 0/宣告 0',
  ],
});

// ===== V2: processes & channels =====
views.push({
  id: 'l2p', title: '進程與通道', vb: [1280, 736], declaredCrossings: 0,
  subtitle: '問題：哪些進程在跑、誰 spawn 誰、queue 為何不用鎖。答案的核心是 dispatch seam：queue 只有 owner loop 一個寫者，worker 做 IO 後把結果 post 回來（D-42）；probe lane 受 budget governor 節奏、transfer lane 一次一傳輸（D-36）——D-62 之前兩者同線，下載要等別列的解析。',
  containers: [
    { id: 'CE', x: 48,  y: 64, w: 368, h: 256, title: '桌面應用（Electron 兩進程）' },
    { id: 'CS', x: 488, y: 64, w: 744, h: 384, title: 'mfp-sidecar.exe serve（單一 queue 寫者）' },
  ],
  nodes: [
    { id: 'EM',  kind: 'block', x: 72,   y: 96,  w: 320, h: 72, t: 'electron main.ts', l: ['spawn＋containment/focus/reveal'], ev: 'LS:electron/' },
    { id: 'RND', kind: 'block', x: 72,   y: 208, w: 320, h: 80, t: 'renderer（React FSD）', l: ['app/pages/widgets/features/entities/shared'], ev: 'LS:gui/src' },
    { id: 'GUARD', kind: 'port', x: 512, y: 96,  w: 168, h: 64, t: 'loopback guard', l: ['Host/Origin/Sec-Fetch-Site'], ev: 'GL:loopback guard' },
    { id: 'API', kind: 'block', x: 720,  y: 96,  w: 232, h: 72, t: 'server.app /v1', l: ['routes ×5＋platform_gate'], ev: 'LS:server/; IP:fan-out 11' },
    { id: 'EVB', kind: 'block', x: 992,  y: 96,  w: 216, h: 64, t: 'EventBroadcaster', l: ['coalesce_key：意義不節流'], ev: 'GL:coalesce_key' },
    { id: 'QUE', kind: 'store', x: 720,  y: 224, w: 232, h: 64, t: 'queue（tasks）', l: ['owner loop 單一寫者'], ev: 'GL:dispatch seam; QP' },
    { id: 'WKP', kind: 'block', x: 512,  y: 344, w: 208, h: 80, t: 'probe lane worker', l: ['budget governor 節奏'], ev: 'GL:probe lane' },
    { id: 'WKT', kind: 'block', x: 752,  y: 344, w: 208, h: 80, t: 'transfer lane worker', l: ['一次一傳輸（D-36）'], ev: 'GL:transfer lane' },
    { id: 'SJ',  kind: 'block', x: 992,  y: 344, w: 216, h: 64, t: 'stack_jobs（in-mem）', ev: 'GL:stack job' },
    { id: 'CLI2', kind: 'block', x: 48,  y: 376, w: 368, h: 64, t: 'mfp.exe CLI（同核心、無 queue）', ev: 'SK; IP' },
    { id: 'OUT2', kind: 'store', x: 48,  y: 496, w: 368, h: 64, t: '輸出根', ev: 'GL:post directory' },
    { id: 'CHR2', kind: 'ext',  x: 488,  y: 560, w: 176, h: 64, t: 'Chrome', ev: 'GL:shared browser session' },
    { id: 'YD2', kind: 'ext',   x: 696,  y: 560, w: 144, h: 64, t: 'yt-dlp', ev: 'GL:strategy rung' },
    { id: 'FF2', kind: 'ext',   x: 872,  y: 560, w: 144, h: 64, t: 'ffmpeg', ev: 'GL:intermediate' },
    { id: 'PY2', kind: 'ext',   x: 1048, y: 560, w: 184, h: 72, t: '引擎環境 python', l: ['stdio JSON，腳本 ×3'], ev: 'LS:asr/; GL:spawn site' },
  ],
  edges: [
    { id: 'p1',  type: 'call',  from: 'RND', to: 'EM',   pill: 'IPC（contracts.ts）', ev: 'LS:electron/preload.cts' },
    { id: 'p2',  type: 'call',  from: 'EM',  to: 'CS',   pill: 'spawn serve＋stdin EOF 看門', ev: 'LS:electron/sidecar.ts; GL:spawn site D-53' },
    { id: 'p3',  type: 'call',  from: 'RND', to: 'GUARD', pill: 'HTTP /v1', ev: 'GL:loopback guard' },
    { id: 'p4',  type: 'call',  from: 'GUARD', to: 'API', pill: '驗過才進', ev: 'GL:loopback guard' },
    { id: 'p5',  type: 'proto', from: 'EVB', to: 'RND',  pill: 'SSE（進度可節流）', ev: 'GL:coalesce_key' },
    { id: 'p6',  type: 'call',  from: 'API', to: 'QUE',  pill: 'ACTIONS：intent→轉移', ev: 'QP:L87-123' },
    { id: 'p7',  type: 'data',  from: 'WKP', to: 'QUE',  pill: 'dispatch 回寫', ev: 'GL:dispatch seam' },
    { id: 'p8',  type: 'data',  from: 'WKT', to: 'QUE',  pill: 'dispatch 回寫', ev: 'GL:dispatch seam' },
    { id: 'p9',  type: 'egress', from: 'WKP', to: 'CHR2', pill: '共享 session probe', ev: 'GL:shared browser session' },
    { id: 'p10', type: 'call',  from: 'WKP', to: 'YD2',  pill: 'rung（每 rung 費一格）', ev: 'GL:strategy rung' },
    { id: 'p11', type: 'call',  from: 'WKT', to: 'FF2',  pill: 'mux（.v/.a→成品）', ev: 'GL:intermediate' },
    { id: 'p12', type: 'data',  from: 'WKT', to: 'OUT2', pill: '.part→os.replace', ev: 'GL:.part sidecar' },
    { id: 'p13', type: 'call',  from: 'API', to: 'SJ',   pill: '/v1/stack jobs', ev: 'GL:stack job' },
    { id: 'p14', type: 'call',  from: 'SJ',  to: 'FF2',  pill: '抽幀/libass', ev: 'GL:hard path/soft path' },
    { id: 'p15', type: 'call',  from: 'API', to: 'PY2',  pill: '辨識/翻譯 spawn', ev: 'GR:routes_asr:213' },
    { id: 'p16', type: 'data',  from: 'CLI2', to: 'OUT2', pill: '直寫', ev: 'GL:post directory' },
  ],
  declared: [
    'CLI 對外 spawn 面（Chrome/yt-dlp/ffmpeg/引擎）與 serve 相同，V1 已畫——本圖不重複',
    'events.stale 看門（client 端 ping watchdog）屬 GUI 內部，未畫',
    '交叉數 0/宣告 0',
  ],
});

// ===== V3: measured import layering =====
views.push({
  id: 'l3i', title: '匯入分層（量測）', vb: [1280, 760], declaredCrossings: 0,
  subtitle: '問題：52 個 Python 模組的依賴是否全部指向葉、有無反向邊。答案由本輪 AST 探針量測（非閱讀直覺）：module-scope cycle 0、core→server/cli 邊 0；葉的 fan-in：errors 28／models 20／config 14。橘虛框＝branch-only 模組（feat/transcribe-audio）。',
  containers: [
    { id: 'LE', x: 48, y: 64,  w: 1184, h: 88,  title: '入口層' },
    { id: 'LS2', x: 48, y: 184, w: 1184, h: 96, title: 'server 層' },
    { id: 'LC', x: 48, y: 312, w: 560,  h: 80,  title: '協調層' },
    { id: 'LA', x: 632, y: 312, w: 600,  h: 80,  title: 'adapters' },
    { id: 'LD', x: 48, y: 424, w: 1184, h: 80,  title: '領域服務' },
    { id: 'LT', x: 48, y: 536, w: 1184, h: 144, title: '文字子系統（Phase X–Z3 弧）' },
  ],
  nodes: [
    { id: 'CLI3', kind: 'block', x: 72,  y: 88,  w: 224, h: 56, t: 'cli.py', l: ['deferred 匯入 ×13'], ev: 'IP' },
    { id: 'SRV3', kind: 'block', x: 328, y: 88,  w: 224, h: 56, t: 'serve.py＋sidecar.py', ev: 'IP' },
    { id: 'APP3', kind: 'block', x: 72,  y: 208, w: 208, h: 64, t: 'server.app', l: ['fan-out 11'], ev: 'IP' },
    { id: 'RTS3', kind: 'block', x: 312, y: 208, w: 224, h: 64, t: 'routes ×5＋platform_gate', ev: 'LS:server/' },
    { id: 'WKR3', kind: 'block', x: 568, y: 208, w: 208, h: 64, t: 'server.worker', l: ['fan-out 9'], ev: 'IP' },
    { id: 'EVS3', kind: 'block', x: 808, y: 208, w: 232, h: 64, t: 'events＋security＋stack_jobs', ev: 'LS:server/' },
    { id: 'PIP3', kind: 'block', x: 72,  y: 336, w: 224, h: 56, t: 'pipeline', l: ['fan-out 8'], ev: 'IP' },
    { id: 'QUE3', kind: 'block', x: 328, y: 336, w: 224, h: 56, t: 'queue（狀態機）', ev: 'QP' },
    { id: 'BAS3', kind: 'block', x: 656, y: 336, w: 160, h: 56, t: 'base', ev: 'IP' },
    { id: 'INS3', kind: 'block', x: 832, y: 336, w: 192, h: 56, t: 'instagram ×5', l: ['fan-out 11'], ev: 'IP; LS:adapters/instagram' },
    { id: 'YTD3', kind: 'block', x: 1048, y: 336, w: 160, h: 56, t: 'ytdlp', ev: 'IP' },
    { id: 'DL3',  kind: 'block', x: 72,  y: 448, w: 192, h: 56, t: 'download', ev: 'IP' },
    { id: 'BUD3', kind: 'block', x: 288, y: 448, w: 168, h: 56, t: 'budget＋policy', ev: 'IP' },
    { id: 'INP3', kind: 'block', x: 480, y: 448, w: 192, h: 56, t: 'inputs＋naming', ev: 'IP' },
    { id: 'DOC3', kind: 'block', x: 696, y: 448, w: 232, h: 56, t: 'doctor＋capabilities', ev: 'IP' },
    { id: 'MISC3', kind: 'block', x: 952, y: 448, w: 256, h: 56, t: 'logs／redact／capture／agent…', ev: 'LS:src/mfp' },
    { id: 'ST3',  kind: 'block', x: 72,  y: 560, w: 176, h: 56, t: 'stack', l: ['fan-in 4＝拆分觸發'], ev: 'IP; HR:§3.4' },
    { id: 'TR3',  kind: 'block', x: 288, y: 560, w: 176, h: 56, t: 'transcript', ev: 'IP' },
    { id: 'ASR3', kind: 'block', ov: true, x: 504, y: 560, w: 176, h: 56, t: 'asr', ev: 'GIT; IP' },
    { id: 'ASRM3', kind: 'block', ov: true, x: 720, y: 560, w: 176, h: 56, t: 'asr_models', ev: 'GIT; IP' },
    { id: 'QUAL3', kind: 'block', ov: true, x: 936, y: 560, w: 176, h: 56, t: 'quality（純）', ev: 'GIT; PL:X D-109' },
    { id: 'TRL3', kind: 'block', ov: true, x: 288, y: 640, w: 176, h: 48, t: 'translate', ev: 'GIT; IP' },
    { id: 'COR3', kind: 'block', ov: true, x: 504, y: 640, w: 176, h: 48, t: 'correct', ev: 'GIT; IP' },
    { id: 'RUNS3', kind: 'block', ov: true, x: 720, y: 640, w: 176, h: 48, t: 'runs', ev: 'GIT; GR' },
    { id: 'ERR3', kind: 'block', x: 200, y: 704, w: 256, h: 48, t: 'errors（fan-in 28）', ev: 'IP' },
    { id: 'MOD3', kind: 'block', x: 536, y: 704, w: 256, h: 48, t: 'models（fan-in 20）', ev: 'IP' },
    { id: 'CFG3', kind: 'block', x: 872, y: 704, w: 256, h: 48, t: 'config（fan-in 14）', ev: 'IP' },
  ],
  edges: [
    { id: 'i1',  type: 'call', from: 'CLI3', to: 'LD',   pill: 'deferred ×8', ev: 'IP' },
    { id: 'i2',  type: 'call', from: 'CLI3', to: 'LT',   pill: 'verbs→文字 ×6', ev: 'IP; GR:cli' },
    { id: 'i3',  type: 'call', from: 'SRV3', to: 'LS2',  pill: 'app/worker/events', ev: 'IP' },
    { id: 'i4',  type: 'call', from: 'APP3', to: 'RTS3', pill: 'include', ev: 'IP' },
    { id: 'i5',  type: 'call', from: 'RTS3', to: 'LT',   pill: 'stack/transcript/asr/correct', ev: 'IP; GR:routes' },
    { id: 'i6',  type: 'call', from: 'APP3', to: 'QUE3', pill: 'actions', ev: 'IP' },
    { id: 'i7',  type: 'call', from: 'WKR3', to: 'PIP3', ev: 'IP' },
    { id: 'i8',  type: 'data', from: 'WKR3', to: 'QUE3', pill: 'dispatch 回寫', ev: 'IP; GL:dispatch seam' },
    { id: 'i9',  type: 'call', from: 'PIP3', to: 'LA',   pill: 'strategy 鏈', ev: 'IP' },
    { id: 'i10', type: 'call', from: 'PIP3', to: 'LD',   pill: 'download/budget/policy', ev: 'IP' },
    { id: 'i11', type: 'call', from: 'BAS3', to: 'LD',   ev: 'IP' },
    { id: 'i12', type: 'call', from: 'TR3',  to: 'ST3',  pill: 'caption 機械', ev: 'IP' },
    { id: 'i13', type: 'call', from: 'TRL3', to: 'ST3',  pill: '第 4 個消費者', ev: 'IP' },
    { id: 'i14', type: 'call', from: 'EVS3', to: 'ST3',  pill: 'stack_jobs→stack', ev: 'IP' },
  ],
  declared: [
    '全樹→葉（errors/models/config）的邊以 fan-in 數字承載，不畫（20+ 條平行邊零資訊）',
    '文字子系統內其餘邊見 V5（一題一圖）',
    'core→server/cli 反向邊：量測 0（IP）——與 HR §零 一致',
    '交叉數 0/宣告 0',
  ],
});

// ===== V4: Task lifecycle state machine =====
views.push({
  id: 'tsm', title: 'Task 生命週期狀態機', vb: [1280, 640], declaredCrossings: 2,
  subtitle: '問題：一個任務可處於哪些狀態、崩潰後落在哪。LEGAL_TRANSITIONS 是白名單（不在表上＝拒絕）；完整性由下方轉移矩陣承載——本圖略畫 7 條 →CANCELLED 邊（宣告見矩陣），紫虛線＝RESTART_RECOVERY（崩潰恢復，非動作）。INV-5：COMPLETED 唯一出路是 retry 且必重 probe。',
  nodes: [
    { id: 'PARSED',      kind: 'state',  x: 72,   y: 288, w: 168, h: 56, t: 'PARSED', ev: 'QP:L40' },
    { id: 'PROBING',     kind: 'state',  x: 312,  y: 160, w: 168, h: 56, t: 'PROBING', ev: 'QP:L62' },
    { id: 'READY',       kind: 'state',  x: 552,  y: 160, w: 168, h: 56, t: 'READY', ev: 'QP:L63' },
    { id: 'DOWNLOADING', kind: 'state',  x: 792,  y: 160, w: 168, h: 56, t: 'DOWNLOADING', ev: 'QP:L64' },
    { id: 'COMPLETED',   kind: 'stateT', x: 1040, y: 160, w: 168, h: 56, t: 'COMPLETED', ev: 'QP:L49' },
    { id: 'EXPIRED',     kind: 'state',  x: 552,  y: 320, w: 168, h: 56, t: 'EXPIRED', ev: 'QP:L67' },
    { id: 'PAUSED',      kind: 'state',  x: 792,  y: 320, w: 168, h: 56, t: 'PAUSED', ev: 'QP:L65' },
    { id: 'FAILED',      kind: 'stateT', x: 312,  y: 464, w: 168, h: 56, t: 'FAILED', ev: 'QP:L49' },
    { id: 'CANCELLED',   kind: 'stateT', x: 792,  y: 464, w: 168, h: 56, t: 'CANCELLED', ev: 'QP:L49' },
  ],
  init: { at: [24, 316], to: [72, 316] },
  edges: [
    { id: 't1',  type: 'trans', from: 'PARSED',      to: 'PROBING',     pill: 'probe/start', ev: 'QP:L55' },
    { id: 't2',  type: 'trans', from: 'PARSED',      to: 'FAILED',      ev: 'QP:L55' },
    { id: 't3',  type: 'trans', from: 'PROBING',     to: 'READY',       pill: 'manifest 到手', ev: 'QP:L62' },
    { id: 't4',  type: 'trans', from: 'PROBING',     to: 'FAILED',      ev: 'QP:L62' },
    { id: 't5',  type: 'eps',   from: 'PROBING',     to: 'PAUSED',      pill: '崩潰恢復（僅此徑）', ev: 'QP:L56-62,145-148' },
    { id: 't6',  type: 'trans', from: 'READY',       to: 'DOWNLOADING', pill: 'start', ev: 'QP:L63' },
    { id: 't7',  type: 'trans', from: 'READY',       to: 'EXPIRED',     pill: '簽章 TTL 到期', ev: 'QP:L63; GL:expiresAt' },
    { id: 't8',  type: 'trans', from: 'READY',       to: 'PROBING',     pill: 're-probe', ev: 'QP:L63' },
    { id: 't9',  type: 'trans', from: 'READY',       to: 'FAILED',      ev: 'QP:L63' },
    { id: 't10', type: 'trans', from: 'DOWNLOADING', to: 'COMPLETED',   ev: 'QP:L64' },
    { id: 't11', type: 'trans', from: 'DOWNLOADING', to: 'PAUSED',      pill: 'pause（崩潰同落點）', ev: 'QP:L64,145-148' },
    { id: 't12', type: 'trans', from: 'DOWNLOADING', to: 'FAILED',      ev: 'QP:L64' },
    { id: 't13', type: 'trans', from: 'PAUSED',      to: 'DOWNLOADING', pill: 'start（.part 續傳）', ev: 'QP:L65; GL:.part sidecar' },
    { id: 't14', type: 'trans', from: 'PAUSED',      to: 'EXPIRED',     ev: 'QP:L65' },
    { id: 't15', type: 'trans', from: 'PAUSED',      to: 'FAILED',      ev: 'QP:L65' },
    { id: 't16', type: 'trans', from: 'EXPIRED',     to: 'PROBING',     pill: 'O-5：重 probe 不問人', ev: 'QP:L66-67' },
    { id: 't17', type: 'trans', from: 'COMPLETED',   to: 'PROBING',     pill: 'retry（INV-5）', ev: 'QP:L68-70' },
    { id: 't18', type: 'trans', from: 'FAILED',      to: 'PROBING',     pill: 'retry', ev: 'QP:L71' },
    { id: 't19', type: 'trans', from: 'CANCELLED',   to: 'PROBING',     pill: 'retry', ev: 'QP:L72' },
  ],
  declared: [
    '7 條 →CANCELLED 邊（自 PARSED/PROBING/READY/DOWNLOADING/PAUSED/EXPIRED/FAILED）略畫——完整集合見轉移矩陣；CANCELLED 的入邊畫齊會吃掉整張圖的走廊',
    'RESTART_RECOVERY 兩列（PROBING→PAUSED、DOWNLOADING→PAUSED）每列都是 LEGAL 邊——test_queue.py 斷言（QP:L132）',
    '交叉數 ≤2/宣告 2',
  ],
});

// ===== V5: text-analysis subsystem + branch delta =====
views.push({
  id: 'txd', title: '文字子系統＋branch 疊層', vb: [1280, 640], declaredCrossings: 1,
  subtitle: '問題：feat/transcribe-audio（70 commits）在 main 之上加了什麼、多少過了人工驗收。橘虛框＝branch-only＝未驗收（六份 UAT 文件未跑）。本視圖的 overlay 旗標即 delta 來源：stripOverlay(本圖)＝main 狀態，差分表由 delta.mjs 生成（B-9 自動化）。',
  nodes: [
    { id: 'CLI5',  kind: 'block', x: 48,  y: 64,  w: 192, h: 72, t: 'cli verbs', l: ['transcript/translate/correct'], ev: 'GR:cli:785,861,2124' },
    { id: 'RTT5',  kind: 'block', x: 48,  y: 192, w: 192, h: 72, t: 'routes_transcript', l: ['＋correct/glossary 端點'], ev: 'GR:routes_transcript:23,303,363' },
    { id: 'RTA5',  kind: 'block', ov: true, x: 48, y: 320, w: 192, h: 56, t: 'routes_asr', ev: 'GIT; GR:routes_asr:33' },
    { id: 'TR5',   kind: 'block', x: 320, y: 64,  w: 208, h: 72, t: 'transcript.py', l: ['4 種輸入形＋kind'], ev: 'SK:277-332; GR:transcript:33' },
    { id: 'ST5',   kind: 'block', x: 320, y: 192, w: 208, h: 72, t: 'stack.py', l: ['caption 機械，fan-in 4'], ev: 'IP; HR:§3.4' },
    { id: 'ASR5',  kind: 'block', ov: true, x: 320, y: 320, w: 208, h: 72, t: 'asr.py', l: ['_LADDER 兩梯＋run_sidecar'], ev: 'GIT; PL:Y D-112' },
    { id: 'ASRM5', kind: 'block', ov: true, x: 320, y: 456, w: 208, h: 64, t: 'asr_models.py', l: ['readiness 裁判＋CATALOGUE'], ev: 'GIT; PL:Z2' },
    { id: 'TRL5',  kind: 'block', ov: true, x: 608, y: 64,  w: 192, h: 64, t: 'translate.py（NLLB）', ev: 'GIT; GL:FLORES-200' },
    { id: 'COR5',  kind: 'block', ov: true, x: 608, y: 192, w: 192, h: 64, t: 'correct.py', l: ['兩道閘＋白名單'], ev: 'GIT; PL:Z D-116/117' },
    { id: 'QUAL5', kind: 'block', ov: true, x: 608, y: 320, w: 192, h: 64, t: 'quality.py', l: ['檢查 8＋，純・僅回報'], ev: 'GIT; PL:X D-109' },
    { id: 'RUNS5', kind: 'block', ov: true, x: 608, y: 456, w: 192, h: 56, t: 'runs.py（分析資料夾）', ev: 'GIT; PL:Z3 D-122' },
    { id: 'CONF5', kind: 'ext',  ov: true, x: 880, y: 64,  w: 208, h: 72, t: 'tests/conformance', l: ['知道說了什麼（9 案）'], ev: 'CM:Verify; PL:X D-110' },
    { id: 'GLS5',  kind: 'store', ov: true, x: 880, y: 192, w: 208, h: 56, t: '_glossary.json（白名單）', ev: 'GL:詞庫' },
    { id: 'RUNNER5', kind: 'ext', ov: true, x: 880, y: 320, w: 208, h: 80, t: 'asr/ 腳本 ×3', l: ['runner/translate_runner/fetch_model'], ev: 'LS:asr/' },
    { id: 'RF5',   kind: 'store', ov: true, x: 880, y: 456, w: 208, h: 64, t: 'run folder', l: ['字幕檔/文字檔/_source.json'], ev: 'GL:分析資料夾' },
  ],
  edges: [
    { id: 'd1',  type: 'call',   from: 'CLI5', to: 'TR5',    pill: 'mfp transcript', ev: 'GR:cli:2124' },
    { id: 'd2',  type: 'call',   from: 'CLI5', to: 'TRL5',   pill: 'mfp translate', ev: 'GR:cli:785' },
    { id: 'd3',  type: 'call',   from: 'CLI5', to: 'COR5',   pill: 'mfp correct', ev: 'GR:cli:861' },
    { id: 'd4',  type: 'call',   from: 'RTT5', to: 'TR5',    ev: 'GR:routes_transcript:23' },
    { id: 'd5',  type: 'call',   from: 'RTT5', to: 'COR5',   pill: ':propose/:apply', ev: 'GR:routes_transcript:363' },
    { id: 'd6',  type: 'call',   from: 'RTA5', to: 'ASRM5',  pill: 'readiness', ev: 'GR:routes_asr:33' },
    { id: 'd7',  type: 'call',   from: 'RTA5', to: 'ASR5',   ev: 'GR:routes_asr:213' },
    { id: 'd8',  type: 'call',   from: 'TR5',  to: 'ST5',    pill: 'caption_cues/is_rolling', ev: 'IP; PL:Z3 P-59' },
    { id: 'd9',  type: 'call',   from: 'TR5',  to: 'ASR5',   pill: '無 caption→辨識', ev: 'GR:transcript:33' },
    { id: 'd10', type: 'call',   from: 'TR5',  to: 'RUNS5',  ev: 'GR:transcript:33' },
    { id: 'd11', type: 'call',   from: 'TRL5', to: 'ST5',    pill: 'parse_cues', ev: 'IP' },
    { id: 'd12', type: 'call',   from: 'TRL5', to: 'ASR5',   pill: '共用引擎環境', ev: 'IP; GL:engine environment' },
    { id: 'd13', type: 'call',   from: 'TRL5', to: 'RUNS5',  ev: 'GR:translate:255' },
    { id: 'd14', type: 'call',   from: 'COR5', to: 'ASR5',   pill: 'evidence 讀取', ev: 'IP; PL:Z' },
    { id: 'd15', type: 'call',   from: 'COR5', to: 'RUNS5',  ev: 'GR:correct:680' },
    { id: 'd16', type: 'data',   from: 'COR5', to: 'GLS5',   pill: '詞庫讀寫（409 防合併）', ev: 'GL:詞庫; PL:Z3 D-124' },
    { id: 'd17', type: 'call',   from: 'ASR5', to: 'QUAL5',  pill: '檢查（僅回報）', ev: 'GR:asr:39' },
    { id: 'd18', type: 'call',   from: 'ASR5', to: 'RUNS5',  ev: 'GR:asr:616' },
    { id: 'd19', type: 'call',   from: 'ASR5', to: 'ASRM5',  ev: 'IP' },
    { id: 'd20', type: 'call',   from: 'ASR5', to: 'RUNNER5', pill: 'spawn stdio JSON', ev: 'PL:Y' },
    { id: 'd21', type: 'data',   from: 'RUNS5', to: 'RF5',   pill: '只建不覆寫', ev: 'PL:Z3 D-122; CM' },
    { id: 'd22', type: 'call',   from: 'CONF5', to: 'RUNNER5', pill: '真引擎跑', ev: 'CM:Verify; PL:X D-110' },
    { id: 'd23', type: 'absent', from: 'QUAL5', to: 'RUNNER5', pill: '不碰引擎（D-109 純）', ev: 'PL:X D-109; IP' },
  ],
  declared: [
    'main 上已存在但 branch 大改的元素（transcript/stack/routes_transcript/cli）不帶 ov——差分表的「changed」列由手工補充（差分器只裁 add/remove，見 delta 節說明）',
    'stack 的另兩個消費者（routes_stack/stack_jobs）見 V2/V3——本圖聚焦文字弧',
    '交叉數 ≤1/宣告 1',
  ],
});

// ---------- model self-audit: tsm drawn edges ⊆ LEGAL_TRANSITIONS ----------
// Transcribed from src/mfp/queue.py L54-73 (read this round). The drawn set
// must be a subset; the omitted set must be exactly the 7 →CANCELLED edges.
const LEGAL = {
  PARSED: ['PROBING', 'CANCELLED', 'FAILED'],
  PROBING: ['READY', 'FAILED', 'CANCELLED', 'PAUSED'],
  READY: ['DOWNLOADING', 'EXPIRED', 'PROBING', 'CANCELLED', 'FAILED'],
  DOWNLOADING: ['COMPLETED', 'PAUSED', 'FAILED', 'CANCELLED'],
  PAUSED: ['DOWNLOADING', 'EXPIRED', 'CANCELLED', 'FAILED'],
  EXPIRED: ['PROBING', 'CANCELLED'],
  COMPLETED: ['PROBING'],
  FAILED: ['PROBING', 'CANCELLED'],
  CANCELLED: ['PROBING'],
};
{
  const tsm = views.find((v) => v.id === 'tsm');
  const drawn = tsm.edges.map((e) => `${e.from}>${e.to}`);
  for (const d of drawn) {
    const [f, t] = d.split('>');
    if (!LEGAL[f] || !LEGAL[f].includes(t)) throw new Error(`tsm draws an edge not in LEGAL_TRANSITIONS: ${d}`);
  }
  const all = Object.entries(LEGAL).flatMap(([f, ts]) => ts.map((t) => `${f}>${t}`));
  const omitted = all.filter((x) => !drawn.includes(x));
  if (omitted.length !== 7 || !omitted.every((x) => x.endsWith('>CANCELLED')))
    throw new Error(`tsm omission set is not exactly the 7 →CANCELLED edges: ${omitted.join(', ')}`);
  console.log(`tsm self-audit: drawn ${drawn.length}/26 legal edges; omitted = 7 ×→CANCELLED (declared)`);
}

// ---------- delta: stripOverlay(txd) = main state; diff = the B-9 table ----------
const txdRaw = views.find((v) => v.id === 'txd');
const baseTxd = stripOverlay([txdRaw]);
// Cross-check the differ's base against the git fact (GIT: main lacks these):
const mainMissing = ['asr.py', 'asr_models.py', 'correct.py', 'quality.py', 'runs.py', 'translate.py', 'routes_asr'];
const baseIds = new Set(baseTxd[0].nodes.map((n) => n.id));
for (const kept of ['CLI5', 'RTT5', 'TR5', 'ST5'])
  if (!baseIds.has(kept)) throw new Error(`stripOverlay dropped ${kept}, which main has (GIT)`);
if (baseIds.size !== 4) throw new Error(`stripOverlay base should hold exactly main's 4 nodes, got ${baseIds.size}`);
const delta = diffViews(baseTxd, [txdRaw]);
console.log(`delta (main→branch, txd view): ${JSON.stringify(delta.totals)}  [git fact: main lacks ${mainMissing.length} modules]`);

// ---------- route every view through the channel provider (S2 field half) ----------
const routeStats = [];
for (let i = 0; i < views.length; i++) {
  const t0 = performance.now();
  const r = route(views[i], { grid: 8, rev: 1 });   // rev 1 pinned: issued before router rev 2 (2026-10-24)
  const ms = (performance.now() - t0).toFixed(1);
  routeStats.push({ view: views[i].id, ...r.stats, ms, diagnostics: r.diagnostics });
  if (r.diagnostics.length) {
    console.log(`ROUTE DIAGNOSTICS ${views[i].id}:`);
    for (const d of r.diagnostics) console.log('  ' + JSON.stringify(d));
  }
  views[i] = applyRoutes(views[i], r);
}
console.log('route stats: ' + routeStats.map((s) => `${s.view} ${s.edges}/${s.of} x${s.crossings}/${s.declared} ${s.ms}ms`).join(' | '));

// ---------- section tables ----------
const aggTable = table(['圖上元素', '展開（code）', '憑據'], [
  ['V1 BIN／V2 YD2+FF2', 'yt-dlp、gallery-dl（選配）、ffmpeg——doctor 的四項之三', 'SK:doctor'],
  ['V1/V2 引擎環境', '.asr-venv python＋asr/runner.py、translate_runner.py、fetch_model.py', 'LS:asr/; GL:engine environment'],
  ['V2 renderer FSD 六層', 'gui/src/{app,pages,widgets,features,entities,shared}', 'LS:gui/src'],
  ['V3 routes ×5', 'server/routes_{queue,stack,transcript,asr,config}.py＋platform_gate.py', 'LS:server/'],
  ['V3 instagram ×5', 'adapters/instagram/{adapter,chrome,extract,sessions,cdp}', 'LS:adapters/instagram; IP'],
  ['V3 EVS3', 'server/{events,security,stack_jobs}.py', 'LS:server/'],
  ['V3 BUD3／INP3／DOC3', 'budget＋policy／inputs＋naming／doctor＋capabilities', 'IP'],
  ['V3 MISC3', 'logs、redact、capture、agent、winpath、brief、serve 雜項', 'LS:src/mfp'],
  ['V5 asr/ 腳本 ×3', 'runner（辨識＋Health）、translate_runner（NLLB）、fetch_model（HF 下載）', 'LS:asr/; PL:Y'],
]);

const matrixHead = ['from ＼ to', 'PROBING', 'READY', 'DOWNLOADING', 'PAUSED', 'EXPIRED', 'COMPLETED', 'FAILED', 'CANCELLED'];
const matrixOrder = ['PROBING', 'READY', 'DOWNLOADING', 'PAUSED', 'EXPIRED', 'COMPLETED', 'FAILED', 'CANCELLED'];
const tsmMatrix = table(matrixHead,
  Object.keys(LEGAL).map((f) => [f, ...matrixOrder.map((t) => (LEGAL[f].includes(t) ? '✓' : '·'))]));
const tsmActions = table(['action（語意端點）', '適用狀態 → 目標', '憑據'], [
  ['probe', 'PARSED/READY/EXPIRED/FAILED/CANCELLED/COMPLETED → PROBING', 'QP:L89-96'],
  ['start', 'PARSED/EXPIRED → PROBING；READY/PAUSED → DOWNLOADING', 'QP:L99-104'],
  ['pause', 'DOWNLOADING → PAUSED', 'QP:L105'],
  ['cancel', '7 個非終態 → CANCELLED（不適用者答 409，不發明轉移）', 'QP:L106-114'],
  ['retry', 'FAILED/CANCELLED/COMPLETED/EXPIRED → PROBING（INV-5：必重 probe）', 'QP:L117-122'],
]);
const tsmRecovery = table(['崩潰時在', '落地', '性質', '憑據'], [
  ['PROBING', 'PAUSED', 'ε（無動作可產生此邊）；措辭問題開放中——見缺口 G5', 'QP:L145-148,139-144'],
  ['DOWNLOADING', 'PAUSED', 'ε；與 pause 動作同落點，.part sidecar 讓跨進程續傳可辨識', 'QP:L145-148; GL:.part sidecar'],
]);
const tsmSection = '<p>完整性主張由本矩陣承載（圖為投影，略畫 7 條 →CANCELLED）。白名單語意：矩陣上「·」＝拒絕（IllegalTransition），不是未定義。</p>'
  + tsmMatrix + '<h3>ACTIONS（intent→轉移）</h3>' + tsmActions
  + '<h3>RESTART_RECOVERY</h3>' + tsmRecovery;

const deltaSection = '<p>由 <code>delta.mjs</code> 生成（S3，B-9 自動化）：base＝stripOverlay(txd)＝main 狀態（與 GIT ls-tree 交叉核對：main 恰缺 asr／asr_models／correct／quality／runs／translate／routes_asr）。差分器只裁 add／remove／changed-in-model；main 上已存在但 branch 大改的四個元素（transcript、stack、routes_transcript、cli——見 PL:Y/Z3 的 Changes 節）由本說明列承載，不入表。</p>'
  + table(['view', 'delta', 'elements'], deltaTableRows(delta));

const driftTable = table(['宣稱（claim）', '本輪量測', '判讀'], [
  ['HR §零：src/mfp 45 modules（2026-08-27 @ 8f97acb）', 'IP：52 modules（同法：AST、全檔）', '一致非漂移——差＝branch 弧新模組（GIT）'],
  ['HR §3.4/§五：stack.py fan-in 3；拆分觸發＝fan-in 到 4／第三個消費者', 'IP：fan-in 4（transcript/translate/routes_stack/stack_jobs）', '**觸發已達標**——translate 進場。轉發健檢，裁決屬 user（缺口 G1）'],
  ['CM Verify：pytest 2100 passed, 2 skipped @ 2026-08-29', 'PL:Z3 同數＋fb686c5「record the count the release gate actually ran」', '一致'],
  ['GL:budget governor 只管 page 端點（D-34）', 'V1 e7 費 budget／e8-e9 不費——邊標注即宣稱', '一致（本圖沿用）'],
  ['CM：stdout＝機器、stderr＝人類', 'SK 開頭同一句（兩檔同源不漂移）', '一致'],
]);

const gapTable = table(['#', '缺口／發現', '嚴重度', '憑據'], [
  ['G1', 'stack.py 拆分觸發已達標：fan-in 4（HR 記錄的觸發條件），HR 當時 3。屬轉發項non-blocking——下輪健檢重排 §3.4，裁決屬 user', 'warn', 'IP; HR:§3.4/§五'],
  ['G2', 'P-49 活缺陷：yt-dlp 可選中 AI 配音軌（YC 影片 21 條 dubbed-auto，140-20 才是原文）。成因已確認、未修——V1 e8/e9 傳輸路徑上', 'defect(已知)', 'PL:Y/Z open'],
  ['G3', '六份 UAT 文件未跑（long-audio §C、post-correction、asr-setup 等）——V5 全部 ov 元素＝機器綠、人未驗；本圖的未驗收徽章即此事實', 'warn', 'PL:X-Z3 open'],
  ['G4', '舊 _captions/ 不遷移不讀（P-60 裁決）：Phase Z3 前轉錄的音檔下次重付辨識成本，無警示', 'note', 'PL:Z3'],
  ['G5', 'RESTART_RECOVERY 的 PROBING→PAUSED 措辭問題開放中（崩潰於 probe 無 manifest，PAUSED 讀作「位元組傳到一半」）——queue.py 註解自認', 'open', 'QP:L139-144'],
  ['G6', 'transcript 該不該教成帶 --json 的裁決未落（crd_6d0f13，白名單反轉方案在 HR §3.2）——SKILL.md 與測試 docstring 兩邊都沒說誰贏', 'open', 'HR:§3.2/§七'],
  ['G7', 'quality.py 純函式性質（無引擎接觸）為結構保證——V5 以 absent 邊 d23 宣告；破壞它的 import 會被 IP 類探針看見', 'note', 'PL:X D-109; IP'],
  ['G8', '宣告範圍外：gui/electron 內層逐檔、agent-register 寫入面、danmaku sidecar、capture/redact 雙向檢查細節——V1/V2 聚合承載', 'scope', '本輪宣告'],
]);

const measureTable = table(['量測欄', 'F1（DIT）', 'F2（Prism）', 'F3（本輪）'], [
  ['結構模型規模', '5 視圖 42 節點/54 邊', '5 視圖 48 節點＋11 容器/56 邊', '5 視圖 79 節點＋8 容器/89 邊（轉移矩陣等三表另承載完整性）'],
  ['佈局手排（渲染前）', '4 次走廊/埠重排', '1 次列大重排＋4 次走廊改線', '<b>0</b>——89/89 邊全由 channel router 生成，診斷→宣告 0 次'],
  ['§4 fail 輪數', 'build 1＋渲染 2', 'build 0＋渲染 1', 'build 1（模型筆誤：16 個空 pill 欄）＋渲染 <b>0</b>（首輪 PASS、0 診斷、4,748 對標籤）'],
  ['pill 修復', '疊字＋外溢＋交錯', '撞標題 ×1', '0（router 佈點一次過）'],
  ['B-9 delta', '—', '手工 ≈12 分/輪、3 步驟', 'delta.mjs 自動：+11 節點/+19 邊/+1 absent、0 誤報，秒級'],
  ['route 統計', '—（全手排）', '—（全手排）', 'l1 0/0·62ms｜l2p 0/0·15ms｜l3i 0/0·19ms｜tsm 1/2·35ms｜txd 1/1·57ms（交叉/宣告·耗時）'],
]);

// ---------- build ----------
build({
  outPath: OUT,
  grid: 8,
  doc: {
    lang: 'zh-Hant',
    title: 'media-fetch-pipeline 稽核視圖組 F3',
    h1: 'media-fetch-pipeline 稽核視圖組 F3（main 基底＋feat/transcribe-audio 疊層·未驗收）',
    legendbar: '節點：藍＝模組方塊、灰膠囊＝外部、琥珀＝資料存放、綠圓角＝狀態（深框＝終態集）、紫＝上層埠、<b>橘虛框＋未驗收徽章＝branch 疊層</b>（feat/transcribe-audio，未合併、六份 UAT 未跑）。邊：灰開箭頭＝同步呼叫/匯入、黑實＝資料流、藍＝async 協議/SSE、紅＝出口（跨進程邊界）、紫虛線＝ε（崩潰恢復）、灰點虛＋✕＝契約性無依賴（D-109）。虛線大框＝layer／進程。<b>本輪全部邊路徑與 pill 佈點由 channel router 生成（S2 field half）——零手排走廊。</b>',
    footerNote: '再生源：outputs/diagram-authoring/mfp-audit-f3.build.mjs（模型即資料；node 一跑即重生）。生成 2026-08-29。branch 前提：main @ 96e6673，feat/transcribe-audio 領先 70 commits 未合併——合併後清 overlay 旗標重生，差分表隨模型自動更新（delta.mjs）。F3＝archdiag S1+S2 聯合驗收儀器：節點座標人排（D-042 位置承載語意），邊/pill 全部 route() 生成。v1.1（2026-09-02）：副標基線 +3px＋自檢 render receipt——外部驗證回報 CJK 高 metric 字型下標題↔副標 bbox 間距不足 PAD（tools/archdiag/MAINTENANCE.md M6）；其餘幾何零變動。',
  },
  views,
  sections: [
    { h2: '聚合表（code 元件 → 圖上方塊）', html: aggTable },
    { h2: 'Task 轉移完整性（矩陣＋ACTIONS＋崩潰恢復——完整性主張的載體）', html: tsmSection },
    { h2: 'main↔branch 結構 delta（delta.mjs 生成，B-9 自動化）', html: deltaSection },
    { h2: '漂移表（claim vs 量測——audit 交付核心）', html: driftTable },
    { h2: '缺口表 gap report', html: gapTable },
    { h2: '本輪量測（F3——S1+S2 聯合驗收）', html: measureTable },
  ],
});
