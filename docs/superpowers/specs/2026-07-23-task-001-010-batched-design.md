# TASK-001～010 分階段批次開發設計

## 1. 文件定位

本文件定義 `AI_DEVELOPMENT_SPEC.md` 中 TASK-001～TASK-010 的實作分批方式、模組邊界、檔案拆分準則、依賴方向與驗收方法。

`docs/AI_DEVELOPMENT_SPEC.md` 仍是產品與技術規格的最高依據。本文件只決定如何安全地落實第一批工作票，不增加主規格沒有要求的遊戲系統。

## 2. 開發模式與範圍

開發模式為 0-to-1 Exploration。

本次範圍：

- TASK-001：建立 Monorepo。
- TASK-002：建立 Seeded RNG。
- TASK-003：建立 BattleState。
- TASK-004：建立移動與方陣。
- TASK-005：建立格網投影。
- TASK-006：建立接觸與傷亡。
- TASK-007：建立 PixiJS 點群。
- TASK-008：建立灰牙狼群。
- TASK-009：建立掉落與背包。
- TASK-010：建立角甲重盾。

本次不提前實作：

- 完整遠征節點與多場連戰。
- Workers AI 軍令解析與戰報生成。
- 將領人格與 AI 敘事。
- 多人同步、Durable Objects 戰場或伺服器權威模擬。
- TASK-001～TASK-010 驗收不需要的 D1 與 R2 資料模型。

## 3. 分階段批次

### 批次一：專案基礎與決定性狀態

包含 TASK-001～TASK-003。

交付：

- pnpm workspace 與指定的 app、package 目錄。
- TypeScript strict、Vitest、Playwright、ESLint、Prettier 與 Wrangler 基礎設定。
- 可替換的 `RandomSource` 與可重播的 Seeded RNG。
- 不依賴 React、PixiJS、HTTP 或 AI 模型的 `BattleState`。
- 前端與 Worker 的最小啟動入口。

批次閘門：

- `pnpm install` 成功。
- `pnpm typecheck` 成功。
- `pnpm test` 成功。
- `pnpm arch:check` 成功。
- `pnpm deadcode` 成功。
- 前端 production build 成功。
- Worker dry-run 或等價本機建置檢查成功。
- 相同 Seed 的 100 次輸出一致，不同 Seed 的序列不同。

### 批次二：純戰鬥模擬

包含 TASK-004～TASK-006。

交付：

- 部隊移動、目標位置、普通推進與強行軍。
- Dense Block、Line、Column 三種陣形。
- 128×128 格網、密度、流向與地形成本投影。
- 接觸區、局部壓力、傷亡、戰線位移與事件。
- 兵力守恆與同 Seed 重播。

批次閘門：

- 每個規則函式有獨立行為測試。
- 正常移動、強行軍、重甲與輕裝差異皆有測試。
- 多部隊重疊不破壞總密度與兵力守恆。
- 同質方陣可僵持、優勢方可推進、側翼攻擊更有效。
- 單次更新不得造成未經規則允許的瞬間全滅。
- 相同初始狀態、軍令、Seed 與版本產生相同事件序列。

### 批次三：視覺投影與灰牙狼群

包含 TASK-007～TASK-008。

交付：

- PixiJS 地圖與點群渲染。
- 2,000 個視覺點、插值移動、陣形、傷亡淡出與潰敗流。
- 點選部隊與 Debug Overlay。
- 灰牙狼群的鬆散群體、快速包覆、低凝聚與領袖依賴行為。

批次閘門：

- React 不建立普通士兵元素。
- 每個視覺點沒有事件監聽、剛體、碰撞器或獨立 AI。
- PixiJS 不修改傷亡、士氣、凝聚、疲勞與戰鬥結果。
- 視覺點數、LOD 與鏡頭不影響模擬事件。
- 灰牙狼群領袖死亡後會透過規則事件降低群體士氣。
- 2,000 點的效能量測方式與結果被記錄。

### 批次四：掉落、製造與再戰鬥

包含 TASK-009～TASK-010。

交付：

- 狼皮與魔獸牙掉落。
- 戰場掉落位置、戰後回收、背包與撤退遺失。
- 以狼皮、魔獸牙與角甲製造角甲重盾。
- 角甲重盾提高正面防禦與重量，降低移動能力。
- 裝備後的點群外觀改變。
- 裝備效果實際影響下一場戰鬥。

批次閘門：

- 掉落只由規則引擎與 Seeded RNG 決定。
- 未回收掉落不會直接進入背包。
- 撤退遺失規則可重播並產生事件。
- 製造會消耗正確素材並產生正確裝備。
- 角甲重盾的移動、防禦與視覺差異各自由對應模組處理。
- 完成「戰鬥 → 掉落 → 回收 → 製造 → 裝備 → 再戰鬥」整合測試。

