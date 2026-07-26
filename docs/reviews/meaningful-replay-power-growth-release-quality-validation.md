# 有意義重刷與戰力成長發布驗證

## 玩家可見成果

- 每個 Build 由 16 張卡牌中編成合法 8 卡牌組，非法斷鏈與移除招牌卡會被阻止並說明原因。
- 4 套 Build 都有固定招牌卡、規則路線與獨立牌組；存檔升級為 v3 並保留舊進度。
- 鍛造支援主屬性強化、規則灌注與詞綴重鑄，會顯示確切材料、費用與結果。
- 檔案館整合戰績、48 項挑戰、110 項圖鑑，以及 3 種具有不同因果倍率與視覺主題的 Ascension。
- 手機版以 Build、任務、隊伍、背包四頁籤操作；牌組、鍛造、檔案館使用全螢幕焦點層。
- 每次編排軍令時自動暫停，只有玩家明確按下「繼續時間」才推進敵軍壓力。

## 審查與修正

- Consolidated review：Critical 0、Important 5、Minor 1。
- 已修正斷鏈牌組、挑戰因果證據不足、Ascension 只有壓力倍率、舊裝備錯用材料、空背包無法進鍛造。
- 鍛造預覽已補上確切材料與產出。
- 實機長流程發現第 9 場會在編排期間持續受壓；以失敗測試重現後改為每次決策自動暫停。
- 實機完成三種 Ascension 後發現制霸紀錄只顯示 1；根因為一般結算覆蓋延伸紀錄，已用累積測試修正並實機驗證為 3。

## 自動驗證

- `pnpm check`：通過。
- TypeScript、ESLint、Prettier、dependency-cruiser、Knip：通過。
- 122 個測試檔、452 個測試：全部通過。
- 全工作區 build：通過。
- Wrangler Worker dry-run：通過；沙箱僅阻止寫入個人 AppData 日誌，不影響命令結果。

## 實機遊玩驗證

- 桌機完成 12/12 戰役，四區全清，18/18 敵人與 30/30 裝備收錄。
- 完整 8 卡軍令預覽：29 個事件、809 傷害、3 擊殺、404 Overkill、招牌 3/3。
- 鍛造三種動作皆實際執行，屬性、規則、詞綴、金幣與材料同步更新。
- 赤紅壓境、招牌風暴、殲滅天候皆一令完成；三種 cue / motif 分別為 break / ember、rule-online / command、annihilation / storm。
- 390 × 844：無水平溢位，四頁籤與三個 Ascension 按鈕皆可操作，主要按鈕高度 56px。
- 1280 × 900：無水平溢位。
- 瀏覽器 `Runtime.exceptionThrown` 與 `Log.entryAdded`：0。

## 部署

- Source commit：`3b6ef2d7796ebd4430e9dcc9fd1d1d837466dc99`
- Deployment：`e05f180b`
- Immutable：`https://e05f180b.ai-expedition-legion-rpg.pages.dev/`
- Canonical：`https://ai-expedition-legion-rpg.pages.dev/`
- JS：`/assets/index-bHrhBMiQ.js`
  - SHA-256：`1330da1395c30091db339e9d5646a791b3c3a2c10819d0750fb994516ad93ad6`
- CSS：`/assets/index-DfjxkTgO.css`
  - SHA-256：`e29293b60d9ece86e98edb0ed5acd8815203c4a0e2d22e860a311b530f8841bf`
- 本機、immutable、canonical 的 JS 與 CSS 雜湊完全相同。
- 正式手機版驗證初始 200G、8/16 牌組、空背包鍛造、檔案館與四頁籤均可達。
- 正式戰鬥從 0.0 秒暫停開始；正式桌機版標題正確、無溢位、控制台 0 錯誤。
