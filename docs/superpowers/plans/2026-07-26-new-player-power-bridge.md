# New Player Power Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry the player from first target selection through preview, recommended build, deterministic forge, and the next hunt.

**Architecture:** Add minimal tutorial-progress facts to the reducer, derive all guidance from the pure coach, reuse existing build and forge actions, and progressively disclose the loadout arsenal.

**Tech Stack:** React 19, TypeScript 6, CSS, Vitest, Vite.

## Global Constraints

- Do not change combat, content, loot, or forge balance.
- Do not add battle outcomes outside simulation-core.
- Keep guide state factual and minimal; derive copy and focus in the coach.
- Run affected tests during TDD and `pnpm check` once at completion.

---

### Task 1: Bridge first victory into the first power upgrade

**Files:**

- Modify: `apps/web/src/guild-rpg/state/game-state.ts`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Modify: `apps/web/src/guild-rpg/onboarding/first-hunt-coach.ts`
- Modify: `apps/web/src/guild-rpg/components/BattleThumbControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/GuildMobileStage.tsx`
- Modify: `apps/web/src/guild-rpg/components/ForgeWorkbench.tsx`
- Modify: `apps/web/src/guild-rpg/components/LoadoutEditor.tsx`
- Modify: relevant component CSS
- Test: reducer, coach, and component contract suites

- [ ] Write failing tests for explicit target acknowledgement and post-victory tutorial persistence.
- [ ] Run focused state and coach tests and confirm RED.
- [ ] Record target acknowledgement and derive target/preview/build/forge/next-hunt guidance.
- [ ] Add preview metrics for causal path, damage, kills, and Overkill.
- [ ] Route the focused deck into recommended Build activation and the existing forge action.
- [ ] End the tutorial only when the player starts the next non-tutorial hunt.
- [ ] Write failing loadout progressive-disclosure tests and confirm RED.
- [ ] Show the active route plus recommendations first, with an explicit full-arsenal expansion.
- [ ] Run all affected tests and complete the full guided path in a browser.
- [ ] Review the batch once, fix findings, run `pnpm check`, and commit.
