# Guild RPG Completion Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `executing-plans`. Project policy prohibits
> subagent-driven development unless the user explicitly requests delegation.

**Goal:** Deliver observable combo playback, three complete hunts, and a production-connected,
smaller Guild RPG deployment.

**Architecture:** Simulation resolves commands and rewards once; Web reveals immutable events.
Hunts remain declarative data. Pages advanced mode reuses the existing hosting adapter.

**Tech Stack:** TypeScript, React 19, Vite 8/Rolldown, Vitest, Cloudflare Pages and Workers.

## Global Constraints

- No `Math.random`; use injected `RandomSource`.
- React, timers, hosting, and rendering never decide battle or loot outcomes.
- Preserve the legacy prototype query switches and versioned saves.
- Use affected tests during each batch and `pnpm check` once after all source changes.

---

### Task 1: Observable Command Playback

**Files:**

- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Create: `apps/web/src/guild-rpg/hooks/use-combo-playback.ts`
- Create: `apps/web/src/guild-rpg/components/ComboPlaybackScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/ComboPlayback.tsx`
- Modify: `apps/web/src/guild-rpg/GuildRpgApp.tsx`
- Modify: `apps/web/src/guild-rpg/battle-command.css`
- Test: reducer and component contract tests under `apps/web/src/guild-rpg`

**Interfaces:**

- Produces: `ComboPlaybackState { eventStartIndex; visibleEventCount }`
- Produces actions: `ADVANCE_PLAYBACK`, `COMPLETE_PLAYBACK`
- Consumes: immutable `GuildComboRuntime.events`

- [x] Write reducer tests showing release enters playback, active completion returns to battle, and
      terminal completion enters rewards without changing the resolved battle.
- [x] Run the focused reducer test and verify the new assertions fail because playback is absent.
- [x] Implement the playback state/actions and rerun the focused reducer test.
- [x] Write rendering and hook-contract tests for event cursor, skip, 2x, and reduced motion; verify RED.
- [x] Implement the playback screen, clock, cursor filtering, and CSS; verify focused GREEN.
- [x] Run the guild-rpg affected tests and commit `feat: play released combo events`.

### Task 2: Complete Mine and Shrine Hunts

**Files:**

- Modify: `packages/game-data/src/guild-rpg/combo/hunts.ts`
- Modify: `packages/game-data/src/guild-rpg/combo/combo-content.test.ts`
- Modify only if validation requires it: `packages/game-data/src/guild-rpg/combo/validate-content.ts`

**Interfaces:**

- Consumes: existing `EnemyTraitDefinition`, three Build IDs, and hunt reward tables.
- Produces: traits and `annihilationChest` for all three hunts.

- [x] Add content tests requiring every enemy to expose a trait, every Build to be favored in every
      hunt, and every hunt to expose a boss-plus-guards chest; verify RED.
- [x] Add mine and shrine traits and exclusive chests using only the existing grammar.
- [x] Run combo content, golden hunt, and reward tests; verify GREEN.
- [x] Commit `feat: complete mine and shrine hunt identities`.

### Task 3: Production API, Metadata, and Chunks

**Files:**

- Modify: `apps/web/worker/index.ts`
- Modify: `apps/web/vite.worker.config.ts`
- Modify: `scripts/stage-sites-build.mjs`
- Modify: `apps/web/package.json`
- Modify: `apps/web/vite.config.ts`
- Modify: `apps/web/index.html`
- Test: hosting layout, worker entry, metadata, and Vite config tests

**Interfaces:**

- Produces: Pages `dist/_worker.js` and Sites `dist/server/index.js`.
- Uses: `API_BASE_URL` override or the production Worker URL.
- Produces: explicit `react`, `pixi`, and `prototypes` code-splitting groups.

- [x] Add tests for the default API upstream, Pages `_worker.js`, Guild metadata, and chunk groups;
      verify RED.
- [x] Implement the smallest hosting/build/config changes and verify focused GREEN.
- [x] Run the production build and assert every emitted JavaScript file is below 500 kB.
- [x] Commit `fix: harden production web delivery`.

### Task 4: Release Gate and Deployment

- [ ] Review the consolidated diff against this spec and keep protected user files unstaged.
- [ ] Run `pnpm check` and one focused follow-up only if a batch-related failure is fixed.
- [ ] Browser-test guild, playback, rewards, replay, mobile width, and console output.
- [ ] Push the default branch, deploy the API Worker, then deploy exact committed Web assets.
- [ ] Verify Worker `/health`, Pages `/api/health`, canonical/immutable URLs, source commit, and live
      bundle hashes.
