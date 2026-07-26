# 戰役縱深第三批發布驗證

## 發布範圍

- 4 個區域、12 場狩獵、18 種唯一敵人、6 名唯一 Boss、4 套 Build。
- 每場具備唯一壓力、對策、處刑順序、敵人專屬掉落、殲滅寶箱及三段高潮。
- 桌機四區戰線、行動版區域情報、區域轉場、全戰役完破及重刷狀態。
- 舊三關存檔自動補開新增前置戰線，行動版回公會自動聚焦最新未通關任務。

## 自動驗證

- `pnpm check`：通過。
- 118 個測試檔、430 個測試：全數通過。
- TypeScript、ESLint、Prettier、dependency-cruiser、Knip：通過。
- 所有 workspace build：通過。
- Wrangler Worker dry-run：通過；僅有既知 AppData 日誌檔 EPERM 警告。
- 12 場 × 4 Build 戰鬥煙霧：全數可在六次完整軍令內擊穿。
- 內容驗證器確認精確數量、區域順序、敵人／Boss／Build／規則引用、掉落與高潮完整。

## 集中審查

- Critical：0。
- Important：2，均已修正並加入回歸測試。
  - 「軍令風暴」招牌順序改為合法的疾射 → 橫掃 → 祈禱 → 輝光爆裂。
  - 無 Boss 狩獵的預演與正式結算現在都能取得作者宣告的殲滅寶箱。
- Minor：1，已修正並加入回歸測試。
  - 四個行動版分頁固定為同一右側欄，主要操作保留右下角。
- 額外語意修正：結算與視聽提示統一為 `ANNIHILATION CHEST`。

## 正式部署

- 程式提交：`fa902bd`
- 部署 ID：`b41d6882-0a84-4c7b-aef0-e586d167b193`
- Immutable：`https://b41d6882.ai-expedition-legion-rpg.pages.dev/`
- Canonical：`https://ai-expedition-legion-rpg.pages.dev/`
- Immutable / canonical：HTTP 200，HTML SHA-256 相同。
- JS：`/assets/index-BUgtOaE0.js`
  - SHA-256：`122A0DA50DE196CC0AF9365169C92C7D3BB061F642952D182A32A3136C8AC764`
- CSS：`/assets/index-DG7HoHmF.css`
  - SHA-256：`C00B5BBC921FBB33D7BAC1051BB19FB0ABF57105D8BDA22FF6D00DE62BA210C1`
- 本機、immutable、canonical 的 JS 與 CSS 雜湊逐一相同。

## 實機證據

- 375 × 812：無水平溢出；4 個分頁同欄；所有可見按鈕高 56px。
- 390 × 844：無水平溢出；4 個分頁同欄；內容可垂直捲動。
- 行動版逐一巡覽 12 場，區域、任務名稱與 12 個殲滅寶箱皆存在。
- 1440 × 900：4 區、12 任務、4 Build 全數存在，無水平溢出。
- 正式版重新載入後，瀏覽器 exception、Log error、console warning/error：0。
