# Direct Battlefield Skill Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to
> implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let players inspect exact character, enemy and skill numbers, preview an
unchanging simulated outcome, then cast by tapping a target or the armed skill again.

**Architecture:** `simulation-core` remains the only outcome owner and exposes a pure
preview built from `resolveSkill`. React owns only the armed-skill intent and projects
the preview into the command dock and scene. Pixi is the single visible unit HUD; React
unit controls remain transparent except during renderer fallback.

**Tech Stack:** TypeScript 6, React 19, PixiJS 8, CSS, Vitest, Playwright, Vite.

## Global Constraints

- Authority: `docs/superpowers/specs/2026-07-28-direct-battlefield-skill-preview-design.md`.
- Preserve modified `AGENTS.md` and `docs/AI_DEVELOPMENT_SPEC.md`.
- No `Math.random`, duplicated damage formula, visible React unit cards or page scroll.
- One player-visible batch, direct TDD, affected tests first, `pnpm check` once at completion.
- Use `scripts/run-e2e.mjs`; never detach Vite/preview with unmanaged processes.

---

### Task 1: Exact simulation-owned outcome preview

**Files:**
- Create: `packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.ts`
- Create: `packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.test.ts`
- Modify: `packages/simulation-core/src/guild-rpg/skills/resolve-skill.ts`
- Modify: `packages/simulation-core/src/guild-rpg/index.ts`

**Interfaces:**
- Produces `previewSkillOutcome(input: ResolveSkillInput): SkillOutcomePreview`.
- `SkillOutcomePreview` includes unchanged `events`, `totalDamage`, `totalHealing`,
  `overkill`, and per-unit before/after HP, statuses, defense reduction and strengthen.

- [ ] Add RED tests proving preview equals `resolveSkill`, preserves input, separates
  per-target damage, and records HP/status/defense/strength deltas:

```ts
const before = structuredClone(battle);
const preview = previewSkillOutcome({ battle, actorId, skillId, targetId, content });
const resolved = resolveSkill({ battle, actorId, skillId, targetId, content });
expect(preview.events).toEqual(resolved.events);
expect(battle).toEqual(before);
expect(preview.units.find(({ id }) => id === targetId)).toMatchObject({
  beforeHp: 500, afterHp: resolved.battle.units.find(({ id }) => id === targetId)!.currentHp,
});
```

- [ ] Run
  `.\node_modules\.bin\vitest.cmd run packages/simulation-core/src/guild-rpg/skills/preview-skill-outcome.test.ts`
  and confirm RED because the preview API is absent.
- [ ] Export `ResolveSkillInput` from `resolve-skill.ts`; implement the preview by invoking
  that exact resolver once, grouping real events and diffing units without mutation:

```ts
export function previewSkillOutcome(input: ResolveSkillInput): SkillOutcomePreview {
  const resolved = resolveSkill(input);
  return summarizeSkillOutcome(input.battle, resolved.battle, resolved.events);
}
```

- [ ] Re-run the focused test and `trigger-matrix.test.ts`; keep both green.

### Task 2: Armed skill interaction and numeric command dock

**Files:**
- Create: `apps/web/src/guild-rpg/state/create-skill-engine-content.ts`
- Create: `apps/web/src/guild-rpg/presentation/skill-command-intent.ts`
- Create: `apps/web/src/guild-rpg/presentation/skill-command-intent.test.ts`
- Modify: `apps/web/src/guild-rpg/state/game-reducer.ts`
- Modify: `apps/web/src/guild-rpg/components/BattleScreen.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattleCommandDock.tsx`
- Modify: `apps/web/src/guild-rpg/components/SixSkillControls.tsx`
- Modify: `apps/web/src/guild-rpg/components/BattlefieldUnitControls.tsx`
- Test: `apps/web/src/guild-rpg/components/deterministic-six-hero-flow.test.tsx`