## 4. 模組依賴方向

依賴只能朝下列方向流動：

```text
apps/web
├─ packages/pixi-renderer
├─ packages/simulation-core
├─ packages/progression-core
├─ packages/game-data
├─ packages/command-schema
└─ packages/shared-types

apps/worker-api
├─ packages/command-schema
└─ packages/shared-types

packages/pixi-renderer
└─ packages/shared-types

packages/simulation-core
└─ packages/shared-types

packages/progression-core
└─ packages/shared-types

packages/game-data
└─ packages/shared-types

packages/command-schema
└─ packages/shared-types
```

規則：

- `shared-types` 只保存真正跨 package 的穩定契約，不作為所有型別的集中垃圾場。
- 功能內部型別留在功能資料夾，除非第二個 package 確實需要，否則不移入 `shared-types`。
- package 只透過公開入口匯出穩定 API。
- 其他 package 不得引用某個 package 的 `src/internal` 或深層實作路徑。
- `apps/web` 是前端組合層，負責把 UI、模擬、成長與渲染串接起來。
- `step-battle` 類型的引擎組合器可以知道多個模擬功能，但只負責呼叫順序，不放入各功能的公式。
- React 元件、PixiJS Layer 與 Worker Route 都不得成為遊戲規則的擁有者。

### 4.1 可執行架構

架構規則必須同時存在於文件與自動檢查中，避免文件與程式碼分離。

採用：

- TypeScript Project References 表達 package 建置與型別依賴。
- `package.json` 的 `exports` 限制 package 公開入口。
- dependency-cruiser 驗證依賴方向、循環依賴與禁止的深層引用。
- dependency-cruiser 產生依賴圖，供批次審查比對。
- Knip 檢查未使用檔案、未使用公開 export 與未使用 dependency。

dependency-cruiser 至少執行以下規則：

- `simulation-core` 不得依賴 React、PixiJS、HTTP、Cloudflare SDK 或 Worker。
- `pixi-renderer` 不得依賴 `simulation-core` 的內部路徑。
- `progression-core` 不得依賴 React、PixiJS 或 Worker。
- package 之間不得引用彼此的 `src` 深層路徑。
- package 內不得出現循環依賴。
- `apps/worker-api` 不得依賴 `pixi-renderer`。

目前不導入 Nx。八個 package 可由 pnpm workspace、TypeScript Project References 與 dependency-cruiser完成邊界管理；只有當 package 與團隊規模明顯增加、現有規則不足時才重新評估。

## 5. 拆檔與單一責任標準

只有同時符合以下條件時才拆成獨立檔案或模組：

1. 能獨立測試。
2. 具有單一責任。
3. 存在清楚輸入與輸出。
4. 變更原因與相鄰功能不同。

不使用固定行數作為拆檔標準。短檔案若沒有獨立責任，不應為了形式被拆開；長檔案若同時處理多個變更原因，必須拆分。

每個模組應能用一句話說明：

- 它做什麼。
- 它接收什麼。
- 它回傳什麼。
- 它可以依賴什麼。
- 哪些狀態不允許由它修改。

禁止建立含糊的集中檔案，例如：

- 放入無關功能的 `utils.ts`。
- 收納所有領域型別的單一 `types.ts`。
- 同時處理移動、碰撞、傷亡與事件的單體 `battle-engine.ts`。
- 同時讀取模擬狀態並直接操作 PixiJS 物件的混合控制器。
- 同時計算裝備數值與決定視覺樣式的裝備模組。

### 5.1 AHA 優先於表面 DRY

減少冗餘不等於立即消除所有相似程式碼。

- 只有具有相同語意、相同變更原因與穩定輸入輸出的程式碼才共用。
- 兩段碰巧相似但代表不同領域規則的程式碼保持分離。
- 至少出現三個穩定案例，且抽象名稱能清楚表達領域概念時，才建立共用抽象。
- 不為縮短程式碼建立 `processData`、`handleState`、`commonUtils` 等無法表達責任的介面。
- Knip 負責移除沒有使用者的檔案、export 與 dependency；它不負責判斷兩段領域規則是否應被抽象。

## 6. 降低單檔變更爆炸半徑

### 6.1 最小輸入

功能函式不得只因方便就接收完整 `BattleState`。

例如：

- 移動規則接收部隊移動所需屬性、地形成本、軍令與時間步長。
- 壓力計算接收接觸區與雙方局部戰力。
- 傷亡計算接收壓力結果、方向修正與 RNG。
- 視覺投影接收已整理的視覺快照。
- 製造接收配方、背包可用素材與指定製造選項。

這能避免在 `BattleState` 增加無關欄位時，所有規則函式一起修改。

### 6.2 明確結果

