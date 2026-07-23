# Phase 5 軍團成長批次設計

日期：2026-07-23

狀態：書面規格已確認，等待實作

主規格：`docs/AI_DEVELOPMENT_SPEC.md`

## 1. 目標

本批完成主規格 Phase 5 的完整軍團成長循環：

1. 戰鬥成果轉為可追溯經驗。
2. 經驗可升級並保留溢出值。
3. 傷兵可接受治療並回到現役。
4. 編制缺額可由補員填補，但不得超出原始編制。
5. 步兵可轉職為重盾衛隊。
6. 弓兵可轉職為獵獸射手。
7. 兩條轉職線都必須改變下一場戰鬥的實際結果。
8. 玩家可在 Web UI 看見成長原因、取捨與戰鬥差異。

## 2. 非目標

本批不實作：

- Phase 6 的補給消耗、領域節點、遠征路線與臨時營地。
- 完整職業樹、天賦樹或可視化節點編輯器。
- 技能冷卻、主動技能施放與 AI 軍令。
- 醫療建築、導師、訓練手冊或特殊素材門檻。
- D1、R2、多人同步或伺服器端持久化。
- 超過步兵與弓兵的第三條轉職線。

## 3. 方案比較

### 方案 A：共用成長引擎與資料驅動職業定義

共用經驗、升級、傷兵與補員函式；職業與技能差異由
`game-data` 定義，`progression-core` 套用。

優點：

- 兩條轉職線不複製流程。
- 新職業可新增資料定義，不必重寫成長演算法。
- 每個函式具有單一責任與清楚輸入輸出。
- `simulation-core` 不依賴職業資料，維持現有依賴方向。

缺點：

- 比兩套硬編碼函式多一層資料契約。

### 方案 B：每個職業各自實作

為重盾衛隊與獵獸射手各寫一套轉職函式。

優點：

- 第一個函式較快完成。

缺點：

- 經驗門檻、驗證、事件與能力值套用會重複。
- 第三個職業開始就容易產生分歧與回歸。

### 方案 C：完整職業圖與天賦圖

立即建立任意前置節點、分支條件與技能圖。

優點：

- 長期彈性最高。

缺點：

- 超出 MVP。
- 會提前承擔 UI、資料遷移與圖驗證複雜度。

### 決策

採用方案 A。

## 4. 邊界與依賴

### `packages/shared-types`

只定義跨模組資料契約：

- `ExperienceAward`
- `ExperienceReason`
- `GrowthEvent`
- `GrowthEventType`
- `UnitStatModifiers`
- `SkillDefinition`
- `UnitClassDefinition`

不得包含規則計算。

### `packages/game-data`

只保存靜態、可驗證的 MVP 資料：

- 經驗來源的固定獎勵規則。
- 重盾衛隊職業定義。
- 獵獸射手職業定義。
- 盾牆訓練技能定義。
- 獵獸操典技能定義。

不得直接修改 `UnitState`。

### `packages/progression-core`

只執行純成長規則：

- 計算與套用經驗。
- 處理升級與經驗溢出。
- 治療傷兵。
- 補充編制。
- 驗證與套用轉職。
- 產生可追溯成長事件。

允許依賴 `shared-types`，不得依賴 React、PixiJS、HTTP 或
`simulation-core`。

### `packages/simulation-core`

不新增職業判斷。它繼續只讀取 `UnitState` 的實際攻擊、防禦、正面防禦、
機動與陣形，因此轉職後的數值會自然進入現有移動與局部壓力公式。

### `apps/web`

組合資料與純函式，建立兩條可重播成長快照，並將結果投影為 UI。
不得把經驗、治療、補員或轉職規則寫進 React 元件。

## 5. 資料契約

### 5.1 經驗

```typescript
type ExperienceReason =
  | "BATTLE_PARTICIPATION"
  | "COMMAND_COMPLETED"
  | "FORMATION_HELD"
  | "ALLY_PROTECTED"
  | "MONSTER_DEFEATED"
  | "BREAKTHROUGH_COMPLETED"
  | "ROUT_SURVIVED"
  | "UNKNOWN_NODE_EXPLORED";

interface ExperienceAward {
  readonly reason: ExperienceReason;
  readonly quantity: number;
  readonly evidenceIds: readonly string[];
}
```

