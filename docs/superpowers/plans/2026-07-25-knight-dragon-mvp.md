# Knight & Dragon Inspired Guild RPG MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline with direct TDD.

**Goal:** Deliver one complete, replayable guild RPG loop: prepare, quest, battle, loot, equip,
sell, level, unlock, save, and replay.

**Architecture:** Add a vertical `guild-rpg` slice across stable contracts, data, pure simulation,
and the web adapter. Battle outcomes remain deterministic in `simulation-core`; React owns only
interaction, timing, persistence, and presentation. The existing prototypes remain available only
through explicit query parameters.

**Tech Stack:** TypeScript, React, Vite, Vitest, Testing Library, CSS, versioned localStorage.

## Batch Contract

This is one player-visible batch. Internal phases are implementation checkpoints, not separate
tasks, reviews, commits, or delegation units.

Completion means a fresh browser can:

1. enter an unlocked quest with three adventurers;
2. select enemies and issue the ready leader's attack or skill;
3. toggle leader auto mode and 1x/2x display speed;
4. win or lose deterministically from the same seed and choices;
5. receive XP, gold, and two text-only equipment drops;
6. compare and equip, keep, or sell each drop;
7. unlock the next quest, replay, and retain progress after reload.

## Phase 1: Contracts, Content, and Battle Core

**Create:**

- `packages/shared-types/src/guild-rpg/game-state.ts`
- `packages/shared-types/src/guild-rpg/index.ts`
- `packages/game-data/src/guild-rpg/adventurers.ts`
- `packages/game-data/src/guild-rpg/skills.ts`
- `packages/game-data/src/guild-rpg/equipment.ts`
- `packages/game-data/src/guild-rpg/quests.ts`
- `packages/game-data/src/guild-rpg/index.ts`
- `packages/simulation-core/src/guild-rpg/battle/create-battle.ts`
- `packages/simulation-core/src/guild-rpg/battle/advance-battle.ts`
- `packages/simulation-core/src/guild-rpg/battle/choose-auto-action.ts`
- `packages/simulation-core/src/guild-rpg/battle/resolve-action.ts`
- `packages/simulation-core/src/guild-rpg/battle/battle.test.ts`

**Modify:** each package root `index.ts`.

Write failing tests first for:

- Speed fills independent gauges and pauses when the manual leader is ready.
- Basic attack, focused shot, guard/taunt, and heal produce traceable battle events.
- Enemies target the highest-threat living hero with stable tie-breaking.
- A fixed seed plus identical commands produces identical state.
- Death, victory, and defeat cannot leave invalid gauges or HP.

Implement immutable pure functions with explicit `BattleState -> BattleState` output. Use injected
`RandomSource`; never call `Math.random`. Keep animation speed outside the simulation.

Run:

`node_modules/.bin/vitest.cmd run packages/simulation-core/src/guild-rpg/battle`

## Phase 2: Loot, Equipment, and Progression

**Create:**

- `packages/simulation-core/src/guild-rpg/profile/create-profile.ts`
- `packages/simulation-core/src/guild-rpg/profile/start-quest.ts`
- `packages/simulation-core/src/guild-rpg/rewards/generate-rewards.ts`
- `packages/simulation-core/src/guild-rpg/rewards/apply-rewards.ts`
- `packages/simulation-core/src/guild-rpg/equipment/resolve-item-choice.ts`
- `packages/simulation-core/src/guild-rpg/profile/profile.test.ts`
- `packages/simulation-core/src/guild-rpg/index.ts`

Write failing tests first for:

- Victory grants deterministic XP, gold, and two valid drops; defeat grants nothing.
- Five rarity tiers scale values and 0-2 affixes come only from the approved pool.
- Equip swaps the previous item safely, keep respects the 20-slot cap, and sell grants gold.
- XP can level repeatedly, the next quest unlocks once, and best clear time only improves.

Keep item generation, stat aggregation, item choice, and progression as separate pure functions.
Do not reuse legion equipment contracts whose troop semantics do not match adventurers.

Run:

`node_modules/.bin/vitest.cmd run packages/simulation-core/src/guild-rpg`

## Phase 3: Reducer, Save, and Playable UI

**Create:**

- `apps/web/src/guild-rpg/GuildRpgApp.tsx`
- `apps/web/src/guild-rpg/state/game-reducer.ts`
- `apps/web/src/guild-rpg/state/game-reducer.test.ts`
- `apps/web/src/guild-rpg/storage/guild-save.ts`
- `apps/web/src/guild-rpg/storage/guild-save.test.ts`
- `apps/web/src/guild-rpg/hooks/use-battle-clock.ts`
- `apps/web/src/guild-rpg/components/GuildScreen.tsx`
- `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- `apps/web/src/guild-rpg/components/RewardScreen.tsx`
- `apps/web/src/guild-rpg/components/AdventurerCard.tsx`
- `apps/web/src/guild-rpg/guild-rpg.css`

**Modify:**

- `apps/web/src/App.tsx`
- `apps/web/src/App.test.tsx`

Write failing reducer and storage tests first for the complete route:

`guild -> battle -> victory -> reward choices -> guild -> reload`

The reducer owns screen transitions and delegates all rules to `simulation-core`. The clock sends
fixed simulation steps; 2x changes wall-clock cadence only. Persist only validated version-1
profiles, recover from corrupt saves, and never persist an unfinished battle.

The UI must expose:

- three readable adventurer cards with level, role, stats, equipment, and XP;
- three quest cards with lock, reward, clears, and best-time state;
- visible gauges, HP, selected target, threat, combat log, skill readiness, and auto toggle;
- two reward cards with rarity, main stat, affixes, comparison, and equip/keep/sell actions;
- keyboard focus, disabled-state explanations, responsive layout, and reduced-motion support.

Make the guild RPG the default. Preserve prior builds at `?prototype=system-breaker` and
`?prototype=expedition`.

Run:

`node_modules/.bin/vitest.cmd run apps/web/src/guild-rpg apps/web/src/App.test.tsx`

## Consolidated Completion Gate

Perform one batch review against the approved design and fix its findings inline. Then run:

1. `pnpm typecheck:tests`
2. `pnpm check`
3. `pnpm --filter @expedition/web build`

Manually smoke-test one victory, one defeat or retreat, all three item decisions, quest unlock,
replay, and reload persistence. Confirm both prototype query parameters still render. Commit the
complete batch once, excluding `docs/AI_DEVELOPMENT_SPEC.md`, then deploy the exact committed source
through Sites and verify the production URL plus its saved version/deployment state.
