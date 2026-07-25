# SYSTEM BREAKER Trustworthy Combat Design

Date: 2026-07-24  
Status: Approved by the user's instruction to complete the recommended work in sequence.

## Outcome

Every rule shown to the player must affect the deterministic simulation. Before execution, the player can predict the likely result; after execution, the interface explains why it happened. The existing seven-round, no-art structure remains intact.

## Batch Boundary

This batch owns trigger timing, target connectivity, cooldowns, round preview, event explanations, replay-state cleanup, and production AI routing. It does not add accounts, cloud saves, new art, multiplayer, or an endless mode.

## Trigger Contract

- `ROUND_START`: first deterministic stage of every round.
- `FIXED_TIME`: second deterministic stage of every round.
- `DAMAGED`: fires when the previous round damaged integrity.
- `DISABLED`: fires when the module's cell is blocked or locked.
- `ADJACENT_TRIGGER`: fires after an orthogonally adjacent module fired in the same chain.
- `RESOURCE_THRESHOLD`: fires after progress reaches half the current target or instability reaches 50.
- A module fires at most once per round, except `repeatOnce`.
- Reactive triggers are evaluated in stable board order until no new module can fire.

## Target and Cooldown Contract

- `SELF` is always connected.
- Directional, adjacent, row, and all targets require at least one available module in their target cells.
- Target connectivity gates activation; it does not create a second hidden multiplier.
- Cooldown `N` means the module skips the next `N` rounds after firing.
- `ModuleInstance.cooldownRemaining` is canonical run state and is decremented only when preparing a new round.
- Locked modules do not fire unless their trigger is `DISABLED`.

## Preview and Explanation

- `previewSystemBreakerRound(run)` derives its result from the same pure resolver used by execution.
- Preview shows projected progress versus target, success or failure, integrity, instability, credits, triggered count, and blocked count.
- Counter UI names the affected role and exact multiplier.
- Resource events identify the resource and signed delta.
- Protection, amplification, revival, lock, overload, counter, and boss phase are expressed as player-readable events.
- Playback projects the current module event back onto its board cell.
- Technical IDs may remain secondary metadata but never replace the Chinese explanation.

## Replay State

Starting or replaying a run clears pending results, selected modules, visible events, feedback, and prior chain logs. The chosen playback speed may persist as a user preference.

## Production AI Route

- The browser continues to call same-origin `/api/game-genomes`.
- The Sites Worker proxies `/api/*` to the dedicated Worker API through an `API_BASE_URL` environment variable.
- Non-API navigation continues to use the static app-shell fallback.
- Provider, validation, timeout, or proxy failure still produces the deterministic local fallback.
- The contract badge remains the source of truth: `AI 編譯` or `安全生成`.

## Module Boundaries

- `shared-types`: canonical trigger, cooldown, preview, and event contracts.
- `simulation-core/chain`: trigger scheduling, target connectivity, and effect events.
- `simulation-core/run`: preview, round transition, and cooldown progression.
- `web/system-breaker`: presentation only; no duplicated outcome formula.
- `web/hosting`: same-origin API proxy only.

## Acceptance

- Focused tests prove every trigger, target gate, cooldown, counter, and preview invariant.
- A reducer regression test proves replay starts with an empty log and selection.
- Hosting tests prove API requests proxy while navigation still falls back to `index.html`.
- UI tests prove preview and localized event values use the canonical result.
- A normal-value E2E run completes without rewriting all modules to 30 or threats to 1.
- `pnpm check`, production build, and live AI/fallback smoke tests pass.