`quantity` 是該成就次數，不是直接經驗值。每筆獎勵必須至少包含一個
`evidenceId`，以便事件追溯。

固定 MVP 規則：

| 原因 | 每次經驗 | 單次結算上限 |
| --- | ---: | ---: |
| 參與戰鬥 | 40 | 40 |
| 完成軍令 | 20 | 40 |
| 維持陣形 | 25 | 25 |
| 保護友軍 | 25 | 25 |
| 擊敗魔獸 | 10 | 50 |
| 完成突破 | 30 | 30 |
| 從潰敗中生還 | 20 | 20 |
| 開荒未知節點 | 50 | 50 |

升級門檻：

```text
升到下一級所需經驗 = 目前等級 × 100
```

規則：

- 等級從 1 開始。
- 經驗可跨越多個等級。
- 升級後扣除該級門檻，剩餘經驗保留。
- 不設定 MVP 等級上限。
- 同一原因超過單次結算上限時，該原因的經驗會截斷至上限，不視為錯誤。
- `quantity` 小於 1、不是整數，或缺少證據的獎勵會回傳失敗結果，
  不產生部分明細。

經驗計算回傳辨別聯集：

```typescript
type ExperienceCalculationFailureReason =
  | "INVALID_QUANTITY"
  | "MISSING_EVIDENCE"
  | "MISSING_EXPERIENCE_RULE";
```

成功結果包含 `totalExperience` 與逐原因明細；失敗結果包含
`reason` 與原始獎勵索引。

### 5.2 成長事件

```typescript
type GrowthEventType =
  | "EXPERIENCE_AWARDED"
  | "LEVEL_GAINED"
  | "CLASS_CHANGED"
  | "WOUNDED_TREATED"
  | "REINFORCEMENTS_ADDED";

interface GrowthEvent {
  readonly id: string;
  readonly unitId: string;
  readonly type: GrowthEventType;
  readonly causes: readonly string[];
  readonly effects: Readonly<Record<string, number | string | boolean>>;
}
```

每個公開成長操作都接收呼叫端提供的 `eventId`。若一次經驗結算升多級，
等級事件使用 `${eventId}:level:${level}`，確保相同輸入產生相同事件。

### 5.3 能力修正

```typescript
interface UnitStatModifiers {
  readonly attack?: number;
  readonly defense?: number;
  readonly frontalDefense?: number;
  readonly mobility?: number;
  readonly discipline?: number;
  readonly commandEfficiency?: number;
}
```

修正值是加法差值。未列出的能力保持不變。

### 5.4 技能與職業

```typescript
type SkillType = "PASSIVE" | "TACTICAL" | "REACTION" | "COMMAND" | "FIELD";

interface SkillDefinition {
  readonly id: string;
  readonly name: string;
  readonly type: SkillType;
  readonly description: string;
  readonly statModifiers: UnitStatModifiers;
}

interface UnitClassDefinition {
  readonly id: string;
  readonly name: string;
  readonly sourceClassId: string;
  readonly minimumLevel: number;
  readonly skillIds: readonly string[];
  readonly passiveIds: readonly string[];
  readonly appearanceIds: readonly string[];
  readonly statModifiers: UnitStatModifiers;
}
```

## 6. 兩條轉職線

### 6.1 步兵 → 重盾衛隊

前置條件：

- `classId === "infantry"`
- `level >= 2`

職業修正：

- `defense +1`
- `frontalDefense +2`
- `mobility -0.2`

被動技能「盾牆訓練」：

- `frontalDefense +2`
- `mobility -0.1`

完成後總效果：

- 防禦 `+1`
- 正面防禦 `+4`
- 機動 `-0.3`
- `classId = "heavy-shield-guard"`
- `skillIds` 加入 `shield-wall-training`
- 因技能類型為 `PASSIVE`，`passiveIds` 同步加入同一 ID 作為被動索引
- 加入 `class-heavy-shield-guard` 外觀 ID

