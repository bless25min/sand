# Active Enemy Pressure Implementation Plan

> **For agentic workers:** Execute this player-visible batch with direct TDD. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every hero cast resolve one visible deterministic enemy response while activating defense, HP, speed, healing, guards, and Boss openings in the current atomic skill engine.

**Architecture:** `simulation-core` owns enemy intent, counterattack resolution, living-order reconciliation, guard routing, weakness events, and Boss phase activation. Shared types carry the cross-package intent contract. React and Pixi only project the exact intent and events.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, Vitest 4, Playwright 1.61, Vite 8, Cloudflare Pages.

## Global Constraints

- No multipliers, critical hits, random hit chance, `Math.random`, or UI-owned battle outcomes.
- Preserve protected `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Run affected tests during TDD, then one `pnpm.cmd check`, one managed `pnpm.cmd test:e2e`, and verify port 4173 closes.

### Task 1: Deterministic enemy intent and response

**Files:**

- Modify: `packages/shared-types/src/guild-rpg/battle-state.ts`
- Create: `packages/simulation-core/src/guild-rpg/enemy-pressure/resolve-enemy-pressure.ts`
- Test: `packages/simulation-core/src/guild-rpg/enemy-pressure/resolve-enemy-pressure.test.ts`

- [ ] Write failing tests for target selection, additive defense, guard consumption, speed dodge, enemy cycling, and defeat.
- [ ] Run the test and require failures because the enemy-pressure API does not exist.
- [ ] Implement `previewEnemyPressure()` and `resolveEnemyPressure()` as one deterministic rule source.
- [ ] Rerun the focused test and require PASS.

### Task 2: Current skill engine activates enemies and hunt identity

**Files:**

- Modify: `packages/shared-types/src/guild-rpg/hunt.ts`
- Create: `packages/simulation-core/src/guild-rpg/skills/resolve-hunt-mechanics.ts`
- Modify: `packages/simulation-core/src/guild-rpg/skills/resolve-skill.ts`
- Modify: `packages/simulation-core/src/guild-rpg/skills/resolve-skill-component.ts`
- Modify: `apps/web/src/guild-rpg/state/create-skill-engine-content.ts`
- Test: `packages/simulation-core/src/guild-rpg/skills/active-hunt-mechanics.test.ts`

- [ ] Write failing tests proving guards redirect a selected boss, weakness creates one additive event, Boss phase activates once, and dead heroes do not block the next actor.
- [ ] Run focused tests and verify the expected missing behavior.
- [ ] Add active weakness fields when hunts are assembled, route guarded targets, activate phases, resolve one enemy response after each cast, and reconcile living order.
- [ ] Rerun focused skill, preview, and reducer tests and require PASS.

### Task 3: Battlefield-native telegraph and defeat flow

**Files:**

- Modify: `apps/web/src/guild-rpg/components/{BattleScreen,CombatBattlefield,BattlefieldUnitControls,BattleCommandDock}.tsx`
- Modify: `apps/web/src/guild-rpg/presentation/{battle-scene,visual-events,combat-beats}.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/{contracts,draw-effects}.ts`
- Modify: `apps/web/src/guild-rpg/guild-combat.css`
- Test: colocated Web and renderer tests

- [ ] Write failing component/presentation tests for intent source, target result, incoming HP ghost, enemy-response beat, and usable defeat dock.
- [ ] Run the focused tests and verify RED.
- [ ] Project the formal intent into the scene, unit controls, route line, animation, accessible labels, and defeat action.
- [ ] Rerun focused tests and require PASS without adding duplicate cards or overlays.

### Task 4: Replace stale campaign language

**Files:**

- Modify: `packages/game-data/src/guild-rpg/combo/hunts.ts`
- Modify: `apps/web/src/guild-rpg/components/QuestBoard.tsx`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

- [ ] Add a failing render test rejecting old Build terms and requiring current element, specialization, guard, and trigger guidance.
- [ ] Derive the hunt brief from the active drop pool and enemy guard/weakness fields.
- [ ] Rerun focused content and component tests and require PASS.

### Task 5: Release gate

- [ ] Review the consolidated diff against the design and fix only batch findings.
- [ ] Run `pnpm.cmd check`.
- [ ] Run managed `pnpm.cmd test:e2e` and confirm port 4173 is closed.
- [ ] Commit, push `codex/project-expedition-mvp`, deploy the exact build to Cloudflare Pages, and verify live mobile interaction and console.
