# Execution Climax Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn early enemy elimination into a readable sixth-relay execution climax, preserve combat truth, and hand the player directly into loot and replay.

**Architecture:** `simulation-core` owns execution-window detection and skips meaningless corpse hits while preserving additive relay/OVERKILL events. React projects execution semantics and safe causal copy; Pixi renders a broken target state. Playback merges low-priority support into decisive beats without losing source event IDs.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, Vitest 4, Playwright 1.61, Vite 8, Cloudflare Pages.

## Global Constraints

- One player-visible batch; direct TDD, one consolidated review, one final `pnpm.cmd check`.
- No new skills, triggers, balance multiplication, randomness, characters, enemies, or quests.
- Mobile remains one `100dvh` screen with no overlap or page scrolling.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- Use `scripts/run-e2e.mjs`; never detach Vite and always verify port 4173 closes.

---

## File Map

- Create `packages/simulation-core/src/guild-rpg/battle/is-execution-window.ts`: authoritative execution predicate.
- Modify `resolve-skill.ts` and `preview-skill-outcome.ts`: convert corpse hits to finisher/OVERKILL semantics.
- Modify simulation tests: early-kill and exact preview coverage.
- Modify `combat-beats.ts`: safe labels and decisive-beat priority merging.
- Modify `BattleScreen.tsx`, `BattleCommandDock.tsx`, `BattleFocusHud.tsx`, `CombatBattlefield.tsx`: execution interaction.
- Modify `battle-scene.ts`, Pixi contracts/drawing, and tests: broken target state.
- Modify `skill-tile-presentation.ts`, skill controls/preview panel, and tests: execution cards.
- Modify `guild-combat.css` and release E2E: single-screen climax, loot, replay.

### Task 1: Authoritative execution window

- [ ] Add failing simulation tests: all enemies at 0 with five acted heroes is an execution window; sixth cast emits no ordinary corpse damage/status and ends with finisher then victory.
- [ ] Run focused simulation tests and verify failure because execution semantics are absent.
- [ ] Implement `isExecutionWindow(battle)` and export it.
- [ ] In `resolveSkill`, skip normal component/passive delivery only when already in execution; keep additive relay OVERKILL, finisher element/specialization, round order, history, and victory.
- [ ] Extend preview with `executionWindow`, `finisherPower`, and `relayEchoes`; use the same resolved events.
- [ ] Rerun focused simulation tests and require PASS.

### Task 2: Decisive playback

- [ ] Add failing beat tests requiring safe labels and merging passive/strengthen/healing into the nearest defeat/overkill/finisher/victory beat while preserving every source event ID.
- [ ] Run beat tests and verify the raw message and standalone support beat failure.
- [ ] Add a presentation priority map and merge only secondary visual beats when a decisive beat exists.
- [ ] Generate labels from visual headline and signed number, never `event.message`.
- [ ] Remove event-count/raw-detail screen-reader output from battlefield components.
- [ ] Rerun beat/component tests and require PASS.

### Task 3: Execution presentation

- [ ] Add failing presentation tests: execution skills show `處刑40`, `回收5次`, and `第六棒✓ → 全軍終結`; focus HUD shows `破勢 → 處刑`.
- [ ] Add failing battle-scene/Pixi tests: 0 HP enemies use `broken`, not `defeated`, during execution.
- [ ] Run affected tests and verify failure.
- [ ] Pass execution state from `BattleScreen` through command, battlefield, preview, scene, and skill tile presentation.
- [ ] Render the broken pose, execution sigil, pulsing relay energy, darkened command dock, and selected elemental finisher style.
- [ ] Keep six skills tappable; second tap casts without retargeting.
- [ ] Rerun affected tests and require PASS.

### Task 4: Integrated loop and release

- [ ] Extend release E2E to assert early kill → execution window → sixth finisher → victory → loot → replay, no raw trigger IDs, no overlap, and no `總傷0`.
- [ ] Run affected tests and perform one consolidated diff review; fix only findings inside this player outcome.
- [ ] Run `pnpm.cmd check` and require all gates to pass.
- [ ] Run managed E2E across the release viewports; verify port 4173 closes.
- [ ] Commit intended files, push `codex/project-expedition-mvp`, deploy exact commit to Cloudflare Pages, and verify canonical mobile interaction/console/HTTP.