這條線的實際驗收是：正面接戰的防守壓力提高，同距離移動量下降。

### 6.2 弓兵 → 獵獸射手

前置條件：

- `classId === "archer"`
- `level >= 2`

職業修正：

- `attack +1`
- `defense -1`
- `mobility +0.1`

被動技能「獵獸操典」：

- `attack +2`
- `frontalDefense -0.5`
- `mobility +0.15`

完成後總效果：

- 攻擊 `+3`
- 防禦 `-1`
- 正面防禦 `-0.5`
- 機動 `+0.25`
- `classId = "beast-hunter-marksman"`
- `skillIds` 加入 `beast-hunting-manual`
- 因技能類型為 `PASSIVE`，`passiveIds` 同步加入同一 ID 作為被動索引
- 加入 `class-beast-hunter-marksman` 外觀 ID

這條線的實際驗收是：攻擊壓力與同時間移動距離提高，但正面承傷能力下降。

### 6.3 重複與失敗

`promoteUnit` 回傳辨別聯集，不以例外表示正常資格不足：

```typescript
type PromotionFailureReason =
  | "WRONG_SOURCE_CLASS"
  | "LEVEL_TOO_LOW"
  | "MISSING_SKILL_DEFINITION";
```

規則：

- 已轉職單位無法再次套用同一定義。
- 任一技能定義缺失時整筆失敗，不部分修改。
- 失敗結果保留原始 `UnitState` 參照。

## 7. 傷兵與補員

### 7.1 治療傷兵

輸入：

- `UnitState`
- 非負整數 `treatmentCapacity`
- `eventId`

輸出：

- 成功：更新後單位、實際治療人數、剩餘傷兵，以及可選事件。
- 失敗：`INVALID_TREATMENT_CAPACITY` 與原始 `UnitState` 參照。

規則：

- `treatmentCapacity` 必須是非負整數；否則整筆失敗。
- `treated = min(woundedCount, treatmentCapacity, initialTroopCount - troopCount)`
- `troopCount += treated`
- `woundedCount -= treated`
- 不修改死亡、失蹤、被俘與潰散人數。
- 實際治療為 0 時成功，但不產生 `WOUNDED_TREATED` 事件。

### 7.2 補員

輸入：

- `UnitState`
- 非負整數 `availableRecruits`
- `eventId`

輸出：

- 成功：更新後單位、實際補入人數、未使用的新兵人數、剩餘編制缺額，
  以及可選事件。
- 失敗：`INVALID_RECRUIT_COUNT` 與原始 `UnitState` 參照。

規則：

```text
可補缺額 = initialTroopCount - troopCount - woundedCount
```

- 傷兵保留原編制位置，新兵不得取代仍可治療的傷兵。
- `availableRecruits` 必須是非負整數；否則整筆失敗。
- 補員不會復活死亡或失蹤單位。
- 現役加傷兵不得超過原始編制。
- 實際補入為 0 時成功，但不產生 `REINFORCEMENTS_ADDED` 事件。

## 8. 公開函式與單一責任

### `calculate-experience-awards.ts`

輸入：獎勵紀錄與經驗規則。

輸出：總經驗與逐項明細。

責任：只計算，不修改單位。

### `apply-unit-experience.ts`

輸入：單位、已計算經驗、事件 ID。

輸出：更新單位、升級數與成長事件。

責任：只處理經驗、等級與溢出。

### `treat-wounded.ts`

輸入：單位、治療量、事件 ID。

輸出：治療結果。

責任：只在傷兵與現役之間移動人數。

### `replenish-unit.ts`

輸入：單位、新兵量、事件 ID。

輸出：補員結果。

責任：只填補非傷兵保留的編制缺額。

### `promote-unit.ts`

輸入：單位、職業定義、技能定義、事件 ID。

輸出：成功或失敗結果。

責任：驗證一次轉職並原子套用職業與技能。

### `apply-unit-stat-modifiers.ts`

輸入：單位與能力修正。

輸出：更新單位。

