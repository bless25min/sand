# Perceivable Battle Feedback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every fixed order immediately visible and understandable while preserving deterministic battle rules.

**Architecture:** Keep battle outcomes in `simulation-core`. Reconcile point snapshots inside `pixi-renderer`, derive player-facing feedback through pure web display-model functions, and keep React as the thin composition shell.

**Tech Stack:** TypeScript, React, PixiJS, Vitest, Playwright

**Status:** Implemented; `pnpm check` passes with 177 tests and `pnpm test:e2e` passes 2 scenarios.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-23-perceivable-battle-feedback-design.md`.
- Do not change combat formulas, AI decisions, progression, loot, or shared battle contracts.
- Add a failing test before each production behavior.
- Keep feature files single-purpose and near 150 lines.
- Run affected tests per task, then one `pnpm check` and one `pnpm test:e2e`.

---

### Task 1: Persistent Point Reconciliation

**Files**

- Create: `packages/pixi-renderer/src/points/reconcile-visual-points.ts`
- Create: `packages/pixi-renderer/src/points/reconcile-visual-points.test.ts`
- Modify: `packages/pixi-renderer/src/mount/mount-point-cloud.ts`
- Modify: `packages/pixi-renderer/src/index.ts`

**Interface**

- `reconcileVisualPoints(previous, next): VisualPoint[]`
- Match points by unit and local order, animate toward the new simulation position, and turn removed points into fading casualties.

- [ ] Write tests proving unchanged point identity, previous-position animation origins, stopped target positions, and casualty surplus.
- [ ] Run `pnpm vitest run packages/pixi-renderer/src/points/reconcile-visual-points.test.ts`; expect failure because the export is missing.
- [ ] Implement the pure reconciler and use it from `MountedPointCloud.setPoints`.
- [ ] Normalize initial targets to initial positions so a Tick does not visually run ahead of simulation state.
- [ ] Re-run the focused tests; expect pass.
- [ ] Commit `feat: preserve battlefield visual continuity`.

### Task 2: Mount Pixi Once

**Files**

- Modify: `apps/web/src/battlefield/BattlefieldDemo.tsx`
- Modify: `apps/web/e2e/battlefield.spec.ts`

**Interface**

- The initial effect owns mount/destroy.
- A separate update effect forwards the latest points to `setPoints`, including updates that arrive while mount is pending.

- [ ] Add an E2E assertion that a marker attached to the canvas survives an order.
- [ ] Run `pnpm test:e2e`; expect the marker assertion to fail because the canvas is replaced.
- [ ] Split mount lifecycle from point updates and retain the latest pending snapshot.
- [ ] Re-run the targeted E2E; expect the canvas identity assertion to pass.

### Task 3: Pure Command Feedback Model

**Files**

- Create: `apps/web/src/game-session/create-command-feedback.ts`
- Create: `apps/web/src/game-session/create-command-feedback.test.ts`
- Modify: `apps/web/src/game-session/playable-session-types.ts`
- Modify: `apps/web/src/game-session/reduce-playable-session.ts`
- Modify: `apps/web/src/game-session/reduce-playable-session.test.ts`

**Interface**

- `createCommandFeedback({ previousBattle, battle, selectedUnitId }): CommandFeedback | null`
- Output includes action, label, tone, summary, movement, troop deltas, morale deltas, and formation when applicable.

- [ ] Write focused tests for advance, hold, attack/contact, formation, retreat, and no-order input.
- [ ] Add a reducer test proving `previousBattle` is captured only when issuing an order.
- [ ] Run both focused test files; expect missing model and state failures.
- [ ] Implement the display model and previous snapshot capture without changing simulation rules.
- [ ] Re-run both focused test files; expect pass.

### Task 4: Battlefield Intent Overlay

**Files**

- Create: `apps/web/src/battlefield/create-battlefield-overlay.ts`
- Create: `apps/web/src/battlefield/create-battlefield-overlay.test.ts`
- Modify: `apps/web/src/battlefield/BattlefieldDemo.tsx`
- Modify: `apps/web/src/battlefield/battlefield-feedback.css`

**Interface**

- `createBattlefieldOverlay({ sources, selectedUnitId, action }): BattlefieldOverlay`
- Output selected position, optional target line, and one of `idle`, `advance`, `hold`, `attack`, `formation`, or `retreat`.

- [ ] Write failing tests for selection, target-line actions, hold, and retreat.
- [ ] Implement the pure overlay model.
- [ ] Render a non-interactive SVG target line, selected-unit marker, action marker, and accessible label.
- [ ] Run the overlay tests; expect pass.

### Task 5: Tactical Cockpit and Command Banner

**Files**

- Create: `apps/web/src/game-session/CommandFeedbackBanner.tsx`
- Modify: `apps/web/src/game-session/PlayableExpedition.tsx`
- Modify: `apps/web/src/game-session/BattleReadout.tsx`
- Modify: `apps/web/src/game-session/game-session.css`
- Modify: `apps/web/e2e/battlefield.spec.ts`

**Interface**

- `CommandFeedbackBanner({ feedback })` renders an `aria-live` result with distinct action and delta text.
- Desktop cockpit places battlefield and controls in one grid row; mobile uses a sticky command surface.

- [ ] Add E2E failures for viewport overlap and distinct feedback for all five orders.
- [ ] Compose the feedback model, banner, overlay props, and two-column cockpit.
- [ ] Keep technical diagnostics compact and secondary to command feedback.
- [ ] Run `pnpm vitest run apps/web/src/game-session apps/web/src/battlefield`; expect pass.
- [ ] Run `pnpm test:e2e`; expect pass.
- [ ] Commit `feat: add perceptible battle command feedback`.

### Task 6: Batch Gate

- [ ] Run `pnpm check`; expect all checks and unit tests to pass.
- [ ] Run `pnpm test:e2e`; expect the playable loop scenario to pass.
- [ ] Inspect the production-sized page at 1280 x 720 and confirm controls and battlefield remain simultaneously visible during input.
- [ ] Review the consolidated diff for unrelated changes, oversized files, and architecture boundary violations.
- [ ] Commit any verification-only corrections as `fix: close battle feedback verification gaps`.
