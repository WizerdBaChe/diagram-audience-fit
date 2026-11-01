# F3 field round 量測表 — media-fetch-pipeline 稽核 (audit)

> status: SPENT — measurement record, opened 2026-08-29, consumed by the F3 field round passing as the S1+S2 joint acceptance (claude-config phase 17; decisions log context line) ＋ selfbuild-scope-eval §6; residual: none
> 儀器 (instrument)：archdiag @ 8d02cb9（開跑前 receipt 回歸綠：F1 `172fda6b…`、F2 `dea22b65…` 重生位元一致）；router provider = `'channel'`。

## 一、預註冊 (pre-registration) — 動工前凍結，2026-08-29

**量測三欄**（與 F1/F2 同欄，selfbuild-scope-eval-2026-08-28.md §六）：

1. **步驟耗時比 (step-cost ranking)**：各步驟相對時間塊排序（結構模型撰寫／佈局手排／自檢修復／標籤修復／delta）。
2. **§4 自檢 fail 輪數**：build-time fail 輪數＋渲染後 in-page fail 輪數，分開記。
3. **手動幾何調整次數 (manual geometry adjustments)**：走廊/埠改線 (corridor hand-fixes)、列重排 (row re-layout)、pill 修復，分項計數。

**基線 (baselines)**：

| 軸 | F1（DIT） | F2（Prism） |
|---|---|---|
| 結構模型規模 | 5 視圖 42 節點/54 邊 | 5 視圖 48 節點＋11 容器/56 邊 |
| 佈局手排 | 4 次走廊/埠重排 | 1 次列大重排＋4 次走廊改線 |
| §4 fail 輪數 | build 1＋渲染 2 | build 0＋渲染 1 |
| pill 修復 | 輪1 疊字＋外溢；輪2 交錯 | 撞標題 ×1 |
| B-9 delta 手工 | — | ≈12 分/輪、3 步驟 |

**F3 目標（預註冊，不得事後改）**：

- 走廊手排 (corridor hand-fixes) → **0**（router 承擔全部正交路徑＋pill 佈點）。
- 結構模型撰寫時間**不變**（語意工作不受工具影響——若變慢，記為 schema 摩擦）。
- §4 fail 輪數 ≤ F2（build 0＋渲染 ≤1）。
- delta 軸（如標的有可比的兩態模型）：手工 ≈12 分 → `delta.mjs` 秒級，0 遺漏（差異以差分器輸出為證）。

**判讀規則（預先聲明）**：

- 人工閘 (human gate) 本輪**加判機器走廊美感**——§4 全綠但走廊醜＝目標未達，觸發 eval §七(b)：換 provider（`'archify-adapted'`，需重 clone archify）或降級 assist 模式。
- 任何 route() 診斷物件（B-1 格式）不計入 fail 輪數，計入「診斷→宣告」次數（這是設計行為，不是缺陷）。
- 節點座標仍全手排（D-042 位置承載語意）；「手動幾何調整」只計**渲染後**的返工，不計首次佈點。

## 二、量測結果（2026-08-29，單一 session 完成）

**標的規模**：5 視圖、79 節點＋8 容器／89 邊（F1＝42/54、F2＝48+11/56——F3 約 1.5×，
含一張 19 邊狀態機與三張完整性承載表）。收割源：SKILL.md、CLAUDE.md、glossary、
phase-log X–Z3、健檢報告 2026-08-27、自跑 AST 匯入探針（52 模組）、queue.py 狀態表、
git main↔branch 對照（70 commits）。

### 三欄對照

