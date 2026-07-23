# AI System Breaker Roguelike Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a complete 8–12 minute SYSTEM BREAKER run: prompt-generated world, board economy, deterministic seven-round combat, boss, ending, saved fragment, and replay code.

**Architecture:** Keep canonical contracts in `shared-types`, all game outcomes in pure `simulation-core` vertical slices, Workers AI behind one adapter, and React as an imperative shell. The legacy expedition remains available only through `?legacy=1`.

**Tech Stack:** TypeScript, React, Vite, Vitest, fast-check, Hono, Cloudflare Workers AI, Playwright, CSS.

## Global Constraints

- Follow `docs/superpowers/specs/2026-07-24-ai-system-breaker-roguelike-design.md`.
- No image, sprite, 3D, audio, arbitrary code, account, database, or multiplayer work.
- Inject seeded randomness; never call `Math.random()` in game code.
- Keep files single-purpose and near 150 lines; expose only package-root APIs.
- Add a failing test before each implementation step; finish each task with its affected test.
- Preserve the user-owned change in `docs/AI_DEVELOPMENT_SPEC.md`.

---

## Task 1: Canonical Genome Contract and Safe Generation

**Files:** Create `packages/shared-types/src/system-breaker/{game-genome,game-state,index}.ts`; modify `packages/shared-types/src/index.ts`; create `packages/simulation-core/src/system-breaker/genome/{normalize-game-genome,validate-game-genome,create-fallback-game-genome,probe-game-genome}.ts` and colocated tests; modify `packages/simulation-core/src/index.ts`.

- [ ] Write tests proving invalid enums/ranges are rejected, unsafe names are normalized, the same prompt/seed produces the same 12-module/seven-threat fallback, and a valid genome passes the fixed-strategy probe.
- [ ] Define stable IDs: `PROGRESS | INTEGRITY | INSTABILITY | CREDITS`, registered triggers/effects, five module roles, threat/counter/ending types, and:

```ts
normalizeGameGenome(input: unknown, seed: string): GameGenome | null
validateGameGenome(genome: GameGenome): GenomeValidation
createFallbackGameGenome(input: { prompt: string; seed: string }): GameGenome
probeGameGenome(genome: GameGenome): GenomeProbe
```

- [ ] Implement clamping, plain-text sanitation, role-count validation, two-rule validation, boss validation, and a deterministic Chinese fallback assembled from prompt hash plus seed.
- [ ] Run `pnpm --filter @expedition/simulation-core test -- system-breaker/genome`.

## Task 2: Board Economy, Chain Resolver, and Seven-Round Run

**Files:** Create `packages/simulation-core/src/system-breaker/board/{create-board-state,apply-board-command}.ts`; `chain/{resolve-chain,apply-effect}.ts`; `run/{create-system-breaker-run,create-round-offer,resolve-system-breaker-round,encode-run-code}.ts`; colocated tests; export public APIs from `packages/simulation-core/src/index.ts`.

- [ ] Write focused tests for buy, sell, placement, occupied/blocked cells, same-name level-one fusion, maximum level two, fixed refresh, edge lock, overload, reversed direction, repeat punishment, death, victory, fragment reward, and replay-code round trip.
- [ ] Write fast-check properties: identical genome/actions/seed are equal; every number is finite and bounded; every chain stops at 32 events and emits `CHAIN_LIMIT_REACHED` when truncated.
- [ ] Implement only these public commands and outcomes:

```ts
createSystemBreakerRun(genome: GameGenome, fragment?: SystemFragment): SystemBreakerRun
applyBoardCommand(run: SystemBreakerRun, command: BoardCommand): CommandResult
resolveSystemBreakerRound(run: SystemBreakerRun): RoundResult
encodeRunCode(genome: GameGenome): string
decodeRunCode(code: string): GameGenome
```

- [ ] Make rounds 1–2 use 2×2, expand to 3×3 at round 3, guarantee the fusion duplicate, reveal every threat, resolve deterministic event logs, and implement the two-phase round-seven boss.
- [ ] Run `pnpm --filter @expedition/simulation-core test -- system-breaker`.

## Task 3: Workers AI Genome Endpoint with Deterministic Fallback

**Files:** Modify `apps/worker-api/wrangler.jsonc` and `apps/worker-api/src/index.ts`; create `apps/worker-api/src/system-breaker/{game-genome-schema,create-ai-game-genome,create-game-genome-response,game-genome-route}.ts` and tests.

- [ ] Write route tests for prompt length 1–240, caller seed preservation, CORS, valid AI response, invalid AI response, thrown AI error, and eight-second timeout fallback.
- [ ] Add `AI` binding and one adapter call to `@cf/meta/llama-3.1-8b-instruct-fast`; request JSON only and forbid code, formulas, or unknown effect IDs in the system prompt.
- [ ] Implement `POST /game-genomes` returning `{ genome, source: 'AI' | 'FALLBACK', seed }`; normalize, validate, and probe every AI draft before accepting it.
- [ ] Keep route and timeout injectable so tests never call the network; retain `/health`.
- [ ] Run `pnpm --filter @expedition/worker-api test`.

## Task 4: Complete Player-Facing SYSTEM BREAKER

**Files:** Move current app composition to `apps/web/src/legacy/LegacyExpedition.tsx`; replace `apps/web/src/App.tsx`; create `apps/web/src/system-breaker/{SystemBreakerApp,system-breaker-reducer,system-breaker-api,system-breaker-storage}.ts(x)` plus `components/{WorldPrompt,WorldContract,ResourceStrip,SystemBoard,ModuleShop,RoundControls,ChainPlayback,RunEnding}.tsx`; create `apps/web/src/system-breaker/system-breaker.css`; modify `apps/web/vite.config.ts`; add colocated tests.

- [ ] Write UI tests for sample/custom prompt, AI/fallback badge, contract acceptance, shop purchase, placement, fusion, seven executes, visible chain changes, boss ending, fragment persistence, replay export/import, API failure fallback, and `?legacy=1`.
- [ ] Route default traffic to SYSTEM BREAKER and legacy only to `?legacy=1`; proxy local `/api` to Worker and read production base URL from `VITE_API_BASE_URL`.
- [ ] Build the full state reducer around core commands; never reproduce price, damage, scoring, round, or boss rules in React.
- [ ] Render a responsive CSS-only terminal board with four live resources, three shop choices, cell targeting, actionable disabled reasons, upcoming threat, speed control, and at-most-ten-second chain playback.
- [ ] Persist only one `SystemFragment`; provide copy/import controls for canonical run codes and an instant replay path.
- [ ] Run `pnpm --filter @expedition/web test` and `pnpm --filter @expedition/web build`.

## Task 5: End-to-End Acceptance, Architecture Checks, and Release

**Files:** Create `apps/web/e2e/system-breaker.spec.ts`; update only required test config, root scripts, and concise product documentation.

- [ ] Add Playwright coverage that starts a sample world, completes all seven rounds, sees either victory or death, exports a run code, reloads it, and opens `?legacy=1`.
- [ ] Run `pnpm test:e2e`, then `pnpm check`; fix only failures caused by this feature and keep dependency/dead-code rules green.
- [ ] Inspect diffs for accidental edits, file-size drift, cross-package internals, duplicated formulas, `Math.random()`, and forbidden assets.
- [ ] Commit source with the plan/spec traceable, deploy API and web through the repository’s existing Cloudflare configuration, and verify `/health`, default game load, one generated genome, and legacy routing online.
- [ ] Report changed files, exact checks, deployment identifiers/URLs, remaining risks, and no speculative completion claims.
