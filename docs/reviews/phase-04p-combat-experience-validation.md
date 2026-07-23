# Phase 04P 戰鬥體驗驗證

日期：2026-07-23

## 本批目標

- 將首屏從開發展示頁改成可操作的軍令回合戰鬥。
- 讓弓兵、狼群意圖、傷亡與部隊狀態產生可感知差異。
- 維持 Simulation Core 擁有結果、Web 與 Pixi 只投影狀態的架構邊界。

## 已完成

### 戰鬥規則

- `planGreyfangMovement` 已接入實際回合，狼群會追獵、包圍、接敵或撤離。
- 弓兵在接敵距離外、有效射程內可發動確定性箭雨。
- 相同 Seed、Tick、部隊與目標會得到相同箭雨結果。
- 箭雨與近戰分別產生 `RANGED_VOLLEY_RESOLVED` 與 `CASUALTIES_APPLIED`。

### 視覺投影

- `VisualUnitSource` 明確接收士氣、疲勞與凝聚度。
- 低凝聚度擴大點陣間距。
- 高疲勞造成可重播的落隊偏移。
- 低士氣降低透明度並造成可重播的方向偏轉。
- Pixi renderer 不修改戰鬥狀態，也不產生戰鬥結果。

### 玩家介面

- 首屏顯示作戰目標、選中軍團、敵軍意圖、軍令與最新結果。
- 軍令提供用途提示，弓兵會顯示「射程內齊射」。
- 箭雨與接敵各自顯示戰果衝擊提示。
- 技術診斷、規則閉環與轉職資料移至預設收合的開發驗證區。

## 可維護性

- 狼群移動套用、箭雨規則、HUD view model、HUD 元件與衝擊元件均獨立拆檔。
- 純函式具備明確輸入輸出，React 只負責派令與呈現。
- 共用戰術中文標籤集中於 `tactical-labels.ts`。
- 未新增跨 package 內部引用或循環依賴。

## 驗證證據

- `pnpm check`
  - TypeScript：通過
  - ESLint：通過
  - Prettier：通過
  - dependency-cruiser：207 modules、486 dependencies，0 violation
  - Knip：通過
  - Vitest：60 files、188 tests 全數通過
  - 全 workspace build：通過
- `pnpm test:e2e`
  - 3 條 Playwright 流程全數通過
  - 完整戰鬥、回收、製造、裝備與再戰
  - 1280×720 首屏軍令配置
  - 弓兵接敵前箭雨
- 實際瀏覽器檢查
  - viewport：1280×720
  - 初始頁面總高：862px
  - Canvas：1
  - 開發驗證資料：預設收合
  - console warnings/errors：0

## 本批未納入

- 自由路線與更大地圖。
- 新怪物與額外戰役。
- 帳號、雲端存檔與多人功能。
- 完整美術、音效與動畫資產。
