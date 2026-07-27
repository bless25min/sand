# Project Expedition Formal v1 Cumulative Completion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.
> This is one cumulative player-visible batch; checkboxes track the same playable
> path rather than independent vertical slices.

**Goal:** Raise the existing six-hero loot RPG from functional systems to a
cohesive release candidate without resetting any already-working capability.

**Architecture:** Preserve deterministic outcomes in `simulation-core` and
authored content in `game-data`. Add a web-only `VisualEvent` projection and
PixiJS stage, then layer accessible React HUD, guild workflows, onboarding,
audio, responsive behavior, and release evidence around the same game state.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, CSS, Vitest, Playwright, Vite.

## Global Constraints

- Authority: `docs/superpowers/specs/2026-07-27-formal-v1-cumulative-completion-design.md`.
- Preserve user edits in `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- No `Math.random`, battle outcome in React, hidden multipliers, draw pile, or CSS-only fake battle.
- Direct TDD: observe RED, implement GREEN, run affected tests; one full `pnpm check` and E2E at end.
- One consolidated review and one focused follow-up verification; no helper-level review loops.

---

### Task 1: Semantic battle presentation and responsive HUD

**Files:** create `presentation/visual-events.ts`, `presentation/battle-scene.ts`,
`components/PixiCombatStage.tsx`, `components/BattleHud.tsx`; modify playback,
`BattleScreen`, command controls and focused CSS; test beside presentation and components.

**Produces:** `projectVisualEvents(events, context): readonly VisualEvent[]`,
`createBattleScene(battle, visualEvent, context): BattleScene`, and a stage that
renders formations, projectiles, particles, numbers, statuses, camera accents and finishers.

- [ ] Add RED tests for event semantics, six escalating relay tiers, stable scene
      positions, immediate feedback, details collapsed by default and 375px HUD geometry.
- [ ] Run focused presentation/component tests and confirm failures are missing behavior.
- [ ] Implement the projection, Pixi mount/update/destroy lifecycle, React HUD,
      2×3 skills, portrait order control, settings and accessible live status.
- [ ] Re-run focused tests; keep regular playback under 1.8s and finisher under 3.5s.

### Task 2: Complete six-hero, enemy, zone and spectacle language

**Files:** create focused visual catalogs under `presentation/catalogs/`; modify
Pixi stage and game-data campaign labels only where authored differentiation is absent.

**Produces:** typed visual identities for 6 heroes, 18 enemies, 6 bosses, 4 zones,
3 elements, 3 reactions and 6 specializations; every authored ID has a visual entry.

- [ ] Add RED catalog coverage tests for exact IDs and distinct zone/boss signatures.
- [ ] Run focused catalog tests and confirm uncovered authored IDs fail.
- [ ] Implement silhouettes, palettes, weapon trails, weather, boss frames, layered
      audio cues and per-event particles; single-target bounce visibly returns to target.
- [ ] Re-run catalog and combat presentation tests.

### Task 3: Readable mission, party, skill and equipment workflows

**Files:** split focused view-models/components from `GuildScreen`, `QuestBoard`,
`TeamOrderPanel`, `SkillLoadoutPanel`, `SkillFusionWorkbench`,
`EquipmentWorkbench`, `RewardScreen`; add workflow tests and focused CSS.

**Produces:** persistent four-page navigation, hero-first selection, six visible
skill slots, staged skill/equipment comparison, chain preview, readable forge,
loot reveal and one-click next actions without removing advanced controls.

- [ ] Add RED tests for six-hero selection, auto-advance configuration, filters,
      equip/forge/fuse feedback, reward recommendations and no text-wall defaults.
- [ ] Run focused reducer/component tests and confirm failures.
- [ ] Implement progressive disclosure, concise summaries, badges, compare panels,
      safe drawers/dialogs, batch inventory actions and useful empty/error states.
- [ ] Re-run focused workflow tests.

### Task 4: Complete first-session and long-term play path

**Files:** modify onboarding coach/state, quest progress/reward view models,
save safety and release E2E.

**Produces:** action-driven first hunt through replay, optional replayable coach,
four-zone progress, target-farm hints, safe refresh/withdrawal and reachable postgame loop.

- [ ] Add RED reducer/E2E fixtures for fresh save, v3 migration, six relays, reward,
      equipment, forge, fusion, replay, unlock progression and duplicate-reward safety.
- [ ] Run focused reducer/storage tests and confirm failures.
- [ ] Implement missing transitions, contextual hints, recovery actions and campaign
      progress feedback without locking normal navigation behind the coach.
- [ ] Re-run focused onboarding/storage tests.

### Task 5: Quality and release-candidate gate

- [ ] Audit the approved spec line by line against source and tests; repair only
      actual gaps, then review the cumulative diff once for outcome ownership, dead ends,
      mobile overlap, accessibility, asset lifecycle, stale UI and unrelated changes.
- [ ] Run one full `pnpm check`; all type, lint, format, architecture, dead-code,
      unit and build gates must exit 0.
- [ ] Run one `pnpm test:e2e`; cover fresh/migrated saves and 375×667, 390×844,
      430px and desktop with no crop, overlay, horizontal overflow or console error.
- [ ] Run a focused follow-up only if consolidated review or E2E finds a defect,
      then report changed, verified and any externally unverifiable release condition.