功能函式回傳具名結果，不直接任意修改其他模組持有的物件。

結果應包含該功能真正產生的資料，例如：

- 狀態更新片段。
- 領域事件。
- 驗證錯誤。
- 視覺投影資料。

組合層負責把結果套用到完整狀態。個別功能不得跨過組合層修改另一個功能的狀態。

### 6.3 狀態所有權

每類狀態只允許一個模組定義其改變規則：

| 狀態           | 規則擁有者        |
| -------------- | ----------------- |
| 位置與移動進度 | movement          |
| 陣形參數       | formations        |
| 格網密度與流向 | grid-projection   |
| 接觸區         | contact           |
| 局部壓力       | pressure          |
| 傷亡與兵力分類 | casualties        |
| 士氣狀態       | morale            |
| 戰鬥事件       | battle-events     |
| 視覺點         | visual-projection |
| 掉落位置       | battlefield-loot  |
| 背包內容       | inventory         |
| 製造結果       | crafting          |
| 裝備規則修正   | equipment-effects |

其他模組只能透過公開函式要求變更，不能直接重寫該狀態。

### 6.4 契約與實作分離

- 公開契約保持小而穩定。
- 內部演算法可以替換，不要求呼叫端跟著改。
- Zod 驗證放在 API、存檔與自然語言軍令等不可信資料邊界。
- 已通過邊界驗證的模擬內部資料不重複執行昂貴驗證。
- 新增遊戲資料優先修改 `game-data`，避免把特定魔獸或裝備條件寫進通用引擎。

### 6.5 組合層保持薄

允許同時影響多個功能的檔案只有組合層，但組合層不得擁有公式。

組合層只負責：

- 呼叫順序。
- 將前一步輸出交給下一步。
- 套用狀態更新。
- 收集事件。
- 在錯誤邊界停止或回報。

若組合層出現戰力公式、掉落機率、PixiJS 樣式或裝備數值，代表責任放錯位置。

## 7. 預定檔案責任

以下是責任邊界，不是要求每個資料夾立即產生所有檔案；檔案會隨對應批次建立。

```text
apps/
  web/src/
    app/                    應用啟動與高層組合
    features/battle/        戰場畫面、HUD 與操作
    features/inventory/     背包介面
    features/crafting/      製造介面
  worker-api/src/
    routes/                 HTTP 邊界
    adapters/               外部服務轉接

packages/
  shared-types/src/
    primitives/             Vec2 等跨域基礎契約
    battle/                 BattleState 公開契約
    units/                  UnitState 公開契約
    monsters/               MonsterState 公開契約
    events/                 BattleEvent 公開契約
    progression/            掉落、背包與裝備公開契約

  simulation-core/src/
    rng/                    Seeded RNG
    state/                  BattleState 建立與不變量
    movement/               移動結果
    formations/             各陣形規則
    grid/                   格網建立與投影
    contact/                接觸區偵測
    pressure/               局部壓力
    casualties/             傷亡與守恆
    morale/                 士氣狀態
    events/                 戰鬥事件建立
    monsters/greyfang-wolf/ 灰牙狼群規則
    engine/                 薄組合層與 Tick 順序

  game-data/src/
    domains/                灰牙森林資料
    monsters/               魔獸定義
    units/                  玩家部隊定義
    items/                  素材與裝備定義
    recipes/                製造配方

  command-schema/src/
    actions/                合法 Action
    formations/             合法 Formation
    constraints/            合法 Constraint
    orders/                 UnitOrder 契約與驗證

  pixi-renderer/src/
    projection/             狀態到視覺快照
    layers/                 地形、點群與事件 Layer
    points/                 視覺點生命週期與插值
    overlays/               選取與 Debug Overlay

  progression-core/src/
    loot/                   掉落生成與戰場回收
    inventory/              背包狀態
    retreat/                撤退遺失
    crafting/               配方驗證與製造
    equipment/              裝備效果

  test-fixtures/src/
    battles/                固定戰場
    builders/               測試狀態建立器
    replays/                固定 Seed 重播資料
```

每個 package 應有簡短 README，列出：

- 責任。
- 公開輸入與輸出。
- 允許依賴。
- 禁止責任。

Repository 根目錄建立 `AGENTS.md`，只保存跨 package 的穩定開發規則、常用命令與完成條件。若個別 package 需要額外限制，優先寫入該 package README；只有 AI 執行規則確實不同時才新增巢狀 `AGENTS.md`，避免指令重複與漂移。

## 8. 資料流

戰鬥資料流：

```text
固定 UI 或已驗證軍令
→ command-schema
→ simulation-core/engine
→ 各單一責任規則模組
→ 狀態更新與 BattleEvent
→ visual-projection
→ pixi-renderer
→ React HUD
```

