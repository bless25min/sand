# Phase 04R Playable Loop Implementation Plan

> 本計畫依使用者要求採短版批次執行；不複製完整程式碼、不逐微任務審查。

**Goal:** 交付固定軍令驅動的戰鬥、掉落、製造、裝備與再戰閉環。

**Architecture:** `simulation-core` 決定戰鬥；Web reducer 只組合狀態；PixiJS 只投影；progression-core 沿用既有純函式。

**Tech Stack:** TypeScript、React、PixiJS、Vitest、Playwright。

## Global Constraints

- 不讓 React、PixiJS 或 AI 決定戰鬥結果。
- 新函式先有失敗測試。
- 每檔單一責任、清楚輸入輸出。
- 不新增通用框架或額外狀態管理 dependency。
- 只在批次結束跑完整 Gate。

## Batch 1：決定性固定軍令

**Files**

- Create: `packages/shared-types/src/orders/fixed-order.ts`
- Create: `packages/simulation-core/src/session/create-playable-battle.ts`
- Create: `packages/simulation-core/src/session/resolve-fixed-order.ts`
- Create: matching focused tests
- Modify: package public indexes

**Exit**

- 四支部隊與灰牙狼群可由 Seed 建立。
- 推進、固守、攻擊、撤退與變換陣形都回傳新狀態。
- 相同 Seed 與軍令序列完全一致。
- 兵力守恆，重大結果有事件。

## Batch 2：可玩 Web Session

**Files**

- Create: `apps/web/src/game-session/playable-session-types.ts`
- Create: `apps/web/src/game-session/create-playable-session.ts`
- Create: `apps/web/src/game-session/reduce-playable-session.ts`
- Create: `apps/web/src/game-session/create-battlefield-sources.ts`
- Create: matching focused tests

**Exit**

- Session 階段為 `BATTLE → LOOT → BASE → BATTLE_2`。
- 玩家操作回收、製造、裝備與再戰。
- 第二場使用更強狼群與已裝備重步兵。

## Batch 3：互動介面與即時沙盤

**Files**

- Create: `apps/web/src/game-session/PlayableExpedition.tsx`
- Create: `apps/web/src/game-session/CommandBar.tsx`
- Create: `apps/web/src/game-session/UnitRoster.tsx`
- Create: `apps/web/src/game-session/game-session.css`
- Modify: `apps/web/src/battlefield/BattlefieldDemo.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/e2e/battlefield.spec.ts`

**Exit**

- 可以選兵、下令、查看 Tick／兵力／事件。
- Canvas 隨狀態更新。
- E2E 實際點擊完成戰鬥到再戰。

## Batch 4：責任拆分與治理

**Files**

- Split: `apps/web/src/legion-growth/create-legion-growth-snapshot.ts`
- Create: `apps/web/src/legion-growth/legion-growth.css`
- Modify: `apps/web/src/styles.css`
- Modify: `packages/progression-core/README.md`
- Modify: `AGENTS.md`

**Exit**

- 軍團成長組合根檔只負責組合。
- Feature CSS 不再堆入全域檔。
- 專案規則明定短計畫、相關測試、一次批次審查與一次完整 Gate。

## Final Gate

1. 跑相關 Vitest。
2. 跑 `pnpm check` 一次。
3. 跑 `pnpm test:e2e` 一次。
4. 建置並部署既有 Cloudflare Pages。
5. 線上點擊驗證固定軍令與再戰閉環。
