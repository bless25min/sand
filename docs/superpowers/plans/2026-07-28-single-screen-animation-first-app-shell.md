# Single-Screen Animation-First App Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make battle and guild workflows directly operable inside a fixed mobile
viewport, with battlefield unit selection and animation-first feedback replacing
duplicated cards and explanatory text.

**Architecture:** Keep every outcome in `simulation-core`. Project the existing battle
scene positions into transparent React hit targets over the Pixi stage, and use focused
React paging/state for dense guild collections. Scope the new layout under explicit
single-screen data attributes so desktop and fallback behavior remain testable.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, CSS, Vitest, Playwright, Vite.

## Global Constraints

- Authority: `docs/superpowers/specs/2026-07-28-single-screen-animation-first-app-shell-design.md`.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- No `Math.random`, battle outcomes in React, duplicated visible unit cards, or page scroll.
- Default visible copy is limited to names, two-character skill labels and necessary values.
- Direct TDD: observe RED, implement GREEN, run affected tests, then one full gate and E2E.
- Use `scripts/run-e2e.mjs`; never detach Vite with `Start-Process` or raw process handles.

---

### Task 1: Battlefield-as-controller combat shell

**Files:**
- Create: `apps/web/src/guild-rpg/components/BattlefieldUnitControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/guild-combat.css`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

**Interfaces:**
- Consumes: `GuildCombatScene.units`, `SELECT_TARGET`, `CHOOSE_NEXT_HERO`, `USE_SKILL`.
- Produces: visible `[data-battle-unit]` controls aligned by scene `x/y`, six
  `[data-relay-energy]` indicators, and `.gr-battle[data-shell="single-screen"]`.

- [ ] Add RED component assertions that the separate target/order/log surfaces are absent,
  six hero and three enemy hit targets exist, skill copy is abbreviated, and semantic
  labels retain full details.
- [ ] Run
  `.\node_modules\.bin\vitest.cmd run apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`
  and confirm failure is caused by missing direct-unit controls and shell attributes.
- [ ] Implement `BattlefieldUnitControls` with percentage positions:

```tsx
style={{ left: `${(unit.x / scene.width) * 100}%`, top: `${(unit.y / scene.height) * 100}%` }}
```

- [ ] Replace `TurnOrderRail`, target rack, formation rail and visible combat log with
  scene-aligned controls; dispatch enemy taps to `SELECT_TARGET` and unacted hero taps to
  `CHOOSE_NEXT_HERO`.
- [ ] Reduce the dock to selected actor/target names plus 2×3 abbreviated skill buttons;
  preserve immediate cast and expose full skill information only through an info control.
- [ ] Replace visible impact headline/detail and textual relay count with number/shape effects
  plus six energy segments; retain the same detail in an off-screen `aria-live` region.
- [ ] Add scoped `100dvh` CSS: battlefield fills the first grid row, dock fills the second,
  header/menu overlays the battlefield, visible status copy is screen-reader-only, and
  body/document do not scroll while battle is mounted.
- [ ] Verify Reduced Motion keeps targeted/current/next outlines, HP changes and energy
  segments while removing long displacement, shake and flashing.
- [ ] Re-run the focused test and keep it green.

### Task 2: Fixed guild pages and paged dense collections

**Files:**
- Modify: `apps/web/src/guild-rpg/GuildRpgApp.tsx`
- Modify: `apps/web/src/guild-rpg/components/GuildScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/QuestBoard.tsx`
- Modify: `apps/web/src/guild-rpg/components/TeamOrderPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/SkillLoadoutPanel.tsx`
- Modify: `apps/web/src/guild-rpg/components/EquipmentWorkbench.tsx`
- Modify: `apps/web/src/guild-rpg/guild-interface.css`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

**Interfaces:**
- Consumes: existing selected zone, hero, slot and inventory state.
- Produces: `.gr-shell[data-shell="single-screen"]`, page-local previous/next controls,
  at most six visible library items, and details collapsed by default.

- [ ] Add RED assertions for the single-screen guild shell, collapsed coach/checklist,
  quest paging, six-item skill/equipment windows and fixed bottom navigation.
- [ ] Run the focused component test and confirm the new shell/paging expectations fail.
- [ ] Keep top resources compact, move coach/checklist behind a details control, and make
  the selected page the only flexible-height content region.
- [ ] Show one selected hunt at a time; retain the four zone controls and direct start action.
- [ ] Page skill and equipment libraries in groups of six using local bounded indices;
  reset the index when filters, hero, slot or page changes.
- [ ] Add scoped mobile CSS for fixed `100dvh`, 2×3 grids, clipped summaries, 44px targets,
  fixed navigation and no document-level scroll.
- [ ] Re-run the focused component test and keep it green.

### Task 3: Reward carousel and release verification

**Files:**
- Modify: `apps/web/src/guild-rpg/components/RewardScreen.tsx`
- Modify: `apps/web/src/guild-rpg/guild-rewards.css`
- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`

**Interfaces:**
- Consumes: existing equipment and skill rewards.
- Produces: fixed `.gr-rewards[data-shell="single-screen"]`, one visible drop at a time,
  `[data-loot-page]` controls and full accessible reward semantics.

- [ ] Add RED E2E geometry checks:

```ts
expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight)).toBe(true);
```

- [ ] Add RED workflow checks for enemy/hero battlefield taps, six energy segments, immediate
  casts, one visible reward and usable guild pages at 375×667, 390×844 and 430×932.
- [ ] Implement reward previous/next paging without changing reward ownership or collection.
- [ ] Run focused component/presentation tests and format only affected files.
- [ ] Run one `pnpm check`; fix only findings caused by this batch.
- [ ] Run `node scripts/run-e2e.mjs apps/web/e2e/guild-rpg-release.spec.ts`; verify the
  runner closes its server, then confirm ports 4173 and 5175 have no listeners.
- [ ] Perform one consolidated diff review, one focused follow-up if needed, commit, push,
  deploy the exact commit to `ai-expedition-legion-rpg`, and verify the production render.
