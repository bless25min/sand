# 聚焦式新手引導與完整戰場發布驗證

## 玩家可見成果

- 新手引導集中到右拇指操作區，顯示階段、進度、標題與完整兩行說明。
- 每一步只有一個高亮操作；若玩家位於錯誤分頁，焦點先導向「目標」或「卡牌」。
- 第一次任務只顯示必要情報，完成狩獵並返回公會後教學正式結束。
- 行動版戰鬥網格只保留戰鬥標頭與戰場，內嵌教學不再擠壓戰場。
- 375 × 667 短螢幕採用緊湊單位卡，底部操作區不再遮住角色。
- 未修改敵人、Build、掉落、裝備、傷害、時間或其他平衡規則。

## TDD 與整合驗證

- 新增教學模型、唯一焦點、分頁修正、首次完成與短螢幕 CSS 契約測試。
- RED 證據：
  - 首次成功狩獵返回後仍為 `tutorial: active`。
  - 目標不正確且位於卡牌頁時沒有可見焦點。
  - 短螢幕操作區原本會遮住英雄卡。
- GREEN：4 個受影響測試檔、49 項測試全部通過。
- `pnpm check` 通過：
  - TypeScript、ESLint、Prettier、dependency-cruiser、knip。
  - 122 個測試檔、458 項測試全部通過。
  - 所有 workspace 正式建置與 Worker dry-run 完成。
- Wrangler 嘗試寫入沙盒外 log 時出現 EPERM 警告，但命令退出碼為 0，dry-run 完成。

## 本機真實流程

- 375 × 667 從全新存檔依序完成：
  - 任務引導 2 步。
  - 第一段軍令 5 步。
  - 孤王處刑軍令 7 步。
  - 4 件掉落裝備與返回公會。
- 返回後沒有殘留教學或焦點，保存狀態為 `tutorial: complete`。
- 375 × 667：6 個單位全部位於戰場內並避開底部操作區，水平溢出 0。
- 390 × 844：引導文字 14px / 18.9px，6 個單位全部可見，水平溢出 0。

## 正式發布證據

- Source commit：`ecd736d8c6c97cb69e5caba1a6a240f866777acd`
- Cloudflare deployment：`f69236ec-2acc-447e-8103-b2bef1d89ed4`
- Immutable：`https://f69236ec.ai-expedition-legion-rpg.pages.dev/`
- Canonical：`https://ai-expedition-legion-rpg.pages.dev/`
- 正式環境載入：`/assets/index-JIKnA7OG.js`
  - SHA-256：`266179f055be5d1dab1b6f68ef928fc9860d78493fb90461c12f76983543232a`
- 正式環境載入：`/assets/index-CqgHwbSO.css`
  - SHA-256：`c7e22694f1da6275a6cffd7e4acad2d81be25a7cb59e6cf34f10436e3ea02e33`
- 本機與正式 JS / CSS 位元組雜湊完全一致。
- 正式 375 × 667：
  - 新手引導 1/2 可讀，14px，每步焦點數 1。
  - 戰場高度 213.98px，6 個單位均完整且不被操作區遮住。
  - 行動版內嵌 `.gr-coach` 為 `display: none`，水平溢出 0。
- 正式 390 × 844：
  - 戰場高度 360.98px，6 個單位均完整。
  - 引導文字 14px / 18.9px，每步焦點數 1，水平溢出 0。
- 正式瀏覽器 console / page error：0。

## Consolidated Review

- Critical：0
- Important：2，已在同批修正並補測：
  - 首次教學成功返回後未結束。
  - 切錯戰鬥分頁時引導焦點不可見。
- Minor：1，已簡化 `ThumbCommandDeck` 的 map rendering，沒有遺留阻擋項目。
