# SYSTEM BREAKER Meta Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact persistent loop where runs grow a fragment collection, unlock Hard difficulty, and update best scores.

**Architecture:** Keep profile and difficulty rules pure in a new `simulation-core/meta` slice, store one validated versioned profile in the web adapter, and pass selected loadout options into run creation. React renders choices and reward summaries without owning progression formulas.

**Tech Stack:** TypeScript, React, Vitest, Playwright, localStorage, CSS.

## Global Constraints

- No account, database, cloud sync, new currency, crafting, or daily system.
- One active fragment per run; duplicate bonus caps at 3.
- Normal is always available; Hard unlocks after the first Normal victory.
- Add failing tests before behavior.
- Preserve the user-owned `docs/AI_DEVELOPMENT_SPEC.md` change.

---

## Task 1: Profile and difficulty contracts

**Files:** Modify shared game state; create `simulation-core/src/system-breaker/meta/{create-system-breaker-profile,record-system-breaker-result,apply-difficulty}.ts` and tests.

- [ ] Add failing tests for defaults, fragment add/upgrade/cap, score records, victory count, and Hard unlock.
- [ ] Add `DifficultyId`, `SystemBreakerProfile`, and reward-summary contracts.
- [ ] Implement pure profile evolution and difficulty scaling.
- [ ] Run affected simulation-core tests.

## Task 2: Run integration

**Files:** Modify run creation, preparation, resolution, preview, and focused tests.

- [ ] Add failing tests for selected fragment, effective Hard targets/damage/instability, and score multiplier.
- [ ] Pass difficulty and fragment through canonical run options.
- [ ] Use core difficulty helpers in execution and preview.
- [ ] Run affected run and property tests.

## Task 3: Versioned storage and migration

**Files:** Replace single-fragment storage functions with profile load/save/migration functions and tests.

- [ ] Add failing tests for valid profile, malformed profile, and legacy fragment migration.
- [ ] Implement one profile key and preserve legacy data without duplicate migration.
- [ ] Keep the `StoragePort` boundary.
- [ ] Run storage tests.

## Task 4: Profile, loadout, and reward UI

**Files:** Create `components/{ProfileOverview,RunLoadout,MetaRewardSummary}.tsx`; modify contract, header/HUD, ending, app/reducer/state, and focused CSS/tests.

- [ ] Add failing reducer tests for selection, difficulty lock, profile update, and immediate replay.
- [ ] Render entry statistics, contract choices, active loadout, and ending rewards.
- [ ] Persist profile updates through one effect.
- [ ] Verify keyboard, focus, selected/disabled states, reduced motion, and 375px layout.

## Task 5: End-to-end loop

**Files:** Modify `apps/web/e2e/system-breaker.spec.ts`.

- [ ] Complete a normal run with normal-value rules.
- [ ] Assert fragment collection and Hard unlock.
- [ ] Start the next run with a selected fragment and observe its bonus.
- [ ] Reload and verify profile persistence.

## Task 6: Batch verification and release

- [ ] Run affected tests, then `pnpm check` once.
- [ ] Run production build and Playwright.
- [ ] Inspect the consolidated diff and commit the batch.
- [ ] Deploy the exact verified source and smoke-test generation, one run, replay, and persisted progression.