| 量測欄 | F1 | F2 | **F3（實測）** | 預註冊目標 | 判定 |
|---|---|---|---|---|---|
| 走廊手排 (corridor hand-fixes) | 4 | 1 大列重排＋4 | **0**——89/89 邊全由 `'channel'` router 生成 | 0 | ✅ 達標 |
| §4 fail 輪數 | build 1＋渲染 2 | build 0＋渲染 1 | **build 1＋渲染 0**（build 輪＝我的模型筆誤：16 個空 pill 欄，B-7 schema 當場抓住；渲染首輪 PASS、0 診斷、4,748 對標籤） | ≤ F2 | ✅（合計 1 ≤ 1） |
| pill 修復 | 多項 | 撞標題 ×1 | **0**（router 佈點一次過） | — | ✅ |
| B-9 delta | — | 手工 ≈12 分/輪 | **delta.mjs 秒級**：+11 節點/+19 邊/+1 absent、0 誤報；base＝stripOverlay 並與 git ls-tree 交叉核對（main 恰缺 7 模組） | 秒級、0 遺漏 | ✅ |
| 診斷→宣告次數 | — | — | **0**（router 未曾要求宣告交叉或回退手排） | 設計行為，不計 fail | — |

### route 統計（channel provider）

| view | 邊 | 交叉/宣告 | 耗時 |
|---|---|---|---|
| l1 | 17/17 | 0/0 | ~55ms |
| l2p | 16/16 | 0/0 | ~16ms |
| l3i | 14/14 | 0/0 | ~20ms |
| tsm | 19/19 | 1/2 | ~36ms |
| txd | 23/23 | 1/1 | ~57ms |

### 步驟耗時比 (step-cost ranking)，大→小

1. **結構模型撰寫（含收割）**——絕對大頭，與 F1/F2 同（語意工作：視圖選擇、聚合、
   宣告、證據錨定）。規模 1.5× 下體感單價未升——schema 摩擦未出現。
2. 儀器契約閱讀（README／schema／route API）——首次以「使用者」身分用庫的一次性成本。
3. 渲染驗證＋五張出程序截圖（機械）。
4. §4 修復：build 1 輪（分鐘級，Edit 一次 replace_all）。
5. 佈局手排 **0**、pill 修復 **0**、delta **秒級**——F1/F2 的最頻繁機械成本欄整欄清空。

### 判讀（對照預註冊）

- **S2 目標「corridor hand-fixes → 0」達成**；「模型撰寫時間不變」成立（排序第 1 位未變，
  無 schema 摩擦項）。F1/F2 的「佈局手排」＝最頻繁機械成本，本輪歸零。
- **eval §7(b) 換 provider 觸發條件（router 未消除手排成本）未觸發**——機器面全綠。
- 美感面（機器走廊看起來像不像人排的）屬人工閘，本檔不裁：已知一處風格差異——
  l1 的 SRV→CHR probe 邊走了左緣大繞 (wrap)，避交叉但比人排長；tsm 的
  CANCELLED→PROBING 亦屬同款繞行。醜不醜由 user 裁決。
- 量測侷限（P-validity）：n=1、同一執行者、規模非同構（79 vs 42/48 節點）；
  「模型撰寫時間不變」以步驟排序與體感單價衡量，非碼錶。

### 收據 (receipts)

- `mfp-audit-f3.html` — sha256 `55da8f0443daa3c26b4cb5d0c61d311e08b7a3539bef0e1a5033c6f6825f5933`，94,732 B
- `mfp-audit-f3.build.mjs` — sha256 `0ea3ea294d755d0884fa67462ad5c417e843bbab76e8bbb6f3134026d60bcf94`
- 衍生渲染 `mfp-audit-f3-{l1,l2p,l3i,tsm,txd}.png` — untracked（既定約束）

`visual_review: passed`（user 裁決 2026-08-29：人工閘通過，含機器走廊美感——`'channel'` provider 定案）· `correction_rounds: 1`（build）＋0（渲染）

**Close-out（2026-08-29）**：eval §7(b)/(c) 兩個推翻條件皆關閉；F3 記入
`tools/archdiag/README.md` §F3 field acceptance；維護儀式落地
`tools/archdiag/MAINTENANCE.md`＋integrity-sweep check 27。
