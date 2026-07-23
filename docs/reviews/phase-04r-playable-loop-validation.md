# Phase 04R Playable Loop Validation

Date: 2026-07-23  
Mode: 0-to-1 Exploration  
Implementation commit: `57eaa7200434d9922f24f0df51856ccc802b8068`

## Player-Visible Outcome

The primary page now exposes a player-completable fixed-command loop:

1. Select one of four army units.
2. Issue advance, hold, attack, formation, or retreat orders.
3. Resolve movement, contact, casualties, routing, victory, or defeat in
   `simulation-core`.
4. Recover deterministic battlefield drops.
5. Return to base and craft the Hornplate Shield.
6. Equip the first heavy infantry regiment.
7. Start a stronger second battle while preserving casualties and equipment.

PixiJS receives only current simulation sources. It does not create battle outcomes or
synthetic casualty points.

## Architecture Evidence

- Fixed orders are a discriminated shared contract.
- Battle turns, enemy response, casualties, routing, defeat, reward facts, and events
  are owned by `packages/simulation-core`.
- Web session code composes battle and progression results without inventing reward
  counts.
- Feature state, reducers, adapters, controls, readouts, and styles are split by clear
  input/output and change reason.
- Legion-growth fixtures, metrics, orchestration, cards, and styles no longer share one
  oversized composition file.
- Batch size, test cadence, review cadence, and split rules are recorded in `AGENTS.md`.

## Local Verification

- Focused red-green regression coverage added for:
  - enemy response to hold and formation orders;
  - contact during formation changes;
  - reachable player defeat and routing;
  - Simulation Core-derived loot;
  - rematch recovery reset;
  - Pixi projection without invented casualties;
  - complete same-seed order replay.
- `pnpm check`: exit `0`.
  - TypeScript, ESLint, Prettier, dependency-cruiser, Knip, Vitest, and production build
    passed.
  - Vitest: 54 files, 161 tests passed.
- `pnpm test:e2e`: exit `0`.
  - Playwright: 1 complete player loop passed.
- Consolidated code review: `GO`; no remaining Critical or Important finding.

Wrangler printed the known sandbox-only debug-log `EPERM` warning during its dry-run,
but both build commands completed with exit `0`. The generated Worker declaration was
restored and was not included in the feature commit.

## Cloudflare Pages Evidence

- Project: `ai-expedition-legion-rpg`
- Environment: Production
- Branch metadata: `main`
- Source: `57eaa72`
- Deployment ID: `88035d1c-61c6-463c-a141-bfa0b0380b87`
- Immutable URL: `https://88035d1c.ai-expedition-legion-rpg.pages.dev/`
- Canonical URL: `https://ai-expedition-legion-rpg.pages.dev/`
- Production bundle: `/assets/index-ChVHA9PW.js`
- Homepage and bundle: `200 OK`
- Bundle MIME: `application/javascript`

## Live Browser Evidence

The canonical production URL completed the real click path:

- `推進` moved Tick `0 → 1`.
- `變換陣形` moved Tick `1 → 2` and changed heavy infantry to `LINE`.
- Four attacks reached a traceable victory and reduced wolves to `0/1200`.
- Recovery, base return, crafting, and equipment controls all appeared in sequence.
- The rematch displayed `第 2 戰`, wolves `1600/1600`, one Canvas, and 2,000 points.
- Heavy infantry preserved `981/1000`, `LINE`, 98% morale, and `角甲重盾`.
- Browser console errors: `0`.

## Remaining Scope

This is the first playable vertical slice, not the complete product specification.
Additional routes, monster families, full order vocabulary, AI command generation,
persistence, account systems, and production game content remain later phases.