**Interfaces:**
- `chooseSkillIntent(armedSkillId, skillId, targetId)` returns arm or cast.
- `chooseTargetIntent(armedSkillId, targetId)` returns select or cast.
- `BattleScreen` owns `armedSkillId`; reducer still receives only existing actions.

- [ ] Add RED intent tests:

```ts
expect(chooseSkillIntent(undefined, 'fire', 'wolf')).toEqual({ arm: 'fire' });
expect(chooseSkillIntent('fire', 'fire', 'wolf')).toEqual({
  cast: { skillId: 'fire', targetId: 'wolf' },
});
expect(chooseTargetIntent('fire', 'guard')).toEqual({
  cast: { skillId: 'fire', targetId: 'guard' },
});
```

- [ ] Add RED component assertions for actual skill names and values, one expanded
  `[data-skill-preview]`, exact total damage, no `.gr-skill-info`, and transparent unit
  semantics; run both focused files and confirm expected failures.
- [ ] Extract the reducer's engine-content factory, use it in `BattleScreen`, compute the
  preview with `previewSkillOutcome`, and clear armed state after actor change/cast/victory.
- [ ] Replace immediate skill dispatch with arm/same-skill cast; make enemy taps select
  without an armed skill and cast with one. Keep hero taps as order changes.
- [ ] Render compact cards such as `威力 +8 · 3擊 · 燃 +2`; when armed, replace the
  redundant actor-arrow-target row with exact formula, hit count, trigger additions,
  total damage, target `HP before → after`, status/defense/strength deltas.
- [ ] Re-run the focused intent/component tests and keep them green.

### Task 3: Single visual HUD, battlefield preview and release

**Files:**
- Create: `packages/pixi-renderer/src/guild-combat/combat-unit-hud.ts`
- Create: `packages/pixi-renderer/src/guild-combat/combat-unit-hud.test.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/contracts.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/draw-units.ts`
- Modify: `packages/pixi-renderer/src/guild-combat/mount-guild-combat-stage.ts`
- Modify: `apps/web/src/guild-rpg/presentation/battle-scene.ts`
- Modify: `apps/web/src/guild-rpg/components/CombatBattlefield.tsx`
- Modify: `apps/web/src/guild-rpg/guild-combat.css`
- Modify: `apps/web/e2e/guild-rpg-release.spec.ts`

**Interfaces:**
- Scene units gain current/max HP, active attack/strengthen, effective defense/weaken and
  optional preview HP/status fields; scene preview carries element and target route.
- `createCombatUnitHud(unit)` produces the only visible unit labels and preview values.

- [ ] Add RED renderer tests for `HP 136 / 175`, active attack, target defense, projected
  HP/status and no duplicate React labels. Add RED E2E for first tap not casting, enemy
  tap casting, same-skill fast cast, exact preview matching post-cast HP, and 375/390/430
  geometry without overlap or scroll.
- [ ] Run renderer/component tests and one focused E2E through
  `node scripts/run-e2e.mjs apps/web/e2e/guild-rpg-release.spec.ts`; confirm RED.
- [ ] Move visible identity, HP values, statuses, selected/current/next styling and
  preview HP into Pixi. Make React hit targets transparent and show fallback labels only
  when `data-render-error="true"`.
- [ ] Draw projected HP as a striped ghost segment, status/defense/strength before→after
  near the affected unit, and preview target routes without covering the attack corridor.
- [ ] Compact the quest header, reserve the relay rail, keep 2×3 skills inside `100dvh`,
  fix local selector specificity, and remove detached info circles/card borders.
- [ ] Run affected tests, format only changed files, then run `pnpm.cmd check` once.
- [ ] Run release E2E at 375×667, 390×844, 430×932 and 1280px; verify the managed runner
  closes ports 4173/5175. Perform one consolidated diff review and one focused follow-up.
- [ ] Commit, push `codex/project-expedition-mvp`, deploy `apps/web/dist` to Cloudflare
  Pages project `ai-expedition-legion-rpg` production, verify deployment source equals
  the commit and `https://ai-expedition-legion-rpg.pages.dev` returns HTTP 200.