成長資料流：

```text
BattleEvent 與戰鬥結果
→ progression-core/loot
→ battlefield-loot
→ inventory
→ crafting
→ equipment-effects
→ 下一場戰鬥的明確規則輸入
```

任何資料流都不得反向讓渲染器、UI 或 LLM 修改規則狀態。

## 9. 錯誤與衝突處理

- 外部輸入在邊界驗證，回傳結構化錯誤。
- 軍令中的矛盾保留在 `internalConflicts`，不得自動刪除。
- 規則上無法完成的命令透過事件說明未完成原因與代價。
- 內部不變量被破壞時，測試與開發模式應立即失敗，不以靜默預設值掩蓋。
- 一般戰術失敗、撤退遺失與士氣崩潰是遊戲結果，不當作程式例外。
- 組合層只處理邊界錯誤；個別規則不得使用廣泛 `try/catch` 吞掉錯誤。

## 10. 測試策略

### 單元測試

- 與功能檔案同責任範圍。
- 每個測試只驗證一個可觀察行為。
- 使用真實規則函式，除非外部服務無法避免，否則不使用 mock。
- 新規則遵循先失敗、再最小實作、再重構的 TDD 流程。

### 契約測試

- 驗證 package 公開入口。
- 驗證 app 不需引用 package 內部路徑。
- 驗證不可信輸入被 schema 拒絕。

### 不變量測試

- 兵力守恆。
- 密度投影總量守恆。
- 同 Seed 重播一致。
- 視覺點數與 LOD 不影響模擬。
- AI 或網路不可用時，固定 UI 仍能產生合法軍令。

使用 fast-check 與 Vitest 執行 property-based tests：

- 任意合法 Seed 都產生相同的可重播序列。
- `nextInt(min, max)` 永遠位於閉區間。
- 任意合法兵力分類都符合兵力守恆。
- 任意合法密度投影都不建立或消滅真實兵力。
- 任意視覺點數與 LOD 設定都不改變同一場戰鬥的事件序列。

### 整合測試

- 每個批次建立一條跨模組主路徑。
- 批次四建立完整成長循環測試。
- Playwright 只測玩家可觀察主流程，不重複所有純規則測試。

### 效能檢查

- 將效能量測與正確性測試分開。
- 批次三記錄 2,000 視覺點的硬體、瀏覽器、場景與量測結果。
- 不為 10,000 或 20,000 點提前引入 Web Worker、TypedArray 或自訂 GPU 批次。

## 10.1 架構與 AI 可讀性文件

建立以下低冗餘文件：

- `AGENTS.md`：AI 與人類共同遵循的執行規則、命令與完成閘門。
- `docs/architecture/C4_COMPONENTS.md`：只描述 Container 與 Component 關係，不繪製 class 級別圖。
- `docs/adr/0001-modular-monolith-boundaries.md`：記錄 Modular Monolith、Hexagonal Architecture、Vertical Slices 與 Functional Core / Imperative Shell 的選擇、替代方案與後果。
- 每個 package 的 `README.md`：責任、公開輸入、公開輸出、允許依賴與禁止責任。

文件不得複製主規格全文。主規格描述產品事實，設計文件描述實作邊界，ADR 描述決策原因，package README 描述局部契約，AGENTS.md 描述執行規則。

依賴圖由工具產生，不手動維護第二份容易過期的模組清單。

## 11. 批次檢查與問題定位

每批完成後產生一份驗證紀錄，至少包含：

- 完成的工作票。
- 新增或變更的公開契約。
- 測試命令與實際結果。
- Build 與型別檢查結果。
- 效能結果或不適用原因。
- 重大事件或重播證據。
- 未完成項目。
- 已知風險。

發現問題時依下列順序定位：

1. 重現失敗並建立最小失敗測試。
2. 確認錯誤屬於輸入邊界、單一規則、組合順序或視覺投影。
3. 只修改擁有該狀態或規則的模組。
4. 執行局部測試。
5. 執行該批次整合測試。
6. 執行完整回歸檢查。

如果修復需要同時修改多個非組合層模組，先檢查公開契約或狀態所有權是否設計錯誤，不直接擴散修改。

## 12. 完成標準

TASK-001～TASK-010 完成時必須同時符合：

- 四個批次閘門全部通過。
- 主規格的模擬、渲染與 AI 邊界沒有被破壞。
- 主要規則可獨立測試。
- 功能檔案具有單一責任與清楚輸入輸出。
- 除薄組合層外，沒有單一檔案同時擁有多個功能的規則。
- 所有重大結果可由事件追溯。
- 相同 Seed 可重播相同結果。
- 固定 UI 不依賴 AI 服務。
- 角甲重盾能在下一場戰鬥中產生可測試且可視化的取捨。