責任：集中處理加法修正，避免職業與技能重複展開欄位。

## 9. Web 組合與資料流

`createLegionGrowthSnapshot` 建立兩支固定測試單位：

1. 步兵獲得參戰、維持陣形與擊敗魔獸經驗。
2. 弓兵獲得參戰、完成軍令與擊敗魔獸經驗。
3. 兩者升到 2 級並保留溢出經驗。
4. 兩者各自治療傷兵並補滿可用缺額。
5. 兩者套用各自轉職。
6. 使用既有移動與局部壓力函式計算轉職前後差異。
7. `LegionGrowthPanel` 只呈現快照，不執行規則。

UI 必須顯示：

- 每支軍團的經驗來源與總經驗。
- 升級前後等級與剩餘經驗。
- 傷兵治療與補員人數。
- 轉職名稱與技能。
- 攻擊、防禦、正面防禦與機動取捨。
- 下一場戰鬥的移動或壓力差異。

## 10. 分批實作

### 5A：經驗、等級與事件

輸出：

- 共用型別。
- 固定經驗資料。
- 計算與套用函式。
- 經驗明細、溢出與多級升級測試。

閘門：

- 相同輸入產生相同等級、經驗與事件。
- 不合法獎勵不部分套用。

### 5B：傷兵與補員

輸出：

- 治療傷兵函式。
- 補員函式。
- 人數守恆與上限測試。

閘門：

- 死亡與失蹤不會被治療或補員改寫。
- 現役加傷兵不超過原始編制。

### 5C：重盾衛隊

輸出：

- 職業與技能資料。
- 共用能力修正與轉職函式。
- 正面抗壓增加、移動下降的整合測試。

閘門：

- 資格不足與錯誤來源職業明確失敗。
- 成功轉職原子更新職業、技能、被動、外觀與能力。

### 5D：獵獸射手

輸出：

- 職業與技能資料。
- 攻擊壓力、機動增加與正面防禦下降測試。

閘門：

- 與重盾衛隊共用相同轉職函式。
- 不新增第二套升級或能力修正邏輯。

### 5E：雙職業 Web 垂直循環

輸出：

- `createLegionGrowthSnapshot`
- `LegionGrowthPanel`
- App 整合與 E2E 測試
- 批次驗證文件
- Cloudflare Pages 更新

閘門：

- UI 同時顯示兩條成長線。
- 瀏覽器看到一個 PixiJS Canvas 與兩張轉職卡。
- Console 無錯誤。
- Cloudflare 固定網址回傳 HTTP 200。

## 11. 測試策略

單元測試：

- 各經驗原因的固定值與上限。
- 多筆獎勵加總。
- 缺少證據、負數與非整數輸入。
- 單級、多級與溢出經驗。
- 0 治療、部分治療與全治療。
- 0 補員、部分補員、超額補員與傷兵保留。
- 正確轉職、等級不足、來源職業錯誤與技能缺失。
- 能力修正不改寫未列欄位。

整合測試：

- 步兵完整成長後，正面防守壓力提高且移動距離下降。
- 弓兵完整成長後，攻擊壓力與移動距離提高，正面防禦下降。
- 相同輸入重建相同快照與事件。

E2E：

- 兩條轉職線都顯示。
- 經驗、傷兵、補員與戰鬥差異具有人類可讀證據。
- PixiJS 戰場仍可載入。

全域閘門：

- TypeScript strict
- ESLint
- Prettier
- dependency-cruiser
- Knip
- Vitest
- Vite build
- Worker dry-run build
- Playwright

## 12. 完成標準

Phase 5 只有在以下條件全部成立時完成：

1. 5A～5E 全部通過各自閘門。
2. 步兵與弓兵都能由 1 級取得經驗、升級並轉職。
3. 兩條轉職都存在明確收益與代價。
4. 轉職後的差異進入既有模擬公式。
5. 傷兵與補員符合人數守恆。
6. 所有重大成長結果都有事件與原因。
7. 測試、建置與架構檢查通過。
8. Cloudflare Pages 固定網址可直接載入更新版本。
