# archify 融入分析 — 架構圖能力集合強化評估 (integration analysis)

> status: ruled | 2026-08-28 用戶裁決：B-1〜B-6 採納並於同日落地；B-8 不採（轉自建方向，見 §六）；B-7/B-9 併入自建評估
> 來源：tt-a1i/archify（MIT，based on Cocoon-AI/architecture-diagram-generator MIT）shallow clone @ 2026-08-28；本機 doctor 全綠（Node 24.14.1）
> 實測證據：同一份結構模型雙管線對照 — 我方 `outputs/diagram-authoring/archdiag-capability-set-v1.*`；archify 端 scratchpad `archify-test/capability-set.archify.*`（validate 3 輪收斂 → showcase 9/9 → deliver 收據 → visual-check 4 視窗全過）

## 一、兩套設計的本質差異（一句話）

我們的集合把**模型健全性與缺口誠實**做成紀律（選型理論、fabrication firewall、
gap report、三段驗證）；archify 把**渲染與幾何驗證**做成工業級工具（typed spec
→ deterministic renderer → 帶穩定錯誤碼的診斷迴圈 → 凍結交付收據）。弱項恰好
互補：我們逐圖手寫建圖腳本、手排座標（本輪實測光走廊配置就迭代多次）；archify
沒有 gap report、沒有 per-view integrity（state×event、boundary reconciliation
都不存在）、語彙鎖死在雲端軟體架構。**方向：借它的手，不借它的眼。**

## 二、實測記錄（判斷的依據）

| 步驟 | 觀察 |
|---|---|
| 同一模型改寫成 archify spec | 語意被詞彙表強制扭曲：理論參考檔只能標 `database`、治理層只能標 `security`；boundary 只有 `region`/`security-group` 兩種。跨領域（CPO 硬體、光學、業務流）不可用 |
| validate 第 1 輪（排太擠） | 10 個診斷全部帶 stable code＋量測 evidence＋supportedFixes，連 `labelAt [330,114] or labelDy +24` 都算好；對照我方 §4 自檢只吐 "label overlap: A × B" — 差距明顯 |
| 修復迴圈 | 放寬版面全交 auto router 後幾何一次全過（port spread／route rhythm 是真的）；3 輪收斂到 showcase 9/9、0 error 0 warning |
| deliver | spec/artifact 雙 SHA-256＋位元組數收據；凍結後不可再編 |
| visual-check | 4 視窗含納量測＋light/dark 截圖 sidecar；收據永遠標 `visualReview: "pending"` — 自動證據不冒充人審，與我方全域視覺閘門同構 |
| 輸出品質 | 觀感精緻（dark console 風、viewer 有 search/focus/present/export）；但 sublabel 投影字級實測 8.37px（其底線 6px，遠低於我方 11px 底線）；本例 auto legend 沒出現（hasLegend:false），以我方紀律「第二種節點型別出現即強制圖例」屬缺陷 |

## 三、借用帳 (borrow ledger)

### A. 建議直接融入（規則層改寫，成本小、無相依）

| # | archify 機制 | 融入點 | 內容 |
|---|---|---|---|
| B-1 | diagnostics 協定 `{code, subject, evidence, supportedFixes}` | notation-precision.md §4 | 幾何自檢輸出從 failure 字串升級為診斷物件：穩定錯誤碼＋量測值＋**建議修法（含具體座標）**。本輪我方自檢輸出與 archify 的併排對照就是證據 |
| B-2 | 修復次序＋有界修復 | notation-precision.md §4 或 SKILL.md Step 5 | schema→重疊→穿節點→交叉/走廊→標籤 的固定修復序；每診斷 ≤2 輪聚焦修復、無進展即停手如實回報；**不得刪語意標籤換過檢**（要刪必須論證冗餘）——與 fabrication firewall 同魂 |
| B-3 | 凍結＋收據 (freeze + receipt) | SKILL.md Step 6 ＋ carrier-playbook 再生節 | 交付註記帶 模型/工件 SHA-256；驗證通過即凍結，外觀審查改了東西就必須重跑驗證 |
| B-4 | `visual_review: passed｜skipped｜failed` 三態＋`correction_rounds: n` | SKILL.md Step 5.3 交付措辭 | 把「自動證據 ≠ 人審」寫成固定回報欄位，杜絕含糊宣稱 |
| B-5 | 視窗含納量測 | carrier-playbook HTML 載體驗證行 | `scrollWidth<=innerWidth && scrollHeight<=innerHeight` 於具名視窗（1440×900／1920×1080 起）；併入現有 headless 配方，幾行 JS |
| B-6 | （本輪自產）§4 儀器前置條件 | notation-precision.md §4 | bbox 斷言在單一未變換座標系執行：scene 內禁 transform 或先過 CTM 映射——首跑 36 筆圖例誤報即此儀器盲點，已在 v1 交付內落地為 precondition assert |

