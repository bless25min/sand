# Cocos Full Guild RPG Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` inline. Project policy
> prohibits subagent-driven development unless the user explicitly requests delegation.

**Goal:** Replace the battle-only Cocos slice with the complete persistent Guild RPG player loop.

**Architecture:** Extract the React application state machine into `guild-session-core`, bundle it
into Cocos, and render every state through a fixed-screen Cocos shell. Simulation remains the only
authority for outcomes.

**Tech Stack:** TypeScript 6, Vitest 4, Cocos Creator 3.8.8, Playwright 1.61, Cloudflare Pages.

## Global Constraints

- Preserve dirty `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- No DOM/React dependency, `Math.random`, paid runtime, duplicated battle rules or scrolling shell.
- Use RED-GREEN TDD per player-visible batch and one consolidated review per batch.
- All 34 session actions and the full guild-to-reload loop must be covered before completion.

---

### Task 1: Shared Session, Save and Cocos Controller

**Files:** Create `packages/guild-session-core/src/{state,reducer,save,preferences,tutorial}.ts` and
tests; modify `apps/web/src/guild-rpg/state/*`, `scripts/cocos-runtime-entry.ts`,
`apps/game-client-cocos/assets/scripts/bootstrap/GameBootstrap.ts`.

**Produces:** `createGuildSession()`, `reduceGuildSession(state, action)`,
`loadGuildSession(port)`, `storeGuildSession(port, state)`, `GuildGameController.dispatch(action)`.

- [ ] Add a failing contract test enumerating all 34 actions and save migration/reload.
- [ ] Run the focused test and confirm missing package/API failures.
- [ ] Extract the pure state machine; make React import it; run parity tests green.
- [ ] Bundle it into Cocos and connect one persistent controller.
- [ ] Verify new game, existing v5 save and corrupt-save recovery.

### Task 2: Guild Shell, Quest and Party

**Files:** Create Cocos `guild/{GuildScene,GuildNav,QuestPage,PartyPage,DetailSheet}.ts` plus
`packages/presentation-core/src/guild-shell.ts` and tests.

- [ ] Add failing models for four destinations, four zones, locks, records, challenges, ascensions,
      six selected heroes and default-order moves at mobile/desktop sizes.
- [ ] Implement the fixed shell and model bindings; keep every action visible without page scroll.
- [ ] E2E: load guild, inspect quest, select ascension, reorder party and start a hunt.

### Task 3: Skills and Fusion

**Files:** Create Cocos `guild/{SkillsPage,SkillLoadout,SkillLibrary,FusionWorkbench}.ts` and pure
collection view models/tests.

- [ ] Add failing tests for hero→six slots→filtered inventory→equip→next hero.
- [ ] Add failing tests for select 2-3 skills, fuse, reorder/replace components and dismantle.
- [ ] Implement compact list plus detail sheet and confirm destructive dismantle.
- [ ] E2E all skill actions and verify persisted/reloaded loadouts.

### Task 4: Equipment, Forge and Salvage

**Files:** Create Cocos `guild/{EquipmentPage,EquipmentInventory,ForgeSheet}.ts` and comparison
view models/tests.

- [ ] Add failing tests for three slots, six-item pages, comparison, equip and hero switching.
- [ ] Add failing tests for forge previews/actions, core lock/transplant, flags and batch salvage.
- [ ] Implement list/detail/confirmation flows; E2E every equipment action and reload.

### Task 5: Battle, Rewards, Tutorial and Preferences Parity

**Files:** Modify Cocos battle/reward scripts; create `settings/{SettingsSheet,TutorialCoach}.ts`.

- [ ] Add failing tests for reset/carry/abandon/defeat and reward equip/keep/routes/replay.
- [ ] Connect battle/rewards to session dispatch instead of local temporary state.
- [ ] Implement tutorial focus steps and audio/haptics/motion persistence.
- [ ] E2E first hunt through reward, forge, skill, replay and tutorial completion.

### Task 6: Completion Audit and Production Release

- [ ] Run an action-by-action parity matrix; zero missing or indirect-only items.
- [ ] Run focused tests, consolidated review fixes, then `pnpm check`.
- [ ] Build Web Mobile/Desktop and Windows; run full E2E and Windows smoke.
- [ ] Verify ports/processes close, commit/push, deploy Pages Production and inspect live behavior.
