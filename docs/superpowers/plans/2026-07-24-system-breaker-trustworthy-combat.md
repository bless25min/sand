# SYSTEM BREAKER Trustworthy Combat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every displayed combat rule real, explainable, previewable, and connected to the production AI endpoint.

**Architecture:** Extend canonical contracts in `shared-types`, implement deterministic scheduling and preview in focused `simulation-core` slices, and keep React as a projection. Proxy same-origin API requests in the Sites Worker without changing static navigation behavior.

**Tech Stack:** TypeScript, React, Vitest, fast-check, Playwright, Cloudflare Workers, CSS.

## Global Constraints

- Preserve seeded determinism and the 32-event cap.
- React and HTTP adapters must not decide outcomes.
- Add failing tests before behavior.
- Keep new files single-purpose and near 150 lines.
- Preserve the user-owned `docs/AI_DEVELOPMENT_SPEC.md` change.

---

## Task 1: Canonical trigger and cooldown state

**Files:** Modify `packages/shared-types/src/system-breaker/game-state.ts`; create `packages/simulation-core/src/system-breaker/chain/{resolve-module-targets,evaluate-module-trigger}.ts`; add focused tests.

- [ ] Add failing tests for every trigger, target gate, and cooldown readiness.
- [ ] Add `cooldownRemaining`, previous-round damage state, and structured event impact contracts.
- [ ] Implement target-cell resolution and trigger evaluation as pure functions.
- [ ] Run affected simulation-core tests.

## Task 2: Deterministic scheduler and round transition

**Files:** Modify `chain/{resolve-chain,apply-effect}.ts`, `run/{prepare-system-breaker-round,resolve-system-breaker-round}.ts`; create `run/preview-system-breaker-round.ts`.

- [ ] Add failing tests for staged/reactive activation, one-fire limit, repeat, cooldown decrement, and signed impacts.
- [ ] Replace unconditional board iteration with the stable scheduler.
- [ ] Emit explicit resource/effect events and preserve the 32-event cap.
- [ ] Implement preview by resolving the same pure run state.
- [ ] Run affected simulation-core tests and properties.

## Task 3: Decision and playback UI

**Files:** Create `components/{RoundPreview,ModuleRuleText}.tsx`; modify `RoundControls`, `SystemBoard`, `ModuleShop`, `ChainPlayback`, reducer/state, and focused CSS/tests.

- [ ] Add failing tests for preview values, counter detail, localized events, and active-cell projection.
- [ ] Render exact trigger/target/cooldown explanations and projected result.
- [ ] Project the current playback module to the board with accessible non-color state.
- [ ] Keep mobile layout and reduced-motion behavior.
- [ ] Run affected web tests and build.

## Task 4: Clean replay state

**Files:** Modify `system-breaker-reducer.ts` and its test.

- [ ] Add a failing regression test with prior events, selection, pending state, and feedback.
- [ ] Create a single run-start transition that clears ephemeral state and retains speed.
- [ ] Run the reducer test.

## Task 5: Production AI proxy

**Files:** Modify `apps/web/worker/index.ts`, hosting handler and tests; update concise hosting documentation/config only if required.

- [ ] Add failing tests for `/api/*` proxy, missing API base, and preserved SPA fallback.
- [ ] Route API requests to `API_BASE_URL` with method, body, and headers intact.
- [ ] Deploy/verify Worker API, configure the Sites runtime variable, and rebuild the web source.
- [ ] Verify `/health`, one AI generation, and deterministic fallback behavior.

## Task 6: Batch verification

- [ ] Run affected tests, then `pnpm check` once.
- [ ] Run production build and Playwright with normal-value fixtures.
- [ ] Inspect the consolidated diff for boundaries, dead code, file size, and user-owned changes.
- [ ] Commit the batch as one reviewable change.