### B. 條件借用（要改造，各需自己的設計輪）

| # | archify 機制 | 條件與改造 |
|---|---|---|
| B-7 | typed spec（JSON Schema 驗證的結構模型） | 概念採、schema 不採：詞彙表軟體限定，直接用會逼跨領域圖說謊。改造方向＝為我方 Step 2 文字模型定義**自有輕量 schema**（nodes/edges/gaps＋basis 欄），以 archify schemas 為 prior art |
| B-8 | archify 當一個新「載體」 | carrier-playbook 決策表加一列：「軟體/雲端架構、要 showcase 級互動 HTML → archify CLI（本機已驗可跑）」。它管幾何驗證，我方仍外掛 gap report＋結構模型再生源（archify 沒有這個槽位）。僅限其詞彙表誠實可表達的系統 |
| B-9 | architecture-delta（canonical＋stable id diff） | 綁 B-8：Mode B 對軟體系統的重建視圖若以 archify JSON 留檔，下次體檢可得結構化 drift 報告，直接餵「重建視圖留檔供 diff」那條迴路 |

### C. 明知不採

- **Brand marks／viewer runtime 富功能**（guided stories、share cards、reach
  查詢）：與缺口誠實無關的表面積；archify 自己的 DESIGN.md 都在防 feature creep。
- **它的 6px 字級底線與 legend 缺席容忍**：低於我方 11px／強制圖例紀律，不得
  隨載體引入而放鬆（放鬆閘門需附回歸案——全域規則）。
- **把 archify 當主管線**：它驗幾何不驗模型健全性；沒有 state×event、boundary
  reconciliation、basis/assumed 標記。眼睛還是我們的。

## 四、附帶收穫（不屬本集合，供別的迴路取用）

archify 本身是一顆 Claude skill，其 SKILL.md 的**授權紀律**是 skill-engineering
的好 prior art：progressive disclosure（先讀 1 schema＋1 example，禁讀 renderer
內部）、artifact-first（下一個動作必須是寫候選檔，禁止在散文裡排座標）、有界
修復（≤2 輪）。與 skill-creator／skill-co-upgrade 的關注點直接相關。

## 五之一、裁決記錄（2026-08-28，用戶）

- **B-1〜B-6：採納**，同日落地——B-1/B-2/B-6 → notation-precision.md §4；
  B-4 → SKILL.md Step 5 回報欄位；B-3 → SKILL.md Step 6 ＋ carrier-playbook
  再生節；B-5 → carrier-playbook HTML 載體。
- **B-8：不採**——不引入 archify CLI 工具相依。方向改為**自建 (self-build)**：
  先讓自家管線帶著 B-1〜B-6 的紀律實跑幾輪，觀察真實痛點在哪個切點（結構
  模型 schema 化、auto-router、delta diff），再評估自建範圍與規格；B-7/B-9
  不再單獨成案，併入該次評估。屆時 prior-art 起點＝本檔 ＋ archify 原始碼
  （MIT 可 vendor 可改作）。

## 五、風險與復查觸發 (review-when)

- B-1〜B-5 是規則層文字改寫，不引入相依；B-8/B-9 引入對 archify repo 的工具
  相依（Node ≥18；MIT 授權可 vendor）。**review-when**：archify 大版本改
  schema_version 或 CLI 介面時，B-8/B-9 的載體列與 delta 用法需重測。
- 本分析的量測值（診斷輸出樣態、8.37px、9/9 checks）皆出自 2026-08-28 clone
  的版本（SKILL.md metadata 2.16）；升版後照本檔實測步驟重跑再信。
