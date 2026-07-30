# Cocos 戰鬥完成度改版計畫

## 玩家可見成果

一次完成「看懂技能因果、看見逐擊結果、感受接力升級」的固定單畫面戰鬥。

## 實作順序

1. 在 presentation-core 新增連招步驟語意與電影節拍規劃測試。
2. 重做 CommandLens 與 SkillDock 的漸進式資訊層級。
3. 讓 Runtime 匯出逐事件 battle projection。
4. 將 PlaybackDirector 改為蓄力、路徑、命中、受擊、回位五段。
5. 讓 Camera/VFX/Actor/DamageNumber 使用事件 cue 與不同路徑。
6. 改善 UnitView 名稱、HP、狀態與敵人輪廓，加入接力階級顯示。
7. 更新 Cocos 靜態契約與 E2E 驗收。
8. 執行 affected tests、`pnpm check`、Cocos web build、Cocos E2E。
9. 推送並部署 Cloudflare Pages，保留正式測試網址。

## 變更邊界

- 不修改傷害、掉落或戰鬥勝負公式。
- 不修改使用者的 `AGENTS.md` 或 `docs/AI_DEVELOPMENT_SPEC.md`。
- 不引入付費服務或有授權風險的外部資產。
- 不啟動未受控的常駐開發伺服器。
