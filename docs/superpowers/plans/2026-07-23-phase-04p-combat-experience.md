# Phase 04P Combat Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver one viewport-first command-turn battle with rule-owned Greyfang intent,
pre-contact archer volleys, readable unit state, and game-focused HUD feedback.

**Architecture:** Simulation Core owns movement plans and combat facts. Pixi Renderer
projects normalized state into deterministic points. Web feature adapters convert state
and deltas into small view models consumed by React components.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, Vitest, Playwright, Vite.

## Global Constraints

- Preserve the 2,000-point budget and persistent Canvas.
- No `Math.random`; all outcomes use injected or seeded randomness.
- React and PixiJS never own casualties, morale, or monster tactics.
- Keep new files single-purpose with explicit object inputs and return values.
- First viewport at 1280 × 720 contains the active tactical loop.

---

### Task 1: Rule-owned Greyfang movement

**Files:**
- Create: `packages/simulation-core/src/session/apply-monster-movement-plan.ts`
- Create: `packages/simulation-core/src/session/apply-monster-movement-plan.test.ts`
- Modify: `packages/simulation-core/src/session/advance-playable-turn.ts`
- Modify: `packages/simulation-core/src/session/playable-battle.test.ts`
- Modify: `packages/simulation-core/src/index.ts`

**Interfaces:**
- Consumes: `GreyfangMovementPlan`, `MonsterGroupState`, movement distance.
- Produces: `applyMonsterMovementPlan(input): MonsterGroupState`.

- [ ] Write tests proving planned target, speed, and `ENCIRCLING` survive movement.
- [ ] Run the focused tests and confirm failure because the adapter is absent.
- [ ] Implement the adapter and replace `moveMonsterToward` in playable turns with
      `planGreyfangMovement` plus the adapter.
- [ ] Run focused Simulation Core tests and confirm green.

### Task 2: Deterministic archer volley

**Files:**
- Create: `packages/simulation-core/src/session/resolve-ranged-volley.ts`
- Create: `packages/simulation-core/src/session/resolve-ranged-volley.test.ts`
- Modify: `packages/shared-types/src/events/battle-event.ts`
- Modify: `packages/simulation-core/src/session/resolve-fixed-order.ts`
- Modify: `packages/simulation-core/src/session/playable-battle.test.ts`
- Modify: `packages/simulation-core/src/index.ts`

**Interfaces:**
- Produces: `resolveRangedVolley({seed,tick,unit,monster})` returning updated monster,
  traceable events, `victory`, and deterministic loss facts.
- Trigger: archer `ATTACK` while distance is greater than 3 and at most 35.

- [ ] Write failing tests for deterministic pre-contact damage, event causes, and range.
- [ ] Run focused tests and verify the expected RED.
- [ ] Implement the pure volley resolver and integrate it before melee contact.
- [ ] Run focused tests and verify archer attack differs from melee attack.

### Task 3: Project morale, fatigue, and cohesion

**Files:**
- Modify: `packages/pixi-renderer/src/contracts/visual-unit-source.ts`
- Modify: `packages/pixi-renderer/src/points/create-visual-points.ts`
- Modify: `packages/pixi-renderer/src/points/create-visual-points.test.ts`
- Modify: `apps/web/src/game-session/create-battlefield-sources.ts`
- Modify: `apps/web/src/game-session/create-battlefield-sources.test.ts`

**Interfaces:**
- `VisualUnitSource` adds normalized `morale`, `fatigue`, and `cohesion`.
- Point projection deterministically maps them to opacity, formation spacing, and
  orientation stability.

- [ ] Add failing renderer and web-adapter tests for all three state channels.
- [ ] Run the focused tests and verify RED type/expectation failures.
- [ ] Implement the minimum deterministic projection and source mapping.
- [ ] Run focused tests and confirm green without changing combat outcomes.

### Task 4: Battlefield HUD view models

**Files:**
- Create: `apps/web/src/battlefield/create-battlefield-hud.ts`
- Create: `apps/web/src/battlefield/create-battlefield-hud.test.ts`
- Create: `apps/web/src/battlefield/BattlefieldHud.tsx`
- Create: `apps/web/src/battlefield/BattlefieldImpact.tsx`
- Modify: `apps/web/src/battlefield/BattlefieldDemo.tsx`
- Modify: `apps/web/src/game-session/create-command-feedback.ts`
- Modify: `apps/web/src/game-session/create-command-feedback.test.ts`

**Interfaces:**
- `createBattlefieldHud({battle,selectedUnitId,feedback})` returns objective, selected
  formation, enemy intent, status bars, and optional loss pulse.

- [ ] Write failing adapter tests for `HUNTING`, `ENCIRCLING`, ranged impact, and melee
      impact labels.
- [ ] Implement the pure HUD adapter, labels, bars, and impact component.
- [ ] Wire the view model into `BattlefieldDemo`; keep Canvas ownership unchanged.
- [ ] Run battlefield and command-feedback tests.

### Task 5: Viewport-first combat screen

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/App.test.tsx`
- Modify: `apps/web/src/game-session/PlayableExpedition.tsx`
- Modify: `apps/web/src/game-session/PlayableExpedition.test.tsx`
- Modify: `apps/web/src/game-session/UnitRoster.tsx`
- Modify: `apps/web/src/game-session/CommandBar.tsx`
- Modify: `apps/web/src/styles.css`
- Modify: `apps/web/src/game-session/game-session.css`
- Modify: `apps/web/src/game-session/playable-layout.css`
- Modify: `apps/web/src/battlefield/battlefield-feedback.css`

**Interfaces:**
- Active session stays first; static loop/growth evidence moves into a closed `<details>`.
- Command buttons expose role-specific hints without adding new rule ownership.

- [ ] Write React tests requiring a closed developer disclosure and combat-first heading.
- [ ] Confirm tests fail against the current dashboard layout.
- [ ] Implement compact top bar, stage overlays, 65/35 cockpit, responsive command deck,
      semantic tokens, 150–300 ms motion, focus styles, and reduced-motion behavior.
- [ ] Run affected React tests, lint the changed files, and check formatting.

### Task 6: End-to-end gate

**Files:**
- Modify: `apps/web/e2e/battlefield.spec.ts`
- Create: `docs/reviews/phase-04p-combat-experience-validation.md`

- [ ] Add E2E assertions for one persistent Canvas, viewport height under 900 px, visible
      objective/intent, archer ranged losses before contact, melee contact, formation,
      retreat, and zero page errors.
- [ ] Run `pnpm test:e2e` and fix only Phase 04P regressions.
- [ ] Run `pnpm check` once, inspect the final diff, and record exact evidence.
- [ ] Commit the reviewed batch, push the feature branch, fast-forward the default
      branch, deploy `apps/web/dist` to `ai-expedition-legion-rpg`, and verify production
      HTML/assets plus the click path.
